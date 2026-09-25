// ticket-tackler.js — Ticket Tackler: understand a citation, and decide
// whether it's actually worth contesting.
// Positioning (deliberate): a writing + evidence tool that helps the user
// understand their own case and draft their own appeal WHEN ONE IS WARRANTED
// — never an "AI lawyer", never an outcome promise, never a manufactured case.
const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext, extractSearchResults } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { stripCites, matchVerifiedSources } = require('../lib/groundedFacts');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — quoted ticket text, signage wording, or things-to-say must be written plainly or with single quotes, or it breaks the JSON.';

const TYPE_LABELS = {
  parking: 'parking ticket',
  camera:  'automated camera ticket (red-light or speed camera)',
};

// 2026-09-16 (later same day): back to two calls, deliberately — this
// reverses the single-call-with-web_search decision from earlier today (see
// git history for that comment's reasoning, since it no longer applies).
// What changed: across six rounds of live-tested fixes today (provenance
// labeling, contradictory-research handling, deadline conflicts, evidence
// claims, legal-defense grounding...) the single SYSTEM_PROMPT grew to ~350
// lines of rules competing for attention in ONE call that also had to run
// live web_search AND produce a large structured JSON verdict. One fix
// (round 4, source-attribution) demonstrably did not hold up on its first
// live retest despite clear wording, because research, judgment, and output
// formatting were all happening in the same pass. Two-stage design:
// 1) a case-directed investigator gets live web search and resolves the few
//    external facts that could change the decision, with its own compact
//    schema (decision_questions/findings) — nothing else to think about;
// 2) a separate reviewer receives that compact dossier and produces the
//    existing Ticket Tackler JSON. The reviewer has no web-search tool, so
//    research and judgment do not compete for attention in one long call.
// The final response schema to the frontend is UNCHANGED — TicketTackler.js
// needed no edits. Because all research now completes before the reviewer
// ever reasons about the verdict, "recommendation" is now REQUIRED to match
// "verdict" (previously it deliberately wasn't, because research could
// surface new facts mid-review in the single-call design — that scenario no
// longer exists once research is fully front-loaded into stage 1).

const INVESTIGATOR_PROMPT = `You are the investigation stage for Ticket Tackler.

Your only job is to establish the few external facts that could materially change whether an ordinary parking or automated camera ticket is worth contesting.

PROCESS
1. Read the citation and the user's account.
2. Identify the smallest number of decision-changing questions.
3. Research those questions using authoritative public sources.
4. Follow the research chain until each question is answered or genuinely cannot be answered with public information available to you.
5. Do not stop at identifying a database, map, agency page, statute, or dataset that probably contains the answer. If it is publicly accessible and searchable with information already supplied, attempt to retrieve the specific answer.
6. Ask the user to check something only when it requires private evidence, citation-number access, an account/login, a physical inspection, or a public source you genuinely could not access.

SOURCE PRIORITY
Prefer, in order: the issuing agency or court; city/county/state government; statutes, codes, regulations, and official rules. Use secondary sources only when a primary source cannot resolve a material point. Do not use forums, social media, or marketing pages for a dispositive rule when an authoritative source is available.

DISCIPLINE
- Research only facts that could change the decision.
- Distinguish what the citation says, what the user says, and what research establishes.
- Do not invent laws, defenses, procedures, deadlines, fees, enforcement hours, consequences, or factual details.
- Do not turn a plausible explanation into a legal defense.
- If authoritative research conflicts with the citation, report the conflict; do not assume either source proves the other wrong.
- If a citation-specific deadline conflicts with general guidance, report both and treat the earlier deadline as the safer one unless citation-specific authority resolves the conflict.
- Do not use probability language to bridge an unresolved factual gap.

Return ONLY valid JSON. No markdown or preamble.`;

