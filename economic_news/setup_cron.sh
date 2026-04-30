#!/usr/bin/env bash
# Sets up a cron job to run the daily economic news summarizer at 8:00 AM JST (= 23:00 UTC).
# Usage: bash setup_cron.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
PYTHON="${PYTHON:-python3}"
LOG_FILE="$REPO_DIR/reports/cron.log"

echo "=== Daily Economic News — Cron Setup ==="
echo "Repo: $REPO_DIR"
echo "Script: $SCRIPT_DIR/main.py"

# Verify Python and anthropic are available
if ! command -v "$PYTHON" &>/dev/null; then
    echo "ERROR: python3 not found. Install Python 3.9+ first."
    exit 1
fi

echo ""
echo "Installing dependencies..."
"$PYTHON" -m pip install -q -r "$SCRIPT_DIR/requirements.txt"

# Check ANTHROPIC_API_KEY
if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
    echo ""
    echo "WARNING: ANTHROPIC_API_KEY is not set in current shell."
    echo "Make sure it is exported in /etc/environment or your shell profile,"
    echo "or add it directly to the cron environment below."
fi

mkdir -p "$REPO_DIR/reports"

# Build cron entry: runs at 23:00 UTC = 08:00 JST
CRON_CMD="0 23 * * * ANTHROPIC_API_KEY=\${ANTHROPIC_API_KEY} $PYTHON $SCRIPT_DIR/main.py >> $LOG_FILE 2>&1"

echo ""
echo "Adding cron job (23:00 UTC = 08:00 JST)..."

# Remove old entries for this script, then add new one
(
    crontab -l 2>/dev/null | grep -v "$SCRIPT_DIR/main.py" || true
    echo "ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-YOUR_KEY_HERE}"
    echo "0 23 * * * $PYTHON $SCRIPT_DIR/main.py >> $LOG_FILE 2>&1"
) | crontab -

echo ""
echo "Current crontab:"
crontab -l

echo ""
echo "=== Setup complete ==="
echo "The summarizer will run every day at 08:00 JST."
echo "Reports are saved to: $REPO_DIR/reports/YYYY-MM-DD.md"
echo "Logs: $LOG_FILE"
echo ""
echo "To run manually now:"
echo "  ANTHROPIC_API_KEY=your_key $PYTHON $SCRIPT_DIR/main.py"
