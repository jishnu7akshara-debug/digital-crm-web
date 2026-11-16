# Digital Footprint OS - Single Deployment Runner (Windows PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Starting Digital Footprint OS Single Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$ROOT_DIR = Resolve-Path "$PSScriptRoot\.."
$API_DIR = Join-Path $ROOT_DIR "apps\api"
$WEB_DIR = Join-Path $ROOT_DIR "apps\web"

# 1. Run migrations
Write-Host "[1/3] Running database migrations..." -ForegroundColor Yellow
Push-Location $API_DIR
& .venv\Scripts\python.exe -m alembic upgrade head
Pop-Location

# 2. Seed core database
Write-Host "[2/3] Verifying core system seed..." -ForegroundColor Yellow
Push-Location $API_DIR
& .venv\Scripts\python.exe seed.py --core-only
Pop-Location

# 3. Start FastAPI in background job
Write-Host "[3/3] Starting backend on 127.0.0.1:8000..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    & .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
} -ArgumentList $API_DIR

# Wait for backend
Start-Sleep -Seconds 3

# Start Next.js frontend in foreground
Write-Host "Starting Next.js on http://localhost:3000..." -ForegroundColor Green
Push-Location $WEB_DIR
try {
    & pnpm start -p 3000
} finally {
    Write-Host "Stopping backend..." -ForegroundColor Yellow
    Stop-Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job $backendJob -ErrorAction SilentlyContinue
    Pop-Location
}
