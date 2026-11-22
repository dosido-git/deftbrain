#!/bin/sh
# Export every source, fit-check new rows, mail-server check, export again without the dropped ones.
# US and international prospects go to separate files so their reply rates can be compared.
cd "$(dirname "$0")"
run() {  # $1 = output csv, rest = sources
  OUT=$1; shift
  mv verdicts.json verdicts.hold 2>/dev/null; python3 export.py $OUT "$@" >/dev/null; mv verdicts.hold verdicts.json 2>/dev/null
  node judge.mjs $OUT verdicts.json
  node mxcheck.mjs $OUT mx.json
  python3 export.py $OUT "$@"
}
run /Users/SRsr/Desktop/deftbrain/outreach/new-prospects-2026-11-21-pm.csv results.jsonl districts.jsonl gov.jsonl gov2.jsonl $(ls extra-*.jsonl 2>/dev/null | grep -v '^extra-intl') --extra pm-original.csv
INTL=$(ls extra-intl*.jsonl 2>/dev/null)
[ -n "$INTL" ] && run /Users/SRsr/Desktop/deftbrain/outreach/new-prospects-intl.csv $INTL
exit 0
