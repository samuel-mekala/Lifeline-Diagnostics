import uuid

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("patients", "0001_initial")]
    operations = [
        migrations.CreateModel(
            name="PatientAddress",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("label", models.CharField(default="Home", max_length=50)),
                ("address", models.TextField()),
                ("is_default", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("patient", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="addresses", to="patients.patient")),
            ],
            options={"ordering": ["-is_default", "-created_at"]},
        ),
    ]
