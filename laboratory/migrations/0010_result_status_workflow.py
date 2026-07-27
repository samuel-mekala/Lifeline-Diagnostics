from django.db import migrations, models


def migrate_pending_results_to_submitted(apps, schema_editor):
    Result = apps.get_model("laboratory", "Result")
    Result.objects.filter(status="PENDING_APPROVAL").update(status="SUBMITTED")


class Migration(migrations.Migration):

    dependencies = [
        ("laboratory", "0009_testparameter_reference_range"),
    ]

    operations = [
        migrations.AlterField(
            model_name="result",
            name="status",
            field=models.CharField(
                choices=[
                    ("DRAFT", "Draft"),
                    ("SUBMITTED", "Submitted"),
                    ("APPROVED", "Approved"),
                    ("REJECTED", "Rejected"),
                ],
                default="DRAFT",
                max_length=25,
            ),
        ),
        migrations.RunPython(
            migrate_pending_results_to_submitted,
            migrations.RunPython.noop,
        ),
    ]
