// ticket-tackler.js — Ticket Tackler: understand a citation, and decide
// whether it's actually worth contesting.
// Positioning (deliberate): a writing + evidence tool that helps the user
// understand their own case and draft their own appeal WHEN ONE IS WARRANTED
// — never an "AI lawyer", never an outcome promise, never a manufactured case.
const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { groundedFacts, normalizeKeyPart, stripCites } = require('../lib/groundedFacts');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — quoted ticket text, signage wording, or things-to-say must be written plainly or with single quotes, or it breaks the JSON.';

const TYPE_LABELS = {
  parking: 'parking ticket',
  camera:  'automated camera ticket (red-light or speed camera)',
};

// Grounded facts PRE-PASS (shared lib/groundedFacts.js pattern + cache):
// appeal deadlines and filing procedures are hyper-local and volatile — the
// textbook invented-procedure risk. Verified or generic, never invented.
// This is the "VERIFIED RULES" evidence category the main prompt below
// distinguishes from the citation, the user's account, and their evidence.
async function groundAppealFacts({ city, ticketType }) {
  return groundedFacts({
    cacheKey: `ticket-appeal:${normalizeKeyPart(city)}:${normalizeKeyPart(ticketType)}`,
    label: 'ticket-tackler-facts',
    userPrompt: `Verify with web_search, as of today, how a ${TYPE_LABELS[ticketType] || 'parking ticket'} is contested in: ${city}.

Cover ONLY: (1) the official appeal/contest deadline, (2) the official filing method(s) (portal name/URL, mail address, or in-person — only if verifiable on an official government source), (3) the stages of review available (e.g. initial review, hearing, appeal), (4) any grounds for dismissal the authority itself lists. Skip anything you cannot verify from an official or clearly authoritative source.

Return ONLY valid JSON:
{ "jurisdiction": "City/authority these rules apply to", "verified": [{ "topic": "deadline | filing | stages | grounds", "rule": "The current rule in one sentence", "source": "Domain of the official source verified against" }] }`,
    render: (cleanFacts) => {
      if (Array.isArray(cleanFacts.verified) && cleanFacts.verified.length) {
        return `\n\nVERIFIED RULES (web-checked today for ${cleanFacts.jurisdiction || city}) — these facts OVERRIDE your training knowledge; use them verbatim:\n` +
          cleanFacts.verified.map(f => `- [${f.topic}] ${f.rule} (source: ${f.source})`).join('\n');
      }
      return '';
    },
  });
}

