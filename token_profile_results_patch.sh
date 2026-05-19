#!/bin/bash
# Auto-generated max_tokens calibration patch
# Review before applying. Run from your routes directory.

# 67 routes need recalibration

# future-proof: 3000 → 3750 (↑ INCREASE, ratio=100%)
sed -i 's/max_tokens: 3000,/max_tokens: 3750,/' future-proof.js

# layover-maximizer: 3000 → 3750 (↑ INCREASE, ratio=100%)
sed -i 's/max_tokens: 3000,/max_tokens: 3750,/' layover-maximizer.js

# markup-detective: 1500 → 2000 (↑ INCREASE, ratio=100%)
sed -i 's/max_tokens: 1500,/max_tokens: 2000,/' markup-detective.js

# mental-health-navigator: 750 → 1000 (↑ INCREASE, ratio=100%)
sed -i 's/max_tokens: 750,/max_tokens: 1000,/' mental-health-navigator.js

# name-that-feeling: 750 → 1000 (↑ INCREASE, ratio=100%)
sed -i 's/max_tokens: 750,/max_tokens: 1000,/' name-that-feeling.js

# recall: 2500 → 3000 (↑ INCREASE, ratio=100%)
sed -i 's/max_tokens: 2500,/max_tokens: 3000,/' recall.js

# skill-gap-map: 5000 → 6250 (↑ INCREASE, ratio=100%)
sed -i 's/max_tokens: 5000,/max_tokens: 6250,/' skill-gap-map.js

# wrong-answers-only: 1000 → 1250 (↑ INCREASE, ratio=100%)
sed -i 's/max_tokens: 1000,/max_tokens: 1250,/' wrong-answers-only.js

# batch-flow: 3000 → 1250 (↓ reduce, ratio=34%)
sed -i 's/max_tokens: 3000,/max_tokens: 1250,/' batch-flow.js

# idea-autopsy: 2000 → 750 (↓ reduce, ratio=33%)
sed -i 's/max_tokens: 2000,/max_tokens: 750,/' idea-autopsy.js

# date-night: 3000 → 1250 (↓ reduce, ratio=33%)
sed -i 's/max_tokens: 3000,/max_tokens: 1250,/' date-night.js

# ego-killer: 1500 → 500 (↓ reduce, ratio=32%)
sed -i 's/max_tokens: 1500,/max_tokens: 500,/' ego-killer.js

# bookmark: 3000 → 1250 (↓ reduce, ratio=31%)
sed -i 's/max_tokens: 3000,/max_tokens: 1250,/' bookmark.js

# sleep-architect: 1800 → 750 (↓ reduce, ratio=31%)
sed -i 's/max_tokens: 1800,/max_tokens: 750,/' sleep-architect.js

# bike-medic: 2000 → 750 (↓ reduce, ratio=30%)
sed -i 's/max_tokens: 2000,/max_tokens: 750,/' bike-medic.js

# meeting-bs-detector: 3000 → 1000 (↓ reduce, ratio=29%)
sed -i 's/max_tokens: 3000,/max_tokens: 1000,/' meeting-bs-detector.js

# complaint-escalation-writer: 3000 → 1000 (↓ reduce, ratio=29%)
sed -i 's/max_tokens: 3000,/max_tokens: 1000,/' complaint-escalation-writer.js

# fan-theory: 2500 → 1000 (↓ reduce, ratio=29%)
sed -i 's/max_tokens: 2500,/max_tokens: 1000,/' fan-theory.js

# micro-adventure-mapper: 3000 → 1000 (↓ reduce, ratio=29%)
sed -i 's/max_tokens: 3000,/max_tokens: 1000,/' micro-adventure-mapper.js

# history-today: 3000 → 1000 (↓ reduce, ratio=28%)
sed -i 's/max_tokens: 3000,/max_tokens: 1000,/' history-today.js

# nerve-check: 2000 → 750 (↓ reduce, ratio=28%)
sed -i 's/max_tokens: 2000,/max_tokens: 750,/' nerve-check.js

# grief-guide: 2000 → 750 (↓ reduce, ratio=27%)
sed -i 's/max_tokens: 2000,/max_tokens: 750,/' grief-guide.js

