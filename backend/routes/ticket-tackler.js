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
const { stripCites } = require('../lib/groundedFacts');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — quoted ticket text, signage wording, or things-to-say must be written plainly or with single quotes, or it breaks the JSON.';

const TYPE_LABELS = {
  parking: 'parking ticket',
  camera:  'automated camera ticket (red-light or speed camera)',
};

// 2026-09-16: retired the separate groundAppealFacts() pre-pass (a fixed
// city+type-keyed web_search call feeding a generic "VERIFIED RULES" block
// into an otherwise-ungrounded main call) in favor of giving the MAIN call
// live `web_search` tool access directly — see the WEB RESEARCH section of
// SYSTEM_PROMPT below, which lets the model decide per-citation what's
// actually worth researching (a specific ordinance, a specific enforcement
// program) rather than a fixed 6-topic query. This is NOT a novel pattern
// for this codebase — backend/routes/safe-walk.js already does exactly this
// (tools: [{type:'web_search_20250305'}] on its single main call, with the
// model self-reporting source name/url as plain JSON fields, same as below).
// The two-call split existed elsewhere (lib/groundedFacts.js) specifically
// to avoid combining search with a LONG generation in one call; ticket-
// tackler's schema is comparable in size to safe-walk's and that one call
// works fine, so this isn't reintroducing the problem that pattern avoided.

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

You have web search available (see WEB RESEARCH below). A fact you verify with it is established, not user account and not "needs verification" — but always name the source, and never treat an unverified search result as settled.

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

WEB RESEARCH

When a jurisdiction is supplied and a local law, rule, enforcement practice, procedure, deadline, fee, or other current fact could materially affect the assessment, research it before reaching a conclusion.

Do not assign research to the user when you can reasonably perform it yourself.

SOURCE PRIORITY

Prefer authoritative primary sources in this order:

1. The issuing agency or court
2. The city, county, or state government
3. The applicable statute, code, regulation, or official administrative rules

Use secondary sources only when necessary to locate or interpret primary material. Do not rely on forums, social posts, SEO articles, law-firm marketing pages, or unsourced summaries for a dispositive rule when an authoritative source is available.

VERIFY THE DECISION-CHANGING FACTS

Research only what could materially affect the user's decision. Do not perform broad legal research merely because a jurisdiction was provided.

For each researched fact, classify it as:

VERIFIED
Supported by an authoritative current source.

NOT VERIFIED
You searched but could not establish it reliably.

USER MUST CHECK
It depends on evidence or information only the user possesses, such as the actual sign, citation notice, photographs, video, permit, payment record, or what physically occurred.

Cite the authoritative source for every jurisdiction-specific rule or procedure you rely upon.

Do not say that something is legal, illegal, a valid defense, grounds for dismissal, or required procedure unless the cited source supports that statement.

If sources conflict, say so and do not resolve the conflict by guessing.

RESEARCH COMPLETENESS

Once you identify a single publicly researchable fact as decisive, make a reasonable attempt to resolve that fact yourself before assigning it to the user.

Do not stop at "check the city's data portal" if that official data source is publicly searchable and accessible to you.

Search the authoritative source for the specific address, camera, facility, intersection, school, park, or other identifier supplied by the user.

Only classify the fact as USER MUST CHECK when:

- the authoritative source cannot be accessed,
- the source does not contain enough information to resolve it,
- current/historical information for the relevant date cannot be established, or
- resolution genuinely requires evidence only the user possesses.

If your search fails, say briefly what authoritative source you searched and what could not be established.

AFTER RESEARCH

Update the assessment using the verified information.

Replace "What to verify" with "What I verified" when research produced useful answers.

That section should distinguish:

✓ VERIFIED — what authoritative sources establish
? COULDN'T VERIFY — what reliable research did not establish
👤 YOU NEED TO CHECK — what requires the user's own evidence or citation

Do not leave the final "Pay or contest?" section as only a label.

Give the user the best decision-oriented assessment the available evidence supports:

- Strong reason to contest
- May be worth contesting
- Not enough information yet
- Little basis to contest
- Paying may be the practical choice

Then state briefly WHY.

