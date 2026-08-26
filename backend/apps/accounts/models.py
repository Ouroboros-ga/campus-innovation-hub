import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q

from apps.core.validation import add_min_length_error


class User(AbstractUser):
    class PlatformRole(models.TextChoices):
        STUDENT = "STUDENT", "学生"
        OPERATOR = "OPERATOR", "运营人员"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student_no = models.CharField(max_length=32, null=True, blank=True)
    real_name = models.CharField(max_length=80)
    platform_role = models.CharField(
        max_length=20,
        choices=PlatformRole.choices,
        default=PlatformRole.STUDENT,
    )

    REQUIRED_FIELDS = ["real_name"]

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["student_no"],
                condition=Q(student_no__isnull=False),
                name="accounts_user_student_no_unique",
            ),
        ]
        indexes = [
            models.Index(
                fields=["platform_role", "is_active"],
                name="accounts_user_role_active_idx",
            ),
        ]


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
    major = models.CharField(max_length=80, null=True, blank=True)
    grade = models.SmallIntegerField(null=True, blank=True)
    class_name = models.CharField(max_length=80, null=True, blank=True)
    bio = models.CharField(max_length=500, null=True, blank=True)
    skills_json = models.JSONField(default=list, blank=True)
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

        if self.avatar_asset_id:
            asset = self.avatar_asset
            if asset.kind != "IMAGE" or asset.status != "ACTIVE":
                errors["avatar_asset"] = "头像必须引用可用的图片 MediaAsset。"
        if errors:
            raise ValidationError(errors)
