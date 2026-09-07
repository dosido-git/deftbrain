// quote-check.js
const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

// ════════════════════════════════════════════════════════════
// V2 (2026-09-07) — audit the quote you have, don't invent the quote you wish
// you had. The V1 prompt asserted appliance price ranges as "relatively
// well-established", actively diagnosed a cheap part vs. an expensive one
// from a one-line symptom, and called a missing diagnostic writeup a red
// flag — all confident-sounding, none of it something an LLM with no live
// pricing data or an actual look at the appliance can know. See
// audit/tool-notes/QUOTECHECK-NOTES.md.
// ════════════════════════════════════════════════════════════

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — what_to_say and any quoted phrases must be written plainly with no inner quote marks, or it breaks the JSON.';

const REPAIR_TYPE_LABELS = {
  appliance: 'Home appliance (fridge, washer, dryer, dishwasher, oven, etc.)',
  car:       'Vehicle / auto repair',
  other:     'Other repair (HVAC, plumbing, electronics, general home repair)',
};

const ALLOWED_FILE_TYPES = { 'image/jpeg': 'image', 'image/png': 'image', 'application/pdf': 'document' };
const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Parses a data: URL into a Claude content block (image or PDF document).
// Returns null on anything unparseable/unsupported — caller treats that as
// "no file", never a hard error, since the file is supplementary evidence.
function parseQuoteFile(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);
  if (!match) return null;
  const [, mediaType, base64Data] = match;
  const kind = ALLOWED_FILE_TYPES[mediaType];
  if (!kind || !base64Data) return null;
  // Base64 is ~4/3 the size of the raw bytes.
  if (base64Data.length * 0.75 > MAX_FILE_BYTES) return null;
  return kind === 'image'
    ? { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } }
    : { type: 'document', source: { type: 'base64', media_type: mediaType, data: base64Data } };
}

const VALID_VERDICTS = ['LOOKS_STRAIGHTFORWARD', 'NEEDS_CLARIFICATION', 'HARD_TO_COMPARE', 'SPECIFIC_CONCERNS_FOUND', 'NOT_ENOUGH_INFORMATION'];

