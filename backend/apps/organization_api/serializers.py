"""组织负责人 API 的严格请求 DTO 与内部响应投影。"""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from django.db.models import Count, Q, QuerySet
from rest_framework import serializers
from rest_framework.request import Request

from apps.media.models import MediaAsset
from apps.organizations.models import Organization, Recruitment, RecruitmentApplication, RecruitmentPosition
from apps.public_api.serializers import actor_summary, media_ref, recruitment_application_state, serialize_recruitment_detail


class StrictSerializer(serializers.Serializer):
    """冻结管理契约不接受未声明字段，避免客户端写入内部状态。"""

    def to_internal_value(self, data: Any) -> dict[str, Any]:
        if not isinstance(data, Mapping):
            raise serializers.ValidationError({"non_field_errors": ["请求体必须是对象。"]})
        unknown = sorted(set(data) - set(self.fields))
        if unknown:
            raise serializers.ValidationError({"non_field_errors": [f"不支持字段：{', '.join(unknown)}"]})
        return super().to_internal_value(data)


class OrganizationProfilePatchSerializer(StrictSerializer):
    short_intro = serializers.CharField(max_length=200, required=False, allow_null=True, allow_blank=True)
    description_md = serializers.CharField(max_length=10000, required=False, allow_null=True, allow_blank=True)
    logo_asset_id = serializers.UUIDField(required=False, allow_null=True)
    banner_asset_id = serializers.UUIDField(required=False, allow_null=True)
    public_contact = serializers.CharField(max_length=200, required=False, allow_null=True, allow_blank=True)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if not attrs:
            raise serializers.ValidationError({"non_field_errors": ["至少提供一个可编辑字段。"]})
        for field in ("logo_asset_id", "banner_asset_id"):
            asset_id = attrs.get(field)
            if asset_id is not None and not MediaAsset.objects.filter(
                id=asset_id,
                kind=MediaAsset.Kind.IMAGE,
                status=MediaAsset.Status.ACTIVE,
            ).exists():
                raise serializers.ValidationError({field: ["必须引用可用的图片 MediaAsset。"]})
        return attrs


class RecruitmentPositionInputSerializer(StrictSerializer):
    id = serializers.UUIDField(required=False)
    name = serializers.CharField(min_length=1, max_length=60)
    headcount = serializers.IntegerField(min_value=1)
    description_md = serializers.CharField(max_length=3000, required=False, allow_null=True, allow_blank=True)
    requirements_md = serializers.CharField(max_length=3000, required=False, allow_null=True, allow_blank=True)
    sort_order = serializers.IntegerField(min_value=0, required=False)


class _RecruitmentWriteBase(StrictSerializer):
    title = serializers.CharField(min_length=2, max_length=120)
    intro_md = serializers.CharField(min_length=1, max_length=10000)
    apply_start_at = serializers.DateTimeField(required=False, allow_null=True)
    apply_end_at = serializers.DateTimeField()
    target_grade_min = serializers.IntegerField(min_value=1, max_value=4, required=False, allow_null=True)
    target_grade_max = serializers.IntegerField(min_value=1, max_value=4, required=False, allow_null=True)
    notes_md = serializers.CharField(max_length=5000, required=False, allow_null=True, allow_blank=True)
    positions = RecruitmentPositionInputSerializer(many=True)

    def validate_positions(self, positions: list[dict[str, Any]]) -> list[dict[str, Any]]:
        names: set[str] = set()
        ids: set[object] = set()
        normalised: list[dict[str, Any]] = []
        for index, position in enumerate(positions):
            if position["name"] in names:
                raise serializers.ValidationError("岗位名称不能重复。")
            names.add(position["name"])
            position_id = position.get("id")
            if position_id is not None:
                if position_id in ids:
                    raise serializers.ValidationError("岗位 id 不能重复。")
                ids.add(position_id)
            normalised.append({**position, "sort_order": position.get("sort_order", index)})
        return normalised

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        recruitment = self.context.get("recruitment")
        min_grade = attrs.get("target_grade_min", getattr(recruitment, "target_grade_min", None))
        max_grade = attrs.get("target_grade_max", getattr(recruitment, "target_grade_max", None))
        if (min_grade is None) != (max_grade is None):
            raise serializers.ValidationError({"target_grade_min": ["目标年级上下限必须同时填写或同时为空。"]})
        if min_grade is not None and max_grade is not None and min_grade > max_grade:
            raise serializers.ValidationError({"target_grade_min": ["目标年级下限不能大于上限。"]})
        apply_start_at = attrs.get("apply_start_at", getattr(recruitment, "apply_start_at", None))
        apply_end_at = attrs.get("apply_end_at", getattr(recruitment, "apply_end_at", None))
        if apply_start_at is not None and apply_end_at is not None and apply_start_at > apply_end_at:
            raise serializers.ValidationError({"apply_start_at": ["开始时间不能晚于截止时间。"]})
        return attrs


