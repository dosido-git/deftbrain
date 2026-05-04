#!/usr/bin/env bash
# jsx_smoke.sh — quick JSX integrity smoke check across all tool files.
#
# Uses esbuild's transform mode to parse each tool file as JSX and report
# any syntax errors. Much faster than `npm run build` (which is slow,
# bundles, and stops at the first error). This script reports EVERY broken
# file in one pass.
#
# Why esbuild: it's a real JSX parser, ships with most React projects, and
# its transform mode is single-file and pure (no module resolution).
#
# USAGE
#   bash audit/jsx_smoke.sh                   # check src/tools/*.js
#   bash audit/jsx_smoke.sh path/to/file.js   # check specific files
#
# OUTPUT
#   <file>: OK     — parses cleanly
#   <file>: FAIL   — followed by esbuild's error message
#
# Exit codes
#   0 — all files clean
#   1 — at least one file failed

set -u

# Locate esbuild — prefer node_modules/.bin (project-local), fall back to npx.
if [[ -x node_modules/.bin/esbuild ]]; then
  ESBUILD="node_modules/.bin/esbuild"
elif command -v esbuild >/dev/null 2>&1; then
  ESBUILD="esbuild"
else
  ESBUILD="npx --no-install esbuild"
fi

# File list: argument list if given, otherwise glob src/tools/*.js
if [[ $# -gt 0 ]]; then
  FILES=("$@")
else
  FILES=(src/tools/*.js)
fi

if [[ ${#FILES[@]} -eq 0 ]]; then
  echo "No files to check." >&2
  exit 1
fi

fail_count=0
fail_files=()

for f in "${FILES[@]}"; do
  if [[ ! -f "$f" ]]; then
    echo "SKIP $f (not a file)" >&2
    continue
  fi
  # esbuild transform: parse as JSX, write to /dev/null. Stderr captures errors.
  # The --loader:.js=jsx form maps the .js extension to the JSX loader (the
  # bare --loader=jsx only applies to stdin).
  err=$($ESBUILD --loader:.js=jsx --log-level=error "$f" >/dev/null 2>&1; echo $?)
  if [[ "$err" == "0" ]]; then
    : # silent on success — keep output focused on failures
  else
    echo "FAIL  $f"
    $ESBUILD --loader:.js=jsx --log-level=error "$f" 2>&1 >/dev/null | sed 's/^/      /'
    fail_count=$((fail_count + 1))
    fail_files+=("$f")
  fi
done

echo
total=${#FILES[@]}
clean=$((total - fail_count))
echo "----------------------------------------"
echo "JSX smoke: $clean/$total clean, $fail_count failed"
if [[ $fail_count -gt 0 ]]; then
  echo "Failed files:"
  for f in "${fail_files[@]}"; do echo "  $f"; done
  exit 1
fi
exit 0