// The owner-authored system prompt — Ticket Tackler's identity, evidence
// discipline, and output philosophy. Kept as one block (system, not per-call
// schema text) because it defines HOW the tool reasons regardless of what any
// one ticket says. DO NOT silently reverse any of these rules to make output
// look more complete or more "useful" — a shorter, defensible answer is the
// explicit design goal, not a shortfall.
const SYSTEM_PROMPT = `You are Ticket Tackler, a DeftBrain tool for ordinary parking and automated camera citations.

Your job is to help the user understand the citation, assess whether the facts they supplied reveal a plausible basis for contesting it, preserve useful evidence, and prepare a clear factual appeal when appropriate.

You are not a lawyer and must not guarantee an outcome.

EVIDENCE FIRST

Separate these sources of information:

1. THE CITATION — facts actually shown on the ticket.
2. THE USER'S ACCOUNT — facts the user reports but that have not independently been verified.
3. SUPPORTING EVIDENCE — photographs, documents, signs, receipts, records, or other evidence actually supplied.
4. VERIFIED RULES — applicable requirements or procedures confirmed from an authoritative source, if available.

Never silently convert one category into another.

If the user says a sign read "7AM–6PM," say "the sign as you describe it" until the wording is visible in supplied evidence or otherwise verified.

Do not invent facts, defenses, procedural rules, fees, deadlines, filing methods, evidentiary requirements, or local law.

JURISDICTION MATTERS

A citation is jurisdiction-specific.

Do not state that a defense is legally valid merely because it sounds reasonable.

When current local rules or procedures have not been verified, distinguish:
- what the user's facts suggest;
- what needs confirmation;
- where the user should verify it.

Never fabricate a statute's meaning from its citation number.

ASSESSMENT

Assess the case using only supported facts.

Do not manufacture defense angles to make the result more useful.

A factual inconsistency between the citation and supplied evidence can be important.

A sympathetic explanation is not automatically a defense.

An unclear fact is an uncertainty, not evidence in the user's favor.

It is acceptable to conclude:
- worth considering an appeal;
- uncertain — verify something first;
- probably not worth contesting based on what was supplied.

Do not assign numerical case-strength scores or probabilities. A 9/10 score implies predictive precision you do not have.

DEFENSE ANGLES

Include only distinct, supportable issues.

For each:
- state the issue;
- identify what supports it;
- identify what still needs verification;
- identify evidence that would strengthen or resolve it.

Do not state legal conclusions such as "no violation was in effect" or "the city cannot enforce this" unless that conclusion is supported by verified applicable rules.

EVIDENCE

Prioritize evidence that:
- may disappear or change;
- directly establishes a disputed fact;
- identifies the exact location, sign, vehicle, citation, or relevant condition.

Never claim that a photograph establishes more than it actually shows.

For example, a street-view photograph does not establish that a particular sign was "the only sign governing that stretch of curb" unless the evidence actually demonstrates that.

APPEAL LETTER

Draft an appeal only when there is at least one plausible supported basis for contesting the citation.

Keep it:
- factual;
- concise;
- respectful;
- organized around the strongest supported point.

Clearly distinguish the citation's facts from the user's assertions.

Do not exaggerate.

Do not introduce legal claims, statutory interpretations, procedural claims, or facts that were not established.

If an important fact still needs verification, use a placeholder or conditional wording rather than pretending it has been established.

FILING INFORMATION

Never invent or rely on remembered filing procedures.

If current authoritative filing information has been verified, provide it and identify the source.

Otherwise tell the user exactly what to verify on the citation or official jurisdiction website.

Do not calculate a deadline from ambiguous wording unless the calculation is unambiguous and the triggering date is established.

PAY VS. CONTEST

Do not invent:
- filing fees;
- hearing costs;
- preparation time;
- probability of success;
- monetary value of the user's time.

Use known facts such as the fine amount and any verified filing requirements.

Then give a plain-language judgment based on:
- strength of the supported factual issue;
- evidence available or obtainable;
- amount at stake;
- procedural burden if known.

Explain the reasoning rather than manufacturing decision math.

DO NOT SAY THESE

Include this section only when the user's proposed explanation or wording contains something that could materially weaken or distract from the supported case.

Do not invent hypothetical mistakes merely to populate the section.

OUTPUT

Return only sections that add value:

ASSESSMENT
A short plain-language judgment and the main reason.

WHAT MAY MATTER
The strongest supported issues, ordered by importance.

WHAT TO VERIFY
Facts, rules, sign wording, deadlines, or procedures that genuinely remain uncertain.

EVIDENCE TO GET
A prioritized, practical list, emphasizing evidence that may disappear.

YOUR APPEAL
Only when there is a supported basis for one.

HOW TO FILE
Only with verified information; otherwise explain what the user should verify and where.

PAY OR CONTEST?
A concise practical judgment without invented probabilities, costs, or time estimates.

DON'T SAY THESE
Optional, only when warranted by the user's actual proposed argument.

You will return this as JSON (schema given in the next message), not as prose sections — the section names above describe what each JSON field is for.

FINAL CHECK

Before returning the answer, ask:

Did I turn something the user told me into a verified fact?

Did I interpret a law or regulation without verifying it?

Did I invent a local rule, procedure, fee, deadline, probability, time estimate, or legal consequence?

Did I claim evidence proves something it does not prove?

Did I create a weak defense merely because the output format expected another one?

If yes, remove or qualify it.

A shorter, defensible answer is better than a comprehensive-looking appeal built on invented certainty.`;

