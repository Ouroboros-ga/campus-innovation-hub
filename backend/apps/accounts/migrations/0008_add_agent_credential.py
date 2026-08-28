# Generated manually for campus-auto-ops Agent PAT.
import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0007_remove_user_accounts_user_identity_no_check_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="AgentCredential",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=80)),
                ("token_id", models.CharField(max_length=20, unique=True)),
                ("secret_hash", models.CharField(max_length=64)),
                ("scopes", models.JSONField(blank=True, default=list)),
                ("allowed_cidrs", models.JSONField(blank=True, default=list)),
                ("is_active", models.BooleanField(default=True)),
                ("expires_at", models.DateTimeField(blank=True, null=True)),
                ("last_used_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("created_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="created_agent_credentials", to=settings.AUTH_USER_MODEL)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="agent_credentials", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "indexes": [
                    models.Index(fields=["token_id"], name="agent_cred_token_id_idx"),
                    models.Index(fields=["user", "is_active"], name="agent_cred_user_active_idx"),
                ],
            },
        ),
    ]
