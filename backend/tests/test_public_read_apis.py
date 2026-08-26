"""BE-010：公开读取接口的端到端契约测试。"""

from __future__ import annotations

import uuid
from collections.abc import Iterator
from datetime import timedelta
from typing import Any

from django.test import SimpleTestCase, TestCase
from django.utils import timezone

from apps.accounts.models import User, UserProfile
from apps.activities.models import Activity, Registration
from apps.competitions.models import Competition, Follow, TimelineEvent
from apps.content.models import Announcement, FaqItem, GuideArticle, GuideCompetition, HomepageBanner
from apps.media.models import MediaAsset
from apps.media.storage import LocalStorageBackend, S3CompatibleStorageBackend, get_object_storage
from apps.organizations.models import Organization, OrganizationMembership, Recruitment, RecruitmentPosition
from apps.teams.models import TeamApplication, TeamPost, TeamRole


def walk_keys(value: object) -> Iterator[str]:
    if isinstance(value, dict):
        for key, child in value.items():
            yield key
            yield from walk_keys(child)
    elif isinstance(value, list):
        for child in value:
            yield from walk_keys(child)


class PublicReadApiFixtureMixin:
    def create_user(self, suffix: str) -> User:
        user = User.objects.create_user(
            username=f"2026{suffix}",
            student_no=f"2026{suffix}",
            real_name=f"测试用户{suffix}",
            password="SafePassword123!",
        )
        UserProfile.objects.create(user=user, nickname=f"同学{suffix}", major="人工智能", grade=2)
        return user

    def setUp(self) -> None:
        super().setUp()
        self.now = timezone.now()
        self.author = self.create_user("0001")
        self.viewer = self.create_user("0002")
        self.asset = MediaAsset.objects.create(
            created_by=self.author,
            kind=MediaAsset.Kind.IMAGE,
            object_key="public/cover-secret.webp",
            original_name="cover.webp",
            mime_type="image/webp",
            size_bytes=128,
            sha256="a" * 64,
        )
        self.competition = Competition.objects.create(
            name="公开人工智能竞赛",
            edition="2026",
            category=Competition.Category.AI,
            level=Competition.Level.NATIONAL,
            participation_mode=Competition.ParticipationMode.TEAM,
            description_md="公开竞赛介绍",
            registration_start_at=self.now - timedelta(days=1),
            registration_end_at=self.now + timedelta(days=5),
            event_start_at=self.now + timedelta(days=10),
            cover_asset=self.asset,
            publication_state=Competition.PublicationState.PUBLISHED,
            is_featured=True,
            created_by=self.author,
            updated_by=self.author,
        )
        TimelineEvent.objects.create(
            competition=self.competition,
            title="报名开始",
            event_at=self.now,
            sort_order=0,
        )
        self.organization = Organization.objects.create(
            name="公开人工智能协会",
            organization_type=Organization.OrganizationType.STUDENT_CLUB,
            short_intro="公开组织简介",
            description_md="公开组织详情",
            logo_asset=self.asset,
            banner_asset=self.asset,
            is_active=True,
            created_by=self.author,
            updated_by=self.author,
        )
        self.recruitment = Recruitment.objects.create(
            organization=self.organization,
            title="公开招新",
            intro_md="欢迎加入公开组织",
            apply_start_at=self.now - timedelta(days=1),
            apply_end_at=self.now + timedelta(days=5),
            publication_state=Recruitment.PublicationState.PUBLISHED,
            created_by=self.author,
            updated_by=self.author,
        )
        RecruitmentPosition.objects.create(recruitment=self.recruitment, name="开发", headcount=2, sort_order=0)
        self.team = TeamPost.objects.create(
            competition=self.competition,
            author=self.author,
            post_type=TeamPost.PostType.TEAM_RECRUITING,
            title="寻找公开算法队友",
            direction="多模态算法",
            base_member_count=1,
            target_member_count=3,
            contact_method=TeamPost.ContactMethod.EMAIL,
            contact_value="private@example.edu",
        )
        role = TeamRole.objects.create(team_post=self.team, name="算法", headcount=1, sort_order=0)
        TeamApplication.objects.create(
            team_post=self.team,
            desired_role=role,
            applicant=self.viewer,
            self_intro="我有公开的竞赛经验",
            motivation="希望共同完成项目",
            contact_method=TeamPost.ContactMethod.EMAIL,
            contact_value="viewer-private@example.edu",
            status=TeamApplication.Status.ACCEPTED,
        )
        self.activity = Activity.objects.create(
            title="公开技术分享会",
            activity_type=Activity.ActivityType.TECH_SHARING,
            summary="公开活动简介",
            description_md="公开活动详情",
            location="学院报告厅",
            start_at=self.now + timedelta(days=2),
            registration_required=True,
            registration_start_at=self.now - timedelta(days=1),
            registration_end_at=self.now + timedelta(days=1),
            capacity=20,
            cover_asset=self.asset,
            publication_state=Activity.PublicationState.PUBLISHED,
            created_by=self.author,
            updated_by=self.author,
        )
        Registration.objects.create(
            activity=self.activity,
            user=self.viewer,
            name_snapshot=self.viewer.real_name,
            student_no_snapshot=self.viewer.student_no,
        )
        self.guide = GuideArticle.objects.create(
            title="公开竞赛指南",
            category=GuideArticle.Category.COMPETITION,
            summary="公开指南摘要",
            body_md="公开指南正文",
            publication_state=GuideArticle.PublicationState.PUBLISHED,
            is_featured=True,
            created_by=self.author,
            updated_by=self.author,
        )
        GuideCompetition.objects.create(guide=self.guide, competition=self.competition, sort_order=0)
        self.faq = FaqItem.objects.create(
            category=FaqItem.Category.COMPETITION,
            question="公开常见问题？",
            answer_md="公开常见问题答案",
            publication_state=FaqItem.PublicationState.PUBLISHED,
            is_featured=True,
            created_by=self.author,
            updated_by=self.author,
        )
        self.announcement = Announcement.objects.create(
            title="公开学院公告",
            summary="公开公告摘要",
            body_md="公开公告正文",
            publication_state=Announcement.PublicationState.PUBLISHED,
            published_at=self.now,
            is_pinned=True,
            publisher_scope=Announcement.PublisherScope.ACADEMY,
            competition=self.competition,
            created_by=self.author,
            updated_by=self.author,
        )
        HomepageBanner.objects.create(
            title="公开首页轮播",
            image_asset=self.asset,
            is_active=True,
            created_by=self.author,
            updated_by=self.author,
        )


