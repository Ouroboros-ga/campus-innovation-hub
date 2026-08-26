"""BE-020 的已登录学生 HTTP 入口。"""

from __future__ import annotations

from django.utils import timezone
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.activities.models import Activity, Registration
from apps.activities.services import cancel_activity_registration, register_activity
from apps.competitions.models import Competition
from apps.competitions.services import follow_competition, unfollow_competition
from apps.consultations.models import Consultation
from apps.consultations.services import create_consultation
from apps.domain_errors import TimeWindowClosed
from apps.media.models import MediaAsset
from apps.media.services import UnsupportedMedia, create_image_asset
from apps.notifications.models import Notification
from apps.notifications.services import mark_all_notifications_read, mark_notification_read
from apps.organizations.models import Recruitment, RecruitmentApplication, RecruitmentPosition
from apps.organizations.services import create_recruitment_application, withdraw_recruitment_application
from apps.permissions import is_operator
from apps.public_api.query import (
    paginated_response,
    parse_optional_bool,
    parse_optional_enum,
    parse_uuid,
    validate_query_keys,
)
from apps.public_api.serializers import serialize_team_detail
from apps.public_api.views import TeamDetailView as PublicTeamDetailView
from apps.public_api.views import TeamListView as PublicTeamListView
from apps.student_api.serializers import (
    ConsultationWriteSerializer,
    MediaUploadSerializer,
    RecruitmentApplicationWriteSerializer,
    TeamApplicationWriteSerializer,
    TeamPostCreateSerializer,
    TeamPostPatchSerializer,
    serialize_consultation_detail,
    serialize_consultation_self,
    serialize_media_upload,
    serialize_notification,
    serialize_recruitment_application_self,
    serialize_registration_self,
    serialize_team_application_self,
)
from apps.teams.models import TeamApplication, TeamPost, TeamRole
from apps.teams.services import (
    close_team_post,
    create_team_application,
    create_team_post,
    update_team_post,
    withdraw_team_application,
)


class AuthenticatedStudentAPIView(APIView):
    """SessionAuthentication 负责会话与 CSRF，本类只声明学生端的登录门槛。"""

    permission_classes = [IsAuthenticated]


class PublicConsultationAPIView(APIView):
    permission_classes = [AllowAny]


def _empty_body(request: Request) -> None:
    if request.data:
        raise ValidationError({"non_field_errors": ["该操作不接受请求体。"]})


def get_published_competition(object_id: str) -> Competition:
    competition = Competition.objects.filter(
        id=parse_uuid(object_id),
        publication_state=Competition.PublicationState.PUBLISHED,
    ).first()
    if competition is None:
        raise NotFound("竞赛不存在或当前不可用。")
    return competition


def get_team(object_id: str, *, public_only: bool = False) -> TeamPost:
    queryset = TeamPost.objects.select_related(
        "competition", "author", "author__profile", "author__profile__avatar_asset"
    ).prefetch_related("roles")
    if public_only:
        queryset = queryset.filter(competition__publication_state=Competition.PublicationState.PUBLISHED)
    team = queryset.filter(id=parse_uuid(object_id)).first()
    if team is None:
        raise NotFound("组队帖子不存在或当前不可用。")
    return team


def get_recruitment_for_application(object_id: str) -> Recruitment:
    recruitment = Recruitment.objects.select_related("organization").filter(id=parse_uuid(object_id)).first()
    if recruitment is None or not recruitment.organization.is_active:
        raise NotFound("招新不存在或当前不可用。")
    if recruitment.publication_state != Recruitment.PublicationState.PUBLISHED:
        raise NotFound("招新不存在或当前不可用。")
    return recruitment


def get_activity_for_registration(object_id: str) -> Activity:
    activity = Activity.objects.filter(id=parse_uuid(object_id)).first()
    if activity is None:
        raise NotFound("活动不存在。")
    if activity.publication_state not in {Activity.PublicationState.PUBLISHED, Activity.PublicationState.CANCELLED}:
        raise NotFound("活动不存在或当前不可用。")
    return activity


