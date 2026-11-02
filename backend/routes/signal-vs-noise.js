// Signal vs. Noise — researched architecture (2026-09-10)
//
// The previous claim-analysis version tried to decide what held up while
// simultaneously forbidding itself from using pretrained empirical knowledge
// as evidence. Seven live iterations showed that prompt discipline plus
// semantic judging/regeneration/fallbacks was the wrong architecture.
//
// This version researches first, then synthesizes. Web search happens only in
// lib/claimResearch.js through the production-tested groundedFacts helper. The
// main generation call has no tools and may make empirical claims ONLY from the
// supplied research packet, with source IDs that are validated before render.

const express = require('express');
const { answer, keyGroups, onlyKeys } = require('../lib/progressive');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');
const { NO_QUOTE_RULE } = require('../lib/factCheck');
const { claimResearch, researchState, tierOf } = require('../lib/claimResearch');
const { checkEvidenceFit } = require('../lib/evidenceFit');
const { allChecks } = require('../lib/bothChecks');

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

const PERSONALITY = `You are Signal vs. Noise, a DeftBrain research synthesizer.

Your job is to help an ordinary person decide what the best available evidence actually supports about conflicting claims.

You receive a WEB RESEARCH PACKET produced by a separate search pass. Treat that packet as the complete outside evidence available for this answer. You have NO live search in this call.

CORE RULES

1. EMPIRICAL CLAIMS REQUIRE PACKET SUPPORT.
Every statement about what happens in the real world must be supported by one or more source IDs from the research packet. Do not supplement the packet from memory, even when you are confident the remembered fact is correct.

2. SOURCE IDS ARE PROVENANCE, NOT DECORATION.
Every claim assessment must list the source IDs that support its finding. Never invent an ID. If the packet does not support a conclusion, classify it as unresolved rather than filling the gap.

3. DO NOT COUNT SOURCES AS VOTES.
One strong systematic review may outweigh many weak articles. Source quality, directness, scope, recency where relevant, and agreement matter more than quantity.

4. CALIBRATE THE VERDICT.
Use supported when the packet directly and consistently supports the material claim. Use overstated when a narrower proposition is supported but the visitor's wording goes farther. Use mixed when credible evidence points in meaningfully different directions or effects depend materially on defined conditions. Use unresolved when the packet cannot responsibly settle it.

5. DO NOT OVERSTATE RESEARCH BREADTH.
This is a targeted web research pass, not a systematic review of everything published. Never say all research, the literature proves, scientific consensus, no evidence exists, or settled science unless the supplied packet itself contains enough authoritative support to justify that exact characterization.

6. DISTINGUISH CLAIMS FROM APPLICATION.
Population or general evidence does not automatically answer what one visitor should do. Use visitor context only when they supplied it, and do not infer diagnosis, motives, preferences, finances, risk tolerance, or hidden circumstances.

7. DO NOT INVENT WHY PEOPLE SAY SOMETHING.
How the Noise Gets Made may explain general information distortions visible in the claims or research process, but may not accuse a person, company, industry, researcher, or group of deceptive motives without sourced evidence.

8. MIXED / UNRESOLVED IS A SUCCESSFUL RESULT.
Do not force every claim into supported or overstated.

9. ANSWER FIRST; DO NOT REPEAT YOURSELF.
Keep the main answer compact. Put limitations and sources close to the conclusions they qualify. Omit empty sections rather than padding them.

10. DEFTBRAIN_OUTPUT_STANDARD_V2.
Solve the actual problem, use supplied context, give actionable guidance that survives uncertainty, write plainly, avoid AI-report voice and filler, preserve visitor agency, and keep the shortest structure that adequately solves the problem.

RESEARCH CALIBRATION

11. SOURCE PRIORITY.
For consequential empirical conclusions, prefer in order: systematic reviews / meta-analyses; primary peer-reviewed research; government or major public research institutions; authoritative professional bodies; high-quality secondary sources only when stronger sources are unavailable. Do not use commercial educational, coaching, fitness, advocacy, or general explanatory sites to establish a conclusion when suitable primary or authoritative sources are in the packet.

12. NO SEARCH-COMPLETENESS CLAIMS.
A bounded web search does not establish "the best available evidence", "the strongest study available", "the broadest review", "the evidence consistently shows", "research has established", or "the scientific consensus is" — unless the retrieved evidence itself supports that characterization. Describe the evidence actually found: "A controlled NIH inpatient trial found…", not "the strongest causal study available found…".

13. EVIDENCE-STRENGTH MATCHING.
Do not make the conclusion stronger than the cited evidence. One trial → "A controlled trial found…". Several observational studies → "Several observational studies associate…". A meta-analysis → describe what that meta-analysis found. Mixed evidence → say mixed. Insufficient evidence → say unresolved. A 20-person, two-week trial is described as that, wherever it appears.

14. SOURCE-CLAIM FIT.
Every cited source must materially support the sentence or field it is attached to. Do not attach a group of sources to a paragraph when only some of them support each material assertion; cite the ones that do.

15. INTERNAL CONSISTENCY.
Before rendering, compare the verdict and every claim assessment. If two sections characterize the same evidence with different strength ("remains genuinely unresolved" here, "does not establish any harm" there, "no strong evidence it is neutral" elsewhere), reconcile them to the least-strong formulation both support — e.g. "the evidence presented here does not establish a safe or harmful threshold for moderate consumption" — and do not push farther in either direction.

16. SUMMARY PROVENANCE.
The verdict may summarize the researched findings but may not strengthen, generalize, or combine them into a broader empirical proposition the packet did not establish. "The evidence consistently shows these factors interact" lumps four separate findings into one interaction claim nobody researched; the DeftBrain formulation is that a claim reducing the question to one variable deserves skepticism when the cited evidence does not establish that exclusivity.

FINAL CALIBRATION — evidence-to-conclusion matching

17. COMPARATIVE CLAIMS REQUIRE COMPARATIVE EVIDENCE.
Evidence that X matters does not establish "X matters more than Y." Evidence that A has favorable outcomes does not establish "A is better than B and C" unless B and C were actually compared in the cited research.

18. DO NOT EXPAND POPULATIONS OR CONDITIONS.
A finding in a particular age group, population, country, duration, exposure level, or intervention may not become "at any age," "for children," "generally," "across populations," or any broader formulation. Preserve the scope of the retrieved evidence, in the sentence that uses it.

19. ASSOCIATION ≠ CAUSATION.
"Associated with" must not become "causes," "produces," "leads to," or "drives" unless the cited research design supports that causal inference.

20. SOURCE QUALITY AFFECTS WHAT MAY BE CONCLUDED.
ResearchGate, SSRN, arXiv and similar are HOSTS, not evidence of source quality. A thesis, magazine or trade article, explanatory article, preprint, or professional publication may inform a question but may not carry a strong empirical verdict when stronger evidence could reasonably exist. If the packet lacks sufficiently strong evidence for a conclusion, weaken the conclusion or mark it unresolved.

21. DO NOT SYNTHESIZE BEYOND THE PACKET.
Avoid broad constructions — "the evidence consistently shows," "research distinguishes," "the literature shows," "these factors interact," "the real picture is" — unless the retrieved evidence directly supports that synthesis. Describe what the retrieved evidence establishes instead.

22. CLAIM–SOURCE COVERAGE.
Before accepting each substantive sentence, ask: which specific source or sources establish THIS ENTIRE proposition? If none does, split the proposition, narrow it, qualify it, or remove it.

23. PRESERVE GOOD UNCERTAINTY.
If the packet lacks the evidence a comparison needs, say so. Do not fill the gap from model knowledge, and do not let a neighbouring concept the search did find stand in for the one it did not.

24. THE VERDICT OBEYS ALL OF THE ABOVE.
The verdict may be shorter than the claim assessments. It may not be stronger than them.

NORTH STAR:
RESEARCH THE CLAIMS.
SHOW WHAT THE EVIDENCE EARNS.
KEEP THE SIGNAL.
NAME THE NOISE.
LEAVE GENUINE UNCERTAINTY INTACT.`;

