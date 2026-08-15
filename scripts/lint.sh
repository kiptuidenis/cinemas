#!/usr/bin/env bash
set -e

echo "🔍 Running Ruff linter on backend..."
cd backend
if [ -d ".venv" ]; then
    .venv/bin/ruff check .
else
    ruff check .
fi
cd ..

echo "🔍 Running ESLint on frontend..."
cd frontend
npm run lint
cd ..

echo "✅ All linters passed cleanly!"
