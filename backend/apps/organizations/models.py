"""组织、成员关系和招新模型。"""

from django.conf import settings
from django.core.validators import MaxLengthValidator
from django.db import models
from django.db.models import Q

from apps.core.models import UUIDTimestampedModel


class Organization(UUIDTimestampedModel):
    class OrganizationType(models.TextChoices):
        COLLEGE_DEPARTMENT = "COLLEGE_DEPARTMENT", "学院部门"
        STUDENT_CLUB = "STUDENT_CLUB", "学生社团"
        LABORATORY = "LABORATORY", "实验室"
        INNOVATION_TEAM = "INNOVATION_TEAM", "科创团队"
        OTHER = "OTHER", "其他"

    name = models.CharField(max_length=100, unique=True)
    organization_type = models.CharField(max_length=30, choices=OrganizationType.choices)
    short_intro = models.CharField(max_length=200, null=True, blank=True)
    description_md = models.TextField(null=True, blank=True, validators=[MaxLengthValidator(10000)])
    logo_asset = models.ForeignKey(
        "media.MediaAsset", null=True, blank=True, on_delete=models.SET_NULL, related_name="organization_logos"
    )
    banner_asset = models.ForeignKey(
        "media.MediaAsset", null=True, blank=True, on_delete=models.SET_NULL, related_name="organization_banners"
    )
    advisor_name = models.CharField(max_length=100, null=True, blank=True)
    public_contact = models.CharField(max_length=200, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="created_organizations"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="updated_organizations"
    )

    class Meta:
        indexes = [models.Index(fields=["organization_type", "is_active"], name="organization_type_active_idx")]

    def __str__(self) -> str:
        return self.name


class OrganizationMembership(UUIDTimestampedModel):
    class Role(models.TextChoices):
        MEMBER = "MEMBER", "成员"
        LEADER = "LEADER", "负责人"

    organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name="memberships")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="organization_memberships")
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.MEMBER)
    title = models.CharField(max_length=80, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["organization", "user"], name="organization_membership_unique"),
        ]
        indexes = [
            models.Index(fields=["user", "is_active"], name="membership_user_active_idx"),
            models.Index(fields=["organization", "role", "is_active"], name="membership_org_role_active_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.organization} / {self.user}"


class Recruitment(UUIDTimestampedModel):
    class PublicationState(models.TextChoices):
        DRAFT = "DRAFT", "草稿"
        PUBLISHED = "PUBLISHED", "已发布"
        CANCELLED = "CANCELLED", "已取消"
        ARCHIVED = "ARCHIVED", "已归档"

    organization = models.ForeignKey(Organization, on_delete=models.PROTECT, related_name="recruitments")
    title = models.CharField(max_length=120)
    intro_md = models.TextField(validators=[MaxLengthValidator(10000)])
    apply_start_at = models.DateTimeField(null=True, blank=True)
    apply_end_at = models.DateTimeField()
    target_grade_min = models.SmallIntegerField(null=True, blank=True)
    target_grade_max = models.SmallIntegerField(null=True, blank=True)
    notes_md = models.TextField(null=True, blank=True, validators=[MaxLengthValidator(5000)])
    publication_state = models.CharField(max_length=20, choices=PublicationState.choices, default=PublicationState.DRAFT)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_recruitments")
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="updated_recruitments")

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(apply_start_at__isnull=True) | Q(apply_start_at__lte=models.F("apply_end_at")),
                name="recruitment_apply_window_valid",
            ),
            models.CheckConstraint(
                condition=Q(target_grade_min__isnull=True) | Q(target_grade_min__gte=1, target_grade_min__lte=4),
                name="recruitment_grade_min_range",
            ),
            models.CheckConstraint(
                condition=Q(target_grade_max__isnull=True) | Q(target_grade_max__gte=1, target_grade_max__lte=4),
                name="recruitment_grade_max_range",
            ),
            models.CheckConstraint(
                condition=Q(target_grade_min__isnull=True)
                | Q(target_grade_max__isnull=True)
                | Q(target_grade_min__lte=models.F("target_grade_max")),
                name="recruitment_grade_order_valid",
            ),
        ]
        indexes = [
            models.Index(fields=["organization", "publication_state"], name="recruitment_org_state_idx"),
            models.Index(fields=["publication_state", "apply_end_at"], name="recruitment_state_end_idx"),
        ]

    def __str__(self) -> str:
        return self.title


class RecruitmentPosition(UUIDTimestampedModel):
    recruitment = models.ForeignKey(Recruitment, on_delete=models.PROTECT, related_name="positions")
    name = models.CharField(max_length=60)
    headcount = models.SmallIntegerField()
    description_md = models.TextField(null=True, blank=True, validators=[MaxLengthValidator(3000)])
    requirements_md = models.TextField(null=True, blank=True, validators=[MaxLengthValidator(3000)])
    sort_order = models.IntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["recruitment", "name"], name="recruitment_position_name_unique"),
            models.CheckConstraint(condition=Q(headcount__gt=0), name="recruitment_position_headcount_positive"),
            models.CheckConstraint(condition=Q(sort_order__gte=0), name="recruitment_position_sort_nonnegative"),
        ]

    def __str__(self) -> str:
        return self.name


class RecruitmentApplication(UUIDTimestampedModel):
    class Status(models.TextChoices):
        PENDING = "PENDING", "待处理"
        ACCEPTED = "ACCEPTED", "已接受"
        REJECTED = "REJECTED", "已拒绝"
        WITHDRAWN = "WITHDRAWN", "已撤回"

    recruitment = models.ForeignKey(Recruitment, on_delete=models.PROTECT, related_name="applications")
    position = models.ForeignKey(RecruitmentPosition, on_delete=models.PROTECT, related_name="applications")
    applicant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="recruitment_applications")
    self_intro = models.TextField(validators=[MaxLengthValidator(3000)])
    skills = models.CharField(max_length=1000, null=True, blank=True)
    experience = models.TextField(null=True, blank=True, validators=[MaxLengthValidator(5000)])
    motivation = models.TextField(validators=[MaxLengthValidator(3000)])
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="processed_recruitment_applications"
    )
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["recruitment", "applicant"],
                condition=Q(status__in=["PENDING", "ACCEPTED"]),
                name="recruitment_application_active_unique",
            ),
        ]
        indexes = [
            models.Index(fields=["recruitment", "status", "created_at"], name="recruit_app_state_created_idx"),
            models.Index(fields=["position", "status"], name="recruit_app_position_state_idx"),
            models.Index(fields=["applicant", "created_at"], name="recruit_applicant_created_idx"),
        ]

    def __str__(self) -> str:
        return f"{self.recruitment} / {self.applicant}"
