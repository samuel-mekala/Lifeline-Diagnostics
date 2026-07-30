import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import User

def reset_database():
    print("🧹 Clearing all users and data from database...")
    User.objects.all().delete()

    print("✨ Creating fresh accounts for testing...")

    users_data = [
        {"email": "samuel@gmail.com", "full_name": "Samuel Mekala", "role": User.Role.OWNER},
        {"email": "admin@lifeline.com", "full_name": "System Admin", "role": User.Role.ADMIN},
        {"email": "reception@lifeline.com", "full_name": "Priya Sharma", "role": User.Role.RECEPTIONIST},
        {"email": "tech@lifeline.com", "full_name": "Anil Verma", "role": User.Role.LAB_TECHNICIAN},
        {"email": "patho@lifeline.com", "full_name": "Dr. Sunita Rao", "role": User.Role.PATHOLOGIST},
        {"email": "patient@gmail.com", "full_name": "Rajesh Kumar", "role": User.Role.PATIENT},
    ]

    created = []
    for u in users_data:
        is_staff_user = u["role"] in [User.Role.OWNER, User.Role.ADMIN, User.Role.PATHOLOGIST, User.Role.LAB_TECHNICIAN, User.Role.RECEPTIONIST]
        is_super = u["role"] in [User.Role.OWNER, User.Role.ADMIN]

        user = User.objects.create_user(
            email=u["email"],
            password="admin123",
            full_name=u["full_name"],
            role=u["role"],
        )
        user.is_staff = is_staff_user
        user.is_superuser = is_super
        user.save()

        created.append(f"  • Email: {user.email} | Password: admin123 | Role: {user.role}")

    print("\n✅ Fresh Database Users Created Successfully:\n" + "\n".join(created))

if __name__ == "__main__":
    reset_database()
