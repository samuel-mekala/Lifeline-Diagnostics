from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("accounts", "0002_user_role")]
    operations = [migrations.CreateModel(name="EmailOTP", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("email", models.EmailField(db_index=True, max_length=254)), ("code_hash", models.CharField(max_length=128)), ("purpose", models.CharField(default="LOGIN", max_length=30)), ("expires_at", models.DateTimeField()), ("used_at", models.DateTimeField(blank=True, null=True)), ("created_at", models.DateTimeField(auto_now_add=True))])]
