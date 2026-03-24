#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# ForgeBeyond CI Analysis Runner
# ──────────────────────────────────────────────────────────────
# Usage:
#   ./tools/forgebeyond/run-forgebeyond-analysis.sh <log-file>
#   ./tools/forgebeyond/run-forgebeyond-analysis.sh --stdin < logfile.txt
#   echo "error text" | ./tools/forgebeyond/run-forgebeyond-analysis.sh --stdin
#
# Options:
#   --output <path>    Override output report path
#   --stdin            Read log from stdin instead of file
#   --quiet            Suppress stderr diagnostics
#
# Output:
#   JSON report to stdout + saved to reports/ci-analysis-{timestamp}.json
# ──────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

LOG_FILE=""
OUTPUT_FILE=""
USE_STDIN=false
QUIET=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --output)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    --stdin)
      USE_STDIN=true
      shift
      ;;
    --quiet)
      QUIET=true
      shift
      ;;
    -*)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
    *)
      LOG_FILE="$1"
      shift
      ;;
  esac
done

# Validate input
if [[ "$USE_STDIN" == "false" && -z "$LOG_FILE" ]]; then
  echo "Usage: $0 <log-file> [--output <path>]" >&2
  echo "       $0 --stdin [--output <path>]" >&2
  exit 1
fi

if [[ "$USE_STDIN" == "false" && ! -f "$LOG_FILE" ]]; then
  echo "Error: Log file not found: $LOG_FILE" >&2
  exit 1
fi

# Build node args
NODE_ARGS=(
  "$SCRIPT_DIR/lib/analyzer.js"
  --config "$SCRIPT_DIR/forgebeyond.config.yaml"
  --repo-root "$REPO_ROOT"
)

if [[ -n "$OUTPUT_FILE" ]]; then
  NODE_ARGS+=(--output "$OUTPUT_FILE")
fi

# Run analysis
if [[ "$USE_STDIN" == "true" ]]; then
  if [[ "$QUIET" == "true" ]]; then
    node "${NODE_ARGS[@]}" - 2>/dev/null
  else
    node "${NODE_ARGS[@]}" -
  fi
else
  if [[ "$QUIET" == "true" ]]; then
    node "${NODE_ARGS[@]}" "$LOG_FILE" 2>/dev/null
  else
    node "${NODE_ARGS[@]}" "$LOG_FILE"
  fi
fi
