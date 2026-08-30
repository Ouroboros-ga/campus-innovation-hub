"""竞赛、时间线和关注模型。"""

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxLengthValidator
from django.db import models
from django.db.models import Q

from apps.core.models import UUIDCreatedModel, UUIDTimestampedModel
from apps.core.validation import add_min_length_error


class Competition(UUIDTimestampedModel):
    class Category(models.TextChoices):
        AI = "AI", "人工智能"
        PROGRAMMING = "PROGRAMMING", "编程"
        INNOVATION = "INNOVATION", "创新"
        MATHEMATICAL_MODELING = "MATHEMATICAL_MODELING", "数学建模"
        ELECTRONICS = "ELECTRONICS", "电子"
        ROBOTICS = "ROBOTICS", "机器人"
        CYBERSECURITY = "CYBERSECURITY", "网络安全"
        ELECTRONIC_DESIGN = "ELECTRONIC_DESIGN", "电子设计"
        MECHANICAL_DESIGN = "MECHANICAL_DESIGN", "机械设计"
        OTHER = "OTHER", "其他"

    class Level(models.TextChoices):
        SCHOOL = "SCHOOL", "校级"
        PROVINCIAL = "PROVINCIAL", "省级"
        NATIONAL = "NATIONAL", "国家级"
        INTERNATIONAL = "INTERNATIONAL", "国际"
        OTHER = "OTHER", "其他"

    class ParticipationMode(models.TextChoices):
        INDIVIDUAL = "INDIVIDUAL", "个人"
        TEAM = "TEAM", "团队"

    class PublicationState(models.TextChoices):
        DRAFT = "DRAFT", "草稿"
        PUBLISHED = "PUBLISHED", "已发布"
        CANCELLED = "CANCELLED", "已取消"
        ARCHIVED = "ARCHIVED", "已归档"

    name = models.CharField(max_length=120)
    edition = models.CharField(max_length=40)
    category = models.CharField(max_length=30, choices=Category.choices)
    level = models.CharField(max_length=30, choices=Level.choices)
    participation_mode = models.CharField(max_length=20, choices=ParticipationMode.choices)
    suitable_grade_min = models.SmallIntegerField(null=True, blank=True)
    suitable_grade_max = models.SmallIntegerField(null=True, blank=True)
    direction = models.CharField(max_length=300, null=True, blank=True)
    summary = models.CharField(max_length=300, null=True, blank=True)
    description_md = models.TextField(validators=[MaxLengthValidator(20000)])
    suitable_for_md = models.TextField(null=True, blank=True, validators=[MaxLengthValidator(10000)])
    preparation_advice_md = models.TextField(null=True, blank=True, validators=[MaxLengthValidator(10000)])
    registration_start_at = models.DateTimeField(null=True, blank=True)
    registration_end_at = models.DateTimeField(null=True, blank=True)
    event_start_at = models.DateTimeField(null=True, blank=True)
    event_end_at = models.DateTimeField(null=True, blank=True)
    college_organized = models.BooleanField(default=False)
    college_contact_name = models.CharField(max_length=100, null=True, blank=True)
    college_contact_text = models.CharField(max_length=200, null=True, blank=True)
    official_url = models.URLField(max_length=500, null=True, blank=True)
    registration_url = models.URLField(max_length=500, null=True, blank=True)
    official_notice_url = models.URLField(max_length=500, null=True, blank=True)
    cover_asset = models.ForeignKey("media.MediaAsset", null=True, blank=True, on_delete=models.SET_NULL, related_name="competition_covers")
    publication_state = models.CharField(max_length=20, choices=PublicationState.choices, default=PublicationState.DRAFT)
    published_at = models.DateTimeField(null=True, blank=True)
    is_featured = models.BooleanField(default=False)
    featured_order = models.IntegerField(default=0)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_competitions")
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="updated_competitions")

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["name", "edition"], name="competition_name_edition_unique"),
            models.CheckConstraint(
                condition=Q(registration_start_at__isnull=True)
                | Q(registration_end_at__isnull=True)
                | Q(registration_start_at__lte=models.F("registration_end_at")),
                name="competition_registration_window_valid",
            ),
            models.CheckConstraint(
                condition=Q(event_start_at__isnull=True) | Q(event_end_at__isnull=True) | Q(event_start_at__lte=models.F("event_end_at")),
                name="competition_event_window_valid",
            ),
            models.CheckConstraint(
                condition=Q(suitable_grade_min__isnull=True) | Q(suitable_grade_min__gte=1, suitable_grade_min__lte=4),
                name="competition_grade_min_range",
            ),
            models.CheckConstraint(
                condition=Q(suitable_grade_max__isnull=True) | Q(suitable_grade_max__gte=1, suitable_grade_max__lte=4),
                name="competition_grade_max_range",
            ),
            models.CheckConstraint(
                condition=Q(suitable_grade_min__isnull=True)
                | Q(suitable_grade_max__isnull=True)
                | Q(suitable_grade_min__lte=models.F("suitable_grade_max")),
                name="competition_grade_order_valid",
            ),
            models.CheckConstraint(condition=Q(featured_order__gte=0), name="competition_featured_order_nonnegative"),
        ]
        indexes = [
            models.Index(fields=["publication_state", "registration_end_at"], name="competition_state_reg_end_idx"),
            models.Index(fields=["category", "publication_state"], name="competition_category_state_idx"),
            models.Index(fields=["level", "publication_state"], name="competition_level_state_idx"),
            models.Index(fields=["participation_mode", "publication_state"], name="competition_mode_state_idx"),
            models.Index(fields=["is_featured", "featured_order"], name="competition_featured_order_idx"),
            models.Index(fields=["event_start_at"], name="competition_event_start_idx"),
        ]

    def clean(self) -> None:
        super().clean()
        errors: dict[str, str] = {}
        add_min_length_error(errors, field="name", value=self.name, minimum=2, label="竞赛名称")
        add_min_length_error(errors, field="edition", value=self.edition, minimum=1, label="届次")
        add_min_length_error(errors, field="description_md", value=self.description_md, minimum=1, label="竞赛介绍")
        if errors:
            raise ValidationError(errors)

    def __str__(self) -> str:
        return f"{self.name} {self.edition}"


class TimelineEvent(UUIDTimestampedModel):
    competition = models.ForeignKey(Competition, on_delete=models.PROTECT, related_name="timeline_events")
    title = models.CharField(max_length=100)
    event_at = models.DateTimeField()
    end_at = models.DateTimeField(null=True, blank=True)
    description = models.CharField(max_length=500, null=True, blank=True)
    sort_order = models.IntegerField(default=0)

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(end_at__isnull=True) | Q(event_at__lte=models.F("end_at")),
                name="timeline_event_window_valid",
            ),
            models.CheckConstraint(condition=Q(sort_order__gte=0), name="timeline_event_sort_nonnegative"),
        ]
        indexes = [models.Index(fields=["competition", "event_at"], name="timeline_competition_event_idx")]


class Follow(UUIDCreatedModel):
    competition = models.ForeignKey(Competition, on_delete=models.PROTECT, related_name="follows")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="competition_follows")

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "competition"], name="competition_follow_unique")]
