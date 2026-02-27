const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

// ── Robust JSON parser ──
function safeParseJSON(text) {
  let cleaned = cleanJsonResponse(text);
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  try { return JSON.parse(cleaned); } catch {
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, ' ');
    try { return JSON.parse(cleaned); } catch {
      cleaned = cleaned.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
      return JSON.parse(cleaned);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN ANALYSIS ENDPOINT
// ═══════════════════════════════════════════════════════════════

router.post('/lease-trap-detector', async (req, res) => {
  try {
    const { leaseText, pdfBase64, location, leaseType, concerns } = req.body;

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
      const sizeKB = Math.round((rawBase64.length * 0.75) / 1024);
      console.log(`[LeaseTrapDetector] PDF received: ${sizeKB}KB`);

      contentBlocks.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: rawBase64 }
      });
      contentBlocks.push({
        type: 'text',
        text: 'The document above is a rental lease agreement PDF. You MUST read the entire document carefully and analyze every clause.'
      });
    }

    const prompt = `You are an expert tenant rights attorney with deep knowledge of state and local landlord-tenant law. You are analyzing a rental lease agreement.

LEASE TYPE: ${leaseType}
LOCATION: ${location}
${concerns ? `TENANT CONCERNS: ${concerns}` : ''}

${leaseText ? `LEASE TEXT:\n${leaseText}` : 'The lease document was provided as a PDF above. Analyze its full contents.'}

═══════════════════════════════════════════
ANALYSIS REQUIREMENTS
═══════════════════════════════════════════

LEGAL RESEARCH REQUIREMENTS:
- Reference SPECIFIC statutes and code sections for ${location} (e.g., "Cal. Civ. Code § 1950.5" or "NYC Admin Code § 26-511")
- Cite the exact law that makes a clause illegal or unenforceable
- Note jurisdiction-specific timelines (notice periods, cure periods, eviction timelines)
- Identify whether ${location} is in a landlord-favorable or tenant-favorable jurisdiction
- Note any rent control or rent stabilization that may apply

SECURITY DEPOSIT ANALYSIS:
- State-specific maximum deposit amounts for ${location}
- Whether interest on deposits is required and at what rate
- Required return timeline after move-out
- Walk-through/inspection requirements before deduction
- What deductions are legally permitted vs prohibited
- Compare the lease's deposit terms against these legal requirements

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
- For each red/yellow flag, predict the landlord's likely response if the tenant pushes back
- Classify each point as: "likely negotiable," "possible with leverage," or "non-negotiable standard"
- Identify the tenant's leverage points (local vacancy rates, time of year, lease length)
- Suggest where to compromise vs where to stand firm
- Provide specific "if they say X, respond with Y" scripts

RESOURCES FOR ${location}:
- Local tenant union or tenant rights organization
- Free legal clinics or legal aid for tenants
- Local housing authority contact info
- Mediation services available
- Emergency housing resources if needed

═══════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════

Return ONLY valid JSON (no markdown, no preamble):

{
  "overall_assessment": {
    "risk_level": "high / medium / low",
    "major_concerns_count": number,
    "recommendation": "brief overall recommendation",
    "jurisdiction_type": "tenant-favorable / landlord-favorable / neutral",
    "rent_control_applicable": true/false,
    "rent_control_details": "details if applicable, null otherwise"
  },
  "financial_summary": {
    "monthly_rent": "base rent amount from lease",
    "security_deposit": "deposit amount",
    "total_move_in_cost": "all upfront costs combined",
    "monthly_fees_beyond_rent": [
      { "fee": "fee name", "amount": "dollar amount" }
    ],
    "annual_extra_costs": "estimated total fees/charges beyond rent over 12 months",
    "worst_case_penalties": "total exposure if all penalties triggered (late fees, early termination, etc.)",
    "financial_red_flags": ["brief financial concerns"]
  },
  "security_deposit_analysis": {
    "lease_deposit_amount": "what the lease charges",
    "legal_maximum": "maximum allowed by law in ${location}",
    "is_over_limit": true/false,
    "interest_required": true/false,
    "interest_details": "interest rate and payment requirements",
    "return_timeline_days": number,
    "return_timeline_law": "specific statute",
    "walkthrough_required": true/false,
    "walkthrough_details": "requirements for pre-move-out inspection",
    "permitted_deductions": ["what landlord CAN deduct"],
    "prohibited_deductions": ["what landlord CANNOT deduct"],
    "issues_found": ["any deposit-related problems in this lease"]
  },
  "red_flags": [
    {
      "lease_reference": "Section/paragraph/page where this clause appears",
      "clause_text": "exact clause from the lease",
      "concern": "one-sentence problem summary",
      "why_problematic": "detailed explanation",
      "legal_status": "illegal / unenforceable / exploitative",
      "specific_law": "exact statute or code section",
      "what_lease_says": "what this clause tries to do",
      "what_law_says": "what the law actually allows",
      "your_rights": "tenant's actual legal rights",
      "landlord_likely_response": "how the landlord will probably react if you raise this",
      "negotiability": "likely negotiable / possible with leverage / non-negotiable standard",
      "negotiation_script": "specific language to use when pushing back"
    }
  ],
  "yellow_flags": [
    {
      "lease_reference": "Section/paragraph/page reference",
      "clause_text": "clause text",
      "concern": "issue description",
      "why_concerning": "explanation of potential risk",
      "questions_to_ask": ["specific questions to ask landlord"],
      "landlord_likely_response": "predicted response",
      "negotiability": "likely negotiable / possible with leverage / non-negotiable standard",
      "what_to_watch_for": "red flags during the conversation"
    }
  ],
  "green_flags": [
    {
      "lease_reference": "Section/paragraph/page reference",
      "clause_text": "good clause from the lease",
      "why_good": "why this protects the tenant"
    }
  ],
  "unenforceable_clauses": [
    {
      "lease_reference": "Section/paragraph/page reference",
      "clause_text": "clause that cannot be enforced",
      "specific_law": "statute making it unenforceable",
      "explanation": "why this is void/unenforceable",
      "practical_advice": "what to do about it"
    }
  ],
  "missing_protections": [
    {
      "protection": "what's missing from the lease",
      "why_important": "why the tenant needs this",
      "legal_requirement": "whether this is legally required or just recommended",
      "how_to_add": "specific language to request adding"
    }
  ],
  "missing_disclosures": [
    {
      "disclosure": "required disclosure name",
      "legal_requirement": "specific law requiring it",
      "consequence_if_missing": "what happens if landlord fails to provide this"
    }
  ],
  "unusual_fees": [
    {
      "lease_reference": "Section/paragraph/page reference",
      "fee_name": "name of the fee",
      "amount": "dollar amount",
      "is_typical": true/false,
      "is_legal": "yes / no / depends on jurisdiction",
      "specific_law": "relevant statute if applicable",
      "negotiation_strategy": "how to push back on this fee"
    }
  ],
  "negotiation_strategy": {
    "opening_email": "full email/letter opening to send to landlord",
    "key_points": ["prioritized list of negotiation points"],
    "compromise_positions": ["where to give ground if needed"],
    "stand_firm_on": ["non-negotiable items"],
    "leverage_points": ["your advantages in this negotiation"],
    "market_context": "assessment of tenant vs landlord market",
    "if_they_say_scripts": [
      {
        "landlord_says": "common landlord pushback",
        "you_respond": "effective response"
      }
    ]
  },
  "resources": [
    {
      "resource": "organization name",
      "type": "tenant union / legal aid / housing authority / mediation / emergency housing",
      "why_useful": "what they can help with",
      "contact": "phone, website, or address",
      "notes": "when to contact them"
    }
  ]
}

CRITICAL RULES:
- Every flag MUST include a lease_reference citing the section, paragraph, page, or clause number
- Cite SPECIFIC laws and statutes for ${location}
- Every red flag MUST include the specific law that applies
- Security deposit analysis MUST reference the exact state statute
- Financial summary MUST estimate real dollar amounts where possible
- Be comprehensive but honest — don't flag standard/acceptable clauses
- Resources should be REAL organizations that serve ${location}
- Return ONLY valid JSON.`;

    contentBlocks.push({ type: 'text', text: prompt });

    console.log(`[LeaseTrapDetector] Sending ${contentBlocks.length} blocks (PDF: ${!!pdfBase64}, text: ${!!leaseText})`);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: contentBlocks }]
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    console.log(`[LeaseTrapDetector] Response: ${raw.length} chars`);
    const parsed = safeParseJSON(raw);
    console.log(`[LeaseTrapDetector] Risk: ${parsed.overall_assessment?.risk_level}, Red: ${parsed.red_flags?.length || 0}`);
    res.json(parsed);

  } catch (error) {
    console.error('[LeaseTrapDetector] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze lease' });
  }
});

