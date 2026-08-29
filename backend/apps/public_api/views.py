"""BE-010 的公共只读 View。"""

from __future__ import annotations

from collections.abc import Callable
from datetime import datetime
from typing import Any

from django.db.models import Count, Exists, OuterRef, Q, QuerySet
from django.utils import timezone
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.activities.models import Activity, Registration
from apps.competitions.models import Competition
from apps.content.models import Announcement, FaqItem, GuideArticle, HomepageBanner, SiteDocument
from apps.organizations.models import Organization, Recruitment
from apps.teams.models import TeamApplication, TeamPost
from apps.public_api.query import (
    filter_text,
    paginated_response,
    parse_optional_bool,
    parse_optional_enum,
    parse_optional_text,
    parse_optional_uuid,
    parse_ordering,
    parse_uuid,
    validate_query_keys,
)
from apps.public_api.serializers import (
    activity_registration_state,
    competition_registration_state,
    event_phase,
    is_authenticated,
    recruitment_application_state,
    recruitment_open_filter,
    serialize_activity,
    serialize_activity_detail,
    serialize_announcement,
    serialize_announcement_detail,
    serialize_banner,
    serialize_competition,
    serialize_competition_detail,
    serialize_faq,
    serialize_guide,
    serialize_guide_detail,
    serialize_home_competition,
    serialize_organization,
    serialize_organization_detail,
    serialize_recruitment,
    serialize_recruitment_detail,
    serialize_site_document,
    serialize_site_document_detail,
    serialize_team_detail,
    serialize_team_post,
)


def published_competitions() -> QuerySet[Competition]:
    return Competition.objects.filter(publication_state=Competition.PublicationState.PUBLISHED).select_related("cover_asset")


def published_activities() -> QuerySet[Activity]:
    return Activity.objects.filter(publication_state=Activity.PublicationState.PUBLISHED).select_related(
        "cover_asset", "organizer_organization"
    ).annotate(registered_count_value=Count("registrations", filter=Q(registrations__status=Registration.Status.REGISTERED)))


def active_organizations() -> QuerySet[Organization]:
    return Organization.objects.filter(is_active=True).select_related("logo_asset", "banner_asset")


def published_recruitments() -> QuerySet[Recruitment]:
    return Recruitment.objects.filter(
        publication_state=Recruitment.PublicationState.PUBLISHED,
        organization__is_active=True,
    ).select_related("organization").annotate(position_count=Count("positions"))


def public_teams() -> QuerySet[TeamPost]:
    return TeamPost.objects.filter(competition__publication_state=Competition.PublicationState.PUBLISHED).select_related(
        "competition", "author", "author__profile", "author__profile__avatar_asset"
    ).prefetch_related("roles").annotate(
        accepted_count=Count("applications", filter=Q(applications__status=TeamApplication.Status.ACCEPTED))
    )


def published_announcements() -> QuerySet[Announcement]:
    return Announcement.objects.filter(publication_state=Announcement.PublicationState.PUBLISHED).select_related(
        "competition", "activity", "organization", "recruitment__organization"
    )


def published_guides() -> QuerySet[GuideArticle]:
    return GuideArticle.objects.filter(publication_state=GuideArticle.PublicationState.PUBLISHED)


def published_faqs() -> QuerySet[FaqItem]:
    return FaqItem.objects.filter(publication_state=FaqItem.PublicationState.PUBLISHED)


def get_visible(queryset: QuerySet[Any], object_id: str) -> Any:
    identifier = parse_uuid(object_id)
    instance = queryset.filter(id=identifier).first()
    if instance is None:
        raise NotFound("请求的资源不存在")
    return instance


def competition_status_filter(queryset: QuerySet[Competition], status: str | None, now: datetime) -> QuerySet[Competition]:
    if status is None:
        return queryset
    if status == "UPCOMING":
        return queryset.filter(registration_start_at__gt=now)
    if status == "OPEN":
        return queryset.filter(
            Q(registration_start_at__isnull=True) | Q(registration_start_at__lte=now),
            Q(registration_end_at__isnull=True) | Q(registration_end_at__gte=now),
        ).exclude(registration_start_at__isnull=True, registration_end_at__isnull=True)
    if status == "IN_PROGRESS":
        return queryset.filter(event_start_at__lte=now).filter(Q(event_end_at__isnull=True) | Q(event_end_at__gte=now))
    return queryset.filter(event_end_at__lt=now)