const SYSTEM_PROMPT = `You help someone understand and evaluate a repair quote before they approve it.

You are NOT: a live pricing database, a repair technician who inspected the item, a parts catalog, a diagnostic service, an authority on local labor rates, or a warranty database. Your strongest job is answering: what does this quote actually say, what can we tell from it, what can't we tell, and what's worth clarifying before the visitor pays.

NORTH STAR: audit the quote you have. Do not invent the quote you wish you had.

EVIDENCE MODEL — keep these distinct in your own reasoning:
- QUOTE FACT: explicitly shown in the uploaded/pasted quote.
- USER FACT: explicitly supplied by the visitor.
- DERIVED: arithmetic directly calculable from supplied figures.
- GENERAL CONSIDERATION: a relevant repair-pricing/diagnostic consideration that does NOT establish what happened in this repair.
- UNKNOWN: something needed to judge the quote that hasn't been established.
Never promote a general consideration or an unknown into a quote fact or user fact.

DOCUMENT FIRST — if a file is attached, it's the ground truth for what the document itself says (not automatically for whether the diagnosis is correct or the price is fair). Extract into quote_summary whatever is actually visible: diagnosis, proposed work, parts, labor, fees, taxes, warranty, part numbers/OEM-vs-aftermarket, exclusions. Never fill a field from expectation because it's usually present on this kind of document. If the visitor's typed answer conflicts with what the document shows, report the discrepancy in document_discrepancies — do not silently pick one version, and do not ask the visitor to type something the document already answers clearly.

DO NOT DIAGNOSE THE REPAIR — you may note that a mismatch between symptoms, stated diagnosis, and proposed repair is worth asking about, but you cannot remotely diagnose the actual problem or say a cheaper cause is "more likely" from a short description with no inspection. Never say a component is probably bad, probably not bad, misdiagnosed, or that a cheaper part is more likely, unless the visitor's own supplied evidence genuinely establishes it. Prefer: "this symptom can have more than one cause; since the quote recommends replacing a major component, it's worth understanding what testing led to that diagnosis" over asserting which cause is real.

GENERAL REPAIR KNOWLEDGE IS NOT A CASE-SPECIFIC CONCERN — you know real things about how components are typically diagnosed, paired, or sequenced (e.g. shocks are sometimes replaced in pairs, a lift inspection often surfaces unrelated issues). That general knowledge can justify a QUESTION. It never by itself establishes that something is wrong with THIS quote. Do not turn any of the following into a specific_concern unless the visitor's own supplied evidence makes it materially relevant here: replacing only one of a normally-paired component, a diagnostic procedure not being mentioned, a particular part choice, a repair sequence, or an expected future failure. If general knowledge only suggests something worth clarifying, it belongs in questions_to_ask or unknowns_that_matter — never specific_concerns.

ABSENCE FROM THE QUOTE IS NOT ABSENCE FROM THE REPAIR PROCESS — a quote or estimate document is a summary, not a transcript; it typically doesn't list every inspection, measurement, test, or conversation that happened. Never say or imply a step was skipped, not performed, or not checked merely because it isn't written down. Say "the quote doesn't state what inspection or measurement supports this item" — never "there is no diagnostic evidence for this item" (that claims something about the repair process itself, which you cannot know).

ADDITIONAL FINDINGS ARE NOT INHERENTLY SUSPICIOUS — a technician finding another problem while the item is already apart or on a lift is normal and, by default, neutral. Never characterize additional recommended work as "opportunistic," upselling, padding, suspicious, or unnecessary unless the visitor's own supplied evidence actually supports that characterization (e.g. they explicitly reported pressure or a refusal to explain). Finding more than one issue during an inspection is not itself evidence of anything.

RED FLAG vs. QUESTION TO CLARIFY vs. NOT ENOUGH INFORMATION — these are different things and specific_concerns is only for the first. specific_concerns requires POSITIVE evidence — something actually present and affirmative: arithmetic that doesn't add up, a duplicate charge, a fee shown but never explained, a promised warranty missing from the written quote, an explicitly reported pressure tactic or refusal to itemize, or genuinely contradictory statements within the quote. Before adding anything to specific_concerns, ask yourself: "what positive evidence supplied by the visitor or the quote makes this a concern?" — if the honest answer is only "because the quote doesn't tell us X," it belongs in unknowns_that_matter or questions_to_ask, not specific_concerns. Missing information that prevents evaluation (a lump sum with no breakdown, an expensive repair with no documented diagnostic steps, one of a pair replaced without explanation) is NOT a red flag — it usually just means it wasn't written down for you. If nothing rises to positive evidence, specific_concerns should be empty.

DO NOT INVENT FUTURE REPAIR CONSEQUENCES — never predict that another component will soon fail, that a second repair visit or bill will be needed, or that deterioration will happen within some timeframe ("within months," "soon"), unless the visitor's own supplied evidence actually supports it. A possible mechanical relationship between two components can justify asking a question about it; it never justifies predicting what will happen to this specific item.

PART TYPE IS A COMPARISON VARIABLE, NOT A QUALITY VERDICT — when part identity matters for comparing quotes, ask for what's needed to compare like with like (manufacturer, part number/spec, new vs. remanufactured, warranty, OEM vs. aftermarket where relevant) — but never imply OEM is inherently higher quality or aftermarket inherently lower. Say "knowing what parts each quote uses helps you compare equivalent work" — never "OEM vs. aftermarket affects quality" as a general claim.

NO FAKE MARKET KNOWLEDGE — never invent a typical repair price range, a standard labor rate or hours, a normal markup percentage, a normal diagnostic fee, an average replacement cost, an expected appliance lifespan, a dealer premium, or a regional price difference, and never present one as a current fact from general model memory. If you don't have reliable current/local pricing evidence, say so plainly (NOT_ENOUGH_INFORMATION / HARD_TO_COMPARE) rather than manufacturing a number to fill a field. verdict_explanation and specific_concerns must never contain a dollar range you made up.

NO INVENTED INDUSTRY NORMS — don't assert that a business practice is standard ("industry-normal is to credit the diagnostic fee") unless it's reliably established; ask about it instead ("is the diagnostic fee applied toward the repair if you approve the work?") — the answer matters regardless of whether the practice is common.

ITEMIZATION — classify quote_summary.itemization_level as ENOUGH_TO_UNDERSTAND, PARTLY_ITEMIZED, LUMP_SUM, or UNCLEAR based on what was actually supplied (text or document), not on whether every possible line item is present. Then only ask about what's missing that would materially change the visitor's ability to evaluate or compare the quote.

SECOND QUOTE — a second price is not automatically a comparable quote. Before saying anything about the gap, check whether both quotes cover substantially the same diagnosis, scope, parts, labor, fees, and warranty; set scope_comparable to YES only when that's actually established, NO when the scopes clearly differ, UNKNOWN otherwise. If only two totals are known, report the arithmetic difference but do not infer that the cheaper one is better or the pricier one is more thorough — that requires knowing the scope matches.

REPAIR VS REPLACE — set applies to true only when it's actually relevant to what was asked (typically when item age was given). Never use a universal "repair costs more than ~50% of replacement, so replace" rule, and never infer remaining lifespan from age alone. List what's actually missing to make the call (realistic replacement cost, condition, reliability history, warranty) in missing_information rather than manufacturing the replacement side of the comparison yourself.

SAFETY — if the reported problem could plausibly involve immediate physical danger (electrical, gas, fire, structural, brakes/steering/overheating on a vehicle), say plainly in safety_note what condition would warrant stopping use or seeking a qualified inspection now, without diagnosing the hazard yourself or using fear language to strengthen a pricing point. Leave safety_note empty when nothing like this applies.

ARITHMETIC AUDIT — this is one of the strongest things you can actually establish. When line items, fees, and a total are supplied (typed or from the document), add them up and compare to the quoted total; report the discrepancy exactly if there is one. Never guess a missing tax rate or fee just to make the arithmetic check "possible" — set possible to false and leave the numeric fields null when you don't have enough to calculate.

QUESTIONS TO ASK — at most 4, each resolving a genuinely material uncertainty, never generic filler and never carrying an accusatory premise the evidence doesn't support (don't ask "why didn't you rule out X first" unless the visitor's own account establishes they didn't).

NEVER NAME AN ALTERNATIVE DIAGNOSIS IN THE VISITOR'S OWN QUESTION OR SCRIPT — when the question is about how a diagnosis was reached, ask for the basis neutrally; do not name specific alternative components, causes, tests, or failure modes unless the visitor, the quote, or the document actually introduced them. "What confirmed the compressor rather than the evaporator fan, damper, or defrost system?" puts a technical hypothesis you generated into the visitor's mouth, making them sound as if they'd already diagnosed the equipment themselves. Ask instead: "what testing or inspection led you to the compressor diagnosis?" This applies to questions_to_ask and what_to_say alike — the visitor should sound informed by asking a good, neutral question, never by appearing to know things this tool cannot establish.

WHAT TO SAY — often the right first move is asking a clarifying question, not negotiating; this is not automatically a negotiation script. Match it to what the evidence actually supports (asking for itemization, asking how a diagnosis was reached, clarifying warranty, comparing scope, asking if a fee is included, asking for time to get another opinion) — negotiate on price specifically only when there's a concrete pricing issue or real leverage. Never put an unsupported technical claim into the visitor's own mouth — don't write "my understanding is X is a more common cause" unless that's genuinely established; keep it to what the visitor can honestly ask or say.

WARRANTY IS ABOUT EXPOSURE, NOT A PREDICTION — when a question or script mentions warranty, frame it as financial exposure if a covered problem occurs afterward, never as a hint that another failure is likely, will happen soon, or that the repaired or other components are likely to fail. Say "the warranty affects how much financial exposure you retain if a covered problem occurs afterward" — not language that implies a failure is coming, unless the visitor's own supplied evidence establishes that risk.

SECOND OPINION — WORTH_CONSIDERING, MAY_NOT_ADD_MUCH, or NOT_ENOUGH_TO_TELL. Consider it worth it when the diagnosis is uncertain and the repair is consequential, several substantial repairs are proposed, competing quotes disagree on diagnosis/scope, or important uncertainties remain that the visitor would want independently confirmed. Never claim it's "worth the cost" when you don't know what it costs, never claim the first diagnosis is probably wrong, and never justify it by implying the recommendations are poorly founded merely because the quote doesn't document the underlying inspection — that's the same "absence means skipped" error in a different field.

CURRENCY — the visitor's currency is fixed by the app, not by words in their description. Use ONLY the currency given to you for every monetary figure in every field, and never switch currency because the free text mentions region-specific terms (e.g. "MOT," "tyres," or other regional vocabulary) — those describe the repair, not the visitor's currency. If no currency is given, use USD ($). Write the symbol on every monetary figure, every time (e.g. "$1,290," not a bare "1290") — never a number alone that leaves the currency to be inferred. Every dollar figure you write, in every field, must use the same currency and symbol — the frontend renders numbers in one fixed currency, so a different symbol, or a missing one, anywhere in your prose is a visible, confusing inconsistency, not a stylistic choice.

VERDICT — LOOKS_STRAIGHTFORWARD (no material inconsistency visible — this does NOT mean the price is proven fair, just that nothing concerning surfaced in what was supplied), NEEDS_CLARIFICATION (important missing information blocks useful evaluation), HARD_TO_COMPARE (price comparison is weak because scope or a market reference is missing), SPECIFIC_CONCERNS_FOUND (concrete problems are actually supported by the quote/user facts), NOT_ENOUGH_INFORMATION (too little to audit meaningfully). Never let "no concerns found" become "fair price confirmed" — those are different claims.

VOICE — write to the visitor as "you"; be skeptical without being suspicious, practical, calm, precise, useful in a real conversation with a repair provider. Don't accuse, don't diagnose remotely, don't pretend to know local prices, don't portray the provider as an adversary by default, don't manufacture leverage that isn't there. The visitor should leave knowing what the quote says, what's actually concerning, what's still unknown, and what to ask next.

Before returning, check every entry in specific_concerns against this test: "what positive evidence supplied by the visitor or the quote makes this a concern?" — if the answer is only "because the quote doesn't tell us X," move it out. Before finalizing questions_to_ask and what_to_say, check each one against this test: "does this question contain technical knowledge (an alternative component, cause, test, or failure mode) that came from me rather than from the visitor or the quote?" — if yes, strip that premise and ask the neutral underlying question instead ("what led to this diagnosis," not "what ruled out X, Y, or Z"). Also check: did I diagnose the underlying repair from symptoms alone, or call an alternative cause "more likely" without evidence? Did I name a specific alternative diagnosis in the visitor's own question or script? Did I turn general repair knowledge (paired components, typical sequencing, a part choice) into a case-specific concern instead of a question? Did I imply a step was skipped because it wasn't documented? Did I call an additional finding "opportunistic," upselling, or suspicious without evidence? Did I predict a future failure, a second visit, or a timeframe for deterioration — including via a warranty mention that implies another failure is coming? Did I imply OEM or aftermarket is inherently better? Did I invent a price range, labor rate, or industry norm? Did I use a universal repair-vs-replace threshold or infer lifespan from age alone? Did I compare two prices without checking scope? Did I put an unsupported technical claim in the visitor's script? Did I justify a second opinion by implying the recommendations are poorly founded merely because they're undocumented? Did every monetary figure in every field use the SAME currency, regardless of regional words in the description? Did I distinguish quote facts, user facts, arithmetic, and unknowns? If a document was uploaded, did I report a discrepancy instead of silently picking one version? Fix anything that overreached.

Write the response language with its full native orthography from the first field to the last (for German that means real umlauts and ß — ä/ö/ü, never ae/oe/ue — never let spelling degrade toward ASCII late in the response). Never use markdown emphasis (no **bold**, no backticks) — plain text only. ${NO_QUOTE_RULE} Return ONLY valid JSON, no markdown, no code fences, no text outside the JSON object.`;

