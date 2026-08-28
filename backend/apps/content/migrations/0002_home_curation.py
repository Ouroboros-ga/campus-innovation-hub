# Generated for Homepage Curation Studio: 公告首页精选与 FAQ 首页排序分离
import django.db.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("content", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="announcement",
            name="is_home_featured",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="announcement",
            name="home_featured_order",
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name="faqitem",
            name="featured_order",
            field=models.IntegerField(default=0),
        ),
        migrations.AddConstraint(
            model_name="announcement",
            constraint=models.CheckConstraint(
                condition=models.Q(("home_featured_order__gte", 0)), name="announcement_home_featured_order_nonnegative"
            ),
        ),
        migrations.AddConstraint(
            model_name="faqitem",
            constraint=models.CheckConstraint(
                condition=models.Q(("featured_order__gte", 0)), name="faq_featured_order_nonnegative"
            ),
        ),
        migrations.AddIndex(
            model_name="announcement",
            index=models.Index(
                fields=["publication_state", "is_home_featured", "home_featured_order"], name="announcement_home_featured_idx"
            ),
        ),
        migrations.AddIndex(
            model_name="faqitem",
            index=models.Index(
                fields=["publication_state", "is_featured", "featured_order"], name="faq_home_featured_idx"
            ),
        ),
    ]
