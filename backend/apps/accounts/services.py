from django.db import IntegrityError, transaction

from apps.accounts.models import User, UserProfile


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
