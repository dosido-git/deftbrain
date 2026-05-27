<!-- v2.0 · 2026-05-20 · major revision: audit script coverage expanded (v2.5 frontend, v1.7 backend); manual checklist reduced to irreducible-only; calling-convention bug class documented; S7.12/S7.13/PF-22 added; backend_audit_v1_8 deprecated -->

# DeftBrain Standards Compliance — Mandatory Instructions

## The Single Most Important Rule

The standards exist in writing. CONVENTIONS.md and the audit scripts are the authoritative source for every pattern, every class name, every structural decision. There is no acceptable reason to reconstruct any pattern from memory. Memory drifts. The file does not.

---

## Toolchain Inventory

Before any audit, confirm every file below is accessible. If any is missing, stop and ask.

| File | Role | When to use |
|---|---|---|
| `COMPLIANCE_PROMPT.md` | Entry point — workflow, strategy, version discipline | Start of every session |
| `CONVENTIONS.md` | Rules — patterns, c block, hook order, color map | Before writing any tool; whenever a pattern is unclear |
| `audit_v2-3-2.py` (v2.5) | Frontend structural automation — 40+ checks | Run on every frontend file before any manual work |
| `backend_audit_v1_7.py` (v1.7) | Backend route automation — S7.1–S7.13 | Run on every backend route file before any manual work |
| `cross-reference-map.md` | Runtime data — which tools link to which | When auditing S5.5 cross-refs |
| `audit-backlog.md` | Campaign state — deferred items, known FPs | Step 0 of every audit |
| `ux-smoke-playbook.md` + `ux-smoke.py` | Behavioral UX — post-structural pass only | After structural compliance reaches 100% catalog-wide |

**Critical:** `audit_v2-3-2.py` → `backend_audit_v1_7.py` → manual checklist (below) → `audit-backlog.md`. Skipping any step is the most common audit failure mode.

**Deprecated:** `backend_audit_v1_8.py` has a critical bug (early `return fails` at line 310 makes S7.1–S7.10 dead code). Do not use. The authoritative backend script is `backend_audit_v1_7.py`.

---

## Audit Workflow — Every Tool, Every Time

### Step 0 — Backlog scan
Open `audit-backlog.md` and search for the tool name. Note any open items. At the end of the audit, fold in items that touch the same file region; defer the rest.

### Step 1 — Run frontend audit script
```
python3 audit_v2-3-2.py path/to/ToolName.js
```
Fix every reported violation before proceeding. Do not skip warnings — they indicate real production risk. The script now catches:

**Structural:** S0/S0f (header, icon/title fallbacks), S1.1–S1.7 (color, layout, dark mode, action buttons, reset, mobile, components), S2.1/S2.3 (input handling, spinner), S5.4 (disclaimer), S5.5 (cross-refs), PF-2 through PF-25.

**New in v2.5 (2026-05-20):**
- **PF-22** — inline `<CopyBtn>` in JSX. Any count > 0 is a violation. All copy goes through `useRegisterActions`. Only exception: ContextCollapse (PF-5 documented).
- **PF-16 broadened** — reset button text detection catches emoji variants (🔄, 🔁) not just ↺/↩.
- **PF-24** — non-standard `useTheme` destructure (`const { theme }` → must be `const { isDark }`).
- **PF-25** — history cap > 6 without documented exception comment.
- **PF-14 addition** — `useState`/`useRef` declared after first `useEffect`.

### Step 2 — Run backend audit script
```
python3 backend_audit_v1_7.py path/to/route-name.js
```
Fix every reported violation. The script now catches S7.1–S7.13:

**New in v1.7 (2026-05-20):**
- **S7.10 floor** — `max_tokens` < 800 on structured JSON routes (truncation risk with real-world inputs). Use ≥ 800 for flat schemas, ≥ 1500 for schemas with arrays.
- **S7.12** — `callClaudeWithRetry` simple-string calling convention. `callClaudeWithRetry(promptVar, { model, system, ... })` silently ignores `model` and `system`. Always use full request form: `callClaudeWithRetry({ model, max_tokens, system, messages: [{role: 'user', content: prompt}] }, { label })`.
- **S7.13** — Response guard field vs top-level schema key mismatch. `if (!parsed.X)` where `X` is not a top-level key in the route's JSON schema always fires, permanently breaking the route.

### Step 3 — Manual checklist (irreducible)

These checks cannot be automated. Run every one, explicitly:

**PF-3: Header card structure** — read the `return` statement. One card. Header (`<h2>` + tagline + Try Example) at top with `border-b border-zinc-500` divider. Inputs below. Never two separate cards. Never a header-only card. Reset button in header top-right, visibility-guarded by `{results ? ... : null}`.

**Cross-ref placement** — pre-result ref visible before submit; post-result ref inside results block. Cannot be verified by regex alone.

**Replace-mode tools** — if the tool uses `{!results && renderInput()}` / `{results && renderResults()}`, both phases need their own persistent header. The reset button in the results-phase header must call `handleReset`, not be inside the render helper.

**Submit button behavior after results** — if the tool should not allow re-submission after results exist, confirm `|| !!results` (or equivalent) is in the submit `disabled` condition.

