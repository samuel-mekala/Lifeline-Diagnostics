from django.db import models

class Department(models.Model):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100) # Hematology, Biochemistry, Histopathology, Phlebotomy, Administration, IT & Support
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.code} - {self.name}"

class Role(models.Model):
    title = models.CharField(max_length=100, unique=True) # Senior Pathologist, Lab Technician, Phlebotomist, Billing Executive, Lab Director
    access_level = models.CharField(max_length=50, default='STANDARD') # ADMIN, PATHOLOGIST, TECHNICIAN, PHLEBOTOMIST, DESK
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.title

class Employee(models.Model):
    emp_id = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, related_name='employees')
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, related_name='employees')
    qualification = models.CharField(max_length=200, blank=True, null=True) # MD Pathology, DMLT, B.Sc MLT, MBBS
    license_number = models.CharField(max_length=100, blank=True, null=True) # Medical Council Registration No
    status = models.CharField(max_length=50, default='ACTIVE') # ACTIVE, ON_LEAVE, RESIGNED
    joined_date = models.DateField()
    emergency_contact = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.emp_id} - {self.full_name} ({self.role})"

class DutyShift(models.Model):
    shift_name = models.CharField(max_length=100) # Morning Shift, Evening Shift, Night Duty, On-Call
    start_time = models.TimeField()
    end_time = models.TimeField()

    def __str__(self):
        return f"{self.shift_name} ({self.start_time} - {self.end_time})"

class StaffRoster(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='rosters')
    shift = models.ForeignKey(DutyShift, on_delete=models.CASCADE)
    work_date = models.DateField()
    assigned_branch = models.CharField(max_length=100, default='Central Reference Lab')
    status = models.CharField(max_length=50, default='SCHEDULED') # SCHEDULED, PRESENT, ABSENT, OFF

    def __str__(self):
        return f"{self.work_date} | {self.employee.full_name} - {self.shift.shift_name}"
