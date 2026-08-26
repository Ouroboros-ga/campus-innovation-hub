"""咨询和正式回复模型。"""

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxLengthValidator
from django.db import models

from apps.core.models import UUIDTimestampedModel
from apps.core.validation import add_min_length_error


class Consultation(UUIDTimestampedModel):
    class Visibility(models.TextChoices):
        PUBLIC = "PUBLIC", "公开"
        PRIVATE = "PRIVATE", "私密"

    class Status(models.TextChoices):
        OPEN = "OPEN", "待回复"
        ANSWERED = "ANSWERED", "已回复"
        CLOSED = "CLOSED", "已关闭"

    class Category(models.TextChoices):
        COMPETITION = "COMPETITION", "竞赛"
        TEAM = "TEAM", "组队"
        ORGANIZATION = "ORGANIZATION", "组织"
        ACTIVITY = "ACTIVITY", "活动"
        FURTHER_STUDY = "FURTHER_STUDY", "升学"
        CERTIFICATE = "CERTIFICATE", "证书"
        OTHER = "OTHER", "其他"

    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="consultations")
    category = models.CharField(max_length=30, choices=Category.choices)
    competition = models.ForeignKey(
        "competitions.Competition", null=True, blank=True, on_delete=models.PROTECT, related_name="consultations"
    )
    title = models.CharField(max_length=120)
    body_md = models.TextField(validators=[MaxLengthValidator(5000)])
    visibility = models.CharField(max_length=20, choices=Visibility.choices, default=Visibility.PRIVATE)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    answered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["author", "created_at"], name="consult_author_created_idx"),
            models.Index(fields=["status", "visibility", "created_at"], name="consult_state_visibility_idx"),
        ]

    def clean(self) -> None:
        super().clean()
        errors: dict[str, str] = {}
        add_min_length_error(errors, field="title", value=self.title, minimum=4, label="咨询标题")
        add_min_length_error(errors, field="body_md", value=self.body_md, minimum=10, label="咨询正文")
        if errors:
            raise ValidationError(errors)


class Reply(UUIDTimestampedModel):
    consultation = models.ForeignKey(Consultation, on_delete=models.PROTECT, related_name="replies")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="consultation_replies")
    body_md = models.TextField(validators=[MaxLengthValidator(10000)])

    def clean(self) -> None:
        super().clean()
        errors: dict[str, str] = {}
        add_min_length_error(errors, field="body_md", value=self.body_md, minimum=1, label="回复正文")
        if errors:
            raise ValidationError(errors)
