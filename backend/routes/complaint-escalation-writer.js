const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ═══════════════════════════════════════════════════════════════
// RETRY HELPER — handles Anthropic 529 overloaded errors
// ═══════════════════════════════════════════════════════════════

async function withRetry(fn, { retries = 3, baseDelayMs = 1500 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.status ?? err?.error?.status;
      const isOverloaded = status === 529 || err?.error?.error?.type === 'overloaded_error';
      if (isOverloaded && attempt < retries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.warn(`[CEW] Anthropic overloaded (529), retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN CAMPAIGN GENERATION
// ═══════════════════════════════════════════════════════════════

router.post('/complaint-escalation-writer', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { company, issue, industry, previousAttempts, desiredOutcome, amountAtStake, hasDocumentation, tone, userLanguage } = req.body;

    if (!company?.trim()) return res.status(400).json({ error: 'Company name is required' });
    if (!issue?.trim())   return res.status(400).json({ error: 'Issue description is required' });

    const toneInstructions = {
      firm:       'Firm but professional. Clear, business-like, references legal rights calmly. This is the standard approach.',
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

Build a complete multi-stage escalation campaign. Return ONLY valid JSON (no markdown, no preamble):

{
  "situation_assessment": {
    "severity": "low | medium | high | critical",
    "company_reputation": "Brief assessment of how this company typically handles complaints",
    "legal_strength": "weak | moderate | strong",
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
      "time_limit_days": null,
      "time_limit_note": "Human-readable explanation of the deadline"
    }
  ],
  "evidence_checklist": [
    { "item": "What to gather", "why": "Why this matters", "how": "Specific instructions", "priority": "critical | important | helpful" }
  ],
  "escalation_stages": {
    "stage_1_direct": {
      "title": "Direct Company Complaint",
      "subject_line": "Email/letter subject line",
      "letter_body": "Complete ready-to-send letter",
      "send_to": [{ "role": "Position/department", "how_to_find": "How to find this contact", "email_pattern": "Common email format if known" }],
      "send_via": "How to send for maximum impact",
      "deadline_to_set": "How many days to give them",
      "leverage_points_used": ["Legal/regulatory points the letter references"]
    },
    "stage_2_regulatory": {
      "title": "Regulatory Complaint",
      "agency": "Specific agency name",
      "agency_url": "Filing URL",
      "why_this_agency": "Why this is the right regulatory body",
      "complaint_text": "Pre-written complaint text",
      "what_happens_after": "What the agency does with the complaint",
      "company_impact": "Why companies take regulatory complaints seriously"
    },
    "stage_3_executive": {
      "title": "Executive Escalation",
      "subject_line": "Subject line for executive email",
      "letter_body": "Shorter, more direct letter referencing failed previous attempts",
      "target_contacts": [{ "title": "Executive title", "email_pattern": "Likely email format", "why": "Why this person" }],
      "timing": "When to send relative to Stage 2"
    },
    "stage_4_public": {
      "title": "Public Pressure Campaign",
      "social_media_post": "Ready-to-post text under 280 characters for X/Twitter",
      "social_media_long": "Longer version for Facebook/LinkedIn/Reddit",
      "platforms_to_target": ["Where to post for maximum impact"],
      "review_sites": ["Where to leave detailed reviews"],
      "hashtags": ["Relevant hashtags"],
      "media_tip": "Which consumer protection reporters or outlets cover this type of issue"
    },
    "stage_5_financial_legal": {
      "title": "Financial & Legal Remedies",
      "chargeback": { "applicable": true, "reason_code": "Specific reason code", "time_window": "How long you have", "how_to_file": "Step-by-step process", "documentation_needed": "What to include", "success_likelihood": "Estimated based on situation" },
      "small_claims": { "applicable": true, "jurisdiction": "Where to file", "filing_fee_range": "Typical cost", "max_claim_amount": "Jurisdictional limit", "typical_outcome": "How these cases usually resolve", "company_response": "Whether company typically settles or sends a lawyer" },
      "attorney_general": { "applicable": true, "how_to_file": "Process", "what_it_triggers": "What happens when you file" }
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
  "quick_tips": ["Tactical tips specific to THIS company and situation"],
  "call_script": {
    "opening": "What to say when you pick up or place the call",
    "key_phrases": ["Exact phrases to use that protect your rights"],
    "things_to_avoid_saying": ["Phrases that could weaken your position"],
    "redirect_to_writing": "A polite but firm sentence to redirect to written communication",
    "if_they_pressure": "What to say if they pressure you to accept immediately"
  }
}`;

    const lang = withLanguage(userLanguage);

    const msg1 = await withRetry(() => anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      messages: [{ role: 'user', content: `${prompt}\n\n${lang}` }],
    }));
    const parsed = JSON.parse(cleanJsonResponse(msg1.content.find(i => i.type === 'text')?.text || ''));

    res.json(parsed);

  } catch (error) {
    console.error('[ComplaintEscalationWriter] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate escalation campaign' });
  }
});

