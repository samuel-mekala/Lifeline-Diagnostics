from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


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
