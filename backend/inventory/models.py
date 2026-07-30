from django.conf import settings
from django.db import models


class InventoryItem(models.Model):
    name = models.CharField(max_length=150)
    sku = models.CharField(max_length=50, unique=True)
    unit = models.CharField(max_length=30, default="unit")
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    reorder_level = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.CheckConstraint(condition=models.Q(quantity__gte=0), name="inventory_quantity_non_negative"),
            models.CheckConstraint(condition=models.Q(reorder_level__gte=0), name="inventory_reorder_level_non_negative"),
        ]

    @property
    def is_low_stock(self):
        return self.quantity <= self.reorder_level


class StockUsage(models.Model):
    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name="usages")
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    reason = models.CharField(max_length=255)
    recorded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.CheckConstraint(condition=models.Q(quantity__gt=0), name="stock_usage_quantity_positive"),
        ]
