from django.db import models

class SystemConfiguration(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.CharField(max_length=255, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.key}: {self.value}"

class AccessControlPolicy(models.Model):
    role_name = models.CharField(max_length=50)
    module_permission = models.CharField(max_length=100) # PATIENTS_WRITE, REPORTS_APPROVE, INVENTORY_MANAGE
    is_allowed = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.role_name} -> {self.module_permission} ({'Allowed' if self.is_allowed else 'Denied'})"
