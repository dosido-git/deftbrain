const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ═══════════════════════════════════════════════════════════════
// MAIN CAMPAIGN GENERATION
// ═══════════════════════════════════════════════════════════════

router.post('/complaint-escalation-writer', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { company, issue, industry, previousAttempts, desiredOutcome, amountAtStake, hasDocumentation, tone, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!company?.trim()) return res.status(400).json({ error: 'Company name is required' });
    if (!issue?.trim())   return res.status(400).json({ error: 'Issue description is required' });

    const toneInstructions = {
      firm:       'Firm but professional. Clear, business-like, references legal rights calmly. This is the standard approach.',
      aggressive: 'Assertive and direct. Use stronger legal language, shorter deadlines (7 days instead of 14), more explicit consequences. Reference specific penalties and enforcement actions. Still professional — never rude — but unmistakably serious.',
      empathetic: 'Empathetic and resolution-focused. Acknowledge that front-line staff are not at fault. Frame the complaint as seeking fair resolution, not punishment. Still reference legal rights but frame them as context, not threats.'
    };

    // Split into two parallel calls (jargon-assassin pattern, 2026-07-19):
    // one 7-section schema at max_tokens 10000 ran ~6 min worst-case on rich
    // inputs. Stages (the letter-writing bulk) and strategy now run in
    // parallel; the merge reproduces the original response shape.
    // escalation_stages is the whole of this call — five full letters, and the
    // golden case measured 62-69s against the ~60s where Safari abandons the
    // fetch. There is nothing to trade it against, so the ladder itself is
    // split: the stages are independent documents and the keys stay disjoint,
    // so the two halves merge straight back into one escalation_stages object.
    const promptStagesEarly = `You are a consumer advocacy strategist
STANCE. You are a strategist, not a litigator. The visitor came here confused
and ignored; the job is to reduce that, not to arm them. Three rules that
override anything else in this prompt:

1. NO INVENTED PRECISION. Never give a success percentage, a probability, or
   any figure implying a dataset you do not have. "82% if the ladder is
   followed" reads as a model output and there is no model.
2. NO LEGAL CONCLUSIONS. You are not qualified to declare a violation from a
   paragraph of description. Never write "this is a clear violation" or "a
   direct, documentable violation". Write what is defensible: "based on what
   you have described, this appears inconsistent with <rule>, which may
   strengthen your position." State the rule confidently; state its
   application to THIS case tentatively.
3. NO ATTRIBUTED INTENT AND NO WAR. Do not claim a company designed its
   process to exhaust people, or characterise its motives at all — intent is
   unprovable and it is not your call. Do not coach pressure tactics: no
   "never soften this", no "never counter-propose", no framing a phone call as
   a trap with no paper trail. Where a public or regulatory step genuinely
   exists, describe it as an option with its trade-offs, not as a weapon.

Tone throughout: an informed, calm consumer who knows the process — not a
pre-litigation demand.

You are one who has helped thousands of people get results from unresponsive companies. You combine legal knowledge, corporate psychology, and escalation expertise to build multi-stage campaigns that companies cannot ignore.

COMPANY: ${company}
INDUSTRY: ${industry || 'Unknown — infer from the company name'}
ISSUE: ${issue}
PREVIOUS ATTEMPTS: ${previousAttempts || 'None mentioned'}
DESIRED OUTCOME: ${desiredOutcome || 'Not specified — recommend the most reasonable resolution'}
AMOUNT AT STAKE: ${amountAtStake || 'Not specified'}
HAS DOCUMENTATION: ${hasDocumentation || 'Not specified'}

TONE: ${toneInstructions[tone] || toneInstructions.firm}

REGULATORY CURRENCY: regulations change and get struck down — a letter citing a dead rule hands the company an easy rebuttal. Cite only rules you are confident are currently in force, with effective dates where known. Specifically: do NOT cite the FTC's 2024 "Click to Cancel" / Negative Option Rule amendments as in-force law (vacated by the 8th Circuit in 2025) — for subscription/cancellation complaints lean on ROSCA and state auto-renewal laws instead. When unsure whether a rule is current, assert the consumer right generically rather than naming the rule.

Build the complete 5-stage escalation ladder for THIS situation. Every letter body stays 2-4 sentences, ready to send verbatim.

{
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
    }
  }
}

Write ONLY the first three rungs of the ladder (stage_1_direct, stage_2_regulatory, stage_3_executive). The remaining stages are being written separately — do not include them, and do not renumber the ones you do write.

Never place a double-quote (") character inside any JSON string value — quoted phrases from the situation or dialogue must be written plainly or with single quotes, or the JSON breaks.
Return ONLY valid JSON with EXACTLY the keys shown (no markdown, no preamble).`;

    const promptStagesLate = `You are a consumer advocacy strategist
STANCE. You are a strategist, not a litigator. The visitor came here confused
and ignored; the job is to reduce that, not to arm them. Three rules that
override anything else in this prompt:

1. NO INVENTED PRECISION. Never give a success percentage, a probability, or
   any figure implying a dataset you do not have. "82% if the ladder is
   followed" reads as a model output and there is no model.
2. NO LEGAL CONCLUSIONS. You are not qualified to declare a violation from a
   paragraph of description. Never write "this is a clear violation" or "a
   direct, documentable violation". Write what is defensible: "based on what
   you have described, this appears inconsistent with <rule>, which may
   strengthen your position." State the rule confidently; state its
   application to THIS case tentatively.
3. NO ATTRIBUTED INTENT AND NO WAR. Do not claim a company designed its
   process to exhaust people, or characterise its motives at all — intent is
   unprovable and it is not your call. Do not coach pressure tactics: no
   "never soften this", no "never counter-propose", no framing a phone call as
   a trap with no paper trail. Where a public or regulatory step genuinely
   exists, describe it as an option with its trade-offs, not as a weapon.

Tone throughout: an informed, calm consumer who knows the process — not a
pre-litigation demand.

You are one who has helped thousands of people get results from unresponsive companies. You combine legal knowledge, corporate psychology, and escalation expertise to build multi-stage campaigns that companies cannot ignore.

COMPANY: ${company}
INDUSTRY: ${industry || 'Unknown — infer from the company name'}
ISSUE: ${issue}
PREVIOUS ATTEMPTS: ${previousAttempts || 'None mentioned'}
DESIRED OUTCOME: ${desiredOutcome || 'Not specified — recommend the most reasonable resolution'}
AMOUNT AT STAKE: ${amountAtStake || 'Not specified'}
HAS DOCUMENTATION: ${hasDocumentation || 'Not specified'}

TONE: ${toneInstructions[tone] || toneInstructions.firm}

REGULATORY CURRENCY: regulations change and get struck down — a letter citing a dead rule hands the company an easy rebuttal. Cite only rules you are confident are currently in force, with effective dates where known. Specifically: do NOT cite the FTC's 2024 "Click to Cancel" / Negative Option Rule amendments as in-force law (vacated by the 8th Circuit in 2025) — for subscription/cancellation complaints lean on ROSCA and state auto-renewal laws instead. When unsure whether a rule is current, assert the consumer right generically rather than naming the rule.

Build the complete 5-stage escalation ladder for THIS situation. Every letter body stays 2-4 sentences, ready to send verbatim.

{
  "escalation_stages": {
    "stage_4_public": {
      "title": "Public Pressure Campaign",
      "social_media_post": "Ready-to-post text under 280 characters for X/Twitter",
      "social_media_long": "Longer version for Facebook/LinkedIn/Reddit",
      "platforms_to_target": ["Where to post for maximum impact"],
      "review_sites": ["Where to leave detailed reviews"],
      "hashtags": ["Relevant hashtags"],
      "media_tip": "Where this kind of issue is usually covered, and what going public does and does not tend to achieve — including the downsides"
    },
    "stage_5_financial_legal": {
      "title": "Financial & Legal Remedies",
      "chargeback": { "applicable": true, "reason_code": "Specific reason code", "time_window": "How long you have", "how_to_file": "Step-by-step process", "documentation_needed": "What to include", "success_likelihood": "Estimated based on situation" },
      "small_claims": { "applicable": true, "jurisdiction": "Where to file", "filing_fee_range": "Typical cost", "max_claim_amount": "Jurisdictional limit", "typical_outcome": "How these cases usually resolve", "company_response": "Whether company typically settles or sends a lawyer" },
      "attorney_general": { "applicable": true, "how_to_file": "Process", "what_it_triggers": "What happens when you file" }
    }
  }
}

Write ONLY the last two rungs of the ladder (stage_4_public, stage_5_financial_legal). The remaining stages are being written separately — do not include them, and do not renumber the ones you do write.

Never place a double-quote (") character inside any JSON string value — quoted phrases from the situation or dialogue must be written plainly or with single quotes, or the JSON breaks.
Return ONLY valid JSON with EXACTLY the keys shown (no markdown, no preamble).`;

    const promptStrategy = `You are a consumer advocacy strategist
STANCE. You are a strategist, not a litigator. The visitor came here confused
and ignored; the job is to reduce that, not to arm them. Three rules that
override anything else in this prompt:

1. NO INVENTED PRECISION. Never give a success percentage, a probability, or
   any figure implying a dataset you do not have. "82% if the ladder is
   followed" reads as a model output and there is no model.
2. NO LEGAL CONCLUSIONS. You are not qualified to declare a violation from a
   paragraph of description. Never write "this is a clear violation" or "a
   direct, documentable violation". Write what is defensible: "based on what
   you have described, this appears inconsistent with <rule>, which may
   strengthen your position." State the rule confidently; state its
   application to THIS case tentatively.
3. NO ATTRIBUTED INTENT AND NO WAR. Do not claim a company designed its
   process to exhaust people, or characterise its motives at all — intent is
   unprovable and it is not your call. Do not coach pressure tactics: no
   "never soften this", no "never counter-propose", no framing a phone call as
   a trap with no paper trail. Where a public or regulatory step genuinely
   exists, describe it as an option with its trade-offs, not as a weapon.

Tone throughout: an informed, calm consumer who knows the process — not a
pre-litigation demand.

You are one who has helped thousands of people get results from unresponsive companies. You combine legal knowledge, corporate psychology, and escalation expertise to build multi-stage campaigns that companies cannot ignore.

COMPANY: ${company}
INDUSTRY: ${industry || 'Unknown — infer from the company name'}
ISSUE: ${issue}
PREVIOUS ATTEMPTS: ${previousAttempts || 'None mentioned'}
DESIRED OUTCOME: ${desiredOutcome || 'Not specified — recommend the most reasonable resolution'}
AMOUNT AT STAKE: ${amountAtStake || 'Not specified'}
HAS DOCUMENTATION: ${hasDocumentation || 'Not specified'}

TONE: ${toneInstructions[tone] || toneInstructions.firm}

REGULATORY CURRENCY: regulations change and get struck down — leverage citing a dead rule hands the company an easy rebuttal. Cite only rules you are confident are currently in force, with effective dates where known. Specifically: do NOT cite the FTC's 2024 "Click to Cancel" / Negative Option Rule amendments as in-force law (vacated by the 8th Circuit in 2025) — for subscription/cancellation complaints lean on ROSCA and state auto-renewal laws instead. When unsure whether a rule is current, assert the consumer right generically rather than naming the rule.

Build the strategy layer for THIS situation. Keep arrays tight: at most 3 legal_leverage entries, 4 evidence_checklist items, and 3 quick_tips — include ONLY the most impactful. Your response MUST contain ALL SIX top-level keys — situation_assessment, legal_leverage, evidence_checklist, timeline, quick_tips, call_script — never omit any of them. Every timeline value MUST be ONE plain string (a short action sentence) — never a nested object or array; use the exact keys shown (today, day_1, day_14, day_21, day_30, day_45).

{
  "situation_assessment": {
    "severity": "low | medium | high | critical",
    "company_reputation": "What is publicly known about how complaints of this kind are usually handled in this industry — process and typical timelines only. Do NOT attribute intent, strategy or bad faith to this company.",
    "legal_strength": "weak | moderate | strong",
    "key_insight": "The single most important thing the user should know about their situation"
  },

  "legal_leverage": [
    {
      "law_or_regulation": "Specific law name and section",
      "what_it_protects": "What right it gives the consumer",
      "how_it_applies": "How it may apply to THIS situation — hedged. 'Based on what you described, this appears inconsistent with…' Never 'this is a violation'.",
      "consequence_for_company": "What the rule obliges the company to do, and what is at stake for them if it is not met. Describe the rule, not their guilt.",
      "strength": "strong | moderate | informational",
      "time_limit_days": null,
      "time_limit_note": "Human-readable explanation of the deadline"
    }
  ],

  "evidence_checklist": [
    { "item": "What to gather", "why": "Why this matters", "how": "Specific instructions", "priority": "critical | important | helpful" }
  ],

  "timeline": {
    "today": "Gather evidence, prepare documentation",
    "day_1": "Send Stage 1 letter",
    "day_14": "If no response, file Stage 2 regulatory complaint",
    "day_21": "Send Stage 3 executive escalation",
    "day_30": "If still unresolved, the option of going public — described as a choice with trade-offs, not an attack to execute",
    "day_45": "If still unresolved, execute Stage 5 financial/legal remedies"
  },

  "quick_tips": ["Practical, non-adversarial tips for THIS situation — what to keep, what to put in writing, what to expect. Not pressure tactics, and never phrased as a rule the visitor must never break."],

  "call_script": {
    "opening": "What to say when you pick up or place the call",
    "key_phrases": ["Exact phrases that keep the record clear and the request specific — the voice of an informed, calm consumer. Not threats of regulatory or legal action."],
    "things_to_avoid_saying": ["Phrases that could weaken your position"],
    "redirect_to_writing": "A polite but firm sentence to redirect to written communication",
    "if_they_pressure": "What to say if they pressure you to accept immediately"
  }
}

Never place a double-quote (") character inside any JSON string value — quoted phrases from the situation or dialogue must be written plainly or with single quotes, or the JSON breaks.
Return ONLY valid JSON with EXACTLY the keys shown (no markdown, no preamble).`;


    const [stagesEarly, stagesLate, strategyPart] = await Promise.all([
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 3500,
        system: withLanguage('You are a consumer advocacy strategist. STANCE. You are a strategist, not a litigator. The visitor came here confused and ignored; the job is to reduce that, not to arm them. Three rules that override anything else in this prompt: 1. NO INVENTED PRECISION. Never give a success percentage, a probability, or any figure implying a dataset you do not have. "82% if the ladder is followed" reads as a model output and there is no model. 2. NO LEGAL CONCLUSIONS. You are not qualified to declare a violation from a paragraph of description. Never write "this is a clear violation" or "a direct, documentable violation". Write what is defensible: "based on what you have described, this appears inconsistent with <rule>, which may strengthen your position." State the rule confidently; state its application to THIS case tentatively. 3. NO ATTRIBUTED INTENT AND NO WAR. Do not claim a company designed its process to exhaust people, or characterise its motives at all — intent is unprovable and it is not your call. Do not coach pressure tactics: no "never soften this", no "never counter-propose", no framing a phone call as a trap with no paper trail. Where a public or regulatory step genuinely exists, describe it as an option with its trade-offs, not as a weapon. Tone throughout: an informed, calm consumer who knows the process — not a pre-litigation demand. You are one. Return ONLY valid JSON matching the exact schema requested.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: promptStagesEarly }]
      }, { label: 'ComplaintEscalation-stages' }),
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 3500,
        system: withLanguage('You are a consumer advocacy strategist. STANCE. You are a strategist, not a litigator. The visitor came here confused and ignored; the job is to reduce that, not to arm them. Three rules that override anything else in this prompt: 1. NO INVENTED PRECISION. Never give a success percentage, a probability, or any figure implying a dataset you do not have. "82% if the ladder is followed" reads as a model output and there is no model. 2. NO LEGAL CONCLUSIONS. You are not qualified to declare a violation from a paragraph of description. Never write "this is a clear violation" or "a direct, documentable violation". Write what is defensible: "based on what you have described, this appears inconsistent with <rule>, which may strengthen your position." State the rule confidently; state its application to THIS case tentatively. 3. NO ATTRIBUTED INTENT AND NO WAR. Do not claim a company designed its process to exhaust people, or characterise its motives at all — intent is unprovable and it is not your call. Do not coach pressure tactics: no "never soften this", no "never counter-propose", no framing a phone call as a trap with no paper trail. Where a public or regulatory step genuinely exists, describe it as an option with its trade-offs, not as a weapon. Tone throughout: an informed, calm consumer who knows the process — not a pre-litigation demand. You are one. Return ONLY valid JSON matching the exact schema requested.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: promptStagesLate }]
      }, { label: 'ComplaintEscalation-stages-late' }),
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 4000,
        system: withLanguage('You are a consumer advocacy strategist. STANCE. You are a strategist, not a litigator. The visitor came here confused and ignored; the job is to reduce that, not to arm them. Three rules that override anything else in this prompt: 1. NO INVENTED PRECISION. Never give a success percentage, a probability, or any figure implying a dataset you do not have. "82% if the ladder is followed" reads as a model output and there is no model. 2. NO LEGAL CONCLUSIONS. You are not qualified to declare a violation from a paragraph of description. Never write "this is a clear violation" or "a direct, documentable violation". Write what is defensible: "based on what you have described, this appears inconsistent with <rule>, which may strengthen your position." State the rule confidently; state its application to THIS case tentatively. 3. NO ATTRIBUTED INTENT AND NO WAR. Do not claim a company designed its process to exhaust people, or characterise its motives at all — intent is unprovable and it is not your call. Do not coach pressure tactics: no "never soften this", no "never counter-propose", no framing a phone call as a trap with no paper trail. Where a public or regulatory step genuinely exists, describe it as an option with its trade-offs, not as a weapon. Tone throughout: an informed, calm consumer who knows the process — not a pre-litigation demand. You are one. Return ONLY valid JSON matching the exact schema requested.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: promptStrategy }]
      }, { label: 'ComplaintEscalation-strategy' }),
    ]);
    // The two halves each return an escalation_stages object holding their own
    // rungs; disjoint keys, so one spread rebuilds the full five-stage ladder.
    const parsed = {
      ...strategyPart,
      escalation_stages: { ...(stagesEarly.escalation_stages || {}), ...(stagesLate.escalation_stages || {}) },
    };

    // The UI renders each timeline value directly as text. If the model nests
    // an object/array here (seen live: {actions: [...]} — crashed React to a
    // blank page), flatten it to a string.
    if (parsed.timeline && typeof parsed.timeline === 'object') {
      for (const k of Object.keys(parsed.timeline)) {
        const v = parsed.timeline[k];
        if (typeof v === 'string') continue;
        if (Array.isArray(v)) parsed.timeline[k] = v.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' ');
        else if (v && typeof v === 'object') {
          const inner = Array.isArray(v.actions) ? v.actions : Object.values(v).flat();
          parsed.timeline[k] = inner.map(x => typeof x === 'string' ? x : JSON.stringify(x)).join(' ');
        } else parsed.timeline[k] = String(v ?? '');
      }
    }

    if (!parsed.situation_assessment) {
      return res.status(500).json({ error: 'Could not draft the escalation. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[ComplaintEscalationWriter] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// RESPONSE ANALYSIS
// ═══════════════════════════════════════════════════════════════

router.post('/complaint-escalation-writer/analyze-response', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { company, originalIssue, stage, companyResponse, desiredOutcome, userLanguage, userLocale, userCurrency, userRegion } = req.body;

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
    "why": "Why escalation is warranted based on this response",
    "what_to_reference": "What from their response strengthens your position at the next stage"
  },
  "red_flags": ["Any concerning language or clauses — waiver language, 'final offer' claims, etc."],
  "things_to_get_in_writing": ["Anything from their response that should be confirmed in writing"]
}`;

    const lang = withLanguage('', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion);
    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      messages: [{ role: 'user', content: `${prompt}\n\n${lang}` }]
    }, { label: 'CEWAnalyzeResponse' });

    if (!parsed.response_type) {
      return res.status(500).json({ error: 'Could not analyze the company response. Please try again.' });
    }
    res.json(parsed);
  } catch (err) {
    console.error('[CEW analyze-response]', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// REGENERATE STAGE — rebuild with full campaign context
// ═══════════════════════════════════════════════════════════════

router.post('/complaint-escalation-writer/regenerate-stage', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { company, issue, industry, desiredOutcome, amountAtStake, tone, targetStage, campaignHistory, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!targetStage || !company) {
      return res.status(400).json({ error: 'Company and target stage are required' });
    }

    const toneInstructions = {
      firm:       'Firm but professional.',
      aggressive: 'Assertive and direct with stronger legal language.',
      empathetic: 'Empathetic and resolution-focused.'
    };

    const historyNarrative = (campaignHistory || []).map(h =>
      `STAGE ${h.stage}: Sent on ${h.sentDate || 'unknown date'}.\n` +
      (h.companyResponse ? `COMPANY RESPONDED: "${h.companyResponse.slice(0, 1500)}"\n` : 'NO RESPONSE.\n') +
      (h.analysisResult ? `AI ANALYSIS: ${h.analysisResult.assessment || ''} Recommendation was: ${h.analysisResult.recommendation || 'escalate'}. Tactics identified: ${(h.analysisResult.tactics_used || []).join(', ')}` : '') +
      (h.outcome ? `\nOUTCOME: ${h.outcome}` : '')
    ).join('\n\n');

    const stageFormats = {
      2: `{"title": "Regulatory Complaint","agency": "Specific agency name","agency_url": "Filing URL","why_this_agency": "Why this is the right regulatory body","complaint_text": "Pre-written complaint text that REFERENCES the failed Stage 1 attempt","what_happens_after": "What the agency does","company_impact": "Why companies take this seriously"}`,
      3: `{"title": "Executive Escalation","subject_line": "Subject line referencing specific failure pattern","letter_body": "Letter weaving in SPECIFIC DETAILS from company actual responses","target_contacts":[{"title": "Executive title","email_pattern": "Likely email format","why": "Why this person"}],"timing": "When to send relative to Stage 2"}`,
      4: `{"title": "Public Pressure Campaign","social_media_post": "Under 280 chars — reference specific failures","social_media_long": "Longer version telling the whole story","platforms_to_target":["Where to post"],"review_sites":["Where to review"],"hashtags":["Relevant hashtags"],"media_tip": "Media angle if applicable"}`,
      5: `{"title": "Financial & Legal Remedies","chargeback":{"applicable":true,"reason_code":"Code","time_window": "Window","how_to_file":"Steps","documentation_needed": "Reference specific evidence gathered during campaign","success_likelihood": "Based on documented history"},"small_claims":{"applicable":true,"jurisdiction":"Where","filing_fee_range":"Cost","max_claim_amount":"Limit","typical_outcome": "How these resolve","company_response": "What company typically does"},"attorney_general":{"applicable":true,"how_to_file": "Process","what_it_triggers": "What happens"}}`
    };

    const prompt = `You are a consumer advocacy strategist
STANCE. You are a strategist, not a litigator. The visitor came here confused
and ignored; the job is to reduce that, not to arm them. Three rules that
override anything else in this prompt:

1. NO INVENTED PRECISION. Never give a success percentage, a probability, or
   any figure implying a dataset you do not have. "82% if the ladder is
   followed" reads as a model output and there is no model.
2. NO LEGAL CONCLUSIONS. You are not qualified to declare a violation from a
   paragraph of description. Never write "this is a clear violation" or "a
   direct, documentable violation". Write what is defensible: "based on what
   you have described, this appears inconsistent with <rule>, which may
   strengthen your position." State the rule confidently; state its
   application to THIS case tentatively.
3. NO ATTRIBUTED INTENT AND NO WAR. Do not claim a company designed its
   process to exhaust people, or characterise its motives at all — intent is
   unprovable and it is not your call. Do not coach pressure tactics: no
   "never soften this", no "never counter-propose", no framing a phone call as
   a trap with no paper trail. Where a public or regulatory step genuinely
   exists, describe it as an option with its trade-offs, not as a weapon.

Tone throughout: an informed, calm consumer who knows the process — not a
pre-litigation demand.

You are one. Regenerate Stage ${targetStage} of an escalation campaign based on what has ACTUALLY HAPPENED so far.

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

    const lang = withLanguage('', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion);
    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      messages: [{ role: 'user', content: `${prompt}\n\n${lang}` }]
    }, { label: 'CEWRegenerateStage' });

    if (!parsed.title) {
      return res.status(500).json({ error: 'Could not regenerate the stage. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[CEW/regenerate] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});


module.exports = router;
