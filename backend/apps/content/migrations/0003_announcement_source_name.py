# Generated for Announcement 三段式发布信息：publisher_scope / source_name / external_url
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0002_home_curation"),
    ]

    operations = [
        migrations.AddField(
            model_name="announcement",
            name="source_name",
            field=models.CharField(blank=True, help_text="信息来源展示文本，如：大赛官网 / 教务处", max_length=160, null=True),
        ),
    ]