// ═══════════════════════════════════════════════════════════════
// FOLLOW-UP Q&A — ask about a specific clause or finding
// ═══════════════════════════════════════════════════════════════

router.post('/lease-trap-detector/followup', async (req, res) => {
  try {
    const { question, analysisContext, location, leaseType, userLanguage } = req.body;

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

    const prompt = withLanguage(`You are an expert tenant rights attorney. You already analyzed a lease and the tenant has a follow-up question.

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
  "answer": "Direct, detailed answer to the question",
  "relevant_law": "Specific statute if applicable, null otherwise",
  "practical_steps": ["Step 1", "Step 2"],
  "important_caveat": "Any important caveat or limitation (null if none)",
  "should_consult_lawyer": true/false,
  "why_lawyer": "Why a lawyer would help here (null if not needed)"
}

Return ONLY valid JSON.`, userLanguage);

    console.log(`[LeaseTrapDetector/followup] Q: "${question.slice(0, 60)}"`);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[LeaseTrapDetector/followup] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to answer question' });
  }
});

// ═══════════════════════════════════════════════════════════════
// COMPARE — side-by-side lease comparison
// ═══════════════════════════════════════════════════════════════

router.post('/lease-trap-detector/compare', async (req, res) => {
  try {
    const { leaseA, leaseB, userLanguage } = req.body;

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

    const prompt = withLanguage(`You are a tenant rights advisor comparing two rental leases to help a tenant decide which is safer and more favorable.

${summarize(leaseA.analysis, `LEASE A: "${leaseA.name}"`)}

${summarize(leaseB.analysis, `LEASE B: "${leaseB.name}"`)}

Compare these leases across every dimension that matters to a renter. Be specific and opinionated — don't just list differences, make a recommendation.

Return ONLY valid JSON:
{
  "recommendation": "A" or "B" or "neither",
  "recommendation_reason": "Clear, specific explanation of why one is better",
  "confidence": "high / medium / low",
  "comparison": [
    {
      "category": "Security Deposit | Fees | Tenant Rights | Flexibility | Red Flags | Financial Risk",
      "lease_a": "Assessment for Lease A",
      "lease_b": "Assessment for Lease B",
      "winner": "A" or "B" or "tie",
      "why": "Brief explanation"
    }
  ],
  "deal_breakers": {
    "lease_a": ["Any deal-breakers in Lease A"],
    "lease_b": ["Any deal-breakers in Lease B"]
  },
  "financial_comparison": {
    "lease_a_total_year_1": "Estimated total cost year 1 for Lease A",
    "lease_b_total_year_1": "Estimated total cost year 1 for Lease B",
    "cheaper_option": "A or B",
    "savings": "How much cheaper"
  },
  "what_to_negotiate": {
    "lease_a": ["Top things to negotiate if choosing A"],
    "lease_b": ["Top things to negotiate if choosing B"]
  },
  "bottom_line": "One-paragraph final verdict in plain language"
}

Return ONLY valid JSON.`, userLanguage);

    console.log(`[LeaseTrapDetector/compare] Comparing "${leaseA.name}" vs "${leaseB.name}"`);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[LeaseTrapDetector/compare] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to compare leases' });
  }
});

