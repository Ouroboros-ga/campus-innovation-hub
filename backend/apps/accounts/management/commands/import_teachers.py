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
        # 预解析并全量校验（含 dry-run）
        parsed_rows: list[dict[str, object]] = []
        for idx, row in enumerate(rows, start=2):
            missing = required - {k for k, v in row.items() if (v or "").strip()}
            if missing:
                raise CommandError(f"第 {idx} 行缺必填列：{', '.join(sorted(missing))}")
            employee_no = (row.get("employee_no") or "").strip()
            real_name = (row.get("real_name") or "").strip()
            if not employee_no:
                raise CommandError(f"第 {idx} 行 employee_no 不能为空")
            if not real_name:
                raise CommandError(f"第 {idx} 行 real_name 不能为空")
            if len(employee_no) > 32:
                raise CommandError(f"第 {idx} 行 employee_no 超过 32 字符")
            if len(real_name) > 80:
                raise CommandError(f"第 {idx} 行 real_name 超过 80 字符")
            public_name = (row.get("public_name") or "").strip() or real_name
            if len(public_name) > 80:
                raise CommandError(f"第 {idx} 行 public_name 超过 80 字符")
            department = (row.get("department") or "").strip() or None
            if department and len(department) > 120:
                raise CommandError(f"第 {idx} 行 department 超过 120 字符")
            academic_title = (row.get("academic_title") or "").strip() or None
            if academic_title and len(academic_title) > 80:
                raise CommandError(f"第 {idx} 行 academic_title 超过 80 字符")
            public_email = (row.get("public_email") or "").strip() or None
            if public_email and len(public_email) > 254:
                raise CommandError(f"第 {idx} 行 public_email 超过 254 字符")
            if public_email:
                from django.core.validators import validate_email

                try:
                    validate_email(public_email)
                except Exception as exc:
                    raise CommandError(f"第 {idx} 行 public_email 格式错误：{exc}") from exc
            office_location = (row.get("office_location") or "").strip() or None
            if office_location and len(office_location) > 160:
                raise CommandError(f"第 {idx} 行 office_location 超过 160 字符")
            research_raw = (row.get("research_interests") or row.get("research_interests_json") or "").strip()
            if research_raw:
                try:
                    if research_raw.startswith("["):
                        research = json.loads(research_raw)
                    else:
                        research = [s.strip() for s in research_raw.split(",") if s.strip()]
                except Exception as exc:
                    raise CommandError(f"第 {idx} 行 research_interests 解析失败：{exc}") from exc
                if not isinstance(research, list):
                    raise CommandError(f"第 {idx} 行 research_interests 必须是数组")
                if len(research) > 20:
                    raise CommandError(f"第 {idx} 行 research_interests 最多 20 项")
                for item in research:
                    if not isinstance(item, str) or not item.strip():
                        raise CommandError(f"第 {idx} 行 research_interests 项必须非空字符串")
                    if len(item.strip()) > 40:
                        raise CommandError(f"第 {idx} 行 research_interests 项超过 40 字符")
                if len({s.strip() for s in research}) != len(research):
                    raise CommandError(f"第 {idx} 行 research_interests 不能重复")
                research = [s.strip() for s in research]
            else:
                research = []
            parsed_rows.append(
                {
                    "idx": idx,
                    "employee_no": employee_no,
                    "real_name": real_name,
                    "public_name": public_name,
                    "department": department,
                    "academic_title": academic_title,
                    "public_email": public_email,
                    "office_location": office_location,
                    "research": research,
                    "username": employee_no,
                }
            )

        if options["dry_run"]:
            self.stdout.write(self.style.WARNING(f"dry-run 校验通过，共 {len(parsed_rows)} 行"))
            return

        created = 0
        for item in parsed_rows:
            employee_no = item["employee_no"]  # type: ignore
            real_name = item["real_name"]  # type: ignore
            public_name = item["public_name"]  # type: ignore
            department = item["department"]  # type: ignore
            academic_title = item["academic_title"]  # type: ignore
            public_email = item["public_email"]  # type: ignore
            office_location = item["office_location"]  # type: ignore
            research = item["research"]  # type: ignore

            username = item["username"]  # type: ignore

            # username 唯一冲突检测
            if User.objects.filter(username=username).exclude(employee_no=employee_no).exists():
                raise CommandError(f"employee_no={employee_no} 对应 username 已被占用")

            existing = User.objects.filter(employee_no=employee_no).first()
            if existing:
                # 幂等：补齐 profile，需走模型校验并审计
                profile = getattr(existing, "profile", None)
                if profile:
                    changed = False
                    if public_name and profile.public_name != public_name:
                        profile.public_name = public_name
                        changed = True
                    if department and profile.department != department:
                        profile.department = department
                        changed = True
                    if academic_title and profile.academic_title != academic_title:
                        profile.academic_title = academic_title
                        changed = True
                    if public_email and profile.public_email != public_email:
                        profile.public_email = public_email
                        changed = True
                    if office_location and profile.office_location != office_location:
                        profile.office_location = office_location
                        changed = True
                    if research and profile.research_interests_json != research:
                        profile.research_interests_json = research
                        changed = True
                    if changed:
                        profile.full_clean()
                        profile.save()
                        record_audit(actor=actor, action="TEACHER_UPDATED", target=existing, changes={"employee_no": employee_no})
                self.stdout.write(f"跳过已存在工号 {employee_no}（已补齐资料）")
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
            profile = UserProfile(
                user=user,
                public_name=public_name,
                department=department,
                academic_title=academic_title,
                public_email=public_email,
                office_location=office_location,
                research_interests_json=research,
            )
            profile.full_clean()
            profile.save()
            record_audit(actor=actor, action="TEACHER_IMPORTED", target=user, changes={"employee_no": employee_no})
            created += 1

        self.stdout.write(self.style.SUCCESS(f"教师导入完成，新增 {created} 人，跳过 {len(parsed_rows)-created} 人"))
