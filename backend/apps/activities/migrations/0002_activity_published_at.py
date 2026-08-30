# Generated for Activity 统一发布时间字段
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("activities", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="activity",
            name="published_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
