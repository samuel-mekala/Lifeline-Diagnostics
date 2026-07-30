import uuid

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("billing", "0004_financial_integrity_constraints")]
    operations = [migrations.AddField(model_name="invoice", name="verification_token", field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True))]
