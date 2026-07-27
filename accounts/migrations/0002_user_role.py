from django.db import migrations, models


def assign_existing_user_roles(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    User.objects.filter(is_superuser=True).update(role="OWNER")
    User.objects.filter(
        is_superuser=False,
        is_staff=True,
    ).update(role="ADMIN")


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="role",
            field=models.CharField(
                choices=[
                    ("OWNER", "Owner"),
                    ("ADMIN", "Admin"),
                    ("RECEPTIONIST", "Receptionist"),
                    ("LAB_TECHNICIAN", "Lab Technician"),
                    ("PATHOLOGIST", "Pathologist"),
                    ("PATIENT", "Patient"),
                ],
                default="RECEPTIONIST",
                max_length=20,
            ),
        ),
        migrations.RunPython(assign_existing_user_roles, migrations.RunPython.noop),
    ]
