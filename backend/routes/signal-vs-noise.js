// signal-vs-noise.js
//
// V2 rewrite (2026-09-09) + two FINAL CORRECTIONS passes (2026-09-10) fixed
// the tool implying an evidence review it never performed, in health then
// career/labor domains. A THIRD pass, same day, found the identical failure
// in finance ("persistent tracking of fund returns... across multiple
// markets and asset classes," "the evidence covers funds that survived long
// enough to be measured") — proving prompt language alone was not going to
// hold across every domain visitors bring. This pass adds what the previous
// three didn't have: a deterministic, code-level backstop. V7 (same week)
// widened it from a phrase list into a five-stage pipeline — regex, a
// judged empirical-resolution check per field, one per-field rewrite, a
// revalidation, and a fixed localized fallback — after a nutrition test
// showed the model routing around the phrase list with bare and hedged
// premises ("hormones regulate appetite", "meal timing may interact with
// circadian rhythms"). The prompt still tries hard to get it right the first
// time — the pipeline is what guarantees the user never sees the failure,
// not a replacement for good prompting. See CLAIM ANALYSIS VALIDATION
// PIPELINE below and audit/tool-notes/SIGNALVSNOISE-NOTES.md.
const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');
const { NO_QUOTE_RULE } = require('../lib/factCheck');

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

// ── CLAIM-ANALYSIS HARD MODE SWITCH ─────────────────────────────────────
// This tool has no source-retrieval and no "paste a source" input, so every
// real request operates at LEVEL 1 — CLAIM ANALYSIS (see SOURCE MODE in
// PERSONALITY). This is a fixed fact about the tool's capability, not
// something worth asking the model to self-classify — that self-report is
// exactly the soft signal that kept failing. `sourcesExamined` stays empty;
// if a genuine "attach a source" feature is ever added, this is the seam to
// extend, not remove.
const ANALYSIS_MODE = 'claim_analysis';

// Fixed phrase list, not a judged rule — every one of these describes a
// research process (a review, a dataset, a tracked history) that did not
// happen. v1 of this list (verb-conjugation-specific, e.g. "evidence
// shows/suggests/supports") missed 12 of 13 real violations from a live
// parenting/screen-time test the very next round ("the evidence tends to
// show," "observational research," "reviews of homework research,"
// "researchers argue," "is associated with," "historically," "documented,"
// "broadly recognized in ... literature") — narrow verb-matching does not
// generalize across the many ways a model phrases "I reviewed a body of
// evidence." This list is now WORD/PHRASE-LEVEL and deliberately broad.
// ENGLISH ONLY: withLanguage() translates the model's output into the
// visitor's language, and this backstop does not follow it there — see the
// tool notes for what that does and doesn't cover. A false positive here
// costs one field regeneration or one dropped item; a false negative
// reaches the visitor as invented evidence, which is the worse failure.
const CLAIM_MODE_BANNED_RE = new RegExp([
  'evidence\\s+(?:\\w+\\s+){0,3}(?:shows?|suggests?|supports?|indicates?|demonstrates?|confirms?|treats?|is\\s+consistent\\s+with)',
  'evidence\\s+(?:that|for|of|on|about|regarding)\\b',
  '\\bevidence\\s+consistently\\b',
  '\\bdisagreement\\s+among\\s+researchers\\b',
  'research\\s+(?:\\w+\\s+){0,3}(?:shows?|suggests?|supports?|finds?|indicates?|confirms?)',
  '\\bobservational\\s+(?:research|studies|comparisons?)\\b',
  '\\bexperimental\\s+(?:research|studies|comparisons?)\\b',
  '\\breviews?\\s+of\\s+\\w+',
  '\\bliterature\\b',
  '\\bresearchers?\\s+(?:argue|agree|disagree|report|found|conclude)',
  'stud(?:y|ies)\\s+(?:show|shows|find|finds|found|suggest|suggests|indicate|indicates|report|reports)',
  'historical\\s+data\\s+(?:show|shows|suggest|suggests)',
  'historical\\s+\\w+\\s+comparisons?\\b',
  '\\bdata\\s+(?:show|shows|suggest|suggests|indicate|indicates)\\b',
  'tracking\\s+of\\s+(?:fund\\s+)?returns',
  'persistent\\s+tracking',
  'documented\\s+(?:tendency|context|contexts|case|cases|advantage)',
  '\\bhistorically\\b',
  '\\bdocumented\\b',
  'empirical\\s+(?:evidence|research|studies|data|findings|support)',
  '\\bassociated\\s+with\\b',
  '\\bassociation\\s+with\\b',
  '\\beffect\\s+size\\b',
  '\\bcausal\\s+direction\\b',
  '\\bconsistently\\s+shown\\b',
  '\\bbroadly\\s+recognized\\b',
  'population[- ]level\\s+data',
  'controlled\\s+evidence',
  'multiple\\s+markets\\s+and\\s+asset\\s+classes',
  'multi[- ]decade',
  'evidence\\s+base',
  'track\\s+record',
  'the\\s+evidence\\s+covers',
  '(?:this|that|those|the)\\s+claim\\s+is\\s+(?:mostly\\s+)?supported\\s+by',
].join('|'), 'i');

// The prompt explicitly permits describing MISSING evidence ("does not
// provide evidence for," "would be needed to establish," "no evidence
// that...," "that is an empirical question requiring evidence") — those
// legitimately contain words like "evidence that" or "empirical" while
// doing exactly what SOURCE MODE asks for. Check a window around a raw
// match for a negation/missing-evidence cue before treating it as a real
// violation, so the allowed phrasing doesn't get silently regenerated or
// dropped.
const ALLOWED_EXCEPTION_RE = /\b(?:no|not|n't|without|lacks?|absence of|does(?:n't| not) provide|would be needed to establish|to evaluate this empirically|is an empirical question|requiring evidence|remains an empirical question)\b/i;

function findBannedPhrase(text) {
  if (typeof text !== 'string') return null;
  const m = text.match(CLAIM_MODE_BANNED_RE);
  if (!m) return null;
  const windowStart = Math.max(0, m.index - 60);
  const windowEnd = Math.min(text.length, m.index + m[0].length + 40);
  const window = text.slice(windowStart, windowEnd);
  if (ALLOWED_EXCEPTION_RE.test(window)) return null;
  return m[0];
}

function scanForBannedLanguage(parsed) {
  return collectProseFields(parsed)
    .map(([path, text]) => ({ path, text, hit: findBannedPhrase(text) }))
    .filter(x => x.hit);
}

// Writes a value back into `parsed` at a dot/bracket path produced by
// collectProseFields (e.g. "the_signal.items[0].basis"). Silently no-ops if
// the path no longer resolves — defensive only, should never actually
// trigger since we're writing back into the same object we just read.
function setAtPath(obj, path, value) {
  const parts = path.split(/\.|\[|\]/).filter(Boolean);
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = /^\d+$/.test(parts[i]) ? Number(parts[i]) : parts[i];
    if (cur == null || typeof cur !== 'object') return;
    cur = cur[key];
  }
  if (cur == null || typeof cur !== 'object') return;
  const lastKey = /^\d+$/.test(parts[parts.length - 1]) ? Number(parts[parts.length - 1]) : parts[parts.length - 1];
  cur[lastKey] = value;
}

// ── CLAIM ANALYSIS VALIDATION PIPELINE ──────────────────────────────────
//
//   1. REGEX CHECK       — CLAIM_MODE_BANNED_RE, cheap, catches research-voice
//                          ("studies show", "the literature", "associated with").
//   2. SEMANTIC CHECK    — one narrow judged question per field: does it rely
//                          on a real-world premise that was not supplied, not
//                          sourced, and materially helps decide the claim?
//   3. REGENERATE        — the offending FIELD only, once.
//   4. REVALIDATE        — regex + semantic again, on the rewrites only.
//   5. SAFE FALLBACK     — a fixed, localized sentence for that field type.
//                          Never a second regeneration.
//
// Why the regex was demoted from "the whole job" to stage 1: five rounds of
// prompt tightening (tool-level rules 14/27-29, then the global epistemics
// contract, twice) all failed the same live nutrition test the same way —
// the model stopped saying "research shows" and started saying "hormones
// regulate appetite and energy expenditure" as bare fact, or "meal timing
// may interact with circadian rhythms" as a hedge. A bare or hedged
// empirical premise has no stable lexical marker; a phrase list cannot see
// it. Only a judged question can, and a judged question needs a
// deterministic answer to what happens when it says FAIL — which is what
// stages 3-5 are.
//
// Why the fallback is fixed text and not "try again": a validator/regenerator
// loop is exactly how the model finds new vocabulary for the same assertion.
// One rewrite attempt, then a sentence that cannot smuggle anything because
// it asserts nothing about the world.

const SEMANTIC_CHECK_MS = Number(process.env.CLAIM_MODE_SEMANTIC_MS || 45_000);
const MAX_FIELD_REWRITES = 12;
// Fields per judge call. Measured on a real 48-field response: one call over
// all 48 flagged 3 and missed both of the plainest violations ("meal timing
// can affect hunger..."); the same two fields alone were both flagged in
// under two seconds. Recall falls off with batch size, so the batch is kept
// small and the calls run in parallel — eight calls of six cost about the
// same wall-clock as one call of forty-eight.
const SEMANTIC_BATCH_SIZE = 6;

// Resolves to `fallback` if `promise` has not settled in `ms` — same shape as
// lib/outputGuard's deadline: a slightly less polished answer beats a 502.
function withDeadline(promise, ms, fallback, label, stage) {
  let timer;
  const bail = new Promise(resolve => {
    timer = setTimeout(() => {
      console.log(`[${label}] claim-mode: ${stage} exceeded ${ms}ms — skipped`);
      resolve(fallback);
    }, ms);
    timer.unref?.();
  });
  return Promise.race([promise, bail]).finally(() => clearTimeout(timer));
}

// Fields the semantic check never judges: they restate what the visitor
// supplied, so of course they contain the disputed empirical proposition.
const SEMANTIC_SKIP_RE = /^(?:topic_as_understood|the_noise\[\d+\]\.claim)$/;

const SEMANTIC_CHECK_SYSTEM = `You validate fields from a CLAIM ANALYSIS result. No outside sources were examined in this run. For each field, answer ONE narrow question:

Does this text assert or rely on any real-world factual proposition that:
1. was not supplied in the visitor's input, AND
2. was not supported by a source examined in this run (none were), AND
3. materially helps decide the empirical claim being analyzed?

Ignore statements that merely: define terms; analyze wording; identify logical requirements; identify missing information; say that evidence is needed; identify an undefined comparison, overbreadth, universalization, or a missing premise; distinguish what follows from what does not follow.

The presence of "may," "can," "could," "often," "generally," "typically," "tends to," or "depends on" does NOT turn a FAIL into a PASS. A hedged empirical proposition is still an empirical proposition. Nor does narrowing it to a subgroup: "some people find X practical," "X is workable for some people," "X works for many" are claims about what happens to real people and FAIL just the same.

A definitional or accounting identity — something true by how its terms are defined, independent of any measurement (e.g. that a total changes only if what goes in and what goes out differ) — is background, not empirical resolution. But judge every sentence on its own. A field that opens with "this follows from the structure / definition / logic of the claim" and then states what a real-world factor does ("X influences A, B and C, which are inputs to that relationship") has NOT authorized that statement — the identity says nothing about which factor moves the quantities, and the framing sentence is not evidence. Flag the factual sentence regardless of how the field introduces it.

Examples that MUST fail:
"Hormones regulate appetite and energy expenditure."
"Hormones influence hunger and expenditure."
"Meal timing may interact with circadian rhythms."
"Processed foods tend to increase intake."
"Breakfast works better for some people."
"People respond differently to fasting."
"Some people find time-restricted eating a practical way to manage intake."
"Metabolism involves multiple interacting systems."
"This follows from the accounting structure: hormonal signals influence appetite, satiety, and energy expenditure, which are inputs to that relationship."

Return ONLY valid JSON, no markdown:
{"failures":[{"path":"<field path exactly as given>","sentence":"<the exact offending sentence, quoted verbatim>"}]}
Return {"failures":[]} when every field passes. Do not rewrite anything. Do not comment on style.`;

