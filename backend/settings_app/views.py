from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.permissions import RolePermission
from settings_app.serializers import SystemSettingsSerializer
from settings_app.services import SystemSettingsService
from common.services.activity import log_activity

class SettingsPermission(RolePermission):
    allowed_roles = ()


class SystemSettingsAPIView(APIView):
    permission_classes = [SettingsPermission]
    def get(self, request): return Response(SystemSettingsSerializer(SystemSettingsService.get()).data)
    def patch(self, request):
        serializer = SystemSettingsSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        settings = SystemSettingsService.update(data=serializer.validated_data)
        log_activity(actor=request.user, action="system_settings_updated", entity=settings, metadata={"fields": sorted(serializer.validated_data)})
        return Response(SystemSettingsSerializer(settings).data)
