from django.db import models
from reports.models import DiagnosticReport

class PathologistReview(models.Model):
    report = models.ForeignKey(DiagnosticReport, on_delete=models.CASCADE, related_name='reviews')
    doctor_name = models.CharField(max_length=150)
    medical_comment = models.TextField()
    is_critical_flag = models.BooleanField(default=False)
    reviewed_at = models.DateTimeField(auto_now_add=True)
    signature_applied = models.BooleanField(default=True)

    def __str__(self):
        return f"Review for {self.report.report_id} by {self.doctor_name}"

class CriticalAlert(models.Model):
    report_id = models.CharField(max_length=100)
    patient_name = models.CharField(max_length=255)
    parameter_name = models.CharField(max_length=150) # e.g. Hemoglobin 4.2 g/dL, Potassium 6.8 mmol/L
    measured_value = models.CharField(max_length=50)
    doctor_notified = models.CharField(max_length=150)
    notified_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, default='NOTIFIED') # NOTIFIED, ACKNOWLEDGED, RESOLVED

    def __str__(self):
        return f"CRITICAL: {self.patient_name} - {self.parameter_name}: {self.measured_value}"
