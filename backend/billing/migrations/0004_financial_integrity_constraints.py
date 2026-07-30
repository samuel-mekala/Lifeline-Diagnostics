from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("billing", "0003_payment"),
    ]

    operations = [
        migrations.AddConstraint(
            model_name="invoice",
            constraint=models.CheckConstraint(
                condition=(
                    models.Q(("subtotal__gte", 0))
                    & models.Q(("discount__gte", 0))
                    & models.Q(("total_amount__gte", 0))
                    & models.Q(("amount_paid__gte", 0))
                    & models.Q(("balance_due__gte", 0))
                ),
                name="invoice_amounts_non_negative",
            ),
        ),
        migrations.AddConstraint(
            model_name="invoiceitem",
            constraint=models.CheckConstraint(
                condition=(
                    models.Q(("quantity__gte", 1))
                    & models.Q(("unit_price__gte", 0))
                    & models.Q(("discount__gte", 0))
                    & models.Q(("line_total__gte", 0))
                ),
                name="invoice_item_amounts_valid",
            ),
        ),
        migrations.AddConstraint(
            model_name="payment",
            constraint=models.CheckConstraint(
                condition=models.Q(("amount__gt", 0)),
                name="payment_amount_positive",
            ),
        ),
    ]
