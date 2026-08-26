"""校园活动和活动报名模型。"""

import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxLengthValidator
from django.db import models
from django.db.models import Q

from apps.core.models import UUIDTimestampedModel
from apps.core.validation import add_min_length_error


class Activity(UUIDTimestampedModel):
    class ActivityType(models.TextChoices):
        COMPETITION_BRIEFING = "COMPETITION_BRIEFING", "竞赛说明"
        TECH_SHARING = "TECH_SHARING", "技术分享"
        RESEARCH_LECTURE = "RESEARCH_LECTURE", "学术讲座"
        FURTHER_STUDY = "FURTHER_STUDY", "升学"
        ENTERPRISE = "ENTERPRISE", "企业"
        TRAINING = "TRAINING", "培训"
        OTHER = "OTHER", "其他"

    class PublicationState(models.TextChoices):
        DRAFT = "DRAFT", "草稿"
        PUBLISHED = "PUBLISHED", "已发布"
        CANCELLED = "CANCELLED", "已取消"
        ARCHIVED = "ARCHIVED", "已归档"

    title = models.CharField(max_length=120)
    activity_type = models.CharField(max_length=30, choices=ActivityType.choices)
    summary = models.CharField(max_length=300, null=True, blank=True)
    description_md = models.TextField(validators=[MaxLengthValidator(20000)])
    organizer_organization = models.ForeignKey(
        "organizations.Organization", null=True, blank=True, on_delete=models.SET_NULL, related_name="activities"
    )
    organizer_name = models.CharField(max_length=120, null=True, blank=True)
    speaker = models.CharField(max_length=200, null=True, blank=True)
    location = models.CharField(max_length=200)
    start_at = models.DateTimeField()
    end_at = models.DateTimeField(null=True, blank=True)
    registration_required = models.BooleanField(default=False)
    registration_start_at = models.DateTimeField(null=True, blank=True)
    registration_end_at = models.DateTimeField(null=True, blank=True)
    capacity = models.IntegerField(null=True, blank=True)
    notes_md = models.TextField(null=True, blank=True, validators=[MaxLengthValidator(5000)])
    cover_asset = models.ForeignKey("media.MediaAsset", null=True, blank=True, on_delete=models.SET_NULL, related_name="activity_covers")
    publication_state = models.CharField(max_length=20, choices=PublicationState.choices, default=PublicationState.DRAFT)
    is_featured = models.BooleanField(default=False)
    featured_order = models.IntegerField(default=0)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_activities")
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="updated_activities")

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(end_at__isnull=True) | Q(start_at__lte=models.F("end_at")),
                name="activity_event_window_valid",
            ),
            models.CheckConstraint(
                condition=Q(registration_start_at__isnull=True)
                | Q(registration_end_at__isnull=True)
                | Q(registration_start_at__lte=models.F("registration_end_at")),
                name="activity_registration_window_valid",
            ),
            models.CheckConstraint(condition=Q(capacity__isnull=True) | Q(capacity__gt=0), name="activity_capacity_positive"),
            models.CheckConstraint(condition=Q(featured_order__gte=0), name="activity_featured_order_nonnegative"),
            models.CheckConstraint(
                condition=Q(registration_required=True)
                | (Q(registration_start_at__isnull=True) & Q(registration_end_at__isnull=True) & Q(capacity__isnull=True)),
                name="activity_registration_fields_required_only",
            ),
        ]
        indexes = [
            models.Index(fields=["publication_state", "start_at"], name="activity_state_start_idx"),
            models.Index(fields=["activity_type", "publication_state"], name="activity_type_state_idx"),
            models.Index(fields=["registration_end_at"], name="activity_registration_end_idx"),
            models.Index(fields=["is_featured", "featured_order"], name="activity_featured_order_idx"),
        ]

    def clean(self) -> None:
        super().clean()
        errors: dict[str, str] = {}
        add_min_length_error(errors, field="title", value=self.title, minimum=2, label="活动标题")
        add_min_length_error(errors, field="description_md", value=self.description_md, minimum=1, label="活动介绍")
        add_min_length_error(errors, field="location", value=self.location, minimum=1, label="活动地点")
        if errors:
            raise ValidationError(errors)

    def __str__(self) -> str:
        return self.title


class Registration(models.Model):
    class Status(models.TextChoices):
        REGISTERED = "REGISTERED", "已报名"
        CANCELLED = "CANCELLED", "已取消"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    activity = models.ForeignKey(Activity, on_delete=models.PROTECT, related_name="registrations")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="activity_registrations")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.REGISTERED)
    name_snapshot = models.CharField(max_length=80)
    student_no_snapshot = models.CharField(max_length=32)
    class_name_snapshot = models.CharField(max_length=80, null=True, blank=True)
    major_snapshot = models.CharField(max_length=80, null=True, blank=True)
    grade_snapshot = models.SmallIntegerField(null=True, blank=True)
    registered_at = models.DateTimeField(auto_now_add=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["activity", "user"], name="activity_registration_unique")]
        indexes = [
            models.Index(fields=["activity", "status"], name="activity_reg_state_idx"),
            models.Index(fields=["user", "status"], name="activity_reg_user_state_idx"),
        ]
