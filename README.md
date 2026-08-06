# 🔬 Life Line Diagnostics — Pathology Information System & LIMS

[![Frontend Status](https://img.shields.io/badge/Frontend-Vercel-success?style=for-the-badge&logo=vercel)](https://lifeline-diagnostics.vercel.app)
[![Backend Status](https://img.shields.io/badge/Backend-Render-blue?style=for-the-badge&logo=render)](https://lifeline-diagnostics.onrender.com)
[![NABL Compliance](https://img.shields.io/badge/Compliance-NABL%20%26%20ISO%209001%3A2015-emerald?style=for-the-badge)](https://lifeline-diagnostics.vercel.app)
[![Python Version](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python)](https://python.org)
[![Django Version](https://img.shields.io/badge/Django-5.0-092E20?style=for-the-badge&logo=django)](https://djangoproject.com)
[![React Version](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org)

**Life Line Diagnostics** is an enterprise-grade, NABL-accredited **Laboratory Information Management System (LIMS)** and Pathology Information Platform. Designed for modern diagnostic laboratories, home specimen collection fleets, and multi-branch healthcare centers, it automates the full patient lifecycle—from online booking and accessioning to automated clinical flagging, pathologist sign-off, NABL PDF report generation, and billing.

---

## 🌐 Live Production Deployments

* 🌐 **Live Web Application**: [https://lifeline-diagnostics.vercel.app](https://lifeline-diagnostics.vercel.app)
* ⚡ **Live REST API Backend**: [https://lifeline-diagnostics.onrender.com](https://lifeline-diagnostics.onrender.com)

---

## 💡 Executive Summary & Core Workflow

```
[ Patient / Chatbot ] ──► [ Online / Walk-in Booking ] ──► [ Accessioning (LLD-B-XXXXXX) ]
                                                                      │
[ NABL PDF Report ] ◄── [ Pathologist Review ] ◄── [ Auto Flagging ] ◄┴── [ Specimen Collection ]
      │                                                (HIGH/LOW)
      ▼
[ QR Code Verification ]
```

### Key Workflow Highlights

1. **Specimen Accessioning & Barcode Engine (`LLD-B-XXXXXX`)**:
   - Thread-safe, atomic business ID sequence generator preventing barcode collisions across multi-branch and concurrent walk-in/online traffic.
2. **Automated Clinical Range Flagging**:
   - Dynamic numerical reference range engine calculating parameter flags (`NORMAL`, `HIGH` ↑, `LOW` ↓) based on standard age and gender clinical benchmarks.
3. **NABL-Compliant PDF Report Generator with QR Verification**:
   - Programmatic PDF generation powered by **ReportLab** with a 2-pass `NumberedCanvas` page numbering engine, custom letterhead branding, and anti-tamper QR code verification URLs.
4. **LifeLong AI Booking Assistant & Guardrails**:
   - OpenAI GPT-driven interactive assistant aiding patients with test catalog discovery, preparation instructions, and 1-click appointment booking with out-of-scope clinical guardrails.
5. **Role-Based Workstation Dashboards (RBAC)**:
   - Dedicated interactive interfaces tailored for **Owners/Admins**, **Pathologists**, **Lab Technicians**, **Reception Desk**, **Phlebotomists**, and **Patients**.
6. **Billing & Financial Management Engine**:
   - Automatic invoice compilation supporting tests & packages, customizable discounts, multiple payment modes (Cash, UPI, Card, NetBanking), and payment tracking (Paid, Unpaid, Partially Paid).
7. **Fleet, Equipment & Roster Operations**:
   - Real-time analyzer equipment monitoring (operational status, calibration due dates) and employee shift rostering across diagnostic hubs.

---

## 🛠️ Technology Stack

| Domain | Technology / Library | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 + Vite | High-performance Single Page Application (SPA) |
| **State & Routing** | React Router v6 | Client-side view routing & layout management |
| **Styling & UI** | TailwindCSS + Framer Motion | Modern design system, fluid transitions, and responsive layout |
| **Icons** | Lucide React | Clean, scalable UI icon system |
| **Backend Framework** | Python 3.11 + Django 5.0 | High-reliability web framework with Django REST Framework (DRF) |
| **Authentication** | SimpleJWT + Email OTP | JSON Web Tokens with passwordless OTP verification fallback |
| **Document Engine** | ReportLab + Python-QRCode | Programmatic NABL PDF generation with embedded QR codes |
| **Database** | MySQL 9.7 / SQLite3 | MySQL in production (Render), SQLite3 for local development |
| **Asset Delivery** | WhiteNoise | Compressed static file serving for Django |
| **Cloud Hosting** | Vercel (Frontend) + Render (Backend) | CI/CD automated cloud deployment pipelines |

---

## 📐 Database Architecture & Entity-Relationship (ER) Diagrams

The database schema is structured into modular domain apps handling specific functional areas.

### 1. High-Level Core ER Overview

This diagram displays the primary domain relationships connecting Users, Patients, Appointments, Visits, Samples, Results, Invoices, and Reports.

```mermaid
erDiagram
    USER ||--o| PATIENT : "linked_user"
    PATIENT ||--o{ APPOINTMENT : "books"
    PATIENT ||--o{ VISIT : "has"
    PATIENT ||--o{ PATIENT_ADDRESS : "owns"
    VISIT ||--o| APPOINTMENT : "originates_from"
    VISIT ||--o{ SAMPLE : "collects"
    VISIT ||--o{ ORDERED_TEST : "contains"
    VISIT ||--o| INVOICE : "bills"
    VISIT ||--o| REPORT : "generates"
    SAMPLE ||--o{ ORDERED_TEST : "attached_to"
    ORDERED_TEST ||--o| RESULT : "produces"
    RESULT ||--o{ RESULT_PARAMETER : "contains"
    INVOICE ||--o{ INVOICE_ITEM : "contains"
    INVOICE ||--o{ PAYMENT : "settled_by"
    USER ||--o{ APPOINTMENT : "assigned_phlebotomist"
    USER ||--o{ SAMPLE : "collected_by"
    USER ||--o{ RESULT : "verified_by"
    USER ||--o{ REPORT : "approved_by"
```

---

### 2. User Authentication & Employee Management Domain

Manages role-based access control (RBAC), staff directories, departments, duty shifts, and staff rosters.

```mermaid
erDiagram
    USER {
        int id PK
        string email UK
        string full_name
        string phone
        string role
        boolean is_active
        boolean is_staff
        datetime date_joined
    }

    EMAIL_OTP {
        int id PK
        string email
        string code_hash
        string purpose
        datetime expires_at
        datetime used_at
        int failed_attempts
        datetime locked_until
    }

    DEPARTMENT {
        int id PK
        string code UK
        string name
        string description
    }

    ROLE {
        int id PK
        string title UK
        string access_level
        string description
    }

    EMPLOYEE {
        int id PK
        string emp_id UK
        string full_name
        string email UK
        string phone
        string qualification
        string license_number
        string status
        date joined_date
        int department_id FK
        int role_id FK
    }

    DUTY_SHIFT {
        int id PK
        string shift_name
        time start_time
        time end_time
    }

    STAFF_ROSTER {
        int id PK
        date work_date
        string assigned_branch
        string status
        int employee_id FK
        int shift_id FK
    }

    DEPARTMENT ||--o{ EMPLOYEE : "has_staff"
    ROLE ||--o{ EMPLOYEE : "defines_role"
    EMPLOYEE ||--o{ STAFF_ROSTER : "scheduled_in"
    DUTY_SHIFT ||--o{ STAFF_ROSTER : "defines_shift"
```

---

### 3. Patient & Appointment Scheduling Domain

Stores patient demographic profiles, multiple delivery/collection addresses, family members, health trends, and appointment bookings.

```mermaid
erDiagram
    PATIENT {
        uuid id PK
        string patient_id UK
        string full_name
        date date_of_birth
        string gender
        string phone
        string email
        text address
        datetime registered_on
        int linked_user_id FK
    }

    PATIENT_ADDRESS {
        uuid id PK
        string label
        text address
        boolean is_default
        datetime created_at
        uuid patient_id FK
    }

    PATIENT_FAMILY_MEMBER {
        int id PK
        string member_name
        string relationship
        int age
        string gender
        uuid primary_patient_id FK
    }

    HEALTH_TREND_RECORD {
        int id PK
        string parameter_name
        decimal parameter_value
        string unit
        date recorded_date
        uuid patient_id FK
    }

    APPOINTMENT {
        uuid id PK
        string collection_type
        datetime scheduled_for
        string status
        string payment_preference
        string payment_status
        text remarks
        datetime created_at
        uuid patient_id FK
        uuid visit_id FK
        uuid address_id FK
        int assigned_to_id FK
    }

    PATIENT ||--o{ PATIENT_ADDRESS : "has_addresses"
    PATIENT ||--o{ PATIENT_FAMILY_MEMBER : "has_family"
    PATIENT ||--o{ HEALTH_TREND_RECORD : "tracks_trends"
    PATIENT ||--o{ APPOINTMENT : "books_appointments"
    PATIENT_ADDRESS ||--o{ APPOINTMENT : "location_for"
```

---

### 4. Laboratory Catalog & Test Execution Domain

Core diagnostic module managing test definitions, sub-parameters, packages, pricing models, specimen collection, test orders, and flagged results.

```mermaid
erDiagram
    LABORATORY_TEST {
        uuid id PK
        string test_id UK
        string name
        string category
        string sample_type
        boolean is_active
    }

    TEST_PARAMETER {
        uuid id PK
        string parameter_id UK
        string name
        string unit
        string reference_range
        int display_order
        uuid laboratory_test_id FK
    }

    PACKAGE {
        uuid id PK
        string package_id UK
        string name
        text description
        boolean is_active
    }

    PACKAGE_TEST {
        uuid id PK
        int display_order
        uuid package_id FK
        uuid laboratory_test_id FK
    }

    TEST_PRICE {
        uuid id PK
        decimal walk_in_price
        uuid laboratory_test_id FK
    }

    PACKAGE_PRICE {
        uuid id PK
        decimal walk_in_price
        uuid package_id FK
    }

    SAMPLE {
        uuid id PK
        string sample_id UK
        string sample_type
        string status
        datetime collected_at
        text remarks
        uuid visit_id FK
        int collected_by_id FK
    }

    ORDERED_TEST {
        uuid id PK
        string order_id UK
        string status
        text remarks
        uuid visit_id FK
        uuid laboratory_test_id FK
        uuid sample_id FK
    }

    RESULT {
        uuid id PK
        string result_id UK
        string status
        text remarks
        datetime verified_at
        uuid sample_id FK
        uuid ordered_test_id FK
        int verified_by_id FK
    }

    RESULT_PARAMETER {
        uuid id PK
        string value
        string reference_range
        string flag
        text remarks
        uuid result_id FK
        uuid test_parameter_id FK
    }

    LABORATORY_TEST ||--o{ TEST_PARAMETER : "defines_parameters"
    LABORATORY_TEST ||--o| TEST_PRICE : "walk_in_pricing"
    LABORATORY_TEST ||--o{ PACKAGE_TEST : "included_in"
    PACKAGE ||--o{ PACKAGE_TEST : "contains_tests"
    PACKAGE ||--o| PACKAGE_PRICE : "walk_in_pricing"
    ORDERED_TEST ||--o| RESULT : "generates_result"
    SAMPLE ||--o{ ORDERED_TEST : "analyzed_in"
    RESULT ||--o{ RESULT_PARAMETER : "records_values"
    TEST_PARAMETER ||--o{ RESULT_PARAMETER : "measured_by"
```

---

### 5. Billing, Invoicing & Financial Operations Domain

Handles financial records for patient visits, line items, and payment transactions.

```mermaid
erDiagram
    VISIT {
        uuid id PK
        string visit_id UK
        string entry_mode
        string status
        text remarks
        datetime created_at
        uuid patient_id FK
    }

    INVOICE {
        uuid id PK
        string invoice_id UK
        uuid verification_token UK
        string status
        string payment_preference
        decimal subtotal
        decimal discount
        decimal total_amount
        decimal amount_paid
        decimal balance_due
        text notes
        uuid visit_id FK
    }

    INVOICE_ITEM {
        uuid id PK
        string item_type
        string item_id
        string item_name
        int quantity
        decimal unit_price
        decimal discount
        decimal line_total
        uuid invoice_id FK
    }

    PAYMENT {
        uuid id PK
        string payment_id UK
        decimal amount
        string payment_method
        string status
        string transaction_reference
        text remarks
        datetime paid_at
        uuid invoice_id FK
    }

    VISIT ||--o| INVOICE : "billed_under"
    INVOICE ||--o{ INVOICE_ITEM : "itemized_with"
    INVOICE ||--o{ PAYMENT : "settled_with"
```

---

### 6. Branch Fleet, Reports, Notifications & System Config Domain

Covers lab equipment management, NABL report tracking, email notifications, activity logs, and global system parameters.

```mermaid
erDiagram
    BRANCH {
        int id PK
        string code UK
        string name
        text address
        string city
        string phone
        boolean is_central_hub
    }

    LAB_EQUIPMENT {
        int id PK
        string machine_id UK
        string name
        string manufacturer
        string model_number
        string department_name
        string status
        date last_serviced
        date next_service_due
        int branch_id FK
    }

    INVENTORY_ITEM {
        int id PK
        string name
        string sku UK
        string unit
        decimal quantity
        decimal reorder_level
    }

    STOCK_USAGE {
        int id PK
        decimal quantity
        string reason
        datetime created_at
        int item_id FK
        int recorded_by_id FK
    }

    REPORT {
        uuid id PK
        string report_id UK
        uuid verification_token UK
        string status
        datetime generated_at
        datetime verified_at
        text rejection_notes
        uuid visit_id FK
        int verified_by_id FK
    }

    NOTIFICATION {
        int id PK
        string recipient
        string category
        text message
        json metadata
        string status
        text error
    }

    SYSTEM_SETTINGS {
        int id PK
        string laboratory_name
        text laboratory_address
        string laboratory_phone
        string laboratory_email
        string primary_color
        string currency
    }

    BRANCH ||--o{ LAB_EQUIPMENT : "houses_equipment"
    INVENTORY_ITEM ||--o{ STOCK_USAGE : "stock_deductions"
    VISIT ||--o| REPORT : "generates_report"
```

---

## 📂 Repository Structure

```
lifeline-diagnostics/
├── backend/                             # Django 5.0 REST Backend
│   ├── accounts/                        # Custom User Model, JWT & Email OTP Auth
│   ├── patients/                        # Patient Registry & Multiple Delivery Addresses
│   ├── visits/                          # Clinical Visits & Appointment Scheduler
│   ├── laboratory/                      # Test Catalog, Parameters, Samples, Results & Flagging
│   ├── billing/                         # Invoices, Line Items & Multi-Method Payments
│   ├── reports/                         # ReportLab NABL PDF Generator & QR Verification
│   ├── inventory/                       # Reagent Stock Tracking & Usage Logs
│   ├── employees/                       # Employee Profiles, Departments, Roles & Duty Rosters
│   ├── branches/                        # Hub & Spoke Branches & Analyzer Equipment Fleet
│   ├── notifications/                   # Multi-Channel Email & System Alert Engine
│   ├── patient_portal/                  # Patient Family Accounts & Health Trend Analytics
│   ├── common/                          # Atomic Business ID Sequence & Exceptions
│   ├── config/                          # Django Settings, CORS, WSGI/ASGI Settings
│   └── manage.py                        # Django Management CLI
├── src/                                 # React 18 SPA Frontend
│   ├── components/                      # AI Chatbot, Favicon, QR Inspector, Navigation
│   ├── features/                        # Role Workstations (Technician, Pathologist, Admin, Patient)
│   ├── layouts/                         # App Header, Sidebar Navigation & Alert Trays
│   ├── services/                        # Axios API Client & JWT Token Refresh Interceptors
│   ├── App.tsx                          # Primary Route Declarations
│   └── main.tsx                         # React Mount Point
├── public/                              # Dynamic Favicon & Emblem Branding Assets
├── DEPLOYMENT.md                        # Production Deployment & Environment Setup Guide
├── index.html                           # SPA HTML Shell
├── package.json                         # Node.js Dependencies & Build Scripts
├── vite.config.ts                       # Vite Bundler Configuration
└── README.md                            # Comprehensive Repository Documentation
```

---

## 🚀 Quick Start & Local Setup

### Prerequisites
* **Node.js** >= 18.x
* **Python** >= 3.11
* **Virtualenv** (`pip install virtualenv`)

### 1. Backend Setup (Django REST API)

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. Run database migrations
python manage.py migrate

# 5. Seed full test catalog and sample data
python manage.py seed_full_catalog

# 6. Start Django development server (listening on http://127.0.0.1:8000)
python manage.py runserver 8000
```

### 2. Frontend Setup (React + Vite)

```bash
# 1. Open root repository directory
cd ..

# 2. Install Node dependencies
npm install

# 3. Start Vite dev server (runs on http://localhost:3000)
npm run dev
```

---

## 📜 Accreditation & Helplines

* **NABL Accreditation**: Accredited in Clinical Pathology, Hematology & Biochemistry
* **ISO Certification**: ISO 9001:2015 Certified Diagnostic Facility
* **Helpline Support**: +91 96033 48519
* **Main Reference Lab**: MG Road, Vijayawada, Andhra Pradesh, India

---

*Developed for Life Line Diagnostics — Advanced Pathology Information Systems.*