// ═══════════════════════════════════════════════════════════════
// RESPONSE ANALYSIS
// ═══════════════════════════════════════════════════════════════

router.post('/complaint-escalation-writer/analyze-response', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { company, originalIssue, stage, companyResponse, desiredOutcome, userLanguage } = req.body;

    if (!companyResponse?.trim()) {
      return res.status(400).json({ error: 'Company response text is required' });
    }

    const prompt = `You are an expert consumer advocate. The user sent a complaint and received a response from the company. Analyze the response and advise on next steps.

COMPANY: ${company || 'Unknown'}
ORIGINAL ISSUE: ${originalIssue || 'Not provided'}
DESIRED OUTCOME: ${desiredOutcome || 'Not specified'}
COMPLAINT WAS SENT AT: Stage ${stage} of the escalation ladder
COMPANY'S RESPONSE:
---
${companyResponse.trim().slice(0, 5000)}
---

Return ONLY valid JSON:

{
  "response_type": "offer|partial_offer|rejection|deflection|acknowledgment|non_response|threat",
  "response_type_label": "Human-readable label for the response type",
  "assessment": "2-3 sentence plain-English assessment of what the company is actually saying",
  "tactics_used": ["Corporate tactics identified — e.g., 'delay tactic', 'blame-shifting', 'lowball offer', 'policy shield'"],
  "is_genuine": true,
  "genuineness_explanation": "Is this a genuine attempt to resolve, or a corporate deflection?",
  "offer_analysis": {
    "what_they_offered": "What specifically they're offering (or null if no offer)",
    "what_you_asked_for": "What the user originally wanted",
    "gap": "The difference between what was offered and what was requested",
    "fair_market_value": "Is the offer fair compared to what courts/regulators typically award?"
  },
  "recommendation": "accept|counter|escalate|wait",
  "recommendation_explanation": "Detailed explanation with specific reasoning",
  "if_accept": "What to watch for if accepting — any strings attached, things to get in writing",
  "if_counter": {
    "counter_offer_text": "Ready-to-send counter-offer response (complete, professional)",
    "target_amount_or_resolution": "What to counter with and why",
    "leverage_to_mention": "What leverage points to reference in the counter"
  },
  "if_escalate": {
    "next_stage": ${(stage || 1) + 1},
    "why": "Why escalation is warranted based on this response",
    "what_to_reference": "What from their response strengthens your position at the next stage"
  },
  "red_flags": ["Any concerning language or clauses — waiver language, 'final offer' claims, etc."],
  "things_to_get_in_writing": ["Anything from their response that should be confirmed in writing"]
}`;

    const lang = withLanguage(userLanguage);
    const msg2 = await withRetry(() => anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: `${prompt}\n\n${lang}` }],
    }));
    const parsed = JSON.parse(cleanJsonResponse(msg2.content.find(i => i.type === 'text')?.text || ''));

    res.json(parsed);

  } catch (error) {
    console.error('[CEW/analyze-response] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze response' });
  }
});

// ═══════════════════════════════════════════════════════════════
// REGENERATE STAGE — rebuild with full campaign context
// ═══════════════════════════════════════════════════════════════

