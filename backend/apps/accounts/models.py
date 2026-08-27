import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q


class User(AbstractUser):
    class IdentityType(models.TextChoices):
        STUDENT = "STUDENT", "学生"
        TEACHER = "TEACHER", "教师"

    class PlatformRole(models.TextChoices):
        USER = "USER", "普通用户"
        OPERATOR = "OPERATOR", "运营人员"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    identity_type = models.CharField(max_length=20, choices=IdentityType.choices, default=IdentityType.STUDENT)
    student_no = models.CharField(max_length=32, null=True, blank=True)
    employee_no = models.CharField(max_length=32, null=True, blank=True)
    real_name = models.CharField(max_length=80)
    platform_role = models.CharField(
        max_length=20,
        choices=PlatformRole.choices,
        default=PlatformRole.USER,
    )

    REQUIRED_FIELDS = ["real_name"]

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["student_no"],
                condition=Q(student_no__isnull=False),
                name="accounts_user_student_no_unique",
            ),
            models.UniqueConstraint(
                fields=["employee_no"],
                condition=Q(employee_no__isnull=False),
                name="accounts_user_employee_no_unique",
            ),
            models.CheckConstraint(
                condition=(
                    Q(identity_type="STUDENT", student_no__isnull=False, employee_no__isnull=True)
                    | Q(identity_type="TEACHER", employee_no__isnull=False, student_no__isnull=True)
                    | Q(is_active=False)
                ),
                name="accounts_user_identity_no_check",
            ),
        ]
        indexes = [
            models.Index(
                fields=["platform_role", "is_active"],
                name="accounts_user_role_active_idx",
            ),
            models.Index(
                fields=["identity_type", "is_active"],
                name="accounts_user_ident_active_idx",
            ),
        ]

    @classmethod
    def create_teacher(
        cls,
        *,
        username: str,
        employee_no: str,
        real_name: str,
        password: str | None = None,
        public_name: str | None = None,
        is_active: bool = True,
    ) -> "User":
        """受控创建教师账号；调用方需已校验 SUPERADMIN 权限与 public_name。"""
        user = cls(
            username=username,
            identity_type=cls.IdentityType.TEACHER,
            employee_no=employee_no,
            student_no=None,
            real_name=real_name,
            platform_role=cls.PlatformRole.USER,
            is_active=is_active,
        )
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.full_clean()
        user.save()
        profile_kwargs: dict[str, object] = {"user": user}
        if public_name:
            profile_kwargs["public_name"] = public_name
        UserProfile.objects.create(**profile_kwargs)
        return user


class AuthThrottle(models.Model):
    """短期认证节流状态；主体标识只以 HMAC 摘要形式保存。"""

    class Scope(models.TextChoices):
        LOGIN_IP = "LOGIN_IP", "登录来源 IP"
        LOGIN_USERNAME = "LOGIN_USERNAME", "登录用户名"
        REGISTER_IP = "REGISTER_IP", "注册来源 IP"

    scope = models.CharField(max_length=32, choices=Scope.choices)
    subject_digest = models.CharField(max_length=64)
    failure_count = models.PositiveSmallIntegerField(default=0)
    window_started_at = models.DateTimeField()
    blocked_until = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["scope", "subject_digest"],
                name="accounts_auth_throttle_scope_digest_unique",
            ),
        ]
        indexes = [models.Index(fields=["blocked_until"], name="acct_throttle_blocked_idx")]


class UserProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="profile",
    )
    avatar_asset = models.ForeignKey(
        "media.MediaAsset",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="profile_avatars",
    )
    nickname = models.CharField(max_length=40, null=True, blank=True)
    public_name = models.CharField(max_length=80, null=True, blank=True)
    major = models.CharField(max_length=80, null=True, blank=True)
    grade = models.SmallIntegerField(null=True, blank=True)
    class_name = models.CharField(max_length=80, null=True, blank=True)
    department = models.CharField(max_length=120, null=True, blank=True)
    academic_title = models.CharField(max_length=80, null=True, blank=True)
    public_email = models.EmailField(max_length=254, null=True, blank=True)
    office_location = models.CharField(max_length=160, null=True, blank=True)
    bio = models.CharField(max_length=500, null=True, blank=True)
    skills_json = models.JSONField(default=list, blank=True)
    research_interests_json = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(grade__isnull=True) | Q(grade__gte=1, grade__lte=4),
                name="accounts_profile_grade_range",
            ),
        ]

    def clean(self) -> None:
        super().clean()
        errors: dict[str, str] = {}
        skills = self.skills_json
        if not isinstance(skills, list):
            errors["skills_json"] = "技能必须是字符串数组。"
        elif len(skills) > 20:
            errors["skills_json"] = "技能最多保留 20 项。"
        elif any(not isinstance(skill, str) or not skill.strip() for skill in skills):
            errors["skills_json"] = "技能项必须是非空字符串。"
        elif any(len(skill.strip()) > 40 for skill in skills):
            errors["skills_json"] = "每个技能项最多 40 个字符。"
        elif len({skill.strip() for skill in skills}) != len(skills):
            errors["skills_json"] = "技能项不能重复。"

        research = self.research_interests_json
        if not isinstance(research, list):
            errors["research_interests_json"] = "研究方向必须是字符串数组。"
        elif len(research) > 20:
            errors["research_interests_json"] = "研究方向最多保留 20 项。"
        elif any(not isinstance(item, str) or not item.strip() for item in research):
            errors["research_interests_json"] = "研究方向项必须是非空字符串。"
        elif any(len(item.strip()) > 40 for item in research):
            errors["research_interests_json"] = "每个研究方向项最多 40 个字符。"
        elif len({item.strip() for item in research}) != len(research):
            errors["research_interests_json"] = "研究方向项不能重复。"

        if self.avatar_asset_id:
            asset = self.avatar_asset
            if asset.kind != "IMAGE" or asset.status != "ACTIVE":
                errors["avatar_asset"] = "头像必须引用可用的图片 MediaAsset。"
        if errors:
            raise ValidationError(errors)