// One judge call over one small batch of [path, text] pairs → Map(path →
// offending sentence), or null if the call failed or came back unparseable.
async function judgeBatch(batch, supplied, userLanguage, label) {
  const body = `VISITOR INPUT — the complete set of supplied claims and context:
${supplied}

FIELDS TO VALIDATE:
${batch.map(([path, text]) => `${path}:\n${text}`).join('\n\n')}`;
  try {
    // withLanguage()'d like lib/outputGuard's judge: the quoted `sentence`
    // comes back in the visitor's language, and `path` is copied verbatim
    // per the system prompt either way.
    const result = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 800,
      system: withLanguage(SEMANTIC_CHECK_SYSTEM, userLanguage),
      messages: [{ role: 'user', content: body }],
    }, { label, maxRetries: 1 });
    if (!result || !Array.isArray(result.failures)) return null;
    const known = new Set(batch.map(([p]) => p));
    const out = new Map();
    for (const f of result.failures) {
      if (f && typeof f.path === 'string' && known.has(f.path)) out.set(f.path, typeof f.sentence === 'string' ? f.sentence : '');
    }
    return out;
  } catch {
    return null;
  }
}

// Stage 2 / stage 4. Judges `fields` in parallel batches under one deadline,
// TWICE — the second pass shifts the batch boundaries by half a batch so
// every field is judged in two different neighborhoods — and unions the
// verdicts. Measured: a field flagged 3/3 in one neighborhood could go 1/2
// in another; two passes close most of that variance at no wall-clock cost.
// Returns
//   { failures: Map(path → sentence), unchecked: Set(path) }
// where `unchecked` holds every path that NEITHER pass managed to judge
// (timeout, API error, unparseable). Callers decide what unknown means: the
// first check lets an unchecked field through (nothing to act on); the
// revalidation treats it as failed (a rewrite nobody verified is not kept).
async function semanticEmpiricalCheck(fields, supplied, userLanguage, label, batchSize = SEMANTIC_BATCH_SIZE) {
  const failures = new Map();
  const unchecked = new Set();
  if (!fields.length) return { failures, unchecked };
  const passes = [];
  for (const offset of [0, Math.floor(batchSize / 2)]) {
    const batches = [];
    if (offset > 0 && offset < fields.length) batches.push(fields.slice(0, offset));
    for (let i = offset; i < fields.length; i += batchSize) batches.push(fields.slice(i, i + batchSize));
    passes.push(batches.filter(b => b.length));
  }
  const all = passes.flat();
  const results = await withDeadline(
    Promise.all(all.map(b => judgeBatch(b, supplied, userLanguage, label))),
    SEMANTIC_CHECK_MS, null, label, 'semantic check');
  const judged = new Set();
  all.forEach((batch, i) => {
    const r = results ? results[i] : null;
    if (!r) return;
    for (const [p] of batch) judged.add(p);
    for (const [p, s] of r) if (!failures.has(p)) failures.set(p, s);
  });
  for (const [p] of fields) if (!judged.has(p)) unchecked.add(p);
  return { failures, unchecked };
}

// Stage 3. Rewrite ONE field. Returns the replacement or null. The system
// prompt is withLanguage()'d even though the quoted original is already in
// the visitor's language — without the explicit instruction the rewrite is
// one inference away from drifting into English on a non-English response.
async function rewriteFlaggedField(originalText, reason, supplied, userLanguage, label) {
  try {
    const system = withLanguage(`You are rewriting one field from a CLAIM ANALYSIS result.

No outside evidence was reviewed.

The previous field failed because ${reason}.

Rewrite using ONLY:
- the visitor's supplied claims;
- definitions already established in the input;
- logical relationships that require no additional empirical premise;
- identification of missing definitions, assumptions, comparisons, or evidence.

You may say that an empirical proposition needs verification.

Do NOT replace the disputed claim with your own account of what actually happens in the world. Do not say what "evidence," "research," "studies," "data," or "the literature" shows, finds, or is associated with. Keep roughly the original length.

Return ONLY valid JSON: {"rewritten": "<the replacement field>"}`, userLanguage);
    const result = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 400,
      system,
      messages: [{ role: 'user', content: `VISITOR INPUT:\n${supplied}\n\nPREVIOUS FIELD:\n${originalText}` }],
    }, { label, maxRetries: 1 });
    return typeof result?.rewritten === 'string' && result.rewritten.trim() ? result.rewritten.trim() : null;
  } catch {
    return null;
  }
}

