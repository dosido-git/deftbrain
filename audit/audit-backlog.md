<!-- v1.4 · 2026-05-02 · catalog-wide rate-limit sweep closed: 122/122 routes covered via add_rate_limit.py patcher; closes the highest-priority pre-launch item -->
<!-- v1.3 · 2026-05-02 · Bucket 3 design calls all resolved: PF-15 chat-style/quick-add exemption documented (closes 2 ApologyCalibrator items + 2 Bucket 3 items), BatchFlow dumpText exemption denied (Bucket 3 closed; Bucket 2 implementation pending file upload), callClaudeWithRetry sanctioned (closes NameAudit architectural-deviation item + Bucket 3 item). Standards docs CONVENTIONS.md → v1.4, tool-audit-checklist-v4_39.md → v1.3. -->
<!-- v1.2 · 2026-05-02 · session 2026-05-02 closures: 4 audit-script patches applied (accentTxt whitelist, S1.1i/k word boundary, PF-2 ordering, PF-16 broaden); 2 new findings opened (PF-16 render-helper-pattern, PF-3 reclassified as feature add); TheGap audit re-completed after first-pass missed PF-3 + PF-16 defects -->
<!-- v1.1 · 2026-04-20 · session 110 additions: NameAudit campaign, backend_audit_v1 proposal -->

# Audit Backlog

Running log of findings that surface during compliance audits but don't get fixed in the same commit as the audit that found them. Entries sort into three buckets:

1. **Fix now** — directly relevant to the tool being audited, doesn't expand scope, low risk. These rarely land here; they get fixed inline. An item appears in this bucket only when the same session touched several files and one tool's issue was deferred for batching reasons.
2. **Backlog** — real bugs or convention violations. Fixing would have expanded scope beyond the audit session that found them, or would have touched files outside the current focus. Address when that file next opens, or in a dedicated backlog-burndown session.
3. **Candidate exception** — unclear whether it's a bug or a legitimate pattern. Needs a design decision before code changes. The resolution might be "document the exception in CONVENTIONS.md" rather than "fix the code."

**Status markers:** `[ ]` open · `[x]` done · `[~]` in progress · `[-]` closed as wontfix / exception

**Update discipline:** When fixing an item, check the box and keep the line. Periodic prune: delete done items older than 60 days. Keep wontfix items forever — they're the record of decisions made.

---

## Audit script patches

Track separately because these are script changes, not tool changes. Script patches often unblock correct enforcement across many files at once, so they deserve their own backlog.

