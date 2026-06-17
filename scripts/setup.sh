#!/usr/bin/env bash
set -euo pipefail

echo "=== SaaS Feature Factory Setup ==="
echo ""

# Install Python dependencies
echo "[1/3] Installing Python agent dependencies..."
pip install -r agents/requirements.txt

# Copy env file
if [ ! -f .env ]; then
  cp .env.example .env
  echo "  Created .env from .env.example (edit with your API keys)"
fi

# Install sample app dependencies
echo "[2/3] Installing sample app dependencies..."
cd sample-app
npm install
cd ..

# Verify setup
echo "[3/3] Verifying setup..."
echo "  Python: $(python3 --version)"
echo "  Node:   $(node --version)"
echo "  Docker: $(docker --version 2>/dev/null || echo 'not found')"
echo ""
echo "=== Setup complete! ==="
echo "Run: node scripts/run-demo.mjs"
echo "Or:  cd agents && python -m agents.orchestrator.cli demo"
