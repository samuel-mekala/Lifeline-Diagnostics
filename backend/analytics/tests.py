from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import User

class AnalyticsAPITests(TestCase):
    def test_owner_can_view_overview(self):
        client = APIClient(); owner = User.objects.create_user(email="owner@example.com", full_name="Owner", password="strong-password-123", role=User.Role.OWNER); client.force_authenticate(owner)
        response = client.get("/api/analytics/overview/")
        self.assertEqual(response.status_code, 200); self.assertIn("total_revenue", response.data); self.assertIn("top_tests", response.data)

    def test_authenticated_non_owner_cannot_view_overview(self):
        user = User.objects.create_user(
            email="analytics-reception@example.com",
            full_name="Reception",
            password="strong-password-123",
            role=User.Role.RECEPTIONIST,
        )
        client = APIClient(); client.force_authenticate(user)
        self.assertEqual(client.get("/api/analytics/overview/").status_code, 403)

    def test_unauthenticated_user_cannot_view_overview(self):
        self.assertEqual(APIClient().get("/api/analytics/overview/").status_code, 401)