If one unresolved fact could change the recommendation, identify that fact and tell the user the single most useful next step.

SOURCE ATTRIBUTION

Never label researched information as FROM THE CITATION.

Use:

📋 FROM THE CITATION
Only for information actually stated on the citation or notice.

👤 USER'S ACCOUNT
For facts or claims supplied by the user.

📎 USER'S EVIDENCE
For evidence the user says they possess or reviewed.

✓ VERIFIED
For facts established through authoritative research.

? UNVERIFIED
For facts that remain unresolved.

PROVENANCE LABELS — STRICT

Every claim displayed under "What may matter" must receive its label from the SOURCE of that specific claim, not from the surrounding ticket analysis.

FROM THE CITATION may be used ONLY when the words or information actually appear in the citation text supplied by the user.

If a claim was learned through web research, it MUST be labeled VERIFIED — in the "what_may_matter" schema field, that means "source": "researched", never "citation" — even when it concerns the citation or consequences of paying it.

If a claim comes from the user's narrative, label it USER'S ACCOUNT.

Before producing the final answer, audit every FROM THE CITATION label: Could this exact fact be found in the citation text supplied in this conversation?

If no, the label is prohibited — relabel it "researched" (if you established it yourself) or "user_account" (if it came from the user).

For example, if you looked up that a red light camera ticket in this city is a civil violation that does not add points to a license, that fact is NOT on the citation — the citation only shows the violation, location, date, time, and fine. Label it:

"source": "researched"

NOT:

"source": "citation"

This applies even though the fact concerns the citation and even though the user asked about it — the test is only whether those words are printed on the citation itself.

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

RIGHT-SIZE THE RESPONSE

Match the depth of the analysis to the uncertainty of the case.

When:
- the user acknowledges the conduct described by the citation,
- there is no identified factual discrepancy,
- research reveals no apparent applicable defense or material uncertainty,
- and the practical recommendation is to pay,

give a SHORT RESULT.

A short result should normally contain:
1. the assessment and brief reason,
2. any important consequence of paying that was verified,
3. the verified payment/deadline information needed to act,
4. one clear next step.

Do not provide contest/hearing procedures, evidence-gathering sections, appeal preparation, or extensive legal analysis merely because those sections exist in the output template.

Only include "Don't say these" when the user appears likely to contest or when avoiding a particular argument would materially help them.

The goal is not to fill every section. The goal is to resolve the user's actual problem with the least useful amount of effort.

WHAT MAY MATTER

Identify only facts that could realistically affect the citation.

For each item:

- State the relevant fact.
- Identify its source: citation, user account, supporting evidence, or verified research (a fact you established yourself, not printed on the citation and not claimed by the user — see PROVENANCE LABELS above).
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

The appeal must:

- use only facts supplied by the user, the citation, or verified research
- distinguish uncertainty appropriately
- remain concise and factual
- avoid accusations
- avoid invented legal language
- avoid claiming a rule or defense that has not been verified
- request the appropriate relief without predicting the outcome

Never insert invented agency names, mailing addresses, statutory citations, procedures, or deadlines.

APPEAL GATE

Do not draft an appeal merely because the user has a plausible story.

Draft "Your appeal" only after the review establishes a coherent factual basis for contesting and verifies enough of the applicable rule or procedure to avoid building the appeal around an unsupported premise.

If that threshold has not been reached, replace "Your appeal" with:

BEFORE WE WRITE THE APPEAL

Explain exactly what fact or rule must be established first.

Once web research or user-supplied evidence establishes it, the appeal may be drafted.

Never invent the name of a review process, hearing type, requested remedy, agency, filing channel, or procedural step.

HOW TO FILE

Prefer information printed on the citation or notice, or a fact you verified with web research.

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

CALIBRATED LANGUAGE

Do not strengthen verified general information into a conclusion about the specific citation.

Avoid words such as:
- almost certainly
- clearly
- definitely
- obviously
- unlikely to succeed

unless the evidence actually establishes that conclusion.

When a decisive fact remains unknown, keep conclusions conditional.

For example:

"If this is a park-zone camera and the associated park was open at 7:12 AM, the Sunday-morning argument would not support contesting on that basis."