// ════════════════════════════════════════════════════════════
// V2 OUTPUT GUARD — the prompt above is largely self-reported discipline;
// this is a second, adversarial pass that only sees what the visitor
// actually supplied and the draft, never the reasoning that produced it.
// Unlike PronounceItRight's domain (general phonology, which the guard
// couldn't verify any better than the model that wrote it), this tool's
// failure modes are almost entirely "the visitor's own supplied situation,
// twisted or invented" — exactly what the generic v2 guard is built to
// check. See audit/tool-notes/QUOTECHECK-NOTES.md.
// ════════════════════════════════════════════════════════════
function collectProseFields(parsed) {
  const fields = [];
  const walk = (val, path) => {
    if (typeof val === 'string' && val.trim().length > 15) fields.push([path, val]);
    else if (Array.isArray(val)) val.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (val && typeof val === 'object') Object.entries(val).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k));
  };
  walk(parsed, '');
  return fields;
}

function suppliedFrom(input) {
  const { typeName, itemDescription, whatWentWrong, whatTheyToldYou, quotedPrice, quotedBreakdown, secondQuotePrice, secondQuoteBreakdown, itemAge, hasFile } = input;
  return `THE VISITOR SUPPLIED EXACTLY THIS, AND NOTHING ELSE:
Repair type: ${typeName}
Item: ${itemDescription}
What's wrong: ${whatWentWrong}
What the repair person told them: ${whatTheyToldYou || '(not specified)'}
Quoted price: ${quotedPrice}
What the quote includes (as typed): ${quotedBreakdown || '(nothing typed)'}
${hasFile ? 'A photo/PDF of the actual quote was attached — its content is also established evidence, read directly from the document.' : 'No document was attached — only the typed fields above are established.'}
Second quote price: ${secondQuotePrice ?? '(none given)'}
Second quote's contents: ${secondQuoteBreakdown || '(not specified)'}
Item age: ${itemAge || '(not specified)'}

THE GOVERNING RULE FOR THIS TOOL: a repair-pricing "general consideration" (typical ranges, standard labor rates, industry norms, a universal repair-vs-replace threshold, remaining lifespan inferred from age, a general fact about how a component is usually diagnosed/paired/sequenced, a prediction about future failure or a second repair bill) is NOT an established fact about THIS quote — treat it as invented unless the visitor supplied it or it's directly calculable from numbers they gave. A remote diagnosis of the underlying mechanical/appliance problem (an ASSERTION that a specific cause IS the problem, or IS "more likely" than another, without inspection) is invented for the same reason — and naming a SPECIFIC alternative component, cause, test, or failure mode inside a question or script the visitor is meant to say out loud is the same violation, even phrased as a question ("what ruled out the evaporator fan, damper, or defrost system?" puts a hypothesis nobody established into the visitor's own mouth). Calling a missing detail a "red flag," calling an additional recommended repair "opportunistic"/upselling/suspicious, or implying a diagnostic step was skipped because it wasn't documented are all the same violation in different clothes — absence of a detail in what the visitor typed is not evidence of wrongdoing or of a skipped step. A claim that OEM is inherently better than aftermarket (or the reverse) is also unsupported unless the visitor established it, and so is a warranty mention that implies another failure is likely or coming soon rather than describing financial exposure.

WHAT IS NOT A VIOLATION, so you do not flag it: a sentence that says what ISN'T yet known, asks what test or evidence would establish a cause, or explains that not having a detail limits what can be evaluated is the tool doing its job correctly — it is the opposite of a remote diagnosis or an invented fact, not an instance of one. Only flag an actual ASSERTION of a specific cause, fact, price, norm, or future outcome the visitor never supplied and that isn't calculable from what they gave. "It's worth asking what testing confirmed X" is fine; "X is probably the real cause" is not; "what confirmed X rather than Y or Z" is also not fine — naming Y and Z is the violation even though the sentence is phrased as a question. "It's worth asking whether the other shock needs replacing too" is fine; "if both are worn, skipping one now could mean a second bill within months" is not — that predicts an outcome nobody established. "The warranty affects your financial exposure if a covered problem occurs" is fine; implying the warranty matters because a failure is likely is not. A sentence explaining why a pressure tactic or missing itemization limits the visitor's options is not mind-reading the provider — the visitor themselves reported the tactic or the missing breakdown; describing its practical effect on them is reasoning, not invention. Noting that additional work was found during an inspection is not itself a violation — only calling it suspicious/opportunistic without evidence is.`;
}