class PublicReadApiTests(PublicReadApiFixtureMixin, TestCase):
    def test_every_public_list_and_detail_route_returns_the_published_record(self) -> None:
        list_expectations = {
            "/api/competitions": self.competition.id,
            "/api/organizations": self.organization.id,
            f"/api/organizations/{self.organization.id}/recruitments": self.recruitment.id,
            "/api/teams": self.team.id,
            "/api/activities": self.activity.id,
            "/api/guides": self.guide.id,
            "/api/faqs": self.faq.id,
            "/api/announcements": self.announcement.id,
        }
        for path, expected_id in list_expectations.items():
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 200)
                self.assertIn(str(expected_id), [item["id"] for item in response.json()["results"]])

        detail_paths = (
            f"/api/competitions/{self.competition.id}",
            f"/api/organizations/{self.organization.id}",
            f"/api/recruitments/{self.recruitment.id}",
            f"/api/teams/{self.team.id}",
            f"/api/activities/{self.activity.id}",
            f"/api/guides/{self.guide.id}",
            f"/api/announcements/{self.announcement.id}",
        )
        for path in detail_paths:
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 200)

    def test_home_is_fixed_limit_read_model_and_does_not_leak_media_metadata(self) -> None:
        for number in range(7):
            Competition.objects.create(
                name=f"首页限数竞赛{number}",
                edition="2026",
                category=Competition.Category.AI,
                level=Competition.Level.SCHOOL,
                participation_mode=Competition.ParticipationMode.INDIVIDUAL,
                description_md="首页竞赛",
                registration_end_at=self.now + timedelta(days=number + 1),
                publication_state=Competition.PublicationState.PUBLISHED,
                created_by=self.author,
                updated_by=self.author,
            )
        response = self.client.get("/api/home")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(
            set(payload),
            {
                "banners",
                "deadlines",
                "featured_competitions",
                "announcements",
                "featured_guides",
                "team_posts",
                "recruiting_organizations",
                "activities",
                "faqs",
            },
        )
        self.assertLessEqual(len(payload["deadlines"]), 6)
        self.assertLessEqual(len(payload["featured_competitions"]), 8)
        self.assertNotIn("object_key", set(walk_keys(payload)))

    def test_detail_ids_are_strict_uuid_and_unknown_or_hidden_resources_are_not_found(self) -> None:
        invalid_paths = (
            "/api/competitions/not-a-uuid",
            "/api/organizations/not-a-uuid",
            "/api/organizations/not-a-uuid/recruitments",
            "/api/recruitments/not-a-uuid",
            "/api/teams/not-a-uuid",
            "/api/activities/not-a-uuid",
            "/api/guides/not-a-uuid",
            "/api/announcements/not-a-uuid",
        )
        for path in invalid_paths:
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 400)
                self.assertEqual(response.json()["code"], "VALIDATION_ERROR")

        unknown_paths = tuple(path.rsplit("/", 1)[0] + f"/{uuid.uuid4()}" for path in (
            f"/api/competitions/{self.competition.id}",
            f"/api/organizations/{self.organization.id}",
            f"/api/recruitments/{self.recruitment.id}",
            f"/api/teams/{self.team.id}",
            f"/api/activities/{self.activity.id}",
            f"/api/guides/{self.guide.id}",
            f"/api/announcements/{self.announcement.id}",
        ))
        unknown_paths += (f"/api/organizations/{uuid.uuid4()}/recruitments",)
        for path in unknown_paths:
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 404)
                self.assertEqual(response.json()["code"], "NOT_FOUND")

    def test_drafts_inactive_organizations_and_private_contacts_are_never_public(self) -> None:
        draft_competition = Competition.objects.create(
            name="草稿隐私竞赛",
            edition="2026",
            category=Competition.Category.AI,
            level=Competition.Level.SCHOOL,
            participation_mode=Competition.ParticipationMode.TEAM,
            description_md="草稿内容",
            created_by=self.author,
            updated_by=self.author,
        )
        inactive_organization = Organization.objects.create(
            name="停用隐私组织",
            organization_type=Organization.OrganizationType.STUDENT_CLUB,
            is_active=False,
            created_by=self.author,
            updated_by=self.author,
        )
        draft_guide = GuideArticle.objects.create(
            title="草稿隐私指南",
            category=GuideArticle.Category.OTHER,
            body_md="草稿正文",
            created_by=self.author,
            updated_by=self.author,
        )
        draft_recruitment = Recruitment.objects.create(
            organization=self.organization,
            title="草稿隐私招新",
            intro_md="草稿招新内容",
            apply_end_at=self.now + timedelta(days=7),
            created_by=self.author,
            updated_by=self.author,
        )
        draft_activity = Activity.objects.create(
            title="草稿隐私活动",
            activity_type=Activity.ActivityType.OTHER,
            description_md="草稿活动内容",
            location="未公开地点",
            start_at=self.now + timedelta(days=3),
            created_by=self.author,
            updated_by=self.author,
        )
        draft_announcement = Announcement.objects.create(
            title="草稿隐私公告",
            body_md="草稿公告正文",
            publisher_scope=Announcement.PublisherScope.PLATFORM,
            created_by=self.author,
            updated_by=self.author,
        )
        draft_faq = FaqItem.objects.create(
            category=FaqItem.Category.OTHER,
            question="草稿隐私 FAQ？",
            answer_md="草稿答案",
            created_by=self.author,
            updated_by=self.author,
        )
        draft_competition_team = TeamPost.objects.create(
            competition=draft_competition,
            author=self.author,
            post_type=TeamPost.PostType.PERSON_LOOKING,
            title="草稿竞赛关联组队",
            direction="未公开方向",
            base_member_count=1,
            target_member_count=2,
            contact_method=TeamPost.ContactMethod.EMAIL,
            contact_value="hidden@example.edu",
        )

        for path in (
            f"/api/competitions/{draft_competition.id}",
            f"/api/organizations/{inactive_organization.id}",
            f"/api/guides/{draft_guide.id}",
            f"/api/recruitments/{draft_recruitment.id}",
            f"/api/teams/{draft_competition_team.id}",
            f"/api/activities/{draft_activity.id}",
            f"/api/announcements/{draft_announcement.id}",
        ):
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 404)

        hidden_list_expectations = {
            "/api/competitions": str(draft_competition.id),
            "/api/organizations": str(inactive_organization.id),
            f"/api/organizations/{self.organization.id}/recruitments": str(draft_recruitment.id),
            "/api/teams?status=RECRUITING": str(draft_competition_team.id),
            "/api/activities": str(draft_activity.id),
            "/api/guides": str(draft_guide.id),
            "/api/faqs": str(draft_faq.id),
            "/api/announcements": str(draft_announcement.id),
        }
        for path, hidden_value in hidden_list_expectations.items():
            with self.subTest(path=path):
                payload = self.client.get(path).json()["results"]
                self.assertNotIn(hidden_value, [item["id"] for item in payload])

        self.assertEqual(self.client.get("/api/search", {"q": "草稿隐私"}).json()["count"], 0)

        team_payload = self.client.get(f"/api/teams/{self.team.id}").json()
        self.assertNotIn("contact_method", team_payload)
        self.assertNotIn("contact_value", team_payload)
        self.assertNotIn("student_no", set(walk_keys(team_payload)))
        self.assertNotIn("real_name", set(walk_keys(team_payload)))

    def test_login_sensitive_read_flags_are_only_available_to_authenticated_user(self) -> None:
        guest_competition = self.client.get(f"/api/competitions/{self.competition.id}").json()
        guest_activity = self.client.get(f"/api/activities/{self.activity.id}").json()
        self.assertIsNone(guest_competition["followed"])
        self.assertIsNone(guest_activity["registered"])
        self.assertIsNone(guest_activity["registered_count"])

        Follow.objects.create(user=self.viewer, competition=self.competition)
        self.client.force_login(self.viewer)
        competition_payload = self.client.get(f"/api/competitions/{self.competition.id}").json()
        activity_payload = self.client.get(f"/api/activities/{self.activity.id}").json()
        organization_payload = self.client.get(f"/api/organizations/{self.organization.id}").json()
        self.assertTrue(competition_payload["followed"])
        self.assertTrue(activity_payload["registered"])
        self.assertEqual(activity_payload["registered_count"], 1)
        self.assertFalse(organization_payload["is_leader"])

    def test_pagination_filters_ordering_and_search_reject_invalid_input(self) -> None:
        response = self.client.get("/api/competitions", {"page_size": "101"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["code"], "VALIDATION_ERROR")
        response = self.client.get("/api/competitions", {"ordering": "name"})
        self.assertEqual(response.status_code, 400)
        response = self.client.get("/api/organizations", {"recruiting": "maybe"})
        self.assertEqual(response.status_code, 400)
        response = self.client.get("/api/search", {"q": ""})
        self.assertEqual(response.status_code, 400)
        response = self.client.get("/api/search", {"q": "x" * 101})
        self.assertEqual(response.status_code, 400)
        response = self.client.get("/api/search", {"q": "公开"})
        self.assertEqual(response.status_code, 200)
        self.assertIn("COMPETITION", [item["type"] for item in response.json()["results"]])


class PublicReadApiEmptyTests(TestCase):
    def test_every_public_list_and_home_returns_a_contract_empty_shape(self) -> None:
        for path in (
            "/api/competitions",
            "/api/organizations",
            "/api/teams",
            "/api/activities",
            "/api/guides",
            "/api/faqs",
            "/api/announcements",
            "/api/search?q=anything",
        ):
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.json()["count"], 0)
                self.assertEqual(response.json()["results"], [])

        response = self.client.get("/api/home")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(all(value == [] for value in response.json().values()))

    def test_active_organization_without_recruitments_has_an_empty_recruitment_page(self) -> None:
        actor = User.objects.create_user(username="empty-org", real_name="空组织管理员", password="SafePassword123!")
        organization = Organization.objects.create(
            name="空公开组织",
            organization_type=Organization.OrganizationType.OTHER,
            is_active=True,
            created_by=actor,
            updated_by=actor,
        )

        response = self.client.get(f"/api/organizations/{organization.id}/recruitments")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)
        self.assertEqual(response.json()["results"], [])


class MediaStorageUrlTests(SimpleTestCase):
    def tearDown(self) -> None:
        get_object_storage.cache_clear()
        super().tearDown()

    def test_local_and_s3_backends_publish_encoded_urls_without_exposing_metadata_fields(self) -> None:
        local = LocalStorageBackend(root=self._test_media_root(), public_base_url="/media/")
        s3 = S3CompatibleStorageBackend("https://oss.example.edu/campus-media")

        self.assertEqual(local.public_url("covers/竞赛 封面.webp"), "/media/covers/%E7%AB%9E%E8%B5%9B%20%E5%B0%81%E9%9D%A2.webp")
        self.assertEqual(s3.public_url("covers/cover.webp"), "https://oss.example.edu/campus-media/covers/cover.webp")

    def test_storage_rejects_object_key_path_escape(self) -> None:
        storage = LocalStorageBackend(root=self._test_media_root(), public_base_url="/media/")

        with self.assertRaises(ValueError):
            storage.public_url("../private-secret.webp")

    def _test_media_root(self):
        from pathlib import Path

        return Path("C:/temp/campus-be010-media")
