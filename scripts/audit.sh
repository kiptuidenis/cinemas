#!/usr/bin/env bash
set -e

echo "[INFO] Running pip-audit on backend dependencies..."
cd backend
if [ -d ".venv" ]; then
    .venv/bin/pip-audit
else
    pip-audit
fi
cd ..

echo "[INFO] Running npm audit on frontend production dependencies..."
cd frontend
npm audit --omit=dev --audit-level=high
cd ..

echo "[SUCCESS] Zero high/critical vulnerability CVEs found!"
