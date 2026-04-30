#!/usr/bin/env bash
# Run the economic news summarizer immediately (for testing / manual use).
# Usage: ANTHROPIC_API_KEY=your_key bash run_now.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON="${PYTHON:-python3}"

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
    echo "ERROR: ANTHROPIC_API_KEY is not set."
    echo "Usage: ANTHROPIC_API_KEY=sk-... bash run_now.sh"
    exit 1
fi

echo "Installing/verifying dependencies..."
"$PYTHON" -m pip install -q -r "$SCRIPT_DIR/requirements.txt"

echo "Running economic news summarizer..."
"$PYTHON" "$SCRIPT_DIR/main.py"
