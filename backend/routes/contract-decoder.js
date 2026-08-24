// contract-decoder.js — DeftBrain V2
const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { groundedFacts, normalizeKeyPart } = require('../lib/groundedFacts');
const { runOutputGuard } = require('../lib/outputGuard');

router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'unsupported_legal_conclusion',
    'unsupported_enforceability_claim',
    'unsupported_risk_rating',
    'unsupported_fairness_or_standardness_claim',
    'invented_contract_fact',
    'assumed_jurisdiction',
    'prescriptive_legal_advice',
    'contract_language_stated_as_legal_result',
    'invented_illustrative_scenario',
    'generic_boilerplate_not_from_this_contract',
    'legal_effect_verb_as_consequence',
    'invented_user_premise',
    'claim_from_unquoted_clause',
    'false_precision',
  ],
  require: [
    'quoted_contract_grounding',
    'plain_english_explanation',
    'actionable_questions',
    'structural_completeness',
  ],
};


const SYSTEM_BASE = `You are Contract Decoder, a DeftBrain tool that helps a signer understand a contract before signing.

Explain what the document says in ordinary language. Identify terms that materially affect the signer, questions worth asking, and possible points to clarify or negotiate.

Be definite about what the document actually says. Be careful about judgments the document cannot establish.

Do not rate the contract or a clause high/medium/low risk. Do not call a clause fair, unfair, standard, unusual, safe, dangerous, legal, illegal, valid, invalid, enforceable, or unenforceable unless current applicable law has been specifically verified and supports that statement.

A CONTRACT ESTABLISHES WHAT IT SAYS. IT DOES NOT BY ITSELF ESTABLISH WHAT A PARTY CAN LEGALLY DO, CANNOT DO, SUE FOR, RECOVER, FORFEIT, ENFORCE, OR BE LIABLE FOR.

That is the governing rule of this tool. Unless the legal consequence has been independently verified for the stated jurisdiction — and any verified law is supplied to you explicitly, so if you were given none then none was verified — describe it as the APPARENT EFFECT OF THE CONTRACT LANGUAGE rather than as a legal fact.

The test is mechanical. Take any sentence you are about to write about what happens to the signer and ask: does this state a consequence in the world, or what the document says? If it states a consequence, it needs law you were given. If you were not given it, move the sentence back onto the page: what the clause provides, what it purports to do, what it appears to require. The difference is one phrase at the front, and it is the whole difference:

DO NOT ADJUDICATE A CASE AGAINST THE CLAUSE. Permits, applies, binds, waives, entitles, requires and covers are fine as descriptions of what the agreement provides. They become legal rulings the moment you run a specific scenario through them and announce the outcome:

  NO:  a 40% increase falls squarely within what this clause permits
  YES: the clause allows renewal increases without a stated limit, so the supplied text does not itself cap the increase
  NO:  after continued use the new terms apply
  YES: the agreement says continued use constitutes acceptance of the new terms

The first of each pair decides the case. The second reports the document, and leaves the deciding to whoever is entitled to do it.

NOTHING ABOUT THE VISITOR THAT THEY DID NOT TYPE. Their company size, how they use the service, how many people depend on it, what it would cost them to switch, how important it is to their operation — none of that is in a contract, and a sentence whose premise is one of those is invented however reasonable it sounds. "Because you use this software across the whole company" and "the whole company relies on the service" state facts about a stranger's business. Make it conditional instead: if this service is operationally important to you, if you hold customer data in it. The conditional is honest and just as useful, because the reader knows which branch they are on.

ONE QUOTE, ONE EXPLANATION. Everything you write under a quoted term must come from that quote. If a different clause is what makes the point — a fee schedule, a professional-services rate, a definition elsewhere — either quote THAT clause as its own term or name it explicitly in the sentence. Do not blend a second clause silently into the first: a reader checking the quoted words will not find what you said there, and will be right not to trust the rest.

  NO:  you cannot reclaim your work or withhold delivery as leverage
  YES: under the contract's wording, the work is the Company's from creation, so the agreement does not leave you delivery as leverage
  NO:  you forfeit the right to that money entirely
  YES: the clause states that unbilled work is not compensable
  NO:  you give up any right to be credited as the author
  YES: the clause purports to waive moral rights, including attribution

Waivers, forfeitures and assignments are the clearest cases: a clause can purport to waive a right that the law where it applies does not permit to be waived, and you do not know which law applies. Explain the document. Let the signer ask a lawyer what it achieves.

Do not assume jurisdiction from the visitor's locale, currency, IP region, or location. If contract jurisdiction is unknown, say so when jurisdiction would materially affect an explanation.

Do not invent missing terms or declare that the contract lacks a protection merely because you would expect one. You may say that the supplied text does not appear to address a specific practical question.

NO ILLUSTRATIVE SCENARIOS. Do not stage a situation the visitor did not describe — "if you complete a week of work and plan to invoice at the end of the week", "suppose the Company terminates in month three". The practical effect is stronger stated directly: work completed but not yet invoiced is expressly excluded from compensation. A hypothetical adds circumstances that are not theirs and buries the point inside them.

Negotiation language is an option, not a command. Phrase it as one possible way to ask for a change.

Use only facts in the supplied contract and visitor context, plus any VERIFIED CURRENT LAW block supplied in the prompt. Return only valid JSON with no markdown or commentary outside the JSON.

Never place a double-quote (") character inside any JSON string value. This matters most in the quote field, where you are copying contract language that often contains them: replace inner quote marks with single quotes. An unescaped one breaks the JSON and the tool returns nothing.`;

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanList(value, max) {
  return Array.isArray(value)
    ? value.map(cleanString).filter(Boolean).slice(0, max)
    : [];
}

