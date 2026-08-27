from django.db import migrations, models


def migrate_platform_role_and_identity(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    # 存量行补 identity_type
    User.objects.filter(identity_type__isnull=True).update(identity_type="STUDENT")
    User.objects.filter(identity_type="").update(identity_type="STUDENT")
    # STUDENT 平台角色重命名为 USER（文档：STUDENT 不再是平台权限）
    User.objects.filter(platform_role="STUDENT").update(platform_role="USER")


def reverse_migrate(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    User.objects.filter(platform_role="USER").update(platform_role="STUDENT")


class Migration(migrations.Migration):

    dependencies = [("accounts", "0004_teacher_identity")]

    operations = [
        migrations.RunPython(migrate_platform_role_and_identity, reverse_migrate),
        migrations.AddConstraint(
            model_name="user",
            constraint=models.CheckConstraint(
                condition=models.Q(
                    models.Q(("identity_type", "STUDENT"), ("student_no__isnull", False), ("employee_no__isnull", True)),
                    models.Q(("identity_type", "TEACHER"), ("employee_no__isnull", False), ("student_no__isnull", True)),
                    models.Q(("is_active", False)),
                    _connector="OR",
                ),
                name="accounts_user_identity_no_check",
            ),
        ),
    ]