def activity_status_filter(queryset: QuerySet[Activity], status: str | None, now: datetime) -> QuerySet[Activity]:
    if status is None:
        return queryset
    if status == "UPCOMING":
        return queryset.filter(start_at__gt=now)
    if status == "ENDED":
        return queryset.filter(end_at__lt=now)
    return queryset.filter(
        registration_required=True,
        registration_start_at__lte=now,
    ).filter(Q(registration_end_at__isnull=True) | Q(registration_end_at__gte=now))


def recruitment_state_filter(queryset: QuerySet[Recruitment], status: str | None, now: datetime) -> QuerySet[Recruitment]:
    if status is None:
        return queryset
    if status == "OPEN":
        return queryset.filter(recruitment_open_filter(now))
    if status == "UPCOMING":
        return queryset.filter(apply_start_at__gt=now, completed_at__isnull=True)
    if status == "COMPLETED":
        return queryset.filter(completed_at__isnull=False)
    if status == "CLOSED":
        return queryset.filter(completed_at__isnull=True, apply_end_at__lt=now)
    return queryset.none()


class PublicReadView(APIView):
    permission_classes = [AllowAny]


class HomeView(PublicReadView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, set())
        now = timezone.now()
        banners = HomepageBanner.objects.filter(is_active=True).filter(
            Q(start_at__isnull=True) | Q(start_at__lte=now),
            Q(end_at__isnull=True) | Q(end_at__gte=now),
        ).select_related("image_asset").order_by("sort_order", "-created_at")[:4]
        deadlines = published_competitions().filter(registration_end_at__gte=now).order_by("registration_end_at", "event_start_at")[:6]
        featured_competitions = published_competitions().filter(is_featured=True).order_by("featured_order", "-created_at")[:8]
        announcements = (
            published_announcements().filter(is_home_featured=True).order_by("home_featured_order", "-published_at")[:6]
        )
        guides = published_guides().filter(is_featured=True).order_by("featured_order", "-published_at")[:6]
        teams = public_teams().filter(status=TeamPost.Status.RECRUITING).order_by("-created_at")[:6]
        organizations = active_organizations().annotate(
            is_recruiting_value=Exists(
                Recruitment.objects.filter(organization=OuterRef("pk")).filter(recruitment_open_filter(now))
            )
        ).filter(is_recruiting_value=True).order_by("name")[:6]
        activities = published_activities().filter(start_at__gte=now).order_by("start_at")[:6]
        faqs = published_faqs().filter(is_featured=True).order_by("featured_order", "sort_order", "-created_at")[:6]
        response = Response(
            {
                "banners": [serialize_banner(item, request) for item in banners],
                "deadlines": [serialize_home_competition(item, request) for item in deadlines],
                "featured_competitions": [serialize_home_competition(item, request) for item in featured_competitions],
                "announcements": [serialize_announcement(item, request) for item in announcements],
                "featured_guides": [serialize_guide(item, request) for item in guides],
                "team_posts": [serialize_team_post(item, request) for item in teams],
                "recruiting_organizations": [serialize_organization(item, request) for item in organizations],
                "activities": [serialize_activity(item, request) for item in activities],
                "faqs": [serialize_faq(item, request) for item in faqs],
            }
        )
        # 完全公共响应，允许 Nginx 30~60s 共享缓存；运营预览不走此缓存
        response["Cache-Control"] = "public, max-age=60"
        return response


class CompetitionListView(PublicReadView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "status", "category", "participation_mode", "direction", "page", "page_size", "ordering"})
        now = timezone.now()
        status = parse_optional_enum(request, "status", {"UPCOMING", "OPEN", "IN_PROGRESS", "ENDED"})
        category = parse_optional_enum(request, "category", Competition.Category.values)
        mode = parse_optional_enum(request, "participation_mode", Competition.ParticipationMode.values)
        ordering = parse_ordering(request, {"registration_end_at", "-registration_end_at", "event_start_at", "-event_start_at"})
        queryset = filter_text(published_competitions(), parse_optional_text(request, "q"), ("name", "edition", "direction", "summary"))
        queryset = competition_status_filter(queryset, status, now)
        if category:
            # 类别筛选兼容多标签方向：主分类或方向标签包含即匹配
            label = dict(Competition.Category.choices).get(category, category)
            queryset = queryset.filter(Q(category=category) | Q(direction__icontains=label) | Q(direction__icontains=category))
        if mode:
            queryset = queryset.filter(participation_mode=mode)
        direction = parse_optional_text(request, "direction", max_length=20)
        if direction:
            queryset = queryset.filter(Q(direction__icontains=direction) | Q(category__icontains=direction))
        queryset = queryset.order_by(ordering or "registration_end_at", "event_start_at", "-created_at")
        return paginated_response(request, queryset, lambda item: serialize_competition(item, request))


