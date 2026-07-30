from django.db import migrations, models
from django.db.models import Q


class Migration(migrations.Migration):
    dependencies = [("patients", "0002_patientaddress")]

    operations = [
        migrations.AddConstraint(
            model_name="patientaddress",
            constraint=models.UniqueConstraint(
                condition=Q(("is_default", True)),
                fields=("patient",),
                name="unique_default_address_per_patient",
            ),
        ),
    ]
