from django.db import transaction
from django.db.models import F

from inventory.models import InventoryItem, StockUsage
from common.services.activity import log_activity


class InventoryService:
    @staticmethod
    def list_items():
        return InventoryItem.objects.all().order_by("name")

    @staticmethod
    def get_item(*, item_id):
        return InventoryItem.objects.get(id=item_id)

    @staticmethod
    @transaction.atomic
    def create_item(*, actor=None, **data):
        item = InventoryItem.objects.create(**data)
        log_activity(actor=actor, action="inventory_created", entity=item)
        return item

    @staticmethod
    @transaction.atomic
    def update_item(*, item_id, actor=None, **data):
        item = InventoryItem.objects.select_for_update().get(id=item_id)
        for field, value in data.items():
            setattr(item, field, value)
        item.save()
        log_activity(actor=actor, action="inventory_updated", entity=item)
        return item

    @staticmethod
    @transaction.atomic
    def delete_item(*, item_id, actor=None):
        item = InventoryService.get_item(item_id=item_id)
        log_activity(actor=actor, action="inventory_deleted", entity=item)
        item.delete()

    @staticmethod
    def dashboard():
        items = InventoryItem.objects.all()
        return {"total_items": items.count(), "low_stock": items.filter(quantity__lte=F("reorder_level")).count(), "total_quantity": sum((item.quantity for item in items), 0)}

    @staticmethod
    @transaction.atomic
    def record_usage(*, item_id, quantity, reason, user=None):
        item = InventoryItem.objects.select_for_update().get(id=item_id)
        if item.quantity < quantity:
            raise ValueError("Insufficient stock for this usage.")
        item.quantity -= quantity
        item.save(update_fields=["quantity", "updated_at"])
        usage = StockUsage.objects.create(item=item, quantity=quantity, reason=reason, recorded_by=user)
        log_activity(actor=user, action="inventory_used", entity=item, metadata={"quantity": str(usage.quantity)})
        return usage
