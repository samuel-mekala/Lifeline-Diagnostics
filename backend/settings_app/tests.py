from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import User

class SystemSettingsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient(); self.user = User.objects.create_user(email="owner@example.com", full_name="Owner", password="strong-password-123", role=User.Role.OWNER); self.client.force_authenticate(self.user)
    def test_settings_are_created_and_updated(self):
        self.assertEqual(self.client.get("/api/settings/").status_code, 200)
        response = self.client.patch("/api/settings/", {"laboratory_name": "Lifeline Central", "tax_rate": "5.00"}, format="json")
        self.assertEqual(response.status_code, 200); self.assertEqual(response.data["laboratory_name"], "Lifeline Central")

    def test_settings_update_is_audited(self):
        self.client.patch("/api/settings/", {"currency": "USD"}, format="json")
        from common.models import ActivityLog
        self.assertTrue(ActivityLog.objects.filter(action="system_settings_updated").exists())
