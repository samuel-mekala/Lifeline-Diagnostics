# Lifeline Diagnostics - Healthcare Laboratory Management System

A healthcare diagnostic portal built with a modern full-stack architecture combining **React, HTML, CSS, JavaScript, DOM** on the frontend and **Python, Django, MySQL** on the backend.

---

## 📁 Repository Structure

```
├── frontend/             # Complete React Frontend Application
│   ├── src/             # Source code (Components, Pages, Services, Providers)
│   ├── assets/          # Static assets and icons
│   ├── index.html       # Single Page Application HTML template
│   ├── package.json     # Frontend dependencies
│   └── vite.config.ts   # Frontend Vite configuration
│
├── backend/              # Python Django REST Framework Backend
│   ├── backend/         # Django core settings & root URL routing
│   ├── patients/        # Django app for Patient Registration & Demographics
│   ├── appointments/    # Django app for Appointment Scheduling & Home Collections
│   ├── catalog/         # Django app for Test Directory & Profiles
│   ├── samples/         # Django app for Phlebotomy & Sample Accessioning
│   ├── billing/         # Django app for Invoices, Payments & Receipts
│   ├── reports/         # Django app for Diagnostic Results & Doctor Signatures
│   ├── inventory/       # Django app for Reagent Stock & Expiry Tracking
│   ├── audit_logs/      # Django app for System Audit Logs & Compliance
│   ├── employees/       # Django app for Staff, Departments, Roles, Shifts & Rosters
│   ├── branches/        # Django app for Diagnostic Centers & Lab Equipment Analyzers
│   │
│   │   # 👥 Role-Specific Apps:
│   ├── lab_admin/       # Django app for Admin Console & System Security Policies
│   ├── pathologists/    # Django app for Doctor Verification, Critical Alerts & E-Signatures
│   ├── phlebotomists/   # Django app for Doorstep Collection Tasks & GPS Coordinates
│   ├── lab_technicians/ # Django app for Sample Centrifuge Batches & Instrument QC Runs
│   ├── reception_desk/  # Django app for Walk-In Token Queue & Counter Cash Drawer
│   ├── patient_portal/  # Django app for Patient Self-Service, Family Profiles & Trends
│   │
│   ├── lab_app/         # General core services & search suggestions
│   └── manage.py        # Django CLI entry point
│
├── requirements.txt      # Python backend dependencies (Django, DRF, MySQL)
├── package.json          # Root orchestration package.json
├── vite.config.ts        # Root Vite entry point
└── README.md             # Project documentation
```

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3 (Tailwind CSS), JavaScript (ESNext), React, Motion/React, DOM APIs
- **Backend**: Python 3.11+, Django 4.2+, Django REST Framework (DRF)
- **Database**: MySQL 8.0+
- **Version Control & Hosting**: Git, GitHub

---

## 🚀 Running the Project

### 1. Frontend (React + HTML + CSS + JS)
```bash
# Install NPM dependencies
npm install

# Start Vite React server (Runs on port 3000)
npm run dev
```

### 2. Backend (Python + Django + MySQL)
```bash
# Create and activate Python virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python requirements
pip install -r requirements.txt

# Configure MySQL Database in backend/backend/settings.py or via .env
# Start MySQL server and create database:
# CREATE DATABASE lifeline_lab_db;

# Run Django migrations
python backend/manage.py makemigrations
python backend/manage.py migrate

# Run Django backend server
python backend/manage.py runserver 8000
```

---

## 🐙 Git & GitHub Integration

```bash
# Initialize local Git repository
git init

# Add all files to staging
git add .

# Commit changes
git commit -m "feat: Lifeline Diagnostics React + Django + MySQL stack with interactive animated UI"

# Connect to remote GitHub repository
git remote add origin https://github.com/your-username/lifeline-diagnostics.git

# Push to GitHub main branch
git branch -M main
git push -u origin main
```
