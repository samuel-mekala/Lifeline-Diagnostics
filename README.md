# 🔬 Life Line Diagnostics — Pathology Information System & LIMS

[![Frontend Status](https://img.shields.io/badge/Frontend-Vercel-success?style=for-the-badge&logo=vercel)](https://lifeline-diagnostics.vercel.app)
[![Backend Status](https://img.shields.io/badge/Backend-Render-blue?style=for-the-badge&logo=render)](https://lifeline-diagnostics.onrender.com)
[![NABL Compliance](https://img.shields.io/badge/Compliance-NABL%20%26%20ISO%209001%3A2015-emerald?style=for-the-badge)](https://lifeline-diagnostics.vercel.app)

A modern, full-stack NABL-accredited **Laboratory Information Management System (LIMS)** designed for diagnostic laboratories, phlebotomy home collection networks, and multi-branch pathology centers.

---

## 🌐 Live Production Deployments

* 🌐 **Live Web Application**: [https://lifeline-diagnostics.vercel.app](https://lifeline-diagnostics.vercel.app)
* ⚡ **Live REST API Backend**: [https://lifeline-diagnostics.onrender.com](https://lifeline-diagnostics.onrender.com)

---

## 👥 Demo Logins & Access Accounts (Password: `password123`)

| Role | Name | Email | Password | Primary Workflow |
| :--- | :--- | :--- | :--- | :--- |
| **PATIENT** | Demo Patient | `joel@gmail.com` | `password123` | Book appointments, view test catalog, track samples, download invoices & NABL PDF reports |
| **LAB_TECHNICIAN** | **Sunny** | `tech@lifeline.com` | `password123` | Phlebotomist sample collection, barcode generation (`LLD-B-XXXXXX`), enter parameter values |
| **PATHOLOGIST** | **Dr. Mallika Boyapati (MD)** | `patho@lifeline.com` | `password123` | Review test results, check HIGH/LOW flags, grant digital sign-off |
| **RECEPTIONIST** | Priya Sharma | `reception@lifeline.com` | `password123` | Walk-in registration, desk billing, phlebotomist home pickup assignment, cash collection |
| **ADMIN / OWNER** | Samuel Mekala | `samuel@gmail.com` | `admin123` | Multi-branch management, reagent stock inventory, employee work analysis, security audit logs |

---

## ✨ Key Features & Technical Highlights

1. **Specimen Barcode & Accessioning Engine (`LLD-B-XXXXXX`)**:
   - Thread-safe, atomic business ID generation preventing race conditions or barcode collisions across multi-branch traffic.
2. **Automated HIGH / LOW Clinical Flag Calculation**:
   - Dynamic reference range parsing (`min-max` numeric bounds) calculating parameter flags (`HIGH`, `LOW`, `NORMAL`) for pathologist review.
3. **NABL Programmatic PDF Report Generator with QR Verification**:
   - Built using **ReportLab** with a 2-pass `NumberedCanvas` page numbering engine, letterhead overlay, and embedded QR code verification.
4. **LifeLong AI Booking Assistant & Guardrail System**:
   - Interactive chatbot aiding test catalog exploration and 1-click booking, equipped with polite out-of-scope guardrails and support ticket integration.
5. **Real-time Workflow Notification Engine**:
   - Dynamic polling engine broadcasting role-tailored alerts to Patients, Phlebotomists, Technicians, and Pathologists as specimen status advances.
6. **100% Mobile & Multi-Screen Responsive UI**:
   - Mobile-first TailwindCSS design system featuring slide-out navigation drawers, touch-friendly workstations, and zero horizontal screen overflow.

---

## 🛠️ Technology Stack

### Frontend Architecture
* **Framework**: React 18 + Vite (SPA)
* **Routing**: React Router v6
* **Styling**: TailwindCSS + Lucide Icons + Framer Motion
* **Hosting**: Vercel

### Backend Architecture
* **Framework**: Python 3.11 + Django 5.0 + Django REST Framework (DRF)
* **Authentication**: SimpleJWT (JWT Access/Refresh tokens)
* **PDF Engine**: ReportLab + Python-QRCode
* **Static Assets**: WhiteNoise
* **Database**: MySQL 9.7 (Production on Render) / SQLite3 (Local Dev)
* **Hosting**: Render

---

## 📂 Repository Structure

```
lifeline-diagnostics/
├── backend/                             # Python Django REST Backend
│   ├── accounts/                        # User Model, JWT Serializers, RBAC
│   ├── patient_portal/                  # Staff & Patient REST API Views
│   ├── laboratory/                      # Test Catalogs, Samples, OrderedTests, Results
│   ├── reports/                         # ReportLab NABL PDF Engine & QR Code Generator
│   ├── common/                          # Atomic Business ID Generator
│   └── config/                          # Django Settings, CORS & WSGI Configuration
├── src/                                 # React 18 Frontend
│   ├── components/                      # AI Chatbot, Favicon Logo, Report Inspector, Sidebar
│   ├── features/                        # Role-Tailored Workstations (Technician, Pathologist, Reception)
│   ├── layouts/                         # Top Navbar, Dynamic Notification Engine
│   └── services/                        # Axios API Client & JWT Interceptors
├── public/                              # Circular Emblem Logo & Favicon Assets
├── index.html                           # SPA Entry Point with Circular Favicon
└── README.md                            # Repository Documentation
```

---

## 🚀 Running Locally

### 1. Backend Setup (Django REST API)
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations & seed catalog
python manage.py migrate
python manage.py seed_full_catalog

# Start Django backend server (runs on http://127.0.0.1:8000)
python manage.py runserver 8000
```

### 2. Frontend Setup (React + Vite)
```bash
# Open root project directory
npm install

# Start Vite React server (runs on http://localhost:3000)
npm run dev
```

---

## 📄 License & Accreditation
* **Accreditation**: NABL Accredited & ISO 9001:2015 Certified
* **Helpline**: +91 96033 48519
* **Main Hub**: MG Road, Vijayawada, Andhra Pradesh, India
