from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("accounts", "0005_migrate_platform_role_and_identity_check")]

    operations = [
        migrations.RemoveConstraint(
            model_name="user",
            name="accounts_user_identity_no_check",
        ),
        migrations.AddConstraint(
            model_name="user",
            constraint=models.CheckConstraint(
                condition=models.Q(
                    models.Q(("identity_type", "STUDENT"), ("student_no__isnull", False), ("employee_no__isnull", True)),
                    models.Q(("identity_type", "TEACHER"), ("employee_no__isnull", False), ("student_no__isnull", True)),
                    models.Q(("is_superuser", True)),
                    models.Q(("is_active", False), ("student_no__isnull", True), ("employee_no__isnull", True)),
                    _connector="OR",
                ),
                name="accounts_user_identity_no_check",
            ),
        ),
    ]
