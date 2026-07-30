from django.db import models

class TestCatalog(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    turnaround_time = models.CharField(max_length=100)
    sample_type = models.CharField(max_length=100)
    is_popular = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.code} - {self.name}"

class Patient(models.Model):
    patient_id = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=255)
    age = models.IntegerField()
    gender = models.CharField(max_length=20)
    mobile = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient_id} - {self.full_name}"

class Visit(models.Model):
    visit_id = models.CharField(max_length=50, unique=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='visits')
    branch_name = models.CharField(max_length=100)
    collection_type = models.CharField(max_length=50, default='Walk-in')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=50, default='BOOKED')
    created_at = models.DateTimeField(auto_now_add=True)

class Sample(models.Model):
    barcode = models.CharField(max_length=100, unique=True)
    visit = models.ForeignKey(Visit, on_delete=models.CASCADE, related_name='samples')
    test_name = models.CharField(max_length=255)
    tube_type = models.CharField(max_length=100)
    status = models.CharField(max_length=50, default='COLLECTED')
    collected_at = models.DateTimeField(auto_now_add=True)

class InventoryReagent(models.Model):
    batch_no = models.CharField(max_length=100, unique=True)
    reagent_name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    quantity = models.IntegerField()
    unit = models.CharField(max_length=50)
    expiry_date = models.DateField()
    status = models.CharField(max_length=50, default='IN_STOCK')

class AuditLog(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    user_name = models.CharField(max_length=150)
    role = models.CharField(max_length=50)
    action = models.CharField(max_length=100)
    details = models.TextField()
    ip_address = models.CharField(max_length=50)
