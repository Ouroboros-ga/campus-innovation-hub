"""受控导入教师（SUPERADMIN 专属，不开放自助）。CSV 列：employee_no,real_name,public_name,department,academic_title,public_email,office_location,research_interests"""

from __future__ import annotations

import csv
import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.accounts.models import User, UserProfile
from apps.audit.services import record_audit


class Command(BaseCommand):
    help = "受控导入教师：CSV 导入 identity_type=TEACHER 账号（仅 SUPERADMIN 执行，不开放自助注册）。"

    def add_arguments(self, parser):
        parser.add_argument("--csv", required=True, help="CSV 文件路径")
        parser.add_argument("--actor", required=False, help="执行者 username（用于 AuditLog），默认超管")
        parser.add_argument("--dry-run", action="store_true", help="仅校验不写入")

    @transaction.atomic
    def handle(self, *args, **options):
        csv_path = Path(options["csv"])
        if not csv_path.exists():
            raise CommandError(f"CSV 不存在：{csv_path}")
        actor_username = options.get("actor")
        if actor_username:
            actor = User.objects.filter(username=actor_username).first()
            if actor is None or not actor.is_superuser:
                raise CommandError("actor 必须是 SUPERADMIN 账号")
        else:
            actor = User.objects.filter(is_superuser=True).first()
            if actor is None:
                raise CommandError("未找到 SUPERADMIN 账号，请先创建")

        rows = list(csv.DictReader(csv_path.read_text(encoding="utf-8-sig").splitlines()))
        if not rows:
            raise CommandError("CSV 为空")

        required = {"employee_no", "real_name"}
        for idx, row in enumerate(rows, start=2):
            missing = required - {k for k, v in row.items() if (v or "").strip()}
            if missing:
                raise CommandError(f"第 {idx} 行缺必填列：{', '.join(sorted(missing))}")
            if not (row.get("employee_no") or "").strip():
                raise CommandError(f"第 {idx} 行 employee_no 不能为空")
            if not (row.get("real_name") or "").strip():
                raise CommandError(f"第 {idx} 行 real_name 不能为空")

        if options["dry_run"]:
            self.stdout.write(self.style.WARNING(f"dry-run 校验通过，共 {len(rows)} 行"))
            return

        created = 0
        for row in rows:
            employee_no = row["employee_no"].strip()
            real_name = row["real_name"].strip()
            public_name = (row.get("public_name") or "").strip() or real_name
            department = (row.get("department") or "").strip() or None
            academic_title = (row.get("academic_title") or "").strip() or None
            public_email = (row.get("public_email") or "").strip() or None
            office_location = (row.get("office_location") or "").strip() or None
            research_raw = (row.get("research_interests") or row.get("research_interests_json") or "").strip()
            if research_raw:
                try:
                    # 支持 JSON 数组或逗号分隔
                    if research_raw.startswith("["):
                        research = json.loads(research_raw)
                    else:
                        research = [s.strip() for s in research_raw.split(",") if s.strip()]
                except Exception as exc:
                    raise CommandError(f"employee_no={employee_no} research_interests 解析失败：{exc}") from exc
            else:
                research = []

            username = employee_no  # 工号即 username

            existing = User.objects.filter(employee_no=employee_no).first()
            if existing:
                # 幂等：补齐 profile
                profile = getattr(existing, "profile", None)
                if profile:
                    profile.public_name = public_name or profile.public_name
                    profile.department = department or profile.department
                    profile.academic_title = academic_title or profile.academic_title
                    profile.public_email = public_email or profile.public_email
                    profile.office_location = office_location or profile.office_location
                    if research:
                        profile.research_interests_json = research
                    profile.save()
                self.stdout.write(f"跳过已存在工号 {employee_no}")
                continue

            user = User(
                username=username,
                identity_type=User.IdentityType.TEACHER,
                employee_no=employee_no,
                student_no=None,
                real_name=real_name,
                platform_role=User.PlatformRole.USER,
                is_active=True,
            )
            user.set_unusable_password()
            user.full_clean()
            user.save()
            UserProfile.objects.create(
                user=user,
                public_name=public_name,
                department=department,
                academic_title=academic_title,
                public_email=public_email,
                office_location=office_location,
                research_interests_json=research,
            )
            record_audit(actor=actor, action="TEACHER_IMPORTED", target=user, changes={"employee_no": employee_no})
            created += 1

        self.stdout.write(self.style.SUCCESS(f"教师导入完成，新增 {created} 人，跳过 {len(rows)-created} 人"))