# the-gap: 3000 → 1000 (↓ reduce, ratio=26%)
sed -i 's/max_tokens: 3000,/max_tokens: 1000,/' the-gap.js

# difficult-talk-coach: 3000 → 1000 (↓ reduce, ratio=25%)
sed -i 's/max_tokens: 3000,/max_tokens: 1000,/' difficult-talk-coach.js

# debate-me: 2500 → 750 (↓ reduce, ratio=25%)
sed -i 's/max_tokens: 2500,/max_tokens: 750,/' debate-me.js

# decision-coach: 2000 → 500 (↓ reduce, ratio=25%)
sed -i 's/max_tokens: 2000,/max_tokens: 500,/' decision-coach.js

# magic-mouth: 2800 → 750 (↓ reduce, ratio=25%)
sed -i 's/max_tokens: 2800,/max_tokens: 750,/' magic-mouth.js

# the-runthrough: 3000 → 1000 (↓ reduce, ratio=24%)
sed -i 's/max_tokens: 3000,/max_tokens: 1000,/' the-runthrough.js

# wardrobe-chaos-helper: 2000 → 500 (↓ reduce, ratio=24%)
sed -i 's/max_tokens: 2000,/max_tokens: 500,/' wardrobe-chaos-helper.js

# fake-review-detective: 3000 → 750 (↓ reduce, ratio=23%)
sed -i 's/max_tokens: 3000,/max_tokens: 750,/' fake-review-detective.js

# plot-hole: 2500 → 750 (↓ reduce, ratio=23%)
sed -i 's/max_tokens: 2500,/max_tokens: 750,/' plot-hole.js

# waiting-mode-liberator: 1800 → 500 (↓ reduce, ratio=21%)
sed -i 's/max_tokens: 1800,/max_tokens: 500,/' waiting-mode-liberator.js

# plant-rescue: 2500 → 750 (↓ reduce, ratio=21%)
sed -i 's/max_tokens: 2500,/max_tokens: 750,/' plant-rescue.js

# lazy-workout-adapter: 3000 → 750 (↓ reduce, ratio=20%)
sed -i 's/max_tokens: 3000,/max_tokens: 750,/' lazy-workout-adapter.js

# the-final-word: 2500 → 500 (↓ reduce, ratio=19%)
sed -i 's/max_tokens: 2500,/max_tokens: 500,/' the-final-word.js

# sub-sweep: 3000 → 750 (↓ reduce, ratio=18%)
sed -i 's/max_tokens: 3000,/max_tokens: 750,/' sub-sweep.js

# final-wish: 2000 → 500 (↓ reduce, ratio=18%)
sed -i 's/max_tokens: 2000,/max_tokens: 500,/' final-wish.js

# crisis-prioritizer: 2500 → 500 (↓ reduce, ratio=18%)
sed -i 's/max_tokens: 2500,/max_tokens: 500,/' crisis-prioritizer.js

# recharge-radar: 3000 → 750 (↓ reduce, ratio=17%)
sed -i 's/max_tokens: 3000,/max_tokens: 750,/' recharge-radar.js

# roommate-court: 2500 → 500 (↓ reduce, ratio=17%)
sed -i 's/max_tokens: 2500,/max_tokens: 500,/' roommate-court.js

# pep: 1200 → 250 (↓ reduce, ratio=16%)
sed -i 's/max_tokens: 1200,/max_tokens: 250,/' pep.js

# email-urgency-triager: 2500 → 500 (↓ reduce, ratio=16%)
sed -i 's/max_tokens: 2500,/max_tokens: 500,/' email-urgency-triager.js

# conflict-coach: 2500 → 500 (↓ reduce, ratio=16%)
sed -i 's/max_tokens: 2500,/max_tokens: 500,/' conflict-coach.js

# pet-weirdness-decoder: 2500 → 500 (↓ reduce, ratio=16%)
sed -i 's/max_tokens: 2500,/max_tokens: 500,/' pet-weirdness-decoder.js