router.outputStandard = 'v2';
router.renumberSources = (p) => renumberSources(p); // for the self-check below
router.outputGuard = {
  prohibit: [
    'invented_source_or_source_id',
    'empirical_claim_not_traceable_to_research_packet',
    'claim_stronger_than_supplied_evidence',
    'source_count_treated_as_evidence_quality',
    'mixed_or_unresolved_evidence_forced_into_binary_verdict',
    'user_context_used_to_infer_diagnosis_motive_or_unsupplied_personal_attribute',
    'population_evidence_turned_into_individual_medical_or_financial_instruction',
    'unverified_motive_attributed_to_person_company_industry_or_researcher',
    'practical_recommendation_not_traceable_to_preceding_analysis',
    'empty_or_manufactured_item_included_to_fill_schema',
    'research_breadth_overstated_as_systematic_or_comprehensive',
    'search_completeness_superlative_best_strongest_broadest_or_consistently_not_established_by_packet',
    'conclusion_stated_stronger_than_the_design_and_size_of_the_cited_evidence',
    'same_evidence_characterized_with_different_strength_across_sections',
    'verdict_combines_or_generalizes_findings_into_a_proposition_the_packet_did_not_establish',
    'secondary_explanatory_or_commercial_site_used_to_establish_a_conclusion_when_primary_sources_were_available',
    'comparative_claim_x_more_than_y_without_a_cited_comparison_of_x_and_y',
    'finding_scope_expanded_beyond_the_population_age_country_duration_or_condition_studied',
    'association_restated_as_causation_without_a_causal_design_in_the_cited_source',
    'strong_verdict_resting_on_a_thesis_preprint_magazine_or_explanatory_article',
    'proposition_not_fully_established_by_any_single_cited_source',
    'verdict_stronger_than_the_claim_assessments_it_summarizes',
  ],
  require: ['fulfills_tool_promise'],
};

