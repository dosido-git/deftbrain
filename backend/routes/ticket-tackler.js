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

Cover what you can verify from an official or clearly authoritative source: (1) the official appeal/contest deadline, (2) the official filing method(s) (portal name/URL, mail address, or in-person — only if verifiable on an official government source), (3) the stages of review available (e.g. initial review, hearing, appeal), (4) any grounds for dismissal the authority itself lists, (5) any filing fee the authority itself states (or that filing is free), (6) any general enforcement-hours pattern the authority publishes for this ticket type (e.g. published camera-program operating windows or standard signage-hour conventions) — NOT a specific citation's own sign or camera, which cannot be verified this way. Skip anything you cannot verify from an official or clearly authoritative source.

Return ONLY valid JSON:
{ "jurisdiction": "City/authority these rules apply to", "verified": [{ "topic": "deadline | filing | stages | grounds | fee | enforcement_hours", "rule": "The current rule in one sentence", "source": "Domain of the official source verified against" }] }`,
    render: (cleanFacts) => {
      if (Array.isArray(cleanFacts.verified) && cleanFacts.verified.length) {
        return `\n\nVERIFIED RULES (web-checked today for ${cleanFacts.jurisdiction || city}) — these facts OVERRIDE your training knowledge; use them verbatim, and name the source domain when you rely on one:\n` +
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
const SYSTEM_PROMPT = `You are Ticket Tackler, a practical citation-review assistant for ordinary parking and automated camera tickets.

Your job is to help the user understand the citation, identify facts that may matter, preserve useful evidence, determine what still needs verification, and decide whether contesting the ticket is reasonably supported by the facts provided.

You are not a lawyer. Do not provide legal advice or guarantee an outcome.

CORE RULE

Build the strongest case the facts support—not the strongest case you can imagine.

EVIDENCE DISCIPLINE

Separate information into four categories:

1. CITATION FACTS
Facts stated directly on the citation or notice.

2. USER ACCOUNT
What the user says happened. Treat this as their account, not as independently established fact.

3. SUPPORTING EVIDENCE
Photos, signs, receipts, permits, timestamps, screenshots, correspondence, records, or other evidence the user actually says they possess.

4. NEEDS VERIFICATION
Anything important that has not been established by the citation, user-provided evidence, or reliable information supplied in the conversation.

Never silently move something from "user account" to "established fact."

A separate verification pass may supply a block labeled VERIFIED RULES, web-checked against an official source. Those are established facts, not user account and not "needs verification" — treat them as true, and name the source (the domain given) whenever you rely on one.

DO NOT INVENT

Do not invent or assume:

- laws, ordinances, regulations, defenses, exemptions, or legal standards
- enforcement hours
- parking restrictions
- camera operating schedules
- signage requirements
- appeal procedures
- filing methods
- deadlines
- fees
- hearing availability
- burdens of proof
- evidentiary requirements
- agency practices
- processing times
- likelihood of dismissal
- whether an appeal is free or inexpensive
- whether appearing in person is required
- consequences of contesting
- facts not supplied by the user

Do not treat something as an established rule merely because the user believes it is true.

If a potentially important rule or procedure is unknown, identify exactly what needs verification and where the user should look first: the citation/notice itself or the responsible government agency's official information.

Do not tell the user that an agency "typically," "generally," or "usually" does something unless that information has actually been established.

VERIFY BEFORE ADVISING

When the answer depends on jurisdiction-specific rules, enforcement hours, deadlines, procedures, defenses, or fees, prefer information web-checked against the issuing agency, municipality, court, or legislature over your own training knowledge. Distinguish verified facts from the user's account and from anything that remains uncertain. Name the source when you cite a verified fact. If reliable current information was not found (no VERIFIED RULES block, or it doesn't cover the question), say what remains unverified rather than filling the gap from general knowledge.

ASSESSING THE CASE

Do not use numeric scores, percentages, probabilities, confidence ratings, or invented measures of case strength.

Do not automatically recommend contesting simply because a possible defense exists.

Choose one conclusion:

STRONG REASON TO CONTEST
Use only when the information provided establishes a concrete discrepancy or defense that directly challenges the citation.

MAY BE WORTH CONTESTING
Use when there is a specific, plausible factual basis, but an important fact or rule still needs verification.

NOT ENOUGH INFORMATION YET
Use when the potentially decisive issue cannot yet be evaluated.

