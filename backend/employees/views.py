from rest_framework import viewsets
from .models import Department, Role, Employee, DutyShift, StaffRoster
from .serializers import (
    DepartmentSerializer, RoleSerializer, EmployeeSerializer,
    DutyShiftSerializer, StaffRosterSerializer
)

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all().order_by('-joined_date')
    serializer_class = EmployeeSerializer

class DutyShiftViewSet(viewsets.ModelViewSet):
    queryset = DutyShift.objects.all()
    serializer_class = DutyShiftSerializer

class StaffRosterViewSet(viewsets.ModelViewSet):
    queryset = StaffRoster.objects.all().order_by('-work_date')
    serializer_class = StaffRosterSerializer