function normalizeDraft(value) {
  const terms = Array.isArray(value?.important_terms)
    ? value.important_terms.slice(0, 6).map((term) => ({
        heading: cleanString(term?.heading),
        quote: cleanString(term?.quote).slice(0, 300),
        plain_english: cleanString(term?.plain_english),
        practical_effect: cleanString(term?.practical_effect),
        question_to_consider: cleanString(term?.question_to_consider),
        possible_negotiation_ask: cleanString(term?.possible_negotiation_ask) || null,
      })).filter(term => term.heading && term.quote && term.plain_english && term.practical_effect)
    : [];

  const clarifications = Array.isArray(value?.things_to_clarify)
    ? value.things_to_clarify.slice(0, 4).map((item) => ({
        observation: cleanString(item?.observation),
        question: cleanString(item?.question),
      })).filter(item => item.observation && item.question)
    : [];

  const legalQuestions = Array.isArray(value?.legal_questions)
    ? value.legal_questions.slice(0, 5).map((item) => ({
        topic: cleanString(item?.topic),
        why_relevant: cleanString(item?.why_relevant),
      })).filter(item => item.topic && item.why_relevant)
    : [];

  return {
    summary: cleanString(value?.summary),
    important_terms: terms,
    things_to_clarify: clarifications,
    before_you_sign: cleanList(value?.before_you_sign, 4),
    legal_questions: legalQuestions,
  };
}

function validateOutput(value) {
  if (!value?.summary || !Array.isArray(value?.important_terms) || value.important_terms.length === 0) {
    return false;
  }
  return value.important_terms.every(term =>
    term.heading && term.quote && term.plain_english && term.practical_effect
  );
}

