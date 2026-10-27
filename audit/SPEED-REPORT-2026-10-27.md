# Speed report — 2026-10-27

Routes whose slowest answer-writing call takes over 20s (median, local METRIC log; checks and research excluded). Fix: split the call into parallel parts (audit/CONVENTIONS.md, Speed defaults, rule 2). A route already progressive may show a first part sooner — the number is the slowest part, which bounds the full answer.

| Route | Slowest call | Output tokens | Call label |
|---|---:|---:|---|
| buy-wise | 84s | 5781 | `buy-wise` |
| lease-trap-detector | 62s | 3589 | `lease-trap-detector-checklist` |
| someone-said-it-better | 61s | 3987 | `someone-said-it-better-quotes` |
| contract-decoder | 60s | 2898 | `contract-decoder-v2-first-pass` |
| ticket-tackler | 58s | 2360 | `ticket-tackler-investigator` |
| the-runthrough | 56s | 2212 | `the-runthrough-2` |
| plot-hole-finder | 55s | 2458 | `plot-hole-find` |
| paperwork-path | 53s | 2636 | `paperwork-path` |
| skill-gap-map | 50s | 2432 | `SkillGapMap:primary` |
| bookmark | 48s | 1824 | `bookmark-chronology` |
| doctor-visit-translator | 47s | 3929 | `doctor-visit-translator` |
| bill-rescue | 44s | 2132 | `bill-rescue-support` |
| difficult-talk-coach | 42s | 1960 | `DifficultTalkCoach-approach-collaborative` |
| complaint-escalation-writer | 42s | 1726 | `ComplaintEscalation-stages-late` |
| analogy-engine | 41s | 1926 | `analogy-engine` |
| layover-maximizer | 38s | 1896 | `layover-maximizer:leave` |
| decoder-ring | 36s | 1635 | `decoder-ring` |
| decision-prism | 36s | 1848 | `decision-prism-options` |
| culture-briefing | 35s | 3180 | `culture-briefing` |
| plain-talk | 35s | 2024 | `plain-talk` |
| dream-pattern-spotter | 35s | 1523 | `dream-single` |
| jargon-assassin | 34s | 1892 | `jargon-assassin-extract` |
| roommate-court | 34s | 1576 | `roommate-court-v2` |
| meeting-hijack-stopper | 34s | 1488 | `meeting-hijack-stopper` |
| mental-health-navigator | 33s | 1697 | `mental-health-navigator` |
| truth-bomb | 33s | 1636 | `truth-bomb` |
| missing-link | 32s | 1748 | `the-gap-trace` |
| history-today | 32s | 1306 | `history-today-p2` |
| upsell-shield | 31s | 1458 | `upsell-shield` |
| trip-recon | 31s | 1456 | `trip-recon` |
| doctor-visit-prep | 31s | 1436 | `doctor-visit-prep` |
| procedure-probe | 30s | 1368 | `procedure-probe` |
| not-so-fast | 30s | 1670 | `rulebook-breaker-2` |
| mend | 29s | 1389 | `apology-calibrator` |
| ghost-writer | 29s | 1310 | `ghost-writer-structured` |
| chaos-pilot | 28s | 1091 | `ChaosPilot` |
| markup-detective | 28s | 1901 | `markup-detective` |
| sensory-minefield-mapper | 27s | 1190 | `sensory-minefield-mapper` |
| heckler-prep | 27s | 1451 | `heckler-prep:generate-3` |
| name-audit | 27s | 1264 | `NameAudit` |
| tip-of-tongue | 27s | 1215 | `tip-of-tongue-find` |
| batch-flow | 26s | 1498 | `BatchFlowGenerate` |
| get-noticed | 26s | 1263 | `get-noticed-2` |
| decision-coach | 26s | 1378 | `DecisionCoach2` |
| argue-smarter | 26s | 1238 | `ArgueSmarterPrep` |
| the-debrief | 26s | 1394 | `the-debrief` |
| signal-vs-noise | 25s | 1102 | `signal-vs-noise:synthesis-2` |
| mise-en-place | 25s | 2402 | `mise-en-place-2` |
| lazy-workout-adapter | 24s | 1213 | `lazy-workout-adapter` |
| giftology | 24s | 1150 | `giftology-picks1` |
| name-storm | 24s | 1142 | `NameStorm/Blend-more2` |
| belief-stress-test | 24s | 924 | `belief-stress-test:rebuild` |
| pre-mortem | 22s | 882 | `pre-mortem-memo` |
| plant-rescue | 21s | 922 | `plant-rescue-rescue-2` |
| scam-radar | 21s | 894 | `scam-radar:4` |
| email-urgency-triager | 21s | 1426 | `email-urgency-triage-analysis-v2` |
| sleep-architect | 20s | 956 | `sleep-architect-v2` |
| quote-check | 20s | 1027 | `quote-check` |
| leverage-logic | 20s | 958 | `leverage-logic-2` |
| brainstate-deejay | 20s | 878 | `BrainstateDeejay` |

Done 2026-10-27: checks side by side on every route (S10.1 clean); evidence-fit, certainty and analogy checks chunked; Signal vs. Noise claims split (82s → 25–31s fully checked).