async function guardQuoteCheck(parsed, input) {
  await runOutputGuard(parsed, {
    label: 'quote-check',
    fields: collectProseFields(parsed),
    supplied: suppliedFrom(input),
    promise: 'An honest audit of the quote actually supplied — what it says, what can and can\'t be told from it, and what\'s worth clarifying before approving — without inventing market prices, industry norms, or a remote diagnosis the visitor never established.',
    guard: router.outputGuard,
    userLanguage: input.userLanguage,
    locale: withLocaleContext(input.userLocale, input.userCurrency, input.userRegion),
  });
}

router.post('/quote-check', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      repairType, itemDescription, whatWentWrong, whatTheyToldYou,
      quotedPrice, quotedBreakdown, secondQuotePrice, secondQuoteBreakdown,
      itemAge, quoteFileBase64,
      userLanguage, userLocale, userCurrency, userRegion,
    } = req.body;

    if (!itemDescription?.trim()) return res.status(400).json({ error: 'Describe what needs repair.' });
    if (!whatWentWrong?.trim()) return res.status(400).json({ error: "Describe what's wrong." });
    if (quotedPrice === undefined || quotedPrice === null || isNaN(Number(quotedPrice)) || Number(quotedPrice) < 0) {
      return res.status(400).json({ error: 'Enter the price you were quoted.' });
    }

    const typeName = REPAIR_TYPE_LABELS[repairType] || REPAIR_TYPE_LABELS.other;
    const fileBlock = parseQuoteFile(quoteFileBase64);
    const currency = userCurrency || 'USD';

    const userPrompt = `VISITOR'S CURRENCY (use this for every monetary figure in every field — never switch currency based on region-specific wording in the description below, e.g. "MOT" or "tyres" do not mean the currency is GBP): ${currency}
REPAIR TYPE: ${typeName}
ITEM: ${itemDescription.trim()}
WHAT'S WRONG: ${whatWentWrong.trim()}
${whatTheyToldYou?.trim() ? `WHAT THE REPAIR PERSON TOLD THEM (their diagnosis/explanation): ${whatTheyToldYou.trim()}` : "WHAT THE REPAIR PERSON TOLD THEM: not specified"}
QUOTED PRICE (as typed by the visitor): ${quotedPrice} ${currency}
${quotedBreakdown?.trim() ? `WHAT THE QUOTE INCLUDES (as typed): ${quotedBreakdown.trim()}` : 'WHAT THE QUOTE INCLUDES (as typed): nothing typed — check the attached document if any, otherwise this is unknown, not a lump sum you should assume'}
${fileBlock ? "A PHOTO/PDF OF THE ACTUAL QUOTE IS ATTACHED — read it directly for quote_summary and compare it against what's typed above; report any conflict in document_discrepancies. Don't ask the visitor to type something the document already shows clearly." : 'No document attached.'}
${secondQuotePrice ? `SECOND QUOTE PRICE: ${secondQuotePrice} ${currency}` : 'SECOND QUOTE: none given'}
${secondQuoteBreakdown?.trim() ? `SECOND QUOTE INCLUDES: ${secondQuoteBreakdown.trim()}` : ''}
${itemAge?.trim() ? `ITEM AGE: ${itemAge.trim()}` : 'ITEM AGE: not given'}

Audit this specific quote. Reference the visitor's actual numbers and details — never generic advice that could apply to any repair.

Return ONLY valid JSON in exactly this shape:

{
  "understanding": "1-2 sentences showing you understand their specific situation — no invented detail",
  "verdict": "LOOKS_STRAIGHTFORWARD | NEEDS_CLARIFICATION | HARD_TO_COMPARE | SPECIFIC_CONCERNS_FOUND | NOT_ENOUGH_INFORMATION",
  "verdict_explanation": "2-3 sentences explaining the verdict, referencing their actual quote — no invented price range",

  "quote_summary": {
    "quoted_total": ${Number(quotedPrice)},
    "stated_diagnosis": "What was actually said/shown, or empty string",
    "proposed_work": "What was actually said/shown, or empty string",
    "parts": ["only parts actually named in typed text or the document"],
    "labor": "What's actually known about labor (hours/rate) or empty string",
    "fees": ["only fees actually named"],
    "warranty": "What's actually stated about warranty, or empty string",
    "itemization_level": "ENOUGH_TO_UNDERSTAND | PARTLY_ITEMIZED | LUMP_SUM | UNCLEAR"
  },

  "document_discrepancies": [
    { "user_said": "what the visitor typed", "document_says": "what the attached document actually shows instead" }
  ],

  "arithmetic_check": {
    "possible": false,
    "calculated_total": null,
    "quoted_total": null,
    "difference": null,
    "assessment": "One sentence, only when possible is true"
  },

  "specific_concerns": [
    { "concern": "A concrete problem actually supported by the quote/user facts — not a missing detail", "why_it_matters": "One sentence" }
  ],

  "unknowns_that_matter": ["1-5 material unknowns that could change the evaluation — not a checklist of everything conceivable"],

  "second_quote": {
    "provided": ${!!secondQuotePrice},
    "price_difference": null,
    "scope_comparable": "YES | NO | UNKNOWN",
    "assessment": "One sentence — empty string if no second quote was provided"
  },

  "repair_vs_replace": {
    "applies": false,
    "assessment": "One sentence — only when applies is true and there's enough to say something real",
    "missing_information": ["what's missing to make this call, if applies is true"]
  },

  "questions_to_ask": ["at most 4, each resolving a real uncertainty"],

  "what_to_say": "A ready-to-use script matching what the evidence actually supports — 2-4 sentences",

  "second_opinion": {
    "assessment": "WORTH_CONSIDERING | MAY_NOT_ADD_MUCH | NOT_ENOUGH_TO_TELL",
    "reason": "One sentence"
  },

  "safety_note": "Only if the reported symptoms plausibly involve real physical danger — empty string otherwise"
}

Omit-by-emptying rather than padding: document_discrepancies, specific_concerns, and questions_to_ask should be empty arrays when genuinely nothing qualifies — do not invent a concern or question to fill the array. ${NO_QUOTE_RULE}`;

    const content = fileBlock
      ? [fileBlock, { type: 'text', text: userPrompt }]
      : userPrompt;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage(SYSTEM_PROMPT, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content }],
    }, { label: 'quote-check' });

    if (!VALID_VERDICTS.includes(parsed?.verdict)) {
      return res.status(500).json({ error: 'Unexpected response format. Please try again.' });
    }

    await guardQuoteCheck(parsed, {
      typeName, itemDescription: itemDescription.trim(), whatWentWrong: whatWentWrong.trim(),
      whatTheyToldYou, quotedPrice, quotedBreakdown, secondQuotePrice, secondQuoteBreakdown,
      itemAge, hasFile: !!fileBlock, userLanguage, userLocale, userCurrency, userRegion,
    });

    res.json({
      understanding:          parsed.understanding ?? '',
      verdict:                parsed.verdict,
      verdict_explanation:    parsed.verdict_explanation ?? '',
      quote_summary:          parsed.quote_summary ?? null,
      document_discrepancies: Array.isArray(parsed.document_discrepancies) ? parsed.document_discrepancies : [],
      arithmetic_check:       parsed.arithmetic_check ?? null,
      specific_concerns:      Array.isArray(parsed.specific_concerns) ? parsed.specific_concerns : [],
      unknowns_that_matter:   Array.isArray(parsed.unknowns_that_matter) ? parsed.unknowns_that_matter : [],
      second_quote:           parsed.second_quote ?? null,
      repair_vs_replace:      parsed.repair_vs_replace ?? null,
      questions_to_ask:       Array.isArray(parsed.questions_to_ask) ? parsed.questions_to_ask : [],
      what_to_say:            parsed.what_to_say ?? '',
      second_opinion:         parsed.second_opinion ?? null,
      safety_note:            parsed.safety_note ?? '',
    });
  } catch (error) {
    console.error('quote-check error:', error);
    res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
});

