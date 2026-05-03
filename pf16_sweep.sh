#!/usr/bin/env bash
# pf16_sweep.sh — Catalog-wide PF-16 reset-button placement sweep.
#
# Runs the patched audit_v2-3-2.py (v1.8+ with broadened reset-name regex)
# against every tool in src/tools/ and surfaces only PF-16 violations.
#
# Usage:
#   bash pf16_sweep.sh                           # default paths
#   bash pf16_sweep.sh path/to/audit.py path/to/tools  # explicit
#
# Output goes to stdout AND pf16_sweep.log for easy paste-back.

AUDIT_SCRIPT="${1:-audit_v2-3-2.py}"
TOOLS_DIR="${2:-src/tools}"

if [ ! -f "$AUDIT_SCRIPT" ]; then
  echo "ERROR: audit script not found at: $AUDIT_SCRIPT" >&2
  exit 1
fi
if [ ! -d "$TOOLS_DIR" ]; then
  echo "ERROR: tools directory not found at: $TOOLS_DIR" >&2
  exit 1
fi

LOG=pf16_sweep.log
> "$LOG"

total=0
hit_count=0

for f in "$TOOLS_DIR"/*.js; do
  total=$((total + 1))
  name=$(basename "$f" .js)
  out=$(AUDIT_SKIP_ESLINT=1 python3 "$AUDIT_SCRIPT" "$f" 2>&1)
  pf16=$(echo "$out" | grep "PF-16")
  if [ -n "$pf16" ]; then
    hit_count=$((hit_count + 1))
    {
      echo "── $name ──"
      echo "$pf16"
      echo ""
    } | tee -a "$LOG"
  fi
done

echo "════════════════════════════════════════════════════════════" | tee -a "$LOG"
echo "PF-16 SWEEP SUMMARY" | tee -a "$LOG"
echo "════════════════════════════════════════════════════════════" | tee -a "$LOG"
echo "  Tools scanned: $total" | tee -a "$LOG"
echo "  Tools with PF-16 violations: $hit_count" | tee -a "$LOG"
echo "  Log saved to: $LOG" | tee -a "$LOG"