# jargon-assassin: 3000 → 500 (↓ reduce, ratio=16%)
sed -i 's/max_tokens: 3000,/max_tokens: 500,/' jargon-assassin.js

# virtual-body-double: 1800 → 250 (↓ reduce, ratio=15%)
sed -i 's/max_tokens: 1800,/max_tokens: 250,/' virtual-body-double.js

# laundro-mat: 2500 → 500 (↓ reduce, ratio=15%)
sed -i 's/max_tokens: 2500,/max_tokens: 500,/' laundro-mat.js

# six-degrees-of-me: 2500 → 500 (↓ reduce, ratio=15%)
sed -i 's/max_tokens: 2500,/max_tokens: 500,/' six-degrees-of-me.js

# focus-pocus: 2000 → 250 (↓ reduce, ratio=14%)
sed -i 's/max_tokens: 2000,/max_tokens: 250,/' focus-pocus.js

# name-audit: 3000 → 500 (↓ reduce, ratio=14%)
sed -i 's/max_tokens: 3000,/max_tokens: 500,/' name-audit.js

# gratitude-debt-clearer: 2500 → 500 (↓ reduce, ratio=14%)
sed -i 's/max_tokens: 2500,/max_tokens: 500,/' gratitude-debt-clearer.js

# brag-sheet-builder: 3000 → 500 (↓ reduce, ratio=13%)
sed -i 's/max_tokens: 3000,/max_tokens: 500,/' brag-sheet-builder.js

# focus-sound-architect: 3000 → 500 (↓ reduce, ratio=13%)
sed -i 's/max_tokens: 3000,/max_tokens: 500,/' focus-sound-architect.js

# brainstate-deejay: 2500 → 500 (↓ reduce, ratio=12%)
sed -i 's/max_tokens: 2500,/max_tokens: 500,/' brainstate-deejay.js

# recipe-chaos-solver: 2500 → 500 (↓ reduce, ratio=12%)
sed -i 's/max_tokens: 2500,/max_tokens: 500,/' recipe-chaos-solver.js

# pronounce-it-right: 3000 → 500 (↓ reduce, ratio=12%)
sed -i 's/max_tokens: 3000,/max_tokens: 500,/' pronounce-it-right.js

# doctor-visit-translator: 3500 → 500 (↓ reduce, ratio=12%)
sed -i 's/max_tokens: 3500,/max_tokens: 500,/' doctor-visit-translator.js

# caption-magic: 3000 → 500 (↓ reduce, ratio=11%)
sed -i 's/max_tokens: 3000,/max_tokens: 500,/' caption-magic.js

# brain-roulette: 2000 → 250 (↓ reduce, ratio=11%)
sed -i 's/max_tokens: 2000,/max_tokens: 250,/' brain-roulette.js

# plain-talk: 3000 → 500 (↓ reduce, ratio=11%)
sed -i 's/max_tokens: 3000,/max_tokens: 500,/' plain-talk.js

# research-decoder: 3000 → 250 (↓ reduce, ratio=10%)
sed -i 's/max_tokens: 3000,/max_tokens: 250,/' research-decoder.js

# money-diplomat: 3000 → 250 (↓ reduce, ratio=9%)
sed -i 's/max_tokens: 3000,/max_tokens: 250,/' money-diplomat.js

# brain-dump-buddy: 4000 → 500 (↓ reduce, ratio=8%)
sed -i 's/max_tokens: 4000,/max_tokens: 500,/' brain-dump-buddy.js

# room-reader: 3000 → 250 (↓ reduce, ratio=7%)
sed -i 's/max_tokens: 3000,/max_tokens: 250,/' room-reader.js

# leverage-logic: 2500 → 250 (↓ reduce, ratio=6%)
sed -i 's/max_tokens: 2500,/max_tokens: 250,/' leverage-logic.js

# gentle-push-generator: 2000 → 250 (↓ reduce, ratio=4%)
sed -i 's/max_tokens: 2000,/max_tokens: 250,/' gentle-push-generator.js

# awkward-silence-filler: 2500 → 250 (↓ reduce, ratio=4%)
sed -i 's/max_tokens: 2500,/max_tokens: 250,/' awkward-silence-filler.js

