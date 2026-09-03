# Justify My Meeting — tool notes

Renamed from **Meeting BS Detector** on 2026-09-02, in the same commit as a full
V2 rewrite. Route `backend/routes/justify-my-meeting.js`, component
`src/tools/JustifyMyMeeting.js`, i18n prefix stays `mbd_` (naming-consistency
rule: route file and endpoint follow the catalog id; the i18n prefix never does).

## What changed and why

The old tool graded meetings on vibes and dressed the grade in false precision:
a confidence score, a quality score, "BS / borderline / legitimate", a
"permission to decline" statement, and person-hours the model calculated in
prose. Eleven modes, most of which nobody could have used in one sitting.

The rewrite asks one question instead: **does the goal of this meeting need
everyone in the room at the same time?** Four modes, four verdicts, and the
arithmetic moved out of the prompt.

| Then | Now |
| --- | --- |
| 11 modes | 4: Judge a Meeting, Zombie Check, Week Audit, Rescue This Meeting |
| BS / borderline / legitimate | KEEP IT · SHORTEN IT · FIX IT · MAKE IT ASYNC · NOT ENOUGH TO TELL |
| confidence score + quality score | neither — replaced by `unknowns_that_matter` |
| model wrote "saves 8 hours" | `timeFootprint()` computes person-hours in code from supplied numbers only |
| "permission to decline" | a message that **proposes** and never assumes the visitor may skip |
| agenda / messages as standalone modes | offered contextually, after the verdict that earns them |

## The things that will bite the next person

**Arithmetic never goes to the model.** `timeFootprint()` and the week `totals`
block compute from `duration` and `attendees` as supplied. A missing number
produces `null`, not an estimate, and the frontend renders only the cells that
came back non-null. Every prompt says so twice — once in the body, once at the
end of the schema — because a model that is told once will still write "roughly
22 hours burned" into a prose field.

**Numbers in prose fields are the recurring failure.** The week `summary` came
back with "14 to 73 people" on the first live run — a range nobody supplied,
from a field whose description said nothing about numbers while a general
instruction elsewhere forbade arithmetic. The fix was in the field description,
not the prose: *"NO NUMBERS AT ALL in this field."* Same lesson as everywhere
else — the schema is the last and most concrete instruction, and it wins.

**Frequency is not in the week payload.** The list carries `recurring: true|false`
and nothing else. The model called a Monday standup "a small daily sync" until
the prompt said in as many words that a name is not a fact about the schedule.

**Three enums are pinned to exact English in code, and this is deliberate.**
`verdict` (both verdict sets, via `pinVerdict`), `better_format.recommendation`
and `per_meeting[].read` (via `pinTo`). `withLanguage` translates JSON string
*values*, so a frontend that switches on a translated value gets the wrong
colour in twelve languages — and a backend guard that validates one is a hard
500 in all twelve. Pinning in code is the only safe version. The visitor never
reads the pinned string: the frontend maps it through `VERDICT_LABELS` /
`FORMAT_LABELS` / `READ_LABELS` to a `t()` key, so the label translates and the
value does not.

**`validateResult` walks arrays.** There is no early return for arrays — an
array *is* an object, so `Object.entries` enumerates its indices and the scrub
reaches strings inside arrays. An earlier version returned early on arrays and
every array-of-strings field went unchecked; that is how "most attendees are
passive listeners" survived inside `why_this_verdict`. Blanked *named* fields
become `''`; blanked *array items* are pruned, because an empty bullet reads
worse than no bullet.

**No session history, by decision.** `JustifyMyMeeting` is in `_NO_HISTORY_TOOLS`
in `audit/audit_v2-3-2.py`. The Stats mode that displayed it was one of the
seven modes cut, and a stored list of the meetings someone tried to get out of —
verdict attached, on a work machine — is not a thing to keep by default.

**localStorage key was bumped** (`jmm-sessionHistory-v2`) in the same commit as
the schema change, per the rule learned from Magic Mouth: a persisted v1 result
restored into a v2 renderer crashes the tool for every existing user.

## Endpoints

| Path | Purpose | max_tokens |
| --- | --- | --- |
| `/justify-my-meeting` | Judge a Meeting | 4000 |
| `/justify-my-meeting/zombie` | Zombie Check (recurring) | 4000 |
| `/justify-my-meeting/week` | Week Audit | 5000 |
| `/justify-my-meeting/rescue` | Rescue This Meeting | 2500 |
| `/justify-my-meeting/agenda` | offered after **FIX IT** | 3500 |
| `/justify-my-meeting/message` | offered after **SHORTEN IT** / **MAKE IT ASYNC** | 2500 |

All six on `MODELS.SMART`, all through `callClaudeWithRetry`, all v2 output
standard with `validateResult` as the declared check.

## Goldens

`audit/justify-my-meeting-golden-sample.json` was carried over from the old tool
and **its cases are stale** — they exercise endpoints that no longer exist.
Re-record before trusting `npm run check:golden`.
