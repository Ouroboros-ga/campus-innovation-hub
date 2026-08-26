from typing import Any

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from apps.accounts.models import User


class RegisterSerializer(serializers.Serializer):
    student_no = serializers.CharField(min_length=2, max_length=32)
    real_name = serializers.CharField(min_length=1, max_length=80)
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_password(self, value: str) -> str:
        attributes = self.initial_data
        candidate = User(
            username=str(attributes.get("student_no", "")),
            student_no=str(attributes.get("student_no", "")),
            real_name=str(attributes.get("real_name", "")),
        )
        validate_password(value, user=candidate)
        return value


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=1, max_length=150)
    password = serializers.CharField(write_only=True, trim_whitespace=False)


def current_user_payload(user: User) -> dict[str, Any]:
    profile = getattr(user, "profile", None)
    profile_payload = {
        "nickname": profile.nickname if profile else None,
        "avatar": None,
        "major": profile.major if profile else None,
        "grade": profile.grade if profile else None,
        "bio": profile.bio if profile and profile.bio else "",
        "skills": profile.skills_json if profile else [],
    }
    platform_role = "SUPERADMIN" if user.is_superuser else user.platform_role
    return {
        "user": {
            "id": str(user.id),
            "username": user.username,
            "student_no": user.student_no,
            "real_name": user.real_name,
            "platform_role": user.platform_role,
            "is_superuser": user.is_superuser,
            "profile": profile_payload,
        },
        "permissions": {
            "platform_role": platform_role,
            "organization_memberships": [],
        },
    }
