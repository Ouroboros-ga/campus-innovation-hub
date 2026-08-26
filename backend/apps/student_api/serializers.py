"""学生写入 DTO 与私有响应投影。"""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from rest_framework import serializers
from rest_framework.request import Request

from apps.activities.models import Registration
from apps.consultations.models import Consultation, Reply
from apps.media.models import MediaAsset
from apps.notifications.models import Notification
from apps.public_api.serializers import actor_summary
from apps.teams.models import TeamApplication, TeamPost


class StrictSerializer(serializers.Serializer):
    """冻结契约不接受未列出的客户端字段。"""

    def to_internal_value(self, data: Any) -> dict[str, Any]:
        if not isinstance(data, Mapping):
            raise serializers.ValidationError({"non_field_errors": ["请求体必须是对象。"]})
        unknown = sorted(set(data) - set(self.fields))
        if unknown:
            raise serializers.ValidationError({"non_field_errors": [f"不支持字段：{', '.join(unknown)}"]})
        return super().to_internal_value(data)


class TeamRoleInputSerializer(StrictSerializer):
    name = serializers.CharField(min_length=1, max_length=60)
    headcount = serializers.IntegerField(min_value=1)
    requirements = serializers.CharField(max_length=1000, required=False, allow_null=True)
    skills = serializers.CharField(max_length=500, required=False, allow_null=True)
    sort_order = serializers.IntegerField(min_value=0, required=False)


class TeamPostCreateSerializer(StrictSerializer):
    competition_id = serializers.UUIDField()
    post_type = serializers.ChoiceField(choices=TeamPost.PostType.values)
    title = serializers.CharField(min_length=4, max_length=120)
    team_name = serializers.CharField(max_length=100, required=False, allow_null=True)
    direction = serializers.CharField(min_length=2, max_length=500)
    members_summary = serializers.CharField(max_length=3000, required=False, allow_null=True)
    base_member_count = serializers.IntegerField(min_value=1)
    target_member_count = serializers.IntegerField(min_value=1)
    goal = serializers.CharField(max_length=3000, required=False, allow_null=True)
    weekly_commitment = serializers.CharField(max_length=200, required=False, allow_null=True)
    contact_method = serializers.ChoiceField(choices=TeamPost.ContactMethod.values)
    contact_value = serializers.CharField(min_length=1, max_length=200)
    notes_md = serializers.CharField(max_length=5000, required=False, allow_null=True)
    roles = TeamRoleInputSerializer(many=True)

    def validate_roles(self, roles: list[dict[str, Any]]) -> list[dict[str, Any]]:
        names: set[str] = set()
        normalised: list[dict[str, Any]] = []
        for index, role in enumerate(roles):
            name = role["name"]
            if name in names:
                raise serializers.ValidationError("岗位名称不能重复。")
            names.add(name)
            normalised.append({**role, "sort_order": role.get("sort_order", index)})
        return normalised

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if attrs["target_member_count"] < attrs["base_member_count"]:
            raise serializers.ValidationError({"target_member_count": ["不能小于基础成员数。"]})
        return attrs


class TeamPostPatchSerializer(TeamPostCreateSerializer):
    competition_id = serializers.UUIDField(required=False)
    post_type = serializers.ChoiceField(choices=TeamPost.PostType.values, required=False)
    title = serializers.CharField(min_length=4, max_length=120, required=False)
    direction = serializers.CharField(min_length=2, max_length=500, required=False)
    base_member_count = serializers.IntegerField(min_value=1, required=False)
    target_member_count = serializers.IntegerField(min_value=1, required=False)
    contact_method = serializers.ChoiceField(choices=TeamPost.ContactMethod.values, required=False)
    contact_value = serializers.CharField(min_length=1, max_length=200, required=False)
    roles = TeamRoleInputSerializer(many=True, required=False)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if not attrs:
            raise serializers.ValidationError({"non_field_errors": ["至少提供一个可编辑字段。"]})
        instance = self.context.get("team")
        base_count = attrs.get("base_member_count", instance.base_member_count if instance else None)
        target_count = attrs.get("target_member_count", instance.target_member_count if instance else None)
        if base_count is not None and target_count is not None and target_count < base_count:
            raise serializers.ValidationError({"target_member_count": ["不能小于基础成员数。"]})
        return attrs