class RecruitmentCreateSerializer(_RecruitmentWriteBase):
    pass


class RecruitmentPatchSerializer(_RecruitmentWriteBase):
    title = serializers.CharField(min_length=2, max_length=120, required=False)
    intro_md = serializers.CharField(min_length=1, max_length=10000, required=False)
    apply_end_at = serializers.DateTimeField(required=False)
    positions = RecruitmentPositionInputSerializer(many=True, required=False)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if not attrs:
            raise serializers.ValidationError({"non_field_errors": ["至少提供一个可编辑字段。"]})
        return super().validate(attrs)


def management_recruitments(queryset: QuerySet[Recruitment]) -> QuerySet[Recruitment]:
    return queryset.annotate(
        pending_count=Count("applications", filter=Q(applications__status=RecruitmentApplication.Status.PENDING)),
        accepted_count=Count("applications", filter=Q(applications__status=RecruitmentApplication.Status.ACCEPTED)),
        rejected_count=Count("applications", filter=Q(applications__status=RecruitmentApplication.Status.REJECTED)),
        withdrawn_count=Count("applications", filter=Q(applications__status=RecruitmentApplication.Status.WITHDRAWN)),
    )


def serialize_organization_management_profile(organization: Organization, request: Request) -> dict[str, Any]:
    return {
        "id": str(organization.id),
        "name": organization.name,
        "organization_type": organization.organization_type,
        "short_intro": organization.short_intro,
        "description_md": organization.description_md,
        "logo": media_ref(organization.logo_asset, request),
        "banner": media_ref(organization.banner_asset, request),
        "public_contact": organization.public_contact,
        "is_active": organization.is_active,
        "created_at": organization.created_at,
        "updated_at": organization.updated_at,
    }


def serialize_recruitment_management(recruitment: Recruitment, request: Request) -> dict[str, Any]:
    payload = serialize_recruitment_detail(recruitment, request)
    payload.update(
        {
            "publication_state": recruitment.publication_state,
            "completed_at": recruitment.completed_at,
            "application_counts": {
                "pending_count": getattr(recruitment, "pending_count", 0),
                "accepted_count": getattr(recruitment, "accepted_count", 0),
                "rejected_count": getattr(recruitment, "rejected_count", 0),
                "withdrawn_count": getattr(recruitment, "withdrawn_count", 0),
            },
            "created_at": recruitment.created_at,
            "updated_at": recruitment.updated_at,
        }
    )
    return payload


def serialize_recruitment_application_management(application: RecruitmentApplication, request: Request) -> dict[str, Any]:
    return {
        "id": str(application.id),
        "applicant": actor_summary(application.applicant, request),
        "recruitment_id": str(application.recruitment_id),
        "position_id": str(application.position_id),
        "position_name": application.position.name,
        "self_intro": application.self_intro,
        "skills": application.skills,
        "experience": application.experience,
        "motivation": application.motivation,
        "status": application.status,
        "processed_by_id": str(application.processed_by_id) if application.processed_by_id else None,
        "processed_at": application.processed_at,
        "created_at": application.created_at,
    }
