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


class PatientPermission(RolePermission):
    allowed_roles = (User.Role.RECEPTIONIST,)


class VisitPermission(RolePermission):
    allowed_roles = (User.Role.RECEPTIONIST,)


class BillingPermission(RolePermission):
    allowed_roles = (User.Role.RECEPTIONIST,)


class LaboratoryTechnicianPermission(RolePermission):
    allowed_roles = (User.Role.LAB_TECHNICIAN,)


class ResultReviewPermission(RolePermission):
    allowed_roles = (
        User.Role.LAB_TECHNICIAN,
        User.Role.PATHOLOGIST,
    )


class PathologistPermission(RolePermission):
    allowed_roles = (User.Role.PATHOLOGIST,)
