from django.db import models

class Branch(models.Model):
    code = models.CharField(max_length=50, unique=True) # HYD-CENTRAL-01, BLR-HUB-02
    name = models.CharField(max_length=255)
    address = models.TextField()
    city = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    is_central_hub = models.BooleanField(default=False)
    operating_hours = models.CharField(max_length=100, default='24x7 Services')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.name}"

class LabEquipment(models.Model):
    machine_id = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255) # Roche Cobas e411, Sysmex XN-1000, Mindray BS-240
    manufacturer = models.CharField(max_length=150)
    model_number = models.CharField(max_length=150)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='equipments')
    department_name = models.CharField(max_length=100) # Biochemistry, Hematology, Immunoassay
    status = models.CharField(max_length=50, default='OPERATIONAL') # OPERATIONAL, UNDER_MAINTENANCE, CALIBRATING, OFF
    last_serviced = models.DateField(blank=True, null=True)
    next_service_due = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.machine_id})"