class TeamApplicationWriteSerializer(StrictSerializer):
    desired_role_id = serializers.UUIDField(required=False, allow_null=True)
    self_intro = serializers.CharField(min_length=5, max_length=3000)
    skills = serializers.CharField(max_length=1000, required=False, allow_null=True)
    experience = serializers.CharField(max_length=5000, required=False, allow_null=True)
    motivation = serializers.CharField(min_length=5, max_length=3000)
    weekly_commitment = serializers.CharField(max_length=200, required=False, allow_null=True)
    contact_method = serializers.ChoiceField(choices=TeamPost.ContactMethod.values)
    contact_value = serializers.CharField(min_length=1, max_length=200)


class RecruitmentApplicationWriteSerializer(StrictSerializer):
    position_id = serializers.UUIDField()
    self_intro = serializers.CharField(min_length=5, max_length=3000)
    skills = serializers.CharField(max_length=1000, required=False, allow_null=True)
    experience = serializers.CharField(max_length=5000, required=False, allow_null=True)
    motivation = serializers.CharField(min_length=5, max_length=3000)


class ConsultationWriteSerializer(StrictSerializer):
    category = serializers.ChoiceField(choices=Consultation.Category.values)
    competition_id = serializers.UUIDField(required=False, allow_null=True)
    title = serializers.CharField(min_length=4, max_length=120)
    body_md = serializers.CharField(min_length=10, max_length=5000)
    visibility = serializers.ChoiceField(choices=Consultation.Visibility.values)


class MediaUploadSerializer(StrictSerializer):
    file = serializers.FileField()
    kind = serializers.ChoiceField(choices=MediaAsset.Kind.values)


def serialize_team_application_self(application: TeamApplication) -> dict[str, Any]:
    return {
        "id": str(application.id),
        "team_post_id": str(application.team_post_id),
        "desired_role_id": str(application.desired_role_id) if application.desired_role_id else None,
        "status": application.status,
        "created_at": application.created_at,
        "updated_at": application.updated_at,
    }


def serialize_recruitment_application_self(application: Any) -> dict[str, Any]:
    return {
        "id": str(application.id),
        "recruitment_id": str(application.recruitment_id),
        "position_id": str(application.position_id),
        "status": application.status,
        "created_at": application.created_at,
        "processed_at": application.processed_at,
    }


def serialize_registration_self(registration: Registration) -> dict[str, Any]:
    return {
        "id": str(registration.id),
        "activity_id": str(registration.activity_id),
        "status": registration.status,
        "registered_at": registration.registered_at,
    }


def _serialize_reply(reply: Reply, request: Request) -> dict[str, Any]:
    return {
        "id": str(reply.id),
        "body_md": reply.body_md,
        "author": actor_summary(reply.author, request),
        "created_at": reply.created_at,
    }


def serialize_consultation_detail(consultation: Consultation, request: Request) -> dict[str, Any]:
    return {
        "id": str(consultation.id),
        "category": consultation.category,
        "title": consultation.title,
        "body_md": consultation.body_md,
        "status": consultation.status,
        "answered_at": consultation.answered_at,
        "replies": [_serialize_reply(reply, request) for reply in consultation.replies.all().order_by("created_at")],
    }


def serialize_consultation_self(consultation: Consultation, request: Request) -> dict[str, Any]:
    payload = serialize_consultation_detail(consultation, request)
    payload.update(
        {
            "competition_id": str(consultation.competition_id) if consultation.competition_id else None,
            "visibility": consultation.visibility,
            "created_at": consultation.created_at,
            "updated_at": consultation.updated_at,
        }
    )
    return payload


def serialize_notification(notification: Notification) -> dict[str, Any]:
    action_path = notification.action_path if notification.action_path and notification.action_path.startswith("/") else None
    return {
        "id": str(notification.id),
        "notification_type": notification.notification_type,
        "title": notification.title,
        "body": notification.body,
        "action_path": action_path,
        "read_at": notification.read_at,
        "created_at": notification.created_at,
    }


def serialize_media_upload(asset: MediaAsset, url: str, request: Request) -> dict[str, Any]:
    if url.startswith("/"):
        url = request.build_absolute_uri(url)
    return {
        "id": str(asset.id),
        "url": url,
        "original_name": asset.original_name,
        "mime_type": asset.mime_type,
        "size_bytes": asset.size_bytes,
        "width": asset.width,
        "height": asset.height,
    }