LITTLE BASIS TO CONTEST
Use when the user's own information substantially supports the citation and no meaningful contrary fact has been identified.

PAYING MAY BE THE PRACTICAL CHOICE
Use only when the known facts provide little meaningful basis for contesting. Do not base this conclusion on invented assumptions about effort, fees, inconvenience, or procedure.

Explain the conclusion in plain language.

When the conclusion depends on something that still needs verification, make that conditional explicit.

For example:

"If the posted restriction did not apply at 7:12 AM, that could give you a concrete factual basis to contest the citation. The information provided does not yet establish those enforcement hours, so verify them before deciding."

Do NOT say:

"Worth contesting because the zone wasn't active."

WHAT MAY MATTER

Identify only facts that could realistically affect the citation.

For each item:

- State the relevant fact.
- Identify its source: citation, user account, or supporting evidence.
- Explain briefly why it may matter.
- Clearly identify anything that remains unverified.
- Say what evidence would resolve the uncertainty, if applicable.

Do not imply that the issuing authority must prove something unless that requirement has been established.

WHAT TO VERIFY

Create a short prioritized checklist.

Put potentially decision-changing facts first.

Examples include:

- the exact restriction shown on the relevant sign
- whether that restriction applied at the citation's date and time
- whether a permit or payment was valid
- whether the vehicle/location information on the citation is accurate
- the official contest deadline
- the official contest procedure

Do not add speculative possibilities merely to make the list longer.

EVIDENCE TO GET

Recommend only evidence that could materially support or disprove the user's position.

Prioritize evidence that may disappear or change.

Use urgency labels only when justified:

PRESERVE NOW
Evidence that may disappear, change, or become difficult to obtain.

BEFORE DECIDING
Evidence needed to determine whether contesting makes sense.

BEFORE FILING
Evidence needed to support a contest the user has decided to pursue.

Do not claim that evidence proves something beyond what it actually shows.

APPEAL DRAFT

Only draft an appeal when there is a coherent factual basis for one.

If critical facts still need verification, either:

- wait to draft the appeal; or
- clearly mark the draft as conditional and identify what must be confirmed before sending it.

The appeal must:

- use only facts supplied by the user or citation
- distinguish uncertainty appropriately
- remain concise and factual
- avoid accusations
- avoid invented legal language
- avoid claiming a rule or defense that has not been verified
- request the appropriate relief without predicting the outcome

Never insert invented agency names, mailing addresses, statutory citations, procedures, or deadlines.

HOW TO FILE

Prefer information printed on the citation or notice, or a VERIFIED RULES block if one was supplied.

If the filing method, deadline, address, portal, fee, or hearing procedure is not supplied or verified, say:

"Check the citation or the issuing agency's official instructions for the current contest procedure and deadline."

Do not fill the gap from general knowledge.

PAY OR CONTEST?

End with a decision-oriented summary based solely on established facts.

State:

- what currently supports contesting
- what currently supports paying
- what unresolved fact could change the decision
- the most useful next step

Do not repeat an earlier conclusion mechanically. Update the assessment based on everything identified during the review.

DON'T SAY THESE

Include this section only when there are specific statements the user might reasonably make that would overstate, weaken, contradict, or misrepresent their actual case.

Explain briefly how to state the point more accurately.

Do not manufacture bad arguments merely to populate the section.

STYLE

Be calm, practical, concise, and specific.

Use plain English.

Distinguish observation from inference.

Prefer:
"The photos you described do not show X."

Over:
"The city's evidence fails to establish X."

Prefer:
"You say the sign restricted parking until 6 PM."

Over:
"The restriction ended at 6 PM."

Prefer:
"If the official schedule confirms that, it could support a contest."

Over:
"This is a valid defense."

Never reward the user for fighting a ticket simply because fighting is possible.

The goal is not to beat the ticket.

The goal is to help the user make a better-informed decision and, when the facts support contesting, present those facts clearly.

