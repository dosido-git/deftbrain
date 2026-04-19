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

## During Every Audit

Run every checklist item. Do not decide in advance that a section "looks fine" — every scan must be executed. When the checklist says "run this grep," run it. When it says "read the file," read it.

Apply intelligence and discernment throughout:
- If a pattern looks wrong even though it passes the mechanical scan, investigate it
- If something is inconsistent with how other tools in the codebase work, flag it
- If a fix creates a new problem, catch it before output — not after deployment
- Cross-reference every result against the established visual standard, not just the rules on paper

---

## The Post-Fix Read-Through

After every edit session — audits, new builds, hotfixes — read the entire output file from line 1 to the last line before presenting it. No skipping. No skimming. Ask of every block:
- Does this render what I think it renders?
- Does this close what it opened?
- Does every className contain what I think it contains?
- Is this consistent with how every other tool in the codebase looks?

A file that passes every grep scan but has not been read is not ready to ship.

---

## Specific Patterns That Must Never Drift

These have been violated and corrected. They must not require correction again:

**Header position:** The `<h2>` title and tagline are always the first visible element inside the gradient frame — on every tab, in every state (input, results, loading, settings). They never disappear when the user switches tabs or when results load. They live in the persistent outer card header, not inside a render helper.

**Header divider:** `border-b border-zinc-500` is always on an inner div that sits inside a padded wrapper (`px-5 pt-5`). It is never placed on the same div that carries horizontal padding. The divider must be visually inset from the card edges — not edge-to-edge.

**Header structure:** One card. Header at top with `border-b border-zinc-500` divider. Inputs below. Never two separate cards. Never a header-only card.

**c block:** Copied verbatim from CONVENTIONS.md PF-2. Never reconstructed from memory. `linkStyle` is a standalone `const` after the c block, never inside it.

**Hook order:** useClaudeAPI + useTheme → c block + linkStyle → useState → useRef → usePersistentState → handlers → buildFullText → useRegisterActions → scroll useEffect → keyboard useEffect → cleanup useEffect → render helpers → return.

**Submit button:** `tool?.icon` in both loading AND idle branches. Never a hardcoded emoji in the idle branch.

**Cross-refs:** Mandatory — at least one link, sourced from `cross-reference-map.md`. Zero cross-refs is a violation. **Max 3 links per cluster** (where "cluster" = cross-refs appearing within ~5 lines of each other in the JSX — a single footer, sidebar, or inline paragraph). Preferred: 1–2 per cluster. Cross-refs can appear on multiple pages/branches of the same tool; each page's cluster is counted independently. Emoji before name. `/PascalCase` hrefs. No `target="_blank"`. Pre-result ref visible before submit. Post-result ref inside results block.

---

## The Standard You Are Held To

Consistency and completeness. Every tool should look like it was built by the same person with the same standards on the same day. When a user opens any DeftBrain tool, the header is in the same place, the divider looks the same, the spacing feels the same, the patterns are the same. That consistency is not an aesthetic preference — it is the product.

You have the intelligence to catch problems before they are presented. Use it. The goal is zero correction passes, not fast first drafts.
