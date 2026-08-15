# Formatting script for Windows PowerShell
Write-Host "[INFO] Running Ruff formatter on backend..." -ForegroundColor Cyan
Push-Location backend
.\.venv\Scripts\ruff.exe format .
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

Write-Host "[INFO] Running Prettier formatter on frontend..." -ForegroundColor Cyan
Push-Location frontend
npm run format
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

Write-Host "[SUCCESS] All formatters completed successfully!" -ForegroundColor Green
