from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Notification",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("recipient", models.EmailField(max_length=254)),
                ("category", models.CharField(max_length=50)),
                ("message", models.TextField()),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("status", models.CharField(choices=[("SENT", "Sent"), ("FAILED", "Failed"), ("SKIPPED", "Skipped")], max_length=10)),
                ("error", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