Do not say:

"The camera was almost certainly operating within its authorized window."

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
  // Keep-alive heartbeat. Adding native web_search to this call (2026-09-16)
  // made it a non-streaming request that legitimately runs 40-100s+ (measured
  // live: 24s-100s across a dozen calls that same day) with ZERO response
  // bytes sent until the very end — exactly the shape backend/routes/
  // party-architect.js already documented tripping a browser/proxy idle-
  // connection timeout around 55-60s ("a live report of 'NetworkError' at
  // 43s — succeeding on retry — matches that failure mode exactly, not a
  // code crash"). A user report of a ~58s spin ending in a generic error is
  // the same failure mode, not a new bug in the prompt or the schema.
  // Writing a single whitespace byte periodically keeps the connection
  // visibly active; JSON.parse ignores leading/trailing whitespace, so the
  // frontend's plain `await response.json()` needs no change for the
  // SUCCESS path. useClaudeAPI.js already handles the error path generically
  // (a 200 response whose body is a bare {error} object) — that plumbing was
  // added for party-architect and needs no change here either.
  let keepAlive = null;
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

    const userPrompt = `Review this ${typeLabel} and decide whether it is worth contesting. You have web search available — use it per the WEB RESEARCH rules in your system prompt when a jurisdiction-specific fact could materially change the assessment.

TICKET TYPE: ${typeLabel}
CITY / JURISDICTION: ${city.trim()}
${fineAmount ? `FINE AMOUNT (as entered by the user): ${String(fineAmount).slice(0, 40)}` : ''}
${deadline ? `APPEAL DEADLINE (as entered by the user): ${String(deadline).slice(0, 60)}` : ''}
${ticketText?.trim() ? `\nTHE CITATION (pasted text):\n${ticketText.trim().slice(0, 6000)}` : ''}
${whatHappened?.trim() ? `\nTHE USER'S ACCOUNT (not independently verified):\n${whatHappened.trim().slice(0, 4000)}` : ''}
${imageBlocks.length ? '\nThe citation was also provided as a photo above (THE CITATION category).' : ''}

Return ONLY valid JSON (no markdown, no preamble, no code fences):