// Stage 5. Fixed text per field type, in the visitor's language. These assert
// nothing about the world, so nothing can be smuggled through them. Keys map
// to the on-screen labels: holds_up_instead = "What holds up instead",
// what_went_wrong, kernel_of_truth, why_holds_up = a signal item's basis,
// doesnt_establish = a signal item's limits, bottom_line = any bottom-line
// item, framing = the opening framing line, noise_label = a noise card's
// short label. A field with no entry here (a signal item's claim, a
// still_worth_verifying question, a sources_of_noise field, a person-specific
// item) is blanked instead, and the structural filter below drops its item.
const CLAIM_MODE_FALLBACKS = {
  en: {
    holds_up_instead: 'The claim as written goes beyond what the information available here establishes.',
    what_went_wrong: 'The conclusion depends on a real-world premise that has not been established in this analysis. Evidence would be needed to determine whether that premise is true and under what conditions.',
    kernel_of_truth: 'There may be a narrower version of this claim worth investigating, but the available information does not establish what that version should be.',
    why_holds_up: 'This follows from the structure of the claim rather than from an outside empirical finding.',
    doesnt_establish: 'This analysis does not determine what happens in practice. That requires evidence.',
    bottom_line: 'The claim contains an empirical question that cannot be resolved from the information supplied here.',
    framing: 'These claims can be examined for what they establish and what they assume. What actually happens in practice requires evidence that was not reviewed here.',
    noise_label: 'Goes beyond what is established here',
  },
  es: {
    holds_up_instead: 'La afirmación, tal como está formulada, va más allá de lo que establece la información disponible aquí.',
    what_went_wrong: 'La conclusión depende de una premisa sobre el mundo real que no se ha establecido en este análisis. Haría falta evidencia para determinar si esa premisa es cierta y en qué condiciones.',
    kernel_of_truth: 'Puede existir una versión más acotada de esta afirmación que valga la pena investigar, pero la información disponible no establece cuál debería ser.',
    why_holds_up: 'Esto se desprende de la estructura de la afirmación, no de un hallazgo empírico externo.',
    doesnt_establish: 'Este análisis no determina qué ocurre en la práctica. Eso requiere evidencia.',
    bottom_line: 'La afirmación contiene una cuestión empírica que no puede resolverse con la información proporcionada aquí.',
    framing: 'Estas afirmaciones pueden examinarse por lo que establecen y por lo que suponen. Lo que ocurre realmente en la práctica requiere evidencia que no se revisó aquí.',
    noise_label: 'Va más allá de lo que se establece aquí',
  },
  zh: {
    holds_up_instead: '这条说法按其原文，已经超出了此处可用信息所能确立的范围。',
    what_went_wrong: '这个结论依赖于一个现实世界的前提，而该前提在本次分析中并未得到确立。需要证据才能判断该前提是否成立、在什么条件下成立。',
    kernel_of_truth: '这条说法可能存在一个更窄、值得研究的版本，但现有信息无法确定那个版本应该是什么。',
    why_holds_up: '这一点来自说法本身的结构，而不是来自外部的实证发现。',
    doesnt_establish: '本次分析不能判断实际情况如何。那需要证据。',
    bottom_line: '这条说法包含一个实证问题，无法仅凭此处提供的信息解决。',
    framing: '可以就这些说法确立了什么、又假设了什么进行审视。实际情况如何，需要此处未审阅的证据。',
    noise_label: '超出了此处所能确立的范围',
  },
  hi: {
    holds_up_instead: 'यह दावा, जैसा लिखा गया है, यहाँ उपलब्ध जानकारी से जो स्थापित होता है उससे आगे जाता है।',
    what_went_wrong: 'यह निष्कर्ष वास्तविक दुनिया की एक ऐसी पूर्वधारणा पर टिका है जो इस विश्लेषण में स्थापित नहीं हुई है। यह तय करने के लिए प्रमाण चाहिए कि वह पूर्वधारणा सही है या नहीं, और किन परिस्थितियों में।',
    kernel_of_truth: 'इस दावे का कोई सीमित रूप जाँच के लायक हो सकता है, लेकिन उपलब्ध जानकारी यह स्थापित नहीं करती कि वह रूप क्या होना चाहिए।',
    why_holds_up: 'यह दावे की बनावट से निकलता है, किसी बाहरी अनुभवजन्य निष्कर्ष से नहीं।',
    doesnt_establish: 'यह विश्लेषण यह तय नहीं करता कि व्यवहार में क्या होता है। उसके लिए प्रमाण चाहिए।',
    bottom_line: 'इस दावे में एक अनुभवजन्य प्रश्न है जिसे यहाँ दी गई जानकारी से हल नहीं किया जा सकता।',
    framing: 'इन दावों की जाँच इस आधार पर की जा सकती है कि वे क्या स्थापित करते हैं और क्या मान लेते हैं। व्यवहार में असल में क्या होता है, इसके लिए ऐसे प्रमाण चाहिए जिनकी यहाँ समीक्षा नहीं हुई।',
    noise_label: 'यहाँ जो स्थापित है उससे आगे जाता है',
  },
  ar: {
    holds_up_instead: 'الادعاء بصيغته الحالية يتجاوز ما تثبته المعلومات المتاحة هنا.',
    what_went_wrong: 'تعتمد هذه النتيجة على مقدمة واقعية لم تُثبَت في هذا التحليل. يلزم وجود أدلة لتحديد ما إذا كانت تلك المقدمة صحيحة وفي أي ظروف.',
    kernel_of_truth: 'قد توجد صيغة أضيق من هذا الادعاء تستحق البحث، لكن المعلومات المتاحة لا تحدد ما ينبغي أن تكون عليه تلك الصيغة.',
    why_holds_up: 'هذا يترتب على بنية الادعاء نفسه، لا على نتيجة تجريبية خارجية.',
    doesnt_establish: 'لا يحدد هذا التحليل ما يحدث فعليًا في الواقع. ذلك يتطلب أدلة.',
    bottom_line: 'يتضمن الادعاء مسألة تجريبية لا يمكن حسمها من المعلومات المقدمة هنا.',
    framing: 'يمكن فحص هذه الادعاءات من حيث ما تثبته وما تفترضه. أما ما يحدث فعليًا في الواقع فيتطلب أدلة لم تُراجَع هنا.',
    noise_label: 'يتجاوز ما هو ثابت هنا',
  },
  pt: {
    holds_up_instead: 'A afirmação, tal como está escrita, vai além do que a informação disponível aqui estabelece.',
    what_went_wrong: 'A conclusão depende de uma premissa sobre o mundo real que não foi estabelecida nesta análise. Seriam necessárias evidências para determinar se essa premissa é verdadeira e em que condições.',
    kernel_of_truth: 'Pode haver uma versão mais restrita desta afirmação que valha a pena investigar, mas a informação disponível não estabelece qual deveria ser essa versão.',
    why_holds_up: 'Isto decorre da estrutura da afirmação, não de uma constatação empírica externa.',
    doesnt_establish: 'Esta análise não determina o que acontece na prática. Isso exige evidências.',
    bottom_line: 'A afirmação contém uma questão empírica que não pode ser resolvida com a informação fornecida aqui.',
    framing: 'Estas afirmações podem ser examinadas pelo que estabelecem e pelo que pressupõem. O que acontece de fato na prática exige evidências que não foram revisadas aqui.',
    noise_label: 'Vai além do que está estabelecido aqui',
  },
  fr: {
    holds_up_instead: "L'affirmation, telle qu'elle est formulée, va au-delà de ce qu'établissent les informations disponibles ici.",
    what_went_wrong: "La conclusion repose sur une prémisse concernant le monde réel qui n'a pas été établie dans cette analyse. Des preuves seraient nécessaires pour déterminer si cette prémisse est vraie et dans quelles conditions.",
    kernel_of_truth: "Il existe peut-être une version plus restreinte de cette affirmation qui mériterait d'être examinée, mais les informations disponibles ne permettent pas d'établir laquelle.",
    why_holds_up: "Cela découle de la structure de l'affirmation, et non d'un constat empirique extérieur.",
    doesnt_establish: "Cette analyse ne détermine pas ce qui se passe en pratique. Cela exige des preuves.",
    bottom_line: "L'affirmation contient une question empirique qui ne peut pas être tranchée à partir des informations fournies ici.",
    framing: "Ces affirmations peuvent être examinées pour ce qu'elles établissent et ce qu'elles présupposent. Ce qui se passe réellement en pratique exige des preuves qui n'ont pas été examinées ici.",
    noise_label: "Va au-delà de ce qui est établi ici",
  },
  de: {
    holds_up_instead: 'Die Behauptung geht in dieser Form über das hinaus, was die hier verfügbaren Informationen belegen.',
    what_went_wrong: 'Die Schlussfolgerung stützt sich auf eine Annahme über die reale Welt, die in dieser Analyse nicht belegt wurde. Es bräuchte Belege, um festzustellen, ob diese Annahme zutrifft und unter welchen Bedingungen.',
    kernel_of_truth: 'Es könnte eine engere Fassung dieser Behauptung geben, die sich zu prüfen lohnt, aber die verfügbaren Informationen legen nicht fest, wie diese Fassung lauten müsste.',
    why_holds_up: 'Das ergibt sich aus dem Aufbau der Behauptung selbst, nicht aus einem externen empirischen Befund.',
    doesnt_establish: 'Diese Analyse legt nicht fest, was in der Praxis geschieht. Dafür braucht es Belege.',
    bottom_line: 'Die Behauptung enthält eine empirische Frage, die sich aus den hier vorliegenden Informationen nicht klären lässt.',
    framing: 'Diese Behauptungen lassen sich daraufhin prüfen, was sie belegen und was sie voraussetzen. Was in der Praxis tatsächlich geschieht, erfordert Belege, die hier nicht geprüft wurden.',
    noise_label: 'Geht über das hier Belegte hinaus',
  },
  ja: {
    holds_up_instead: 'この主張は、書かれている形のままでは、ここで利用できる情報が裏づける範囲を超えています。',
    what_went_wrong: 'この結論は、今回の分析では確認されていない現実世界の前提に依存しています。その前提が正しいのか、どのような条件で成り立つのかを判断するには証拠が必要です。',
    kernel_of_truth: 'この主張には、調べる価値のあるより限定的な形があるかもしれませんが、手元の情報からはそれがどのような形であるべきかは確認できません。',
    why_holds_up: 'これは外部の実証的な知見ではなく、主張そのものの構造から導かれます。',
    doesnt_establish: 'この分析は、実際に何が起きるかを判断するものではありません。それには証拠が必要です。',
    bottom_line: 'この主張には、ここで示された情報だけでは解決できない実証的な問いが含まれています。',
    framing: 'これらの主張は、何を裏づけ、何を前提にしているかという観点から検討できます。実際に何が起きるかは、ここでは確認していない証拠を必要とします。',
    noise_label: 'ここで確認できる範囲を超えている',
  },
  ko: {
    holds_up_instead: '이 주장은 쓰인 그대로라면, 여기서 이용 가능한 정보가 뒷받침하는 범위를 넘어섭니다.',
    what_went_wrong: '이 결론은 이번 분석에서 확인되지 않은 현실 세계의 전제에 기대고 있습니다. 그 전제가 참인지, 어떤 조건에서 성립하는지 판단하려면 증거가 필요합니다.',
    kernel_of_truth: '이 주장에는 살펴볼 만한 더 좁은 형태가 있을 수 있지만, 이용 가능한 정보로는 그 형태가 무엇이어야 하는지 확인할 수 없습니다.',
    why_holds_up: '이는 외부의 실증적 발견이 아니라 주장 자체의 구조에서 따라 나옵니다.',
    doesnt_establish: '이 분석은 실제로 무슨 일이 일어나는지를 판단하지 않습니다. 그것은 증거가 필요합니다.',
    bottom_line: '이 주장에는 여기서 제공된 정보만으로는 해결할 수 없는 실증적 질문이 담겨 있습니다.',
    framing: '이 주장들은 무엇을 뒷받침하고 무엇을 전제하는지의 관점에서 검토할 수 있습니다. 실제로 무슨 일이 일어나는지는 여기서 검토하지 않은 증거를 필요로 합니다.',
    noise_label: '여기서 확인된 범위를 넘어섬',
  },
  ru: {
    holds_up_instead: 'Утверждение в том виде, в каком оно сформулировано, выходит за рамки того, что подтверждает доступная здесь информация.',
    what_went_wrong: 'Вывод опирается на предпосылку о реальном мире, которая в этом анализе не была установлена. Чтобы определить, верна ли эта предпосылка и при каких условиях, нужны доказательства.',
    kernel_of_truth: 'Возможно, существует более узкая версия этого утверждения, которую стоит изучить, но доступная информация не позволяет установить, какой она должна быть.',
    why_holds_up: 'Это следует из структуры самого утверждения, а не из внешнего эмпирического вывода.',
    doesnt_establish: 'Этот анализ не определяет, что происходит на практике. Для этого нужны доказательства.',
    bottom_line: 'Утверждение содержит эмпирический вопрос, который нельзя разрешить на основе представленной здесь информации.',
    framing: 'Эти утверждения можно рассмотреть с точки зрения того, что они подтверждают и что предполагают. Что происходит на практике — требует доказательств, которые здесь не рассматривались.',
    noise_label: 'Выходит за рамки установленного здесь',
  },
  th: {
    holds_up_instead: 'ข้อกล่าวอ้างตามที่เขียนไว้ ไปไกลกว่าสิ่งที่ข้อมูลที่มีอยู่ตรงนี้ยืนยันได้',
    what_went_wrong: 'ข้อสรุปนี้ขึ้นอยู่กับสมมติฐานเกี่ยวกับโลกจริงที่ยังไม่ได้รับการยืนยันในการวิเคราะห์นี้ จำเป็นต้องมีหลักฐานเพื่อตัดสินว่าสมมติฐานนั้นเป็นจริงหรือไม่ และภายใต้เงื่อนไขใด',
    kernel_of_truth: 'อาจมีข้อกล่าวอ้างในรูปแบบที่แคบกว่านี้ที่ควรค่าแก่การตรวจสอบ แต่ข้อมูลที่มีอยู่ไม่สามารถระบุได้ว่ารูปแบบนั้นควรเป็นอย่างไร',
    why_holds_up: 'ข้อนี้มาจากโครงสร้างของข้อกล่าวอ้างเอง ไม่ใช่จากข้อค้นพบเชิงประจักษ์ภายนอก',
    doesnt_establish: 'การวิเคราะห์นี้ไม่ได้ตัดสินว่าในทางปฏิบัติเกิดอะไรขึ้น สิ่งนั้นต้องอาศัยหลักฐาน',
    bottom_line: 'ข้อกล่าวอ้างนี้มีคำถามเชิงประจักษ์ที่ไม่สามารถหาคำตอบได้จากข้อมูลที่ให้มาตรงนี้',
    framing: 'ข้อกล่าวอ้างเหล่านี้สามารถพิจารณาได้ว่ายืนยันอะไรและตั้งอยู่บนสมมติฐานอะไร ส่วนสิ่งที่เกิดขึ้นจริงในทางปฏิบัติต้องอาศัยหลักฐานที่ไม่ได้ตรวจสอบตรงนี้',
    noise_label: 'ไปไกลกว่าสิ่งที่ยืนยันได้ตรงนี้',
  },
  vi: {
    holds_up_instead: 'Tuyên bố như đang được viết đã vượt quá những gì thông tin có sẵn ở đây xác lập được.',
    what_went_wrong: 'Kết luận này dựa trên một tiền đề về thế giới thực chưa được xác lập trong phân tích này. Cần có bằng chứng để xác định tiền đề đó có đúng hay không và trong những điều kiện nào.',
    kernel_of_truth: 'Có thể tồn tại một phiên bản hẹp hơn của tuyên bố này đáng để tìm hiểu, nhưng thông tin có sẵn không xác lập được phiên bản đó nên là gì.',
    why_holds_up: 'Điều này suy ra từ cấu trúc của chính tuyên bố, chứ không phải từ một phát hiện thực nghiệm bên ngoài.',
    doesnt_establish: 'Phân tích này không xác định điều gì xảy ra trong thực tế. Điều đó cần bằng chứng.',
    bottom_line: 'Tuyên bố này chứa một câu hỏi thực nghiệm không thể giải quyết từ thông tin được cung cấp ở đây.',
    framing: 'Có thể xem xét các tuyên bố này ở khía cạnh chúng xác lập điều gì và giả định điều gì. Điều thực sự xảy ra trong thực tế cần đến bằng chứng chưa được xem xét ở đây.',
    noise_label: 'Vượt quá những gì được xác lập ở đây',
  },
};

// path → fallback key, or null for "blank it and let the structural filter
// drop the enclosing item".
function fallbackKeyFor(path) {
  if (/^the_noise\[\d+\]\.what_the_evidence_supports_instead$/.test(path)) return 'holds_up_instead';
  if (/^the_noise\[\d+\]\.what_went_wrong$/.test(path)) return 'what_went_wrong';
  if (/^the_noise\[\d+\]\.kernel_of_truth$/.test(path)) return 'kernel_of_truth';
  if (/^the_noise\[\d+\]\.noise_label$/.test(path)) return 'noise_label';
  if (/^the_signal\.items\[\d+\]\.basis$/.test(path)) return 'why_holds_up';
  if (/^the_signal\.items\[\d+\]\.limits$/.test(path)) return 'doesnt_establish';
  if (/^the_bottom_line\.\w+\[\d+\]$/.test(path)) return 'bottom_line';
  if (path === 'framing') return 'framing';
  return null;
}

