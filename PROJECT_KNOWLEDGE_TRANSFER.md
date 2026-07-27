Lifeline Diagnostics - Knowledge Transfer
Project Overview

This is a Django REST Framework based Laboratory Information Management System (LIMS) for diagnostic laboratories.

Architecture follows:

APIView
    ↓
Serializer
    ↓
Service Layer
    ↓
Models
    ↓
Database

Business logic must remain inside the Service layer.

Tech Stack
Python
Django
Django REST Framework
MySQL (Production)
SQLite (Development)
ReportLab (PDF Reports)
Modules

Completed modules:

Accounts
Patients
Visits
Laboratory
Billing
Reports

Future modules:

Inventory
Notifications
Dashboard
Analytics
Settings
Workflow
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
ID System

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
Entry Modes

Visit supports

WALK_IN
HOME_COLLECTION
ONLINE
DOCTOR_REFERRAL

Billing price depends on entry mode.

Project Principles
Never put business logic inside Views.
Business logic belongs inside Services.
Views should remain thin.
Serializers validate input.
Services implement workflows.
Keep APIs backward compatible whenever possible.
Current Status

Completed

Patient Management
Visit Management
Laboratory Workflow
Billing
PDF Reports
End-to-End Workflow

Tests currently pass.

python manage.py check
python manage.py test
Git

Repository already initialized.

Current branch

main

Latest stable commit has been pushed to GitHub.

Current Development Phase

The project is now in Production Hardening.

We are NOT building major new features.

We are fixing security, integrity and production issues.

Code Review Findings

We already have a review report.

We will implement fixes sprint-by-sprint.

Do NOT attempt to fix everything at once.

Locked Sprint Roadmap

Sprint 10.1

Authentication

JWT
Role-based permissions
Protect APIs

Sprint 10.2

Result Integrity

Immutable approved results
Approval workflow

Sprint 11

Laboratory Workflow

Sprint 12

Billing Integrity

Sprint 13

Production Readiness

Sprint 14

Validation & Tests

Sprint 15

Cleanup

Sprint 16

Documentation

Sprint 17

Frontend

Sprint 18

Deployment

Development Rules

Before every completion:

Run

python manage.py check

Run

python manage.py test

Fix all failing tests.

Only then finish the sprint.

Do not modify unrelated code.

Do not introduce breaking API changes.

Keep commits focused on a single sprint.

Coding Standards
Follow existing architecture.
Reuse existing services.
Do not duplicate business logic.
Keep code production-ready.
Write tests for every new feature or fix.
Prefer readability over cleverness.
Current Sprint

Sprint 10.1

Implement ONLY:

JWT Authentication
Role-based Authorization
Protected APIs
Permission Classes
Tests

Do not work on other review items until Sprint 10.1 is complete.