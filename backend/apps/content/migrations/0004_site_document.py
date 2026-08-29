# Generated for SiteDocument: 文档中心（隐私政策、服务条款等）
import django.core.validators
import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0003_announcement_source_name"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="SiteDocument",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("slug", models.SlugField(help_text="唯一标识，如 privacy / terms / about / contact / help", max_length=80, unique=True)),
                ("title", models.CharField(max_length=160)),
                ("category", models.CharField(choices=[("ABOUT", "关于我们"), ("CONTACT", "联系我们"), ("HELP", "使用帮助"), ("PRIVACY", "隐私政策"), ("TERMS", "服务条款"), ("OTHER", "其他")], max_length=20)),
                ("summary", models.CharField(blank=True, max_length=300, null=True)),
                ("body_md", models.TextField(validators=[django.core.validators.MaxLengthValidator(50000)])),
                ("publication_state", models.CharField(choices=[("DRAFT", "草稿"), ("PUBLISHED", "已发布"), ("ARCHIVED", "已归档")], default="DRAFT", max_length=20)),
                ("published_at", models.DateTimeField(blank=True, null=True)),
                ("sort_order", models.IntegerField(default=0)),
                ("version", models.CharField(default="1.0", help_text="展示版本号，如 1.0 / 2026-08", max_length=20)),
                ("created_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="created_site_documents", to=settings.AUTH_USER_MODEL)),
                ("updated_by", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="updated_site_documents", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "constraints": [models.CheckConstraint(condition=models.Q(("sort_order__gte", 0)), name="site_document_sort_nonnegative")],
                "indexes": [
                    models.Index(fields=["publication_state", "category"], name="site_doc_state_category_idx"),
                    models.Index(fields=["slug", "publication_state"], name="site_doc_slug_state_idx"),
                    models.Index(fields=["publication_state", "published_at"], name="site_doc_state_pub_idx"),
                ],
            },
        ),
    ]
