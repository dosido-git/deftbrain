const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/complaint-escalation-writer', async (req, res) => {
  try {
    const { company, issue, industry, previousAttempts, desiredOutcome, amountAtStake, hasDocumentation, tone, userLanguage } = req.body;

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

    const prompt = withLanguage(`You are an elite consumer advocacy strategist who has helped thousands of people get results from unresponsive companies. You combine legal knowledge, corporate psychology, and escalation expertise to build multi-stage campaigns that companies cannot ignore.

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
      "strength": "strong | moderate | informational",
      "time_limit_days": "Number of days from the incident within which you must act under this law (or null if no deadline). Be specific — e.g., 60 for credit card chargebacks, 180 for CFPB complaints, varies by state for small claims.",
      "time_limit_note": "Human-readable explanation of the deadline, e.g., '60 days from statement date' or '2 years from date of injury'"
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
  ],

  "call_script": {
    "opening": "What to say when you pick up or place the call — identify yourself and the issue in one sentence",
    "key_phrases": ["Exact phrases to use during the call that protect your rights and create leverage — e.g., 'I'd like to receive that offer in writing before I respond', 'Please note this call may be recorded', 'What is your full name and employee ID for my records?'"],
    "things_to_avoid_saying": ["Phrases that could weaken your position — e.g., 'I accept', 'That sounds fair', 'I guess that works', 'I'll think about it' (without a deadline)"],
    "redirect_to_writing": "A polite but firm sentence to redirect the conversation to written communication — companies prefer phone calls because there's no paper trail",
    "if_they_pressure": "What to say if they pressure you to accept immediately or claim the offer expires"
  }
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

7. Return ONLY the JSON object. No preamble, no markdown, no explanation outside the JSON.`, userLanguage);

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

// ═══════════════════════════════════════════════════════════════
// RESPONSE ANALYSIS — "They responded, now what?"
// ═══════════════════════════════════════════════════════════════

router.post('/complaint-escalation-writer/analyze-response', async (req, res) => {
  try {
    const { company, originalIssue, stage, companyResponse, desiredOutcome, userLanguage } = req.body;

    if (!companyResponse?.trim()) {
      return res.status(400).json({ error: 'Company response text is required' });
    }

    console.log(`[CEW/analyze-response] Company: ${company}, Stage: ${stage}`);

    const prompt = withLanguage(`You are an expert consumer advocate. The user sent a complaint and received a response from the company. Analyze the response and advise on next steps.

COMPANY: ${company || 'Unknown'}
ORIGINAL ISSUE: ${originalIssue || 'Not provided'}
DESIRED OUTCOME: ${desiredOutcome || 'Not specified'}
COMPLAINT WAS SENT AT: Stage ${stage} of the escalation ladder
COMPANY'S RESPONSE:
---
${companyResponse.trim().slice(0, 5000)}
---

Analyze this response and return ONLY valid JSON:

{
  "response_type": "offer|partial_offer|rejection|deflection|acknowledgment|non_response|threat",
  "response_type_label": "Human-readable label for the response type",
  "assessment": "2-3 sentence plain-English assessment of what the company is actually saying and doing",
  "tactics_used": ["Corporate tactics identified in this response — e.g., 'delay tactic', 'blame-shifting', 'lowball offer', 'policy shield', 'goodwill gesture without admission'"],
  "is_genuine": true,
  "genuineness_explanation": "Is this a genuine attempt to resolve, or a corporate deflection? Explain why.",
  "offer_analysis": {
    "what_they_offered": "What specifically they're offering (or null if no offer)",
    "what_you_asked_for": "What the user originally wanted",
    "gap": "The difference between what was offered and what was requested",
    "fair_market_value": "Is the offer fair compared to what courts/regulators typically award for this type of issue?"
  },
  "recommendation": "accept|counter|escalate|wait",
  "recommendation_explanation": "Detailed explanation of why this recommendation, with specific reasoning",
  "if_accept": "What to watch for if accepting — any strings attached, things to get in writing",
  "if_counter": {
    "counter_offer_text": "Ready-to-send counter-offer response (complete, professional)",
    "target_amount_or_resolution": "What to counter with and why",
    "leverage_to_mention": "What leverage points to reference in the counter"
  },
  "if_escalate": {
    "next_stage": ${stage + 1},
    "why": "Why escalation is warranted based on this response",
    "what_to_reference": "What from their response strengthens your position at the next stage"
  },
  "red_flags": ["Any concerning language or clauses in their response — waiver language, 'final offer' claims, etc."],
  "things_to_get_in_writing": ["Anything from their response that should be confirmed in writing before proceeding"]
}

CRITICAL:
- "counter_offer_text" must be a complete, ready-to-send response — not a template
- Be honest about whether the offer is fair — don't always recommend escalation
- "tactics_used" should identify specific corporate communication strategies
- If the response includes any waiver or release language, flag it prominently in red_flags`, userLanguage);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);

    console.log(`[CEW/analyze-response] Type: ${parsed.response_type}, Recommendation: ${parsed.recommendation}`);
    res.json(parsed);

  } catch (error) {
    console.error('[CEW/analyze-response] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze response' });
  }
});

// ═══════════════════════════════════════════════════════════════
// REGENERATE STAGE — rebuild a stage letter with full campaign context
// ═══════════════════════════════════════════════════════════════