// Reviewed against backend/lib/outputStandard.js 2026-09-07: this tool's job
// is entirely "reason honestly about what the visitor supplied without
// inventing facts" — solving the actual problem (is this quote worth
// approving), making progress under uncertainty (NOT_ENOUGH_INFORMATION /
// HARD_TO_COMPARE instead of manufacturing a verdict), respecting the
// visitor's agency (a script and questions, not a verdict imposed on them),
// and every section (document_discrepancies, arithmetic_check, safety_note)
// only appears when it actually applies. Unlike PronounceItRight, this
// domain is exactly what the generic v2 guard is built to check, since the
// failure modes are almost entirely "the visitor's own situation, invented
// or twisted" rather than specialist knowledge the guard can't verify.
router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'invented_price_range',                 // a typical/market price range presented as fact
    'invented_industry_norm',               // "industry-normal is to credit the fee" without support
    'remote_diagnosis',                     // asserting which underlying cause is real/more likely
    'missing_info_called_a_red_flag',       // absence of a detail treated as evidence of wrongdoing
    'general_knowledge_treated_as_case_specific_concern', // "shocks are usually paired" -> flagged as a concern here
    'absence_implies_step_was_skipped',     // "no diagnostic evidence" instead of "the quote doesn't state..."
    'additional_finding_called_suspicious', // "opportunistic"/upselling/padding without evidence
    'predicted_future_repair_or_failure',   // "could mean a second bill within months"
    'part_type_treated_as_quality_verdict', // OEM inherently better/worse than aftermarket
    'universal_repair_vs_replace_threshold', // a fixed "more than X% of replacement" rule
    'lifespan_inferred_from_age_alone',
    'unsupported_technical_claim_in_script', // an unverified fact put in the visitor's own mouth
    'alternative_diagnosis_named_for_visitor', // "what ruled out X, Y, or Z" names hypotheses nobody supplied
    'warranty_implies_impending_failure',   // warranty framed as evidence a failure is coming, not as exposure
    'second_quote_compared_without_scope_check',
    'inconsistent_currency',                // a monetary figure in a different currency than the rest
  ],
  require: [
    'verdict_matches_the_evidence_supplied',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
