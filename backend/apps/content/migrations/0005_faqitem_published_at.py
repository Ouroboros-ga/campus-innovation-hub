# Generated for FaqItem 统一发布时间字段
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0004_site_document"),
    ]

    operations = [
        migrations.AddField(
            model_name="faqitem",
            name="published_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
