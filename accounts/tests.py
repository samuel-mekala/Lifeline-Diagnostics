from types import SimpleNamespace

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from accounts.models import User
from accounts.permissions import (
    BillingPermission,
    LaboratoryTechnicianPermission,
    PathologistPermission,
    PatientPermission,
    ResultReviewPermission,
    VisitPermission,
)


class AuthenticationAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="reception@example.com",
            full_name="Reception User",
            password="strong-password-123",
            role=User.Role.RECEPTIONIST,
        )

    def test_token_obtain_returns_tokens_user_and_role_claim(self):
        response = self.client.post(
            "/api/auth/token/",
            {
                "email": self.user.email,
                "password": "strong-password-123",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], self.user.email)
        self.assertEqual(response.data["user"]["role"], User.Role.RECEPTIONIST)

        token = AccessToken(response.data["access"])
        self.assertEqual(token["email"], self.user.email)
        self.assertEqual(token["role"], User.Role.RECEPTIONIST)

    def test_token_refresh_returns_new_access_token(self):
        token_response = self.client.post(
            "/api/auth/token/",
            {"email": self.user.email, "password": "strong-password-123"},
            format="json",
        )

        response = self.client.post(
            "/api/auth/token/refresh/",
            {"refresh": token_response.data["refresh"]},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)

    def test_invalid_credentials_are_rejected(self):
        response = self.client.post(
            "/api/auth/token/",
            {"email": self.user.email, "password": "wrong-password"},
            format="json",
        )

        self.assertEqual(response.status_code, 401)

    def test_operational_api_requires_authentication(self):
        response = self.client.get("/api/patients/list/")

        self.assertEqual(response.status_code, 401)

    def test_patient_api_rejects_an_unauthorized_role(self):
        technician = User.objects.create_user(
            email="technician@example.com",
            full_name="Lab Technician",
            password="strong-password-123",
            role=User.Role.LAB_TECHNICIAN,
        )
        self.client.force_authenticate(technician)

        response = self.client.get("/api/patients/list/")

        self.assertEqual(response.status_code, 403)

    def test_patient_api_allows_receptionist(self):
        self.client.force_authenticate(self.user)

        response = self.client.get("/api/patients/list/")

        self.assertEqual(response.status_code, 200)


class RolePermissionTests(TestCase):
    def create_request_for_role(self, role):
        user = User.objects.create_user(
            email=f"{role.lower()}-{User.objects.count()}@example.com",
            full_name=role.title(),
            password="strong-password-123",
            role=role,
        )
        return SimpleNamespace(user=user)

    def test_operational_role_permissions_follow_the_access_matrix(self):
        permission_matrix = (
            (PatientPermission, User.Role.RECEPTIONIST),
            (VisitPermission, User.Role.RECEPTIONIST),
            (BillingPermission, User.Role.RECEPTIONIST),
            (LaboratoryTechnicianPermission, User.Role.LAB_TECHNICIAN),
            (ResultReviewPermission, User.Role.PATHOLOGIST),
            (PathologistPermission, User.Role.PATHOLOGIST),
        )

        for permission_class, allowed_role in permission_matrix:
            with self.subTest(permission=permission_class.__name__):
                request = self.create_request_for_role(allowed_role)
                self.assertTrue(permission_class().has_permission(request, None))

    def test_patient_role_has_no_operational_permissions(self):
        request = self.create_request_for_role(User.Role.PATIENT)

        for permission_class in (
            PatientPermission,
            VisitPermission,
            BillingPermission,
            LaboratoryTechnicianPermission,
            ResultReviewPermission,
            PathologistPermission,
        ):
            with self.subTest(permission=permission_class.__name__):
                self.assertFalse(permission_class().has_permission(request, None))

    def test_owner_and_admin_have_full_operational_access(self):
        permission_classes = (
            PatientPermission,
            VisitPermission,
            BillingPermission,
            LaboratoryTechnicianPermission,
            ResultReviewPermission,
            PathologistPermission,
        )

        for role in (User.Role.OWNER, User.Role.ADMIN):
            request = self.create_request_for_role(role)
            for permission_class in permission_classes:
                with self.subTest(role=role, permission=permission_class.__name__):
                    self.assertTrue(permission_class().has_permission(request, None))
