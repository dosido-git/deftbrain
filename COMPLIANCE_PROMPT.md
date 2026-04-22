<!-- v1.1 · 2026-04-20 · session 110 additions: version header discipline section -->
# DeftBrain Standards Compliance — Mandatory Instructions

## The Single Most Important Rule
The standards exist in writing. CONVENTIONS.md and the audit checklist are the authoritative source for every pattern, every class name, every structural decision. There is no acceptable reason to reconstruct any pattern from memory. Memory drifts. The file does not.

---

## Before Writing Any New Tool Component

You MUST complete all of the following before writing the first line of code. State each one explicitly before proceeding:

1. Read CONVENTIONS.md in full (use the `view` tool — do not rely on memory)
2. State the header pattern you will use
3. State the c block source (PF-2 verbatim)
4. State the hook order (PF-10)
5. Confirm cross-ref rules (≤3 per cluster, emoji before name, no target="_blank", /PascalCase hrefs)
6. Confirm root div pattern (`space-y-4 ${c.text}`, no background)

If you skip this protocol and a violation is discovered in review, that is a failure of process, not just a mistake.

---

## Before Beginning the Audit

**Step 0 — Backlog scan.** Open `audit-backlog.md` and search for the tool name. Note any open items attached to that file. At the end of the baseline audit, decide whether to fold them into the current pass:
- **Default yes** if they touch the same region of the file as the audit's other fixes, or if the audit's fixes would make them trivially cheap to include.
- **Default defer** if they're structurally unrelated — e.g., a PF-16 reset restructure is unrelated to a PF-12 typo sweep.

Either way, reference the backlog in the write-up. Items that get folded in must be checked off (`[x]`). Items that stay open should be re-logged with updated context if the audit revealed new information about them.

If the backlog has no entries for the tool, still glance at the "Cross-file / catalog-wide" and "Audit script patches" sections — the current audit may surface evidence relevant to those.

---

## During Every Audit

Run every checklist item. Do not decide in advance that a section "looks fine" — every scan must be executed. When the checklist says "run this grep," run it. When it says "read the file," read it.

Apply intelligence and discernment throughout:
- If a pattern looks wrong even though it passes the mechanical scan, investigate it
- If something is inconsistent with how other tools in the codebase work, flag it
- If a fix creates a new problem, catch it before output — not after deployment
- Cross-reference every result against the established visual standard, not just the rules on paper

---

## Choosing Edit Strategy by Baseline Severity

Before starting any audit, run `audit_v2-3.py` on the uploaded file to establish a baseline violation count. That count dictates the editing strategy:

**Baseline ≤ 5 violations** — surgical `str_replace` edits, one violation at a time. Preserves the existing file exactly where it's already correct; minimizes diff size for review.

**Baseline 6–14 violations** — surgical `str_replace` edits, grouped by section (imports, c block, hooks, render). Same preserve-what-works principle, but batched.

**Baseline ≥ 15 violations — trigger a locality check, then choose.** Count alone is a weak signal; what matters is how many *structural zones* are broken. Categorize the violations into these five zones:

1. **Imports** — wrong components, missing `useRegisterActions`, `lucide-react` present
2. **c block** — Python-replace typos, undefined keys, banned colors, missing `required`
3. **Hook order** — state / useRef / usePersistentState / useEffect sequencing
4. **Header structure** — single card, divider, title/icon/tagline fallbacks, reset placement
5. **Render body** — keyboard handler, submit button, cross-refs, ActionBar pattern

**If 3 or more zones are broken → full rewrite preferred.** Per-edit overhead dominates a session's tool-call budget, surgical edits risk partial application (half-fixed file in outputs), and a single `create_file` rewrite costs one tool call versus twelve+ `str_replace` operations. Fits comfortably in a single session for tools up to ~700 lines.

**If 2 or fewer zones are broken → surgical wins even at count ≥ 15.** Typo waves in JSX, one header fix, one ActionBar removal, one broken cross-ref — tractable in 6–10 `str_replace` calls. Surgical preserves thoughtful existing UX (panic modes, conditional cross-refs, custom sub-components) at lower risk than reconstruction.

Reference data points from the audit campaign:

| Tool | Count | Zones broken | Right call |
|------|-------|--------------|------------|
| ApologyCalibrator | 12 | 1 (c block) | Surgical |
| AwkwardSilenceFiller | 15 | 2 (c block + render) | Surgical |
| ArgumentSimulator | 16 | 4 (imports + c + header + render) | Full rewrite |
| AnalogyEngine | 17 | 5 (all zones) | Full rewrite |
| AlternatePath | 17 | 5 (all zones) | Full rewrite |
| BatchFlow | 19 | 5 (all zones) | Full rewrite |

Rule #8 ("maintain all previous changes and improvements") is compatible with both strategies — full rewrite does not mean discarding work. The rewrite's job is to preserve every feature, every backend call, every piece of state; only the *structure* changes, not the behavior. Before executing a full rewrite, identify every feature, handler, and backend action in the source file and confirm each will be present in the rewrite. The user may pre-authorize full rewrite at session start with "full rewrite OK on this one" to skip the locality check.


---

## The Post-Fix Read-Through

After every edit session — audits, new builds, hotfixes — read the entire output file from line 1 to the last line before presenting it. No skipping. No skimming. Ask of every block:
- Does this render what I think it renders?
- Does this close what it opened?
- Does every className contain what I think it contains?
- Is this consistent with how every other tool in the codebase looks?

