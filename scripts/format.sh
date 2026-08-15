#!/usr/bin/env bash
set -e

echo "✨ Running Ruff formatter on backend..."
cd backend
if [ -d ".venv" ]; then
    .venv/bin/ruff format .
else
    ruff format .
fi
cd ..

echo "✨ Running Prettier formatter on frontend..."
cd frontend
npm run format
cd ..

echo "✅ All formatters completed successfully!"
