from typing import Any

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.accounts.models import User
from apps.organizations.models import OrganizationMembership


class RegisterSerializer(serializers.Serializer):
    student_no = serializers.CharField(min_length=2, max_length=32)
    real_name = serializers.CharField(min_length=1, max_length=80)
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        # 禁止通过注册接口创建教师或提升权限（database-design.md §8.1）
        forbidden = {"identity_type", "employee_no", "platform_role", "is_staff", "is_superuser"}
        unknown = forbidden & set(self.initial_data.keys())  # type: ignore[arg-type]
        if unknown:
            raise serializers.ValidationError({"non_field_errors": [f"不支持字段：{', '.join(sorted(unknown))}"]})
        return attrs

    def validate_password(self, value: str) -> str:
        attributes = self.initial_data
        candidate = User(
            username=str(attributes.get("student_no", "")),
            student_no=str(attributes.get("student_no", "")),
            real_name=str(attributes.get("real_name", "")),
            identity_type=User.IdentityType.STUDENT,
        )
        validate_password(value, user=candidate)
        return value


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=1, max_length=150, help_text="学号或工号")
    password = serializers.CharField(write_only=True, trim_whitespace=False)


def current_user_payload(user: User) -> dict[str, Any]:
    profile = getattr(user, "profile", None)
    # 按身份分区输出（database-design.md §8.2）
    if getattr(user, "identity_type", None) == User.IdentityType.TEACHER:
        profile_payload = {
            "nickname": profile.nickname if profile else None,
            "public_name": getattr(profile, "public_name", None) if profile else None,
            "avatar": None,
            "department": getattr(profile, "department", None) if profile else None,
            "academic_title": getattr(profile, "academic_title", None) if profile else None,
            "public_email": getattr(profile, "public_email", None) if profile else None,
            "office_location": getattr(profile, "office_location", None) if profile else None,
            "bio": profile.bio if profile and profile.bio else "",
            "research_interests": getattr(profile, "research_interests_json", []) if profile else [],
            # 兼容旧字段
            "major": profile.major if profile else None,
            "grade": profile.grade if profile else None,
            "skills": profile.skills_json if profile else [],
        }
    else:
        profile_payload = {
            "nickname": profile.nickname if profile else None,
            "avatar": None,
            "major": profile.major if profile else None,
            "grade": profile.grade if profile else None,
            "bio": profile.bio if profile and profile.bio else "",
            "skills": profile.skills_json if profile else [],
            "public_name": getattr(profile, "public_name", None) if profile else None,
            "department": getattr(profile, "department", None) if profile else None,
            "academic_title": getattr(profile, "academic_title", None) if profile else None,
            "public_email": getattr(profile, "public_email", None) if profile else None,
            "office_location": getattr(profile, "office_location", None) if profile else None,
            "research_interests": getattr(profile, "research_interests_json", []) if profile else [],
        }
    platform_role = "SUPERADMIN" if user.is_superuser else user.platform_role
    memberships = OrganizationMembership.objects.filter(user=user, is_active=True).order_by("organization_id")
    return {
        "user": {
            "id": str(user.id),
            "username": user.username,
            "identity_type": getattr(user, "identity_type", User.IdentityType.STUDENT),
            "student_no": user.student_no,
            "employee_no": getattr(user, "employee_no", None),
            "real_name": user.real_name,
            "platform_role": user.platform_role,
            "is_superuser": user.is_superuser,
            "profile": profile_payload,
        },
        "permissions": {
            "platform_role": platform_role,
            "organization_memberships": [
                {
                    "organization_id": str(membership.organization_id),
                    "role": membership.role,
                    "title": membership.title,
                }
                for membership in memberships
            ],
        },
    }
