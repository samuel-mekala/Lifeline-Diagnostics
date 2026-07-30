from rest_framework.permissions import BasePermission

from accounts.models import User


class RolePermission(BasePermission):
    allowed_roles = ()

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and (
                user.is_superuser
                or user.role in {User.Role.OWNER, User.Role.ADMIN}
                or user.role in self.allowed_roles
            )
        )


EMPLOYEE_ROLES = (
    User.Role.RECEPTIONIST,
    User.Role.LAB_TECHNICIAN,
    User.Role.PATHOLOGIST,
)


class PatientPermission(RolePermission):
    allowed_roles = EMPLOYEE_ROLES


class VisitPermission(RolePermission):
    allowed_roles = EMPLOYEE_ROLES


class BillingPermission(RolePermission):
    allowed_roles = EMPLOYEE_ROLES


class InventoryPermission(RolePermission):
    allowed_roles = EMPLOYEE_ROLES


class LaboratoryTechnicianPermission(RolePermission):
    allowed_roles = EMPLOYEE_ROLES


class ResultReviewPermission(RolePermission):
    allowed_roles = EMPLOYEE_ROLES


class PathologistPermission(RolePermission):
    allowed_roles = EMPLOYEE_ROLES


class UserManagementPermission(RolePermission):
    allowed_roles = ()


class PatientSelfPermission(BasePermission):
    """Allows only authenticated users with PATIENT role to access their own portal data."""
    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and user.is_active
            and user.role == User.Role.PATIENT
        )


class StaffPermission(RolePermission):
    """Allows any internal staff: Receptionist, Lab Technician, Pathologist, Owner, Admin."""
    allowed_roles = EMPLOYEE_ROLES