class CompetitionDetailView(PublicReadView):
    def get(self, request: Request, object_id: str) -> Response:
        validate_query_keys(request, set())
        competition = get_visible(published_competitions().prefetch_related("timeline_events"), object_id)
        return Response(serialize_competition_detail(competition, request))


class TeamListView(PublicReadView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "competition_id", "post_type", "status", "page", "page_size"})
        competition_id = parse_optional_uuid(request, "competition_id")
        post_type = parse_optional_enum(request, "post_type", TeamPost.PostType.values)
        status = parse_optional_enum(request, "status", TeamPost.Status.values)
        queryset = filter_text(public_teams(), parse_optional_text(request, "q"), ("title", "direction", "team_name"))
        queryset = queryset.filter(status=status or TeamPost.Status.RECRUITING)
        if competition_id:
            queryset = queryset.filter(competition_id=competition_id)
        if post_type:
            queryset = queryset.filter(post_type=post_type)
        return paginated_response(request, queryset.order_by("-created_at"), lambda item: serialize_team_post(item, request))


class TeamDetailView(PublicReadView):
    def get(self, request: Request, object_id: str) -> Response:
        validate_query_keys(request, set())
        team = get_visible(public_teams(), object_id)
        return Response(serialize_team_detail(team, request))


class OrganizationListView(PublicReadView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "organization_type", "recruiting", "page", "page_size"})
        now = timezone.now()
        organization_type = parse_optional_enum(request, "organization_type", Organization.OrganizationType.values)
        recruiting = parse_optional_bool(request, "recruiting")
        queryset = active_organizations().annotate(
            is_recruiting_value=Exists(
                Recruitment.objects.filter(organization=OuterRef("pk")).filter(recruitment_open_filter(now))
            )
        )
        queryset = filter_text(queryset, parse_optional_text(request, "q"), ("name", "short_intro"))
        if organization_type:
            queryset = queryset.filter(organization_type=organization_type)
        if recruiting is not None:
            queryset = queryset.filter(is_recruiting_value=recruiting)
        return paginated_response(request, queryset.order_by("-is_recruiting_value", "name"), lambda item: serialize_organization(item, request))


class OrganizationDetailView(PublicReadView):
    def get(self, request: Request, object_id: str) -> Response:
        validate_query_keys(request, set())
        organization = get_visible(active_organizations(), object_id)
        return Response(serialize_organization_detail(organization, request))


class OrganizationRecruitmentListView(PublicReadView):
    def get(self, request: Request, object_id: str) -> Response:
        validate_query_keys(request, {"status", "page", "page_size"})
        organization = get_visible(active_organizations(), object_id)
        status = parse_optional_enum(request, "status", {"UPCOMING", "OPEN", "CLOSED", "COMPLETED"})
        queryset = recruitment_state_filter(published_recruitments().filter(organization=organization), status, timezone.now())
        return paginated_response(request, queryset.order_by("apply_end_at", "-created_at"), lambda item: serialize_recruitment(item, request))


class RecruitmentDetailView(PublicReadView):
    def get(self, request: Request, object_id: str) -> Response:
        validate_query_keys(request, set())
        recruitment = get_visible(published_recruitments().prefetch_related("positions"), object_id)
        return Response(serialize_recruitment_detail(recruitment, request))


class ActivityListView(PublicReadView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "status", "activity_type", "page", "page_size"})
        status = parse_optional_enum(request, "status", {"OPEN", "UPCOMING", "ENDED"})
        activity_type = parse_optional_enum(request, "activity_type", Activity.ActivityType.values)
        queryset = filter_text(published_activities(), parse_optional_text(request, "q"), ("title", "summary"))
        queryset = activity_status_filter(queryset, status, timezone.now())
        if activity_type:
            queryset = queryset.filter(activity_type=activity_type)
        return paginated_response(request, queryset.order_by("start_at"), lambda item: serialize_activity(item, request))


