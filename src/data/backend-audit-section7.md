# Tool Audit Checklist — Section 7: Backend Route Audit
### Addendum to tool-audit-checklist-v4_36.md
### Added: Session 4 (April 2026)

Run this checklist on every backend route file (`routes/kebab-case.js`) in the same audit pass as its frontend component. Every 🔍 item with a grep scan must have that scan run before the item can be marked ✅.

**Note:** Routes are auto-discovered by `routes/index.js` — no manual registration in `server.js` is required. Placing the file in the routes directory is sufficient.

---

## SECTION 7 — BACKEND ROUTE AUDIT

### S7.1 · Imports

**Scan:**
```bash
grep -n "^const\|^require" backend.js | head -10
```

- [ ] 🔍 **`cleanJsonResponse` imported from `../lib/claude`** — every route that calls the API must parse through this function. Raw `JSON.parse(msg.content...)` without `cleanJsonResponse` will crash on markdown-fenced responses.
  ```bash
  grep -n "cleanJsonResponse" backend.js
  # Must return at least one result
  ```

- [ ] 🔍 **`withLanguage` imported from `../lib/claude`** — required for locale support on every route.
  ```bash
  grep -n "withLanguage" backend.js
  # Must return at least one result
  ```

- [ ] 🔍 **No unused destructured imports** — destructuring names that are never referenced in the file body are dead weight loaded on every request.
  ```bash
  # For each name in the require() destructure, check it appears at least twice
  # (once in the import, once in use). Example:
  grep -c "DEFAULT_LIMITS\|DIVERSION_LIMITS" backend.js
  # If count = 1 for any name → it appears only in the import line → remove it
  ```
  > ⚠️ **BUG PATTERN — Unused rateLimiter exports (discovered DecisionCoach audit, Session 4)**
  > `DEFAULT_LIMITS` and `DIVERSION_LIMITS` were destructured from `require('../lib/rateLimiter')` but never referenced in the file. They're available if needed for custom rate limit configs, but importing them without using them adds noise and confusion. **Rule:** every destructured name must appear at least once outside the import line. Remove unused ones.

---

### S7.2 · Route Registration

- [ ] 🔍 **`module.exports = router` at end of file** — auto-discovery requires this. A missing export silently drops all routes.
  ```bash
  tail -3 backend.js
  # Must show: module.exports = router;
  ```

- [ ] 🔍 **All routes use `rateLimit()`** — no route may be unprotected.
  ```bash
  grep -c "router.post\|router.get" backend.js
  grep -c "rateLimit()" backend.js
  # Both counts must match
  ```

---

### S7.3 · Input Validation

Every route that uses `req.body` fields in a prompt template must guard against missing/empty values **before** building the prompt string. An unguarded field reaches the prompt as `undefined`, which the model receives literally.

- [ ] 🔍 **Required fields validated with early return** — any field whose absence would produce a broken or nonsensical prompt must be checked.
  ```bash
  # For each router.post, read the req.body destructure and the prompt template.
  # Any field that appears unguarded in ${field} interpolation is a violation.
  grep -n "router.post" backend.js
  # Then for each route, check: does a guard exist for every required field?
  ```

  **Correct pattern:**
  ```js
  router.post('/tool-name', rateLimit(), async (req, res) => {
    try {
      const { requiredField, optionalField, locale } = req.body;
      const lang = withLanguage(locale);
      if (!requiredField?.trim()) return res.status(400).json({ error: 'Describe X' });
      // now safe to build prompt
    }
  });
  ```

  **Rules:**
  | Field type | Required guard | Example |
  |------------|---------------|---------|
  | Primary subject (the "what needs deciding" / "what to analyze") | Always | `if (!field?.trim()) return 400` |
  | Secondary required fields (gut instinct, min count, etc.) | Always | `if (!field?.trim()) return 400` |
  | Outcome/mode enums | Always if used in conditionals | `if (!outcome) return 400` |
  | Arrays with minimum count | Always | `if (!arr?.length \|\| arr.length < N) return 400` |
  | Optional context/preferences | Never — omit silently | Conditional in prompt: `${field ? \`CONTEXT: ${field}\` : ''}` |
  | Locale | Never — `withLanguage` handles null | Pass directly to `withLanguage(locale)` |

  > ⚠️ **BUG PATTERN — Unvalidated outcome enum (discovered DecisionCoach /followup, Session 4)**
  > The `/followup` route used `outcome` in three separate `${outcome === 'x' ? ... : ''}` conditional blocks in the prompt. When `outcome` was missing, all three blocks silently resolved to `''`, producing a prompt with an empty `OUTCOME: undefined` line and no guidance text. The model responded with a confused generic reply. **Fix:** validate `!outcome` before building the prompt.

  > ⚠️ **BUG PATTERN — Missing secondary validation (discovered DecisionCoach /devils-advocate, Session 4)**
  > The route validated `!gutInstinct?.trim()` but not `!decisionNeeded?.trim()`. Both fields are required for the prompt to make sense. The frontend disables the button when either is empty, but frontend guards are not a substitute for backend validation — direct API calls or client bugs can bypass them. **Rule:** validate every field that appears unguarded in the prompt, regardless of what the frontend enforces.

---

