#!/usr/bin/env python3
"""Run from project root: python3 src/tools/diagnose.py"""
from pathlib import Path

script_dir = Path(__file__).parent
tools_dir = script_dir if (script_dir / 'EgoKiller.js').exists() \
    else Path.cwd() / 'src/tools'

checks = {
    'EgoKiller.js':    [309, 316],
    'HecklerPrep.js':  [330, 338],
    'LedeBuilder.js':  [320, 328],
    'TruthBomb.js':    [363, 371],
}

for fname, (start, end) in checks.items():
    path = tools_dir / fname
    lines = path.read_text().split('\n')
    print(f"\n=== {fname} lines {start}-{end} ===")
    for i in range(start-1, min(end, len(lines))):
        print(f"  {i+1}: {repr(lines[i])}")