class ActivityDetailView(PublicReadView):
    def get(self, request: Request, object_id: str) -> Response:
        validate_query_keys(request, set())
        activity = get_visible(published_activities(), object_id)
        return Response(serialize_activity_detail(activity, request))


class GuideListView(PublicReadView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "category", "page", "page_size"})
        category = parse_optional_enum(request, "category", GuideArticle.Category.values)
        queryset = filter_text(published_guides(), parse_optional_text(request, "q"), ("title", "summary"))
        if category:
            queryset = queryset.filter(category=category)
        return paginated_response(request, queryset.order_by("-is_featured", "featured_order", "-published_at"), lambda item: serialize_guide(item, request))


class GuideDetailView(PublicReadView):
    def get(self, request: Request, object_id: str) -> Response:
        validate_query_keys(request, set())
        guide = get_visible(published_guides(), object_id)
        return Response(serialize_guide_detail(guide, request))


class FaqListView(PublicReadView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "category", "page", "page_size"})
        category = parse_optional_enum(request, "category", FaqItem.Category.values)
        queryset = filter_text(published_faqs(), parse_optional_text(request, "q"), ("question", "answer_md"))
        if category:
            queryset = queryset.filter(category=category)
        return paginated_response(request, queryset.order_by("sort_order", "-created_at"), lambda item: serialize_faq(item, request))


class AnnouncementListView(PublicReadView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "publisher_scope", "page", "page_size"})
        scope = parse_optional_enum(request, "publisher_scope", Announcement.PublisherScope.values)
        queryset = filter_text(published_announcements(), parse_optional_text(request, "q"), ("title", "summary"))
        if scope:
            queryset = queryset.filter(publisher_scope=scope)
        return paginated_response(request, queryset.order_by("-is_pinned", "-published_at"), lambda item: serialize_announcement(item, request))


class AnnouncementDetailView(PublicReadView):
    def get(self, request: Request, object_id: str) -> Response:
        validate_query_keys(request, set())
        announcement = get_visible(published_announcements(), object_id)
        return Response(serialize_announcement_detail(announcement, request))


class QaPublicListView(PublicReadView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "category", "page", "page_size"})
        from apps.consultations.models import Consultation

        category = parse_optional_enum(request, "category", Consultation.Category.values)
        queryset = Consultation.objects.filter(
            visibility=Consultation.Visibility.PUBLIC, status__in=[Consultation.Status.ANSWERED, Consultation.Status.CLOSED]
        ).select_related("author", "author__profile").prefetch_related("replies__author")
        queryset = filter_text(queryset, parse_optional_text(request, "q"), ("title", "body_md"))
        if category:
            queryset = queryset.filter(category=category)
        queryset = queryset.order_by("-answered_at", "-updated_at", "-id")

        def _serialize_public(item: Consultation) -> dict:
            # 复用已有的 detail 序列化，公开字段已受控
            from apps.student_api.serializers import serialize_consultation_detail

            return serialize_consultation_detail(item, request)

        return paginated_response(request, queryset, _serialize_public)


