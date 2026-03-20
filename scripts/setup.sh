#!/usr/bin/env bash
set -euo pipefail

echo "[1/3] Installing frontend dependencies..."
cd "$(dirname "$0")/../frontend"
npm install

echo "[2/3] Creating backend virtual environment..."
cd "../backend"
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

echo "[3/3] Installing backend dependencies..."
./.venv/bin/python -m pip install --upgrade pip
./.venv/bin/python -m pip install -r requirements.txt

echo "✅ Setup completed."
