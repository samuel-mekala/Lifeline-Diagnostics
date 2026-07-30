import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("patients", "0002_patientaddress"), ("visits", "0002_visit_entry_mode"), migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(
            name="Appointment",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("collection_type", models.CharField(choices=[("HOME", "Home Collection"), ("LAB", "Lab Visit")], max_length=10)),
                ("scheduled_for", models.DateTimeField()),
                ("status", models.CharField(choices=[("BOOKED", "Booked"), ("ACCEPTED", "Accepted"), ("COLLECTED", "Collected"), ("COMPLETED", "Completed"), ("CANCELLED", "Cancelled")], default="BOOKED", max_length=20)),
                ("payment_preference", models.CharField(choices=[("PAY_NOW", "Pay Now"), ("PAY_LATER", "Pay Later")], default="PAY_LATER", max_length=20)),
                ("remarks", models.TextField(blank=True)), ("created_at", models.DateTimeField(auto_now_add=True)), ("updated_at", models.DateTimeField(auto_now=True)),
                ("address", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="appointments", to="patients.patientaddress")),
                ("assigned_to", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="assigned_appointments", to=settings.AUTH_USER_MODEL)),
                ("patient", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="appointments", to="patients.patient")),
                ("visit", models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="appointment", to="visits.visit")),
            ], options={"ordering": ["scheduled_for"]},
        ),
        migrations.AddIndex(model_name="appointment", index=models.Index(fields=["patient", "status"], name="visits_app_patient_1d10af_idx")),
        migrations.AddIndex(model_name="appointment", index=models.Index(fields=["scheduled_for", "status"], name="visits_app_schedul_39f949_idx")),
    ]
