# Static type checking script for Windows PowerShell
Write-Host "[INFO] Running Mypy on backend..." -ForegroundColor Cyan
Push-Location backend
.\.venv\Scripts\mypy.exe apps config
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

Write-Host "[INFO] Running TypeScript compiler on frontend..." -ForegroundColor Cyan
Push-Location frontend
npm run typecheck
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

Write-Host "[SUCCESS] All type checks passed with 0 errors!" -ForegroundColor Green
