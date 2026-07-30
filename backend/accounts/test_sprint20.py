from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth.hashers import make_password
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient
from accounts.models import EmailOTP, User
from accounts.services import OTPVerificationLockedError, PatientAuthenticationService
from accounts.throttles import OTPRequestEmailThrottle, OTPRequestIPThrottle

class PatientAuthenticationSprintTests(TestCase):
    @patch("accounts.services.send_mail")
    def test_registration_otp_and_password_reset(self, send_mail):
        client = APIClient(); response = client.post("/api/auth/patients/register/", {"email": "patient@example.com", "full_name": "Patient", "password": "strong-password-123"}, format="json")
        self.assertEqual(response.status_code, 201); self.assertTrue(EmailOTP.objects.filter(email="patient@example.com", purpose="REGISTRATION").exists())
        self.assertTrue(send_mail.called)


class OTPAbuseProtectionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.email = "patient@example.com"
        self.user = User.objects.create_user(
            email=self.email,
            full_name="Patient",
            password="strong-password-123",
            role=User.Role.PATIENT,
        )

    def create_otp(self, *, code="123456", purpose="LOGIN", expires_at=None, failed_attempts=0, locked_until=None):
        return EmailOTP.objects.create(
            email=self.email,
            code_hash=make_password(code),
            purpose=purpose,
            expires_at=expires_at or timezone.now() + timedelta(minutes=10),
            failed_attempts=failed_attempts,
            locked_until=locked_until,
        )

    @patch("accounts.services.send_mail")
    @patch.object(OTPRequestIPThrottle, "THROTTLE_RATES", {"otp_request": "100/hour"})
    @patch.object(OTPRequestEmailThrottle, "THROTTLE_RATES", {"otp_email": "1/hour"})
    def test_excessive_otp_requests_are_throttled_per_email(self, send_mail):
        cache.clear()

        first = self.client.post("/api/auth/otp/request/", {"email": self.email}, format="json")
        second = self.client.post("/api/auth/otp/request/", {"email": self.email}, format="json")

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 429)
        self.assertTrue(send_mail.called)

    @patch.object(OTPRequestIPThrottle, "THROTTLE_RATES", {"otp_request": "1/hour"})
    @patch.object(OTPRequestEmailThrottle, "THROTTLE_RATES", {"otp_email": "100/hour"})
    def test_excessive_otp_requests_are_throttled_per_client_ip(self):
        cache.clear()

        first = self.client.post("/api/auth/otp/request/", {"email": "first@example.com"}, format="json")
        second = self.client.post("/api/auth/otp/request/", {"email": "second@example.com"}, format="json")

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 429)

    @override_settings(OTP_MAX_VERIFY_ATTEMPTS=2, OTP_LOCKOUT_SECONDS=900)
    def test_excessive_verification_failures_lock_the_otp(self):
        otp = self.create_otp()

        with self.assertRaises(ValueError):
            PatientAuthenticationService.verify_otp(email=self.email, code="000000", purpose="LOGIN")
        with self.assertRaises(ValueError):
            PatientAuthenticationService.verify_otp(email=self.email, code="000000", purpose="LOGIN")
        with self.assertRaises(OTPVerificationLockedError):
            PatientAuthenticationService.verify_otp(email=self.email, code="000000", purpose="LOGIN")

        otp.refresh_from_db()
        self.assertEqual(otp.failed_attempts, 2)
        self.assertGreater(otp.locked_until, timezone.now())

    @override_settings(OTP_MAX_VERIFY_ATTEMPTS=2, OTP_LOCKOUT_SECONDS=900)
    def test_locked_verification_endpoint_returns_rate_limit_response(self):
        self.create_otp(locked_until=timezone.now() + timedelta(minutes=5))

        response = self.client.post(
            "/api/auth/otp/verify/", {"email": self.email, "code": "123456"}, format="json"
        )

        self.assertEqual(response.status_code, 429)
        self.assertIn("error", response.data)

    def test_successful_verification_after_a_previous_failure_resets_attempts(self):
        otp = self.create_otp()

        with self.assertRaises(ValueError):
            PatientAuthenticationService.verify_otp(email=self.email, code="000000", purpose="LOGIN")

        verified = PatientAuthenticationService.verify_otp(email=self.email, code="123456", purpose="LOGIN")

        otp.refresh_from_db()
        self.assertEqual(verified.pk, otp.pk)
        self.assertIsNotNone(otp.used_at)
        self.assertEqual(otp.failed_attempts, 0)
        self.assertIsNone(otp.locked_until)

    def test_expired_otp_is_rejected(self):
        otp = self.create_otp(expires_at=timezone.now() - timedelta(seconds=1))

        with self.assertRaisesRegex(ValueError, "invalid or has expired"):
            PatientAuthenticationService.verify_otp(email=self.email, code="123456", purpose="LOGIN")

        otp.refresh_from_db()
        self.assertEqual(otp.failed_attempts, 0)
        self.assertIsNone(otp.used_at)