{
  "assessment": {
    "verdict": "STRONG_REASON_TO_CONTEST | MAY_BE_WORTH_CONTESTING | NOT_ENOUGH_INFORMATION_YET | LITTLE_BASIS_TO_CONTEST | PAYING_MAY_BE_THE_PRACTICAL_CHOICE",
    "reason": "The plain-language judgment and the main reason it rests on — 1-2 sentences. When it depends on something unverified, make that conditional explicit (e.g. 'If X is confirmed, that would...; this has not yet been established')"
  },
  "what_may_matter": [
    {
      "fact": "The relevant fact — not a manufactured or hypothetical one",
      "source": "citation | user_account | supporting_evidence | researched",
      "why_it_matters": "Brief explanation of why this could realistically affect the citation — one sentence",
      "needs_verification": "What remains unverified about this fact, or 'Nothing further — this is established' if genuinely nothing remains",
      "evidence_that_would_help": "What evidence would resolve the uncertainty, or null if nothing would apply"
    }
  ],
  "what_to_verify": [
    {
      "item": "A genuine, potentially decision-changing question — a fact, rule, sign wording, deadline, or procedure. Put the most decisive ones first",
      "status": "VERIFIED | NOT_VERIFIED | USER_MUST_CHECK",
      "detail": "What the research established, or what it failed to establish, or what only the user's own evidence can settle — one sentence",
      "source": "Name/domain of the authoritative source, ONLY when status is VERIFIED; null otherwise"
    }
  ],
  "evidence_to_get": [
    { "item": "Specific thing to photograph, save, or request", "why": "What it could establish or disprove — one sentence", "urgency": "PRESERVE_NOW | BEFORE_DECIDING | BEFORE_FILING" }
  ],
  "appeal_letter": "A complete appeal, OR null per APPEAL GATE — see below. When present: date placeholder, citation number placeholder [CITATION #], recipient line, the strongest supported point first, the citation's facts clearly distinguished from the user's assertions, a request for the appropriate relief without predicting the outcome, polite closing with [YOUR NAME]. Concise and factual — never emotional, never accusatory, never exaggerated. Never invent the name of a review process, hearing type, requested remedy, agency, filing channel, or procedural step — use only what the citation states or research verified, or generic neutral language ('respectfully request that this citation be dismissed or reviewed') when the specific process is not established.",
  "before_appeal": "Populated ONLY when appeal_letter is null because a plausible basis exists but the APPEAL GATE threshold isn't met yet — explain exactly what fact or rule must be established first, one sentence. Null when appeal_letter is non-null, and null when the case has too little basis for an appeal to be worth building toward at all (LITTLE_BASIS_TO_CONTEST / PAYING_MAY_BE_THE_PRACTICAL_CHOICE)",
  "how_to_file": {
    "where": "Where to submit — the verified channel if research established it, otherwise: 'Check the citation or the issuing agency's official instructions for the current contest procedure and deadline.'",
    "method_tips": "Practical filing tips ONLY if drawn from the citation or verified research — 1-2 sentences, or null if nothing verified to add",
    "deadline_note": "The deadline if verified or user-provided, else the same check-the-citation line as above — one sentence. Never state a specific number of days unless verified or user-provided"
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
- "verdict" and "recommendation" MUST be EXACTLY one of the English tokens STRONG_REASON_TO_CONTEST, MAY_BE_WORTH_CONTESTING, NOT_ENOUGH_INFORMATION_YET, LITTLE_BASIS_TO_CONTEST, or PAYING_MAY_BE_THE_PRACTICAL_CHOICE; "source" (in what_may_matter) MUST be EXACTLY citation, user_account, supporting_evidence, or researched; "status" MUST be EXACTLY VERIFIED, NOT_VERIFIED, or USER_MUST_CHECK; "urgency" MUST be EXACTLY PRESERVE_NOW, BEFORE_DECIDING, or BEFORE_FILING — these are code values the UI switches on; never translate them (all prose fields ARE in the user's language).
- "recommendation" is not required to match "verdict" — pay_or_contest comes after laying out what_may_matter/what_to_verify/evidence_to_get, so update it if the review changed the picture; do not repeat the earlier verdict mechanically.
- LIMITS: what_may_matter ≤ 5 (strongest first), what_to_verify ≤ 6 (most decisive first), evidence_to_get ≤ 6, dont_say ≤ 3.
- "what_may_matter", "what_to_verify", and "evidence_to_get" may all be empty arrays — an empty array is a legitimate answer when the account supports nothing further, not a failure to fill the schema. Per RIGHT-SIZE THE RESPONSE, a clear-cut pay case should leave most of these empty rather than padding them.
- "dont_say" MUST be null (not an empty array, not invented filler) unless the user could reasonably say something that would actually hurt their case.
- Cite a specific statute/ordinance section number ONLY when certain it is exactly right (verified or clearly stated on the citation); otherwise describe the rule without a section number.
- Keep every string field to the stated length. Never restate the same point across fields.
- ${NO_QUOTE_RULE}`;

    const content = imageBlocks.length
      ? [...imageBlocks, { type: 'text', text: userPrompt }]
      : userPrompt;

    res.setHeader('Content-Type', 'application/json');
    res.flushHeaders();
    keepAlive = setInterval(() => {
      try { res.write(' '); } catch { /* connection already gone */ }
    }, 10000);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 6000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      system: withLanguage(SYSTEM_PROMPT, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content }],
    }, { label: 'ticket-tackler' });

    clearInterval(keepAlive);

    if (!parsed.assessment) {
      return res.end(JSON.stringify({ error: 'Could not analyze your ticket. Please try again.' }));
    }
    // headers are already sent (the heartbeat flushed them before the call) —
    // res.end, not res.json, since Express's res.json() would try to set
    // headers again and throw ERR_HTTP_HEADERS_SENT.
    res.end(JSON.stringify(stripCites(parsed)));
  } catch (error) {
    if (keepAlive) clearInterval(keepAlive);
    console.error('[TicketTackler]', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
    } else {
      res.end(JSON.stringify({ error: 'Something went wrong. Please try again.' }));
    }
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
