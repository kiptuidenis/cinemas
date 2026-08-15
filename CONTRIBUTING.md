# Contributing to Cinema Management Platform

Thank you for contributing to the Cinema Management Platform SaaS. This document outlines the local developer setup, quality assurance toolchain, and coding standards.

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

---

## 3. Toolchain Reference

- **Python Formatter & Linter**: [Ruff](https://docs.astral.sh/ruff/) (executes in milliseconds, replaces Black, Flake8, isort, and Bandit).
- **Python Static Type Checking**: [Mypy](https://mypy.readthedocs.io/) with `django-stubs` and `djangorestframework-stubs`.
- **Frontend Formatter**: [Prettier](https://prettier.io/).
- **Frontend Linter & Static Types**: ESLint 9 (Flat Config) + TypeScript compiler (`tsc`).
- **Secret Detection**: [Gitleaks](https://github.com/gitleaks/gitleaks) & `detect-private-key`.
- **Vulnerability Auditing**: `pip-audit` (PyPI/OSV) and `npm audit`.

---

## 4. Vulnerability Triage Policy

If `pip-audit` or `npm audit` reports a CVE in an upstream transitive dependency where no patched release is currently available, document the exception in `.audit-ignore.json` with:
1. Advisory/CVE ID
2. Upstream package name
3. Upstream issue URL
4. Expiration date for re-evaluation
