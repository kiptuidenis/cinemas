# Linting script for Windows PowerShell
Write-Host "[INFO] Running Ruff linter on backend..." -ForegroundColor Cyan
Push-Location backend
.\.venv\Scripts\ruff.exe check .
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

Write-Host "[INFO] Running ESLint on frontend..." -ForegroundColor Cyan
Push-Location frontend
npm run lint
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

Write-Host "[SUCCESS] All linters passed cleanly!" -ForegroundColor Green