const SYSTEM_PROMPT = `You are Ticket Tackler, a practical citation-review assistant for ordinary parking and automated camera tickets.

Your job is to determine what the established facts support. You are not a lawyer. Do not guarantee an outcome.

CORE RULE
Build the strongest case the facts support—not the strongest case you can imagine.

DECISION PROCESS
1. READ: Establish exactly what the citation says.
2. SEPARATE: Keep distinct citation facts, the user's account, evidence the user says they possess, and facts established by the investigator. Never promote one category into another.
3. FIND THE DECISION POINT: Focus on facts or rules that could actually change whether contesting is supported.
4. USE THE INVESTIGATION: Treat only VERIFIED investigator findings as researched facts. An unresolved finding stays unresolved. Do not redo or embellish the research.
5. STOP WHEN ONLY THE USER CAN CONTINUE: Ask the user to verify something only when it requires private evidence, citation-number access, an account/login, physical inspection, or another fact the investigation could not establish.
6. DECIDE: Choose exactly one assessment token from the supplied schema. If a fact capable of changing the decision remains unresolved, do not make a stronger conclusion than the established facts support.
7. BUILD THE CASE ONLY IF WARRANTED: Draft an appeal only when established facts provide a coherent basis to contest. Otherwise do not manufacture an argument. If a plausible basis depends on information only the user can supply, state what is needed before an appeal should be drafted.
8. GIVE THE NEXT ACTION: End with the single most useful next step.

EVIDENCE AND CLAIM DISCIPLINE
- A citation fact is only something actually stated on the citation.
- A user-account fact is something the user says happened.
- Supporting evidence is evidence the user says they possess; do not claim you reviewed it unless it was actually supplied.
- A researched fact must come from a VERIFIED investigator finding.
- Describe only what evidence actually establishes. Do not infer the correct plate, zone, location, duration, timing, or other details unless the evidence establishes them.
- Do not invent facts, laws, rules, procedures, deadlines, defenses, consequences, probabilities, motives, or technical explanations.
- Do not characterize an argument as a recognized legal defense unless the investigation established that from authoritative legal sources.
- When research conflicts with the citation, treat the conflict as unresolved unless the investigation resolved it.
- When deadlines conflict, use the earlier deadline as the safer action point unless citation-specific authoritative information resolves the conflict.
- Use conditional language when the conclusion is conditional. Do not use words such as almost certainly, probably, likely, or unlikely to fill an evidentiary gap.

APPEAL PROVENANCE
Include a factual claim in the appeal only if it is from the citation, a VERIFIED investigator finding, or explicitly attributed to the user. Never promote an inference, theory, or unverified explanation into fact.

RESEARCH PRIORITY
If a threshold fact remains unresolved and could determine the outcome, do not pursue secondary defenses or ask the user to gather evidence for them unless they would still matter after the threshold fact is resolved.

ROUTINE DETAILS
Do not turn an unverified routine detail into a potential defect without evidence suggesting a discrepancy. If nothing indicates the citation's fine, deadline, or other ordinary detail is wrong, report any verification limitation without making it a basis to contest or the user's primary next step.

RIGHT-SIZE THE RESPONSE
Use only sections that help resolve this ticket. A clear pay case should be short. A case with a strong supported basis may include evidence and an appeal. A genuinely unresolved case should explain the decisive missing fact without padding the answer with speculative procedure or arguments.

The goal is to help the user make a better-informed decision and, when the facts support contesting, present those facts clearly.

Return your answer as JSON using the exact schema in the user message.`;