router.post('/ticket-tackler', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      ticketType, ticketText, ticketImageBase64, imageMediaType,
      city, whatHappened, fineAmount, deadline,
      userLanguage, userLocale, userCurrency, userRegion,
    } = req.body;

    if (!city || !city.trim()) {
      return res.status(400).json({ error: 'City or jurisdiction is required' });
    }
    if (!ticketText?.trim() && !ticketImageBase64 && !whatHappened?.trim()) {
      return res.status(400).json({ error: 'Paste the ticket, upload a photo, or describe what happened' });
    }

    const typeLabel = TYPE_LABELS[ticketType] || TYPE_LABELS.parking;

    const imageBlocks = [];
    if (ticketImageBase64) {
      const commaIndex = ticketImageBase64.indexOf(',');
      const rawBase64 = commaIndex !== -1 ? ticketImageBase64.substring(commaIndex + 1) : ticketImageBase64;
      imageBlocks.push({ type: 'image', source: { type: 'base64', media_type: imageMediaType || 'image/jpeg', data: rawBase64 } });
      imageBlocks.push({ type: 'text', text: 'The image above is the ticket/citation (THE CITATION category). Read every field on it (violation code, date, time, location, amount, deadline) and use those details.' });
    }

    const verifiedBlock = await groundAppealFacts({ city: city.trim(), ticketType });

    const userPrompt = `Review this ${typeLabel} and decide whether it is worth contesting.

TICKET TYPE: ${typeLabel}
CITY / JURISDICTION: ${city.trim()}
${fineAmount ? `FINE AMOUNT (as entered by the user): ${String(fineAmount).slice(0, 40)}` : ''}
${deadline ? `APPEAL DEADLINE (as entered by the user): ${String(deadline).slice(0, 60)}` : ''}
${ticketText?.trim() ? `\nTHE CITATION (pasted text):\n${ticketText.trim().slice(0, 6000)}` : ''}
${whatHappened?.trim() ? `\nTHE USER'S ACCOUNT (not independently verified):\n${whatHappened.trim().slice(0, 4000)}` : ''}
${imageBlocks.length ? '\nThe citation was also provided as a photo above (THE CITATION category).' : ''}
${verifiedBlock}

Return ONLY valid JSON (no markdown, no preamble, no code fences):

{
  "assessment": {
    "verdict": "WORTH_CONTESTING | VERIFY_FIRST | PROBABLY_PAY",
    "reason": "The short plain-language judgment and the main reason it rests on — 1-2 sentences"
  },
  "what_may_matter": [
    {
      "issue": "Short name of the supported issue — not a manufactured or hypothetical one",
      "supports_it": "What in the citation, account, or evidence supports this — one sentence",
      "needs_verification": "What still needs confirming before this issue is solid — one sentence, or 'Nothing further — this is established' if genuinely nothing remains",
      "evidence_that_would_help": "What would strengthen or resolve it — one sentence"
    }
  ],
  "what_to_verify": [
    "A genuine uncertainty — a fact, rule, sign wording, deadline, or procedure — worth confirming before relying on it"
  ],
  "evidence_to_get": [
    { "item": "Specific thing to photograph, save, or request", "why": "What it establishes — one sentence", "urgency": "today | before_filing" }
  ],
  "appeal_letter": "A complete ready-to-send appeal letter, OR null if there is no plausible supported basis for one. When present: date placeholder, citation number placeholder [CITATION #], recipient line, the strongest supported point first, the citation's facts clearly distinguished from the user's assertions, a clear request (dismissal or review), polite closing with [YOUR NAME]. 120-200 words. Factual tone — never emotional, never accusatory, never exaggerated.",
  "how_to_file": {
    "where": "Where to submit — the verified channel if VERIFIED RULES covered it, otherwise how to find the official one (one sentence)",
    "method_tips": "Practical filing tips for this jurisdiction/type — 1-2 sentences",
    "deadline_note": "The deadline if verified or user-provided, else tell the user to check the date printed on the citation — one sentence. Never state a specific number of days unless it appears in VERIFIED RULES or was user-provided"
  },
  "pay_or_contest": {
    "recommendation": "WORTH_CONTESTING | VERIFY_FIRST | PROBABLY_PAY",
    "reasoning": "A plain-language judgment weighing the strength of the supported issue, the evidence available or obtainable, the amount at stake, and the procedural burden if known — 2-3 sentences. No invented fees, hearing costs, time estimates, or probabilities."
  },
  "dont_say": ["A specific thing in the user's own account or proposed wording that could weaken or distract from the supported case, and why — one sentence"]
}

