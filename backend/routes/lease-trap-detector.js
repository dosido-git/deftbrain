const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — quoted clause text or dialogue must be written plainly with no inner quote marks, or it breaks the JSON.';

// Truncation is a real reliability bug (schema/budget mismatch); anything
// else surviving all retries is a genuine failure. Both get a specific,
// helpful message rather than a bare 500.
function handleAiError(res, error, longDocMessage) {
  console.error('[LeaseTrapDetector] Error:', error);
  if (/truncated at max_tokens/.test(error.message || '')) {
    return res.status(500).json({ error: longDocMessage || 'This request produced too much detail to complete in one pass. Try trimming the input.' });
  }
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
}

// ═══════════════════════════════════════════════════════════════
// MAIN ANALYSIS ENDPOINT
// ═══════════════════════════════════════════════════════════════

// Grounded facts PRE-PASS (BuyWise pattern): one small web-search call
// verifies the volatile jurisdiction figures so the big main call can stay
// ungrounded. A single search+7000-token generation held the connection open
// past the API limit ("Connection error"); split this way grounding costs a
// bounded ~7-20s. Best-effort — returns '' on any failure and the main
// prompt's hedge rule takes over.
async function groundTenantLawFacts({ location, userLanguage }) {
  try {
    const facts = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1500,
      tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }],
      system: withLanguage('You verify current landlord-tenant law figures with web search. Prefer official sources (legislature, AG, courts). Return ONLY valid JSON.', userLanguage),
      messages: [{ role: 'user', content: `Verify with web_search the CURRENT rules (as of today) for residential tenants in: ${location || "the tenant's stated location"}.

Cover ONLY: (1) security deposit maximum, (2) deposit return deadline, (3) late fee limits, (4) landlord entry notice requirement, (5) repair-and-deduct rights waivability. Skip any you cannot verify.

Return ONLY valid JSON:
{ "jurisdiction": "State/region these rules apply to", "verified": [{ "topic": "deposit_cap | return_deadline | late_fees | entry_notice | repair_rights", "rule": "The current rule in one sentence with the numeric limit", "statute": "Statute name/number", "effective": "Effective date or 'long-standing'", "source": "Domain of the source you verified against" }] }` }]
    }, { label: 'lease-trap-detector-facts' });
    const cleanFacts = stripCites(facts);
    if (Array.isArray(cleanFacts.verified) && cleanFacts.verified.length) {
      return `\n\nVERIFIED CURRENT TENANT LAW (web-checked today for ${cleanFacts.jurisdiction || location}):\n` +
        cleanFacts.verified.map(f => `- [${f.topic}] ${f.rule} (${f.statute}, ${f.effective}; source: ${f.source})`).join('\n');
    }
  } catch (factsErr) {
    console.error('[lease-trap-detector-facts] pre-pass failed, proceeding unverified:', factsErr.message);
  }
  return '';
}

