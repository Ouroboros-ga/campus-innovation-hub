"""可公开浏览的轮播、公告、指南和 FAQ 模型。"""

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MaxLengthValidator
from django.db import models
from django.db.models import Q

from apps.core.models import UUIDCreatedModel, UUIDTimestampedModel
from apps.core.validation import add_min_length_error


class PublicationState(models.TextChoices):
    DRAFT = "DRAFT", "草稿"
    PUBLISHED = "PUBLISHED", "已发布"
    ARCHIVED = "ARCHIVED", "已归档"


class GuideCategory(models.TextChoices):
    COMPETITION = "COMPETITION", "竞赛"
    RESEARCH = "RESEARCH", "科研"
    FURTHER_STUDY = "FURTHER_STUDY", "升学"
    CERTIFICATE = "CERTIFICATE", "证书"
    PROCESS = "PROCESS", "流程"
    EXPERIENCE = "EXPERIENCE", "经验"
    OTHER = "OTHER", "其他"


class HomepageBanner(UUIDTimestampedModel):
    class LinkType(models.TextChoices):
        NONE = "NONE", "无链接"
        INTERNAL = "INTERNAL", "站内链接"
        EXTERNAL = "EXTERNAL", "站外链接"

    title = models.CharField(max_length=80)
    subtitle = models.CharField(max_length=160, null=True, blank=True)
    category_label = models.CharField(max_length=30, null=True, blank=True)
    image_asset = models.ForeignKey("media.MediaAsset", on_delete=models.PROTECT, related_name="homepage_banners")
    alt_text = models.CharField(max_length=160, null=True, blank=True)
    link_type = models.CharField(max_length=20, choices=LinkType.choices, default=LinkType.NONE)
    internal_path = models.CharField(max_length=500, null=True, blank=True)
    external_url = models.URLField(max_length=500, null=True, blank=True)
    start_at = models.DateTimeField(null=True, blank=True)
    end_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.IntegerField(default=0)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_banners")
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="updated_banners")

    class Meta:
        constraints = [
            models.CheckConstraint(
                condition=Q(start_at__isnull=True) | Q(end_at__isnull=True) | Q(start_at__lte=models.F("end_at")),
                name="homepage_banner_window_valid",
            ),
            models.CheckConstraint(condition=Q(sort_order__gte=0), name="homepage_banner_sort_nonnegative"),
        ]

    def clean(self) -> None:
        super().clean()
        errors: dict[str, str] = {}
        add_min_length_error(errors, field="title", value=self.title, minimum=1, label="轮播标题")
        if self.link_type == self.LinkType.NONE and (self.internal_path or self.external_url):
            errors["link_type"] = "无链接轮播不能设置链接地址。"
        if self.link_type == self.LinkType.INTERNAL and (not self.internal_path or self.external_url):
            errors["link_type"] = "站内轮播只能设置站内路径。"
        if self.link_type == self.LinkType.EXTERNAL and (not self.external_url or self.internal_path):
            errors["link_type"] = "站外轮播只能设置站外链接。"
        if errors:
            raise ValidationError(errors)