FALLBACK_SITE_DOCUMENTS: dict[str, dict[str, Any]] = {
    "about": {
        "slug": "about",
        "title": "关于我们",
        "category": "ABOUT",
        "summary": "了解 SIT 人工智能学院·科创与就业服务平台的定位与团队。",
        "version": "1.0",
        "body_md": """# 关于我们

SIT 人工智能学院·科创与就业服务平台（以下简称“本平台”）是面向人工智能学院学生的科创信息与就业服务一站式入口，致力于将分散的竞赛、组队、组织招新、活动报名与科创指导信息聚合为可信、清晰、可行动的服务。

## 平台定位

- **信息可信**：竞赛、活动、招新与指南均由学院运营人员或组织负责人维护，展示官方链接、截止时间与主体信息。
- **行动优先**：优先展示状态、时间与下一步操作，而非宣传文案。
- **浏览开放**：游客可浏览绝大部分公开信息，仅在发生个人行为（报名、申请、发布等）时要求登录。

## 服务范围

- 竞赛中心：持续维护的学院竞赛信息库与时间线
- 组队广场：队伍找人、个人找队的结构化对接
- 社团组织与招新：组织主页、岗位与申请管理
- 校园动态：活动与公告的统一浏览
- 咨询指南：FAQ、指南文章与学生咨询

## 运营主体

本平台由 SIT 人工智能学院负责运营，日常内容由平台运营（OPERATOR）与各组织负责人（LEADER / ADVISOR）分工维护，系统级配置由超级管理员通过 Django Admin 管理。

## 联系与反馈

如需商务合作、内容纠错或功能建议，请通过“联系我们”中的方式与我们取得联系。
""",
    },
    "contact": {
        "slug": "contact",
        "title": "联系我们",
        "category": "CONTACT",
        "summary": "获取平台运营与技术支持的联系方式。",
        "version": "1.0",
        "body_md": """# 联系我们

欢迎通过以下方式联系 SIT 人工智能学院·科创与就业服务平台。

## 学院与平台运营

- **运营主体**：SIT 人工智能学院
- **办公地点**：人工智能学院办公楼（具体楼宇与房间以学院官网公示为准）
- **办公时间**：工作日 9:00—17:00（节假日除外）

## 联系方式

- **平台事务与内容咨询**：请在站内“咨询与指南”提交咨询，选择对应分类并注明关联竞赛或活动，运营人员将在 1—3 个工作日内回复。
- **组织招新咨询**：请进入对应组织主页查看“公开联系方式”与“招新 QQ 群”，优先通过招新群或组织公开联系方式沟通。
- **技术支持与账号问题**：如遇登录、注册或账号异常，请联系学院教务办公室或通过学院官网公布的联系电话与辅导员取得联系。

## 意见反馈

我们重视每一条反馈。若发现信息有误、链接失效或功能异常，可在“咨询”中提交“平台建议”类问题，或通过学院官方渠道反馈。

> 温馨提示：平台不通过任何非官方渠道收取费用，谨防冒充平台工作人员的诈骗信息。
""",
    },
    "help": {
        "slug": "help",
        "title": "使用帮助",
        "category": "HELP",
        "summary": "快速了解平台核心功能的使用方法。",
        "version": "1.0",
        "body_md": """# 使用帮助

本指南帮助你快速完成在平台上的常见任务。

## 游客可做什么

- 浏览首页、竞赛、组队、组织、校园动态、FAQ 与指南
- 查看竞赛、活动、公告与组织详情
- 使用全站搜索（点击右上角搜索或按 `Ctrl / Cmd + K`）

## 需要登录的操作

以下操作需要登录后进行：

- 关注竞赛、报名活动、发布组队、申请加入队伍/组织
- 提交咨询、查看个人申请与活动、接收通知
- 管理自己负责的组织（LEADER / ADVISOR）

未登录时点击上述操作将跳转至登录页，登录成功后自动返回原任务。

## 常见任务

### 报名活动

打开“校园动态 → 活动”或首页“近期活动” → 进入活动详情 → 点击“报名参加” → 确认个人信息 → 报名成功后可在“我的活动”查看与取消。

### 组队

在“组队广场”筛选关联竞赛与信息类型 → 查看招募岗位与技能要求 → 点击“申请加入”并填写自我介绍、经历与联系方式 → 等待发布者处理。

### 申请组织招新

进入“社团组织” → 打开组织主页 → 查看当前招新 → 进入招新详情 → 选择岗位并提交申请 → 在“我的申请”查看状态。

### 提交咨询

进入“咨询指南” → 点击“提交咨询” → 选择分类、填写标题与问题描述、选择公开/私密 → 提交后运营人员将回复，公开问答沉淀为可搜索内容。

## 账号与隐私

- 学号、真实姓名等敏感字段仅本人可见
- 头像、昵称、技能等公开资料可在“个人资料”中完善
- 主题可在“账号设置”中切换 浅色 / 深色 / 跟随系统

如仍有疑问，请通过“联系我们”或站内咨询提交问题。
""",
    },
    "privacy": {
        "slug": "privacy",
        "title": "隐私政策",
        "category": "PRIVACY",
        "summary": "了解平台如何收集、使用与保护你的个人信息。",
        "version": "2026-08-29",
        "body_md": """# 隐私政策

生效日期：2026 年 8 月 29 日  
版本：2026-08-29  
适用主体：SIT 人工智能学院·科创与就业服务平台

本隐私政策说明平台如何收集、使用、存储与保护你的个人信息。注册或使用平台即表示你已阅读并同意本政策。

## 一、我们收集哪些信息

- **账号信息**：学号/工号、用户名、密码（哈希存储）、真实姓名、身份类型（学生/教师）、平台角色。
- **公开资料**：昵称/公开姓名、头像、专业/年级/班级、学院/部门、职称、个人简介、技能标签、研究方向等（由你在“个人资料”中自主完善）。
- **业务行为数据**：关注竞赛、组队发布与申请、组织申请、活动报名、咨询与回复、通知接收等记录。
- **技术信息**：登录时间、操作日志、必要的安全节流记录（已做 HMAC 摘要处理，不存储明文 IP 与密码）。

## 二、我们如何使用信息

- 提供登录、身份识别与权限控制（平台角色与组织身份）。
- 支撑报名、组队与招新的业务流程与容量、时间窗校验。
- 展示公开资料（昵称、专业、年级等）与业务关联内容。
- 发送与你相关的通知（申请状态、活动变更等）；公开公告不会批量写入个人消息。
- 用于安全审计、风控与问题排查（脱敏后的人机验证与节流日志）。

## 三、信息的共享与公开

- **公开信息**（昵称、专业、年级、组织归属等）可在公开页面展示。
- **内部信息**（申请正文、报名记录等）仅对业务参与方与管理人员可见。
- **敏感信息**（学号、真实姓名、手机号、微信/QQ 等联系方式）仅在必要场景向对方或运营人员展示，例如组队申请通过后双方可见联系方式。
- 平台不向第三方出售个人信息，不在公开接口返回敏感字段。

## 四、存储与保留

- 数据存储于校内或受托的 PostgreSQL 数据库，采用事务与约束保证一致性。
- 报名、申请与组队等业务历史以“归档/关闭”而非物理删除方式保留。
- 账号停用仅标记 `is_active=false`，不级联删除历史业务数据。
- 账号注销遵循“本人申请 → 超级管理员确认 → 停用 → 最小匿名化”流程，移除学号、真实姓名、账号名、密码、邮箱等直接身份字段，保留业务历史的匿名关联。

## 五、你的权利

- 在“个人资料”中查阅与更新公开资料。
- 在“账号设置”中管理主题与必要偏好。
- 通过学院官方渠道申请查阅、更正或注销账号（需身份核验）。
- 拒绝提供非必填信息，但可能影响部分功能的完整体验。

## 六、安全措施

- 生产环境使用 HttpOnly 的会话 Cookie 与 CSRF 保护，不在 localStorage 持久化认证密钥。
- 密码仅存储哈希，认证端点实施短时节流。
- 媒体上传经服务端格式与大小校验（图片 5 MB 以内，完整解码并重新编码）。
- 管理操作留痕审计（AuditLog），高敏操作需运营或超级管理员权限。

## 七、未成年人与学生信息

本平台主要服务对象为高校学生。我们按教育场景的必要性处理学生信息，不用于与教学科研无关的商业画像。

## 八、政策更新

隐私政策更新将在本页发布并更新生效日期与版本号，重大变更将通过站内公告提示。继续使用平台视为接受更新后的政策。

## 九、联系我们

如对隐私政策有疑问，请通过“联系我们”中的方式与平台运营取得联系。
""",
    },
    "terms": {
        "slug": "terms",
        "title": "服务条款",
        "category": "TERMS",
        "summary": "使用平台前请阅读并同意服务条款。",
        "version": "2026-08-29",
        "body_md": """# 服务条款

生效日期：2026 年 8 月 29 日  
版本：2026-08-29  
主体：SIT 人工智能学院·科创与就业服务平台

欢迎使用本平台。使用平台即表示你已阅读、理解并同意本服务条款。

## 一、服务说明

本平台为人工智能学院学生提供竞赛信息聚合、组队对接、组织招新、活动报名与科创指导等校园公共服务，不属于社交网络或即时聊天工具。

## 二、账号与身份

- 学生通过“学号 + 真实姓名 + 密码”自助注册，`username = 学号`；教师账号由超级管理员在后台创建，不开放学生注册页自选教师身份。
- 账号仅供本人使用，禁止转借、共享或冒用他人信息注册。
- 平台角色（USER / OPERATOR）与组织身份（MEMBER / LEADER / ADVISOR）由后台授予，头衔（会长、部长等）仅为展示，不代表系统权限。
- 账号停用或注销按学院流程处理，历史业务记录按最小必要原则匿名化保留。

## 三、使用规范

你承诺：

- 不发布违法、侵权、色情、暴力、广告或与科创学术无关的内容；
- 不伪造身份、成绩或经历，不恶意刷取报名名额；
- 不利用平台从事考试作弊、论文代写等违规行为；
- 不通过脚本、爬虫或接口滥用干扰平台正常运行。

平台运营有权对违规内容进行隐藏、下线或限制账号权限，并留存审计记录。

## 四、内容与知识产权

- 你提交的组队、申请、咨询等内容的知识产权归你所有，你授予平台在站内展示与检索的非独占许可。
- 平台上的官方通知、指南与活动信息由运营或组织提供，未经许可不得批量抓取、镜像或用于商业用途。
- 平台内容涉及的第三方官方网站链接仅作跳转，平台不对其内容的准确性与可用性承担担保。

## 五、活动、招新与组队

- 活动报名遵循“先到先得、容量校验与时间窗控制”原则，报名成功以系统确认与名单为准。
- 组织招新申请通过仅授予普通成员身份，不自动授予负责人或指导老师权限。
- 组队关系由“申请通过”推导，不建立独立的成员操控面板；人数以 `当前人数 = 初始人数 + 已通过数` 实时计算。

## 六、免责与限制

- 平台尽力保证信息准确与可用，但不对因网络、第三方服务或不可抗力导致的服务中断承担责任。
- 公开信息由提供方负责，平台仅作聚合与展示。
- 平台不提供成绩、就业结果或竞赛获奖的保证。

## 七、服务的变更与终止

平台可根据学院安排迭代功能或调整服务范围，重要变更将通过公告提前告知。用户可随时停止使用并申请注销账号。

## 八、争议解决

本条款的解释与执行适用中华人民共和国法律。因本平台产生的争议，优先通过学院与平台运营协商解决。

## 九、联系与反馈

如对服务条款有疑问，请通过“联系我们”或站内咨询与我们联系。
""",
    },
}