// ═══════════════════════════════════════════════════════════════
// DRAFT EMAIL — ready-to-send negotiation email
// ═══════════════════════════════════════════════════════════════

router.post('/lease-trap-detector/draft-email', async (req, res) => {
  try {
    const { redFlags, yellowFlags, unenforceableClauses, location, landlordName, tenantName, userLanguage } = req.body;

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

    const prompt = withLanguage(`You are helping a tenant write a professional, assertive (not aggressive) email to their landlord/property manager about lease concerns.

LOCATION: ${location}
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
      "version": "professional",
      "subject": "Email subject line",
      "body": "Full email body",
      "best_for": "When to use this version"
    },
    {
      "version": "direct",
      "subject": "Email subject line",
      "body": "Full email body",
      "best_for": "When to use this version"
    }
  ],
  "tips": ["Tip for sending this email", "Another tip"],
  "follow_up_if_ignored": "What to do if they don't respond within 5 business days"
}

Return ONLY valid JSON.`, userLanguage);

    console.log(`[LeaseTrapDetector/draft-email] ${(redFlags?.length || 0)} red, ${(unenforceableClauses?.length || 0)} unenforceable, ${(yellowFlags?.length || 0)} yellow`);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[LeaseTrapDetector/draft-email] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to draft email' });
  }
});

