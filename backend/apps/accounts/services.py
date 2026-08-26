from typing import Any

from django.db import IntegrityError, transaction

from apps.audit.services import record_audit
from apps.accounts.models import User, UserProfile
from apps.domain_errors import InvalidState, PermissionDenied


class AccountAlreadyExists(Exception):
    """注册标识触发唯一性约束时抛出。"""


def register_pending_user(*, student_no: str, real_name: str, password: str) -> User:
    try:
        with transaction.atomic():
            user = User(
                username=student_no,
                student_no=student_no,
                real_name=real_name,
                platform_role=User.PlatformRole.STUDENT,
                is_active=False,
            )
            user.set_password(password)
            user.save()
            UserProfile.objects.create(user=user)
            return user
    except IntegrityError as error:
        raise AccountAlreadyExists from error


@transaction.atomic
def update_own_profile(*, actor: User, payload: dict[str, Any]) -> UserProfile:
    """只锁定当前用户 Profile，且不接收账户身份或平台权限字段。"""

    profile = UserProfile.objects.select_for_update().get(user=actor)
    changed_fields: list[str] = []
    for field in ("nickname", "avatar_asset_id", "major", "grade", "bio"):
        if field in payload:
            setattr(profile, field, payload[field])
            changed_fields.append(field)
    if "skills" in payload:
        profile.skills_json = payload["skills"]
        changed_fields.append("skills_json")
    profile.save(update_fields=[*changed_fields, "updated_at"])
    return profile


@transaction.atomic
def activate_pending_user(*, actor: User, user: User) -> User:
    """仅超级管理员可启用待审核账号，并留下最小审计证据。"""

    if not actor.is_superuser:
        raise PermissionDenied
    locked_user = User.objects.select_for_update().get(pk=user.pk)
    if locked_user.is_active:
        return locked_user
    locked_user.is_active = True
    locked_user.save(update_fields=["is_active"])
    record_audit(
        actor=actor,
        action="USER_ACTIVATED",
        target=locked_user,
        changes={"is_active": {"from": False, "to": True}},
    )
    return locked_user


@transaction.atomic
def set_platform_role(*, actor: User, user: User, platform_role: str) -> User:
    """平台角色只能由 SUPERADMIN 通过受审计的内部操作改变。"""

    if not actor.is_superuser:
        raise PermissionDenied
    if platform_role not in {User.PlatformRole.STUDENT, User.PlatformRole.OPERATOR}:
        raise ValueError("不支持的平台角色")
    locked_user = User.objects.select_for_update().get(pk=user.pk)
    previous_role = locked_user.platform_role
    if previous_role == platform_role:
        return locked_user
    locked_user.platform_role = platform_role
    locked_user.save(update_fields=["platform_role"])
    record_audit(
        actor=actor,
        action="OPERATOR_GRANTED" if platform_role == User.PlatformRole.OPERATOR else "OPERATOR_REVOKED",
        target=locked_user,
        changes={"platform_role": {"from": previous_role, "to": platform_role}},
    )
    return locked_user


@transaction.atomic
def set_user_active(*, actor: User, user: User, is_active: bool) -> User:
    if not actor.is_superuser:
        raise PermissionDenied
    locked_user = User.objects.select_for_update().get(pk=user.pk)
    if locked_user.is_active == is_active:
        return locked_user
    previous_value = locked_user.is_active
    locked_user.is_active = is_active
    locked_user.save(update_fields=["is_active"])
    record_audit(
        actor=actor,
        action="USER_ACTIVATED" if is_active else "USER_DEACTIVATED",
        target=locked_user,
        changes={"is_active": {"from": previous_value, "to": is_active}},
    )
    return locked_user


@transaction.atomic
def anonymize_deactivated_user(*, actor: User, user: User) -> User:
    """在已确认注销后最小化直接身份字段，保留 UUID 关联的业务历史。"""

    if not actor.is_superuser:
        raise PermissionDenied
    locked_user = User.objects.select_for_update().get(pk=user.pk)
    if locked_user.is_superuser:
        raise PermissionDenied("不能通过普通注销流程匿名化超级管理员。")
    if locked_user.is_active:
        raise InvalidState("账号必须先停用才能匿名化。")

    locked_user.username = f"deactivated-{locked_user.id}"
    locked_user.student_no = None
    locked_user.real_name = "已注销用户"
    locked_user.email = ""
    locked_user.first_name = ""
    locked_user.last_name = ""
    locked_user.platform_role = User.PlatformRole.STUDENT
    locked_user.is_staff = False
    locked_user.set_unusable_password()
    locked_user.save(
        update_fields=[
            "username",
            "student_no",
            "real_name",
            "email",
            "first_name",
            "last_name",
            "platform_role",
            "is_staff",
            "password",
        ]
    )

    profile = UserProfile.objects.select_for_update().filter(user=locked_user).first()
    if profile is not None:
        profile.avatar_asset = None
        profile.nickname = None
        profile.major = None
        profile.grade = None
        profile.class_name = None
        profile.bio = None
        profile.skills_json = []
        profile.save(
            update_fields=[
                "avatar_asset",
                "nickname",
                "major",
                "grade",
                "class_name",
                "bio",
                "skills_json",
                "updated_at",
            ]
        )
    record_audit(
        actor=actor,
        action="USER_ANONYMIZED",
        target=locked_user,
        changes={
            "fields": [
                "username",
                "student_no",
                "real_name",
                "email",
                "profile_identity_fields",
                "password",
            ]
        },
    )
    return locked_user