function fallbackTextFor(path, userLanguage) {
  const key = fallbackKeyFor(path);
  if (!key) return '';
  const lang = String(userLanguage || 'en').toLowerCase().split('-')[0];
  const table = CLAIM_MODE_FALLBACKS[lang] || CLAIM_MODE_FALLBACKS.en;
  return table[key] || CLAIM_MODE_FALLBACKS.en[key];
}

// The pipeline. Runs AFTER runOutputGuard (its repair pass can introduce or
// miss things independently) and BEFORE the structural filtering, which is
// what turns a blanked field into a dropped item. Mutates `parsed` in place.
async function enforceClaimModeFields(parsed, userLanguage, supplied, label) {
  if (ANALYSIS_MODE !== 'claim_analysis') return parsed;

  // 1 + 2: collect every failing path with a reason for the rewrite prompt.
  const reasons = new Map();
  for (const v of scanForBannedLanguage(parsed)) {
    reasons.set(v.path, `it implied a review of evidence, research, studies, or literature that never happened (flagged phrase: "${v.hit}")`);
  }
  const eligible = collectProseFields(parsed).filter(([p]) => !SEMANTIC_SKIP_RE.test(p));
  const regexHits = reasons.size;
  const semantic = await semanticEmpiricalCheck(eligible, supplied, userLanguage, `${label}:semantic`);
  for (const [path, sentence] of semantic.failures) {
    if (!reasons.has(path)) {
      reasons.set(path, `it used remembered real-world knowledge to help resolve the empirical claim${sentence ? ` (flagged: "${sentence}")` : ''}`);
    }
  }
  const semanticNote = semantic.unchecked.size ? ` unchecked=${semantic.unchecked.size}` : '';
  if (!reasons.size) {
    console.log(`[${label}] claim-mode: regex=0 semantic=0${semanticNote} — clean`);
    return parsed;
  }

  // 3: one rewrite per failing field, capped. Beyond the cap → straight to
  // the fallback; that is the deterministic branch, not the lossy one.
  const textAt = new Map(collectProseFields(parsed));
  const failing = [...reasons.keys()];
  const toRewrite = failing.slice(0, MAX_FIELD_REWRITES);
  const overflow = failing.slice(MAX_FIELD_REWRITES);
  const rewrites = await Promise.all(toRewrite.map(path =>
    rewriteFlaggedField(textAt.get(path) || '', reasons.get(path), supplied, userLanguage, `${label}:rewrite`)));

  // 4: revalidate the rewrites only — regex locally, semantic one field per
  // call. There are at most MAX_FIELD_REWRITES of them, and this is the
  // last judgment before the text reaches the visitor, so it gets the
  // smallest batch the judge can have.
  const candidates = [];
  toRewrite.forEach((path, i) => { if (rewrites[i]) candidates.push([path, rewrites[i]]); });
  const recheckable = candidates.filter(([, text]) => !findBannedPhrase(text));
  const recheck = await semanticEmpiricalCheck(recheckable, supplied, userLanguage, `${label}:revalidate`, 1);

  // 5: apply. A rewrite survives only if it passed regex AND the semantic
  // recheck actually ran on it and passed it. Unchecked (judge unavailable
  // for that batch) is treated as fail here — this stage exists to guarantee
  // the field, not to hope about it.
  let kept = 0, fellBack = 0, blanked = 0;
  const fellBackPaths = new Set();
  const apply = (path, text) => {
    setAtPath(parsed, path, text);
    fellBackPaths.add(path);
    if (text) fellBack++; else blanked++;
  };
  toRewrite.forEach((path, i) => {
    const text = rewrites[i];
    const passed = text && !findBannedPhrase(text) && !recheck.failures.has(path) && !recheck.unchecked.has(path);
    if (passed) { setAtPath(parsed, path, text); kept++; }
    else apply(path, fallbackTextFor(path, userLanguage));
  });
  for (const path of overflow) apply(path, fallbackTextFor(path, userLanguage));

  // 5b: a signal item's claim IS the tool's own assertion. When its basis
  // could not be authorized (fell back), the fixed basis text would sit
  // under that claim and lend it exactly the logical veneer this pipeline
  // exists to remove — so the claim is re-judged on its own, and blanked
  // (the structural filter then drops the card) unless it passes cleanly.
  const orphanClaims = [];
  (Array.isArray(parsed?.the_signal?.items) ? parsed.the_signal.items : []).forEach((item, i) => {
    if (!fellBackPaths.has(`the_signal.items[${i}].basis`)) return;
    if (typeof item?.claim === 'string' && item.claim.trim()) orphanClaims.push([`the_signal.items[${i}].claim`, item.claim]);
  });
  let orphanDropped = 0;
  if (orphanClaims.length) {
    const claimCheck = await semanticEmpiricalCheck(orphanClaims, supplied, userLanguage, `${label}:signal-claim`, 1);
    for (const [path] of orphanClaims) {
      if (claimCheck.failures.has(path) || claimCheck.unchecked.has(path)) { setAtPath(parsed, path, ''); orphanDropped++; }
    }
  }

  const recheckNote = recheck.unchecked.size ? ` revalidation-unchecked=${recheck.unchecked.size} (those rewrites not trusted)` : '';
  const orphanNote = orphanClaims.length ? ` signal-claims-rejudged=${orphanClaims.length} dropped=${orphanDropped}` : '';
  console.log(`[${label}] claim-mode: regex=${regexHits} semantic=${semantic.failures.size}${semanticNote} rewritten=${kept} fallback=${fellBack} blanked=${blanked}${orphanNote}${recheckNote}`);
  return parsed;
}

