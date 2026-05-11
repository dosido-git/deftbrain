#!/bin/bash
# Cross-reference bug detector for DeftBrain — run from project root.
# Usage:  bash crossref_sweep.sh
#
# Detects:
#   1. Relative hrefs (ghost URLs) — href="ToolName" without leading slash
#   2. Stale hrefs to renamed tools — see RENAMES.md
#   3. Orphan hrefs — target not in tools.js
#
# Exit 0 = clean, 1 = bugs found.

set -euo pipefail

TOOLS_JS="${TOOLS_JS:-src/data/tools.js}"
TOOLS_DIR="${TOOLS_DIR:-src/tools}"
RENAMES_MD="${RENAMES_MD:-RENAMES.md}"

if [[ ! -f "$TOOLS_JS" ]]; then
  echo "❌ Cannot find $TOOLS_JS — set TOOLS_JS env var" >&2
  exit 2
fi

echo "📚 Catalog: $TOOLS_JS"
echo "📁 Scanning: $TOOLS_DIR"

# Build set of valid tool IDs (one per line)
VALID_IDS=$(grep -E '^\s*id:\s*"[A-Z]' "$TOOLS_JS" | sed -E 's/.*"([A-Za-z][A-Za-z0-9]*)".*/\1/' | sort -u)
echo "   $(echo "$VALID_IDS" | wc -l) tool IDs loaded"

# Build set of renamed (old) names if RENAMES.md exists
RENAMED_OLD=""
if [[ -f "$RENAMES_MD" ]]; then
  RENAMED_OLD=$(grep -E '^\| [A-Z][A-Za-z0-9]+ \| [A-Z][A-Za-z0-9]+ \|' "$RENAMES_MD" \
                | awk -F'|' '{gsub(/ /,"",$2); print $2}' | sort -u)
  if [[ -n "$RENAMED_OLD" ]]; then
    echo "   $(echo "$RENAMED_OLD" | wc -l) renamed tools loaded from RENAMES.md"
  fi
fi
echo

# ── Pass 1: relative hrefs (ghost URL bug) ──
echo "🔍 Checking for relative hrefs (missing leading slash)..."
RELATIVE=$(grep -rnE 'href="[A-Z][A-Za-z0-9]+"' "$TOOLS_DIR" 2>/dev/null || true)
if [[ -n "$RELATIVE" ]]; then
  echo "🚨 RELATIVE HREFS FOUND — these create ghost URLs in production:"
  echo "$RELATIVE" | sed 's/^/   /'
  echo
  RELATIVE_COUNT=$(echo "$RELATIVE" | wc -l)
else
  RELATIVE_COUNT=0
fi

# ── Pass 2: hrefs to renamed tools ──
RENAMED_COUNT=0
if [[ -n "$RENAMED_OLD" ]]; then
  echo "🔍 Checking for hrefs pointing to renamed tools..."
  while IFS= read -r old; do
    [[ -z "$old" ]] && continue
    HITS=$(grep -rnE "href=\"/$old\"" "$TOOLS_DIR" 2>/dev/null || true)
    if [[ -n "$HITS" ]]; then
      echo "🔄 STALE: /$old (renamed) — see RENAMES.md for new name"
      echo "$HITS" | sed 's/^/   /'
      RENAMED_COUNT=$((RENAMED_COUNT + $(echo "$HITS" | wc -l)))
    fi
  done <<< "$RENAMED_OLD"
  [[ $RENAMED_COUNT -gt 0 ]] && echo
fi

# ── Pass 3: orphan hrefs ──
echo "🔍 Checking for orphan hrefs (target not in tools.js)..."
# Extract all /ToolName references
ALL_HREFS=$(grep -rhEo 'href="/[A-Z][A-Za-z0-9]+"' "$TOOLS_DIR" 2>/dev/null \
            | sed -E 's|href="/([A-Za-z0-9]+)"|\1|' | sort -u || true)
ORPHAN_COUNT=0
if [[ -n "$ALL_HREFS" ]]; then
  while IFS= read -r target; do
    [[ -z "$target" ]] && continue
    # Skip if in valid set or in renamed set
    if ! echo "$VALID_IDS" | grep -qx "$target"; then
      if ! echo "$RENAMED_OLD" | grep -qx "$target" 2>/dev/null; then
        HITS=$(grep -rnE "href=\"/$target\"" "$TOOLS_DIR" 2>/dev/null || true)
        if [[ -n "$HITS" ]]; then
          echo "❓ ORPHAN: /$target — not in tools.js, not in RENAMES.md"
          echo "$HITS" | sed 's/^/   /'
          ORPHAN_COUNT=$((ORPHAN_COUNT + $(echo "$HITS" | wc -l)))
        fi
      fi
    fi
  done <<< "$ALL_HREFS"
fi

# ── Summary ──
TOTAL=$((RELATIVE_COUNT + RENAMED_COUNT + ORPHAN_COUNT))
echo "════════════════════════════════════════════════════════════════════════"
if [[ $TOTAL -eq 0 ]]; then
  echo "✅ Clean — no cross-ref bugs detected"
  exit 0
fi
echo "❌ Total: $TOTAL issue(s) — $RELATIVE_COUNT relative, $RENAMED_COUNT renamed, $ORPHAN_COUNT orphan"
exit 1
