from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.permissions import RolePermission
from analytics.serializers import AnalyticsOverviewSerializer
from analytics.services import AnalyticsService


class OwnerAnalyticsPermission(RolePermission):
    allowed_roles = (User.Role.OWNER,)


class AnalyticsOverviewAPIView(APIView):
    permission_classes = [OwnerAnalyticsPermission]
    def get(self, request):
        return Response(AnalyticsOverviewSerializer(AnalyticsService.overview()).data)
