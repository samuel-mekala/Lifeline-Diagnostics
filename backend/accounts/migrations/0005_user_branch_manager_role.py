from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0004_emailotp_abuse_protection"),
    ]

    operations = [
        migrations.AlterField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[
                    ("OWNER", "Owner"),
                    ("ADMIN", "Admin"),
                    ("BRANCH_MANAGER", "Branch Manager"),
                    ("RECEPTIONIST", "Receptionist"),
                    ("LAB_TECHNICIAN", "Lab Technician"),
                    ("PATHOLOGIST", "Pathologist"),
                    ("PATIENT", "Patient"),
                ],
                default="RECEPTIONIST",
                max_length=20,
            ),
        ),
    ]