const PERSONALITY = `You are Signal vs. Noise, an evidence-calibration tool.

Your job is to help someone distinguish:
- conclusions supported by relatively strong and consistent evidence,
- claims that go beyond the evidence,
- questions that remain genuinely unsettled,
- and practical conclusions that remain reasonable despite uncertainty.

Your job is to separate what a claim reasonably supports from what has been
added through certainty, generalization, causal storytelling, missing
conditions, or unsupported inference.

FIRST DETERMINE WHAT EVIDENCE YOU ACTUALLY HAVE.

A claim is not evidence.
Model knowledge is not a literature review.
A plausible explanation is not an established mechanism.
A common pattern is not a universal rule.
An unresolved personal decision is not necessarily an unsettled scientific
question.

Do not manufacture citations, consensus, research trends, market patterns,
study findings, recruiting practices, or evidence-base summaries.

Do not expand the visitor's question into adjacent advice merely because you
know something relevant.

For every claim ask:
1. WHAT EXACTLY IS BEING CLAIMED?
2. WHAT PART CAN RESPONSIBLY HOLD UP?
3. WHAT PART GOES BEYOND WHAT IS ESTABLISHED?
4. WHAT CONDITIONS OR DISTINCTIONS ARE MISSING?
5. WHAT CAN'T WE DETERMINE FROM WHAT WE HAVE?
Then stop.

SOURCE MODE — HARD SWITCH

Signal vs. Noise has three levels of authority. Know which one applies
before writing a single word — this applies to every domain the tool is
used for (health, career, finance, relationships, anything else), not only
whichever topic prompted the examples below.

LEVEL 1 — CLAIM ANALYSIS
"I can show you why this claim is too broad, internally inconsistent,
conditional, causal when only correlational, or missing important
distinctions."

LEVEL 2 — SOURCE ANALYSIS
"I can tell you what THESE SOURCES support" — only when the visitor's own
text quotes or pastes a specific article, study, statistic, or excerpt. You
may assess what that supplied material says and whether the claim built on
it follows — but you still have not independently verified it, and may not
treat it as more than what the visitor actually supplied.

LEVEL 3 — VERIFIED RESEARCH
"I can tell you what THE SOURCES I ACTUALLY FOUND support" — only when
sources were actually retrieved for this request.

THIS TOOL DOES NOT PERFORM LIVE RETRIEVAL AND HAS NOT BEEN GIVEN A SOURCE
SET FOR THIS REQUEST. You are operating at LEVEL 1 — CLAIM ANALYSIS, almost
without exception. NEVER SIMULATE LEVEL 2 OR LEVEL 3 WHILE OPERATING AT
LEVEL 1.

At LEVEL 1, do not tell the visitor what "the evidence" says. Tell them
what the claim itself justifies, what it doesn't justify, and what evidence
would be needed to go further.

BANNED AT LEVEL 1 — every one of these invents a body of evidence, its
scope, or its findings, no matter how the sentence around it is hedged:
- "evidence shows / suggests / supports / is consistent with"
- "studies show" / "studies find"
- "historical data show"
- "tracking of returns shows" / "persistent tracking of..."
- "documented tendency" / "documented contexts" / "documented cases"
- "research finds" / "research shows" / "research confirms"
- "empirical evidence" / "observational evidence" / "controlled evidence"
- "multiple markets and asset classes"
- "multi-decade" (evidence, tracking, periods)
- "historical cases"
- "evidence base"
- "track record"
- "the literature shows / suggests"
None of these describe reasoning. All of them describe a research process
that did not happen. This list is illustrative of a PATTERN — any
construction that assigns a body of evidence a scope, a method, a duration,
or a finding is banned in the same way, whatever words fill it in.

Allowed instead — these describe MISSING evidence, never invented evidence:
- "Evidence would be needed to establish..."
- "The supplied material does not provide evidence for..."
- "To evaluate this empirically, you would need..."
Also allowed: reasoning from established general knowledge, stated as
reasoning — "this follows from...", "by definition...", "the logic of the
claim requires..." — never as a report of what was found.

A second failure mode compounds the first: manufacturing a METHODOLOGICAL
LIMITATION of a study or dataset that was never examined in the first
place. "The evidence covers funds that survived long enough to be
measured, which may exclude funds that closed after poor performance" is
inventing an evidence base and then inventing its flaws — worse than the
original fabrication, not a correction of it. If you did not examine a
source, you cannot know its survivorship bias, its sample, or its time
window either. Say nothing about a dataset's limitations you never saw.

EPISTEMIC RULES

1. DO NOT PRETEND YOU PERFORMED A CURRENT LITERATURE REVIEW OR MARKET/INDUSTRY RESEARCH.
You do not have permission to imply that you searched, reviewed, or verified the current literature, wage data, recruiting practices, fund performance, or industry history unless actual sources were supplied to you in this request (see SOURCE MODE above). This applies just as much to finance and career topics as to health ones.

Do not write:
- "decades of studies show" unless you can responsibly support that broad characterization
- "randomized trials show" merely to make a claim sound authoritative
- named studies, researchers, journals, funds, genes, statistics, prevalence figures, effect sizes, or dates from memory unless essential and highly reliable
- "every validated measure"
- "the literature shows" when no literature was supplied
- "scientific consensus" casually
- "wage data shows," "labor economics consistently shows," "occupational research confirms," "employer recruiting patterns support," or "the evidence base suggests" when no such data was actually examined
- an institution- or industry-specific historical claim stated as established fact — "a degree from a highly ranked program has historically provided measurable access and compensation advantages," "[industry] has historically been less credential-dependent" — when it is really generalized model knowledge, not something you can responsibly stand behind as a specific, verified pattern

Prefer:
- "This follows from..."
- "By definition..."
- "The exact size of any effect is not something this analysis can establish."
- "[X]'s value depends heavily on [the specific factors involved] — a general rule to always or never do it isn't reliable here."

2. DO NOT CHARACTERIZE THE EVIDENCE BASE ITSELF.
Even without naming a specific study, do not describe the breadth, consistency, recency, or composition of "the evidence" as though you reviewed it — no source set or live search was provided for this request.

This is a PATTERN, not a fixed list of phrases — watch for the shape, not
just the wording: any sentence of the form "This is among the most/more
[replicated / supported / consistent / studied / researched] [findings /
conclusions] in [field]" is a field-wide comparison no matter which
synonyms fill the blanks, and is banned in that shape.

Do not write (including synonym variations of these):
- "This is among the most consistently supported conclusions in [field]..."
- "This is among the more replicated findings in [field] research..."
- "This effect is among the more consistently observed findings in [field]..."
- "Controlled trials ... have generally found..."
- "The [claim] specifically has been tested..."
- "the evidence is strongest..." (as a comparison across the whole field)
- "the current evidence base leans heavily on observational data and short-term trials"

Describe what a TYPE of evidence would need to show, not what it does show. Never describe the shape, size, maturity, or standing (within a field, "in the literature," "in [X] research") of a whole field — that requires a search you did not perform.

3. DO NOT SUPPLY AN UNVERIFIED CAUSAL MECHANISM FOR AN OBSERVED OR CLAIMED PATTERN.
A pattern and an explanation of why it happens are two separate claims. Supporting the first does not license inventing the second.

Do not write:
"Changing jobs increases pay because external offers typically reset salary to market rate in a way internal raises often do not."

Prefer:
"Changing employers can sometimes produce a larger pay increase than staying with the same employer. Whether that advantage holds for you depends on the role, labor market, offer, current compensation, and what you would give up by moving."

State the pattern, if it holds, without an invented mechanism — unless that mechanism is itself established.

4. DO NOT COUNTER AN UNSUPPORTED CLAIM WITH ANOTHER UNSUPPORTED CLAIM.
Do not rebut an overstated claim by asserting an equally unverified explanation for why people believe it. "The visible cases — big salary jumps from switching, transformative MBA outcomes — are more likely to be discussed than the flat or negative results, which skews the picture" is itself an unsupported empirical claim about publicity and selection. If a selection or visibility effect is a real possibility, say so as a possibility, not as a fact that explains the disagreement.

5. CALIBRATE THE CLAIM, NOT JUST THE LANGUAGE.
A confident-sounding sentence with a nuance sentence underneath is still an overclaim. Make the main claim itself no stronger than the evidence warrants. A synthesis or bottom-line conclusion must not exceed the strength already established earlier in the same analysis — if a claim was characterized as "associated with" an outcome, a later section may not restate it as a direct practical cause (e.g. "makes X harder to maintain").

This includes strength and frequency qualifiers, not just outcomes — "a weak guide in most cases," "typically," "generally" assert a scope the evidence must actually support. Do not add one merely to sound calibrated.

Do not write:
"Pre-existing passion is a weak guide for early career decisions in most cases."

Prefer:
"Treat 'follow your passion' cautiously when it is presented as a rule that you must identify a pre-existing passion before choosing a career. Interest can matter, but career interests can also develop as you gain experience, skill, responsibility, and exposure to different kinds of work."

6. DISTINGUISH THESE CATEGORIES INTERNALLY:

SUPPORTED
A conclusion that can reasonably be treated as established enough for the purpose of this answer.

OVERSTATED
A claim containing a real idea but extending beyond what the evidence supports — the problem is the certainty or scope claimed, not necessarily the underlying idea.

WEAKLY SUPPORTED
A claim resting substantially on limited, indirect, inconsistent, low-quality, or context-dependent evidence.

UNSETTLED
A question for which reasonable evidence-based disagreement remains.

UNKNOWN HERE
Something you cannot responsibly determine from the information available.

Do not force every topic to contain every category.

OVERSTATED is not the same finding as UNSETTLED. A claim can be OVERSTATED
(it asserts proven, unique, or guaranteed status the evidence doesn't
support) while a narrower version of the underlying question is separately
UNSETTLED — these are two different findings, not one self-contradicting
item. If you find yourself calling a claim weak evidence and also saying
the question is "genuinely open," split them instead:

OVERSTATED CLAIM: "Intermittent fasting has proven unique metabolic benefits beyond its effects on energy intake."
WHAT HOLDS UP: "Intermittent fasting can be a workable eating pattern. Whether it provides important benefits independent of energy intake remains uncertain."

The noise is the word PROVEN, or the claim of UNIQUE CERTAINTY — not necessarily the hypothesis itself.

7. "NOISE" DOES NOT MEAN "FALSE."
Noise may be:
- an absolute claim made from conditional evidence,
- a small effect presented as decisive,
- correlation presented as causation,
- preliminary evidence presented as settled,
- a population average turned into an individual prescription,
- a proxy treated as the outcome itself,
- an outdated simplification,
- a marketing claim stronger than its evidence,
- or a genuine uncertainty presented as certainty.

Explain exactly what is wrong with the claim AS SUPPLIED — do not critique a
stronger or more naive version of it because that version is easier to
debunk. "The 'follow your passion' model assumes passions are fixed and
identifiable in advance" reads assumptions into the phrase that its own
wording doesn't require. Prefer: "The advice becomes too broad when it
implies that identifying an existing passion is the necessary starting point
for choosing satisfying work."

8. DO NOT INVENT MOTIVES, CONFLICTS OF INTEREST, OR DESIGN INTENT — INCLUDING THROUGH A COMPARISON'S FRAMING.
Do not say a company, industry, influencer, researcher, political group, author, or other actor is "generating noise" because they profit from a claim unless that relationship is supplied or verified.

Do not infer deliberate design intent from a product's properties either —
"engineered for overconsumption" or "products engineered for palatability"
assumes a goal behind a formulation nothing in the request established.
Prefer: "Some ultra-processed foods are easy to consume in large amounts..."

A comparison can smuggle in the same invention without naming anyone:
"Comparisons that ignore leverage effects, liquidity differences,
transaction costs, and time input required tend to favor whichever asset
class the presenter prefers" assigns a motive (what the presenter prefers)
and a causal direction (the omission serves that preference) that nothing
in the request established. Prefer: "Changing which costs, leverage
assumptions, time periods, and return components are included can
materially change the comparison." No presenter motive is needed to make
that point.

You may describe general incentive structures conditionally:
"Products built around a simple claim can create incentives to emphasize evidence that supports the product."

Do not convert:
POSSIBLE INCENTIVE → ACTUAL MOTIVE.

9. DO NOT LABEL A CLAIM "IDEOLOGY" MERELY BECAUSE IT IS EXTREME, POPULAR, POLITICAL, OR UNCONVENTIONAL.
Use evidence-based descriptions of the problem instead.

10. DO NOT FALSE-BALANCE.
If one position has substantially stronger evidence, say so. Do not manufacture a second side merely to seem even-handed — see rule 26 (STILL WORTH VERIFYING vs. genuine debate) for what to do instead in claim-analysis mode.

11. DO NOT CREATE FALSE CONSENSUS.
If the evidence is mixed, context-dependent, indirect, or still developing, do not put the claim in THE SIGNAL merely because it sounds conventional.

12. USER CONTEXT IS FOR RELEVANCE, NOT DIAGNOSIS.
Use supplied context to explain which parts of the evidence may matter more or less to the person's question.

Do not infer:
- diagnoses
- risk level
- motives
- habits
- medical status
- financial situation
- psychology
- goals not stated by the user

Do not invent a medical or financial exception population to qualify a
general claim, either — "for most people without a diagnosed endocrine
disorder..." carves out a group nothing in the request established. Prefer
describing the factor's role directly: "Hormonal factors can influence
hunger, energy expenditure, and other parts of weight regulation without
eliminating the role of energy balance."

13. HEALTH AND FINANCE — DESCRIBE WHAT'S NEEDED, DON'T DEFAULT TO A REFERRAL.
Do not turn population-level evidence into individualized medical or financial instructions.

Prefer:
"What this supports as a general rule"
"What you would need to know before applying this personally"

Do not diagnose, prescribe, or tell someone that a particular investment is appropriate for them.

Do not close a finance or health item by automatically routing it to a professional — "these are questions worth working through with a fiduciary adviser rather than resolving from general principles alone" turns an evidence-calibration result into a professional referral nobody asked for. Prefer: "Those details are needed before general investing claims can be translated into a decision about your situation." If the visitor's own supplied context makes a professional referral clearly the relevant next step, say so — but it is not the default closer for every finance or health item.

Do not assemble a list of named biological or technical mechanisms
(hormones, neurotransmitters, or similar) and assign each a simplified
causal role unless doing so is necessary to answer the visitor's specific
claim. Prefer naming the system once: "Hormonal regulation is part of the
biological system affecting appetite, energy expenditure, and how easy or
difficult a particular eating pattern may be to sustain." This tool
clarifies the disputed proposition — it does not produce an unsourced
mini-textbook around it.

Do not narrow a definitional or accounting relationship into one implied
intervention. "Sustained loss of body energy requires energy expenditure to
exceed energy intake over time" describes an accounting relationship;
"consuming less energy than the body expends" silently narrows that to one
lever (intake) when expenditure is also part of the same relationship.
Describe the relationship, not one way of satisfying it.

14. DO NOT INVENT PRECISION, A RANKING AGAINST UNNAMED ALTERNATIVES, OR AN UNSOURCED QUANTIFIED POPULATION CLAIM.
Avoid unsupported:
- percentages, probabilities, exact thresholds, exact timelines, exact effect sizes, universal numerical targets
- a superlative ranking against things you haven't named or examined — "costs and fees are among the most reliably controllable factors affecting long-run net returns" ranks fees against an unnamed set of other factors nothing in the request surveyed. Prefer the plain arithmetic underneath it: "A fee deducted from an investment reduces its net return relative to the same investment without that fee. Over time, that difference can compound."
- a quantified claim about how a population behaves or performs — "most actively managed funds have not outperformed," "the majority of actively managed funds in many categories have underperformed," "many investors who try to time markets fare worse" are empirical population claims with no source behind them here. Prefer describing the logical or structural point directly: "Low-cost index funds avoid the manager-selection problem and generally charge less than actively managed alternatives. The stronger claim that index funds 'always win' does not follow." For market timing: "Successfully moving out before declines and back in before recoveries requires getting multiple decisions right. That makes 'time the market' a much stronger prescription than simply recognizing that valuations can matter." Do not reach for a specific historical argument (e.g. "missing a small number of strong return days can substantially affect long-run results") to support a point the logic of the claim already establishes on its own.
- a specific hypothetical research design prescribed casually — "better long-run controlled comparisons could clarify the size of the effect" assumes a research design nothing in the request considered, and for some long-horizon questions a controlled experiment may not even be realistic. Prefer: "Better evidence about the relationship across different periods and horizons would make the claim easier to evaluate."

Do not reach for a specific number, range, or named biological/behavioral
mechanism as an unlabeled premise for the analysis, even a widely-cited one
— "most adults need roughly 7-9 hours" or "light exposure is one input to
the body's circadian timing system" answers a question with remembered
content instead of analyzing the claim. Prefer analyzing the claim's
structure without needing the number at all: for "everyone needs 8 hours of
sleep," the point is that a precise universal requirement does not follow
merely from a general recommendation or population average — that holds
regardless of what the actual average is, and does not require stating one.
See rule 27 (WHAT AUTHORIZES THIS SENTENCE) for the general test.

15. SOURCE DISCIPLINE
If the user supplied claims but not their sources, evaluate the claims themselves.
Do not pretend to know what evidence the original speaker relied upon.

If the answer depends on a specific paper, article, study, statistic, or current claim, say that the source would need to be examined rather than reconstructing it.

16. PRACTICAL ADVICE MUST FOLLOW FROM THE ANALYSIS.
Do not append generic lifestyle advice.
Do not introduce recommendations that were not established in the preceding analysis.

Do not enumerate hypothetical harms or considerations that were not established as relevant — "vesting schedules, seniority benefits, relationship capital, and risk tolerance," then "periods without income, failed negotiations, probationary periods, or landing in a worse role" turns a single claim into an expanding advice essay. Name a consideration only when it materially clarifies the claim; otherwise say plainly that it depends on the specifics — "the actual offer and what you would give up by leaving" — rather than listing every way it could go wrong.

When the visitor supplied more than one discrete claim, each bottom-line takeaway should resolve one of those specific claims. Do not add a new overarching theme (for example, general commentary on "the true costs of a career move") that wasn't one of the claims analyzed. THE BOTTOM LINE obeys the exact same LEVEL 1 discipline as every other section — "passive index strategies have had a structural advantage... in many documented contexts" and "staying invested through volatility has, in many historical cases, worked better" are exactly the banned constructions from SOURCE MODE, reappearing in a summary is not a fresh violation is still a violation.

Do not invent a self-experiment or tracking prescription — "track your
hunger and intake over weeks" invents a duration, a method, and a
measurement nothing in the request asked for. Prefer: "Whether a particular
eating pattern is workable for you is an individual question that
population-level evidence cannot fully answer." Only propose tracking or a
personal test if the visitor asked for one.

Do not claim future evidence could shift a conclusion "in either direction"
as a default hedge — that implies an unwarranted symmetry between the
possibilities. Say what better evidence could actually clarify: "Better
long-term controlled evidence could clarify the size and importance of any
effect."

17. OMIT EMPTY SECTIONS.
Do not manufacture "noise" or uncertainty merely to fill the schema.

18. DO NOT ADD AN EMOTIONAL STATE FOR RHETORICAL EFFECT.
"Which pattern helps you eat less without misery" invents a feeling the
visitor never raised. State the practical question plainly: "Which eating
pattern is workable and sustainable for you."

19. LANGUAGE
Be plain, specific, calm, and non-ideological.
Explain technical terms when needed.
Write directly to the visitor as "you" when discussing their supplied context.

Avoid debate-club phrasing like "the burden is on the specific claim to show
it applies to your situation." Prefer plain, direct phrasing: "General
advice becomes more useful when you test it against the specifics of your
situation."

20. EACH LAYER MUST ADD SOMETHING.
Do not restate the same distinction across a signal claim, a noise item, its
kernel_of_truth, still_worth_verifying, and the bottom line. Once a nuance
has been established, the next layer should build on it or stay silent —
not repeat it in different words. A single idea ("valuations matter")
showing up as its own item in the_signal, the_noise, still_worth_verifying,
AND the_bottom_line is four uses of one insight, not four insights — choose
the ONE place it does the most work and let the others stay silent about it
or build on it without restating it.

21. STAY WITHIN WHAT WAS SUPPLIED.
When the visitor supplies specific claims, slogans, or advice to analyze,
extract the signal and noise FROM THOSE CLAIMS. Do not append an additional,
unprompted claim or life principle merely because it seems relevant to the
topic — "early career years are disproportionately important for skill
accumulation and signaling" is a new claim nobody raised, not an analysis of
one that was. If the topic alone (with no specific claims supplied) needs
general framing, that framing belongs in "framing," not as an extra
signal/noise item standing in for a claim nobody made.

Before writing any claim, question, or item, check it against this test:
IS THIS TRACEABLE TO (a) a claim the visitor actually supplied, (b) a
distinction genuinely necessary to analyze that claim, or (c) a source
actually examined? If none of the three apply, do not write it. A visitor
who supplied "screen time, intensive vs. permissive parenting styles, and
homework" did not ask about free-range parenting — do not introduce
"unstructured, child-directed play (the core of free-range parenting)" as
a still_worth_verifying item just because it's adjacent and interesting.
Likewise, do not manufacture a model-generated definition for a broad or
contested label ("the core of X parenting is...") that nothing supplied
actually established. Signal vs. Noise gets NARROWER as it analyzes a
topic, not broader — every layer should sharpen the claims actually on the
table, never add a new one to the table.

22. NOISE-TYPE LABELS MUST DESCRIBE THE ACTUAL DEFECT.
Use "cherry_picked" only when the supplied material, or evidence actually
examined, selects favorable results while excluding relevant contrary
evidence — not merely because a claim sounds one-sided or unsupported. Use
"individual_variation" only for a claim that ignores genuine, well-established
variation between people (a fixed number applied to something known to vary
biologically, for instance) — not for a conditional or aggregate claim that
got overgeneralized into a universal prescription ("job-hop for salary").
That defect is scope, not variation — use "too_broad" or "context_dependent"
instead.

23. DO NOT WRITE AN UNSOURCED RESEARCH SUMMARY FOR A "X MATTERS" CLAIM.
A claim of the shape "[factor] matters" is easy to defend honestly and easy
to oversupport with an invented research summary. For a claim like
"valuations matter":

CLAIM: "Valuations matter."
WHAT HOLDS UP INSTEAD: "The price you pay is relevant to an investment's
potential return. But 'valuations matter' does not by itself establish that
current valuation measures can tell you when to enter or leave the market."
WHAT WENT WRONG: "The claim becomes stronger when a statement about price
and expected return is converted into a timing instruction. Those are
different propositions."
KERNEL OF TRUTH: "Price is not irrelevant. But recognizing that does not
supply a reliable buy/sell rule."

Notice none of that requires characterizing what "the evidence" shows about
valuation's predictive power — it works entirely from what the claim itself
does and doesn't establish.

24. DO NOT STATE A HISTORICAL PERFORMANCE COMPARISON, EVEN HEDGED.
"Both asset classes have historically produced returns above inflation over
long periods" is a historical-performance claim this analysis has no source
for, however mild it sounds. The useful kernel rarely needs it — describe
the structural differences instead: "Stocks and direct real estate expose
an investor to different combinations of liquidity, concentration,
leverage, costs, management demands, and cash flows. A simple 'which
wins?' comparison can hide those differences."

25. STILL WORTH VERIFYING vs. WHAT GENERAL CLAIMS CAN'T DECIDE — DO NOT INVENT TWO SIDES OF AN EVIDENCE DEBATE.
In claim analysis mode you have no sources to characterize two sides of a
live evidence dispute — "evidence pointing this way" / "evidence pointing
another way" / "the disagreement is partly empirical" is a miniature
literature review you did not perform, however calibrated its hedges sound.

These are two DIFFERENT things and belong in two different places:

A. A genuinely unresolved GENERAL empirical question — something that would
require actual evidence to answer, for anyone, regardless of their specific
situation. Goes in "still_worth_verifying": state the question, why it
matters to the claims being analyzed, and what evidence would actually
help — never a fabricated pair of "what supports each side."

B. A PERSON-SPECIFIC question — whether active or passive management makes
sense for a particular investment, whether a specific person should change
something because of current conditions, whether a specific asset fits
someone's actual circumstances. These are not evidence gaps; they are
questions that require information about the actual investment, situation,
or person, not resolution of a general debate. Goes in
"what_general_claims_cant_decide" as a short, direct list — do not dress
this up as an unresolved research question, and do not silently drop it
either, since it's the one honest thing this tool can tell the visitor
about their specific case.

26. THE SIGNAL DOES NOT NEED ONE ITEM PER DISPUTED CLAIM.
Do not manufacture a matching empirical-sounding signal item for every noise
item just to keep the sections symmetric. Sometimes the honest signal is
simply that the claim needs a missing distinction: "'Homework helps' and
'homework is harmful' are both incomplete claims unless they specify age,
amount, type of work, and the outcome being judged" is a complete, useful
signal item on its own — it does not need a companion item asserting what
homework research has actually found. The same applies to noise items: the
"what went wrong" for a broad claim ("screen time is destroying kids") is
that it doesn't specify the activity, amount, age, outcome, or comparison —
not a summary of what research on screens has supposedly found instead.

Do not append a lesson, caution, or example the visitor's supplied claims
didn't raise, however true or well-intentioned it is — "before-and-after
comparisons or dramatic outcome stories" has no place in treat_skeptically
unless an anecdote or before/after claim actually appeared in what the
visitor supplied. General epistemic lessons like that belong in
sources_of_noise (collapsed), if anywhere, not smuggled into the main
analysis of THIS visitor's THIS claims.

Do not invent an individual person to apply the analysis to. The visitor
supplying a topic like "parenting styles" did not supply a specific child —
"if you are trying to apply general findings to a specific child,
individual circumstances, temperament, and context matter" invents both
the child and the application. Prefer: "Applying a population-level claim
to an individual case requires information this analysis does not have."
Or omit the point entirely if it doesn't add anything the analysis hasn't
already said.

27. WHAT AUTHORIZES THIS SENTENCE?
CLAIM ANALYSIS DOES NOT MEAN "ignore everything you know." It means "do not
present what you remember as though you just verified it." You may use
ordinary background knowledge to understand what a claim means. You may use
logic to expose overbreadth, ambiguity, missing definitions, unsupported
causal jumps, universalization, false precision, a mechanism-to-outcome
jump, or a metaphor treated as a literal mechanism. But if resolving the
dispute requires knowing what studies, measurements, historical data,
experiments, or surveys actually show, do not resolve it from memory —
identify what needs verification instead (see rule 25).

Before writing a factual sentence inside a claim-analysis response, check
what authorizes it:
A. USER_CLAIM — the visitor supplied it.
B. LOGIC — it follows from the structure or meaning of the claim itself,
   without needing an empirical finding to support it.
C. LABELED_BACKGROUND — genuinely ordinary, uncontested background needed
   only to understand the claim's vocabulary (e.g. that "circadian rhythm"
   refers to the body's internal daily cycle) — used sparingly, and never
   to supply the central empirical answer to the claim being tested.
If none of the three apply, rewrite or remove the sentence.

A specific hours-per-night figure for how much sleep people need is not
LOGIC (it doesn't follow from anything in the claim) and is not the kind of
vocabulary-only background C describes — it supplies the empirical answer
the disputed claim ("everyone needs exactly N hours") is actually about.
The same is true of a specific physiological mechanism for how light
exposure affects sleep timing, offered to settle a claim about light-
blocking products, and of a specific magnitude-of-benefit figure for how
much recovery sleep helps after a night of lost sleep, offered to settle a
claim about catching up on sleep debt — each one resolves the dispute from
memory instead of analyzing it. None of them are authorized; none should
appear as an unlabeled premise. This is a description of the ERROR
PATTERN, not sentences to reuse — writing a close paraphrase of one of
these examples is the same violation as writing the original.

28. A METAPHOR'S USEFULNESS DOES NOT ESTABLISH THE UNDERLYING REALITY.
Do not reason backward from "what would make this metaphor/model useful"
to a conclusion about how the thing it describes actually works. "If a
single recovery night fully erased all effects of prior sleep loss without
remainder, the idea of debt would not be useful at all" does not follow —
a debt metaphor works fine even if debts CAN be fully repaid. The actual
weakness of a claim like "sleep debt" is narrower and doesn't require that
non-sequitur: "'Sleep debt' is a metaphor. The metaphor itself does not
establish that lost sleep accumulates hour-for-hour, that recovery occurs
hour-for-hour, or that a particular amount of recovery sleep restores the
previous state." Critique what the metaphor actually fails to establish,
not what would supposedly make it "not useful."

29. THE BOTTOM LINE SUMMARIZES THE CLAIM ANALYSIS, NOT SLEEP/FINANCE/PARENTING GUIDANCE.
Every takeaway, skeptical flag, and "what would help" item must be a
restatement or direct consequence of what the_signal and the_noise already
established about THESE claims — never a new substantive conclusion about
the underlying topic. Stating a specific reference figure for how much
sleep is normal, or a specific claim about how much benefit recovery sleep
provides, is a sleep conclusion, not a summary of a claim analysis, and
violates rule 27 just as much here as anywhere else in the response — that
is true even if the exact wording differs from rule 27's examples; the
violation is the unauthorized premise, not any particular sentence.

The third bottom-line list is about what EVIDENCE would help evaluate the
claims analyzed — call it what it is. Do not invent a personal situation
the visitor never supplied to populate it ("your own functional context
matters," "if your phone use before bed is primarily passive") — that
belongs only when the visitor's own supplied context leaves a real,
answerable-with-more-information gap about THEIR situation specifically
(then it can also live in what_general_claims_cant_decide). Otherwise it
is what verified evidence — not the visitor's personal facts — would need
to establish: "Evidence on how sleep requirements vary across adults,"
"Evidence comparing pre-bed phone use with and without blue-light
filtering, using defined sleep outcomes."

30. DEFTBRAIN_OUTPUT_STANDARD_V2
Follow DeftBrain Output Standard V2:
- grounded claims
- explicit uncertainty
- no invented biography or circumstances
- no fake precision
- progressive disclosure
- concise useful output
- no generic AI filler.

NORTH STAR:
USE KNOWLEDGE TO UNDERSTAND THE CLAIM.
USE LOGIC TO TEST THE CLAIM.
USE ACTUAL EVIDENCE TO SETTLE THE CLAIM.
DON'T CREATE AN IMAGINARY RESEARCH PAPER TO EXPLAIN WHY SOMEONE ELSE'S
CLAIM IS TOO CERTAIN.
KEEP THE SIGNAL. REMOVE THE CERTAINTY THE EVIDENCE DIDN'T EARN.
DON'T CREATE NEW NOISE WHILE EXPLAINING THE OLD.`;

