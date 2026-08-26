"""活动报名、取消与容量锁。"""

from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.activities.models import Activity, Registration
from apps.audit.services import record_audit
from apps.domain_errors import CapacityFull, InvalidState, PermissionDenied, TimeWindowClosed


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
    locked_registration = Registration.objects.select_for_update().select_related("activity").get(pk=registration.pk)
    Activity.objects.select_for_update().get(pk=locked_registration.activity_id)
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