### S7.4 · API Call Pattern

- [ ] 🔍 **Model string is `claude-sonnet-4-20250514` on all routes**
  ```bash
  grep -n "model:" backend.js
  # Every result must show: model: 'claude-sonnet-4-20250514'
  # Zero results = violation (model not specified, uses API default)
  ```

- [ ] 🔍 **`cleanJsonResponse` used in every JSON parse**
  ```bash
  grep -n "JSON.parse" backend.js
  # Every result must show cleanJsonResponse wrapping the argument:
  # JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || ''))
  # A bare JSON.parse(...) without cleanJsonResponse is a violation
  ```

- [ ] 🔍 **`withLanguage` called and appended to every prompt**
  ```bash
  grep -n "const lang = withLanguage" backend.js | wc -l
  grep -n "router.post" backend.js | wc -l
  # Counts must match — every route must call withLanguage
  grep -n "\${lang}" backend.js | wc -l
  # Must match route count — lang must be appended to every prompt
  ```

- [ ] 🔍 **`max_tokens` is appropriate for each endpoint** — not a single fixed value. Token budget should match the expected output size.
  | Output type | Suggested range |
  |-------------|----------------|
  | Single-field quick answers | 400–800 |
  | Standard single-mode results | 1000–1500 |
  | Multi-section analysis (pros/cons, group) | 1500–2000 |
  | Deep analysis (DNA, patterns) | 1800–2500 |

---

### S7.5 · Cite Tag Stripping

Required **only** when the route uses `tools: [{ type: 'web_search_20250305' }]` in the API call. When web search is active, Claude wraps phrases in `<cite index="...">` tags inside JSON string values.

- [ ] 🔍 **Web search routes have cite tag stripper after `JSON.parse`**
  ```bash
  grep -n "web_search" backend.js
  # If this returns results, also check:
  grep -n "stripCites\|cite" backend.js
  # Must return a stripping function — if absent, cite tags will appear in frontend output
  ```

  **Required pattern when using web search:**
  ```js
  function stripCites(val) {
    if (typeof val === 'string') return val.replace(/<cite[^>]*>|<\/cite>/g, '');
    if (Array.isArray(val)) return val.map(stripCites);
    if (val && typeof val === 'object') {
      return Object.fromEntries(Object.entries(val).map(([k, v]) => [k, stripCites(v)]));
    }
    return val;
  }
  // After JSON.parse:
  const parsed = JSON.parse(cleanJsonResponse(text));
  res.json(stripCites(parsed));
  ```

  > **Routes without web search tools:** no cite stripping needed. The `tools` parameter is absent from the `anthropic.messages.create` call entirely.

---

### S7.6 · Prompt Quality

These are judgment-required items — no mechanical scan. Read each prompt against the output schema.

- [ ] 🔍 **Prompt output schema matches frontend field access** — every field the frontend accesses via `results.field_name?.subfield` must be declared in the prompt's `OUTPUT (JSON only)` block. Mismatches produce silent `undefined` renders with no error.
  ```bash
  # Cross-reference: grep the frontend for result field accesses
  grep -n "results\.\|result\.\|res\." ComponentName.js | grep -v "useState\|setResults\|usePersistentState"
  # Then verify each accessed field appears in the backend prompt's JSON schema
  ```

- [ ] 🔍 **No template comment anti-pattern** — `${/* comment */''}` inside template literals is valid JS but obscures intent and can produce unexpected whitespace in prompts.
  ```bash
  grep -n '/\*.*\*/' backend.js | grep -v "^//"
  # Must return zero results inside template literals
  # Fix: move comment to its own line above the template expression
  ```

- [ ] 🔍 **Optional fields use conditional interpolation** — never interpolate optional fields directly; always guard them.
  ```bash
  # Scan for unguarded optional fields in prompt (judgment call — read each prompt)
  # Correct: ${field ? `LABEL: ${field}` : ''}
  # Wrong:   LABEL: ${field}   ← renders as "LABEL: undefined" when absent
  ```

- [ ] 🔍 **`CRITICAL: Return ONLY valid JSON.` present on every prompt** — models occasionally wrap JSON in markdown fences without this instruction.
  ```bash
  grep -c "Return ONLY valid JSON" backend.js
  grep -c "router.post" backend.js
  # Counts must match
  ```

---

### S7.7 · Error Handling

- [ ] 🔍 **All routes wrapped in `try/catch`** — an uncaught async error crashes the process.
  ```bash
  grep -c "} catch" backend.js
  grep -c "router.post" backend.js
  # Counts must match
  ```

- [ ] 🔍 **Error responses use `res.status(500).json({ error: ... })`** — not `res.send()` or `throw`.
  ```bash
  grep -n "catch" backend.js -A2
  # Each catch block must call res.status(5xx).json(...)
  ```

- [ ] 🔍 **Validation errors use `res.status(400)`** — distinguish client errors (400) from server errors (500).
  ```bash
  grep -n "status(400)" backend.js
  # Must return at least one result if any validation exists
  ```

---

*Section 7 added v4.37 — Backend Route Audit (Session 4, April 2026)*
*Patterns sourced from DecisionCoach audit: unused imports, missing input validation, template comment anti-patterns, cite tag stripping.*
