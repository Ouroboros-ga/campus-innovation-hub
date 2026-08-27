from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("organizations", "0001_initial")]

    operations = [
        migrations.RemoveField(model_name="organization", name="advisor_name"),
        migrations.AlterField(
            model_name="organizationmembership",
            name="role",
            field=models.CharField(
                choices=[("MEMBER", "成员"), ("LEADER", "负责人"), ("ADVISOR", "指导老师")],
                default="MEMBER",
                max_length=20,
            ),
        ),
    ]
