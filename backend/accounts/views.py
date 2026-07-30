from django.shortcuts import render
from django.http import Http404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView

from accounts.permissions import UserManagementPermission
from accounts.models import User
from accounts.serializers import (
    CreateUserSerializer,
    LifelineTokenObtainPairSerializer,
    ResetPasswordSerializer,
    UpdateUserSerializer,
    UserSerializer,
    PatientRegistrationSerializer,
    EmailOTPRequestSerializer,
    EmailOTPVerifySerializer,
    ForgotPasswordConfirmSerializer,
)
from accounts.services import (
    OTPDeliveryError,
    OTPVerificationLockedError,
    PatientAuthenticationService,
    UserManagementService,
)
from accounts.throttles import OTPRequestEmailThrottle, OTPRequestIPThrottle

# Create your views here.

def home(request):
    user_count = User.objects.count()
    users = User.objects.all().order_by('id')
    return render(request, "accounts/home.html", {
        "user_count": user_count,
        "users": users,
    })


class LifelineTokenObtainPairView(TokenObtainPairView):
    serializer_class = LifelineTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            UserManagementService.record_login(email=request.data.get("email", ""))
        return response


class PublicPatientAPIView(APIView):
    permission_classes = [AllowAny]


class LogoutAPIView(APIView):
    def post(self, request):
        UserManagementService.record_logout(user=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CurrentUserAPIView(APIView):
    def get(self, request):
        if not request.user.is_authenticated:
            return Response({"detail": "Not authenticated"}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(UserSerializer(request.user).data)


class PatientRegistrationAPIView(PublicPatientAPIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        full_name = request.data.get("full_name", "").strip()
        password = request.data.get("password", "")
        phone = request.data.get("phone", "").strip()

        if not email or not password or not full_name:
            return Response({"error": "Full name, email, and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email__iexact=email).exists():
            return Response({"error": f"An account with email '{email}' already exists."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.create_user(
                email=email,
                full_name=full_name,
                password=password,
                phone=phone,
                role=User.Role.PATIENT,
            )

            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)

            return Response({
                "success": True,
                "user": UserSerializer(user).data,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "message": "Registration successful."
            }, status=status.HTTP_201_CREATED)
        except Exception as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)


class EmailOTPRequestAPIView(PublicPatientAPIView):
    purpose = "LOGIN"
    throttle_scope = "otp_request"
    throttle_classes = [OTPRequestIPThrottle, OTPRequestEmailThrottle]

    def post(self, request):
        serializer = EmailOTPRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]
        try:
            PatientAuthenticationService.request_otp(email=email, purpose=self.purpose)
        except OTPVerificationLockedError:
            pass
        except OTPDeliveryError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        return Response({"message": "If an active account exists, a verification code has been sent."})


class EmailOTPVerifyAPIView(PublicPatientAPIView):
    purpose = "LOGIN"

    def post(self, request):
        serializer = EmailOTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            PatientAuthenticationService.verify_otp(purpose=self.purpose, **serializer.validated_data)
        except OTPVerificationLockedError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"message": "Email verification successful."})


class RegistrationOTPVerifyAPIView(EmailOTPVerifyAPIView):
    purpose = "REGISTRATION"


class ForgotPasswordRequestAPIView(EmailOTPRequestAPIView):
    purpose = "PASSWORD_RESET"


class ForgotPasswordConfirmAPIView(PublicPatientAPIView):
    def post(self, request):
        serializer = ForgotPasswordConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            PatientAuthenticationService.reset_password_with_otp(**serializer.validated_data)
        except OTPVerificationLockedError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_429_TOO_MANY_REQUESTS)
        except (ValueError, User.DoesNotExist) as exc:
            return Response({"error": str(exc) if isinstance(exc, ValueError) else "The reset request is invalid."}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"message": "Password reset successful."})


class UserManagementAPIView(APIView):
    permission_classes = [UserManagementPermission]

    @staticmethod
    def get_user_or_404(user_id):
        try:
            return UserManagementService.get_user(user_id=user_id)
        except User.DoesNotExist as exc:
            raise Http404("User not found.") from exc


class UserListAPIView(UserManagementAPIView):
    def get(self, request):
        users = UserManagementService.list_users()
        return Response(UserSerializer(users, many=True).data)

    def post(self, request):
        serializer = CreateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = UserManagementService.create_user(actor=request.user, **serializer.validated_data)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class UserDetailAPIView(UserManagementAPIView):
    def get(self, request, user_id):
        return Response(UserSerializer(self.get_user_or_404(user_id)).data)

    def patch(self, request, user_id):
        serializer = UpdateUserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = UserManagementService.update_user(
                user=self.get_user_or_404(user_id),
                actor=request.user,
                **serializer.validated_data,
            )
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(UserSerializer(user).data)

    def delete(self, request, user_id):
        try:
            user = UserManagementService.set_active(
                user=self.get_user_or_404(user_id), is_active=False, actor=request.user,
            )
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(UserSerializer(user).data)


class UserActivationAPIView(UserManagementAPIView):
    def post(self, request, user_id):
        try:
            user = UserManagementService.set_active(
                user=self.get_user_or_404(user_id),
                is_active=True,
                actor=request.user,
            )
        except ValueError as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(UserSerializer(user).data)


class UserDeactivationAPIView(UserManagementAPIView):
    def post(self, request, user_id):
        try:
            user = UserManagementService.set_active(
                user=self.get_user_or_404(user_id), is_active=False, actor=request.user,
            )
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(UserSerializer(user).data)


class UserResetPasswordAPIView(UserManagementAPIView):
    def post(self, request, user_id):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = UserManagementService.reset_password(
            user=self.get_user_or_404(user_id),
            password=serializer.validated_data["password"],
        )
        return Response(UserSerializer(user).data)
