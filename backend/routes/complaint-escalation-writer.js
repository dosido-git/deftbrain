const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse } = require('../lib/claude');

router.post('/complaint-escalation-writer', async (req, res) => {
  try {
    const { company, issue, industry, previousAttempts, desiredOutcome, amountAtStake, hasDocumentation, tone } = req.body;

    if (!company || !company.trim()) {
      return res.status(400).json({ error: 'Company name is required' });
    }
    if (!issue || !issue.trim()) {
      return res.status(400).json({ error: 'Issue description is required' });
    }

    const toneInstructions = {
      firm: 'Firm but professional. Clear, business-like, references legal rights calmly. This is the standard approach.',
      aggressive: 'Assertive and direct. Use stronger legal language, shorter deadlines (7 days instead of 14), more explicit consequences. Reference specific penalties and enforcement actions. Still professional — never rude — but unmistakably serious.',
      empathetic: 'Empathetic and resolution-focused. Acknowledge that front-line staff are not at fault. Frame the complaint as seeking fair resolution, not punishment. Still reference legal rights but frame them as context, not threats.',
    };

    const prompt = `You are an elite consumer advocacy strategist who has helped thousands of people get results from unresponsive companies. You combine legal knowledge, corporate psychology, and escalation expertise to build multi-stage campaigns that companies cannot ignore.

COMPANY: ${company}
INDUSTRY: ${industry || 'Unknown — infer from the company name'}
ISSUE: ${issue}
PREVIOUS ATTEMPTS: ${previousAttempts || 'None mentioned'}
DESIRED OUTCOME: ${desiredOutcome || 'Not specified — recommend the most reasonable resolution'}
AMOUNT AT STAKE: ${amountAtStake || 'Not specified'}
HAS DOCUMENTATION: ${hasDocumentation || 'Not specified'}

TONE: ${toneInstructions[tone] || toneInstructions.firm}

═══════════════════════════════════════════════
ANALYSIS REQUIREMENTS
═══════════════════════════════════════════════

STEP 1 — COMPANY & INDUSTRY INTELLIGENCE
Research what you know about this company and industry:
- What regulatory bodies oversee this company? (FCC, DOT, CFPB, FTC, state AG, SEC, FDA, etc.)
- Does this company/industry have specific consumer protection laws? (airline passenger rights, CARD Act, Magnuson-Moss Warranty Act, lemon laws, TCPA, CAN-SPAM, state consumer protection statutes, etc.)
- Is this company known for specific escalation paths? (executive customer service, CEO email, social media responsiveness, BBB responsiveness)
- What are this company's vulnerability points? (public reputation, regulatory scrutiny, competitive market pressure, pending litigation, recent scandals)
- Are there mandatory response timelines the company must follow once a formal complaint is filed?

STEP 2 — LEGAL LEVERAGE IDENTIFICATION
Identify ALL applicable consumer protections:
- Federal laws and regulations that apply to this specific situation
- State consumer protection statutes (many have automatic treble/double damages provisions)
- Industry-specific regulations
- Contract/warranty obligations the company may be violating
- Credit card chargeback rights if payment was by card (specific reason codes, time windows)
- Small claims court jurisdiction and typical outcomes for this type of dispute
- Class action potential if this is a widespread issue

STEP 3 — WRITE THE ESCALATION CAMPAIGN
Build a complete multi-stage escalation ladder. Each stage increases pressure while maintaining professionalism. The user should start at Stage 1 and only move to Stage 2 if Stage 1 fails, etc.

Stage 1 — DIRECT COMPLAINT: A firm, professional letter to the company's customer service escalation team. This letter should:
- Open with a clear, specific statement of the problem
- Include a timeline of events and previous contact attempts
- Reference specific legal protections or regulations that apply (this signals the customer is informed)
- State the desired resolution clearly with a reasonable deadline (10-14 business days)
- Mention that you are prepared to escalate if necessary (without being threatening)
- Close professionally

Stage 2 — REGULATORY COMPLAINT: Pre-written complaint text ready to file with the specific regulatory agency that oversees this company/industry. Include:
- Which agency to file with and why
- The filing URL or process
- The complaint text adapted for that agency's format
- What happens after filing (mandatory company response timeline, investigation process)

Stage 3 — EXECUTIVE ESCALATION: A different letter, different tone — addressed to C-suite or executive customer relations. This should:
- Be shorter and more direct than Stage 1
- Reference the failed Stage 1 attempt
- Reference the regulatory complaint (Stage 2) as already filed or imminent
- Appeal to the executive's interest in reputation and customer lifetime value
- Include common executive email patterns for this company if known (firstname.lastname@company.com, first_initial+lastname@company.com)

Stage 4 — PUBLIC PRESSURE: A calibrated social media post and review strategy that is:
- 100% factual (no exaggeration, no emotional ranting)
- Specific about what happened and what the company failed to do
- Tagged to the company's official social accounts
- Designed to be damaging through specificity, not anger
- Also: where to post reviews for maximum impact (Google, BBB, Trustpilot, industry-specific)

Stage 5 — FINANCIAL & LEGAL REMEDIES: When to pull the final triggers:
- Credit card chargeback: specific reason code, time window, how to file, what documentation to include
- Small claims court: jurisdiction, filing fee, typical outcomes for this type of case, whether the company typically sends a lawyer or settles
- State Attorney General complaint: how to file, what it triggers
- Class action: how to check if one exists for this issue

STEP 4 — EVIDENCE COACHING
Based on the issue described, tell the user exactly what documentation to gather BEFORE sending anything:
- What screenshots to take
- What records to request from the company (they may be legally required to provide them)
- How to document future interactions (state recording laws, written confirmation requests)
- What to preserve and how (don't just say "keep records" — be specific)

═══════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════

Return ONLY valid JSON (no markdown, no preamble):

{
  "situation_assessment": {
    "severity": "low | medium | high | critical",
    "company_reputation": "Brief assessment of how this company typically handles complaints",
    "legal_strength": "weak | moderate | strong — how strong the consumer's legal position is",
    "estimated_resolution_likelihood": "Percentage estimate if the full escalation ladder is followed",
    "key_insight": "The single most important thing the user should know about their situation"
  },

  "legal_leverage": [
    {
      "law_or_regulation": "Specific law name and section",
      "what_it_protects": "What right it gives the consumer",
      "how_it_applies": "How it applies to THIS specific situation",
      "consequence_for_company": "What the company risks by violating this",
      "strength": "strong | moderate | informational"
    }
  ],

  "evidence_checklist": [
    {
      "item": "What to gather",
      "why": "Why this matters",
      "how": "Specific instructions for obtaining/preserving this",
      "priority": "critical | important | helpful"
    }
  ],

  "escalation_stages": {
    "stage_1_direct": {
      "title": "Direct Company Complaint",
      "subject_line": "Email/letter subject line",
      "letter_body": "The complete, ready-to-send letter. Professional, firm, legally informed. Include specific dates, amounts, and reference numbers from the user's description.",
      "send_to": [
        {
          "role": "Position/department",
          "how_to_find": "How to find this contact",
          "email_pattern": "Common email format if known"
        }
      ],
      "send_via": "How to send for maximum impact (email, certified mail, both?)",
      "deadline_to_set": "How many days to give them to respond",
      "leverage_points_used": ["What legal/regulatory points the letter references"]
    },

    "stage_2_regulatory": {
      "title": "Regulatory Complaint",
      "agency": "Specific agency name",
      "agency_url": "Filing URL",
      "why_this_agency": "Why this is the right regulatory body",
      "complaint_text": "Pre-written complaint text adapted for this agency",
      "what_happens_after": "What the agency does with the complaint — mandatory response timelines, investigation process",
      "company_impact": "Why companies take regulatory complaints seriously"
    },

    "stage_3_executive": {
      "title": "Executive Escalation",
      "subject_line": "Subject line for executive email",
      "letter_body": "Shorter, more direct letter referencing failed previous attempts and regulatory filing",
      "target_contacts": [
        {
          "title": "Executive title to target",
          "email_pattern": "Likely email format",
          "why": "Why this person"
        }
      ],
      "timing": "When to send relative to Stage 2"
    },

    "stage_4_public": {
      "title": "Public Pressure Campaign",
      "social_media_post": "Ready-to-post text — factual, specific, damaging through truth not anger. Under 280 characters for X/Twitter version.",
      "social_media_long": "Longer version for Facebook/LinkedIn/Reddit",
      "platforms_to_target": ["Where to post for maximum impact on THIS company"],
      "review_sites": ["Where to leave detailed reviews"],
      "hashtags": ["Relevant hashtags if applicable"],
      "media_tip": "If applicable — which local news consumer protection reporters or outlets cover this type of issue"
    },

    "stage_5_financial_legal": {
      "title": "Financial & Legal Remedies",
      "chargeback": {
        "applicable": true,
        "reason_code": "Specific chargeback reason code",
        "time_window": "How long you have to file",
        "how_to_file": "Step-by-step process",
        "documentation_needed": "What to include",
        "success_likelihood": "Estimated based on situation"
      },
      "small_claims": {
        "applicable": true,
        "jurisdiction": "Where to file",
        "filing_fee_range": "Typical cost",
        "max_claim_amount": "Jurisdictional limit",
        "typical_outcome": "How these cases usually resolve",
        "company_response": "Whether this company typically settles, sends a lawyer, or ignores"
      },
      "attorney_general": {
        "applicable": true,
        "how_to_file": "Process",
        "what_it_triggers": "What happens when you file"
      }
    }
  },

  "timeline": {
    "today": "Gather evidence, prepare documentation",
    "day_1": "Send Stage 1 letter",
    "day_14": "If no response, file Stage 2 regulatory complaint",
    "day_21": "Send Stage 3 executive escalation",
    "day_30": "If still unresolved, execute Stage 4 public pressure",
    "day_45": "If still unresolved, execute Stage 5 financial/legal remedies"
  },

  "quick_tips": [
    "Tactical tips specific to THIS company and situation — things the user might not think of"
  ]
}

═══════════════════════════════════════════════
CRITICAL RULES
═══════════════════════════════════════════════

1. SPECIFICITY: Reference specific laws by name and section. Reference specific regulatory agencies by name with filing URLs. Don't say "contact the relevant agency" — say "File a complaint with the FCC at consumercomplaints.fcc.gov" or "File with the CFPB at consumerfinance.gov/complaint."

2. READY-TO-USE: Every letter, complaint text, and social media post should be COMPLETE and ready to copy-paste-send. Don't write templates with [brackets] — fill in everything you can from the user's description. Use [YOUR NAME] and [YOUR ADDRESS] only for information you genuinely don't have.

3. TONE CALIBRATION: Follow the TONE instruction above. Apply it consistently across all 5 stages. The selected tone affects word choice, deadline lengths, and how directly legal consequences are referenced — but ALL tones remain factual and professional. Never angry, never threatening, never ranting. The power comes from being informed and specific, not emotional.

4. LEGAL HONESTY: Only cite laws and regulations you are confident apply. If you're unsure whether a specific statute applies, say "may apply depending on your state" rather than stating it definitively. Include a note that this is not legal advice.

5. COMPANY INTELLIGENCE: Use what you know about this specific company. If you know they're responsive on Twitter, say so. If you know they have executive customer service, provide the path. If you're not sure, provide the general approach for the industry.

6. CHARGEBACK SPECIFICITY: If the user paid by credit card, the chargeback section should include the specific reason code (e.g., "Visa reason code 13.1 — Merchandise/Services Not Received") and the exact time window. If card payment isn't mentioned, note that chargeback is available IF they paid by card.

7. Return ONLY the JSON object. No preamble, no markdown, no explanation outside the JSON.`;

    console.log(`[ComplaintEscalationWriter] Company: ${company}, Industry: ${industry || 'auto'}, Tone: ${tone || 'firm'}`);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    console.log(`[ComplaintEscalationWriter] Response: ${textContent.length} chars`);

    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);

    console.log(`[ComplaintEscalationWriter] Severity: ${parsed.situation_assessment?.severity}, Legal leverage: ${parsed.legal_leverage?.length || 0} items, Stages: 5`);
    res.json(parsed);

  } catch (error) {
    console.error('[ComplaintEscalationWriter] Error:', error);

    if (error instanceof SyntaxError) {
      console.error('[ComplaintEscalationWriter] JSON Parse Error:', error.message);
    }

    res.status(500).json({
      error: error.message || 'Failed to generate escalation campaign'
    });
  }
});

module.exports = router;