router.post('/ticket-tackler', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  // Two-stage architecture: the investigator performs case-directed web research first;
  // the reviewer then reasons from that compact dossier and produces the existing UI JSON.
  // Keep the connection alive across both calls because the research stage can be slow.
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

    res.setHeader('Content-Type', 'application/json');
    res.flushHeaders();
    keepAlive = setInterval(() => {
      try { res.write(' '); } catch { /* connection already gone */ }
    }, 10000);

    const imageBlocks = [];
    if (ticketImageBase64) {
      const commaIndex = ticketImageBase64.indexOf(',');
      const rawBase64 = commaIndex !== -1 ? ticketImageBase64.substring(commaIndex + 1) : ticketImageBase64;
      imageBlocks.push({ type: 'image', source: { type: 'base64', media_type: imageMediaType || 'image/jpeg', data: rawBase64 } });
      imageBlocks.push({ type: 'text', text: 'The image above is the ticket/citation (THE CITATION category). Read every field on it (violation code, date, time, location, amount, deadline) and use those details.' });
    }

    const baseCasePrompt = `Review this ${typeLabel}.

TICKET TYPE: ${typeLabel}
CITY / JURISDICTION: ${city.trim()}
${fineAmount ? `FINE AMOUNT (as entered by the user): ${String(fineAmount).slice(0, 40)}` : ''}
${deadline ? `APPEAL DEADLINE (as entered by the user): ${String(deadline).slice(0, 60)}` : ''}
${ticketText?.trim() ? `\nTHE CITATION (pasted text):\n${ticketText.trim().slice(0, 6000)}` : ''}
${whatHappened?.trim() ? `\nTHE USER'S ACCOUNT (not independently verified):\n${whatHappened.trim().slice(0, 4000)}` : ''}
${imageBlocks.length ? '\nThe citation was also provided as a photo above (THE CITATION category).' : ''}
`;

    const investigatorPrompt = `${baseCasePrompt}

Investigate only the external facts that could materially change the decision.

Return ONLY valid JSON:
{
  "decision_questions": ["The smallest set of decision-changing external questions"],
  "findings": [
    {
      "question": "The question researched",
      "status": "VERIFIED | NOT_VERIFIED | USER_MUST_CHECK",
      "answer": "What was established, what could not be established, or what only the user can settle",
      "source_name": "Authoritative source name when VERIFIED, otherwise null",
      "source_url": "Authoritative source URL when VERIFIED and available, otherwise null",
      "why_it_matters": "How this fact could change the ticket decision"
    }
  ],
  "research_summary": "A compact summary of what the investigation establishes and what remains genuinely unresolved"
}

RULES:
- Keep decision_questions to 1-4 and findings to 1-6.
- status must be exactly VERIFIED, NOT_VERIFIED, or USER_MUST_CHECK.
- USER_MUST_CHECK is reserved for private evidence, citation-number access, login/account access, physical inspection, or a public source you genuinely attempted but could not access.
- If a public source can answer a decisive question, attempt to answer it before returning.
- Name the authoritative source for every VERIFIED finding.
- ${NO_QUOTE_RULE}`;

    const investigatorContent = imageBlocks.length
      ? [...imageBlocks, { type: 'text', text: investigatorPrompt }]
      : investigatorPrompt;

    const { parsed: investigation, message: investigatorMessage } = await callClaudeWithRetry({
      model: MODELS.SMART,
      // 2026-09-16: bumped 2600 -> 4000 after a live golden-check truncation
      // on the German quote-heavy case (stop_reason max_tokens, all 3 retries
      // truncated identically — deterministic, not a flake). The schema is
      // small (<=4 decision_questions, <=6 findings) but German text plus
      // named authoritative sources/URLs pushed a real case over 2600.
      max_tokens: 4000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      system: withLanguage(INVESTIGATOR_PROMPT, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: investigatorContent }],
    }, { label: 'ticket-tackler-investigator', returnMessage: true });

    const researchDossier = JSON.stringify(stripCites(investigation));

    // The investigator names a source per VERIFIED finding (source_name/
    // source_url) directly in its own JSON — but that's the model's own
    // self-report, not independently confirmed; a plausible-looking URL can
    // be invented the same way a bare domain can (see lease-trap-detector).
    // Cross-check each named source against pages web_search actually
    // retrieved in THIS call before treating it as real. Unlike the other
    // tools' groundedFacts() pre-passes, there's no cache here — every
    // ticket's investigation is unique to that specific citation, so this
    // runs once per request against this request's own search results.
    //
    // source_url, when present, gives a reliable domain directly (no need to
    // fuzzy-extract one from a human-readable name); fall back to pulling a
    // domain-shaped token out of source_name for a finding that named a
    // source without a URL.
    const ticketSearchResults = extractSearchResults(investigatorMessage);
    const hostnameOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } };
    const verifiedSources = Array.isArray(investigation.findings)
      ? matchVerifiedSources(
          investigation.findings.map(f => ({ source: (f.source_url && hostnameOf(f.source_url)) || f.source_name })),
          ticketSearchResults,
        )
      : [];

    const userPrompt = `${baseCasePrompt}

INVESTIGATOR DOSSIER
The research stage has already run. Use these findings; do not invent missing research or silently upgrade unresolved findings to facts.
${researchDossier}

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
  "appeal_letter": "A complete appeal when established facts provide a coherent basis to contest; otherwise null. When present: date placeholder, citation number placeholder [CITATION #], recipient line, the strongest supported point first, the citation's facts clearly distinguished from the user's assertions, a request for the appropriate relief without predicting the outcome, polite closing with [YOUR NAME]. Concise and factual — never emotional, never accusatory, never exaggerated. Never invent the name of a review process, hearing type, requested remedy, agency, filing channel, or procedural step — use only what the citation states or research verified, or generic neutral language ('respectfully request that this citation be dismissed or reviewed') when the specific process is not established.",
  "before_appeal": "Populate only when appeal_letter is null because a plausible basis exists but a decision-changing fact that only the user can supply remains unresolved — explain exactly what is needed first, one sentence. Null when appeal_letter is non-null, and null when the case has too little basis for an appeal to be worth building toward at all (LITTLE_BASIS_TO_CONTEST / PAYING_MAY_BE_THE_PRACTICAL_CHOICE)",
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
- "recommendation" MUST match "verdict". No new evidence or research occurs between those fields, so the decision must remain internally consistent.
- LIMITS: what_may_matter ≤ 5 (strongest first), what_to_verify ≤ 6 (most decisive first), evidence_to_get ≤ 6, dont_say ≤ 3.
- "what_may_matter", "what_to_verify", and "evidence_to_get" may all be empty arrays — an empty array is a legitimate answer when the account supports nothing further, not a failure to fill the schema. Per RIGHT-SIZE THE RESPONSE, a clear-cut pay case should leave most of these empty rather than padding them.
- "dont_say" MUST be null (not an empty array, not invented filler) unless the user could reasonably say something that would actually hurt their case.
- Cite a specific statute/ordinance section number ONLY when certain it is exactly right (verified or clearly stated on the citation); otherwise describe the rule without a section number.
- Keep every string field to the stated length. Never restate the same point across fields.
- ${NO_QUOTE_RULE}`;

    const content = imageBlocks.length
      ? [...imageBlocks, { type: 'text', text: userPrompt }]
      : userPrompt;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 6000,
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
    res.end(JSON.stringify({
      ...stripCites(parsed),
      ...(verifiedSources.length ? { verified_sources: verifiedSources } : {}),
    }));
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
