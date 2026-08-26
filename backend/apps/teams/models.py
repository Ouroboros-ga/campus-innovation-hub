"""组队帖子、岗位与申请模型。"""

from django.conf import settings
from django.core.validators import MaxLengthValidator
from django.db import models
from django.db.models import Q

from apps.competitions.models import Competition
from apps.core.models import UUIDTimestampedModel


class TeamPost(UUIDTimestampedModel):
    class PostType(models.TextChoices):
        TEAM_RECRUITING = "TEAM_RECRUITING", "队伍招募"
        PERSON_LOOKING = "PERSON_LOOKING", "个人找队"

    class Status(models.TextChoices):
        RECRUITING = "RECRUITING", "招募中"
        FULL = "FULL", "已满员"
        CLOSED = "CLOSED", "已关闭"

    class ContactMethod(models.TextChoices):
        WECHAT = "WECHAT", "微信"
        QQ = "QQ", "QQ"
        PHONE = "PHONE", "电话"
        EMAIL = "EMAIL", "邮箱"
        OTHER = "OTHER", "其他"

    competition = models.ForeignKey(Competition, on_delete=models.PROTECT, related_name="team_posts")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="team_posts")
    post_type = models.CharField(max_length=30, choices=PostType.choices)
    title = models.CharField(max_length=120)
    team_name = models.CharField(max_length=100, null=True, blank=True)
    direction = models.CharField(max_length=500)
    members_summary = models.TextField(null=True, blank=True, validators=[MaxLengthValidator(3000)])
    base_member_count = models.SmallIntegerField()
    target_member_count = models.SmallIntegerField()
    goal = models.TextField(null=True, blank=True, validators=[MaxLengthValidator(3000)])
    weekly_commitment = models.CharField(max_length=200, null=True, blank=True)
    contact_method = models.CharField(max_length=20, choices=ContactMethod.choices)
    contact_value = models.CharField(max_length=200)
    notes_md = models.TextField(null=True, blank=True, validators=[MaxLengthValidator(5000)])
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.RECRUITING)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.CheckConstraint(condition=Q(base_member_count__gte=1), name="team_post_base_count_positive"),
            models.CheckConstraint(
                condition=Q(target_member_count__gte=models.F("base_member_count")),
                name="team_post_target_count_valid",
            ),
        ]
        indexes = [
            models.Index(fields=["competition", "status", "created_at"], name="team_post_comp_state_idx"),
            models.Index(fields=["author", "created_at"], name="team_post_author_created_idx"),
            models.Index(fields=["post_type", "status", "created_at"], name="team_post_type_state_idx"),
        ]

    def __str__(self) -> str:
        return self.title


class TeamRole(UUIDTimestampedModel):
    team_post = models.ForeignKey(TeamPost, on_delete=models.PROTECT, related_name="roles")
    name = models.CharField(max_length=60)
    headcount = models.SmallIntegerField()
    requirements = models.CharField(max_length=1000, null=True, blank=True)
    skills = models.CharField(max_length=500, null=True, blank=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["team_post", "name"], name="team_role_name_unique"),
            models.CheckConstraint(condition=Q(headcount__gt=0), name="team_role_headcount_positive"),
            models.CheckConstraint(condition=Q(sort_order__gte=0), name="team_role_sort_nonnegative"),
        ]

    def __str__(self) -> str:
        return self.name


class TeamApplication(UUIDTimestampedModel):
    class Status(models.TextChoices):
        PENDING = "PENDING", "待处理"
        ACCEPTED = "ACCEPTED", "已接受"
        REJECTED = "REJECTED", "已拒绝"
        WITHDRAWN = "WITHDRAWN", "已撤回"

    team_post = models.ForeignKey(TeamPost, on_delete=models.PROTECT, related_name="applications")
    desired_role = models.ForeignKey(TeamRole, null=True, blank=True, on_delete=models.PROTECT, related_name="applications")
    applicant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="team_applications")
    self_intro = models.TextField(validators=[MaxLengthValidator(3000)])
    skills = models.CharField(max_length=1000, null=True, blank=True)
    experience = models.TextField(null=True, blank=True, validators=[MaxLengthValidator(5000)])
    motivation = models.TextField(validators=[MaxLengthValidator(3000)])
    weekly_commitment = models.CharField(max_length=200, null=True, blank=True)
    contact_method = models.CharField(max_length=20, choices=TeamPost.ContactMethod.choices)
    contact_value = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["team_post", "applicant"],
                condition=Q(status__in=["PENDING", "ACCEPTED"]),
                name="team_application_active_unique",
            ),
        ]
        indexes = [
            models.Index(fields=["team_post", "status", "created_at"], name="team_app_post_state_idx"),
            models.Index(fields=["applicant", "created_at"], name="team_app_applicant_created_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.team_post} / {self.applicant}"