// ═══════════════════════════════════════════════════════════════
// AMENDMENT — generate a formal lease addendum
// ═══════════════════════════════════════════════════════════════

router.post('/lease-trap-detector/amendment', async (req, res) => {
  try {
    const { clausesToAmend, location, landlordName, tenantName, propertyAddress, userLanguage } = req.body;

    if (!clausesToAmend?.length) {
      return res.status(400).json({ error: 'No clauses selected for amendment' });
    }

    const clauseBlock = clausesToAmend.map((c, i) =>
      `${i + 1}. ${c.lease_reference}: "${c.clause_text}"\n   Problem: ${c.concern}\n   Law: ${c.specific_law || 'N/A'}\n   Desired change: ${c.desired_change || 'Make compliant with law / remove'}`
    ).join('\n\n');

    const prompt = withLanguage(`You are a tenant rights attorney drafting a formal lease addendum/amendment for a tenant in ${location}.

LANDLORD: ${landlordName || '[Landlord Name]'}
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
  "addendum_title": "LEASE ADDENDUM — [descriptive title]",
  "addendum_text": "Full formatted addendum text with proper legal structure, line breaks (use \\n), and signature blocks",
  "cover_note": "Brief, friendly note to include when presenting this to the landlord (2-3 sentences)",
  "amendments": [
    {
      "section": "Section reference",
      "original": "Brief summary of original clause",
      "modified": "New replacement language",
      "legal_basis": "Law supporting this change"
    }
  ],
  "tips": ["Tip for presenting this to landlord", "Another tip"]
}

CRITICAL: Return ONLY valid JSON. Use \\n for line breaks in the addendum text.`, userLanguage);

    console.log(`[LeaseTrapDetector/amendment] ${clausesToAmend.length} clauses`);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[LeaseTrapDetector/amendment] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate amendment' });
  }
});

// ═══════════════════════════════════════════════════════════════
// CHECKLIST — personalized move-in/move-out checklist
// ═══════════════════════════════════════════════════════════════

