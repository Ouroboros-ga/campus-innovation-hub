"""活动报名、取消与运营状态机的事务边界。"""

from typing import Any

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.activities.models import Activity, Registration
from apps.audit.services import record_audit
from apps.content.models import Announcement
from apps.domain_errors import CapacityFull, InvalidState, PermissionDenied, PublicationIncomplete, TimeWindowClosed
from apps.notifications.models import Notification
from apps.notifications.services import create_notification
from apps.permissions import is_operator


def _assert_registration_window(activity: Activity, now: object) -> None:
    if activity.publication_state != Activity.PublicationState.PUBLISHED:
        raise TimeWindowClosed("活动当前不能报名。")
    if not activity.registration_required:
        raise TimeWindowClosed("该活动不需要报名。")
    if activity.registration_start_at and now < activity.registration_start_at:
        raise TimeWindowClosed
    if activity.registration_end_at and now > activity.registration_end_at:
        raise TimeWindowClosed


@transaction.atomic
def register_activity(*, actor: User, activity: Activity) -> Registration:
    """锁定 Activity 后检查容量，并复用用户已有的取消报名记录。"""

    locked_activity = Activity.objects.select_for_update().get(pk=activity.pk)
    now = timezone.now()
    _assert_registration_window(locked_activity, now)
    registration = Registration.objects.select_for_update().filter(activity=locked_activity, user=actor).first()
    if registration is not None and registration.status == Registration.Status.REGISTERED:
        raise InvalidState("你已报名该活动。")

    registered_count = Registration.objects.filter(activity=locked_activity, status=Registration.Status.REGISTERED).count()
    if locked_activity.capacity is not None and registered_count >= locked_activity.capacity:
        raise CapacityFull

    profile = getattr(actor, "profile", None)
    if registration is None:
        registration = Registration.objects.create(
            activity=locked_activity,
            user=actor,
            status=Registration.Status.REGISTERED,
            name_snapshot=actor.real_name,
            student_no_snapshot=actor.student_no or "",
            class_name_snapshot=profile.class_name if profile else None,
            major_snapshot=profile.major if profile else None,
            grade_snapshot=profile.grade if profile else None,
        )
        audit_action = "ACTIVITY_REGISTRATION_CREATED"
    else:
        registration.status = Registration.Status.REGISTERED
        registration.name_snapshot = actor.real_name
        registration.student_no_snapshot = actor.student_no or ""
        registration.class_name_snapshot = profile.class_name if profile else None
        registration.major_snapshot = profile.major if profile else None
        registration.grade_snapshot = profile.grade if profile else None
        registration.registered_at = now
        registration.cancelled_at = None
        registration.save(
            update_fields=[
                "status",
                "name_snapshot",
                "student_no_snapshot",
                "class_name_snapshot",
                "major_snapshot",
                "grade_snapshot",
                "registered_at",
                "cancelled_at",
                "updated_at",
            ]
        )
        audit_action = "ACTIVITY_REGISTRATION_REACTIVATED"
    record_audit(
        actor=actor,
        action=audit_action,
        target=registration,
        changes={"status": {"to": Registration.Status.REGISTERED}},
    )
    return registration


@transaction.atomic
def cancel_activity_registration(*, actor: User, registration: Registration) -> Registration:
    basis = Registration.objects.only("id", "activity_id").get(pk=registration.pk)
    Activity.objects.select_for_update().get(pk=basis.activity_id)
    locked_registration = Registration.objects.select_for_update().get(pk=basis.pk)
    if locked_registration.user_id != actor.id:
        raise PermissionDenied
    if locked_registration.status != Registration.Status.REGISTERED:
        raise InvalidState
    locked_registration.status = Registration.Status.CANCELLED
    locked_registration.cancelled_at = timezone.now()
    locked_registration.save(update_fields=["status", "cancelled_at", "updated_at"])
    record_audit(
        actor=actor,
        action="ACTIVITY_REGISTRATION_CANCELLED",
        target=locked_registration,
        changes={"status": {"from": Registration.Status.REGISTERED, "to": Registration.Status.CANCELLED}},
    )
    return locked_registration


