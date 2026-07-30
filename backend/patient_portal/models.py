from django.db import models
from patients.models import Patient

class PatientFamilyMember(models.Model):
    primary_patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='family_members')
    member_name = models.CharField(max_length=255)
    relationship = models.CharField(max_length=100) # Father, Mother, Spouse, Child, Self
    age = models.IntegerField()
    gender = models.CharField(max_length=20)

    def __str__(self):
        return f"{self.member_name} ({self.relationship} of {self.primary_patient.full_name})"

class HealthTrendRecord(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='health_trends')
    parameter_name = models.CharField(max_length=100) # Fasting Blood Sugar, HbA1c, Cholesterol, TSH
    parameter_value = models.DecimalField(max_digits=8, decimal_places=2)
    unit = models.CharField(max_length=50) # mg/dL, %, mIU/L
    recorded_date = models.DateField()

    def __str__(self):
        return f"{self.patient.full_name} | {self.parameter_name}: {self.parameter_value} {self.unit}"