router.post('/lease-trap-detector/checklist', async (req, res) => {
  try {
    const { analysisContext, location, leaseType, checklistType, userLanguage } = req.body;

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

    const prompt = withLanguage(`You are a tenant rights advisor creating a personalized ${checklistType === 'move_in' ? 'MOVE-IN' : 'MOVE-OUT'} checklist for a tenant in ${location}.

LOCATION: ${location}
LEASE TYPE: ${leaseType || 'residential'}
${checklistType.toUpperCase()} CHECKLIST

LEASE-SPECIFIC DETAILS:
${contextLines.join('\n')}

Create a comprehensive, jurisdiction-specific checklist that protects this tenant's deposit and rights. Every item should be actionable and specific to their lease and location.

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
  "title": "Checklist title",
  "timeline_note": "When to start this checklist relative to move date",
  "sections": [
    {
      "title": "Section name (e.g., 'Before You Move Anything In', 'Document Every Room')",
      "icon": "emoji",
      "items": [
        {
          "task": "Specific actionable task",
          "why": "Brief reason this matters",
          "legal_note": "Relevant statute or lease clause if applicable (null if general advice)",
          "deadline": "When to complete this (e.g., 'Day of move-in', '30 days before move-out')",
          "priority": "critical / important / recommended"
        }
      ]
    }
  ],
  "demand_letter_template": "If move-out: template for deposit demand letter with blanks to fill in. If move-in: null",
  "pro_tips": ["Jurisdiction-specific pro tip", "Another tip"]
}

Return ONLY valid JSON.`, userLanguage);

    console.log(`[LeaseTrapDetector/checklist] Type: ${checklistType}, Location: ${location}`);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[LeaseTrapDetector/checklist] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate checklist' });
  }
});

// ═══════════════════════════════════════════════════════════════
// RENEWAL TRAP DETECTOR — analyze renewal/termination clauses
// ═══════════════════════════════════════════════════════════════

router.post('/lease-trap-detector/renewal-traps', async (req, res) => {
  try {
    const { analysisContext, location, leaseType, leaseText, userLanguage } = req.body;

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

    const prompt = withLanguage(`You are a tenant rights attorney analyzing the RENEWAL, TERMINATION, and RENT INCREASE provisions of a lease in ${location}.

LOCATION: ${location}
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
  "lease_end_summary": {
    "lease_term": "Lease duration from the document",
    "end_date_info": "What we know about the end date",
    "what_happens_at_end": "Clear explanation of what occurs when the lease expires"
  },
  "auto_renewal": {
    "has_auto_renewal": true/false,
    "renewal_type": "month-to-month / year-to-year / none",
    "notice_to_prevent": "How much notice and in what form to prevent auto-renewal",
    "is_enforceable": true/false,
    "relevant_law": "Statute governing auto-renewal in ${location}",
    "trap_warning": "What to watch out for (e.g., 'Miss the 60-day window and you're locked in for another year')"
  },
  "rent_increases": {
    "lease_allows_increase": true/false,
    "increase_terms": "What the lease says about increases",
    "legal_cap": "Any legal cap on increases in ${location} (rent control, etc.)",
    "required_notice": "How much notice landlord must give before increasing rent",
    "relevant_law": "Statute",
    "protection_strategy": "What the tenant can do to protect against excessive increases"
  },
  "termination": {
    "tenant_can_terminate_early": true/false,
    "early_termination_penalty": "Penalty amount or terms",
    "penalty_enforceable": true/false,
    "required_notice": "Notice period to terminate",
    "relevant_law": "Statute",
    "landlord_duty_to_mitigate": "Does the landlord have to try to re-rent? What does ${location} law say?"
  },
  "holdover": {
    "holdover_rate": "What rate applies if tenant stays past lease end",
    "holdover_terms": "Other holdover provisions",
    "is_enforceable": true/false,
    "relevant_law": "Statute"
  },
  "critical_dates": [
    {
      "deadline": "Description (e.g., 'Send non-renewal notice')",
      "timing": "When relative to lease end (e.g., '60 days before')",
      "how_to_send": "Required delivery method (certified mail, etc.)",
      "consequence_if_missed": "What happens if you miss this deadline"
    }
  ],
  "overall_renewal_risk": "low / medium / high",
  "summary": "One-paragraph plain-language summary of what the tenant needs to know about their lease ending"
}

Return ONLY valid JSON.`, userLanguage);

    console.log(`[LeaseTrapDetector/renewal-traps] Location: ${location}`);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[LeaseTrapDetector/renewal-traps] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze renewal terms' });
  }
});

module.exports = router;
