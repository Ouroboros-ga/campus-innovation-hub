# Generated for Recruitment 统一发布时间字段
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("organizations", "0003_qq_dual_track"),
    ]

    operations = [
        migrations.AddField(
            model_name="recruitment",
            name="published_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
