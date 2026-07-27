# PROJECT STATE

## Project
Lifeline Diagnostics (Django REST Framework LIMS)

---

## Current Status

**Phase:** Production Hardening

**Current Sprint:** Sprint 10.1 – Authentication & Authorization

**Branch:** main

**Repository Status:** Clean

---

## Completed Modules

- ✅ Accounts (Base)
- ✅ Patients
- ✅ Visits
- ✅ Billing
- ✅ Laboratory Workflow
- ✅ Reports (PDF Generation)

---

## Current Architecture

APIView
↓
Serializer
↓
Service Layer
↓
Models
↓
Database

Business logic belongs only in the Service layer.

---

## Current Workflow

Patient
→ Visit
→ Sample
→ Ordered Test
→ Result
→ Report
→ Invoice
→ Payment

---

## Current Sprint Goals

- [ ] Add JWT Authentication
- [ ] Add Role-Based Authorization
- [ ] Protect API Endpoints
- [ ] Create Permission Classes
- [ ] Add Authentication Tests

---

## Backlog

### Critical
- [ ] Authentication & Permissions
- [ ] Result Immutability
- [ ] Authenticated Approval

### High
- [ ] OTP Login
- [ ] Report Completeness
- [ ] Sample Workflow Validation
- [ ] Billing Integrity
- [ ] Package Workflow
- [ ] Race-Safe Business ID Generation
- [ ] Patient Retention Policy
- [ ] Production Configuration

### Medium
- [ ] Report Generation Improvements
- [ ] Exception Handling
- [ ] Database Constraints
- [ ] Patient Validation
- [ ] Pagination
- [ ] PDF Sanitization
- [ ] Test Coverage

### Low
- [ ] Cleanup
- [ ] Refactoring
- [ ] Performance Improvements

---

## Verification Before Every Commit

Run:

```bash
python manage.py check
python manage.py test
```

Both must pass before committing.

---

## Last Stable State

- Git Status: Clean
- Branch: main
- Latest Commit: (update after each commit)
- Tests: Passing

---

## Notes

- Work one sprint at a time.
- Do not modify unrelated modules.
- Preserve existing API contracts where possible.
- Commit after every completed sprint.