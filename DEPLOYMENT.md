# LifeLong Diagnostics LIMS — Deployment & Production Guide

This guide details how to deploy both the **Django REST API Backend** and the **React Vite Frontend** to production environments (Render, Railway, VPS, Vercel, or Docker).

---

## 🏗️ Project Structure Overview

```text
life-line-diagnostics-lims (4)/
├── backend/                  # Django REST Framework Backend
│   ├── manage.py
│   ├── config/               # Settings, URLs, WSGI/ASGI
│   ├── accounts/             # Authentication & Roles (JWT)
│   ├── laboratory/           # Samples, Test Suites, Results
│   ├── visits/               # Home Collections & Lab Visits
│   ├── reports/              # PDF Generator (Letterhead A4)
│   ├── employees/            # Staff & Roster Management
│   └── requirements.txt      # Python dependencies
├── src/                      # React 19 + Tailwind CSS Frontend
├── vite.config.ts            # Vite Production Bundler
└── package.json              # Node dependencies
```

---

## 🔑 Authentication & Role Routing System

The app features a **Single Unified Authentication Page** (`/login`).
When a user logs in with Email + Password, the system authenticates against Django JWT API (`/api/auth/token/`) and automatically redirects to their role-specific dashboard:

| User Role | Assigned Destination | Default Credentials |
| :--- | :--- | :--- |
| **Owner / Admin** | `/operations/dashboard` | `samuel@gmail.com` / `admin123` |
| **System Admin** | `/operations/dashboard` | `admin@lifelong.com` / `admin123` |
| **Receptionist** | `/operations/reception` | `reception@lifelong.com` / `reception123` |
| **Lab Technician** | `/operations/workstation` | `tech@lifelong.com` / `tech123` |
| **Pathologist** | `/operations/approval` | `pathologist@lifelong.com` / `patho123` |
| **Patient** | `/portal/dashboard` | `patient@lifelong.com` / `patient123` |

---

## 🚀 Option 1: Quick Local Production Build & Run

### 1. Backend Server Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 8000
```

### 2. Frontend Production Server Setup
```bash
# In the root directory:
npm install
npm run build
npm run preview
```

---

## ☁️ Option 2: Deploying to Cloud Services (Render / Railway / VPS)

### Backend Environment Variables (`backend/.env`):
```ini
ENVIRONMENT=production
SECRET_KEY=your-production-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-api-domain.com,localhost
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
CSRF_TRUSTED_ORIGINS=https://your-frontend-domain.com
DB_ENGINE=django.db.backends.postgresql
DB_NAME=lifelong_db
DB_USER=postgres
DB_PASSWORD=your_db_password
DB_HOST=your_db_host
DB_PORT=5432
```

### Frontend Environment Variables (`.env.production`):
```ini
VITE_API_BASE_URL=https://your-backend-api.onrender.com
```

### Build & Start Commands:

- **Backend Build Command**:
  `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`

- **Backend Start Command**:
  `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`

- **Frontend Build Command**:
  `npm install && npm run build`

- **Frontend Publish Directory**:
  `dist`
