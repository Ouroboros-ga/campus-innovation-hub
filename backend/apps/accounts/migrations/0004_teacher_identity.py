# Generated for teacher identity baseline (database-design.md §8).
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("accounts", "0003_auth_throttle")]

    operations = [
        migrations.AddField(
            model_name="user",
            name="identity_type",
            field=models.CharField(
                choices=[("STUDENT", "学生"), ("TEACHER", "教师")],
                default="STUDENT",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="employee_no",
            field=models.CharField(blank=True, max_length=32, null=True),
        ),
        migrations.AlterField(
            model_name="user",
            name="platform_role",
            field=models.CharField(
                choices=[("USER", "普通用户"), ("OPERATOR", "运营人员")],
                default="USER",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="public_name",
            field=models.CharField(blank=True, max_length=80, null=True),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="department",
            field=models.CharField(blank=True, max_length=120, null=True),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="academic_title",
            field=models.CharField(blank=True, max_length=80, null=True),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="public_email",
            field=models.EmailField(blank=True, max_length=254, null=True),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="office_location",
            field=models.CharField(blank=True, max_length=160, null=True),
        ),
        migrations.AddField(
            model_name="userprofile",
            name="research_interests_json",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddConstraint(
            model_name="user",
            constraint=models.UniqueConstraint(
                condition=models.Q(("employee_no__isnull", False)),
                fields=("employee_no",),
                name="accounts_user_employee_no_unique",
            ),
        ),
        migrations.AddIndex(
            model_name="user",
            index=models.Index(fields=["identity_type", "is_active"], name="accounts_user_ident_active_idx"),
        ),
        # 身份一致性约束在数据迁移后再收紧，避免存量 STUDENT 行因 employee_no/student_no 状态被拒绝
    ]
