from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from common.services.health import HealthService
from common.models import ActivityLog
from common.pagination import OptionalPageNumberPagination
from common.serializers import ActivityLogSerializer
from common.services.activity import AUDIT_ACTIONS
from accounts.models import User
from accounts.permissions import RolePermission


class HealthAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        health_status, is_healthy = HealthService.get_status()
        response_status = status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response(health_status, status=response_status)


class ActivityLogPermission(RolePermission):
    allowed_roles = ()


class ActivityLogAPIView(APIView):
    permission_classes = [ActivityLogPermission]

    def get(self, request):
        logs = ActivityLog.objects.select_related("actor").all()
        if user_id := request.query_params.get("user"):
            logs = logs.filter(actor_id=user_id)
        if action := request.query_params.get("action"):
            logs = logs.filter(action=action)
        if date_from := request.query_params.get("date_from"):
            logs = logs.filter(created_at__date__gte=date_from)
        if date_to := request.query_params.get("date_to"):
            logs = logs.filter(created_at__date__lte=date_to)
        if search := request.query_params.get("search"):
            from django.db.models import Q
            logs = logs.filter(Q(action__icontains=search) | Q(entity_type__icontains=search) | Q(entity_id__icontains=search) | Q(actor__full_name__icontains=search))
        paginator = OptionalPageNumberPagination()
        page = paginator.paginate_queryset(logs, request, view=self)
        if page is not None:
            return paginator.get_paginated_response(ActivityLogSerializer(page, many=True).data)
        return Response(ActivityLogSerializer(logs, many=True).data)


class ActivityLogFiltersAPIView(APIView):
    permission_classes = [ActivityLogPermission]

    def get(self, request):
        users = User.objects.filter(is_active=True).order_by("full_name").values("id", "full_name", "email")
        return Response({"actions": AUDIT_ACTIONS, "users": list(users)})
