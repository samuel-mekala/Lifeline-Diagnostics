from django.db import models
from patients.models import Patient

class Sample(models.Model):
    barcode = models.CharField(max_length=100, unique=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='samples', null=True, blank=True)
    visit_id = models.CharField(max_length=50)
    test_name = models.CharField(max_length=255)
    tube_type = models.CharField(max_length=100) # Purple EDTA, Fluoride, Serum Sep, etc.
    collector_name = models.CharField(max_length=150, blank=True, null=True)
    status = models.CharField(max_length=50, default='COLLECTED') # COLLECTED, IN_TRANSIT, RECEIVED, PROCESSING, ARCHIVED
    collected_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.barcode} - {self.test_name}"
