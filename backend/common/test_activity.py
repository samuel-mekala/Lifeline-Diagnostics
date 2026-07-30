from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import User
from common.services.activity import log_activity

class ActivityLogAPITests(TestCase):
    def test_activity_is_paginated_and_searchable(self):
        user = User.objects.create_user(email="owner@example.com", full_name="Owner", password="strong-password-123", role=User.Role.OWNER); log_activity(actor=user, action="login", entity=user)
        client = APIClient(); client.force_authenticate(user); response = client.get("/api/activity-logs/?page=1&search=login")
        self.assertEqual(response.status_code, 200); self.assertEqual(response.data["count"], 1)
