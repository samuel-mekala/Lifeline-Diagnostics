from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DepartmentViewSet, RoleViewSet, EmployeeViewSet, DutyShiftViewSet, StaffRosterViewSet

router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'staff', EmployeeViewSet, basename='employee')
router.register(r'shifts', DutyShiftViewSet, basename='shift')
router.register(r'rosters', StaffRosterViewSet, basename='roster')

urlpatterns = [
    path('', include(router.urls)),
]