function validSourceIds(packet) {
  return new Set((packet?.sources || []).map(s => String(s.id || '').toUpperCase()));
}

function cleanIds(ids, valid) {
  return [...new Set((Array.isArray(ids) ? ids : [])
    .map(x => String(x || '').toUpperCase().trim())
    .filter(x => valid.has(x)))].slice(0, 4);
}

// ── Search-completeness superlatives, softened deterministically ─────────
// A bounded search cannot establish that it found "the strongest study
// available" or that "the evidence consistently shows" anything; the prompt
// (rule 12) and the guard both say so, and this is the last line. Each
// substitution only ever WEAKENS a claim, never restates or invents one, so
// it is safe to apply blind — which is exactly what the old semantic judge
// was not. Kept to a short list of exact idioms on purpose; this is not a
// place to grow a phrase catalogue again.
const COMPLETENESS_SOFTENERS = [
  [/\bthe (?:single )?(?:strongest|best|most rigorous|most definitive) (?:causal |controlled |available )?(?:study|trial|evidence|review|research)(?: (?:available|to date|that exists|on record))?\b/gi, 'a cited $&'.replace('a cited $&', 'the cited study')],
  [/\bthe best available evidence\b/gi, 'the evidence found here'],
  [/\bthe broadest (?:evidence )?review\b/gi, 'a review'],
  [/\bthe evidence (?:consistently|overwhelmingly|clearly|repeatedly) (?:shows|indicates|demonstrates|supports|finds)\b/gi, 'the cited evidence indicates'],
  [/\bresearch has (?:firmly |clearly |now )?established\b/gi, 'the cited research found'],
  [/\b(?:the )?scientific consensus (?:is|holds|says)\b/gi, 'the cited sources indicate'],
  [/\b(?:it is|this is) (?:well[- ])?(?:established|settled|proven) (?:that|science)\b/gi, 'the cited sources indicate that'],
  [/\bthe literature (?:shows|indicates|demonstrates|suggests|supports)\b/gi, 'the cited sources indicate'],
  [/(?<!cited )\b(?:the )?research (?:clearly |consistently )?distinguishes\b/gi, 'the cited research distinguishes'],
  [/\bthe real picture is\b/gi, 'what the cited sources show is'],
];

function softenCompletenessClaims(parsed) {
  let hits = 0;
  const walk = (val) => {
    if (typeof val === 'string') {
      let out = val;
      for (const [re, rep] of COMPLETENESS_SOFTENERS) {
        if (re.test(out)) { hits++; out = out.replace(re, rep); }
        re.lastIndex = 0;
      }
      return out;
    }
    if (Array.isArray(val)) return val.map(walk);
    if (val && typeof val === 'object') { for (const k of Object.keys(val)) val[k] = walk(val[k]); return val; }
    return val;
  };
  walk(parsed);
  return hits;
}

