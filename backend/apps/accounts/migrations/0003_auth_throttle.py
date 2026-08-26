# Generated manually for the BE-060 security baseline.

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("accounts", "0002_userprofile_avatar_asset")]

    operations = [
        migrations.CreateModel(
            name="AuthThrottle",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "scope",
                    models.CharField(
                        choices=[
                            ("LOGIN_IP", "登录来源 IP"),
                            ("LOGIN_USERNAME", "登录用户名"),
                            ("REGISTER_IP", "注册来源 IP"),
                        ],
                        max_length=32,
                    ),
                ),
                ("subject_digest", models.CharField(max_length=64)),
                ("failure_count", models.PositiveSmallIntegerField(default=0)),
                ("window_started_at", models.DateTimeField()),
                ("blocked_until", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "indexes": [models.Index(fields=["blocked_until"], name="acct_throttle_blocked_idx")],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("scope", "subject_digest"),
                        name="accounts_auth_throttle_scope_digest_unique",
                    )
                ],
            },
        ),
    ]
