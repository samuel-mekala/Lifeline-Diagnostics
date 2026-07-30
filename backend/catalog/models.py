from django.db import models

class TestCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name

class TestItem(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    category = models.ForeignKey(TestCategory, on_delete=models.CASCADE, related_name='tests')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    turnaround_time = models.CharField(max_length=100)
    sample_type = models.CharField(max_length=100)
    is_popular = models.BooleanField(default=False)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.code} - {self.name}"
