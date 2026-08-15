#!/usr/bin/env bash
set -e

echo "🛡️ Running Mypy on backend..."
cd backend
if [ -d ".venv" ]; then
    .venv/bin/mypy apps config
else
    mypy apps config
fi
cd ..

echo "🛡️ Running TypeScript compiler on frontend..."
cd frontend
npm run typecheck
cd ..

echo "✅ All type checks passed with 0 errors!"
