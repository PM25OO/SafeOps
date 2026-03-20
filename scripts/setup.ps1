$ErrorActionPreference = "Stop"

Write-Host "[1/3] Installing frontend dependencies..."
Push-Location "$PSScriptRoot\..\frontend"
npm install
Pop-Location

Write-Host "[2/3] Creating backend virtual environment..."
Push-Location "$PSScriptRoot\..\backend"
if (-not (Test-Path ".venv")) {
    python -m venv .venv
}

Write-Host "[3/3] Installing backend dependencies..."
& .\.venv\Scripts\python.exe -m pip install --upgrade pip
& .\.venv\Scripts\python.exe -m pip install -r requirements.txt
Pop-Location

Write-Host "✅ Setup completed."