RULES:
- "verdict" and "recommendation" MUST be EXACTLY one of the English tokens WORTH_CONTESTING, VERIFY_FIRST, or PROBABLY_PAY, and "urgency" MUST be EXACTLY today or before_filing — these are code values the UI switches on; never translate them (all prose fields ARE in the user's language).
- LIMITS: what_may_matter ≤ 5 (strongest first), what_to_verify ≤ 5, evidence_to_get ≤ 6, dont_say ≤ 3.
- "what_may_matter" and "what_to_verify" may both be empty arrays — an empty array is a legitimate answer when the account supports nothing further, not a failure to fill the schema.
- "dont_say" MUST be null (not an empty array, not invented filler) unless the user's own account or wording actually contains something that could hurt their case.
- Cite a specific statute/ordinance section number ONLY when certain it is exactly right; otherwise describe the rule without a section number.
- Keep every string field to the stated length. Never restate the same point across fields.
- ${NO_QUOTE_RULE}`;

    const content = imageBlocks.length
      ? [...imageBlocks, { type: 'text', text: userPrompt }]
      : userPrompt;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage(SYSTEM_PROMPT, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content }],
    }, { label: 'ticket-tackler' });

    if (!parsed.assessment) {
      return res.status(500).json({ error: 'Could not analyze your ticket. Please try again.' });
    }
    res.json(stripCites(parsed));
  } catch (error) {
    console.error('[TicketTackler]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ── FOLLOW-UP Q&A ──────────────────────────────────────────────
router.post('/ticket-tackler/followup', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { question, analysisContext, city, ticketType, userLanguage, userLocale, userCurrency, userRegion } = req.body;
    if (!question?.trim()) return res.status(400).json({ error: 'What do you want to know?' });

    const prompt = withLanguage(`Answer a follow-up question about a ${TYPE_LABELS[ticketType] || 'parking ticket'} in ${city || 'the stated jurisdiction'}.

PRIOR ANALYSIS (summary): ${String(analysisContext || 'N/A').slice(0, 3000)}
QUESTION: ${question.trim().slice(0, 1000)}

RULES: honest and practical; never promise outcomes; never invent portals, phone numbers, deadlines, fees, or probabilities — point to the ticket itself or the official channel generically when unverified. ${NO_QUOTE_RULE}

Return ONLY valid JSON:
{
  "answer": "Clear, direct answer — 2-4 sentences",
  "watch_out": "A pitfall related to this question, or null",
  "next_step": "The single most useful next action, or null"
}

Your response MUST contain ALL 3 keys: answer, watch_out, next_step.`, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage('Practical ticket-appeal advocate. Direct, honest, protective — you are not a lawyer and never guarantee an outcome. Return ONLY valid JSON. No markdown.', userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'ticket-tackler-followup' });
    if (!parsed.answer) {
      return res.status(500).json({ error: 'Could not answer that. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[TicketTackler/followup]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
