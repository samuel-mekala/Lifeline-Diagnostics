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

## Sprint 11

### Features

- Implemented sample lifecycle validation.
- Added sample type compatibility validation.
- Added ordered test assignment validation.
- Added result creation validation.
- Added result submission validation.
- Added result approval validation.
- Added PDF report generation validation.
- Added manual API testing collection (`api_testing.http`).
- Added project coding rules documentation.

### Verification

- `python manage.py check` ✅
- `python manage.py test` ✅ (21 tests)
- Manual API testing completed successfully.

### Commit

`b9169d4` — Sprint 11: Complete laboratory workflow and report validation

## Sprint 12

### Features

- Implemented complete billing workflow.
- Added invoice creation with duplicate invoice prevention.
- Added laboratory test and package billing.
- Added automatic subtotal, discount, total amount, and balance calculations.
- Added invoice finalization workflow.
- Added payment recording with partial and full payment support.
- Added refund workflow with automatic invoice recalculation.
- Added financial integrity validations.

### Validation

- Prevented duplicate invoice creation.
- Prevented modification of finalized invoices.
- Prevented payments on draft invoices.
- Prevented overpayment.
- Prevented discounts exceeding subtotal.
- Enforced positive payment amounts.

### Verification

- `python manage.py check` ✅
- `python manage.py test` ✅ (33 tests)
- Manual API testing completed (15/15 scenarios).

### Commit

`4b3df56` — Sprint 12: Billing integrity workflow