def published_site_documents() -> QuerySet[SiteDocument]:
    return SiteDocument.objects.filter(publication_state=SiteDocument.PublicationState.PUBLISHED).order_by("sort_order", "title")


class SiteDocumentListView(PublicReadView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"category"})
        category = parse_optional_enum(request, "category", SiteDocument.Category.values)
        queryset = published_site_documents()
        if category:
            queryset = queryset.filter(category=category)
        items = list(queryset)
        # 若数据库尚无已发布文档，回退至内置静态文档，保证首屏与页脚可用
        if not items:
            fallbacks = list(FALLBACK_SITE_DOCUMENTS.values())
            if category:
                fallbacks = [doc for doc in fallbacks if doc["category"] == category]
            fallbacks_sorted = sorted(fallbacks, key=lambda d: (d.get("sort_order", 0), d["title"]))
            return Response(
                [
                    {
                        "id": f"fallback-{doc['slug']}",
                        "slug": doc["slug"],
                        "title": doc["title"],
                        "category": doc["category"],
                        "summary": doc.get("summary"),
                        "published_at": None,
                        "version": doc.get("version", "1.0"),
                        "updated_at": None,
                    }
                    for doc in fallbacks_sorted
                ]
            )
        if items:
            return Response([serialize_site_document(item, request) for item in items])
        return Response([])