class Announcement(UUIDTimestampedModel):
    PublicationState = PublicationState

    class PublisherScope(models.TextChoices):
        ACADEMY = "ACADEMY", "学院"
        UNIVERSITY = "UNIVERSITY", "学校"
        PLATFORM = "PLATFORM", "平台"

    title = models.CharField(max_length=160)
    summary = models.CharField(max_length=300, null=True, blank=True)
    body_md = models.TextField(validators=[MaxLengthValidator(20000)])
    publication_state = models.CharField(max_length=20, choices=PublicationState.choices, default=PublicationState.DRAFT)
    published_at = models.DateTimeField(null=True, blank=True)
    is_pinned = models.BooleanField(default=False)
    is_home_featured = models.BooleanField(default=False)
    home_featured_order = models.IntegerField(default=0)
    publisher_scope = models.CharField(max_length=20, choices=PublisherScope.choices)
    source_name = models.CharField(max_length=160, null=True, blank=True, help_text="信息来源展示文本，如：大赛官网 / 教务处")
    competition = models.ForeignKey(
        "competitions.Competition", null=True, blank=True, on_delete=models.PROTECT, related_name="announcements"
    )
    activity = models.ForeignKey("activities.Activity", null=True, blank=True, on_delete=models.PROTECT, related_name="announcements")
    organization = models.ForeignKey(
        "organizations.Organization", null=True, blank=True, on_delete=models.PROTECT, related_name="announcements"
    )
    recruitment = models.ForeignKey(
        "organizations.Recruitment", null=True, blank=True, on_delete=models.PROTECT, related_name="announcements"
    )
    external_url = models.URLField(max_length=500, null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_announcements")
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="updated_announcements")

    class Meta:
        constraints = [
            models.CheckConstraint(condition=Q(home_featured_order__gte=0), name="announcement_home_featured_order_nonnegative"),
        ]
        indexes = [
            models.Index(fields=["publication_state", "published_at"], name="announcement_state_pub_idx"),
            models.Index(fields=["is_pinned", "published_at"], name="announcement_pinned_pub_idx"),
            models.Index(fields=["publication_state", "is_home_featured", "home_featured_order"], name="announcement_home_featured_idx"),
            models.Index(fields=["competition", "publication_state"], name="announcement_comp_state_idx"),
            models.Index(fields=["activity", "publication_state"], name="announcement_activity_idx"),
            models.Index(fields=["organization", "publication_state"], name="announcement_org_state_idx"),
        ]

    def clean(self) -> None:
        super().clean()
        errors: dict[str, str] = {}
        add_min_length_error(errors, field="title", value=self.title, minimum=2, label="公告标题")
        add_min_length_error(errors, field="body_md", value=self.body_md, minimum=1, label="公告正文")
        related_count = sum(
            item is not None for item in (self.competition_id, self.activity_id, self.organization_id, self.recruitment_id)
        )
        if related_count > 1:
            errors["__all__"] = "公告最多只能关联一个核心业务对象。"
        if errors:
            raise ValidationError(errors)


class GuideArticle(UUIDTimestampedModel):
    PublicationState = PublicationState
    Category = GuideCategory

    title = models.CharField(max_length=160)
    category = models.CharField(max_length=30, choices=GuideCategory.choices)
    summary = models.CharField(max_length=300, null=True, blank=True)
    body_md = models.TextField(validators=[MaxLengthValidator(50000)])
    publication_state = models.CharField(max_length=20, choices=PublicationState.choices, default=PublicationState.DRAFT)
    published_at = models.DateTimeField(null=True, blank=True)
    is_featured = models.BooleanField(default=False)
    featured_order = models.IntegerField(default=0)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_guides")
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="updated_guides")

    class Meta:
        constraints = [models.CheckConstraint(condition=Q(featured_order__gte=0), name="guide_featured_order_nonnegative")]
        indexes = [
            models.Index(fields=["category", "publication_state", "published_at"], name="guide_category_state_pub_idx"),
            models.Index(fields=["is_featured", "featured_order"], name="guide_featured_order_idx"),
        ]

    def clean(self) -> None:
        super().clean()
        errors: dict[str, str] = {}
        add_min_length_error(errors, field="title", value=self.title, minimum=2, label="指南标题")
        add_min_length_error(errors, field="body_md", value=self.body_md, minimum=1, label="指南正文")
        if errors:
            raise ValidationError(errors)


class GuideCompetition(UUIDCreatedModel):
    guide = models.ForeignKey(GuideArticle, on_delete=models.PROTECT, related_name="competition_links")
    competition = models.ForeignKey("competitions.Competition", on_delete=models.PROTECT, related_name="guide_links")
    sort_order = models.IntegerField(default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["guide", "competition"], name="guide_competition_unique"),
            models.CheckConstraint(condition=Q(sort_order__gte=0), name="guide_competition_sort_nonnegative"),
        ]


