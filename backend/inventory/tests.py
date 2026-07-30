from django.test import TestCase
from django.db import IntegrityError, transaction
from rest_framework.test import APIClient
from accounts.models import User
from inventory.models import InventoryItem

class InventoryAPITests(TestCase):
    def setUp(self):
        self.client = APIClient(); self.user = User.objects.create_user(email="staff@example.com", full_name="Staff", password="strong-password-123", role=User.Role.RECEPTIONIST); self.client.force_authenticate(self.user)
    def test_create_and_consume_inventory(self):
        response = self.client.post("/api/inventory/", {"name": "Tube", "sku": "TUBE-1", "quantity": "10", "reorder_level": "3"}, format="json")
        self.assertEqual(response.status_code, 201)
        response = self.client.post(f"/api/inventory/{response.data['id']}/usage/", {"quantity": "2", "reason": "Collection"}, format="json")
        self.assertEqual(response.status_code, 201); self.assertEqual(InventoryItem.objects.get(sku="TUBE-1").quantity, 8)

    def test_quantity_cannot_be_patched_and_missing_items_return_404(self):
        item = InventoryItem.objects.create(name="Tube", sku="TUBE-2", quantity="10", reorder_level="3")
        response = self.client.patch(f"/api/inventory/{item.id}/", {"quantity": "5"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(self.client.patch("/api/inventory/999999/", {"name": "Missing"}, format="json").status_code, 404)

    def test_database_rejects_invalid_stock_values(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            InventoryItem.objects.create(name="Invalid", sku="INVALID", quantity="-1", reorder_level="0")