router.post('/lease-trap-detector', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { leaseText, pdfBase64, location, leaseType, concerns, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!location || !location.trim()) {
      return res.status(400).json({ error: 'Location is required' });
    }
    if (!leaseType) {
      return res.status(400).json({ error: 'Lease type is required' });
    }
    if (!leaseText && !pdfBase64) {
      return res.status(400).json({ error: 'Please provide lease text or upload a PDF' });
    }

    const contentBlocks = [];

    if (pdfBase64) {
      const commaIndex = pdfBase64.indexOf(',');
      const rawBase64 = commaIndex !== -1 ? pdfBase64.substring(commaIndex + 1) : pdfBase64;

      contentBlocks.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: rawBase64 }
      });
      contentBlocks.push({
        type: 'text',
        text: 'The document above is a rental lease agreement PDF. You MUST read the entire document carefully and analyze every clause.'
      });
    }

    const systemPrompt = 'You are an expert tenant rights attorney with deep knowledge of state and local landlord-tenant law.';

    const prompt = `You are analyzing a rental lease agreement.

LEASE TYPE: ${leaseType}
LOCATION: ${location}
${concerns ? `TENANT CONCERNS: ${concerns}` : ''}

${leaseText ? `LEASE TEXT:\n${leaseText}` : 'The lease document was provided as a PDF above. Analyze its full contents.'}

═══════════════════════════════════════════
ANALYSIS REQUIREMENTS
═══════════════════════════════════════════

OUTPUT LIMITS (CRITICAL — the response MUST be complete, valid JSON that closes):
- Report only the MOST IMPORTANT items in each array, never an exhaustive list. Hard caps: red_flags ≤ 5, yellow_flags ≤ 4, green_flags ≤ 3, unenforceable_clauses ≤ 4, missing_protections ≤ 5, unusual_fees ≤ 4, resources ≤ 3, monthly_fees_beyond_rent ≤ 4, financial_red_flags ≤ 3, issues_found ≤ 3, key_points ≤ 4, stand_firm_on ≤ 3, if_they_say_scripts ≤ 2, questions_to_ask ≤ 2 per flag.
- Keep EVERY string field to a single sentence (negotiation_script and opening_email: at most 2-3 short sentences). Never restate the same concern across fields or arrays. A focused, fully-closed response beats a long truncated one.

LEGAL RESEARCH REQUIREMENTS:
- VERIFIED CURRENT LAW: when a VERIFIED CURRENT TENANT LAW block is present below, those figures were web-checked TODAY and OVERRIDE your training knowledge — use them verbatim and cite them as verified. For any volatile figure NOT covered by the block, hedge explicitly and tell the tenant to verify the current rule; never state a remembered number as a hard limit.
- Statute figures change: when you cite a numeric legal limit (deposit caps, notice periods, fee ceilings), state the statute AND its effective date if you know it, and flag any rule you know changed since ~2023 (e.g. California's AB 12 cut the residential deposit cap to ONE month's rent effective 2024-07-01). If unsure whether a figure is current, say the tenant should verify the current cap rather than stating an old number as a hard limit.
- Reference SPECIFIC statutes and code sections for ${location} (e.g., "Cal. Civ. Code § 1950.5" or "NYC Admin Code § 26-511")
- ONLY cite a statute number or code section when you are confident it is accurate for ${location}. If you are not certain of the exact citation, describe the legal principle and label it (e.g., "commonly cited as ..." or "verify the exact statute locally") rather than inventing a precise-looking section number. A confident principle with no number beats a fabricated citation.
- Cite the exact law that makes a clause illegal or unenforceable
- Note jurisdiction-specific timelines (notice periods, cure periods, eviction timelines)
- Identify whether ${location} is in a landlord-favorable or tenant-favorable jurisdiction
- Note any rent control or rent stabilization that may apply

SECURITY DEPOSIT ANALYSIS:
- State-specific maximum deposit amount, required return timeline, and whether interest/walkthrough are required for ${location}
- Compare the lease's deposit terms against these legal requirements; put any problems (including deduction concerns) in issues_found

ENFORCEABILITY ASSESSMENT:
- Identify which clauses are UNENFORCEABLE in ${location} regardless of what the lease says
- Flag clauses where "what the lease says" differs from "what the law actually allows"
- Note any clauses that would be void as a matter of public policy
- Identify any required disclosures that may be missing (lead paint, mold, bed bugs, etc.)

FINANCIAL EXPOSURE:
- Calculate total potential hidden/unusual costs over 12 months
- Add up all fees, penalties, and charges beyond base rent
- Estimate worst-case financial exposure (all penalties triggered)
- Compare fee amounts to local market norms

NEGOTIATION INTELLIGENCE:
- Classify each flag as: "likely negotiable," "possible with leverage," or "non-negotiable standard"
- Provide specific "if they say X, respond with Y" scripts and the points to stand firm on

RESOURCES FOR ${location}:
- The most useful tenant organizations (tenant union / legal aid / housing authority / mediation)
- Do NOT invent specific phone numbers or URLs. Name the type of organization and how to find it (e.g., "search '[city] tenant rights organization'") unless you are confident a specific detail is current and correct.

═══════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════

Return ONLY valid JSON (no markdown, no preamble):

{
  "overall_assessment": {
    "risk_level": "high | medium | low",
    "major_concerns_count": number,
    "recommendation": "brief overall recommendation — one sentence",
    "jurisdiction_type": "tenant-favorable | landlord-favorable | neutral",
    "rent_control_applicable": true/false,
    "rent_control_details": "details if applicable, null otherwise — one sentence"
  },
  "financial_summary": {
    "monthly_rent": "base rent amount from lease — one sentence",
    "security_deposit": "deposit amount — one sentence",
    "total_move_in_cost": "all upfront costs combined (number)",
    "monthly_fees_beyond_rent": [
      { "fee": "fee name — one sentence", "amount": "fee amount in the user's local currency" }
    ],
    "annual_extra_costs": "estimated total fees/charges beyond rent over 12 months — one sentence",
    "worst_case_penalties": "total exposure if all penalties triggered (late fees, early termination, etc.) — one sentence",
    "financial_red_flags": ["brief financial concerns"]
  },
  "security_deposit_analysis": {
    "lease_deposit_amount": "what the lease charges (number)",
    "legal_maximum": "maximum allowed by law in ${location} — one sentence",
    "is_over_limit": true/false,
    "interest_required": true/false,
    "return_timeline_days": number,
    "return_timeline_law": "specific statute — one sentence",
    "walkthrough_required": true/false,
    "issues_found": ["deposit-related problems in this lease, including deduction concerns"]
  },
  "red_flags": [
    {
      "lease_reference": "Section/paragraph/page where this clause appears — one sentence",
      "clause_text": "exact clause from the lease — one sentence",
      "concern": "the problem and why it hurts the tenant — one sentence",
      "legal_status": "illegal / unenforceable / exploitative — one sentence",
      "specific_law": "exact statute or code section — one sentence",
      "your_rights": "what the law actually allows and the tenant's rights — one sentence",
      "negotiability": "likely negotiable / possible with leverage / non-negotiable standard — one sentence",
      "negotiation_script": "specific language to use when pushing back — 2 short sentences"
    }
  ],
  "yellow_flags": [
    {
      "lease_reference": "Section/paragraph/page reference — one sentence",
      "clause_text": "clause text — one sentence",
      "concern": "the issue and its potential risk — one sentence",
      "questions_to_ask": ["specific questions to ask landlord"],
      "negotiability": "likely negotiable / possible with leverage / non-negotiable standard — one sentence"
    }
  ],
  "green_flags": [
    {
      "lease_reference": "Section/paragraph/page reference — one sentence",
      "clause_text": "good clause from the lease — one sentence",
      "why_good": "why this protects the tenant — one sentence"
    }
  ],
  "unenforceable_clauses": [
    {
      "lease_reference": "Section/paragraph/page reference — one sentence",
      "clause_text": "clause that cannot be enforced — one sentence",
      "specific_law": "statute making it unenforceable — one sentence",
      "explanation": "why this is void/unenforceable — one sentence",
      "practical_advice": "what to do about it — one sentence"
    }
  ],
  "missing_protections": [
    {
      "protection": "what's missing from the lease — one sentence. Include missing legally-REQUIRED disclosures (lead paint, mold, bed bugs, etc.) as items here",
      "why_important": "why the tenant needs this — one sentence",
      "legal_requirement": "whether this is legally required (cite the law) or just recommended — one sentence",
      "how_to_add": "specific language to request adding — one sentence"
    }
  ],
  "unusual_fees": [
    {
      "fee_name": "name of the fee — 3-6 words",
      "amount": "fee amount in the user's local currency",
      "is_typical": true/false,
      "is_legal": "yes | no | depends on jurisdiction",
      "negotiation_strategy": "how to push back on this fee — one sentence"
    }
  ],
  "negotiation_strategy": {
    "opening_email": "email/letter opening to send to landlord — 2-3 short sentences",
    "key_points": ["prioritized list of negotiation points"],
    "stand_firm_on": ["non-negotiable items"],
    "if_they_say_scripts": [
      {
        "landlord_says": "common landlord pushback — one sentence",
        "you_respond": "effective response — one sentence"
      }
    ]
  },
  "resources": [
    {
      "resource": "organization name or type — one sentence",
      "type": "tenant union / legal aid / housing authority / mediation / emergency housing — one sentence",
      "why_useful": "what they can help with and how to find them — one sentence"
    }
  ]
}

CRITICAL RULES:
- Every flag MUST include a lease_reference citing the section, paragraph, page, or clause number
- Cite SPECIFIC laws and statutes for ${location}
- Every red flag MUST include the specific law that applies
- Security deposit analysis MUST reference the exact state statute
- Financial summary MUST estimate real amounts in the user's local currency where possible
- Be comprehensive but honest — don't flag standard/acceptable clauses
- Resources should be REAL organizations that serve ${location}
- ${NO_QUOTE_RULE}
- Return ONLY valid JSON.`;

    contentBlocks.push({ type: 'text', text: prompt });

    const verifiedLawBlock = await groundTenantLawFacts({ location, userLanguage });
    if (verifiedLawBlock) {
      const li = contentBlocks.length - 1;
      contentBlocks[li] = { type: 'text', text: contentBlocks[li].text + verifiedLawBlock };
    }

    let parsed;
    try {
      parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 7000,
        // contentBlocks is an array (PDF document block + text block). withLanguage does
        // string interpolation, which would stringify the array and destroy the PDF for
        // non-English users. The output-language directive already lives in `system` above.
        system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: contentBlocks }],
      }, { label: 'lease-trap-detector' });
    } catch (err) {
      return handleAiError(res, err, 'This lease is too long to analyze in one pass. Try pasting the sections you care about most.');
    }

    if (!parsed.overall_assessment) {
      return res.status(500).json({ error: 'Could not analyze your lease. Please try again.' });
    }
    res.json(stripCites(parsed));

  } catch (error) {
    console.error('[LeaseTrapDetector] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// FOLLOW-UP Q&A — ask about a specific clause or finding
// ═══════════════════════════════════════════════════════════════

router.post('/lease-trap-detector/followup', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { question, analysisContext, location, leaseType, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ error: 'Please ask a question' });
    }

    // Build a compressed context from the analysis
    const contextLines = [];
    if (analysisContext?.overall_assessment) {
      contextLines.push(`Risk: ${analysisContext.overall_assessment.risk_level}, Jurisdiction: ${analysisContext.overall_assessment.jurisdiction_type}`);
    }
    if (analysisContext?.red_flags?.length) {
      contextLines.push(`Red flags: ${analysisContext.red_flags.map(f => `${f.lease_reference}: ${f.concern} (${f.specific_law})`).join('; ')}`);
    }
    if (analysisContext?.yellow_flags?.length) {
      contextLines.push(`Yellow flags: ${analysisContext.yellow_flags.map(f => `${f.lease_reference}: ${f.concern}`).join('; ')}`);
    }
    if (analysisContext?.unenforceable_clauses?.length) {
      contextLines.push(`Unenforceable: ${analysisContext.unenforceable_clauses.map(c => `${c.lease_reference}: ${c.specific_law}`).join('; ')}`);
    }
    if (analysisContext?.security_deposit_analysis) {
      const sd = analysisContext.security_deposit_analysis;
      contextLines.push(`Deposit: ${sd.lease_deposit_amount} (max: ${sd.legal_maximum}, over limit: ${sd.is_over_limit})`);
    }

    const systemPrompt = 'You are an expert tenant rights attorney.';

    const prompt = withLanguage(`You already analyzed a lease and the tenant has a follow-up question.

LOCATION: ${location || 'unknown'}
LEASE TYPE: ${leaseType || 'residential'}

PREVIOUS ANALYSIS SUMMARY:
${contextLines.join('\n')}

TENANT'S QUESTION:
"${question}"

Answer the question directly and specifically. Reference the exact statutes that apply in ${location || 'their jurisdiction'}. If the question is about a specific clause, explain:
1. What the clause means in practice
2. Whether it's enforceable
3. What happens if the landlord tries to enforce it
4. What the tenant should do

Keep the answer focused and actionable. Do NOT repeat the full analysis — just answer the question.

Return ONLY valid JSON:
{
  "answer": "Direct, detailed answer to the question — one sentence",
  "relevant_law": "Specific statute if applicable, null otherwise — one sentence",
  "practical_steps": ["Step 1", "Step 2"],
  "should_consult_lawyer": true/false,
  "why_lawyer": "Why a lawyer would help here (null if not needed) — one sentence"
}

Return ONLY valid JSON.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields. ${NO_QUOTE_RULE}`, userLanguage);

    let parsed;
    try {
      parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 4000,
        system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: prompt }],
      }, { label: 'lease-trap-detector-followup' });
    } catch (err) {
      return handleAiError(res, err);
    }

    if (!parsed.answer) {
      return res.status(500).json({ error: 'Could not analyze your lease. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[LeaseTrapDetector/followup] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// COMPARE — side-by-side lease comparison
// ═══════════════════════════════════════════════════════════════

router.post('/lease-trap-detector/compare', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { leaseA, leaseB, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!leaseA || !leaseB) {
      return res.status(400).json({ error: 'Need two lease analyses to compare' });
    }

    const summarize = (analysis, label) => {
      const a = analysis;
      return `${label}:
- Risk: ${a.overall_assessment?.risk_level || '?'}
- Red flags: ${a.red_flags?.length || 0}
- Yellow flags: ${a.yellow_flags?.length || 0}
- Green flags: ${a.green_flags?.length || 0}
- Unenforceable clauses: ${a.unenforceable_clauses?.length || 0}
- Missing protections: ${a.missing_protections?.length || 0}
- Deposit: ${a.security_deposit_analysis?.lease_deposit_amount || '?'} (legal max: ${a.security_deposit_analysis?.legal_maximum || '?'}, over limit: ${a.security_deposit_analysis?.is_over_limit || false})
- Move-in cost: ${a.financial_summary?.total_move_in_cost || '?'}
- Annual extra costs: ${a.financial_summary?.annual_extra_costs || '?'}
- Worst case penalties: ${a.financial_summary?.worst_case_penalties || '?'}
- Key red flags: ${a.red_flags?.slice(0, 5).map(f => f.concern).join('; ') || 'none'}
- Rent control: ${a.overall_assessment?.rent_control_applicable || false}`;
    };

    const systemPrompt = 'You are a tenant rights advisor comparing two rental leases to help a tenant decide which is safer and more favorable.';

    const prompt = withLanguage(`${summarize(leaseA.analysis, `LEASE A: "${leaseA.name}"`)}

${summarize(leaseB.analysis, `LEASE B: "${leaseB.name}"`)}

Compare these leases across every dimension that matters to a renter. Be specific and opinionated — don't just list differences, make a recommendation.

Return ONLY valid JSON:
{
  "recommendation": "A" or "B" or "neither",
  "recommendation_reason": "Clear, specific explanation of why one is better — one sentence",
  "comparison": [
    {
      "lease_a": "Assessment for Lease A — one sentence",
      "why": "Brief explanation — one sentence"
    }
  ],
  "bottom_line": "One-paragraph final verdict in plain language — one sentence"
}

Return ONLY valid JSON. ${NO_QUOTE_RULE}`, userLanguage);

    let parsed;
    try {
      parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 2500,
        system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: prompt }],
      }, { label: 'lease-trap-detector-compare' });
    } catch (err) {
      return handleAiError(res, err);
    }

    if (!parsed.recommendation) {
      return res.status(500).json({ error: 'Could not analyze your lease. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[LeaseTrapDetector/compare] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// DRAFT EMAIL — ready-to-send negotiation email
// ═══════════════════════════════════════════════════════════════

router.post('/lease-trap-detector/draft-email', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { redFlags, yellowFlags, unenforceableClauses, location, landlordName, tenantName, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!redFlags?.length && !yellowFlags?.length && !unenforceableClauses?.length) {
      return res.status(400).json({ error: 'No issues to negotiate' });
    }

    const issuesBlock = [];
    if (redFlags?.length) {
      issuesBlock.push('RED FLAGS TO ADDRESS:');
      redFlags.forEach(f => issuesBlock.push(`- ${f.lease_reference}: ${f.concern} (Law: ${f.specific_law}). Script: ${f.negotiation_script || 'N/A'}`));
    }
    if (unenforceableClauses?.length) {
      issuesBlock.push('\nUNENFORCEABLE CLAUSES TO NOTE:');
      unenforceableClauses.forEach(c => issuesBlock.push(`- ${c.lease_reference}: ${c.specific_law} — ${c.explanation}`));
    }
    if (yellowFlags?.length) {
      issuesBlock.push('\nYELLOW FLAGS TO CLARIFY:');
      yellowFlags.slice(0, 3).forEach(f => issuesBlock.push(`- ${f.lease_reference}: ${f.concern}`));
    }

    const systemPrompt = 'You are helping a tenant write a professional, assertive (not aggressive) email to their landlord/property manager about lease concerns.';

    const prompt = withLanguage(`LOCATION: ${location}
LANDLORD/MANAGEMENT: ${landlordName || 'the landlord'}
TENANT: ${tenantName || 'the tenant'}

ISSUES TO ADDRESS:
${issuesBlock.join('\n')}

Write TWO versions of the email:
1. PROFESSIONAL — Formal, references specific laws, suitable for corporate property management
2. DIRECT — More personal, still firm, suitable for individual landlords

RULES:
- Reference specific statutes naturally (not lecturing)
- Lead with enthusiasm about the property, THEN raise concerns
- Frame asks as "clarifications" and "modifications" not "demands"
- Prioritize: illegal/unenforceable clauses first, then red flags, then yellow flags
- Keep each email under 300 words — landlords don't read novels
- Include a clear call to action (meeting, revised lease, written response)
- Sound like a real person, not a template

Return ONLY valid JSON:
{
  "emails": [
    {
      "version": "professional — one sentence",
      "subject": "Email subject line — one sentence",
      "body": "Full email body — 2-4 sentences",
      "best_for": "When to use this version — one sentence"
    },
    {
      "version": "direct — one sentence",
      "subject": "Email subject line — one sentence",
      "body": "Full email body — 2-4 sentences",
      "best_for": "When to use this version — one sentence"
    }
  ],
  "tips": ["Tip for sending this email", "Another tip"]
}

Return ONLY valid JSON.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields. ${NO_QUOTE_RULE}`, userLanguage);

    let parsed;
    try {
      parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 2500,
        system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: prompt }],
      }, { label: 'lease-trap-detector-draft-email' });
    } catch (err) {
      return handleAiError(res, err);
    }

    if (!parsed.emails) {
      return res.status(500).json({ error: 'Could not analyze your lease. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[LeaseTrapDetector/draft-email] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// AMENDMENT — generate a formal lease addendum
// ═══════════════════════════════════════════════════════════════

router.post('/lease-trap-detector/amendment', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { clausesToAmend, location, landlordName, tenantName, propertyAddress, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!clausesToAmend?.length) {
      return res.status(400).json({ error: 'No clauses selected for amendment' });
    }

    const clauseBlock = clausesToAmend.map((c, i) =>
      `${i + 1}. ${c.lease_reference}: "${c.clause_text}"\n   Problem: ${c.concern}\n   Law: ${c.specific_law || 'N/A'}\n   Desired change: ${c.desired_change || 'Make compliant with law / remove'}`
    ).join('\n\n');

    const systemPrompt = `You are a tenant rights attorney drafting a formal lease addendum/amendment for a tenant in ${location}.`;

    const prompt = withLanguage(`LANDLORD: ${landlordName || '[Landlord Name]'}
TENANT: ${tenantName || '[Tenant Name]'}
PROPERTY: ${propertyAddress || '[Property Address]'}

CLAUSES TO AMEND:
${clauseBlock}

Draft a professional, legally-formatted lease addendum that:
1. References the original lease by section number
2. Clearly states what is being modified and the replacement language
3. Uses proper legal formatting (WHEREAS, NOW THEREFORE, etc.)
4. Includes signature blocks for both parties
5. Includes an effective date line
6. Is assertive but reasonable — not adversarial
7. For unenforceable clauses, note that the amendment reflects existing legal requirements

Return ONLY valid JSON:
{
  "addendum_text": "Full formatted addendum text with proper legal structure, line breaks (use \\n), and signature blocks — one sentence",
  "cover_note": "Brief, friendly note to include when presenting this to the landlord (2-3 sentences)",
  "tips": ["Tip for presenting this to landlord", "Another tip"]
}

CRITICAL: Return ONLY valid JSON. Use \\n for line breaks in the addendum text.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields. ${NO_QUOTE_RULE}`, userLanguage);

    let parsed;
    try {
      parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 4500,
        system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: prompt }],
      }, { label: 'lease-trap-detector-amendment' });
    } catch (err) {
      return handleAiError(res, err);
    }

    if (!parsed.addendum_text) {
      return res.status(500).json({ error: 'Could not analyze your lease. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[LeaseTrapDetector/amendment] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// CHECKLIST — personalized move-in/move-out checklist
// ═══════════════════════════════════════════════════════════════

router.post('/lease-trap-detector/checklist', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { analysisContext, location, leaseType, checklistType, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!checklistType) {
      return res.status(400).json({ error: 'Specify checklist type: move_in or move_out' });
    }

    // Compress analysis context
    const contextLines = [];
    if (analysisContext?.security_deposit_analysis) {
      const sd = analysisContext.security_deposit_analysis;
      contextLines.push(`Deposit: ${sd.lease_deposit_amount}, return in ${sd.return_timeline_days} days (${sd.return_timeline_law})`);
      contextLines.push(`Interest required: ${sd.interest_required}, walkthrough required: ${sd.walkthrough_required}`);
      if (sd.walkthrough_details) contextLines.push(`Walkthrough: ${sd.walkthrough_details}`);
      if (sd.permitted_deductions?.length) contextLines.push(`Can deduct: ${sd.permitted_deductions.join(', ')}`);
      if (sd.prohibited_deductions?.length) contextLines.push(`Cannot deduct: ${sd.prohibited_deductions.join(', ')}`);
    }
    if (analysisContext?.missing_disclosures?.length) {
      contextLines.push(`Missing disclosures: ${analysisContext.missing_disclosures.map(d => d.disclosure).join(', ')}`);
    }
    if (analysisContext?.red_flags?.length) {
      contextLines.push(`Red flags to document: ${analysisContext.red_flags.slice(0, 5).map(f => `${f.lease_reference}: ${f.concern}`).join('; ')}`);
    }

    const systemPrompt = `You are a tenant rights advisor creating a personalized ${checklistType === 'move_in' ? 'MOVE-IN' : 'MOVE-OUT'} checklist for a tenant in ${location}.`;

    const prompt = withLanguage(`LOCATION: ${location}
LEASE TYPE: ${leaseType || 'residential'}
${checklistType.toUpperCase()} CHECKLIST

LEASE-SPECIFIC DETAILS:
${contextLines.join('\n')}

Create a comprehensive, jurisdiction-specific checklist that protects this tenant's deposit and rights. Every item should be actionable and specific to their lease and location.

OUTPUT LIMITS (CRITICAL — the response MUST be complete, valid JSON that closes): at most 5 sections, at most 5 items per section. Keep every string field to one tight sentence. A focused, fully-closed checklist beats a longer truncated one.

${checklistType === 'move_in' ? `
MOVE-IN FOCUS:
- Document EVERYTHING before touching anything
- What photos/videos to take and how to organize them
- What disclosures to request if missing
- What to check for (mold, pests, safety hazards)
- How to formally submit the condition report
- Utility transfer deadlines
- Renter's insurance requirements from the lease
- Key/access documentation
` : `
MOVE-OUT FOCUS:
- Timeline working backwards from lease end date
- Cleaning standards that prevent deductions in ${location}
- How to request the pre-move-out walkthrough/inspection per ${location} law
- What constitutes "normal wear and tear" vs deductible damage in ${location}
- How to document final condition
- How and when to demand deposit return per statute
- Template for deposit demand letter if not returned on time
- What to do if deductions seem illegal
`}

Return ONLY valid JSON:
{
  "title": "Checklist title — 3-6 words",
  "timeline_note": "When to start this checklist relative to move date — one sentence",
  "sections": [
    {
      "title": "Section name (e.g., 'Before You Move Anything In', 'Document Every Room') — 3-6 words",
      "icon": "emoji",
      "items": [
        {
          "task": "Specific actionable task — one sentence",
          "why": "Brief reason this matters — one sentence",
          "legal_note": "Relevant statute or lease clause if applicable (null if general advice) — one sentence",
          "deadline": "When to complete this (e.g., 'Day of move-in', '30 days before move-out') — one sentence",
          "priority": "critical / important / recommended"
        }
      ]
    }
  ],
  "demand_letter_template": "If move-out: template for deposit demand letter with blanks to fill in. If move-in: null — 2-4 sentences",
  "pro_tips": ["Jurisdiction-specific pro tip", "Another tip"]
}

Return ONLY valid JSON. ${NO_QUOTE_RULE}`, userLanguage);

    let parsed;
    try {
      parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 8000,
        system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: prompt }],
      }, { label: 'lease-trap-detector-checklist' });
    } catch (err) {
      return handleAiError(res, err, 'This checklist request produced too much detail to complete in one pass. Try again — it should fit now.');
    }

    if (!parsed.title) {
      return res.status(500).json({ error: 'Could not analyze your lease. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[LeaseTrapDetector/checklist] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// RENEWAL TRAP DETECTOR — analyze renewal/termination clauses
// ═══════════════════════════════════════════════════════════════

router.post('/lease-trap-detector/renewal-traps', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { analysisContext, location, leaseType, leaseText, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    const contextLines = [];
    if (analysisContext?.red_flags?.length) {
      const renewalFlags = analysisContext.red_flags.filter(f =>
        /renew|terminat|auto|rollover|month.to.month|notice|increase|escalat/i.test(
          `${f.clause_text} ${f.concern} ${f.lease_reference}`
        )
      );
      if (renewalFlags.length) {
        contextLines.push(`Renewal-related red flags already found: ${renewalFlags.map(f => `${f.lease_reference}: ${f.clause_text}`).join('; ')}`);
      }
    }

    const systemPrompt = `You are a tenant rights attorney analyzing the RENEWAL, TERMINATION, and RENT INCREASE provisions of a lease in ${location}.`;

    const prompt = withLanguage(`LOCATION: ${location}
LEASE TYPE: ${leaseType || 'residential'}

${contextLines.length ? `CONTEXT FROM PRIOR ANALYSIS:\n${contextLines.join('\n')}\n` : ''}
${leaseText ? `LEASE TEXT (search for renewal/termination/increase clauses):\n${leaseText.slice(0, 5000)}` : 'No lease text available — provide general guidance for this jurisdiction.'}

ANALYZE THESE SPECIFIC QUESTIONS:

1. AUTO-RENEWAL: Does the lease auto-renew? Into what (month-to-month, year-to-year)? What's the notice window to prevent renewal? Is the auto-renewal clause enforceable in ${location}?

2. RENT INCREASES: What does the lease say about rent increases at renewal? Is there a cap? Does ${location} have rent control that limits increases? What's the required notice period for increases?

3. TERMINATION RIGHTS: How can the tenant terminate? What's the notice period required? Are there early termination penalties? Are those penalties enforceable?

4. HOLDOVER PROVISIONS: What happens if the tenant stays past lease end without signing a new lease? What rate applies? Is the holdover clause enforceable?

5. LEASE-END TIMELINE: Working backwards from lease end, what are the critical dates the tenant must track?

Return ONLY valid JSON:
{
  "auto_renewal": {
    "has_auto_renewal": true/false,
    "renewal_type": "month-to-month / year-to-year / none",
    "notice_to_prevent": "How much notice and in what form to prevent auto-renewal — one sentence",
    "relevant_law": "Statute governing auto-renewal in ${location} — one sentence",
    "trap_warning": "What to watch out for (e.g., 'Miss the 60-day window and you're locked in for another year') — one sentence"
  },
  "rent_increases": {
    "lease_allows_increase": true/false,
    "legal_cap": "Any legal cap on increases in ${location} (rent control, etc.) — one sentence",
    "required_notice": "How much notice landlord must give before increasing rent — one sentence",
    "relevant_law": "Statute — one sentence"
  },
  "termination": {
    "early_termination_penalty": "Penalty amount or terms — one sentence",
    "required_notice": "Notice period to terminate — one sentence",
    "relevant_law": "Statute — one sentence",
    "landlord_duty_to_mitigate": "Does the landlord have to try to re-rent? What does ${location} law say? — one sentence"
  },
  "critical_dates": [
    {
      "deadline": "Description (e.g., 'Send non-renewal notice') — one sentence",
      "timing": "When relative to lease end (e.g., '60 days before') — one sentence",
      "consequence_if_missed": "What happens if you miss this deadline — one sentence"
    }
  ],
  "overall_renewal_risk": "low | medium | high",
  "summary": "One-paragraph plain-language summary of what the tenant needs to know about their lease ending — 1-2 sentences"
}

Return ONLY valid JSON. ${NO_QUOTE_RULE}`, userLanguage);

    let parsed;
    try {
      parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 2500,
        system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: prompt }],
      }, { label: 'lease-trap-detector-renewal-traps' });
    } catch (err) {
      return handleAiError(res, err);
    }

    if (!parsed.auto_renewal) {
      return res.status(500).json({ error: 'Could not analyze your lease. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[LeaseTrapDetector/renewal-traps] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /lease-trap-detector/missing — FinePointFinder
// Identifies protections ABSENT from a contract
// ════════════════════════════════════════════════════════════
router.post('/lease-trap-detector/missing', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { contractText, contractType, yourRole, concerns, location, userLanguage, userLocale, userCurrency, userRegion } = req.body;
    if (!contractText?.trim()) return res.status(400).json({ error: 'Paste the contract text to analyze.' });

    const systemPrompt = `You are a contract protection expert — specifically focused on what SHOULD be in agreements but usually isn't. Most contract review focuses on bad clauses. You focus on absent protections — the things tenants, employees, clients, and buyers don't know to ask for because they don't know they're supposed to be there.`;

    const userPrompt = `FINE POINT FINDER — WHAT'S MISSING FROM THIS CONTRACT

CONTRACT TYPE: ${contractType || 'Unknown — infer from content'}
YOUR ROLE: ${yourRole || 'The party signing / agreeing'}
${location?.trim() ? `LOCATION: ${location.trim()} (relevant for jurisdiction-specific protections)` : ''}
${concerns?.trim() ? `SPECIFIC CONCERNS: ${concerns.trim()}` : ''}

CONTRACT TEXT:
${contractText.trim().slice(0, 8000)}

Identify what's absent — protections that should be here but aren't.

Return ONLY valid JSON:
{
  "contract_summary": "One sentence — what type of contract this appears to be and what it covers",

  "missing_protections": [
    {
      "protection": "Short name for the missing clause (e.g., 'Move-Out Inspection Notice Requirement') — one sentence",
      "risk_if_absent": "high | medium | low",
      "why_it_matters": "What can go wrong without this protection — be specific and realistic — one sentence",
      "what_it_should_say": "The specific language or clause you'd want added — write it as you'd want to see it in the contract — one sentence",
      "how_common": "How standard is this protection — is its absence unusual or routine? — one sentence"
    }
  ],

  "questions_to_ask_before_signing": [
    {
      "question": "The exact question to ask the other party — one sentence",
      "why": "What information this gets you and why it matters — one sentence"
    }
  ],

  "negotiation_priority": {
    "must_haves": ["The 2-3 most important missing protections to push for"],
    "pick_your_battle": "If you can only negotiate one thing — which missing protection should it be, and why? — one sentence"
  },

  "overall_assessment": "One honest paragraph — how protected is this person given what's present vs. absent? What's the biggest exposure? — 1-2 sentences"
}

${NO_QUOTE_RULE}`;

    let parsed;
    try {
      parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 4500,
        system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: withLanguage(userPrompt, userLanguage) }],
      }, { label: 'lease-trap-detector-missing' });
    } catch (err) {
      return handleAiError(res, err, 'This contract is too long to analyze in one pass. Try pasting the sections you care about most.');
    }

    if (!parsed.overall_assessment) {
      return res.status(500).json({ error: 'Could not analyze your lease. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[LeaseTrapDetector/missing] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Recursively strip <cite ...>...</cite> tags from string values in any
// nested structure. Required because the web_search tool wraps phrases in
// citation tags inside JSON string values. (Same helper as safe-walk.)
function stripCites(val) {
  if (typeof val === 'string') return val.replace(/<\/?(antml:)?cite\b[^>]*>/g, '');
  if (Array.isArray(val)) return val.map(stripCites);
  if (val && typeof val === 'object') {
    return Object.fromEntries(
      Object.entries(val).map(([k, v]) => [k, stripCites(v)])
    );
  }
  return val;
}

module.exports = router;
