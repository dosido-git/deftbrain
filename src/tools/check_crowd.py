#!/usr/bin/env python3
from pathlib import Path

script_dir = Path(__file__).parent
tools_dir = script_dir if (script_dir / 'CrowdWisdom.js').exists() \
    else Path.cwd() / 'src/tools'

path = tools_dir / 'CrowdWisdom.js'
lines = path.read_text().split('\n')

# Show declaration, API call area, and JSX history section
for label, ranges in [
    ("declaration area", range(83, 100)),
    ("handler area", range(115, 135)),
    ("JSX history section", range(253, 268)),
]:
    print(f"\n=== {label} ===")
    for i in ranges:
        if i < len(lines):
            print(f"  {i+1}: {lines[i]}")
