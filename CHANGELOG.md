# CHANGELOG

## Sprint 10.1

### Features
- Implemented JWT Authentication.
- Added Role-Based Authorization.
- Protected API endpoints.
- Added permission classes.
- Added authentication tests.

---

## Sprint 10.2

### Features
- Implemented laboratory result workflow.
- Added DRAFT → SUBMITTED → APPROVED state transitions.
- Added REJECTED workflow.
- Prevented invalid state transitions.
- Enforced result immutability after approval.
- Added approval timestamp (`verified_at`).
- Added workflow tests.

### Verification
- `python manage.py check` ✅
- `python manage.py test` ✅
- Manual API testing completed.

### Commit
`f3ec04` — feat(laboratory): implement result workflow with state transitions