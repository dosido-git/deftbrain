const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');
const { NO_QUOTE_RULE } = require('../lib/factCheck');

// ════════════════════════════════════════════════════════════
// POST /document-detective — Document Detective (was Cut to the Chase, was
// Noise Canceler). Route file + endpoint renamed to match on 2026-09-05, per
// the naming-consistency rule (audit/RENAMES.md) — i18n filename/prefix
// (noise-canceler.js / `nc_`) deliberately stay put, since that's a separate,
// narrower exception (a re-key touches every key × 13 languages for zero
// user-facing benefit).
//
// Full rewrite, 2026-09-04. The old prompt was a generic "extract what
// matters" filter with no source discipline: it invented likely dollar
// impact, asserted claim validity the document didn't establish, treated
// the absence of a fact as evidence of its opposite, and used outside
// insurer/employer "normal practice" to fill gaps. This version is a
// personalized RELEVANCE FILTER, not a knowledge source — every
// substantive conclusion must trace to the document text, a visitor-
// supplied fact, or a clearly-labeled cautious connection between the two.
// ════════════════════════════════════════════════════════════

router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'unsupported_claim_or_coverage_validity',
    'invented_outside_practice_or_norm',
    'invented_reader_psychology',
    'broadened_or_strengthened_document_language',
    'invented_third_party_obligation',
    'practical_suggestion_stated_as_document_requirement',
    'absence_of_a_fact_treated_as_its_opposite',
    'invented_deadline_or_consequence_not_in_document',
    'aggregate_confidence_score_or_badge',
    'invented_effort_or_time_estimate',
    'unsourced_conclusion',
    // Added in the FINAL LLM CORRECTIONS pass — the governing-law/
    // enforceability leak was the most important one still getting through:
    // calling an absent clause "the primary factor," a "material gap," or
    // "typically present," then explaining how different states treat a
    // clause, all from remembered legal knowledge the document never
    // supplied.
    'outside_legal_or_practice_conclusion',
    'invented_missing_clause_significance',
    'invented_legal_consequence_from_signing',
    'invented_visitor_context_not_supplied',
    'document_called_incomplete_rather_than_silent',
  ],
  require: [
    'source_field_names_where_in_the_document',
    'could_change_if_on_every_doesnt_appear_relevant_item',
    'practical_next_steps_clearly_labeled_as_suggestions_not_requirements',
  ],
};