def _require_operator(actor: User) -> None:
    if not is_operator(actor):
        raise PermissionDenied


@transaction.atomic
def create_activity(*, actor: User, payload: dict[str, Any]) -> Activity:
    _require_operator(actor)
    values = dict(payload)
    if "organizer_organization_id" in values:
        values["organizer_organization_id"] = values.pop("organizer_organization_id")
    if "cover_asset_id" in values:
        values["cover_asset_id"] = values.pop("cover_asset_id")
    activity = Activity.objects.create(
        **values,
        publication_state=Activity.PublicationState.DRAFT,
        created_by=actor,
        updated_by=actor,
    )
    record_audit(actor=actor, action="ACTIVITY_CREATED", target=activity, changes={"publication_state": "DRAFT"})
    return activity


@transaction.atomic
def update_activity(*, actor: User, activity: Activity, payload: dict[str, Any]) -> Activity:
    _require_operator(actor)
    locked = Activity.objects.select_for_update().get(pk=activity.pk)
    values = dict(payload)
    if "organizer_organization_id" in values:
        values["organizer_organization_id"] = values.pop("organizer_organization_id")
    if "cover_asset_id" in values:
        values["cover_asset_id"] = values.pop("cover_asset_id")
    capacity = values.get("capacity", locked.capacity)
    registered_count = Registration.objects.filter(activity=locked, status=Registration.Status.REGISTERED).count()
    if capacity is not None and capacity < registered_count:
        raise CapacityFull("容量不能小于已报名人数。")
    for field, value in values.items():
        setattr(locked, field, value)
    locked.updated_by = actor
    locked.full_clean()
    locked.save(update_fields=[*values.keys(), "updated_by", "updated_at"])
    record_audit(actor=actor, action="ACTIVITY_UPDATED", target=locked, changes={"fields": sorted(values)})
    return locked


@transaction.atomic
def publish_activity(*, actor: User, activity: Activity) -> Activity:
    _require_operator(actor)
    locked = Activity.objects.select_for_update().get(pk=activity.pk)
    if locked.publication_state != Activity.PublicationState.DRAFT:
        raise InvalidState
    try:
        locked.full_clean()
    except DjangoValidationError as error:
        raise PublicationIncomplete from error
    locked.publication_state = Activity.PublicationState.PUBLISHED
    locked.updated_by = actor
    locked.save(update_fields=["publication_state", "updated_by", "updated_at"])
    record_audit(actor=actor, action="ACTIVITY_PUBLISHED", target=locked, changes={"publication_state": "PUBLISHED"})
    return locked


@transaction.atomic
def cancel_activity(*, actor: User, activity: Activity) -> Activity:
    _require_operator(actor)
    locked = Activity.objects.select_for_update().get(pk=activity.pk)
    if locked.publication_state != Activity.PublicationState.PUBLISHED:
        raise InvalidState
    locked.publication_state = Activity.PublicationState.CANCELLED
    locked.updated_by = actor
    locked.save(update_fields=["publication_state", "updated_by", "updated_at"])
    registrations = Registration.objects.select_for_update().filter(activity=locked, status=Registration.Status.REGISTERED).select_related("user")
    for registration in registrations:
        create_notification(
            recipient=registration.user,
            notification_type=Notification.NotificationType.ACTIVITY,
            title="活动已取消",
            body=f"“{locked.title}”已取消，请留意后续安排。",
            action_path=f"/activities/{locked.id}",
            dedupe_key=f"activity:{locked.id}:cancelled:{registration.user_id}",
        )
    record_audit(actor=actor, action="ACTIVITY_CANCELLED", target=locked, changes={"publication_state": "CANCELLED"})
    return locked


@transaction.atomic
def archive_activity(*, actor: User, activity: Activity) -> Activity:
    _require_operator(actor)
    locked = Activity.objects.select_for_update().get(pk=activity.pk)
    if locked.publication_state not in {Activity.PublicationState.PUBLISHED, Activity.PublicationState.CANCELLED}:
        raise InvalidState
    locked.publication_state = Activity.PublicationState.ARCHIVED
    locked.updated_by = actor
    locked.save(update_fields=["publication_state", "updated_by", "updated_at"])
    record_audit(actor=actor, action="ACTIVITY_ARCHIVED", target=locked, changes={"publication_state": "ARCHIVED"})
    return locked


