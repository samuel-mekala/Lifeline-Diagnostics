from rest_framework import viewsets
from .models import AuditLogEntry
from .serializers import AuditLogEntrySerializer

class AuditLogEntryViewSet(viewsets.ModelViewSet):
    queryset = AuditLogEntry.objects.all().order_by('-timestamp')
    serializer_class = AuditLogEntrySerializer