class SiteDocumentDetailView(PublicReadView):
    def get(self, request: Request, slug: str) -> Response:
        validate_query_keys(request, set())
        normalized = slug.strip().lower()
        document = SiteDocument.objects.filter(slug=normalized, publication_state=SiteDocument.PublicationState.PUBLISHED).first()
        if document is not None:
            return Response(serialize_site_document_detail(document, request))
        fallback = FALLBACK_SITE_DOCUMENTS.get(normalized)
        if fallback is not None:
            return Response(
                {
                    "id": f"fallback-{fallback['slug']}",
                    "slug": fallback["slug"],
                    "title": fallback["title"],
                    "category": fallback["category"],
                    "summary": fallback.get("summary"),
                    "body_md": fallback["body_md"],
                    "published_at": None,
                    "version": fallback.get("version", "1.0"),
                    "updated_at": None,
                }
            )
        raise NotFound("文档不存在或未发布")


def _matched_field(item: Any, fields: tuple[str, ...], query: str) -> str:
    lowered = query.lower()
    for field in fields:
        value = getattr(item, field, None)
        if value is not None and lowered in str(value).lower():
            return field
    return fields[0]


class SearchView(PublicReadView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"q", "page", "page_size"})
        query = parse_optional_text(request, "q", max_length=100, required=True)
        assert query is not None
        search_results: list[dict[str, Any]] = []

        def append_results(
            queryset: QuerySet[Any],
            *,
            result_type: str,
            fields: tuple[str, ...],
            path: str,
            subtitle: Callable[[Any], str | None],
        ) -> None:
            for item in filter_text(queryset, query, fields):
                search_results.append(
                    {
                        "type": result_type,
                        "id": str(item.id),
                        "title": getattr(item, fields[0]),
                        "subtitle": subtitle(item),
                        "path": path.format(id=item.id),
                        "matched_field": _matched_field(item, fields, query),
                        "_created_at": item.created_at,
                    }
                )

        append_results(
            published_competitions(),
            result_type="COMPETITION",
            fields=("name", "edition", "direction", "summary"),
            path="/competitions/{id}",
            subtitle=lambda item: f"{item.level} · {item.participation_mode}",
        )
        append_results(
            active_organizations(),
            result_type="ORGANIZATION",
            fields=("name", "short_intro"),
            path="/organizations/{id}",
            subtitle=lambda item: item.organization_type,
        )
        append_results(
            published_recruitments(),
            result_type="RECRUITMENT",
            fields=("title", "intro_md"),
            path="/recruitments/{id}",
            subtitle=lambda item: item.organization.name,
        )
        append_results(
            public_teams(),
            result_type="TEAM_POST",
            fields=("title", "direction"),
            path="/teams/{id}",
            subtitle=lambda item: item.competition.name,
        )
        append_results(
            published_activities(),
            result_type="ACTIVITY",
            fields=("title", "summary"),
            path="/activities/{id}",
            subtitle=lambda item: item.activity_type,
        )
        append_results(
            published_faqs(),
            result_type="FAQ",
            fields=("question",),
            path="/faqs#{id}",
            subtitle=lambda item: item.category,
        )
        append_results(
            published_guides(),
            result_type="GUIDE",
            fields=("title", "summary"),
            path="/guides/{id}",
            subtitle=lambda item: item.category,
        )
        append_results(
            published_announcements(),
            result_type="ANNOUNCEMENT",
            fields=("title", "summary"),
            path="/announcements/{id}",
            subtitle=lambda item: item.publisher_scope,
        )
        # 站点文档（隐私政策、服务条款等）也参与全局搜索
        lowered = query.lower()
        docs_qs = list(published_site_documents())
        if not docs_qs:
            # 回退静态文档
            for data in FALLBACK_SITE_DOCUMENTS.values():
                title = data["title"]
                summary = data.get("summary", "")
                body = data.get("body_md", "")
                if lowered in title.lower() or (summary and lowered in summary.lower()) or lowered in body.lower():
                    search_results.append(
                        {
                            "type": "DOCUMENT",
                            "id": f"fallback-{data['slug']}",
                            "title": title,
                            "subtitle": data["category"],
                            "path": f"/docs/{data['slug']}",
                            "matched_field": "title" if lowered in title.lower() else "body_md",
                            "_created_at": timezone.now(),
                        }
                    )
        else:
            for doc in docs_qs:
                title = getattr(doc, "title", "")
                summary = getattr(doc, "summary", "") or ""
                body = getattr(doc, "body_md", "") or ""
                if lowered in title.lower() or (summary and lowered in summary.lower()) or lowered in body.lower():
                    search_results.append(
                        {
                            "type": "DOCUMENT",
                            "id": str(doc.id),
                            "title": title,
                            "subtitle": doc.category,
                            "path": f"/docs/{doc.slug}",
                            "matched_field": "title" if lowered in title.lower() else "body_md",
                            "_created_at": doc.created_at,
                        }
                    )
        type_order = {
            "COMPETITION": 0,
            "ORGANIZATION": 1,
            "RECRUITMENT": 2,
            "TEAM_POST": 3,
            "ACTIVITY": 4,
            "FAQ": 5,
            "GUIDE": 6,
            "ANNOUNCEMENT": 7,
            "DOCUMENT": 8,
        }
        search_results.sort(key=lambda item: (type_order[item["type"]], -item["_created_at"].timestamp()))
        return paginated_response(
            request,
            search_results,
            lambda item: {key: value for key, value in item.items() if key != "_created_at"},
        )
