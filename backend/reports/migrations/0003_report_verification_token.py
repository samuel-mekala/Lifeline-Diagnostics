import uuid

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("reports", "0002_report_report_id")]
    operations = [migrations.AddField(model_name="report", name="verification_token", field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True))]