function sanitizeResult(parsed, packet) {
  const valid = validSourceIds(packet);
  const nonBlank = v => typeof v === 'string' && v.trim().length > 0;

  parsed.analysis_mode = 'verified_research';
  parsed.research_status = 'complete';
  parsed.researched_at = packet.researched_at || null;
  parsed.sources_examined = packet.sources;

  // A supported claim rests on at least one tier 1–3 source (review, primary
  // research, government/regulator, professional body). Secondary-only
  // support — a company blog, an explainer — is enough to flag a question,
  // never to establish an answer. The prompt says so; this makes it true.
  const strongIds = new Set((packet?.sources || []).filter(s => tierOf(s) <= 3).map(s => String(s.id).toUpperCase()));
  const ASSESSMENTS = ['supported', 'overstated', 'mixed', 'unresolved'];
  parsed.claims = (Array.isArray(parsed.claims) ? parsed.claims : [])
    .map(x => {
      const a = String(x?.assessment || '').toLowerCase().trim();
      const item = { ...x, assessment: ASSESSMENTS.includes(a) ? a : 'unresolved', source_ids: cleanIds(x?.source_ids, valid) };
      if (item.assessment === 'supported' && !item.source_ids.some(id => strongIds.has(id))) item.assessment = 'unresolved';
      // "None" / "N/A" as text is no evidence and no limitation.
      for (const k of ['evidence', 'limitation']) if (!nonBlank(item[k]) || /^\s*(none|n\/a|null|not applicable)\.?\s*$/i.test(item[k])) item[k] = null;
      return item;
    })
    .filter(x => nonBlank(x?.claim) && nonBlank(x?.finding) && (x.source_ids.length || x.assessment === 'unresolved'))
    .slice(0, 6);

  parsed.what_general_claims_cant_decide = (Array.isArray(parsed.what_general_claims_cant_decide) ? parsed.what_general_claims_cant_decide : [])
    .filter(nonBlank).slice(0, 3);

  // Short subject labels for the visitor's "Recent checks" list — kept tiny
  // so an old row never re-asserts an old verdict. Never blocks the result.
  parsed.claim_labels = (Array.isArray(parsed.claim_labels) ? parsed.claim_labels : [])
    .filter(nonBlank).map(x => x.trim().slice(0, 30)).slice(0, 4);

  parsed.sources_of_noise = (Array.isArray(parsed.sources_of_noise) ? parsed.sources_of_noise : [])
    .filter(x => nonBlank(x?.source_type) && nonBlank(x?.how_it_distorts) && nonBlank(x?.how_to_recognize_it))
    .slice(0, 3);

  // Build a source subset from IDs that survived the result. If a source was
  // researched but never actually used, it does not appear in the UI.
  const used = new Set();
  parsed.claims.forEach(x => x.source_ids.forEach(id => used.add(id)));
  // An ID named in the prose ("…(S9)") is used too, or the reader is sent to
  // a source the list leaves out (live run, 2026-10-27).
  for (const m of JSON.stringify([parsed.verdict, parsed.claims, parsed.what_general_claims_cant_decide]).matchAll(/\bS\d+\b/g)) if (valid.has(m[0])) used.add(m[0]);
  parsed.sources_examined = packet.sources.filter(s => used.has(String(s.id).toUpperCase()));

  return parsed;
}

