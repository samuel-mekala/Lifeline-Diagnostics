from rest_framework import serializers
from .models import Department, Role, Employee, DutyShift, StaffRoster

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = '__all__'

class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    role_title = serializers.ReadOnlyField(source='role.title')

    class Meta:
        model = Employee
        fields = '__all__'

class DutyShiftSerializer(serializers.ModelSerializer):
    class Meta:
        model = DutyShift
        fields = '__all__'

class StaffRosterSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.full_name')
    shift_name = serializers.ReadOnlyField(source='shift.shift_name')

    class Meta:
        model = StaffRoster
        fields = '__all__'
