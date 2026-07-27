from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from common.services.health import HealthService


class HealthAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        health_status, is_healthy = HealthService.get_status()
        response_status = status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response(health_status, status=response_status)