router.post('/contract-decoder/stream', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const {
    contractText,
    pdfBase64,
    context,
    jurisdiction,
    userLanguage,
    userLocale,
    userCurrency,
    userRegion,
  } = req.body;

  const hasPdf = typeof pdfBase64 === 'string' && pdfBase64.length > 100;
  if (!hasPdf && (!contractText?.trim() || contractText.trim().length < 100)) {
    return res.status(400).json({ error: 'Paste the contract text or upload the file.' });
  }

  // The kind of agreement was a dropdown the visitor had to answer before the
  // tool would read a document that says so on the first line, and the focus
  // areas asked them to guess which clauses matter before reading it. Both are
  // questions that made the form longer without making the answer better.
  const focusList = '';
  const jurisdictionLine = jurisdiction?.trim()
    ? `\nStated contract jurisdiction/location: ${jurisdiction.trim()}. Do not infer anything more specific.`
    : `\nContract jurisdiction/location: not supplied. Do not substitute the visitor's locale or region.`;
  const contextLine = context?.trim()
    ? `\nVisitor context: ${context.trim()}`
    : '';

  // A PDF goes to the model as a document block; it reads them natively, and
  // browser-side text extraction produces mojibake that passes a length check.
  const documentBlock = hasPdf
    ? `${contextLine}${focusList}${jurisdictionLine}\n\nThe contract is the attached PDF. Read the whole document. Quote from it exactly as it appears.`
    : `${contextLine}${focusList}${jurisdictionLine}\n\nContract text:\n---\n${contractText.trim()}\n---`;

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

  const firstPassPrompt = `Read this contract and produce a grounded first-pass explanation for the signer. Identify what kind of agreement it is from the document itself — do not ask and do not assume.

${documentBlock}

Return ONLY valid JSON in this exact shape:
{
  "summary": "2-3 sentence plain-English description of what this agreement does and the most consequential terms visible in the supplied text",
  "important_terms": [
    {
      "heading": "short descriptive heading",
      "quote": "exact excerpt from the supplied contract, maximum 300 characters",
      "plain_english": "What the quoted language says, in ordinary words. A translation of the sentence, not a verdict on it: keep legal-consequence verbs out — barred, forbidden, liable, entitled, forfeited — and say what the clause provides."
      "practical_effect": "What this means for the signer in practice IF THE TERM APPLIES AS WRITTEN — and it must not restate the clause, because plain_english directly above it already did. Restating is the failure mode: 'the clause states that all work product belongs to the Company' adds nothing to a reader who has just read that sentence in ordinary words. Say what it reaches into: a personal project built at the weekend falls inside this wording; an invoice sent in March is not payable until June; the restriction runs after the engagement ends, not only during it. Frame it as the apparent effect of the language — under this wording, as written, on its face — never as a legal outcome.",
      "question_to_consider": "a useful question the signer could ask about this term",
      "possible_negotiation_ask": "one optional, neutral way to ask for a change, or null"
    }
  ],
  "things_to_clarify": [
    {
      "observation": "a practical question THIS contract raises and does not answer clearly — an undefined term, a right the text grants without saying how it is exercised, a duty with no stated limit. It must trace to language actually in the supplied document. Not what contracts of this kind sometimes contain, not what other clauses elsewhere often do, and not a prompt to consult an attorney or an accountant: generic legal caution is not an observation about this contract.",
      "question": "a concise question the signer could ask"
    }
  ],
  "before_you_sign": ["concrete verification or clarification step grounded in this document"],
  "legal_questions": [
    {
      "topic": "only a legal rule whose current status would materially change the explanation",
      "why_relevant": "the exact contract term that makes verification useful"
    }
  ]
}

Rules:
- At most 6 important_terms — fewer is better. Reserve them for the terms with the largest practical consequence for the signer; a term that merely restates a routine obligation does not earn a quote, a translation, an effect, a question and a negotiation box. At most 4 things_to_clarify, 4 before_you_sign items, and 5 legal_questions.
- Do not repeat a point across sections. If a term is covered in important_terms, before_you_sign should not restate it — it should say what to DO about it, or say nothing.
- Every important term must quote language actually present in the supplied contract.
- Do not create a legal_question merely because the contract type often raises that issue. Include one only when this document contains a term for which current law could materially change the explanation.
- If jurisdiction is unknown, legal_questions may identify what would need verification, but do not state jurisdiction-specific law.
- Do not score risk, diagnose fairness, or prescribe what the signer must do.`;

  try {
    const firstRaw = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 6000,
      system: withLanguage(SYSTEM_BASE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: [...pdfBlocks, { type: 'text', text: firstPassPrompt }] }],
    }, { label: 'contract-decoder-v2-first-pass' });

    const first = normalizeDraft(firstRaw);
    if (!validateOutput(first)) {
      return res.status(500).json({ error: 'Unexpected response format. Please try again.' });
    }

    let verifiedLawBlock = '';
    if (jurisdiction?.trim() && first.legal_questions.length) {
      const topics = first.legal_questions.map(q => q.topic).join('; ');
      const facts = await groundedFacts({
        cacheKey: `contract-law-v2:${normalizeKeyPart(jurisdiction)}:${normalizeKeyPart(topics)}`,
        label: 'contract-decoder-v2-targeted-law',
        userPrompt: `Verify only the following current legal questions for ${jurisdiction.trim()} as of today, because they were raised by terms actually present in a contract: ${first.legal_questions.map(q => `${q.topic} — ${q.why_relevant}`).join(' | ')}. Use authoritative government, statutory, regulatory, or court sources where available. Skip any proposition you cannot verify. Do not add unrelated contract-law rules.\n\nReturn ONLY valid JSON:\n{ "verified": [{ "topic": "topic", "rule": "narrow verified rule", "authority": "statute/regulation/case or official source", "effective": "effective date if material and known", "source": "source domain" }] }`,
        render: (cleanFacts) => {
          if (!Array.isArray(cleanFacts.verified) || !cleanFacts.verified.length) return '';
          return cleanFacts.verified.map(f =>
            `- ${f.topic}: ${f.rule} (${f.authority}${f.effective ? `; ${f.effective}` : ''}; source: ${f.source})`
          ).join('\n');
        },
      });
      verifiedLawBlock = facts || '';
    }

    let final = first;
    if (verifiedLawBlock) {
      const finalPrompt = `Refine this grounded contract explanation using ONLY the verified current-law facts below where they materially affect a term already identified. Do not add unrelated legal commentary. Do not convert a narrow verified rule into a broad claim that the whole clause or contract is legal, illegal, enforceable, unenforceable, fair, unfair, safe, or risky.

VERIFIED CURRENT LAW FOR THE STATED JURISDICTION:
${verifiedLawBlock}

FIRST-PASS ANALYSIS:
${JSON.stringify(first)}

Return ONLY valid JSON with this exact public shape:
{
  "summary": "...",
  "important_terms": [{
    "heading": "...",
    "quote": "...",
    "plain_english": "...",
    "practical_effect": "...",
    "question_to_consider": "...",
    "possible_negotiation_ask": "... or null"
  }],
  "things_to_clarify": [{ "observation": "...", "question": "..." }],
  "before_you_sign": ["..."]
}`;

      const finalRaw = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 6000,
        system: withLanguage(SYSTEM_BASE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: finalPrompt }],
      }, { label: 'contract-decoder-v2-final' });
      final = normalizeDraft(finalRaw);
      if (!validateOutput(final)) {
        return res.status(500).json({ error: 'Unexpected response format. Please try again.' });
      }
    }

    // v2 guard (PF-39a). Fail-open: it wraps a working answer.
    try {
      const fields = [['summary', final.summary]];
      final.important_terms.forEach((term, i) => {
        fields.push([`important_terms[${i}].plain_english`, term.plain_english]);
        fields.push([`important_terms[${i}].practical_effect`, term.practical_effect]);
        // question_to_consider is visitor-facing text like any other, and it
        // was the one field of the six not being checked — which is where the
        // legal conclusions kept surfacing after the others were cleaned.
        if (term.question_to_consider) fields.push([`important_terms[${i}].question_to_consider`, term.question_to_consider]);
        fields.push([`important_terms[${i}].heading`, term.heading]);
        if (term.possible_negotiation_ask) fields.push([`important_terms[${i}].possible_negotiation_ask`, term.possible_negotiation_ask]);
      });
      final.things_to_clarify.forEach((item, i) => {
        fields.push([`things_to_clarify[${i}].observation`, item.observation]);
        fields.push([`things_to_clarify[${i}].question`, item.question]);
      });
      final.before_you_sign.forEach((item, i) => fields.push([`before_you_sign[${i}]`, item]));

      await runOutputGuard(final, {
        label: 'contract-decoder',
        fields,
        supplied: `CONTRACT TYPE: whatever the document itself shows it to be
STATED JURISDICTION: ${jurisdiction?.trim() || '(not supplied — do not infer one)'}
VISITOR CONTEXT: ${context?.trim() || '(not supplied)'}
${verifiedLawBlock ? `VERIFIED CURRENT LAW:\n${verifiedLawBlock}` : 'NO LAW WAS VERIFIED — any legal conclusion is unsupported.'}

${hasPdf
  ? `THE CONTRACT WAS SUPPLIED AS A PDF. You cannot see it — but the quotes below ARE the contract, verbatim, and they are your source of truth for everything else:\n${final.important_terms.map(term => `- "${term.quote}"`).join('\n')}\n\nYOUR EVIDENCE IS PARTIAL AND YOU MUST ACT ACCORDINGLY. Those quotes are a handful of excerpts from a longer document you cannot open, so absence from them proves nothing. Do not flag a statement as invented merely because you cannot confirm it — that test would fail every true sentence about the parts you were not shown.

Flag only:
- a statement that CONTRADICTS a quote above, or
- a legal, enforceability, fairness, standardness or risk claim, which needs verified law rather than the document, or
- an illustrative scenario, a prediction, or advice to consult a professional.

For everything else about the contract's contents, assume the generator read the document and you did not.`
  : `CONTRACT TEXT:\n${contractText.trim().slice(0, 12000)}`}

THE CONTRACT TEXT ITSELF IS THE SOURCE OF TRUTH. A term is supported when the quoted language says it; anything about fairness, standardness, enforceability or risk is NOT in the document and needs verified law, which is listed above or absent.`,
        promise: `Explain what this contract says in ordinary language, name the terms that materially affect the signer, and give questions worth asking before signing.

THE ONE RULE THAT DECIDES MOST OF THESE. A contract establishes what it SAYS. It does not by itself establish what a party can legally do, cannot do, sue for, recover, forfeit, enforce, or be liable for. Unless that consequence appears in the verified-law block above — and if there is no such block, nothing was verified — the text must describe it as the apparent effect of the contract language, not as a legal fact.

So flag "you cannot withhold delivery", "you forfeit that payment", "they can sue you for it", "this is unenforceable", "you would be liable". Do not flag "under the contract's wording, the work is the Company's from creation", "the clause states that unbilled work is not compensable", "the agreement purports to waive moral rights" — those describe the document, which is what the document can support.

THREE MORE, and they are the ones that survive the phrasing rule:

1. A CASE ADJUDICATED AGAINST THE CLAUSE. Permits, applies, binds, waives, covers and requires are fine describing what the agreement provides, and become rulings when a specific scenario is run through them and the outcome announced. Flag "a 40% increase falls squarely within what this clause permits" and "after continued use the new terms apply". Do not flag "the clause allows renewal increases without a stated limit" or "the agreement says continued use constitutes acceptance".

2. A PREMISE ABOUT THE VISITOR THAT IS NOT IN THE INPUTS. Company size, how they use the service, how many people depend on it, what switching would cost, how central it is to their operation. Flag "because you use this software across the whole company" and "the whole company relies on the service". A conditional is not a violation: "if this service is operationally important to you" invents nothing.

3. A CLAIM SOURCED FROM A CLAUSE THAT WAS NOT QUOTED. Everything under a quoted term must come from that quote. If the explanation asserts something the quoted words do not contain — a fee, a rate, a definition living elsewhere — flag it unless the sentence names the other clause it came from.`,
        guard: router.outputGuard,
        // The quote field is excluded on purpose: it is verbatim contract text,
        // and "unsupported" is not a thing a verbatim excerpt can be.
        requiredNonEmpty: ['summary', ...final.important_terms.map((_, i) => `important_terms[${i}].plain_english`)],
        userLanguage,
        locale: withLocaleContext(userLocale, userCurrency, userRegion),
      });
    } catch (guardErr) {
      console.error('[contract-decoder] v2 guard skipped:', guardErr.message);
    }

    res.json(stripCites({
      summary: final.summary,
      important_terms: final.important_terms,
      things_to_clarify: final.things_to_clarify,
      before_you_sign: final.before_you_sign,
    }));
  } catch (err) {
    console.error('[contract-decoder] Error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Analysis failed. Please try again.' });
    }
  }
});

function stripCites(val) {
  if (typeof val === 'string') return val.replace(/<\/?(antml:)?cite\b[^>]*>/g, '');
  if (Array.isArray(val)) return val.map(stripCites);
  if (val && typeof val === 'object') {
    return Object.fromEntries(Object.entries(val).map(([k, v]) => [k, stripCites(v)]));
  }
  return val;
}

module.exports = router;
