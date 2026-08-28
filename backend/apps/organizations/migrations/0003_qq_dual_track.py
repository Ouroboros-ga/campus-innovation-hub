from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [("organizations", "0002_teacher_advisor")]

    operations = [
        migrations.AddField(
            model_name="organization",
            name="allow_online_application",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="organization",
            name="qq_group_join_url",
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name="organization",
            name="qq_group_number",
            field=models.CharField(blank=True, max_length=30, null=True),
        ),
        migrations.AddField(
            model_name="organization",
            name="related_links_json",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="organization",
            name="qq_group_qr_asset",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="organization_qq_qrs",
                to="media.mediaasset",
            ),
        ),
        migrations.AddField(
            model_name="recruitment",
            name="enable_online_application",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="recruitment",
            name="qq_group_join_url",
            field=models.CharField(blank=True, max_length=500, null=True),
        ),
        migrations.AddField(
            model_name="recruitment",
            name="qq_group_number",
            field=models.CharField(blank=True, max_length=30, null=True),
        ),
        migrations.AddField(
            model_name="recruitment",
            name="qq_group_qr_asset",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="recruitment_qq_qrs",
                to="media.mediaasset",
            ),
        ),
    ]
