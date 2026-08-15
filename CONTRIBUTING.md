# Contributing to Cinema Management Platform

Thank you for contributing to the Cinema Management Platform SaaS. This document outlines the local developer setup, quality assurance toolchain, progressive test coverage roadmap, and GitHub CI requirements.

---

## 1. Quick Developer Onboarding (3 Steps)

Follow this exact sequence on a fresh clone to ensure all local hooks and compilers initialize cleanly:

### Step 1: Backend Virtual Environment Setup
```bash
cd backend
python -m venv .venv

# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On macOS/Linux:
source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements/dev.txt
cd ..
```

### Step 2: Frontend Dependency Installation
```bash
cd frontend
npm install
cd ..
```

### Step 3: Initialize Pre-Commit Quality Guardrails
```bash
# On Windows PowerShell:
.\backend\.venv\Scripts\pre-commit.exe install
# On macOS/Linux:
pre-commit install
```

---

## 2. Quality Assurance & Static Analysis Tooling

Every commit is validated locally by `pre-commit` before entering Git history. You can also run the checks manually at any time:

### Full Monorepo Checks (Single Command)
- **Windows PowerShell**:
  - Linting: `.\scripts\lint.ps1`
  - Formatting: `.\scripts\format.ps1`
  - Type-checking: `.\scripts\typecheck.ps1`
  - Security vulnerability audit: `.\scripts\audit.ps1`
- **Linux / macOS**:
  - Linting: `./scripts/lint.sh`
  - Formatting: `./scripts/format.sh`
  - Type-checking: `./scripts/typecheck.sh`
  - Security vulnerability audit: `./scripts/audit.sh`
- **Cross-Platform via root npm**:
  - `npm run lint`
  - `npm run format`
  - `npm run typecheck`
  - `npm run audit`
  - `npm run test`

---

## 3. Progressive Coverage & Type Safety Ratchet Schedule

To ensure quality thresholds scale systematically as business modules land, the following thresholds are enforced per milestone:

| Phase / Milestone | Target Scope | Min. Test Coverage | Mypy Strictness Level |
|---|---|---|---|
| **Phase 0 (Foundations)** | `apps.core` | Monitored (Artifacts generated) | Strict on `apps.core.*` |
| **Phase 1 (Multi-Tenancy)** | `apps.core`, `apps.cinemas` | **70%** (`--cov-fail-under=70`) | Strict on `apps.core.*`, `apps.cinemas.services` |
| **Phase 3 (Concurrency & Seats)** | `apps.bookings.services` | **85%** (Critical path concurrency) | Full strict on all booking/locking services |
| **Phase 5 (Customer Booking)** | Monorepo Backend | **80%** (`--cov-fail-under=80`) | Strict on all viewsets & domain services |
| **Phase 10 (Launch Gate)** | Monorepo Total | **85%** + Zero CVEs | 100% strict typing across entire backend |

---

## 4. GitHub Actions CI & Branch Protection Rules

All pull requests targeting `main` must pass the automated GitHub Actions CI matrix before merging:

### Automated CI Turnstiles
1. **`Code Quality & Pre-Commit`**: Verifies Ruff, Gitleaks, ESLint, Prettier, JSON/YAML integrity.
2. **`Backend CI (Python 3.14)`**: Runs Django system checks, Mypy type-checking, and Pytest test suite with Postgres 16 + Redis 7 services.
3. **`Frontend CI (Node 24)`**: Runs TypeScript compiler (`tsc --noEmit`), Vitest unit tests, and production Vite bundle build.
4. **`Python 3.12 Compatibility Smoke`**: Verifies minimum supported Python dependency installation.

### One-Time GitHub Branch Protection Setup (Repository Admins)
To enforce these gates in GitHub:
1. Navigate to **Repository Settings** > **Branches**.
2. Click **Add branch protection rule** for branch pattern `main`.
3. Check **Require a pull request before merging**.
4. Check **Require status checks to pass before merging** and search for:
   - `Code Quality & Pre-Commit`
   - `Backend CI (Python 3.14)`
   - `Frontend CI (Node 24)`
   - `Python 3.12 Compatibility Smoke`
5. Check **Require conversation resolution before merging**.
6. Save changes.

---

## 5. Toolchain Reference

- **Python Formatter & Linter**: [Ruff](https://docs.astral.sh/ruff/) (executes in milliseconds, replaces Black, Flake8, isort, and Bandit).
- **Python Static Type Checking**: [Mypy](https://mypy.readthedocs.io/) with `django-stubs` and `djangorestframework-stubs`.
- **Frontend Formatter**: [Prettier](https://prettier.io/).
- **Frontend Linter & Static Types**: ESLint 9 (Flat Config) + TypeScript compiler (`tsc`).
- **Secret Detection**: [Gitleaks](https://github.com/gitleaks/gitleaks) & `detect-private-key`.
- **Vulnerability Auditing**: `pip-audit` (PyPI/OSV) and `npm audit`.

---

## 6. Vulnerability Triage Policy

If `pip-audit` or `npm audit` reports a CVE in an upstream transitive dependency where no patched release is currently available, document the exception in `.audit-ignore.json` with:
1. Advisory/CVE ID
2. Upstream package name
3. Upstream issue URL
4. Expiration date for re-evaluation