class CompetitionFollowView(AuthenticatedStudentAPIView):
    def post(self, request: Request, object_id: str) -> Response:
        _empty_body(request)
        follow_competition(actor=request.user, competition=get_published_competition(object_id))
        return Response(status=204)

    def delete(self, request: Request, object_id: str) -> Response:
        _empty_body(request)
        unfollow_competition(actor=request.user, competition=get_published_competition(object_id))
        return Response(status=204)


class TeamCollectionView(APIView):
    """同一路径保留公共 GET，并只为 POST 启用登录与 CSRF 要求。"""

    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsAuthenticated()]

    def get(self, request: Request) -> Response:
        return PublicTeamListView().get(request)

    def post(self, request: Request) -> Response:
        serializer = TeamPostCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        team = create_team_post(actor=request.user, payload=serializer.validated_data)
        return Response(serialize_team_detail(team, request), status=201)


class TeamDetailWriteView(APIView):
    """同一路径保留公共详情 GET，并只为 PATCH 启用登录与 CSRF。"""

    def get_permissions(self):
        return [AllowAny()] if self.request.method == "GET" else [IsAuthenticated()]

    def get(self, request: Request, object_id: str) -> Response:
        return PublicTeamDetailView().get(request, object_id)

    def patch(self, request: Request, object_id: str) -> Response:
        team = get_team(object_id)
        serializer = TeamPostPatchSerializer(data=request.data, context={"team": team})
        serializer.is_valid(raise_exception=True)
        updated_team = update_team_post(actor=request.user, team=team, payload=serializer.validated_data)
        return Response(serialize_team_detail(updated_team, request))


class TeamCloseView(AuthenticatedStudentAPIView):
    def post(self, request: Request, object_id: str) -> Response:
        _empty_body(request)
        close_team_post(actor=request.user, team=get_team(object_id))
        return Response(status=204)


class TeamApplicationCreateView(AuthenticatedStudentAPIView):
    def post(self, request: Request, object_id: str) -> Response:
        team = get_team(object_id, public_only=True)
        serializer = TeamApplicationWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        desired_role = None
        desired_role_id = serializer.validated_data.pop("desired_role_id", None)
        if desired_role_id is not None:
            desired_role = TeamRole.objects.filter(id=desired_role_id, team_post=team).first()
            if desired_role is None:
                raise ValidationError({"desired_role_id": ["申请岗位不属于当前组队帖子。"]})
        application = create_team_application(
            actor=request.user,
            team=team,
            payload=serializer.validated_data,
            desired_role=desired_role,
        )
        return Response(serialize_team_application_self(application), status=201)


class TeamApplicationWithdrawView(AuthenticatedStudentAPIView):
    def post(self, request: Request, object_id: str) -> Response:
        _empty_body(request)
        application = TeamApplication.objects.filter(id=parse_uuid(object_id)).first()
        if application is None:
            raise NotFound("组队申请不存在。")
        withdraw_team_application(actor=request.user, application=application)
        return Response(status=204)


class RecruitmentApplicationCreateView(AuthenticatedStudentAPIView):
    def post(self, request: Request, object_id: str) -> Response:
        recruitment = get_recruitment_for_application(object_id)
        serializer = RecruitmentApplicationWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        position_id = serializer.validated_data.pop("position_id")
        position = RecruitmentPosition.objects.filter(id=position_id, recruitment=recruitment).first()
        if position is None:
            raise ValidationError({"position_id": ["申请岗位不属于当前招新。"]})
        application = create_recruitment_application(
            actor=request.user,
            recruitment=recruitment,
            position=position,
            payload=serializer.validated_data,
        )
        return Response(serialize_recruitment_application_self(application), status=201)


class RecruitmentApplicationWithdrawView(AuthenticatedStudentAPIView):
    def post(self, request: Request, object_id: str) -> Response:
        _empty_body(request)
        application = RecruitmentApplication.objects.filter(id=parse_uuid(object_id)).first()
        if application is None:
            raise NotFound("招新申请不存在。")
        withdraw_recruitment_application(actor=request.user, application=application)
        return Response(status=204)


