from django.db import models

class CollectionTask(models.Model):
    task_id = models.CharField(max_length=50, unique=True)
    phlebotomist_name = models.CharField(max_length=150)
    patient_name = models.CharField(max_length=255)
    address = models.TextField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    scheduled_slot = models.CharField(max_length=100)
    status = models.CharField(max_length=50, default='ASSIGNED') # ASSIGNED, IN_TRANSIT, ARRIVED, SAMPLES_COLLECTED, DELIVERED_TO_HUB
    temperature_box_celsius = models.DecimalField(max_digits=4, decimal_places=1, default=4.0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.task_id} | {self.phlebotomist_name} -> {self.patient_name}"
