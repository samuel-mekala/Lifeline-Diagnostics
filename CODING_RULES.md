# CODING_RULES.md

# Lifeline Diagnostics — Coding Rules

These rules are mandatory for every implementation, whether performed by Codex, ChatGPT, or a human developer.

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

Views must remain thin.

Serializers validate input only.

Models represent data only.

---

# General Rules

- Never put business logic inside Views.
- Never duplicate business logic.
- Reuse existing Services whenever possible.
- Follow the existing project architecture.
- Keep APIs backward compatible.
- Never introduce breaking changes without approval.
- Keep code production-ready.

---

# Scope Rules

- Work on ONE sprint only.
- Do NOT modify unrelated modules.
- Do NOT refactor unrelated code.
- Do NOT change existing API contracts unless required.
- Do NOT introduce unnecessary dependencies.

---

# Code Quality

- Write clean and readable code.
- Follow existing naming conventions.
- Keep methods focused and small.
- Remove dead code only when requested.
- Prefer readability over cleverness.

---

# Testing Rules

Every completed sprint MUST include:

- Unit tests
- Updated existing tests (if required)

Before considering a sprint complete, run:

python manage.py check

python manage.py test

Both commands must pass.

---

# Git Workflow

One Sprint

↓

Implement

↓

Review

↓

Fix

↓

Run Tests

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

↓

Next Sprint

---

# Commits

One sprint = One commit.

Keep commit messages focused.

Example:

feat(laboratory): implement result workflow

fix(billing): prevent invoice overpayment

---

# Documentation

After every completed sprint:

- Update PROJECT_STATE.md
- Update PROJECT_KNOWLEDGE_TRANSFER.md

The project documentation must always reflect the latest stable state.

---

# Important

If unsure:

- Preserve existing behavior.
- Ask before making architectural changes.
- Never rewrite working modules.
- Never make large multi-sprint changes.

Small, safe, reviewable changes are always preferred over large changes.