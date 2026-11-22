#!/bin/sh
# Export every source, fit-check new rows, export again without the dropped ones.
cd "$(dirname "$0")"
OUT=/Users/SRsr/Desktop/deftbrain/outreach/new-prospects-2026-11-21-pm.csv
SRC="results.jsonl districts.jsonl gov.jsonl gov2.jsonl $(ls extra-*.jsonl 2>/dev/null)"
mv verdicts.json verdicts.hold 2>/dev/null; python3 export.py $OUT $SRC --extra pm-original.csv >/dev/null; mv verdicts.hold verdicts.json 2>/dev/null
node judge.mjs $OUT verdicts.json
node mxcheck.mjs $OUT mx.json
python3 export.py $OUT $SRC --extra pm-original.csv
