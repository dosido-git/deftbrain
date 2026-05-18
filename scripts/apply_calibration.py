#!/usr/bin/env python3
"""Safe max_tokens calibration — apply after token_profiler.py run.
Only modifies single-max_tokens routes. Multi-action routes flagged separately.
"""
import re
from pathlib import Path

ROUTES_DIR = Path("./routes")  # set to your routes directory

# Truncated routes — must raise
RAISES = {
    'future-proof': (2000, 3000),
    'lease-trap-detector': (3000, 4500),
    'markup-detective': (1000, 1500),
    'pre-mortem': (2000, 3000),
    'skill-gap-map': (3500, 5000),
    'upsell-shield': (2500, 3750),
    'what-if': (2000, 3000),
}

# Over-allocated single-action routes — safe to reduce
REDUCTIONS = {
    'renters-deposit-saver': (3000, 1500),
    'tool-finder': (1500, 750),
    'chaos-pilot': (1800, 750),
    'contrast-report': (3000, 1500),
    'cold-open-craft': (2000, 1000),
    'mental-health-navigator': (1800, 750),
    'mise-en-place': (2500, 1000),
    'one-percenter': (2500, 1000),
    'task-avalanche-breaker': (2500, 1000),
    'whats-my-vibe': (1200, 500),
    'name-that-feeling': (2000, 750),
    'plot-twist': (2500, 750),
    'comeback-cooker': (2000, 750),
    'scam-radar': (1200, 500),
    'the-alibi': (3000, 1000),
    'subscription-guilt-trip': (2500, 750),
    'drive-home': (2000, 500),
    'toast-writer': (3000, 750),
    'contract-decoder': (2000, 500),
    'dream-pattern-spotter': (2500, 750),
    'noise-canceler': (2500, 750),
    'meeting-hijack-preventer': (2500, 750),
    'context-collapse': (2500, 500),
    'doctor-visit-prep': (2500, 500),
    'decoder-ring': (2500, 500),
}

all_patches = {**RAISES, **REDUCTIONS}

for route, (old_val, new_val) in all_patches.items():
    fpath = ROUTES_DIR / f"{route}.js"
    if not fpath.exists():
        print(f"MISSING: {route}.js"); continue
    src = fpath.read_text()
    new_src = src.replace(f"max_tokens: {old_val},", f"max_tokens: {new_val},")
    if new_src == src:
        print(f"NO MATCH: {route} (expected max_tokens: {old_val},)")
    else:
        fpath.write_text(new_src)
        d = "↑" if new_val > old_val else "↓"
        print(f"{d} {route}: {old_val} → {new_val}")

print(f"\nDone. {len(all_patches)} routes patched.")

# Multi-action routes — review manually:
# crisis-prioritizer: tested action used 2500 → suggests 1250 (verify other actions first)
# plot-hole: tested action used 2500 → suggests 1250 (verify other actions first)
# batch-flow: tested action used 3000 → suggests 1500 (verify other actions first)
# meeting-bs-detector: tested action used 3000 → suggests 1500 (verify other actions first)
# fan-theory: tested action used 2500 → suggests 1000 (verify other actions first)
# lazy-workout-adapter: tested action used 3000 → suggests 1250 (verify other actions first)
# nerve-check: tested action used 2000 → suggests 750 (verify other actions first)
# virtual-body-double: tested action used 1800 → suggests 750 (verify other actions first)
# wardrobe-chaos-helper: tested action used 2000 → suggests 750 (verify other actions first)
# decision-coach: tested action used 2000 → suggests 750 (verify other actions first)
# debate-me: tested action used 2500 → suggests 1000 (verify other actions first)
# fake-review-detective: tested action used 3000 → suggests 1250 (verify other actions first)
# layover-maximizer: tested action used 3000 → suggests 1250 (verify other actions first)
# difficult-talk-coach: tested action used 3000 → suggests 1250 (verify other actions first)
# apology-calibrator: tested action used 3000 → suggests 1250 (verify other actions first)
# recharge-radar: tested action used 3000 → suggests 1000 (verify other actions first)
# plant-rescue: tested action used 2500 → suggests 1000 (verify other actions first)
# waiting-mode-liberator: tested action used 1800 → suggests 750 (verify other actions first)
# tip-of-tongue: tested action used 3000 → suggests 1000 (verify other actions first)
# recipe-chaos-solver: tested action used 2500 → suggests 750 (verify other actions first)
# final-wish: tested action used 2000 → suggests 750 (verify other actions first)
# magic-mouth: tested action used 2800 → suggests 1000 (verify other actions first)
# pep: tested action used 1200 → suggests 500 (verify other actions first)
# complaint-escalation-writer: tested action used 3000 → suggests 1000 (verify other actions first)
# conflict-coach: tested action used 2500 → suggests 750 (verify other actions first)
# brainstate-deejay: tested action used 2500 → suggests 750 (verify other actions first)
# focus-sound-architect: tested action used 3000 → suggests 750 (verify other actions first)
# focus-pocus: tested action used 2000 → suggests 500 (verify other actions first)
# jargon-assassin: tested action used 3000 → suggests 750 (verify other actions first)
# sub-sweep: tested action used 3000 → suggests 750 (verify other actions first)
# history-today: tested action used 3000 → suggests 750 (verify other actions first)
# the-debrief: tested action used 3000 → suggests 750 (verify other actions first)
# email-urgency-triager: tested action used 2500 → suggests 500 (verify other actions first)
# pronounce-it-right: tested action used 3000 → suggests 750 (verify other actions first)
# brag-sheet-builder: tested action used 3000 → suggests 750 (verify other actions first)
# laundro-mat: tested action used 2500 → suggests 500 (verify other actions first)
# roommate-court: tested action used 2500 → suggests 500 (verify other actions first)
# pet-weirdness-decoder: tested action used 2500 → suggests 500 (verify other actions first)
# gratitude-debt-clearer: tested action used 2500 → suggests 500 (verify other actions first)
# name-audit: tested action used 3000 → suggests 500 (verify other actions first)
# doctor-visit-translator: tested action used 3500 → suggests 500 (verify other actions first)
# caption-magic: tested action used 3000 → suggests 500 (verify other actions first)
# research-decoder: tested action used 3000 → suggests 500 (verify other actions first)
# plain-talk: tested action used 3000 → suggests 500 (verify other actions first)
# brain-roulette: tested action used 2000 → suggests 500 (verify other actions first)
# money-diplomat: tested action used 3000 → suggests 500 (verify other actions first)
# brain-dump-buddy: tested action used 4000 → suggests 500 (verify other actions first)
# room-reader: tested action used 3000 → suggests 500 (verify other actions first)
# six-degrees-of-me: tested action used 2500 → suggests 500 (verify other actions first)
# gentle-push-generator: tested action used 2000 → suggests 500 (verify other actions first)
# awkward-silence-filler: tested action used 2500 → suggests 500 (verify other actions first)