- [x] `audit_v2-3-2.py` PF-15 dot-nested required paths (`!form.field.trim()`) — regex captured only root identifier, missed nested — **patched**
- [x] `audit_v2-3-2.py` PF-15 single-submit-dis assumption — `re.search` found only first `disabled={}`, multi-mode tools had 10+ unchecked — **patched**
- [x] `audit_v2-3-2.py` PF-16 regex matches only literal `handleReset` — misses tools using `reset`, `handleClear`, `handleNew`, etc. Discovered in LeaseTrapDetector where `reset` function escaped detection entirely. **Re-confirmed in NameAudit (Session ~110) — two `<button onClick={reset}>` instances in results blocks slipped past the script entirely; only caught by manual read-through.** **Patched v1.8 (Session 2026-05-02)** — broadened to `(?:handleReset|handleClear|handleNew|resetForm|resetAll|startOver|clearAll|reset)` alternation, applied consistently across the count check, the inside-results-block check, and the c.btnPrimary check.
- [x] `audit_v2-3-2.py` S1.1i false-positive on dot-notation substrings — `uc.explanation` substring-matched `c.explanation` and flagged a nonexistent key. **Patched v1.8** — added `\b` word boundary to the c.X regex on both S1.1i and S1.1k. Same fix applies to both checks since they share the regex shape.
- [x] `audit_v2-3-2.py` PF-2 ordering check — c block before linkStyle assumption. **Patched v1.8** — explicitly detects both positions; if reversed, appends a clear `PF-2: linkStyle declared before c block` violation. Also changed `jsx_area` to slice from AFTER the c-block end (not from linkStyle's position), so reversed order no longer cascades into spurious "hardcoded color in JSX" flags. Surfaced a real defect in TheGap on first run after the patch — original audit had missed it.
- [x] `audit_v2-3-2.py` accentTxt missing from S1.1k whitelist — `accentTxt` is a canonical PF-2 key used by 39 tools, but the whitelist omitted it, causing false-positive dead-key flags on tools that copied PF-2 verbatim without happening to reference accentTxt in JSX. Surfaced during the TheGap audit (Session 2026-05-02). **Patched v1.8.**
- [ ] `audit_v2-3-2.py` PF-15 dot-nested fallback line numbers — when path is dot-nested (e.g. `!form.field.trim()`), the script previously reported the disabled-expression line as a uniform line number for all violations in that file. NameAudit (Session ~110) collapsed three distinct PF-15 violations onto "line 1060". **Read-through 2026-05-02 found the current code already computes `_abs_line` per-path from each input's `<label>` position via the backward scan** — the bug pattern described above shouldn't reproduce against current code. **Action: needs verification with NameAudit** when next opened. If it reproduces, dig further; if not, close as fixed-without-record.
- [ ] **NEW: `audit_v2-3-2.py` PF-16 results-block detection misses render-helper pattern.** The check `_results_split = re.search(r'\{\s*(?<![!])results\s*&&\s*[(<]', content)` requires `(` or `<` immediately after `&&`. Tools using a render helper — `{results && renderResults()}` (the `(` belongs to the function call, not to a JSX group) — are not matched. Surfaced in TheGap audit (Session 2026-05-02): the original audit ran clean even though `<button onClick={handleReset}>` was inside `renderResults()`. The defect was caught only on manual structural read-through, after the PF-16 broaden patch made the regex strict enough to matter. **Fix:** alternation that ALSO accepts `\{results\s*&&\s*\w` (any identifier — covers render-helper calls and arrow functions). Catalog-wide sweep needed once script is patched: every tool using `{results && renderXxx()}` plus a reset button inside that helper.
- [ ] `audit_v2-3-2.py` PF-3 nested-card scope — *(reclassified)*: this is **net-new functionality**, not a patch to existing logic. The script currently has **no PF-3 check at all** — header structure is enforced manual-checklist-only. Reclassifying away from "patches" since the work is "add a new check," not "fix an existing check." Track as a script feature addition rather than a bugfix. NameAudit had 15+ nested `${c.card} rounded-xl shadow-lg` instances; without script enforcement these only surface via manual read-through. Likely catalog-wide aftermath of an earlier shadow-lg → shadow-sm sweep that only touched header cards.
- [ ] **NEW: `backend_audit_v1.py` does not exist yet** — section 7 backend audit is all manual greps. Highest-leverage tooling investment. Deterministic checks an automated script would catch in seconds: route count vs `rateLimit()` count, route count vs `withLanguage` call count, route count vs `${langDirective}` interpolation count, route count vs `} catch` count, route count vs `status(500)` count, route count vs `Return ONLY` count, dead-import scan from the destructure list, model-string mismatch scan. NameAudit backend (Session ~110) had zero rate limiting on 6 routes and missing langDirective on 1 route — both would have been first-pass catches. Estimated effort: 1 session to mirror `audit_v2-3-2.py`'s structure.

---

## Bucket 1 — Fix now (deferred only by scope of current session)

Empty right now. Items land here only when a session touches multiple tools and deferring one made sense for commit-grouping reasons. Keep this section short; long queues here signal the real bucket is Backlog.

---

## Bucket 2 — Backlog (real issues, defer only for scope reasons)

### ApologyCalibrator.js

- [ ] PF-15 secondary-button required fields missing asterisks — surfaced by patched audit script after its fixes landed. Three fields have `!variable.trim()` disabled guards but no `c.required` asterisk on their labels:
  - `auditInput.text` (Audit mode: "Add situation" button)
  - `repairForm.who` (Repairs mode: "Who" label)
  - `repairForm.what` (Repairs mode: "What happened" label)
- [x] `practiceInput` (Practice mode: chat-style send button) — **closed as exempt under new PF-15 EXEMPTION block** (chat-style sends, Session 2026-05-02 design call). See CONVENTIONS.md v1.4 PF-15 for rule text.
- [x] `note` (Repairs mode: inline follow-up quick-add) — **closed as exempt under new PF-15 EXEMPTION block** (inline quick-add lists, Session 2026-05-02 design call). See CONVENTIONS.md v1.4 PF-15.
- [ ] c-block name/value drift — keys `purpleBg` and `indigoBg` now contain `bg-cyan-*`/`border-cyan-*` values after the PF-12 sed sweep on banned colors. Callsites use these keys by name so a rename is invasive. Rename to `cyanBg` when the catalog-wide UX pass opens this file anyway.
- [ ] No scroll-to-results useEffect — 13 modes with long input forms; users likely scroll manually. Empirically validate during catalog-wide UX pass before adding (may be intentional given mode-switch dynamics).
- [ ] Deployment / cache issue: Bruce reported invisible submit button after my first typo fix. Second fix canonicalized all 11 submit buttons to exact PF-14 form. If still invisible after hard-refresh + Fastly cache clear, needs DevTools-level diagnosis of ToolPageWrapper / Railway build / Tailwind JIT.

### LeaseTrapDetector.js

- [x] PF-16 reset-button violation — two reset buttons inside results blocks (line 585 "← New", line 1158 "Analyze Another Lease"), none in header top-right. Audit missed this via the `handleReset`-only regex gap above. Fix path: rename `reset` → `handleReset`, delete both inline buttons, add one header-top-right button with visibility ternary. **Resolved in header-restructure pass — also fixed related missing-mode state-persistence bug in the reset function (previously cleared only analyze-mode state).**
- [x] Duplicate `/RentersDepositSaver` cross-ref — my S5.5 fix added pre-result reference; file already had post-result reference at line 1167. Delete line 1167 (keep pre-result, which has better-targeted copy). **Resolved — post-result line removed, pre-result kept.**
- [x] Cross-ref at line 1167 falls outside `{results && (...)}` guard — renders pre-result even though phrasing ("Moving out?") only makes sense post-result. Related to duplicate above; resolving that resolves this. **Resolved via same fix as the duplicate above.**

### NameAudit.js / name-audit.js (Session ~110)

**Frontend (NameAudit.js) — closed:**
- [x] Audit script: 9 violations → 0 (icon fallback × 7, banned colors × 3, keyboard ref pattern, broken xref, PF-15 asterisks × 3) — **resolved in same session.**
- [x] PF-16: two `<button onClick={reset}>` in results blocks (compare header line 1158, analyze tools row line 1246), none in persistent header. Audit script blind spot. **Resolved — removed both, added single canonical reset to persistent header top-right with ternary visibility per Clarification 4.**
- [x] PF-5 inline `<CopyBtn content={v.name} />` at line 1916 on Fix-This-Name variations. **Approved as PF-5 exception** (same precedent as ContextCollapse rewrite suggestions — each variation is a standalone copyable artifact).

**Frontend (NameAudit.js) — open:**
- [ ] PF-3 systemic: 15+ nested results-tree cards use `${c.card} rounded-xl shadow-lg` (no `border ${c.border}`, wrong shadow). Sweeping all to `shadow-sm` + adding borders would change the visual depth of the entire results render tree. Worth its own focused pass with a UX preview, not folded into structural audit. (Audit-script patch listed separately above.)
- [ ] PF-17 Try Example missing — multi-field tool, output quality depends on rich input, qualifies per PF-17 inclusion criteria. Suggest adding `EXAMPLES = { analyze: { name, context, industry, targetAudience }, compare: { names, context, industry } }` keyed by mode, with `loadExample` callback and "Try example" button next to submit.
- [ ] Hook order drift: a `useEffect` at line 101 (URL param handoff from NameStorm) sits before any top-level `useRef`. Pre-existing; audit doesn't catch. Cosmetic — the URL handoff works correctly. Reorder when the file next opens.
- [ ] PF-2 c-block additions: extra `chip` (function key) and `cyan` keys not in PF-2 verbatim. Both are harmless and serve real purposes (chip toggles for mode pills, cyan for cyan-themed result cards). Candidate exception worth documenting in PF-2 if function keys are broadly accepted.

**Backend (name-audit.js) — closed:**
- [x] S7.2: zero rate limiting on 6 routes. **Resolved — added `rateLimit()` to all 6 + import.**
- [x] S7.4: `/nameaudit/compare` missing `withLanguage`/`langDirective`. **Resolved — added langDirective declaration + prompt interpolation.**
- [x] S7.3: `/nameaudit/compare` not validating `context`. **Resolved — added `!context?.trim()` 400 guard.**
- [x] S7.1: dead imports `cleanJsonResponse` and `anthropic`. **Resolved — removed.**
- [x] S7.3: 3 routes used loose `!name` guards (allowed whitespace-only). **Resolved — tightened to `!name?.trim()`.**
- [x] S7.3: compare prompt interpolated `names` array without trimming. **Resolved — added `trimmedNames` derivation + secondary count check after trim.**

**Backend (name-audit.js) — closed (continued):**
- [x] **Architectural deviation:** all 6 routes use `callClaudeWithRetry`. **Resolved Session 2026-05-02 (Bucket 3 design call):** wrapper sanctioned as an acceptable alternative to raw `anthropic.messages.create`; choice is per-route based on retry-semantics needs. NameAudit's 6 routes are now compliant under the new S7.4 rule. See tool-audit-checklist-v4_39.md v1.3 S7.4 wrapper-sanction note.

### BatchFlow.js

- [ ] `dumpText` field has no `<label>` tag — uses `<p>` heading "📋 Paste your task list" instead. PF-15 asterisk check has nothing to attach to. Add proper `<label>` element with `c.required` asterisk.

### Cross-file / catalog-wide

- [x] **Catalog-wide rate-limiting audit** — **CLOSED Session 2026-05-02.** Sweep executed via `add_rate_limit.py` patcher. Of 123 backend route files: 100 needed middleware injection (patched mechanically), 22 were already compliant (mix of bare `rateLimit()` and `rateLimit(DEFAULT_LIMITS)` forms — both sanctioned), 1 correctly out of scope (`index.js` auto-discovery router with no routes). **Final coverage: 122/122 routes rate-limit-protected.** Verified with strict grep `router.(post|get)\\(.*` that doesn't contain `rateLimit` — returned empty. Patcher itself revealed and resolved a literal-string detection bug (regex now matches both call forms). Patcher script archived at `add_rate_limit.py` for future use if new routes drift.
- [ ] **Catalog-wide `onClick={reset}` sweep** — until the audit script is patched (see "Audit script patches" above), manual grep finds all instances: `grep -rn "onClick={reset}" src/tools/ | awk -F: '{print $1}' | sort -u`. Each candidate file needs verification that the `reset` button is in the canonical PF-16 header position, not duplicated in results blocks.
- [ ] Orphan "You might also like" footer pattern — found and removed in ArgumentSimulator, AnalogyEngine, AlternatePath. Pattern uses relative kebab-case hrefs (`href={slug}`) generating SEO ghost URLs and sometimes pointing to nonexistent tools (AlternatePath pointed to `/what-if-machine` which doesn't exist). Sweep all remaining tools for this pattern — grep: `grep -rn "You might also like" src/tools/` then inspect each hit.
- [ ] `🕐` clock-icon loading swap — found and fixed in BatchFlow (11 callsites via `<Spin>` helper). Likely propagated by the same Python-replace scripts that caused `btnPrimaryPrimary` typos. Sweep: `grep -rn "'🕐'" src/tools/` — each hit is a suspected loading-state bug.
- [ ] Scroll-to-results absence — observed in ApologyCalibrator; suspected across the catalog. Part of catalog-wide UX pass once it starts.
- [ ] Multi-mode tools — header placement relative to mode toggle. Discovered in LeaseTrapDetector: the mode toggle (Find Problems / Find What's Missing) rendered at the component root ABOVE the header card, making the title/emoji/tagline not the first thing visible. The fix is a unified header card at the top containing title + tagline + reset + mode tabs (same pattern as ApologyCalibrator's tab-nav header). Sweep all multi-mode tools — grep: `grep -rnE "setLtdMode|setMode|setView|setTab" src/tools/` and inspect the render root of each hit to verify header comes first. Candidate new convention: **PF-3 addendum — for multi-mode tools, mode tabs belong INSIDE the header card below the title/tagline `<border-b>` divider, never at the component root.**

---

## Bucket 3 — Candidate exceptions (design decision required)

These items are coded against current convention but may represent legitimate exceptions worth documenting. Resolution is a design call, not a code change, until decided.

- [x] ApologyCalibrator `practiceInput` missing asterisk — **chat-style send button**. **Closed Session 2026-05-02 — exemption granted** and documented in CONVENTIONS.md v1.4 PF-15. ApologyCalibrator practiceInput is the reference case.
- [x] ApologyCalibrator `note` missing asterisk — **inline quick-add input** in a repairs list. **Closed Session 2026-05-02 — exemption granted** under same PF-15 EXEMPTION block. ApologyCalibrator note is the second reference case.
- [x] BatchFlow `dumpText` missing label — **closed Session 2026-05-02 — exemption denied; fix path confirmed.** Convert `<p>` heading to a `<label>` element with `c.required` asterisk; the a11y win for screen-reader users justifies the one-element edit. Implementation tracked under Bucket 2 BatchFlow.js (open until file is uploaded and patched).
- [x] **`callClaudeWithRetry` vs `anthropic.messages.create`** — **closed Session 2026-05-02 — wrapper sanctioned** as acceptable production alternative. Both patterns documented in tool-audit-checklist-v4_39.md v1.3 S7.4 with use-when guidance (wrapper preferred for user-facing endpoints under load; raw create acceptable for fast single-shot calls or when behavior the wrapper doesn't expose is needed). NameAudit's 6 routes now compliant.
- [-] PF-14 single-mode vs multi-mode — already resolved (multi-mode exception added in CONVENTIONS.md with ApologyCalibrator as reference case). Closed as exception — documented in CONVENTIONS.md PF-14.

---

## Deferred observations (not yet actionable)

Things worth noting but not yet worth an action. Keep the note so they don't have to be re-derived next time.

- **Inner-scope `c` shadowing (AnalogyEngine pattern):** A function defined `const c = example?.concept || concept` inside a handler, shadowing the outer color-block `c`. Audit script falsely flagged `c.trim` as an undefined key because the scanner couldn't distinguish scopes. Rewrite resolved it by renaming inner variable. Candidate CONVENTIONS.md addition for a future PF entry: "Never shadow the `c` identifier inside component scope." Light rule, low priority.
- **Per-mode topical submit icons** already documented as PF-14 multi-mode exception with ApologyCalibrator reference case. Watch for new tools that develop sub-modes organically; the exception applies automatically.
- **Python-replace typo aftermath** (`btnPrimaryPrimary`, `btnPrimarySecondaryondary`, `cardAltBg`, `btnPrimaryDanger`, `textMuteded`) — these were injected by a script run that applied a find/replace twice in succession. Pattern is well-known now; PF-12 catches them reliably. Track any new doubling patterns that emerge.

---

## Closed / done

(Items move here when checked off and retained as record. Periodic prune: delete entries older than 60 days, keep decision records forever.)

### TheGap.js (Session 2026-05-02)
- [x] Original audit pass: 10 script violations + 2 manual catches fixed (icon fallbacks, dead `c.infoTxt`, INPUT/SELECT keyboard guard, two malformed cross-refs, broken `BrainDumpStructurer` tool ID, missing `c.required` + asterisk, hook order, `disabled:opacity-40`, semantic `warningBox`-as-red restored to amber + error display switched to `c.danger`, missing `c.textMuteded` / `c.label` aliases).
- [x] **Second pass triggered by audit-script patches landing** (PF-2 ordering check + PF-16 broaden): script surfaced `linkStyle` declared before c block — original audit missed it because the legacy script didn't enforce ordering.
- [x] **Third pass triggered by manual structural read-through after the second pass**: PF-3 violation (header at component root, not inside the input card) and PF-16 violation (reset button inside `renderResults()`, not in persistent header) both surfaced. Neither was caught by the script (PF-3 has no automated check; PF-16 results-block detection misses the render-helper pattern). Both fixed via PF-3 replace-mode pattern: header inside unified input card during input phase, separate results-phase header card with reset button using ternary `{results ? ... : null}` to avoid breaking S5.5 region split.
- **Lesson logged in audit discipline section below.**

---

## Audit discipline — lessons logged

These are notes-to-future-self about audit failures observed in past sessions. Each is a check that should be added to the standard audit pass, not just lived through and forgotten.

- **PF-3 is manual-only — check it explicitly.** The audit script has no PF-3 enforcement. Header card structure (header inside unified input card with `border-b border-zinc-500` divider; replace-mode tools get separate input-state and results-state header cards with ternary on the results-state header) must be verified by reading the return statement, not just by checking script output. The TheGap audit (2026-05-02) shipped clean before this rule was applied; PF-3 violation was caught only on a third structural read-through after PF-16 broadening surfaced a different defect in the same region.
- **Replace-mode pattern check — verify both phases.** For tools using `{!results && renderInput()}` / `{results && renderResults()}`, both phases need their own header. Input phase: header inside the input card. Results phase: separate persistent header card with reset, using ternary `{results ? (...) : null}` (the `&&` form breaks the audit script's S5.5 region split per CONVENTIONS.md PF-3 note).
- **Render-helper pattern + reset placement.** The audit script's PF-16 results-block check (`{results && (` regex) does not match `{results && renderXxx()}`. If the tool uses a render helper, manually grep for `<button onClick={...handleReset|reset|handleClear|handleNew...}>` inside that helper and verify it's not there. Reset belongs in the persistent header card.
- **PF-2 ordering — c block before linkStyle.** Script-enforced as of v1.8 (Session 2026-05-02). Pre-v1.8 violations may exist catalog-wide; a sweep is warranted.
- **Manual sweep after script-clean.** Script-clean is necessary, not sufficient. Always do a structural read-through of the return statement and primary render helpers before declaring an audit complete. The standard manual checks: PF-3 header card structure, render-helper reset placement, cross-ref placement (pre-result inline below submit / post-result inside results card), no nested `c.card` with `shadow-lg`.
