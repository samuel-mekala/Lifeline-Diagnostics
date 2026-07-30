from django.db import models

class WorklistBatch(models.Model):
    batch_id = models.CharField(max_length=50, unique=True)
    department = models.CharField(max_length=100) # Biochemistry, Hematology, Immunology
    technician_name = models.CharField(max_length=150)
    machine_assigned = models.CharField(max_length=150) # Sysmex XN-1000, Roche Cobas e411
    sample_count = models.IntegerField(default=0)
    status = models.CharField(max_length=50, default='IN_PROGRESS') # CREATED, IN_PROGRESS, COMPLETED, FLAGGED
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.batch_id} - {self.department} ({self.sample_count} samples)"

class QualityControlRun(models.Model):
    test_parameter = models.CharField(max_length=100) # HbA1c, TSH, Serum Creatinine
    control_level = models.CharField(max_length=50) # Normal Control, High Control, Low Control
    expected_value = models.DecimalField(max_digits=8, decimal_places=2)
    observed_value = models.DecimalField(max_digits=8, decimal_places=2)
    deviation_status = models.CharField(max_length=50, default='PASSED') # PASSED, WARNING, OUT_OF_BOUNDS
    technician_name = models.CharField(max_length=150)
    performed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"QC: {self.test_parameter} ({self.control_level}) - {self.deviation_status}"
