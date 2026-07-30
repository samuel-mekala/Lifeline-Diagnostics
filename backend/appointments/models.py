from django.db import models
from patients.models import Patient

class Appointment(models.Model):
    appointment_id = models.CharField(max_length=50, unique=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments', null=True, blank=True)
    patient_name = models.CharField(max_length=255)
    mobile = models.CharField(max_length=20)
    scheduled_date = models.DateField()
    scheduled_time = models.TimeField()
    collection_type = models.CharField(max_length=50, default='Walk-in') # Walk-in, Home Collection
    hub_location = models.CharField(max_length=150)
    status = models.CharField(max_length=50, default='SCHEDULED') # SCHEDULED, COMPLETED, CANCELLED
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.appointment_id} - {self.patient_name}"
