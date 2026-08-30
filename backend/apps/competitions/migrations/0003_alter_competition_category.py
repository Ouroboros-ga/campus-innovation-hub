# Generated for Competition 补齐 0001 之后新增的分类选项（此前漏迁移）
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("competitions", "0002_competition_published_at"),
    ]

    operations = [
        migrations.AlterField(
            model_name="competition",
            name="category",
            field=models.CharField(
                choices=[
                    ("AI", "人工智能"),
                    ("PROGRAMMING", "编程"),
                    ("INNOVATION", "创新"),
                    ("MATHEMATICAL_MODELING", "数学建模"),
                    ("ELECTRONICS", "电子"),
                    ("ROBOTICS", "机器人"),
                    ("CYBERSECURITY", "网络安全"),
                    ("ELECTRONIC_DESIGN", "电子设计"),
                    ("MECHANICAL_DESIGN", "机械设计"),
                    ("OTHER", "其他"),
                ],
                max_length=30,
            ),
        ),
    ]
