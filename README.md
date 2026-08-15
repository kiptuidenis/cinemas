# Cinema Management Platform — Production MVP

A multi-tenant, high-assurance cinema management SaaS platform built with Django REST Framework, React (TypeScript), PostgreSQL, Redis, and Celery.

---

## Architecture Overview

- **Backend**: Python 3.14+, Django 5.x, Django REST Framework, SimpleJWT (HttpOnly secure cookies), PostgreSQL native Row-Level Security (RLS) multi-tenancy.
- **Frontend**: React 19 / 18, TypeScript, Vite, TanStack Query, Vanilla CSS design tokens.
- **Database**: PostgreSQL 16 (Relational integrity, row-level locking `SELECT FOR UPDATE`, exclusion constraints).
- **Asynchronous Engine**: Redis 7 + Celery (Seat hold expiration, async notifications).
- **Payment Abstraction**: Decoupled `PaymentProvider` interface (Safaricom M-Pesa Daraja STK Push + Mock Provider).

---

## Local Development Quickstart

### Option 1: Native Local Mode (Windows / macOS / Linux)

#### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements/dev.txt
python manage.py migrate
python manage.py runserver 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend will run at `http://localhost:5173` and communicate with Django API at `http://localhost:8000`.

---

### Option 2: Containerized Mode (Docker Compose)

```bash
cp .env.example .env
docker compose up --build
```

Services started:
- `backend`: `http://localhost:8000`
- `frontend`: `http://localhost:5173`
- `postgres`: `localhost:5432`
- `redis`: `localhost:6379`

---

## Running Tests

### Backend Tests (Pytest)
```bash
cd backend
pytest
# With coverage report:
pytest --cov=apps --cov-report=term-missing
```

### Frontend Tests (Vitest)
```bash
cd frontend
npm run test:run
```
