# Security vulnerability audit script for Windows PowerShell
Write-Host "[INFO] Running pip-audit on backend dependencies..." -ForegroundColor Cyan
Push-Location backend
.\.venv\Scripts\pip-audit.exe
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

Write-Host "[INFO] Running npm audit on frontend production dependencies..." -ForegroundColor Cyan
Push-Location frontend
npm audit --omit=dev --audit-level=high
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

Write-Host "[SUCCESS] Zero high/critical vulnerability CVEs found!" -ForegroundColor Green
