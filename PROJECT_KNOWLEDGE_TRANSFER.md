# Lifeline Diagnostics — Knowledge Transfer v2

> Read `CODING_RULES.md` before making any code changes.

# Project Overview

Production-grade Laboratory Information Management System (LIMS)

Built using:

- Python
- Django
- Django REST Framework
- SQLite (Development)
- MySQL (Production)
- ReportLab

---

# Architecture

APIView

↓

Serializer

↓

Service Layer

↓

Models

↓

Database

Business logic belongs ONLY inside the Service Layer.

Views remain thin.

Serializers validate input only.

---

# Workflow

Patient

↓

Visit

↓

Sample

↓

Ordered Test

↓

Result Entry

↓

Submit

↓

Approve

↓

Generate Report

↓

Invoice

↓

Payment

---

# Business IDs

Internal Primary Keys

UUID

Business IDs

PAT

VIS

SAM

ORD

RES

REP

INV

PAY

---

# Current Modules

Completed

- Accounts
- Patients
- Visits
- Laboratory
- Billing
- Reports

Future

- Inventory
- Notifications
- Dashboard
- Analytics
- Settings

---

# Development Philosophy

- Business logic belongs inside Services.
- Views remain thin.
- Serializers validate only.
- Keep APIs backward compatible.
- Never rewrite working modules.
- Keep commits small and focused.
- Production-ready code only.

---

# Current Development Phase

Production Hardening

---

# Locked Sprint Roadmap

## ✅ Sprint 10.1

Security & Authentication

Completed:

- JWT Authentication
- Role-Based Authorization
- Protected APIs
- Permission Classes

---

## ✅ Sprint 10.2

Result Integrity

Completed:

- Result Workflow
- Result Immutability
- Approval Workflow
- Approval Timestamp
- Workflow Validation

---

## ✅ Sprint 11

Laboratory Workflow Corrections

Completed:

- Sample Lifecycle Validation
- Sample Type Validation
- Ordered Test Assignment Validation
- Result Creation Validation
- Result Submission Validation
- Result Approval Validation
- Report Generation Validation
- Complete Manual API Testing

---

## ✅ Sprint 12

Billing Integrity

Completed:

- Invoice creation
- Invoice lifecycle
- Test/package billing
- Discounts
- Payment recording
- Refund workflow
- Financial integrity validation
- Complete Manual API Testing

---

## ✅ Sprint 13

Production Readiness

Completed:

- Environment-based configuration
- Production-ready security settings
- Centralized DRF exception handling
- Standardized API error responses
- Health endpoint with live database validation
- Production logging
- Static and media production configuration
- README documentation
- `.env.example`
- Complete Manual API Testing

## ✅ Sprint 14

Validation & Testing

Completed:

- Optional Pagination
- Legacy Pagination Compatibility
- Validation Improvements
- Database Integrity Enhancements
- PDF Generation Improvements
- Expanded Automated Test Coverage
- Complete Manual API Testing

---

## Future Roadmap

Sprint 15

Cleanup

Sprint 16

Documentation

Sprint 17

Frontend Integration

Sprint 18

Deployment

---

# Testing Rules

Before completing every sprint:

python manage.py check

python manage.py test

Manual API Testing

Only then:

Commit

Push

Update Documentation

---

# Latest Verification

- python manage.py check ✅
- python manage.py test ✅ (50 tests)
- Manual API Testing ✅

---

# Verified Workflow

Patient
↓
Visit
↓
Ordered Test
↓
Sample
↓
Assign Sample
↓
Create Result
↓
Update Parameters
↓
Submit Result
↓
Approve Result
↓
Generate PDF Report
↓
Create Invoice
↓
Finalize Invoice
↓
Record Payment
↓
Refund (if applicable)

---

# Git Workflow

One Sprint

↓

Codex

↓

ChatGPT Review

↓

Fix

↓

Tests

↓

Manual API Testing

↓

Commit

↓

Push

↓

Update PROJECT_STATE.md

↓

Update PROJECT_KNOWLEDGE_TRANSFER.md

---

# Current Stable Commit

ac57d0f

Sprint 13: Production Readiness