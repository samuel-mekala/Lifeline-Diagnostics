from types import SimpleNamespace
from unittest.mock import patch

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

    def test_logout_endpoint_records_audit_event(self):
        self.client.force_authenticate(self.user)
        response = self.client.post("/api/auth/logout/")
        from common.models import ActivityLog
        self.assertEqual(response.status_code, 204)
        self.assertTrue(ActivityLog.objects.filter(action="logout", actor=self.user).exists())

    def test_operational_api_requires_authentication(self):
        response = self.client.get("/api/patients/list/")

        self.assertEqual(response.status_code, 401)

    def test_patient_api_allows_all_employee_roles(self):
        technician = User.objects.create_user(
            email="technician@example.com",
            full_name="Lab Technician",
            password="strong-password-123",
            role=User.Role.LAB_TECHNICIAN,
        )
        self.client.force_authenticate(technician)

        response = self.client.get("/api/patients/list/")

        self.assertEqual(response.status_code, 200)

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

    def test_all_employee_roles_have_the_same_operational_permissions(self):
        permission_classes = (
            PatientPermission,
            VisitPermission,
            BillingPermission,
            LaboratoryTechnicianPermission,
            ResultReviewPermission,
            PathologistPermission,
        )

        for role in (
            User.Role.RECEPTIONIST,
            User.Role.LAB_TECHNICIAN,
            User.Role.PATHOLOGIST,
        ):
            request = self.create_request_for_role(role)
            for permission_class in permission_classes:
                with self.subTest(role=role, permission=permission_class.__name__):
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


class UserManagementAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email="admin@example.com",
            full_name="Admin User",
            password="strong-password-123",
            role=User.Role.ADMIN,
        )
        self.target = User.objects.create_user(
            email="target@example.com",
            full_name="Target User",
            password="strong-password-123",
            role=User.Role.RECEPTIONIST,
        )

    def authenticate_as_admin(self):
        self.client.force_authenticate(self.admin)

    def test_user_management_requires_authentication(self):
        response = self.client.get("/api/users/")

        self.assertEqual(response.status_code, 401)

    def test_user_management_rejects_non_admin_users(self):
        self.client.force_authenticate(self.target)

        response = self.client.get("/api/users/")

        self.assertEqual(response.status_code, 403)

    def test_admin_can_list_and_retrieve_users(self):
        self.authenticate_as_admin()

        list_response = self.client.get("/api/users/")
        detail_response = self.client.get(f"/api/users/{self.target.id}/")

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.data["email"], self.target.email)

    def test_admin_can_create_user(self):
        self.authenticate_as_admin()

        response = self.client.post(
            "/api/users/",
            {
                "email": "new-user@example.com",
                "full_name": "New User",
                "phone": "9999999999",
                "role": User.Role.LAB_TECHNICIAN,
                "password": "new-strong-password",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        user = User.objects.get(email="new-user@example.com")
        self.assertTrue(user.check_password("new-strong-password"))

    def test_duplicate_user_email_is_rejected(self):
        self.authenticate_as_admin()

        response = self.client.post(
            "/api/users/",
            {
                "email": self.target.email,
                "full_name": "Duplicate User",
                "role": User.Role.RECEPTIONIST,
                "password": "new-strong-password",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)

    def test_admin_can_update_user_details(self):
        self.authenticate_as_admin()

        response = self.client.patch(
            f"/api/users/{self.target.id}/",
            {"full_name": "Updated User", "role": User.Role.PATHOLOGIST},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.target.refresh_from_db()
        self.assertEqual(self.target.full_name, "Updated User")
        self.assertEqual(self.target.role, User.Role.PATHOLOGIST)

    def test_delete_deactivates_user_without_removing_record(self):
        self.authenticate_as_admin()

        response = self.client.delete(f"/api/users/{self.target.id}/")

        self.assertEqual(response.status_code, 200)
        self.target.refresh_from_db()
        self.assertFalse(self.target.is_active)
        self.assertTrue(User.objects.filter(pk=self.target.pk).exists())

    def test_admin_can_activate_and_deactivate_user(self):
        self.authenticate_as_admin()
        self.target.is_active = False
        self.target.save(update_fields=["is_active"])

        activate_response = self.client.post(f"/api/users/{self.target.id}/activate/")
        deactivate_response = self.client.post(f"/api/users/{self.target.id}/deactivate/")

        self.assertEqual(activate_response.status_code, 200)
        self.assertEqual(deactivate_response.status_code, 200)
        self.target.refresh_from_db()
        self.assertFalse(self.target.is_active)

    def test_admin_can_reset_password(self):
        self.authenticate_as_admin()

        response = self.client.post(
            f"/api/users/{self.target.id}/reset-password/",
            {"password": "updated-strong-password"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.target.refresh_from_db()
        self.assertTrue(self.target.check_password("updated-strong-password"))

    def test_unknown_user_returns_not_found(self):
        self.authenticate_as_admin()

        response = self.client.get("/api/users/00000000-0000-0000-0000-000000000000/")

        self.assertEqual(response.status_code, 404)

    def test_admin_cannot_create_or_promote_an_owner(self):
        self.authenticate_as_admin()
        create_response = self.client.post(
            "/api/users/",
            {"email": "owner@example.com", "full_name": "Owner", "role": "OWNER", "password": "strong-password-123"},
            format="json",
        )
        promote_response = self.client.patch(
            f"/api/users/{self.target.id}/",
            {"role": "OWNER"},
            format="json",
        )
        self.assertEqual(create_response.status_code, 400)
        self.assertEqual(promote_response.status_code, 400)

    def test_owner_can_assign_owner_and_cannot_be_last_active_owner_deactivated(self):
        owner = User.objects.create_user(
            email="owner@example.com", full_name="Owner", password="strong-password-123", role=User.Role.OWNER,
        )
        self.client.force_authenticate(owner)
        promote_response = self.client.patch(
            f"/api/users/{self.target.id}/", {"role": "OWNER"}, format="json",
        )
        self.assertEqual(promote_response.status_code, 200)
        self.assertEqual(self.client.post(f"/api/users/{owner.id}/deactivate/").status_code, 400)

    def test_management_user_cannot_deactivate_their_own_account(self):
        self.authenticate_as_admin()
        self.assertEqual(self.client.post(f"/api/users/{self.admin.id}/deactivate/").status_code, 400)


class OTPDeliveryFailureTests(TestCase):
    def test_registration_rolls_back_when_otp_delivery_fails(self):
        with patch("accounts.services.send_mail", side_effect=OSError("SMTP unavailable")):
            response = APIClient().post(
                "/api/auth/patients/register/",
                {"email": "mail-failure@example.com", "full_name": "Mail Failure", "password": "strong-password-123"},
                format="json",
            )
        self.assertEqual(response.status_code, 503)
        self.assertFalse(User.objects.filter(email="mail-failure@example.com").exists())