class FaqItem(UUIDTimestampedModel):
    PublicationState = PublicationState
    Category = GuideCategory

    category = models.CharField(max_length=30, choices=GuideCategory.choices)
    question = models.CharField(max_length=300)
    answer_md = models.TextField(validators=[MaxLengthValidator(20000)])
    publication_state = models.CharField(max_length=20, choices=PublicationState.choices, default=PublicationState.DRAFT)
    published_at = models.DateTimeField(null=True, blank=True)
    sort_order = models.IntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    featured_order = models.IntegerField(default=0)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_faq_items")
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="updated_faq_items")

    class Meta:
        constraints = [
            models.CheckConstraint(condition=Q(sort_order__gte=0), name="faq_sort_nonnegative"),
            models.CheckConstraint(condition=Q(featured_order__gte=0), name="faq_featured_order_nonnegative"),
        ]
        indexes = [
            models.Index(fields=["publication_state", "sort_order"], name="faq_state_sort_idx"),
            models.Index(fields=["publication_state", "is_featured", "featured_order"], name="faq_home_featured_idx"),
        ]

    def clean(self) -> None:
        super().clean()
        errors: dict[str, str] = {}
        add_min_length_error(errors, field="question", value=self.question, minimum=2, label="常见问题")
        add_min_length_error(errors, field="answer_md", value=self.answer_md, minimum=1, label="常见问题答案")
        if errors:
            raise ValidationError(errors)


class SiteDocument(UUIDTimestampedModel):
    """文档中心：隐私政策、服务条款、关于我们、联系我们、使用帮助等站点文档。

    每个 slug 唯一对应一篇文档，通过 publication_state 控制公开可见性。
    body_md 为 Markdown canonical source，前端通过 RichContent 渲染。
    """

    PublicationState = PublicationState

    class Category(models.TextChoices):
        ABOUT = "ABOUT", "关于我们"
        CONTACT = "CONTACT", "联系我们"
        HELP = "HELP", "使用帮助"
        PRIVACY = "PRIVACY", "隐私政策"
        TERMS = "TERMS", "服务条款"
        OTHER = "OTHER", "其他"

    slug = models.SlugField(max_length=80, unique=True, help_text="唯一标识，如 privacy / terms / about / contact / help")
    title = models.CharField(max_length=160)
    category = models.CharField(max_length=20, choices=Category.choices)
    summary = models.CharField(max_length=300, null=True, blank=True)
    body_md = models.TextField(validators=[MaxLengthValidator(50000)])
    publication_state = models.CharField(max_length=20, choices=PublicationState.choices, default=PublicationState.DRAFT)
    published_at = models.DateTimeField(null=True, blank=True)
    sort_order = models.IntegerField(default=0)
    version = models.CharField(max_length=20, default="1.0", help_text="展示版本号，如 1.0 / 2026-08")
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="created_site_documents")
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="updated_site_documents")

    class Meta:
        constraints = [
            models.CheckConstraint(condition=Q(sort_order__gte=0), name="site_document_sort_nonnegative"),
        ]
        indexes = [
            models.Index(fields=["publication_state", "category"], name="site_doc_state_category_idx"),
            models.Index(fields=["slug", "publication_state"], name="site_doc_slug_state_idx"),
            models.Index(fields=["publication_state", "published_at"], name="site_doc_state_pub_idx"),
        ]

    def clean(self) -> None:
        super().clean()
        errors: dict[str, str] = {}
        add_min_length_error(errors, field="slug", value=self.slug, minimum=2, label="文档标识")
        add_min_length_error(errors, field="title", value=self.title, minimum=2, label="文档标题")
        add_min_length_error(errors, field="body_md", value=self.body_md, minimum=1, label="文档正文")
        if self.slug:
            normalized = self.slug.strip().lower()
            if normalized != self.slug:
                errors["slug"] = "文档标识必须为小写字母、数字或连字符，且不能包含空格。"
            import re

            if not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", self.slug):
                errors["slug"] = "文档标识格式不合法，仅允许小写字母、数字与连字符。"
        if errors:
            raise ValidationError(errors)