**Tab/mode pre-population** — if the tool has multiple modes (tabs), switching tabs should pre-populate shared fields (`whatHappened`, `relationship`) from the primary mode's form state, not leave them blank.

**Backend schema coherence** — frontend accesses `data.X`; confirm `X` is actually what the backend prompt asks Claude to return. Key names in the prompt schema must exactly match key names rendered in the frontend. Mismatch is silent data loss.

**Frontend/backend endpoint parity** — count `callToolEndpoint('route-name', ...)` calls in the frontend; count `router.post('/route-name', ...)` in the backend. They must match. A frontend call to a missing backend route is a silent 404.

**Content quality** — does the tool's output actually solve the stated problem? Is the AI doing something a template couldn't? Is the output depth appropriate for the input effort?

### Step 4 — Backlog update
Check off resolved items. Log any new findings discovered during the audit. Reference the backlog section header for any catalog-wide patterns surfaced.

---

## New Tool vs Repair Decision

**New tool builds:** Always write from scratch against CONVENTIONS.md. Never copy from an existing tool and modify — copying carries existing violations into the new file and introduces new ones during modification.

**Existing tool repairs:** Use the edit strategy by baseline severity (see below). Do not rebuild a tool that is fundamentally sound just because it has accumulated violations — the backend prompts and AI logic represent real value that a rebuild risks losing.

---

## Edit Strategy by Baseline Severity

Run the audit scripts first to establish a violation count and zone breakdown.

**≤ 5 violations** — surgical `str_replace`, one at a time.

**6–14 violations** — surgical `str_replace`, grouped by zone (imports, c block, hooks, render).

**≥ 15 violations** — zone check first. Categorize into five zones:
1. Imports
2. c block
3. Hook order
4. Header structure
5. Render body

**3+ zones broken → full frontend rewrite preferred.** Per-edit overhead dominates; a single `create_file` costs one tool call vs twelve+ `str_replace` operations.

**≤ 2 zones broken → surgical wins even at count ≥ 15.** Preserve thoughtful existing UX.

Backend routes are always surgical — prompts represent significant authoring work and must be preserved exactly.

---

## Before Writing Any New Tool

State each of the following explicitly before writing the first line:

1. Read CONVENTIONS.md in full (use `view` — never rely on memory)
2. State the header pattern
3. State the c block verbatim (PF-2)
4. State the hook order (PF-10)
5. State the calling convention for `callClaudeWithRetry` (full request form — see S7.12)
6. Confirm cross-ref targets from `cross-reference-map.md`
7. Confirm root div pattern (`space-y-4 ${c.text}`, no background)
8. State the JSON schema top-level keys and confirm the response guard matches

---

## Patterns That Must Never Drift

**Copy buttons:** Zero inline `<CopyBtn>` in any tool JSX. The ActionBar in `ToolPageWrapper` handles copy/share/print via `useRegisterActions`. The only documented exception is ContextCollapse (PF-5).

**Start Over:** Exactly one reset button per tool, in the persistent header card, top-right, visibility-guarded by `{results ? ... : null}`. Never in a results section. Never inside a render helper.

**callClaudeWithRetry:** Always full request form. Simple string form silently drops `model` and `system` — the wrong model runs with a generic system prompt and produces degraded output with no error.

**Response guards:** `if (!parsed.X)` — X must be a top-level key in the JSON schema this route asks Claude to return. Check with the automated S7.13 check and verify manually.

**max_tokens:** ≥ 800 for flat JSON schemas; ≥ 1500 for schemas with arrays or multiple nested objects. The model stops generating when done — a higher ceiling costs nothing in latency or money when the output fits within it. A ceiling that's too low truncates JSON mid-structure and produces a parse error.

**Header position:** `<h2>` title and tagline are always the first visible element inside the card header, on every tab, in every state. They never disappear on tab switch or results load.

**c block:** Copied verbatim from CONVENTIONS.md PF-2. Never reconstructed from memory. `linkStyle` is a standalone `const` after the c block — never inside it.

**Hook order:** `useClaudeAPI` + `useTheme` → c block + `linkStyle` → `useState` → `useRef` → `usePersistentState` → handlers → `buildFullText` → `useRegisterActions` → `useEffect`s → render helpers → `return`.

---

## What the Scripts Cannot Check (Manual Only)

These require reading code or exercising judgment:

- PF-3 header card structure (render tree semantics)
- Cross-ref placement (pre vs post results)
- Submit-after-results behavior intent
- Tab pre-population of shared context fields
- Frontend/backend schema key name alignment
- Frontend/backend endpoint count parity
- Content quality and AI value-add
- Visual quality and spacing
- i18n output correctness
- Whether a behavioral pattern is intentional or a bug

---

## Version Discipline

| Change type | Version bump |
|---|---|
| New rule, new check, new backlog item | Minor: v1.0 → v1.1 |
| Structural reorganization, rule removal, rule rewording | Major: v1.1 → v2.0 |
| Typo fix, formatting, pure clarification | No bump |

Update the date on every version bump. The version tag describes what changed, not what the file does.