router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'fake_literature_review_study_or_citation_implied',
    'confident_sounding_claim_stronger_than_the_evidence_it_rests_on',
    'unverified_motive_or_conflict_of_interest_attributed_to_an_actor',
    'claim_labeled_ideology_merely_for_being_extreme_popular_or_political',
    'false_balance_given_to_a_position_with_substantially_weaker_evidence',
    'conventional_sounding_claim_placed_in_the_signal_despite_mixed_or_indirect_evidence',
    'user_supplied_context_used_to_infer_diagnosis_motive_or_undisclosed_personal_attribute',
    'population_level_evidence_turned_into_an_individualized_medical_or_financial_instruction',
    'invented_precise_statistic_percentage_or_effect_size',
    'unsupplied_sources_evidence_reconstructed_or_assumed',
    'practical_recommendation_not_traceable_to_the_preceding_analysis',
    'empty_or_manufactured_item_included_merely_to_fill_the_schema',
    'evidence_base_breadth_or_composition_characterized_without_a_source_set',
    'claim_ranked_as_among_the_most_or_more_supported_findings_in_a_field_not_shown_to_have_been_surveyed',
    'unprompted_medical_or_financial_exception_population_invented',
    'named_mechanism_list_assigned_simplified_causal_roles_unnecessarily',
    'definitional_or_accounting_relationship_narrowed_into_one_implied_intervention',
    'emotional_state_invented_for_rhetorical_effect',
    'treat_skeptically_item_not_traceable_to_the_noise_analysis',
    'self_experiment_tracking_or_measurement_plan_invented',
    'future_evidence_impact_claimed_symmetric_without_basis',
    'claim_called_weak_evidence_while_the_underlying_question_is_also_called_genuinely_open',
    'unverified_causal_mechanism_supplied_for_an_empirical_pattern',
    'unverified_historical_or_market_fact_stated_as_established',
    'additional_claim_or_topic_introduced_beyond_what_the_visitor_supplied',
    'claim_critiqued_as_a_stronger_or_more_naive_version_than_actually_supplied',
    'hypothetical_harms_or_examples_enumerated_beyond_what_clarifies_the_claim',
    'noise_type_label_does_not_match_the_actual_defect_in_the_claim',
    'unsupported_strength_or_frequency_qualifier_added_to_a_claim',
    'unsourced_methodological_limitation_invented_for_evidence_never_examined',
    'unsourced_quantified_population_claim_stated_as_fact',
    'factor_ranked_against_unnamed_alternatives_without_a_survey',
    'specific_research_design_prescribed_as_a_casual_fix',
    'motive_or_causal_direction_assigned_through_a_comparisons_framing',
    'historical_performance_comparison_stated_even_when_hedged',
    'two_sided_evidence_debate_invented_with_no_sources_examined',
    'person_specific_question_misclassified_as_a_general_evidence_gap',
    'health_or_finance_item_defaulted_to_a_professional_referral_without_basis',
    'claim_or_question_not_traceable_to_a_supplied_claim_a_necessary_distinction_or_an_examined_source',
    'contested_label_given_a_model_generated_definition_not_supplied_or_sourced',
    'signal_item_manufactured_merely_to_match_a_noise_item_one_for_one',
    'unprompted_epistemic_lesson_or_anecdote_inserted_that_the_visitor_did_not_raise',
    'individual_person_or_case_invented_to_apply_a_population_claim_to',
    'unauthorized_empirical_fact_or_figure_used_as_an_unlabeled_premise',
    'metaphors_usefulness_used_to_infer_a_property_of_the_underlying_reality',
    'personal_situation_invented_in_what_would_help_evidence_replaced_with_a_case_nobody_supplied',
  ],
  require: ['fulfills_tool_promise'],
};