router.post('/complaint-escalation-writer/regenerate-stage', async (req, res) => {
  try {
    const { company, issue, industry, desiredOutcome, amountAtStake, tone, targetStage, campaignHistory, originalStageData, userLanguage } = req.body;

    if (!targetStage || !company) {
      return res.status(400).json({ error: 'Company and target stage are required' });
    }

    const toneInstructions = {
      firm: 'Firm but professional.',
      aggressive: 'Assertive and direct with stronger legal language.',
      empathetic: 'Empathetic and resolution-focused.',
    };

    // Build campaign history narrative
    const historyNarrative = (campaignHistory || []).map(h =>
      `STAGE ${h.stage}: Sent on ${h.sentDate || 'unknown date'}.\n` +
      (h.companyResponse ? `COMPANY RESPONDED: "${h.companyResponse.slice(0, 1500)}"\n` : 'NO RESPONSE.\n') +
      (h.analysisResult ? `AI ANALYSIS: ${h.analysisResult.assessment || ''} Recommendation was: ${h.analysisResult.recommendation || 'escalate'}. Tactics identified: ${(h.analysisResult.tactics_used || []).join(', ')}` : '') +
      (h.outcome ? `\nOUTCOME: ${h.outcome}` : '')
    ).join('\n\n');

    const stageFormats = {
      2: `{
  "title": "Regulatory Complaint",
  "agency": "Specific agency name",
  "agency_url": "Filing URL",
  "why_this_agency": "Why this is the right regulatory body",
  "complaint_text": "Pre-written complaint text that REFERENCES the failed Stage 1 attempt and the company's actual response (or non-response). Include specific dates, what was said, and why regulatory intervention is now necessary.",
  "what_happens_after": "What the agency does with the complaint",
  "company_impact": "Why companies take this seriously"
}`,
      3: `{
  "title": "Executive Escalation",
  "subject_line": "Subject line — should reference the specific failure pattern from previous stages",
  "letter_body": "A letter that weaves in SPECIFIC DETAILS from the company's actual responses (or non-responses). Reference dates, names, offers made, tactics used. This executive should understand that you have documented everything and that previous stages have already been executed. Much more powerful than a generic escalation letter.",
  "target_contacts": [{ "title": "Executive title", "email_pattern": "Likely email format", "why": "Why this person" }],
  "timing": "When to send relative to Stage 2"
}`,
      4: `{
  "title": "Public Pressure Campaign",
  "social_media_post": "Under 280 chars for X/Twitter — reference specific failures from the campaign. Not generic anger — specific documented facts that make the company look bad.",
  "social_media_long": "Longer version that tells the whole story: what happened, what you did about it (Stage 1-3), how the company responded at each step, and where things stand now.",
  "platforms_to_target": ["Where to post"],
  "review_sites": ["Where to review"],
  "hashtags": ["Relevant hashtags"],
  "media_tip": "Media angle if applicable"
}`,
      5: `{
  "title": "Financial & Legal Remedies",
  "chargeback": { "applicable": true, "reason_code": "Code", "time_window": "Window", "how_to_file": "Steps", "documentation_needed": "What to include — reference specific evidence gathered during campaign", "success_likelihood": "Based on documented history" },
  "small_claims": { "applicable": true, "jurisdiction": "Where", "filing_fee_range": "Cost", "max_claim_amount": "Limit", "typical_outcome": "How these resolve", "company_response": "What company typically does" },
  "attorney_general": { "applicable": true, "how_to_file": "Process", "what_it_triggers": "What happens" }
}`,
    };

    console.log(`[CEW/regenerate] Stage ${targetStage} for ${company}, history: ${campaignHistory?.length || 0} entries`);

    const prompt = withLanguage(`You are an elite consumer advocacy strategist. You are regenerating Stage ${targetStage} of an escalation campaign based on what has ACTUALLY HAPPENED during the campaign so far.

COMPANY: ${company}
INDUSTRY: ${industry || 'Unknown'}
ORIGINAL ISSUE: ${issue}
DESIRED OUTCOME: ${desiredOutcome || 'Not specified'}
AMOUNT AT STAKE: ${amountAtStake || 'Not specified'}
TONE: ${toneInstructions[tone] || toneInstructions.firm}

═══ CAMPAIGN HISTORY — WHAT ACTUALLY HAPPENED ═══
${historyNarrative || 'No previous stage history available.'}

═══ INSTRUCTIONS ═══
Generate ONLY the Stage ${targetStage} content. This is NOT a pre-written template — this letter/complaint must reference SPECIFIC things that happened during the campaign:
- Specific dates when actions were taken
- Specific responses (or non-responses) from the company
- Specific offers made and why they were insufficient
- Specific tactics the company used (delay, deflection, lowball, etc.)
- The documented pattern of behavior across stages

The power of this letter comes from its SPECIFICITY. A company that reads "you failed to respond to my complaint" is unimpressed. A company that reads "On January 15, your representative Maria offered $50 as a goodwill gesture for a $459 billing error, after I had already filed FCC complaint #12345 and your own regulatory response team acknowledged the error in their February 2 letter" takes notice.

Return ONLY valid JSON matching this format:
${stageFormats[targetStage] || stageFormats[3]}`, userLanguage);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);

    console.log(`[CEW/regenerate] Stage ${targetStage} regenerated: ${textContent.length} chars`);
    res.json(parsed);

  } catch (error) {
    console.error('[CEW/regenerate] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to regenerate stage' });
  }
});

module.exports = router;
