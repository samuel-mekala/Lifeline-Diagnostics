from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from dashboard.serializers import (
    DashboardPendingSerializer,
    DashboardStatisticsSerializer,
    DashboardSummarySerializer,
    RecentItemSerializer,
)
from dashboard.services import DashboardService


class DashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]


class DashboardSummaryAPIView(DashboardAPIView):
    def get(self, request):
        data = DashboardService.get_summary()
        return Response(DashboardSummarySerializer(data).data)


class DashboardRecentAPIView(DashboardAPIView):
    def get(self, request):
        data = DashboardService.get_recent_items()
        return Response(RecentItemSerializer(data, many=True).data)


class DashboardPendingAPIView(DashboardAPIView):
    def get(self, request):
        data = DashboardService.get_pending_items()
        return Response(DashboardPendingSerializer(data).data)


class DashboardStatisticsAPIView(DashboardAPIView):
    def get(self, request):
        data = DashboardService.get_statistics()
        return Response(DashboardStatisticsSerializer(data).data)
