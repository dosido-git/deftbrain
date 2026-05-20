#!/usr/bin/env python3
from pathlib import Path
import re

script_dir = Path(__file__).parent
tools_dir = script_dir if (script_dir / 'MeetingBSDetector.js').exists() \
    else Path.cwd() / 'src/tools'

path = tools_dir / 'MeetingBSDetector.js'
src = path.read_text()
lines = src.split('\n')
print(f"Line 165: {repr(lines[164])}")

# Fix spread pattern ...history
out = re.sub(r'\.\.\.history\b', '...sessionHistory', src)
# Fix any remaining bare history (all lookbehind variants)
out = re.sub(r'\bhistory\b', 'sessionHistory', out)

if out != src:
    path.write_text(out)
    print("Fixed.")
else:
    print("No change — checking for non-ASCII chars:")
    for i, ch in enumerate(lines[164]):
        if ord(ch) > 127:
            print(f"  col {i}: U+{ord(ch):04X} {repr(ch)}")
