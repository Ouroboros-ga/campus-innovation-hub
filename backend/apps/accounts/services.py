from django.db import IntegrityError, transaction

from apps.audit.services import record_audit
from apps.accounts.models import User, UserProfile
from apps.domain_errors import PermissionDenied


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