router.post('/complaint-escalation-writer/regenerate-stage', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { company, issue, industry, desiredOutcome, amountAtStake, tone, targetStage, campaignHistory, userLanguage } = req.body;

    if (!targetStage || !company) {
      return res.status(400).json({ error: 'Company and target stage are required' });
    }

    const toneInstructions = {
      firm:       'Firm but professional.',
      aggressive: 'Assertive and direct with stronger legal language.',
      empathetic: 'Empathetic and resolution-focused.',
    };

    const historyNarrative = (campaignHistory || []).map(h =>
      `STAGE ${h.stage}: Sent on ${h.sentDate || 'unknown date'}.\n` +
      (h.companyResponse ? `COMPANY RESPONDED: "${h.companyResponse.slice(0, 1500)}"\n` : 'NO RESPONSE.\n') +
      (h.analysisResult ? `AI ANALYSIS: ${h.analysisResult.assessment || ''} Recommendation was: ${h.analysisResult.recommendation || 'escalate'}. Tactics identified: ${(h.analysisResult.tactics_used || []).join(', ')}` : '') +
      (h.outcome ? `\nOUTCOME: ${h.outcome}` : '')
    ).join('\n\n');

    const stageFormats = {
      2: `{"title":"Regulatory Complaint","agency":"Specific agency name","agency_url":"Filing URL","why_this_agency":"Why this is the right regulatory body","complaint_text":"Pre-written complaint text that REFERENCES the failed Stage 1 attempt","what_happens_after":"What the agency does","company_impact":"Why companies take this seriously"}`,
      3: `{"title":"Executive Escalation","subject_line":"Subject line referencing specific failure pattern","letter_body":"Letter weaving in SPECIFIC DETAILS from company actual responses","target_contacts":[{"title":"Executive title","email_pattern":"Likely email format","why":"Why this person"}],"timing":"When to send relative to Stage 2"}`,
      4: `{"title":"Public Pressure Campaign","social_media_post":"Under 280 chars — reference specific failures","social_media_long":"Longer version telling the whole story","platforms_to_target":["Where to post"],"review_sites":["Where to review"],"hashtags":["Relevant hashtags"],"media_tip":"Media angle if applicable"}`,
      5: `{"title":"Financial & Legal Remedies","chargeback":{"applicable":true,"reason_code":"Code","time_window":"Window","how_to_file":"Steps","documentation_needed":"Reference specific evidence gathered during campaign","success_likelihood":"Based on documented history"},"small_claims":{"applicable":true,"jurisdiction":"Where","filing_fee_range":"Cost","max_claim_amount":"Limit","typical_outcome":"How these resolve","company_response":"What company typically does"},"attorney_general":{"applicable":true,"how_to_file":"Process","what_it_triggers":"What happens"}}`,
    };

    const prompt = `You are an elite consumer advocacy strategist. Regenerate Stage ${targetStage} of an escalation campaign based on what has ACTUALLY HAPPENED so far.

COMPANY: ${company}
INDUSTRY: ${industry || 'Unknown'}
ORIGINAL ISSUE: ${issue}
DESIRED OUTCOME: ${desiredOutcome || 'Not specified'}
AMOUNT AT STAKE: ${amountAtStake || 'Not specified'}
TONE: ${toneInstructions[tone] || toneInstructions.firm}

═══ CAMPAIGN HISTORY — WHAT ACTUALLY HAPPENED ═══
${historyNarrative || 'No previous stage history available.'}

Generate ONLY Stage ${targetStage} content. Reference SPECIFIC things that happened during the campaign — dates, responses, offers made, tactics used. Return ONLY valid JSON matching this format:
${stageFormats[targetStage] || stageFormats[3]}`;

    const lang = withLanguage(userLanguage);
    const msg3 = await withRetry(() => anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: `${prompt}\n\n${lang}` }],
    }));
    const parsed = JSON.parse(cleanJsonResponse(msg3.content.find(i => i.type === 'text')?.text || ''));

    res.json(parsed);

  } catch (error) {
    console.error('[CEW/regenerate] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to regenerate stage' });
  }
});

// ═══════════════════════════════════════════════════════════════
// STREAMING ROUTE — primary campaign generation (streaming variant)
// Note: Uses raw anthropic.messages.stream — streaming cannot use callClaudeWithRetry
// ═══════════════════════════════════════════════════════════════

router.post('/complaint-escalation-writer/stream', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const { company, issue, industry, previousAttempts, desiredOutcome, amountAtStake, hasDocumentation, tone, userLanguage } = req.body;

  if (!company?.trim()) return res.status(400).json({ error: 'Company name is required' });
  if (!issue?.trim())   return res.status(400).json({ error: 'Issue description is required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const toneInstructions = {
      firm:       'Firm but professional. Clear, business-like, references legal rights calmly.',
      aggressive: 'Assertive and direct. Use stronger legal language, shorter deadlines, more explicit consequences.',
      empathetic: 'Empathetic and resolution-focused. Acknowledge front-line staff are not at fault.',
    };

    const lang = withLanguage(userLanguage);
    const prompt = `You are an elite consumer advocacy strategist. Build a complete consumer escalation campaign for the following:

COMPANY: ${company}
INDUSTRY: ${industry || 'Unknown — infer from the company name'}
ISSUE: ${issue}
PREVIOUS ATTEMPTS: ${previousAttempts || 'None mentioned'}
DESIRED OUTCOME: ${desiredOutcome || 'Not specified'}
AMOUNT AT STAKE: ${amountAtStake || 'Not specified'}
HAS DOCUMENTATION: ${hasDocumentation || 'Not specified'}
TONE: ${toneInstructions[tone] || toneInstructions.firm}

Return ONLY valid JSON with situation_assessment, legal_leverage, evidence_checklist, escalation_stages (stages 1-5), timeline, quick_tips, and call_script.\n\n${lang}`;

    let stream;
    for (let attempt = 0; attempt <= 3; attempt++) {
      try {
        stream = await anthropic.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 8000,
          messages: [{ role: 'user', content: prompt }],
        });
        break;
      } catch (err) {
        const status = err?.status ?? err?.error?.status;
        const isOverloaded = status === 529 || err?.error?.error?.type === 'overloaded_error';
        if (isOverloaded && attempt < 3) {
          const delay = 1500 * Math.pow(2, attempt);
          console.warn(`[CEW/stream] Overloaded (529), retrying in ${delay}ms (attempt ${attempt + 1}/3)`);
          await new Promise(r => setTimeout(r, delay));
        } else {
          throw err;
        }
      }
    }

    stream.on('text', (text) => sendEvent({ chunk: text }));
    await stream.finalMessage();
    sendEvent({ done: true });
    res.end();

  } catch (err) {
    console.error('[ComplaintEscalationWriter/stream] Error:', err);
    sendEvent({ error: err.message || 'Stream failed' });
    res.end();
  }
});

module.exports = router;