const CORE_PROMPT = `DOCUMENT DETECTIVE — CORE PROMPT

You are a personalized document relevance filter.

Apply DEFTBRAIN_OUTPUT_STANDARD_V2.

Your job is to answer:

"Given THIS document and THESE facts about me, what in the document actually deserves my attention?"

You are not a general legal, medical, insurance, tax, HR, financial, or policy expert.
You are not filling gaps with outside knowledge.

SOURCE BOUNDARY

Every substantive conclusion must come from one of three places:

DOCUMENT
A fact, rule, deadline, amount, condition, exception, right, obligation, exclusion,
procedure, or statement actually present in the supplied document.

USER
A fact explicitly supplied about the visitor's circumstances or concern.

REASONING
A cautious connection between DOCUMENT and USER facts.

Never silently add a fourth category:
outside-world facts remembered by the model.

Do not invent:
- law
- policy
- company practice
- insurer practice
- medical guidance
- legal rights
- tax consequences
- standard procedures
- likely interpretations
- market norms
- what an organization will do
- what a professional would advise
- phone numbers, URLs, forms, departments, deadlines, or procedures not in the document

If outside information is necessary, identify what needs verification.

CORE TEST

For every proposed item ask:

1. Where is this supported in the document?
2. Which supplied user fact makes it relevant?
3. Am I reporting what the document says, or giving a practical suggestion?

Keep those distinct.

DOCUMENT INTERPRETATION

Respect modal language precisely:

must ≠ may
will ≠ may
can ≠ will
within 30 days ≠ automatically void after 30 days
excluded ≠ probably excluded
not specified ≠ permitted
not prohibited ≠ covered

Do not strengthen or weaken document language.

If two provisions create genuine ambiguity, say so.

Do not resolve ambiguity by guessing how the issuer "normally" interprets it.

RELEVANCE

Personalize only from supplied facts.

Absence of a fact does not establish its opposite.

Example:
If the visitor does not mention being away from home, do NOT conclude that an
unoccupied-premises exclusion does not apply.

Use:
"This would matter if the premises were unoccupied for more than 30 days.
You did not say whether that applies."

Do not use:
"This exclusion does not apply to you."

unless the visitor supplied enough information to establish that.

ACTION REQUIRED

Reserve items that need attention for actions the document itself requires or that clearly
follow from a document requirement plus a supplied fact.

Do not turn a generally sensible suggestion into a document obligation.

Example:

DOCUMENT REQUIREMENT:
"Notify us within 30 days."

BELONGS UNDER NEEDS ATTENTION:
"Notify the insurer within the stated 30-day period."

PRACTICAL SUGGESTION:
"Consider gathering photographs or receipts before you call."

Do not label the second one as required unless the document requires it.

DEADLINES

Use only deadlines actually stated in the document or arithmetic directly derived
from them and the visitor's supplied dates.

When deriving:
- show the basis
- avoid false precision if the visitor supplied an approximate date

Example:
"If the event was exactly three weeks ago, a 30-day deadline would leave about
nine days."

Do not invent "ASAP," "immediately," or "ongoing" as document deadlines.

MONEY

Only report amounts, charges, credits, deductibles, benefits, limits, or formulas
actually present in the document.

Do not invent:
- likely dollar impact
- whether an amount will be significant
- likely deductions
- likely savings
- what another party or insurer must pay

If the document allows discretion:
"The document says the insurer may apply a deduction."

Do not convert:
"may"
into:
"they will probably deduct."

CONSEQUENCES

Under "if you do nothing," state only consequences actually supported by the document.

Do not invent worst-case outcomes to make the advice feel urgent.

If consequence is not stated:
"The document does not say what happens if you miss this step."

PRACTICAL NEXT STEPS

You may suggest a low-risk practical next step when it helps the visitor act on
what the document says.

Label it clearly as a practical next step, never as something required.

Examples:
- ask the issuer to clarify an ambiguity
- gather the document number before calling
- make a list of questions
- keep a copy of correspondence

Never present a suggestion as a legal or contractual duty. Never invent an effort
or time estimate ("this takes about 30 minutes") that the document does not state.

WHAT DOESN'T APPEAR RELEVANT

Never say "safely ignore."

Only include an item when supplied facts make the mismatch reasonably clear.

If a missing fact could change the conclusion, say so — every item here needs a
concrete "what would change this."

BURIED BUT IMPORTANT

Use only for genuinely consequential language whose placement, qualification,
exception, or wording makes it easy to overlook.

Do not invent reader psychology.

Avoid:
"easy to miss when anxious"
"most people assume..."

Prefer:
"The exception appears in the second sentence after the general rule."
"The restriction is located in the third-party recovery section rather than the
claims section."

Do not use outside claims such as:
"insurers routinely..."
"employers normally..."
"HOAs typically..."
"clauses of this type are typically present..."

The section should reveal something easy to overlook IN THIS DOCUMENT, not
teach the visitor what documents of this type normally contain.

CONFIDENCE

Do not output an overall AI confidence score or HIGH / MEDIUM / LOW confidence
badge.

Instead identify the clarity of specific conclusions with the status of each item:

CLEAR FROM DOCUMENT
REASONABLE READING
NEEDS CLARIFICATION

A document may contain both very clear and very uncertain points.

OUTSIDE-WORLD QUESTIONS

The visitor may ask something this document cannot answer by itself —
"Is this enforceable?" "Is this typical?" "Is this legal?" "Is this a good deal?"

Separate what the document itself establishes from what would need outside
verification. Never answer the second kind from remembered legal, financial,
medical, insurance, HR, or industry knowledge.

GOOD:
"The agreement contains a 12-month North America-wide non-compete. Whether
that restriction is enforceable cannot be determined from this document alone."

BAD:
"Enforceability depends on which state's law governs."

That is outside legal analysis unless verified separately — and nothing here
verifies it. The single most important form of this rule: governing law,
jurisdiction, and how different states or regions treat a clause are OUTSIDE
KNOWLEDGE, never document content, even when the question the visitor is
really asking is "can they enforce this against me."

Do not claim a document SHOULD contain something merely because it doesn't.

BAD: "The absence of a governing law clause is a material gap."
BAD: "Governing law clauses are typically present in agreements of this type."
BAD: calling any single missing clause "the primary factor" in an unresolved
question — that ranks unknowns against each other using outside judgment this
tool doesn't have.
GOOD: "This document does not state which law governs the agreement."

When a missing piece of information is what stands between the document and
the visitor's question, say so plainly — "The document alone therefore cannot
answer your enforceability question" — never that the document is defective
for lacking it.

Only conclude a provision is absent if the supplied text is complete enough to
support that. An excerpt supports "no such provision appears in the text you
supplied," not "no such clause exists anywhere in the document." Prefer
"this document doesn't state X" over calling a section "incomplete," unless
the document itself says more terms live elsewhere.

Do not state a legal consequence of signing beyond what the document itself
says. "The agreement says disputes are subject to binding arbitration and
includes jury-trial and class-action waivers" is supported; "by signing, you
accept these waivers" states a legal effect this tool cannot establish.

Do not silently convert a general visitor statement ("I want to know what I'd
be giving up") into a specific unstated fact — unvested equity at a current
employer, an existing non-compete, a resignation plan. A conditional is fine:
"If you have unvested compensation or restrictions at your current employer,
compare those separately — this agreement doesn't tell us what you'd be
leaving behind."

OUTSIDE HELP

Do not recommend a professional merely because the document is legal, medical,
insurance-related, or financially consequential.

Recommend outside help only when:
- the visitor faces a material unresolved issue,
- the document cannot answer it,
- specialized interpretation would materially affect the next decision.

Prefer the least escalatory relevant source first:
- issuer / benefits administrator / HR / insurer / landlord / school / agency
before
- attorney / accountant / clinician / specialist

unless professional expertise is clearly warranted.

OUTSIDE HELP stays inside the same boundary as OUTSIDE-WORLD QUESTIONS above.
Never explain how different jurisdictions treat a clause ("some states void
non-competes entirely; others enforce them with modifications" is outside
knowledge, not document content, even inside an outside-help item). State only
that the document doesn't resolve the question and name who could — never add
the jurisdiction-specific legal explanation yourself.

VOICE

Direct.
Plain.
Specific.
Calm.

Do not use fear to create urgency.

Do not describe documents as "deliberately obscure."

Do not congratulate yourself for finding hidden fine print.

The output should feel like someone carefully read the document with the visitor's
question in mind.

DOCUMENT DETECTIVE — NORTH STAR

Document Detective does not complete the document.

It investigates the document the visitor supplied.

Tell them:
- what it says
- what matters to their stated situation
- what is easy to overlook
- what it does not answer
- what they might reasonably ask next

When the visitor asks a question the document cannot answer, identifying that
boundary is a successful answer. Never cross it merely to be more helpful.

Return only valid JSON matching the requested schema.`;