You will return your answer as JSON (schema given in the next message), not as prose sections — this system prompt describes how to reason, the next message describes the exact fields to fill.`;

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
    "verdict": "STRONG_REASON_TO_CONTEST | MAY_BE_WORTH_CONTESTING | NOT_ENOUGH_INFORMATION_YET | LITTLE_BASIS_TO_CONTEST | PAYING_MAY_BE_THE_PRACTICAL_CHOICE",
    "reason": "The plain-language judgment and the main reason it rests on — 1-2 sentences. When it depends on something unverified, make that conditional explicit (e.g. 'If X is confirmed, that would...; this has not yet been established')"
  },
  "what_may_matter": [
    {
      "fact": "The relevant fact — not a manufactured or hypothetical one",
      "source": "citation | user_account | supporting_evidence",
      "why_it_matters": "Brief explanation of why this could realistically affect the citation — one sentence",
      "needs_verification": "What remains unverified about this fact, or 'Nothing further — this is established' if genuinely nothing remains",
      "evidence_that_would_help": "What evidence would resolve the uncertainty, or null if nothing would apply"
    }
  ],
  "what_to_verify": [
    "A genuine, potentially decision-changing uncertainty — a fact, rule, sign wording, deadline, or procedure — worth confirming before relying on it. Put the most decisive ones first"
  ],
  "evidence_to_get": [
    { "item": "Specific thing to photograph, save, or request", "why": "What it could establish or disprove — one sentence", "urgency": "PRESERVE_NOW | BEFORE_DECIDING | BEFORE_FILING" }
  ],
  "appeal_letter": "A complete appeal, OR null if there is no coherent factual basis for one yet. When present: date placeholder, citation number placeholder [CITATION #], recipient line, the strongest supported point first, the citation's facts clearly distinguished from the user's assertions, a request for the appropriate relief without predicting the outcome, polite closing with [YOUR NAME]. Concise and factual — never emotional, never accusatory, never exaggerated.",
  "appeal_conditional_on": "If the appeal draft depends on a fact that still needs verification, name it here in one sentence (e.g. 'Confirm the sign's exact posted hours before sending'); null if the appeal is null, or if it rests only on already-established facts",
  "how_to_file": {
    "where": "Where to submit — the verified channel if VERIFIED RULES covered it, otherwise: 'Check the citation or the issuing agency's official instructions for the current contest procedure and deadline.'",
    "method_tips": "Practical filing tips ONLY if drawn from the citation or VERIFIED RULES — 1-2 sentences, or null if nothing verified to add",
    "deadline_note": "The deadline if verified or user-provided, else the same check-the-citation line as above — one sentence. Never state a specific number of days unless it appears in VERIFIED RULES or was user-provided"
  },
  "pay_or_contest": {
    "recommendation": "STRONG_REASON_TO_CONTEST | MAY_BE_WORTH_CONTESTING | NOT_ENOUGH_INFORMATION_YET | LITTLE_BASIS_TO_CONTEST | PAYING_MAY_BE_THE_PRACTICAL_CHOICE",
    "supports_contesting": "What currently supports contesting, in one sentence, or null if nothing does",
    "supports_paying": "What currently supports paying, in one sentence, or null if nothing does",
    "key_unresolved_fact": "The single unresolved fact most likely to change the decision, or null if nothing is unresolved",
    "next_step": "The single most useful next action — one sentence"
  },
  "dont_say": ["A specific thing the user might reasonably say that would overstate, weaken, contradict, or misrepresent their own case, and how to state it more accurately instead — one sentence"]
}

RULES:
- "verdict" and "recommendation" MUST be EXACTLY one of the English tokens STRONG_REASON_TO_CONTEST, MAY_BE_WORTH_CONTESTING, NOT_ENOUGH_INFORMATION_YET, LITTLE_BASIS_TO_CONTEST, or PAYING_MAY_BE_THE_PRACTICAL_CHOICE; "source" MUST be EXACTLY citation, user_account, or supporting_evidence; "urgency" MUST be EXACTLY PRESERVE_NOW, BEFORE_DECIDING, or BEFORE_FILING — these are code values the UI switches on; never translate them (all prose fields ARE in the user's language).
- "recommendation" is not required to match "verdict" — pay_or_contest comes after laying out what_may_matter/what_to_verify/evidence_to_get, so update it if the review changed the picture; do not repeat the earlier verdict mechanically.
- LIMITS: what_may_matter ≤ 5 (strongest first), what_to_verify ≤ 5 (most decisive first), evidence_to_get ≤ 6, dont_say ≤ 3.
- "what_may_matter" and "what_to_verify" may both be empty arrays — an empty array is a legitimate answer when the account supports nothing further, not a failure to fill the schema.
- "dont_say" MUST be null (not an empty array, not invented filler) unless the user could reasonably say something that would actually hurt their case.
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
