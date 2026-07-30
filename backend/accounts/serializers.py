from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers

from accounts.models import User


class LifelineTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adds the authenticated user's business identity to the token response."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["full_name"] = user.full_name
        token["role"] = user.role
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = {
            "email": self.user.email,
            "full_name": self.user.full_name,
            "role": self.user.role,
        }
        return data


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "full_name",
            "phone",
            "role",
            "is_active",
            "is_staff",
            "date_joined",
        )
        read_only_fields = ("id", "is_staff", "date_joined")


class CreateUserSerializer(serializers.Serializer):
    email = serializers.EmailField()
    full_name = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=15, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=User.Role.choices)
    password = serializers.CharField(write_only=True, min_length=8, trim_whitespace=False)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value


class UpdateUserSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=255, required=False)
    phone = serializers.CharField(max_length=15, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=User.Role.choices, required=False)


class ResetPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True, min_length=8, trim_whitespace=False)

    def validate_password(self, value):
        validate_password(value)
        return value


class PatientRegistrationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    full_name = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=15, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8, trim_whitespace=False)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value


class EmailOTPRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class EmailOTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(min_length=6, max_length=6)


class ForgotPasswordConfirmSerializer(EmailOTPVerifySerializer):
    password = serializers.CharField(write_only=True, min_length=8, trim_whitespace=False)

    def validate_password(self, value):
        validate_password(value)
        return value
