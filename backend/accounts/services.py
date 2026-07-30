import secrets
import smtplib
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import send_mail
from django.db import transaction
from django.utils import timezone

from accounts.models import EmailOTP, User
from common.services.activity import log_activity


class UserManagementService:
    @staticmethod
    def _ensure_owner_assignment_allowed(*, actor, role):
        if role == User.Role.OWNER and (actor is None or actor.role != User.Role.OWNER):
            raise ValueError("Only an owner may assign the OWNER role.")
    @staticmethod
    def record_login(*, email):
        user = User.objects.filter(email__iexact=email).first()
        if user:
            log_activity(actor=user, action="login", entity=user)

    @staticmethod
    def record_logout(*, user):
        log_activity(actor=user, action="logout", entity=user)
    @staticmethod
    def list_users():
        return User.objects.all().order_by("-date_joined")

    @staticmethod
    def get_user(*, user_id):
        return User.objects.get(id=user_id)

    @staticmethod
    @transaction.atomic
    def create_user(*, email, full_name, password, phone="", role=User.Role.RECEPTIONIST, actor=None):
        UserManagementService._ensure_owner_assignment_allowed(actor=actor, role=role)
        return User.objects.create_user(
            email=email,
            full_name=full_name,
            password=password,
            phone=phone,
            role=role,
        )

    @staticmethod
    @transaction.atomic
    def update_user(*, user, actor=None, **data):
        if "role" in data:
            UserManagementService._ensure_owner_assignment_allowed(actor=actor, role=data["role"])
        for field, value in data.items():
            setattr(user, field, value)
        user.save(update_fields=[*data.keys()])
        return user

    @staticmethod
    @transaction.atomic
    def set_active(*, user, is_active, actor=None):
        user = User.objects.select_for_update().get(pk=user.pk)
        if not is_active:
            if actor is not None and actor.pk == user.pk:
                raise ValueError("You cannot deactivate your own account.")
            if user.role == User.Role.OWNER:
                active_owner_count = User.objects.select_for_update().filter(
                    role=User.Role.OWNER,
                    is_active=True,
                ).count()
                if active_owner_count <= 1:
                    raise ValueError("The last active owner cannot be deactivated.")
        user.is_active = is_active
        user.save(update_fields=["is_active"])
        return user

    @staticmethod
    @transaction.atomic
    def reset_password(*, user, password):
        user.set_password(password)
        user.save(update_fields=["password"])
        return user


class PatientAuthenticationService:
    OTP_TTL_MINUTES = 10

    @staticmethod
    def _latest_otp(*, email, purpose):
        return EmailOTP.objects.filter(email__iexact=email, purpose=purpose).order_by("-created_at").first()

    @staticmethod
    def _raise_if_locked(otp):
        if otp and otp.locked_until and otp.locked_until > timezone.now():
            raise OTPVerificationLockedError("Too many verification attempts. Please try again later.")

    @staticmethod
    @transaction.atomic
    def register_patient(*, email, full_name, password, phone=""):
        norm_email = email.strip().lower()
        if User.objects.filter(email__iexact=norm_email).exists():
            raise ValueError(f"An account with email '{norm_email}' already exists.")
        return User.objects.create_user(
            email=norm_email,
            full_name=full_name,
            password=password,
            phone=phone,
            role=User.Role.PATIENT,
        )

    @classmethod
    @transaction.atomic
    def register_patient_and_issue_otp(cls, **data):
        user = cls.register_patient(**data)
        log_activity(actor=user, action="patient_registration", entity=user)
        try:
            cls.issue_otp(email=user.email, purpose="REGISTRATION")
        except OTPVerificationLockedError:
            pass
        return user

    @classmethod
    @transaction.atomic
    def request_otp(cls, *, email, purpose):
        """Issue an OTP only for an active account without exposing account state."""
        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if user is None:
            return False

        cls.issue_otp(email=user.email, purpose=purpose)
        return True

    @classmethod
    @transaction.atomic
    def issue_otp(cls, *, email, purpose):
        cls._raise_if_locked(cls._latest_otp(email=email, purpose=purpose))
        EmailOTP.objects.filter(email__iexact=email, purpose=purpose, used_at__isnull=True).update(used_at=timezone.now())
        code = f"{secrets.randbelow(1_000_000):06d}"
        EmailOTP.objects.create(
            email=email.lower(),
            code_hash=make_password(code),
            purpose=purpose,
            expires_at=timezone.now() + timedelta(minutes=cls.OTP_TTL_MINUTES),
        )
        try:
            if purpose == "PASSWORD_RESET":
                from notifications.services import get_notification_service
                get_notification_service().password_reset(recipient=email, code=code)
            else:
                send_mail(
                    subject="Your Lifeline Diagnostics verification code",
                    message=f"Your verification code is {code}. It expires in {cls.OTP_TTL_MINUTES} minutes.",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    fail_silently=False,
                )
        except (OSError, smtplib.SMTPException) as exc:
            raise OTPDeliveryError("Unable to send the verification code. Please try again.") from exc

    @classmethod
    def verify_otp(cls, *, email, code, purpose):
        with transaction.atomic():
            otp = EmailOTP.objects.select_for_update().filter(
                email__iexact=email,
                purpose=purpose,
                used_at__isnull=True,
            ).order_by("-created_at").first()
            cls._raise_if_locked(otp)
            is_invalid = otp is None or otp.expires_at <= timezone.now() or not check_password(code, otp.code_hash)
            if is_invalid:
                if otp and otp.expires_at > timezone.now():
                    otp.failed_attempts += 1
                    update_fields = ["failed_attempts"]
                    if otp.failed_attempts >= settings.OTP_MAX_VERIFY_ATTEMPTS:
                        otp.locked_until = timezone.now() + timedelta(seconds=settings.OTP_LOCKOUT_SECONDS)
                        update_fields.append("locked_until")
                    otp.save(update_fields=update_fields)
            else:
                otp.used_at = timezone.now()
                otp.failed_attempts = 0
                otp.locked_until = None
                otp.save(update_fields=["used_at", "failed_attempts", "locked_until"])

        if is_invalid:
            raise ValueError("The verification code is invalid or has expired.")
        return otp

    @classmethod
    def reset_password_with_otp(cls, *, email, code, password):
        cls.verify_otp(email=email, code=code, purpose="PASSWORD_RESET")
        user = User.objects.get(email__iexact=email, is_active=True)
        user.set_password(password)
        user.save(update_fields=["password"])
        return user


class OTPVerificationLockedError(ValueError):
    pass


class OTPDeliveryError(ValueError):
    pass