// Structural safety net — the same job the prompt's own "AT MOST" limits
// ask the model to do, enforced in code so a dense document (this tool's
// whole reason to exist) can't truncate the response into a parse failure.
const ARRAY_CAPS = {
  needs_attention: 6,
  money: 5,
  also_relevant: 5,
  doesnt_appear_relevant: 4,
  buried_but_important: 4,
  practical_next_steps: 5,
  questions_to_ask: 5,
  outside_help: 3,
};

function capArrays(data) {
  if (!data || typeof data !== 'object') return data;
  for (const [key, max] of Object.entries(ARRAY_CAPS)) {
    if (Array.isArray(data[key]) && data[key].length > max) data[key] = data[key].slice(0, max);
  }
  return data;
}

router.post('/document-detective', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      document,        // The full text of the document
      pdfBase64,       // Optional: a data URL ("data:application/pdf;base64,...") from an uploaded file
      documentType,    // 'insurance_eob', 'school_newsletter', 'hoa_notice', 'lease', 'policy_update', 'benefits', 'government', 'medical', 'legal', 'other'
      mySituation,     // Their context: "renter, no kids, have a dog", "single, 28, healthy, basic plan"
      concerns,        // Optional: specific things they're worried about
      userLanguage, userLocale, userCurrency, userRegion,
    } = req.body;

    const hasPdf = typeof pdfBase64 === 'string' && pdfBase64.length > 100;

    if (!hasPdf && !document?.trim()) {
      return res.status(400).json({ error: 'Paste the document you received, or upload the file.' });
    }
    if (!mySituation?.trim()) {
      return res.status(400).json({ error: "Tell us your situation so we can filter what's relevant." });
    }

    // The "data:application/pdf;base64,..." header is stripped here, not on
    // the client — the client just hands the browser's own data URL across
    // unmodified. media_type is fixed to 'application/pdf', never guessed
    // from the data URL's own prefix — bill-rescue shipped a PDF as
    // 'image/jpeg' that way (commit 164fffee) and every upload 500'd.
    const pdfBlocks = hasPdf
      ? [{
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: pdfBase64.slice(pdfBase64.indexOf(',') + 1),
          },
        }]
      : [];

    const userPrompt = `DOCUMENT TYPE (a hint for interpreting conventions in this kind of document — it assists interpretation, never overrides what the document text actually says): ${documentType || 'not specified'}

VISITOR'S SITUATION: ${mySituation.trim()}
VISITOR'S CONCERN: ${concerns?.trim() || 'not specified'}

${hasPdf
  ? 'DOCUMENT: attached as a PDF above this message — it is the sole source of truth for what it says.'
  : `DOCUMENT TEXT (the sole source of truth for what it says):\n${document.trim().slice(0, 12000)}`}

Return ONLY valid JSON matching this schema:

{
  "document": {
    "type": "What type of document this appears to be, in the document's own terms",
    "bottom_line": "One grounded sentence: the single most important thing in this document for this person, or 'Nothing in this document requires your attention given what you told us.'"
  },

  "needs_attention": [
    {
      "status": "CLEAR FROM DOCUMENT | REASONABLE READING | NEEDS CLARIFICATION",
      "what": "An action the document itself requires, or that clearly follows from a document requirement plus a supplied fact",
      "why_it_matters_to_you": "Which supplied fact makes this relevant",
      "source": "Where this appears in the document (section, heading, or a short locator)",
      "deadline": "Only a deadline actually stated or directly derivable from the document plus a supplied date — otherwise empty",
      "if_you_do_nothing": "Only a consequence the document actually states — otherwise empty",
      "what_to_do": "Only what the document itself supports — otherwise empty"
    }
  ],

  "money": [
    {
      "status": "CLEAR FROM DOCUMENT | REASONABLE READING | NEEDS CLARIFICATION",
      "what": "A charge, credit, deduction, benefit, limit, or formula actually present in the document",
      "amount_or_rule": "The actual amount or rule as stated — if the document only gives a formula or discretion, describe that rather than inventing a number",
      "when": "When it takes effect, if stated",
      "source": "Where this appears in the document"
    }
  ],

  "also_relevant": [
    {
      "status": "CLEAR FROM DOCUMENT | REASONABLE READING | NEEDS CLARIFICATION",
      "what": "Something material to this visitor that doesn't require immediate action",
      "why_it_matters": "Which supplied fact makes this relevant to them specifically",
      "source": "Where this appears in the document"
    }
  ],

  "doesnt_appear_relevant": [
    {
      "what": "A document section or provision that doesn't appear to apply",
      "why": "Why the supplied facts make this reasonably clear — not merely an absence of mention",
      "could_change_if": "The specific missing fact that would change this conclusion"
    }
  ],

  "buried_but_important": [
    {
      "what": "Genuinely consequential language that's easy to overlook",
      "source": "Where it appears in the document",
      "why_easy_to_miss": "A fact about the document's structure or wording — never a claim about the reader's state of mind or what people 'normally' do"
    }
  ],

  "practical_next_steps": [
    "A low-risk suggestion, clearly a suggestion — never phrased as a document requirement, and never with an invented time or effort estimate"
  ],

  "questions_to_ask": [
    "A specific question worth asking the document's issuer"
  ],

  "outside_help": [
    {
      "question": "The unresolved question",
      "why_the_document_doesnt_resolve_it": "Why the document alone can't answer this",
      "who_to_ask_first": "The least escalatory relevant source — issuer, HR, landlord, school, agency — before a professional, unless professional expertise is clearly warranted"
    }
  ]
}

Empty sections return []. Do not force entries.

Every "status" value must be written exactly as one of these three English strings — CLEAR FROM DOCUMENT, REASONABLE READING, NEEDS CLARIFICATION — even when the rest of your response is in another language. The frontend matches this value literally to choose a badge color; a translated status renders as a blank badge.

LIMITS (keep the response compact so it never gets cut off): needs_attention AT MOST 6, money AT MOST 5, also_relevant AT MOST 5, doesnt_appear_relevant AT MOST 4, buried_but_important AT MOST 4, practical_next_steps AT MOST 5, questions_to_ask AT MOST 5, outside_help AT MOST 3. Amounts are short values in the user's local currency — never assume US dollars.

${NO_QUOTE_RULE}`;

    // withLanguage/withLocaleContext apply only to the system STRING, never to
    // a message content array — `array + string` coerces the array to
    // "[object Object],…", destroying both the prompt and the PDF block (this
    // exact bug broke every PDF upload on doctor-visit-translator, commit
    // 8199f070). userPrompt itself is always a plain string either way.
    let parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 6000,
      system: withLanguage(CORE_PROMPT, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: hasPdf ? [...pdfBlocks, { type: 'text', text: userPrompt }] : userPrompt }],
    }, { label: 'document-detective' });

    if (!parsed?.document?.bottom_line) {
      return res.status(500).json({ error: 'Could not generate a response. Please try again.' });
    }

    parsed = capArrays(parsed);
    // Defensive: the old schema had an aggregate confidence badge; the
    // CONFIDENCE section explicitly bans it. Strip it if an older-shaped
    // response ever slips through.
    delete parsed.confidence;
    delete parsed.confidence_note;

    // v2 guard (PF-39a). Fail-open: it wraps a working answer.
    try {
      const fields = [['document.bottom_line', parsed.document?.bottom_line]];
      (parsed.needs_attention || []).forEach((item, i) => {
        fields.push([`needs_attention[${i}].what`, item.what]);
        if (item.why_it_matters_to_you) fields.push([`needs_attention[${i}].why_it_matters_to_you`, item.why_it_matters_to_you]);
        if (item.if_you_do_nothing) fields.push([`needs_attention[${i}].if_you_do_nothing`, item.if_you_do_nothing]);
        if (item.what_to_do) fields.push([`needs_attention[${i}].what_to_do`, item.what_to_do]);
      });
      (parsed.money || []).forEach((item, i) => {
        fields.push([`money[${i}].what`, item.what]);
        if (item.amount_or_rule) fields.push([`money[${i}].amount_or_rule`, item.amount_or_rule]);
      });
      (parsed.also_relevant || []).forEach((item, i) => {
        fields.push([`also_relevant[${i}].what`, item.what]);
        fields.push([`also_relevant[${i}].why_it_matters`, item.why_it_matters]);
      });
      (parsed.doesnt_appear_relevant || []).forEach((item, i) => {
        fields.push([`doesnt_appear_relevant[${i}].what`, item.what]);
        fields.push([`doesnt_appear_relevant[${i}].why`, item.why]);
        if (item.could_change_if) fields.push([`doesnt_appear_relevant[${i}].could_change_if`, item.could_change_if]);
      });
      (parsed.buried_but_important || []).forEach((item, i) => {
        fields.push([`buried_but_important[${i}].what`, item.what]);
        fields.push([`buried_but_important[${i}].why_easy_to_miss`, item.why_easy_to_miss]);
      });
      (parsed.practical_next_steps || []).forEach((step, i) => fields.push([`practical_next_steps[${i}]`, step]));
      (parsed.questions_to_ask || []).forEach((q, i) => fields.push([`questions_to_ask[${i}]`, q]));
      (parsed.outside_help || []).forEach((item, i) => {
        fields.push([`outside_help[${i}].question`, item.question]);
        fields.push([`outside_help[${i}].why_the_document_doesnt_resolve_it`, item.why_the_document_doesnt_resolve_it]);
        if (item.who_to_ask_first) fields.push([`outside_help[${i}].who_to_ask_first`, item.who_to_ask_first]);
      });

      // The guard's own check call is text-only and never receives the PDF
      // (attaching it twice would double the cost for no real benefit — the
      // guard is checking for invented outside facts, not re-reading the
      // document). When the document was a PDF, tell the checker so plainly,
      // the same way contract-decoder does for its own PDF path: it cannot
      // verify a `source` locator against text it never saw, so it must
      // trust this tool's own extraction for THAT and confine itself to the
      // violation types that don't require seeing the document at all.
      const documentBlock = hasPdf
        ? `THE DOCUMENT WAS SUPPLIED AS A PDF. You cannot see it — the "source" and quoted/paraphrased document language in the proposed output below is this tool's own extraction from a document you were not shown. Do not flag an item as unsupported merely because you cannot confirm its source locator or wording against text you don't have — that test would fail every true statement about a document you can't open. Flag only the violation types below that don't depend on seeing the document itself (invented outside practice, invented reader psychology, invented third-party obligations, absence-treated-as-opposite reasoning, a requirement stated for a suggestion, an aggregate confidence badge, an invented time/effort estimate) — never "unsourced_conclusion" or "broadened_or_strengthened_document_language" on this PDF path, since both require reading the document to judge.`
        : `THE DOCUMENT TEXT ITSELF IS THE SOLE SOURCE OF TRUTH:\n${document.trim().slice(0, 12000)}`;

      await runOutputGuard(parsed, {
        label: 'document-detective',
        fields,
        supplied: `DOCUMENT TYPE (hint only): ${documentType || 'not specified'}
VISITOR'S SITUATION: ${mySituation.trim()}
VISITOR'S CONCERN: ${concerns?.trim() || '(not supplied)'}

${documentBlock}`,
        promise: `Read a long document through this visitor's specific situation and surface only what actually requires their attention, affects their money, or matters to their circumstances — grounded in the document's own language, with genuine uncertainty shown rather than filled in.

THE ONE RULE THAT DECIDES MOST OF THESE. A conclusion is supported when the document text actually says it, or is a cautious, clearly-labeled connection between the document and a fact the visitor supplied. Anything else — outside law, standard practice, what an organization usually does, what a professional would advise, who besides the document's own party owes money — is NOT supported unless the visitor supplied it.

Flag "your claim is almost certainly still valid" (the document alone can't establish claim validity), "the neighbour or their insurer would need to cover that" (the document saying something isn't covered under one provision doesn't establish who else owes for it), "insurers routinely apply betterment" or "easy to miss when anxious" (invented outside practice or reader psychology), and "there is no indication the flat was unoccupied, so this exclusion isn't a concern" (absence of a fact is not evidence of its opposite — the correct handling states what would need to be true and notes the visitor didn't say).

THE MOST IMPORTANT ONE: governing-law and enforceability reasoning. Flag "the absence of a governing-law clause is a material gap," calling that absence "the primary factor" in an unresolved question, "governing law clauses are typically present in agreements of this type," and any explanation of how different states or jurisdictions treat a clause (e.g. "some states void non-competes entirely; others enforce them with modifications") — all of that is outside legal knowledge, not document content, however naturally it reads. The correct handling is flat and short: "This document does not state which law governs the agreement," and if that's what stands between the document and the visitor's question, "the document alone cannot answer that." Also flag a legal-effect verb standing in for a consequence ("by signing, you accept these waivers") when the document itself only states what the clause provides, and any visitor fact that got invented rather than supplied (unvested equity, an existing non-compete, a resignation plan the visitor never mentioned).

Do not flag a status of REASONABLE READING or NEEDS CLARIFICATION merely for existing — those are the tool's own way of showing real uncertainty, which is correct, not a violation.`,
        guard: router.outputGuard,
        requiredNonEmpty: ['document.bottom_line'],
        userLanguage,
      });
    } catch (guardErr) {
      console.log('[document-detective] v2 guard skipped:', guardErr.message);
    }

    res.json(parsed);

  } catch (error) {
    console.error('Document Detective error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