A file that passes every grep scan but has not been read is not ready to ship.

---

## Version Header Discipline

Standards documents carry a header of the form `<!-- vX.Y · DATE · TAG -->`. Any edit to a file with this header must update the header as part of the same commit — not later, not in a follow-up session. Files currently under this discipline:

- `COMPLIANCE_PROMPT.md` (this file)
- `CONVENTIONS.md`
- `audit-backlog.md`
- `tool-audit-checklist-v4_37.md`
- `backend-audit-section7.md`
- `cross-reference-map.md`

**Versioning rules:**

| Change type | Version bump | Example |
|---|---|---|
| Additive content (new rule, new backlog item, new addendum) | Minor: `v1.0 → v1.1` | Added version header section to this file |
| Structural reorganization, rule removal, rule rewording that changes meaning | Major: `v1.1 → v2.0` | Restructured PF-rules into numbered buckets |
| Typo fix, formatting polish, pure clarification with no semantic change | No bump | Fixed broken markdown link |

**Date:** Update to today's date on every version bump. If same-day multiple edits, date stays; only the version increments.

**Tag:** Replace with a short description of what this version changed — not what the file does. Good: `"session 110 additions: NameAudit campaign, backend_audit_v1 proposal"`. Bad: `"active backlog"` (describes the file, not the change).

**Read-through protocol extension:** the post-fix read-through is not complete until the header reflects the new state. Before presenting any edited standards document, confirm:
- Version number incremented per the table above
- Date is today
- Tag describes the change, not the file

**Rationale:** The same drift problem that makes the standards themselves authoritative applies to their history. A stale header signals the file hasn't been maintained; a fresh header signals "this is current as of the last change." Future sessions (whether me or another Claude) use the version tag to quickly assess which documents they can trust and which need reconciliation against the working code.

---

## Specific Patterns That Must Never Drift

These have been violated and corrected. They must not require correction again:

**Header position:** The `<h2>` title and tagline are always the first visible element inside the gradient frame — on every tab, in every state (input, results, loading, settings). They never disappear when the user switches tabs or when results load. They live in the persistent outer card header, not inside a render helper. In multi-mode tools, mode tabs belong *inside* the header card below the title/tagline `border-b` divider — never at the component root above the header.

**Header divider:** `border-b border-zinc-500` is always on an inner div that sits inside a padded wrapper (`px-5 pt-5`). It is never placed on the same div that carries horizontal padding. The divider must be visually inset from the card edges — not edge-to-edge.

**Header structure:** One card. Header at top with `border-b border-zinc-500` divider. Inputs below. Never two separate cards. Never a header-only card.

**c block:** Copied verbatim from CONVENTIONS.md PF-2. Never reconstructed from memory. `linkStyle` is a standalone `const` after the c block, never inside it.

**Hook order:** useClaudeAPI + useTheme → c block + linkStyle → useState → useRef → usePersistentState → handlers → buildFullText → useRegisterActions → scroll useEffect → keyboard useEffect → cleanup useEffect → render helpers → return.

**Submit button:** `tool?.icon` in both loading AND idle branches. Never a hardcoded emoji in the idle branch. *Multi-mode exception: in tools with multiple functional modes where each mode has its own submit button with a distinct semantic purpose, each mode's idle icon may use a topical emoji. The loading-state icon must still spin `tool?.icon` via a shared `<Spinner />` helper. See CONVENTIONS.md PF-14 for the reference case.*

**Cross-refs:** Mandatory — at least one link, sourced from `cross-reference-map.md`. Zero cross-refs is a violation. **Max 3 links per cluster** (where "cluster" = cross-refs appearing within ~5 lines of each other in the JSX — a single footer, sidebar, or inline paragraph). Preferred: 1–2 per cluster. Cross-refs can appear on multiple pages/branches of the same tool; each page's cluster is counted independently. Emoji before name. `/PascalCase` hrefs. No `target="_blank"`. Pre-result ref visible before submit. Post-result ref inside results block.

---

## The Standard You Are Held To

Consistency and completeness. Every tool should look like it was built by the same person with the same standards on the same day. When a user opens any DeftBrain tool, the header is in the same place, the divider looks the same, the spacing feels the same, the patterns are the same. That consistency is not an aesthetic preference — it is the product.

You have the intelligence to catch problems before they are presented. Use it. The goal is zero correction passes, not fast first drafts.

---

## Scope Boundary — What This Document Does Not Cover

This document and `audit_v2-3.py` enforce **structural** compliance: imports, hook order, c block, cross-refs, file conventions. They cannot detect **behavioral** UX bugs — panels that render off-screen, loading icons replaced by static clocks instead of spinning in place, togglable panels that silently fail after results exist, stale content during refetch.

Those are covered by `ux-smoke-playbook.md` and `ux-smoke.py`, which run as a post-audit quality pass once structural compliance reaches 100% catalog-wide. During per-tool audits, do not attempt to also cover behavioral UX — that's a different cognitive mode (interactive, live-deployment) and mixing the two per session is counterproductive. Finish the structural audit, then switch modes for the catalog-wide UX pass.

Exception: if a behavioral bug jumps out at you while reading the render section during a structural audit (e.g., `{showX && !results && …}` guard on a nav-toggled panel), fix it in the same commit — that's cheap intelligence, not a scope breach. The rule is: don't go looking, but don't ignore what's in your face.
