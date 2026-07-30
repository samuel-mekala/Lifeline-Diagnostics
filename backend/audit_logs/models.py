from django.db import models

class AuditLogEntry(models.Model):
    user_name = models.CharField(max_length=150)
    role = models.CharField(max_length=50) # Lab Admin, Pathologist, Phlebotomist, Billing Clerk
    action = models.CharField(max_length=100) # LOGIN_SUCCESS, RESULT_APPROVAL, BILL_GENERATED, SAMPLE_COLLECTED
    details = models.TextField()
    ip_address = models.CharField(max_length=50)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.timestamp} | {self.user_name} | {self.action}"
