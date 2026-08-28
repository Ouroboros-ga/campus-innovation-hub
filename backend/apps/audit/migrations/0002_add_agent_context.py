# Generated manually for campus-auto-ops audit context.
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("audit", "0001_initial"),
        ("accounts", "0008_add_agent_credential"),
    ]

    operations = [
        migrations.AddField(
            model_name="auditlog",
            name="agent_credential",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="audit_logs", to="accounts.agentcredential"),
        ),
        migrations.AddField(
            model_name="auditlog",
            name="request_id",
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.AddField(
            model_name="auditlog",
            name="source_ip",
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
        migrations.AddField(
            model_name="auditlog",
            name="agent_id",
            field=models.CharField(blank=True, max_length=80, null=True),
        ),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(fields=["agent_credential", "created_at"], name="audit_agent_created_idx"),
        ),
        migrations.AddIndex(
            model_name="auditlog",
            index=models.Index(fields=["request_id"], name="audit_request_id_idx"),
        ),
    ]