@transaction.atomic
def close_activity_registration(*, actor: User, activity: Activity) -> Activity:
    _require_operator(actor)
    locked = Activity.objects.select_for_update().get(pk=activity.pk)
    current = timezone.now()
    if (
        locked.publication_state != Activity.PublicationState.PUBLISHED
        or not locked.registration_required
        or (locked.registration_start_at is not None and current < locked.registration_start_at)
        or (locked.registration_end_at is not None and current > locked.registration_end_at)
    ):
        raise InvalidState("当前报名不处于开放状态。")
    locked.registration_end_at = current
    locked.updated_by = actor
    locked.save(update_fields=["registration_end_at", "updated_by", "updated_at"])
    record_audit(actor=actor, action="ACTIVITY_REGISTRATION_CLOSED", target=locked, changes={"registration_end_at": "closed"})
    return locked


@transaction.atomic
def set_activity_featured(*, actor: User, activity: Activity, payload: dict[str, Any]) -> Activity:
    _require_operator(actor)
    locked = Activity.objects.select_for_update().get(pk=activity.pk)
    if locked.publication_state != Activity.PublicationState.PUBLISHED:
        raise InvalidState
    locked.is_featured = payload["is_featured"]
    if "featured_order" in payload:
        locked.featured_order = payload["featured_order"]
    locked.updated_by = actor
    locked.save(update_fields=["is_featured", "featured_order", "updated_by", "updated_at"])
    record_audit(
        actor=actor,
        action="ACTIVITY_FEATURED_UPDATED",
        target=locked,
        changes={"is_featured": locked.is_featured, "featured_order": locked.featured_order},
    )
    return locked


@transaction.atomic
def export_activity_registrations(*, actor: User, activity: Activity, status: str | None) -> list[Registration]:
    _require_operator(actor)
    locked = Activity.objects.select_for_update().get(pk=activity.pk)
    registrations = Registration.objects.filter(activity=locked).select_related("user").order_by("registered_at", "id")
    if status is not None:
        registrations = registrations.filter(status=status)
    result = list(registrations)
    record_audit(
        actor=actor,
        action="ACTIVITY_REGISTRATIONS_EXPORTED",
        target=locked,
        changes={"status": status, "count": len(result)},
    )
    return result


@transaction.atomic
def create_activity_with_announcement(
    *, actor: User, activity_payload: dict[str, Any], announcement_payload: dict[str, Any], publish: bool
) -> tuple[Activity, Announcement]:
    """动态组合发布必须以一个事务保存两个实体，公告关联只由服务端注入。"""

    _require_operator(actor)
    activity_values = dict(activity_payload)
    if "organizer_organization_id" in activity_values:
        activity_values["organizer_organization_id"] = activity_values.pop("organizer_organization_id")
    if "cover_asset_id" in activity_values:
        activity_values["cover_asset_id"] = activity_values.pop("cover_asset_id")
    state = Activity.PublicationState.PUBLISHED if publish else Activity.PublicationState.DRAFT
    activity = Activity.objects.create(
        **activity_values,
        publication_state=state,
        created_by=actor,
        updated_by=actor,
    )
    announcement_values = dict(announcement_payload)
    for name in ("competition_id", "activity_id", "organization_id", "recruitment_id"):
        announcement_values.pop(name, None)
    announcement = Announcement.objects.create(
        **announcement_values,
        activity=activity,
        publication_state=Announcement.PublicationState.PUBLISHED if publish else Announcement.PublicationState.DRAFT,
        published_at=timezone.now() if publish else None,
        created_by=actor,
        updated_by=actor,
    )
    record_audit(actor=actor, action="ACTIVITY_CREATED", target=activity, changes={"combined": True, "publication_state": state})
    record_audit(
        actor=actor,
        action="ANNOUNCEMENT_CREATED",
        target=announcement,
        changes={"combined": True, "publication_state": announcement.publication_state, "activity_id": str(activity.id)},
    )
    return activity, announcement