class ActivityRegistrationView(AuthenticatedStudentAPIView):
    def post(self, request: Request, object_id: str) -> Response:
        _empty_body(request)
        activity = get_activity_for_registration(object_id)
        if activity.publication_state == Activity.PublicationState.CANCELLED:
            raise TimeWindowClosed("活动已取消。")
        registration = register_activity(actor=request.user, activity=activity)
        return Response(serialize_registration_self(registration), status=201)


class ActivityRegistrationCancelView(AuthenticatedStudentAPIView):
    def post(self, request: Request, object_id: str) -> Response:
        _empty_body(request)
        activity = get_activity_for_registration(object_id)
        registration = Registration.objects.filter(activity=activity, user=request.user).first()
        if registration is None:
            raise NotFound("当前没有可取消的活动报名。")
        cancel_activity_registration(actor=request.user, registration=registration)
        return Response(status=204)


class ConsultationCollectionView(AuthenticatedStudentAPIView):
    def post(self, request: Request) -> Response:
        serializer = ConsultationWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        consultation = create_consultation(actor=request.user, payload=serializer.validated_data)
        return Response(serialize_consultation_self(consultation, request), status=201)


class ConsultationDetailView(PublicConsultationAPIView):
    def get(self, request: Request, object_id: str) -> Response:
        consultation = (
            Consultation.objects.select_related("author", "author__profile", "author__profile__avatar_asset")
            .prefetch_related("replies__author__profile__avatar_asset")
            .filter(id=parse_uuid(object_id))
            .first()
        )
        if consultation is None:
            raise NotFound("咨询不存在或当前不可见。")
        user = request.user if getattr(request.user, "is_authenticated", False) else None
        if user is not None and consultation.author_id == user.id:
            return Response(serialize_consultation_self(consultation, request))
        if user is not None and is_operator(user):
            return Response(serialize_consultation_detail(consultation, request))
        if consultation.visibility != Consultation.Visibility.PUBLIC or consultation.status == Consultation.Status.OPEN:
            raise NotFound("咨询不存在或当前不可见。")
        return Response(serialize_consultation_detail(consultation, request))


class NotificationListView(AuthenticatedStudentAPIView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, {"unread", "type", "page", "page_size"})
        unread = parse_optional_bool(request, "unread")
        notification_type = parse_optional_enum(request, "type", Notification.NotificationType.values)
        queryset = Notification.objects.filter(recipient=request.user)
        if unread is not None:
            queryset = queryset.filter(read_at__isnull=unread)
        if notification_type is not None:
            queryset = queryset.filter(notification_type=notification_type)
        return paginated_response(request, queryset.order_by("-created_at"), serialize_notification)


class NotificationUnreadCountView(AuthenticatedStudentAPIView):
    def get(self, request: Request) -> Response:
        validate_query_keys(request, set())
        return Response({"count": Notification.objects.filter(recipient=request.user, read_at__isnull=True).count()})


class NotificationReadView(AuthenticatedStudentAPIView):
    def post(self, request: Request, object_id: str) -> Response:
        _empty_body(request)
        notification = Notification.objects.filter(id=parse_uuid(object_id)).first()
        if notification is None:
            raise NotFound("消息不存在。")
        mark_notification_read(actor=request.user, notification=notification)
        return Response(status=204)


class NotificationReadAllView(AuthenticatedStudentAPIView):
    def post(self, request: Request) -> Response:
        _empty_body(request)
        mark_all_notifications_read(actor=request.user)
        return Response(status=204)


class MediaUploadView(AuthenticatedStudentAPIView):
    def post(self, request: Request) -> Response:
        serializer = MediaUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if serializer.validated_data["kind"] != MediaAsset.Kind.IMAGE:
            raise UnsupportedMedia("V0.1 暂不支持文档上传。")
        uploaded = serializer.validated_data["file"]
        asset, url = create_image_asset(
            actor=request.user,
            file=uploaded,
            original_name=uploaded.name,
            content_type=uploaded.content_type,
        )
        return Response(serialize_media_upload(asset, url, request), status=201)