// Figures must come from the packet (2026-10-08). A sleep run cited "a 90%
// dropout rate" and "a study of 12,637 adults" that could not be traced to
// any source it listed. Prompt rule 1 already forbids figures from memory, so
// this checks in code: every figure in the synthesized prose has to appear in
// the research packet or in what the visitor typed. A sentence carrying one
// that doesn't is dropped; a card left without its claim or basis is then
// dropped by sanitizeResult like any other incomplete card. Small whole
// numbers (counts like "3 trials", "7-9 hours", source IDs like S4) are not
// checked — they are too common to trace and rarely the invented part.
const FIGURE = /\d[\d,.  ]*\d|\d/g;
function normFigure(f) {
  let x = f.replace(/[  ]/g, '');
  if (/^\d{1,3}([,.]\d{3})+$/.test(x)) x = x.replace(/[,.]/g, ''); // 12,637 / 12.637
  else x = x.replace(',', '.');                                     // decimal comma
  return x.replace(/\.$/, '');
}
const figures = text => (String(text || '').match(FIGURE) || []).map(normFigure);
const material = f => !/^\d+$/.test(f) || Number(f) > 12;
const SENTENCE_BREAK = /(?<=[.!?])\s+(?=[A-Z0-9"“'(¿¡])|(?<=[。！？])/;

function dropUnsourcedFigures(parsed, packet, typed) {
  const known = new Set([...figures(JSON.stringify(packet)), ...figures(typed)]);
  const dropped = [];
  const clean = (text) => {
    if (typeof text !== 'string' || !/\d/.test(text)) return text;
    let changed = false;
    // Sentence by sentence, and within a sentence clause by clause on "; " —
    // "a panel found X; a separate study found Y%" keeps the panel.
    const kept = text.split(SENTENCE_BREAK).map(sentence => {
      const clauses = sentence.split(/;\s+/);
      const ok = clauses.filter(clause => {
        const bad = figures(clause).filter(f => material(f) && !known.has(f));
        if (bad.length) dropped.push(bad.join('/'));
        return !bad.length;
      });
      if (ok.length === clauses.length) return sentence;
      changed = true;
      const joined = ok.join('; ').trim();
      return joined && !/[.!?。！？]$/.test(joined) ? `${joined}.` : joined;
    }).filter(Boolean);
    return changed ? kept.join(' ').trim() : text;
  };
  const fix = (obj, keys) => { if (obj) for (const k of keys) if (typeof obj[k] === 'string') obj[k] = clean(obj[k]); };
  const fixList = (arr) => Array.isArray(arr) ? arr.map(clean) : arr;

  if (typeof parsed.verdict === 'string') parsed.verdict = clean(parsed.verdict);
  (parsed.claims || []).forEach(x => fix(x, ['finding', 'evidence', 'limitation']));
  (parsed.sources_of_noise || []).forEach(x => fix(x, ['how_it_distorts', 'how_to_recognize_it']));
  parsed.what_general_claims_cant_decide = fixList(parsed.what_general_claims_cant_decide);
  if (dropped.length) console.log(`[signal-vs-noise] dropped ${dropped.length} sentence(s) with figures not in the research packet: ${dropped.join(', ')}`);
  return dropped.length;
}

// The order the page shows the answer (src/tools/SignalVsNoise.js).
const PAGE_ORDER = ['topic_as_understood', 'verdict', 'claims', 'what_general_claims_cant_decide', 'sources_of_noise'];

// Sources numbered 1, 2, 3… in the order the reader meets them (owner's
// review, 2026-10-27: S2, S4, S7 after unused ones were dropped). Display
// only — the checks read the draft, which keeps the packet's own IDs.
function renumberSources(parsed) {
  const order = [];
  const meet = id => { if (id && !order.includes(id)) order.push(id); };
  const scan = v => {
    if (typeof v === 'string') (v.match(/\bS\d+\b/g) || []).forEach(meet);
    else if (Array.isArray(v)) v.forEach(scan);
    else if (v && typeof v === 'object') { (Array.isArray(v.source_ids) ? v.source_ids : []).forEach(meet); Object.entries(v).forEach(([k, x]) => k !== 'source_ids' && scan(x)); }
  };
  for (const k of PAGE_ORDER) scan(parsed[k]);
  (parsed.sources_examined || []).forEach(s => meet(s.id));
  const listed = new Set((parsed.sources_examined || []).map(s => s.id));
  const map = new Map(order.filter(id => listed.has(id)).map((id, i) => [id, `S${i + 1}`]));
  const re = id => map.get(id) || id;
  const walk = v => {
    if (typeof v === 'string') return v.replace(/\bS\d+\b/g, re);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') { for (const k of Object.keys(v)) v[k] = k === 'source_ids' ? (v[k] || []).map(re) : walk(v[k]); return v; }
    return v;
  };
  for (const k of PAGE_ORDER) parsed[k] = walk(parsed[k]);
  parsed.sources_examined = (parsed.sources_examined || []).map(s => ({ ...s, id: re(s.id) }))
    .sort((a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)));
  // How many separate organisations the sources come from: three ADP pages
  // are one line of evidence, not three.
  parsed.publisher_count = new Set(parsed.sources_examined.map(s => String(s.publisher || (() => { try { return new URL(s.url).hostname; } catch { return s.url; } })()).toLowerCase().replace(/^www\./, '').trim())).size;
  return parsed;
}

// The packet findings a chunk of the answer cites — its claims' source_ids
// and any IDs named in its prose — so each parallel check reads only its own
// evidence. A chunk citing nothing gets the whole packet.
function evidenceFor(draft, fields, packet) {
  const ids = new Set();
  for (const [p, v] of fields) {
    const m = p.match(/^claims\[(\d+)\]/);
    if (m) (draft.claims?.[m[1]]?.source_ids || []).forEach(x => ids.add(String(x).toUpperCase()));
    (String(v).match(/\bS\d+\b/g) || []).forEach(x => ids.add(x));
  }
  if (!ids.size) return JSON.stringify(packet);
  const claims = packet.claims
    .map(c => ({ ...c, findings: c.findings.filter(f => f.source_ids.some(id => ids.has(id))) }))
    .filter(c => c.findings.length);
  return JSON.stringify({ claims, sources: packet.sources.filter(s => ids.has(s.id)) });
}

function buildSupplied(topic, conflictingAdvice, userContext) {
  return `TOPIC:\n${topic.trim()}\n\n${conflictingAdvice?.trim() ? `CLAIMS / CONFLICTING ADVICE:\n${conflictingAdvice.trim()}\n\n` : ''}${userContext?.trim() ? `VISITOR-SUPPLIED CONTEXT:\n${userContext.trim()}\n\n` : ''}`;
}

// The three shared prompt parts each synthesis call gets: the packet, the
// task, and the calibration rules. The passes split the SCHEMA, not the
// evidence — all read the same packet, so their parts cannot disagree
// about what was found, only about how to say it (rule 15 covers that).
function synthesisPreamble(supplied, researchBlock) {
  return `${supplied}${researchBlock}

TASK

Synthesize the researched evidence into your part of a Signal vs. Noise result. Do not use outside facts that are absent from the WEB RESEARCH PACKET. Other writers produce the other parts from this same packet in parallel; write only the keys asked of you.

LENGTH — this is a screen, not a paper. Word caps are hard limits:
verdict 55; a claim 15; finding 45; evidence 25; limitation 30; a can't-decide item 30; source_type / how_it_distorts / how_to_recognize_it 30 each.`;
}

const SHARED_RULES = `- Analyze the visitor's actual claims; do not add adjacent controversies.
- Do not mention a paper, institution, statistic, mechanism, or real-world fact unless it is in the research packet.
- Do not copy long quotations from sources. Paraphrase.
- Do not turn correlation into causation unless the packet supports causation.
- Do not call evidence consensus, settled, definitive, or proven unless the packet explicitly justifies that strength.
- When evidence is mixed, say mixed. When unresolved, say unresolved.
- Return [] rather than manufacturing content.
- Several sources from one publisher are one line of evidence, not several. When a publisher has a stake in the question (publisher_stake in the packet), say so where its figure is used.
- Keep each finding's measure, population, period and design exactly as the packet gives them; never trade one for a related one (growth for level, base for gross, one month for another, a ranking's graduates for all graduates, studies for experiments).
- A kernel of truth, caveat or aside is a claim like any other: it needs a source in the packet, or it goes.
- Say each qualification once, where it applies; elsewhere refer to it in a few words rather than restating it.`;

// Polling-friendly limit for the readiness endpoint: the client asks every
// ~6s while a cold research fetch runs (up to ~4 minutes), which the
// 12/minute default would 429 halfway through. Own key prefix, so polls do
// not eat the main endpoint's budget. 40/min because a poll costs nothing
// (no model call) and two tabs — or a shared office IP — must not fail each
// other; 20/min was tripped in testing by two pollers on one IP.
const RESEARCH_POLL_LIMITS = { perMinute: 40, perDay: 1200 };

// ── Phase 1: research readiness ─────────────────────────────────────────
// Returns immediately. On a cold topic the first call STARTS the research
// fetch (groundedFacts dedupes concurrent starts) and reports `pending`;
// the client polls until `ready`, which carries the sources the packet
// admitted so the page can show "N sources found" while the synthesis
// (phase 2) runs. Nothing here is a tool result — no model call, no cost.
router.post('/signal-vs-noise/research', rateLimit(RESEARCH_POLL_LIMITS, 'svn-research:'), async (req, res) => {
  try {
    const { topic, conflictingAdvice, userContext } = req.body;
    if (!topic?.trim()) return res.status(400).json({ error: 'What topic are you trying to cut through?' });
    const research = await claimResearch({
      topic: topic.trim(),
      conflictingAdvice: conflictingAdvice?.trim(),
      userContext: userContext?.trim(),
      region: req.body.userRegion,
      exampleId: req.body.exampleId,
      coldWaitMs: 0,
      force: req.body.refresh === true,
    });
    if (!research.packet) {
      // A failed fetch is negative-cached for a few minutes; without this the
      // client would poll "pending" for its whole budget and only then learn
      // there was nothing coming. 200, not an error status — the poll itself
      // succeeded; it is the research that did not.
      const state = researchState({ topic: topic.trim(), conflictingAdvice: conflictingAdvice?.trim(), exampleId: req.body.exampleId });
      if (state === 'failed') return res.json({ status: 'failed', code: 'research_unavailable', sources: [] });
      return res.status(202).json({ status: 'pending', sources: [] });
    }
    res.json({
      status: 'ready',
      researched_at: research.packet.researched_at || null,
      claim_count: research.packet.claims.length,
      sources: research.packet.sources,
    });
  } catch (error) {
    console.error('[SignalVsNoise/research]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ── While the search runs: what we're checking ──────────────────────────
// A cold search takes ~60-100s with nothing to read (owner, 2026-10-25). One
// fast call restates the question and splits out the claims in a few seconds.
// It judges nothing — the packet hasn't landed — so it can't contradict the
// answer that follows. The page treats any failure as "show nothing".
router.post('/signal-vs-noise/checking', rateLimit(RESEARCH_POLL_LIMITS, 'svn-checking:'), async (req, res) => {
  try {
    const { topic, conflictingAdvice, userContext, userLanguage } = req.body;
    if (!topic?.trim()) return res.status(400).json({ error: 'What topic are you trying to cut through?' });
    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 600,
      system: withLanguage(`You restate a question someone wants checked against evidence, before any research has been done. Never say or hint whether any claim is true, false, likely or popular — you have not seen the evidence yet. Plain words, no jargon. ${NO_QUOTE_RULE}`, userLanguage),
      messages: [{ role: 'user', content: `${buildSupplied(topic.trim(), conflictingAdvice?.trim(), userContext?.trim())}

Return ONLY valid JSON:
{
  "question": "the question being checked, in one plain sentence",
  "claims": ["each distinct claim to check, neutrally worded, 2 to 4 of them"],
  "evidence": "what kind of evidence could settle it, in one short sentence under 20 words (for example trials, official data, long-term studies)"
}` }],
    }, { label: 'signal-vs-noise/checking' });
    const claims = (Array.isArray(parsed?.claims) ? parsed.claims : []).filter(x => typeof x === 'string' && x.trim()).slice(0, 4);
    if (!parsed?.question || !claims.length) return res.status(502).json({ error: 'No preview.' });
    res.json({ question: parsed.question, claims, evidence: typeof parsed.evidence === 'string' ? parsed.evidence : '' });
  } catch (error) {
    console.error('[SignalVsNoise/checking]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ── Phase 2 (or the whole thing, for a direct caller) ───────────────────
router.post('/signal-vs-noise', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { topic, conflictingAdvice, userContext, userLanguage } = req.body;
    if (!topic?.trim()) return res.status(400).json({ error: 'What topic are you trying to cut through?' });

    // `refresh` is the client's "check again with current sources". The
    // readiness endpoint has normally already forced the refetch by the time
    // this call arrives; passing it here too keeps a direct caller honest.
    const research = await claimResearch({
      topic: topic.trim(),
      conflictingAdvice: conflictingAdvice?.trim(),
      userContext: userContext?.trim(),
      region: req.body.userRegion,
      exampleId: req.body.exampleId,
      force: req.body.refresh === true,
    });

    if (!research.packet) {
      return res.status(503).json({
        error: 'I could not complete the source check in time. Please try again — the research may already be warming in the cache.',
        code: 'research_unavailable',
      });
    }

    const locale = withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    const supplied = buildSupplied(topic, conflictingAdvice, userContext);
    const preamble = synthesisPreamble(supplied, research.block);

    // Two disjoint-key calls in parallel. Measured before the split: one
    // 6000-token call took 50–80s; the halves run concurrently and each
    // produces well under half the tokens, so the wall-clock is roughly the
    // slower half. Keys never overlap, so the merge is a spread.
    // One answer, read top to bottom (owner, 2026-10-27): a short verdict,
    // then one compact assessment per claim — its finding, the evidence and
    // its main limitation together, said once. Replaces the Signal / Noise /
    // Still worth verifying / Bottom Line sections, which repeated each
    // qualification four times.
    const prompt = `${preamble}

Return ONLY valid JSON:
{
  "topic_as_understood": "concise neutral description",
  "verdict": "2-3 short sentences: across the claims, what holds up, what does not, and how sure the evidence lets anyone be — no stronger than the claim assessments",
  "claims": [
    {
      "claim": "one of the visitor's claims, in a few words, as they put it",
      "assessment": "supported | overstated | mixed | unresolved",
      "finding": "1-2 sentences: what the evidence shows about this claim, with its scope (who, when, which measure)",
      "evidence": "the design, size and source in a phrase (a five-study series in Psychological Science, 2018; ADP payroll data on median annual base-pay growth, August 2026)",
      "limitation": "the one limit that matters most for this claim, or null",
      "source_ids": ["S1", "S2"]
    }
  ],
  "what_general_claims_cant_decide": [
    "person-specific question the general evidence cannot answer from the information supplied"
  ],
  "claim_labels": ["2-4 labels, each 1-3 words, naming the SUBJECT of each visitor claim analyzed — e.g. 'Screen time', 'Tiger parenting', 'Homework' — for the visitor's history list; a noun phrase, never a verdict"],
  "sources_of_noise": [
    {
      "source_type": "general distortion mechanism visible in this topic",
      "how_it_distorts": "how the claim gets stronger or simpler than the evidence",
      "how_to_recognize_it": "observable sign to look for"
    }
  ]
}

RULES
- One claims item per claim the visitor raised (a "X vs. Y" pair is two claims when the evidence speaks to each side), at most 6. Follow the packet's own assessment of each claim unless a rule above requires a weaker one.
- assessment is exactly one of the four English words shown, whatever language you write in.
- supported needs a source that is a review, primary study, government/regulator source or professional body; a claim the packet marks "support": "secondary_only" is unresolved at most, and its limitation says only secondary sources were found.
- Every item except an unresolved one cites the source_ids that support its finding; cite only those.
- Each qualification appears once, in the claim it belongs to. The verdict names no figure the claims do not give.
- what_general_claims_cant_decide is about the person's own situation, 0-3 items; do not restate the claims.
- sources_of_noise describes general mechanisms only — never a named actor's motive; 0-3 items.
${SHARED_RULES}`;

    // Progressive (2026-10-16, lib/progressive.js): three passes at once —
    // the verdict first. Source cleanup
    // runs on every draft (finish), so an unsourced figure never shows even
    // briefly; the guard runs after the answer is on screen.
    const system = withLanguage(PERSONALITY, userLanguage) + locale + `\n\n${NO_QUOTE_RULE}`;
    // `extra` narrows a pass (the claim passes name their claims); `tag` labels it.
    const pass = (keys, i, extra = '') => callClaudeWithRetry({
      model: MODELS.SMART, max_tokens: keys.includes('claims') ? 4000 : 2000, system,
      messages: [{ role: 'user', content: onlyKeys(prompt, keys) + extra }],
    }, { label: `signal-vs-noise:synthesis-${typeof i === 'number' ? i + 1 : i}` });
    // Speed (2026-10-27): the claim cards are the long write (29s in one
    // pass). The researched claims go to parallel passes, two each; each pass
    // writes the cards for its own claims and they are joined in order.
    const researched = research.packet.claims || [];
    const groups = [];
    for (let i = 0; i < researched.length; i += 2) groups.push(researched.slice(i, i + 2));
    const claimParts = (groups.length ? groups : [[]]).map((g, gi) => ({
      required: gi === 0,
      run: () => pass(['claims'], `claims-${gi + 1}`, g.length ? `\n\nTHIS PASS covers ONLY the visitor claims behind these researched claims; other passes cover the rest at the same time — at most 2 claims items:\n${JSON.stringify(g.map(c => c.claim))}` : ''),
      apply: (d, out) => {
        // Hidden from the checks and the reply: they read `claims`.
        if (!d.claimSlots) Object.defineProperty(d, 'claimSlots', { value: [], writable: true, enumerable: false });
        d.claimSlots[gi] = Array.isArray(out?.claims) ? out.claims : [];
        d.claims = d.claimSlots.flat().filter(Boolean);
      },
    }));
    const clean = (d) => {
      let parsed = sanitizeResult(structuredClone(d), research.packet);
      dropUnsourcedFigures(parsed, research.packet, supplied);
      parsed = sanitizeResult(parsed, research.packet);
      softenCompletenessClaims(parsed);
      return renumberSources(parsed);
    };
    return await answer(req, res, {
      label: 'signal-vs-noise',
      parts: [
        ...keyGroups([['topic_as_understood', 'verdict']], pass),
        ...claimParts,
        ...keyGroups([['what_general_claims_cant_decide', 'claim_labels', 'sources_of_noise']], (keys) => pass(keys, 2)).map(p => ({ ...p, required: false })),
      ],
      finish: clean,
      ready: d => Boolean(d.verdict),
      complete: (d) => {
        const p = clean(d);
        return Boolean(p?.verdict && p.claims?.length);
      },
      // Speed (2026-10-27): the checks run side by side (lib/bothChecks.js
      // allChecks), the source check in per-claim chunks against only the
      // findings each claim cites. The sourced check wins where both edit a
      // field; the guard re-reads what it corrected. No repeat check: the
      // one-card-per-claim layout says each limitation once.
      check: d => allChecks(d, [
        // T13 (audit/DEFECT-TYPES.md): every figure and conclusion read against
        // its finding's measure, population and period; the verdict no
        // stronger than the claims (owner's review, 2026-10-27).
        x => checkEvidenceFit(x, {
          label: 'signal-vs-noise',
          evidence: (fields) => evidenceFor(x, fields, research.packet),
          summary: ['verdict', 'what_general_claims_cant_decide'],
          skip: ['topic_as_understood', 'claim_labels'],
          keep: /\.claim$/, // the visitor's own claim, as they put it
          userLanguage,
        }),
        x => runOutputGuard(x, {
          label: 'signal-vs-noise',
          fields: collectProseFields(x),
          supplied: `${supplied}\nRESEARCH PACKET:\n${JSON.stringify(research.packet)}`,
          promise: 'Research the visitor\'s competing claims, show what the retrieved evidence supports, distinguish overstatement from genuine uncertainty, and preserve source provenance.',
          guard: router.outputGuard,
          userLanguage,
        }),
      ], { label: 'signal-vs-noise' }),
    });
  } catch (error) {
    console.error('[SignalVsNoise]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Self-check: node backend/routes/signal-vs-noise.js --check
if (require.main === module && process.argv.includes('--check')) {
  const assert = require('assert');
  const r = renumberSources({
    verdict: 'see (S4)',
    claims: [{ claim: 'x', source_ids: ['S4'] }, { claim: 'y', finding: 'z [S2, S4]', source_ids: ['S2', 'S4'] }],
    sources_examined: [{ id: 'S2', publisher: 'ADP' }, { id: 'S4', publisher: 'adp' }],
  });
  assert.deepStrictEqual(r.claims[0].source_ids, ['S1']);
  assert.deepStrictEqual(r.claims[1].source_ids, ['S2', 'S1']);
  assert.strictEqual(r.claims[1].finding, 'z [S2, S1]');
  assert.strictEqual(r.verdict, 'see (S1)');
  assert.deepStrictEqual(r.sources_examined.map(s => s.id), ['S1', 'S2']);
  assert.strictEqual(r.publisher_count, 1);
  console.log('signal-vs-noise ok');
  process.exit(0);
}

module.exports = router;
