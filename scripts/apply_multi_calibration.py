#!/usr/bin/env python3
"""Multi-action max_tokens calibration.
Each route entry is a list of (old_val, new_val) pairs.
Values in all_max_tokens that aren't listed = left unchanged.
"""
import re
from pathlib import Path

ROUTES_DIR = Path("./routes")

# Format: route → [(old, new), ...]
# Only values that should change are listed. Others left alone.
# [WRITE] = write-heavy tool, kept conservative
# [TIERED] = stakes/complexity tiering, reduced proportionally

PATCHES = {

    # ── CLEAR OVER-ALLOCATION ────────────────────────────────────────────────

    'plot-hole':               [(2000, 1250), (2500, 1500)],
    'fan-theory':              [(2000, 1000), (2500, 1250)],
    'wardrobe-chaos-helper':   [(2000, 1000)],           # keep 800
    'apology-calibrator':      [(1500, 750), (2000, 1000), (2500, 1250), (3000, 1500)],
    'recharge-radar':          [(2000, 1000), (3000, 1500)],   # keep 800
    'plant-rescue':            [(1200, 750), (2500, 1250)],    # keep 800
    'waiting-mode-liberator':  [(700, 500), (1200, 750), (1800, 1000)],  # keep 500, 600
    'tip-of-tongue':           [(2000, 1000), (3000, 1500)],
    'recipe-chaos-solver':     [(1500, 750), (2000, 1000), (2500, 1250)],
    'final-wish':              [(1500, 600), (2000, 750)],     # keep 500
    'magic-mouth':             [(2500, 1000), (2800, 1250)],
    'conflict-coach':          [(2500, 1000)],                 # keep 500, 800
    'brainstate-deejay':       [(2000, 750), (2500, 1000)],
    'focus-pocus':             [(1000, 500), (2000, 750)],
    'sub-sweep':               [(1500, 750), (2000, 1000), (3000, 1250)],
    'history-today':           [(2500, 1000), (3000, 1250)],
    'the-debrief':             [(2500, 1000), (3000, 1250)],
    'email-urgency-triager':   [(2000, 750), (2500, 1000)],
    'pronounce-it-right':      [(2500, 1000), (3000, 1250)],
    'laundro-mat':             [(1500, 500), (2000, 750), (2500, 750)],
    'roommate-court':          [(1500, 500), (2500, 750)],
    'pet-weirdness-decoder':   [(2500, 750)],                  # keep 800
    'gratitude-debt-clearer':  [(1500, 750), (2500, 750)],     # keep 800
    'name-audit':              [(2500, 750), (3000, 1000)],
    'caption-magic':           [(2000, 750), (3000, 1000)],    # keep 800, 1000
    'plain-talk':              [(2000, 750), (3000, 1000)],
    'awkward-silence-filler':  [(2500, 500)],                  # keep 400

    # ── CONSERVATIVE (write-heavy / stakes-tiered tools) ────────────────────

    # crisis-prioritizer: 6-tier stakes scale [800,1000,1500,2000,2500,3000], 860 output
    'crisis-prioritizer':      [(2500, 1750), (3000, 2000)],   # keep lower tiers

    # batch-flow: 7 tiers [600-3000], 949 output — reduce top only
    'batch-flow':              [(2500, 1750), (3000, 2000)],   # keep 600-2000

    # meeting-bs-detector: [1500,2000,2500,3000], 925 output
    'meeting-bs-detector':     [(2500, 1750), (3000, 2000)],   # keep 1500, 2000

    # fake-review-detective: [2000,2500,3000], 815 output
    'fake-review-detective':   [(2500, 1500), (3000, 1750)],   # keep 2000

    # layover-maximizer [WRITE]: itineraries can be long; reduce top only
    'layover-maximizer':       [(2500, 1750), (3000, 2000)],   # keep 1500, 2000

    # debate-me: [1500,2000,2500], 686 output
    'debate-me':               [(2000, 1250), (2500, 1500)],   # keep 1500

    # nerve-check: [300,800,1200,1800,2000] stakes tiered, 580 output
    'nerve-check':             [(1800, 1000), (2000, 1250)],   # keep 300, 800, 1200

    # virtual-body-double: [300-1800] 8-tier, 516 output
    'virtual-body-double':     [(1200, 750), (1800, 1000)],    # keep smaller

    # decision-coach: [600-2000] 6-tier, 570 output
    'decision-coach':          [(1800, 1000), (2000, 1250)],   # keep 600, 800, 1200, 1500

    # focus-sound-architect: [1000,2000,3000], 528 output
    'focus-sound-architect':   [(2000, 1000), (3000, 1500)],   # keep 1000

    # jargon-assassin [WRITE]: rewrites docs, top kept generous
    'jargon-assassin':         [(1500, 1000), (2000, 1500), (2500, 2000)],  # keep 3000

    # brag-sheet-builder [WRITE]: full brag sheets can be long
    'brag-sheet-builder':      [(2500, 1500), (3000, 2000)],   # keep 1000, 1500

    # complaint-escalation-writer [WRITE]: generates letters
    'complaint-escalation-writer': [(2500, 1250), (3000, 1500)],

    # difficult-talk-coach [WRITE]: conversation scripts
    'difficult-talk-coach':    [(2500, 1500)],                 # keep 1000, 3000

    # research-decoder [WRITE]: detailed analysis output
    'research-decoder':        [(1500, 750), (2000, 1000), (2500, 1250), (3000, 1500)],

    # doctor-visit-translator [WRITE]: medical, conservative
    'doctor-visit-translator': [(2500, 1250), (3500, 1750)],

    # pep: already finely tiered [200-1200], reduce top only
    'pep':                     [(1000, 400), (1200, 500)],

    # ── MANUAL REVIEW / SPECIAL ─────────────────────────────────────────────

    # money-diplomat: 6 tiers [1000-3000], 248 output — 50% reduction across board
    'money-diplomat':          [(1000, 500), (1500, 750), (1800, 900),
                                (2000, 1000), (2500, 1250), (3000, 1500)],

    # brain-dump-buddy [WRITE]: [500,800,4000] — 4000 is likely full-dump action; keep generous
    'brain-dump-buddy':        [(4000, 2000)],                 # keep 500, 800

    # room-reader: 7 tiers [600-3000], 188 output — aggressive reduction
    'room-reader':             [(1200, 500), (1500, 500), (1800, 500),
                                (2000, 500), (2500, 600), (3000, 750)],  # keep 600

    # six-degrees-of-me: [400-2500], 152 output
    'six-degrees-of-me':       [(1200, 500), (2000, 500), (2500, 500)], # keep 400, 800

    # gentle-push-generator: [800-2000], 104 output
    'gentle-push-generator':   [(1200, 400), (1500, 400), (2000, 500)], # keep 800

    # brain-roulette: [800-2000] 5-tier, 197 output
    'brain-roulette':          [(1200, 400), (1500, 400), (2000, 500)], # keep 800, 1000
}

def apply_patches():
    total_changes = 0
    for route, pairs in sorted(PATCHES.items()):
        fpath = ROUTES_DIR / f"{route}.js"
        if not fpath.exists():
            print(f"MISSING: {route}.js"); continue
        src = fpath.read_text()
        original = src
        route_changes = []
        for old_val, new_val in pairs:
            old_str = f"max_tokens: {old_val},"
            new_str = f"max_tokens: {new_val},"
            count = src.count(old_str)
            if count == 0:
                print(f"  NO MATCH: {route} max_tokens:{old_val}")
            else:
                src = src.replace(old_str, new_str)
                route_changes.append(f"{old_val}→{new_val}(×{count})")
        if src != original:
            fpath.write_text(src)
            print(f"✓ {route}: {', '.join(route_changes)}")
            total_changes += 1
    print(f"\nDone. {total_changes} routes patched.")

if __name__ == '__main__':
    apply_patches()
