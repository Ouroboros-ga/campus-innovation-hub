# Generated for Competition 统一发布时间字段
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("competitions", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="competition",
            name="published_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
