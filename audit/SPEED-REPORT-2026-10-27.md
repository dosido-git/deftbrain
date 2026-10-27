# Speed report — 2026-10-27

Ranked by **time to first part** — the wait before a visitor sees anything, which decides whether they stay. Then all parts (the full answer on screen) and checked (corrections applied).

**Source:** the `progressive: first part …` lines in the local backend log (test runs, 1–5 per tool, some from before recent fixes). Provisional: replace with real-traffic timings from the Railway logs (same log line) before fixing anything. The 15 routes whose checks ran one after another were moved to side-by-side checks on 2026-10-27, so their "checked" column is now lower than shown.

**Targets** (audit/CONVENTIONS.md, Speed defaults): first part under 5s once research or input is ready; checked under 30s.

| Route | First part | All parts | Checked | Runs |
|---|---:|---:|---:|---:|
| ticket-tackler | 71.1s | 102.3s | 112.2s | 3 |
| markup-detective | 28.0s | 42.6s | 42.6s | 3 |
| pre-mortem | 20.1s | 22.2s | 31.9s | 1 |
| not-so-fast | 19.7s | 49.5s | 49.5s | 2 |
| paperwork-path | 19.1s | 28.6s | 63.3s | 2 |
| tip-of-tongue | 17.4s | 36.8s | 64.5s | 1 |
| ghost-writer | 17.3s | 55.0s | 55.0s | 3 |
| batch-flow | 17.1s | 41.4s | 45.4s | 3 |
| the-runthrough-cut | 16.6s | 31.7s | 31.7s | 3 |
| skill-gap-map | 15.5s | 95.0s | 95.0s | 2 |
| bill-rescue | 15.4s | 27.1s | 49.0s | 4 |
| fan-theory | 15.3s | 26.0s | 30.8s | 5 |
| brain-dump-buddy | 14.8s | 14.8s | 22.6s | 2 |
| plain-talk | 14.6s | 34.7s | 38.5s | 2 |
| recipe-chaos-solver | 14.5s | 14.5s | 20.5s | 1 |
| future-proof | 14.1s | 51.5s | 63.2s | 1 |
| laundro-mat | 13.8s | 13.8s | 22.2s | 1 |
| complaint-escalation-writer | 13.7s | 40.5s | 41.8s | 4 |
| procedure-probe | 13.4s | 33.2s | 40.6s | 2 |
| the-gap | 13.4s | 34.3s | 34.3s | 1 |
| date-night | 13.1s | 13.1s | 13.6s | 6 |
| plant-rescue-care | 12.6s | 21.8s | 29.7s | 3 |
| caption-magic | 12.3s | 12.4s | 13.5s | 1 |
| where-did-the-time-go | 11.9s | 11.9s | 27.4s | 2 |
| giftology | 11.9s | 35.6s | 35.8s | 2 |
| difficult-talk-coach | 11.6s | 42.7s | 42.7s | 1 |
| gravity-well | 11.6s | 33.1s | 41.4s | 2 |
| small-change-big-difference | 11.5s | 19.4s | 25.8s | 5 |
| meeting-hijack-stopper | 11.4s | 34.8s | 46.2s | 3 |
| culture-briefing | 11.4s | 13.6s | 44.9s | 1 |
| hobby-match | 11.2s | 16.1s | 20.1s | 8 |
| task-avalanche-breaker | 11.2s | 11.2s | 19.9s | 1 |
| magic-mouth | 11.1s | 22.2s | 22.2s | 1 |
| fake-review-detective | 11.1s | 29.1s | 45.1s | 4 |
| mise-en-place | 10.8s | 34.9s | 48.2s | 8 |
| whats-that-mean | 10.8s | 10.8s | 19.6s | 2 |
| lease-trap-detector | 10.3s | 43.0s | 54.9s | 6 |
| namestorm-blend | 10.0s | 26.3s | 26.3s | 3 |
| leverage-logic | 9.6s | 30.4s | 37.1s | 6 |
| velvet-hammer | 9.6s | 9.6s | 15.8s | 1 |
| waiting-mode-liberator | 9.6s | 9.6s | 17.5s | 1 |
| plot-hole-find | 9.4s | 13.6s | 28.5s | 4 |
| brag-sheet-builder | 9.2s | 16.5s | 37.5s | 1 |
| name-audit | 9.2s | 9.3s | 26.7s | 1 |
| truth-bomb | 9.1s | 31.2s | 31.2s | 3 |
| concept-coach | 8.8s | 34.6s | 38.3s | 1 |
| plant-rescue-rescue | 8.6s | 28.5s | 42.0s | 3 |
| analogy-engine-more | 8.5s | 10.5s | 46.7s | 1 |
| get-noticed | 8.4s | 26.2s | 32.8s | 2 |
| dream-single | 8.3s | 17.6s | 17.6s | 1 |
| heckler-prep | 8.0s | 28.6s | 28.6s | 3 |
| gratitude-debt-clearer | 7.9s | 7.9s | 15.8s | 1 |
| decision-prism | 7.8s | 40.5s | 49.8s | 1 |
| sleep-architect | 7.7s | 13.0s | 13.0s | 1 |
| brainstate-deejay | 7.5s | 22.9s | 22.9s | 1 |
| bookmark | 7.3s | 21.1s | 21.1s | 4 |
| mental-health-navigator | 7.2s | 71.9s | 71.9s | 2 |
| room-reader | 7.1s | 8.2s | 16.3s | 1 |
| upsell-shield | 7.1s | 17.0s | 25.5s | 3 |
| crash-predictor-analyze | 6.9s | 14.8s | 28.3s | 2 |
| party-architect | 6.7s | 20.0s | 20.0s | 1 |
| pep | 6.7s | 13.2s | 18.9s | 2 |
| buy-wise/fast | 6.6s | 47.6s | 47.6s | 4 |
| alternate-path | 6.3s | 33.3s | 40.6s | 1 |
| renters-deposit-saver | 6.2s | 8.0s | 8.2s | 3 |
| pet-weirdness-decoder | 6.1s | 21.6s | 28.6s | 1 |
| the-debrief | 6.1s | 24.2s | 33.9s | 1 |
| context-collapse | 6.1s | 19.0s | 19.0s | 2 |
| brain-roulette | 6.0s | 16.1s | 16.1s | 1 |
| heart-of-the-matter | 5.9s | 18.6s | 18.6s | 1 |
| money-diplomat | 5.9s | 13.1s | 14.4s | 16 |
| apology-calibrator | 5.9s | 19.8s | 26.9s | 1 |
| doctor-visit-prep | 5.8s | 17.4s | 28.8s | 2 |
| argue-smarter-prep | 5.8s | 49.1s | 49.1s | 1 |
| email-urgency-triager | 5.7s | 26.2s | 35.2s | 10 |
| decoder-ring | 5.5s | 29.5s | 34.9s | 1 |
| ArgueSmarterAudienceJudge | 5.4s | 13.0s | 13.0s | 1 |
| namestorm | 5.3s | 13.4s | 13.4s | 6 |
| namestorm-quick | 5.2s | 8.3s | 8.3s | 5 |
| safe-walk | 5.2s | 14.6s | 14.6s | 1 |
| scam-radar | 5.2s | 23.9s | 23.9s | 7 |
| doctor-visit-translator | 5.1s | 19.8s | 19.8s | 1 |
| wrong-answers-only | 5.1s | 16.2s | 16.2s | 1 |
| layover-maximizer | 4.9s | 33.3s | 33.3s | 1 |
| conflict-coach | 4.9s | 6.9s | 15.3s | 1 |
| money-diplomat-split | 4.9s | 24.4s | 42.8s | 1 |
| lazy-workout-adapter | 4.6s | 25.2s | 32.5s | 1 |
| roommate-court-v2 | 4.4s | 24.9s | 24.9s | 1 |
| toast-writer | 4.3s | 12.6s | 26.6s | 4 |
| trip-recon | 4.3s | 13.8s | 13.8s | 1 |
| signal-vs-noise | 4.0s | 16.8s | 25.6s | 4 |
| research-decoder | 3.8s | 20.5s | 25.9s | 1 |
| argue-smarter | 3.7s | 21.6s | 27.2s | 2 |
| justify-my-meeting | 3.4s | 16.7s | 28.7s | 1 |
| analogy-engine | 3.3s | 9.4s | 22.4s | 4 |
| document-detective | 3.3s | 28.1s | 43.8s | 1 |
| the-alibi | 2.9s | 17.7s | 17.7s | 1 |
| contrast-report | 2.8s | 18.4s | 30.4s | 2 |
| belief-stress-test | 2.4s | 25.1s | 25.1s | 1 |
| awkward-silence-filler | 2.3s | 12.1s | 12.1s | 1 |
| roast-me | 1.8s | 11.5s | 11.5s | 1 |
| history-today | 0.0s | 18.8s | 34.3s | 1 |
| contract-decoder | 0.0s | 9.5s | 9.5s | 1 |

**Next (owner, 2026-10-27):** after a few days of traffic, read the same lines from Railway, fix the slowest ~5 by first part (split the first pass smaller), one live test each (~$1.50 total).

Done 2026-10-27: checks side by side on every route (backend audit S10.1); evidence-fit, certainty and analogy checks chunked per item; Signal vs. Noise 82s → first part 3.9s, all parts 12.8s, checked 25–31s.