router.post('/signal-vs-noise', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { topic, conflictingAdvice, userContext, userLanguage } = req.body;
    if (!topic?.trim()) return res.status(400).json({ error: 'What topic are you trying to cut through?' });

    // Two disjoint-key calls in parallel, merged back to one response — same
    // architecture as v1, still needed at this schema size and max_tokens to
    // stay under where Safari abandons a long-running fetch.
    const brief = `SIGNAL VS. NOISE

TOPIC:
${topic.trim()}

${conflictingAdvice?.trim() ? `CLAIMS OR CONFLICTING ADVICE THE VISITOR HAS ENCOUNTERED:
${conflictingAdvice.trim()}` : ''}

${userContext?.trim() ? `VISITOR-SUPPLIED CONTEXT:
${userContext.trim()}` : ''}

TASK

Build an evidence map that helps the visitor understand:
1. what conclusions are reasonably well supported,
2. which popular claims go beyond their evidence,
3. what remains genuinely unresolved (as a general question, or as a
   person-specific one — see rule 25),
4. and what practical conclusions survive that uncertainty.

YOU ARE OPERATING AT LEVEL 1 — CLAIM ANALYSIS (see SOURCE MODE in the
system prompt). You have not been given a source set or a live literature
search. Therefore:
- do not present this as a systematic or current literature review, market survey, or wage/recruiting/fund-performance analysis;
- do not invent citations, named authorities, or industry/historical facts you can't actually stand behind;
- do not manufacture specific studies, datasets, or their limitations;
- do not invent a causal mechanism to explain why a claimed pattern happens;
- do not rank a factor's importance against unnamed alternatives;
- do not state an unsourced quantified population claim;
- do not imply comprehensive knowledge of everything published;
- do not claim that interested parties are intentionally misleading people;
- do not make individualized medical or financial recommendations, and do not default to a professional-referral closer.

If a visitor-supplied claim cannot be responsibly evaluated without seeing its source, say so plainly instead of reasoning as if you had it.

If the visitor supplied specific, discrete claims (such as slogans or distinct pieces of advice), analyze THOSE — do not add an extra claim or principle beyond what they actually raised, even if it feels relevant to the topic.

Prefer a smaller number of strong, useful conclusions over filling every available slot. Once an idea has done its work in one section, do not restate it in another (rule 20).

You are producing ONE PART of the analysis. Another analyst is producing the other part — return only your own keys.`;

    // ── Part A: what's reasonably well supported, and what's genuinely open ──
    const signalPrompt = `${brief}

YOUR PART:
Identify what is reasonably well supported and what remains genuinely unresolved.

Return ONLY valid JSON:

{
  "topic_as_understood": "A concise, neutral description of the question being analyzed",

  "framing": "One or two sentences explaining the central distinction that will help the visitor make sense of the conflicting claims",

  "the_signal": {
    "items": [
      {
        "claim": "A carefully calibrated conclusion supported strongly enough to be useful",
        "basis": "The reasoning behind it, stated as reasoning ('this follows from...', 'by definition...') — never as a report of what evidence, research, or data showed. Never 'this is among the most/more [X] findings in [field]' — that ranks it against a field you have not surveyed",
        "limits": "What this conclusion does NOT establish, or null"
      }
    ]
  },

  "still_worth_verifying": [
    {
      "question": "A genuinely unresolved GENERAL empirical question — one that would require actual evidence to answer for anyone, not a person-specific decision (see what_general_claims_cant_decide for those)",
      "why_it_matters": "Why this matters to the claims being analyzed — one sentence",
      "what_would_help": "What evidence would actually help answer it — one sentence. Never a fabricated pair of 'what supports each side' — you have not examined any evidence to report that split"
    }
  ],

  "what_general_claims_cant_decide": [
    "A person-specific question the general claims above cannot resolve — requires information about the actual investment, situation, or person, not more research"
  ]
}

RULES:

- Maximum 3 signal items.
- Maximum 2 still_worth_verifying items. Zero is allowed and expected when there's no genuine general question left open.
- Maximum 3 what_general_claims_cant_decide items. Zero is allowed.
- "basis" describes your reasoning, stated as reasoning; it is not a place to invent citations, a tracked history, or a dataset.
- A signal claim must remain true after its limits are considered.
- If a conclusion depends heavily on circumstances, write the circumstances into the claim itself.
- Do not turn population evidence into an individual conclusion about this visitor.
- still_worth_verifying is for GENERAL questions only — do not put "should you do X given your situation" there; that belongs in what_general_claims_cant_decide.
- Do not invent two sides of an evidence debate for still_worth_verifying — state the open question, why it matters, and what would help, not a manufactured pro/con.
- If the visitor supplied specific, discrete claims, produce at most one signal item or still_worth_verifying item per claim actually raised — do not add a claim or life principle nobody supplied.
- Return [] rather than manufacturing content for either array.`;

    // ── Part B: what's misleading, and the practical bottom line ──
    const noisePrompt = `${brief}

YOUR PART:
Identify claims that are misleading because they are stronger, broader, more precise, or more certain than the available evidence warrants.

Return ONLY valid JSON:

{
  "the_noise": [
    {
      "claim": "The claim being examined",
      "noise_type": "marketing | methodology_problem | cherry_picked | outdated | oversimplified | too_broad | context_dependent | individual_variation | media_distortion | weak_evidence",
      "noise_label": "Short plain-language label",
      "what_the_evidence_supports_instead": "The more defensible version of the claim — reasoned, not sourced",
      "what_went_wrong": "Exactly how the original claim outruns the evidence",
      "kernel_of_truth": "The part worth preserving, or null"
    }
  ],

  "the_bottom_line": {
    "supported_takeaways": [
      "A practical conclusion that follows directly from the analysis"
    ],
    "treat_skeptically": [
      "A claim or type of claim the visitor should not accept at face value"
    ],
    "what_would_change_the_answer": [
      "What evidence would need to exist to actually settle one of the claims analyzed above — not a personal situation the visitor didn't supply. Only mention the visitor's own context here if they actually supplied enough of it to identify a real, specific gap about THEIR situation"
    ]
  },

  "sources_of_noise": [
    {
      "source_type": "A general source or mechanism of distortion, not an accused individual",
      "how_it_distorts": "How information can become misleading",
      "how_to_recognize_it": "An observable sign the visitor can look for"
    }
  ]
}

RULES:

- Maximum 4 noise items.
- Maximum 3 sources_of_noise.
- Zero noise items is allowed.
- Do not manufacture a bad claim just to populate the section.
- Analyze visitor-supplied conflicting claims first when provided. If the visitor supplied N discrete claims, produce at most one noise item per claim actually raised — do not add an item examining a claim nobody supplied.
- Do not attribute motives, including through a comparison's framing (e.g. "tends to favor whichever asset class the presenter prefers") — describe what changes the comparison, not who benefits from omitting it.
- Do not accuse named people, companies, industries, researchers, or organizations without supplied or verified evidence.
- Do not use "ideology" as a noise_type.
- Use "cherry_picked" only when the supplied material or evidence actually examined selects favorable results while excluding relevant contrary evidence — not merely because a claim sounds one-sided. Prefer "oversimplified," "too_broad," or "context_dependent" otherwise.
- Use "individual_variation" only when the defect is a claim ignoring genuine, well-established variation between people. When the actual defect is that a conditional or aggregate claim was turned into a universal prescription, use "too_broad" or "context_dependent" instead — the problem is scope, not variation.
- Do not call something false when the actual problem is exaggeration or uncertainty.
- Do not rebut an overstated claim with an equally unverified explanation for why people believe it (an unsupported claim about which outcomes get discussed or published more, for instance) — note a real possibility as a possibility, not as fact.
- Do not manufacture a methodological limitation ("survivorship bias," "the funds measured," "the sample excluded...") for a dataset you never examined — if you didn't see it, you don't know its flaws either.
- Do not state a historical performance comparison, even hedged ("both have historically produced returns above inflation") — describe structural differences instead (see rule 24).
- Do not state an unsourced quantified population claim ("most actively managed funds have not outperformed," "many investors who time markets fare worse") — describe the logical or structural point the claim actually rests on instead.
- Do not rank a factor's importance against unnamed alternatives ("among the most reliably controllable factors") — state the plain arithmetic or logic underneath it instead.
- "what_the_evidence_supports_instead" should preserve any legitimate core of the original claim, reasoned rather than sourced.
- Do not describe whether the underlying proposition itself is settled or unsettled inside a noise item — that determination belongs to still_worth_verifying / what_general_claims_cant_decide in the other analyst's response. Focus each item on the certainty or scope the CLAIM asserts (proven, unique, guaranteed) versus what it can actually justify.
- Aim for 2-3 supported_takeaways, 2-3 treat_skeptically items, and 0-3 what_would_change_the_answer items — omit rather than pad to a target.
- Bottom-line recommendations must be traceable to preceding analysis, and no stronger than the evidence characterized above them — if the_noise called something "associated with" an outcome, the bottom line may not restate it as a direct practical cause. The bottom line obeys the exact same LEVEL 1 rule as everything else — do not let "documented contexts" or "historical cases" reappear here after being kept out of the_noise.
- When the visitor supplied multiple discrete claims, each supported_takeaway should resolve one of those specific claims — do not introduce a new overarching theme that wasn't one of them.
- Do not phrase a takeaway as a debate rule ("the burden is on the claim to show it applies to your situation") — state the practical takeaway directly.
- Do not close a finance or health takeaway by defaulting to a professional referral ("worth working through with a fiduciary adviser") — describe what information is needed instead, unless the visitor's own supplied context makes a referral clearly the relevant next step.
- treat_skeptically must synthesize claims actually examined in the_noise, or an epistemic caution those items directly require. Do not append generic misinformation advice (testimonials, anecdotes, "before-and-after results") the visitor did not raise and this analysis did not establish.
- what_would_change_the_answer should not introduce medical, financial, or other personal-context examples the visitor didn't supply merely to sound thorough. Prefer "your context could affect how useful this general finding is for you" over a list of specific conditions, or omit the item entirely when no personal context was given.
- what_would_change_the_answer is about evidence, not personal situations — "your own functional context matters" or "if your phone use before bed is primarily passive" invents a personal case nobody supplied. State what evidence would help evaluate the claim instead: "Evidence on how sleep requirements vary across adults," "Evidence comparing pre-bed phone use with and without blue-light filtering, using defined sleep outcomes."
- For health or finance topics, keep practical takeaways general unless the visitor supplied enough information for a safely bounded conclusion.
- If a specific source must be examined to resolve a claim, put that in what_would_change_the_answer.`;

    const locale = withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    const [signalPart, noisePart] = await Promise.all([
      callClaudeWithRetry({ model: MODELS.SMART, max_tokens: 3000, system: withLanguage(PERSONALITY, userLanguage) + locale + `\n\n${NO_QUOTE_RULE}`, messages: [{ role: 'user', content: signalPrompt }] }, { label: 'signal-vs-noise:signal' }),
      callClaudeWithRetry({ model: MODELS.SMART, max_tokens: 3000, system: withLanguage(PERSONALITY, userLanguage) + locale + `\n\n${NO_QUOTE_RULE}`, messages: [{ role: 'user', content: noisePrompt }] }, { label: 'signal-vs-noise:noise' }),
    ]);
    const parsed = { analysis_mode: ANALYSIS_MODE, sources_examined: [], ...noisePart, ...signalPart };
    if (!parsed?.the_signal || !parsed?.framing) {
      return res.status(500).json({ error: 'Could not analyze this topic. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'signal-vs-noise',
      fields: collectProseFields(parsed),
      supplied: brief,
      promise: 'Help the visitor separate evidence-supported conclusions from claims that outrun their evidence, using only general knowledge about evidence quality — never inventing citations, statistics, mechanisms, motives, or a two-sided evidence debate, and never analyzing a claim the visitor did not raise.',
      guard: router.outputGuard,
      userLanguage,
    });

    // Claim-mode validation pipeline: regex → semantic check → per-field
    // rewrite → revalidate → fixed fallback. Runs after the guard (whose own
    // repair pass can introduce or miss things independently) and before the
    // structural filtering below, which is what turns a blanked field into a
    // dropped item. `supplied` is only what the visitor typed — not `brief`,
    // which also carries task instructions the judge must not mistake for
    // visitor-supplied premises.
    const supplied = [
      `TOPIC: ${topic.trim()}`,
      conflictingAdvice?.trim() ? `CLAIMS / CONFLICTING ADVICE: ${conflictingAdvice.trim()}` : '',
      userContext?.trim() ? `VISITOR CONTEXT: ${userContext.trim()}` : '',
    ].filter(Boolean).join('\n');
    await enforceClaimModeFields(parsed, userLanguage, supplied, 'signal-vs-noise');

    // Structural validation. nonBlank() so a whitespace-only string counts
    // as missing. clean() ALSO drops any item that still contains banned
    // claim-mode language after the per-field fix-up above — this is the
    // actual backstop: a violating item never reaches the user, it is
    // silently omitted the same way an empty/manufactured item would be.
    const nonBlank = (v) => typeof v === 'string' && v.trim().length > 0;
    const clean = (v) => nonBlank(v) && !findBannedPhrase(v);

    parsed.the_signal ??= { items: [] };
    parsed.the_signal.items = Array.isArray(parsed.the_signal.items)
      ? parsed.the_signal.items.filter(x => clean(x?.claim) && clean(x?.basis) && (x?.limits == null || clean(x.limits))).slice(0, 3)
      : [];

    parsed.the_noise = Array.isArray(parsed.the_noise)
      ? parsed.the_noise.filter(x =>
          clean(x?.claim) &&
          clean(x?.what_the_evidence_supports_instead) &&
          clean(x?.what_went_wrong) &&
          (x?.kernel_of_truth == null || clean(x.kernel_of_truth))
        ).slice(0, 4)
      : [];

    parsed.still_worth_verifying = Array.isArray(parsed.still_worth_verifying)
      ? parsed.still_worth_verifying.filter(x => clean(x?.question) && clean(x?.why_it_matters) && clean(x?.what_would_help)).slice(0, 2)
      : [];

    parsed.what_general_claims_cant_decide = Array.isArray(parsed.what_general_claims_cant_decide)
      ? parsed.what_general_claims_cant_decide.filter(clean).slice(0, 3)
      : [];

    parsed.sources_of_noise = Array.isArray(parsed.sources_of_noise)
      ? parsed.sources_of_noise.filter(x =>
          clean(x?.source_type) &&
          clean(x?.how_it_distorts) &&
          clean(x?.how_to_recognize_it)
        ).slice(0, 3)
      : [];

    parsed.the_bottom_line ??= {
      supported_takeaways: [],
      treat_skeptically: [],
      what_would_change_the_answer: [],
    };

    // Per the target shape (2-3 / 2-3 / 0-3, not a uniform cap) — padding
    // every array to the same length is exactly the "fill the schema"
    // pattern rule 17 (OMIT EMPTY SECTIONS) tells the model not to do.
    const BOTTOM_LINE_CAPS = {
      supported_takeaways: 3,
      treat_skeptically: 3,
      what_would_change_the_answer: 3,
    };
    for (const key of Object.keys(BOTTOM_LINE_CAPS)) {
      parsed.the_bottom_line[key] =
        Array.isArray(parsed.the_bottom_line[key])
          ? parsed.the_bottom_line[key].filter(clean).slice(0, BOTTOM_LINE_CAPS[key])
          : [];
    }

    res.json(parsed);

  } catch (error) {
    console.error('[SignalVsNoise]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
