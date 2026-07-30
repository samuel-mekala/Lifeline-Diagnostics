from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("api/auth/token/", views.LifelineTokenObtainPairView.as_view(), name="token-obtain-pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("api/auth/me/", views.CurrentUserAPIView.as_view(), name="current-user"),
    path("api/auth/logout/", views.LogoutAPIView.as_view(), name="logout"),
    path("api/auth/patients/register/", views.PatientRegistrationAPIView.as_view(), name="patient-register"),
    path("api/auth/otp/request/", views.EmailOTPRequestAPIView.as_view(), name="otp-request"),
    path("api/auth/otp/verify/", views.EmailOTPVerifyAPIView.as_view(), name="otp-verify"),
    path("api/auth/patients/verify/", views.RegistrationOTPVerifyAPIView.as_view(), name="patient-registration-verify"),
    path("api/auth/password/forgot/", views.ForgotPasswordRequestAPIView.as_view(), name="forgot-password"),
    path("api/auth/password/reset/", views.ForgotPasswordConfirmAPIView.as_view(), name="forgot-password-confirm"),
    path("api/users/", views.UserListAPIView.as_view(), name="user-list"),
    path("api/users/<int:user_id>/", views.UserDetailAPIView.as_view(), name="user-detail"),
    path("api/users/<int:user_id>/activate/", views.UserActivationAPIView.as_view(), name="user-activate"),
    path("api/users/<int:user_id>/deactivate/", views.UserDeactivationAPIView.as_view(), name="user-deactivate"),
    path("api/users/<int:user_id>/reset-password/", views.UserResetPasswordAPIView.as_view(), name="user-reset-password"),
]
