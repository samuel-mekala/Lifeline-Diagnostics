from decimal import Decimal

from rest_framework import serializers

from inventory.models import InventoryItem, StockUsage


class InventoryItemSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.ReadOnlyField()

    class Meta:
        model = InventoryItem
        fields = ("id", "name", "sku", "unit", "quantity", "reorder_level", "is_low_stock", "created_at", "updated_at")
        read_only_fields = ("id", "created_at", "updated_at")

    def validate_quantity(self, value):
        if self.instance is not None and "quantity" in self.initial_data:
            raise serializers.ValidationError("Quantity can only be changed through stock usage.")
        return value


class StockUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = StockUsage
        fields = ("id", "item", "quantity", "reason", "created_at")
        read_only_fields = ("id", "created_at")


class StockUsageCreateSerializer(serializers.Serializer):
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=Decimal("0.01"))
    reason = serializers.CharField(max_length=255)
