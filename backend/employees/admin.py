from django.contrib import admin
from .models import Department, Role, Employee, DutyShift, StaffRoster

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'description')
    search_fields = ('code', 'name')

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('title', 'access_level', 'description')
    search_fields = ('title', 'access_level')

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('emp_id', 'full_name', 'email', 'phone', 'department', 'role', 'status', 'joined_date')
    list_filter = ('department', 'role', 'status', 'joined_date')
    search_fields = ('emp_id', 'full_name', 'email', 'phone')

@admin.register(DutyShift)
class DutyShiftAdmin(admin.ModelAdmin):
    list_display = ('shift_name', 'start_time', 'end_time')
    search_fields = ('shift_name',)

@admin.register(StaffRoster)
class StaffRosterAdmin(admin.ModelAdmin):
    list_display = ('work_date', 'employee', 'shift', 'assigned_branch', 'status')
    list_filter = ('work_date', 'shift', 'status', 'assigned_branch')
    search_fields = ('employee__full_name', 'employee__emp_id')
