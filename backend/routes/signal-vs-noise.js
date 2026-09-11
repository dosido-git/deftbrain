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
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');
const { NO_QUOTE_RULE } = require('../lib/factCheck');
const { claimResearch, researchState, tierOf } = require('../lib/claimResearch');

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
Every Signal item and every Noise item must list the source IDs that support its empirical conclusion. Never invent an ID. If the packet does not support a conclusion, classify it as unresolved rather than filling the gap.

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
Do not force every claim into Signal or Noise.

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
Before rendering, compare Signal, Noise, Kernel of Truth, unresolved findings, and the Bottom Line. If two sections characterize the same evidence with different strength ("remains genuinely unresolved" here, "does not establish any harm" there, "no strong evidence it is neutral" elsewhere), reconcile them to the least-strong formulation both support — e.g. "the evidence presented here does not establish a safe or harmful threshold for moderate consumption" — and do not push farther in either direction.

16. SUMMARY PROVENANCE.
The Bottom Line may summarize the researched findings but may not strengthen, generalize, or combine them into a broader empirical proposition the packet did not establish. "The evidence consistently shows these factors interact" lumps four separate findings into one interaction claim nobody researched; the DeftBrain formulation is that a claim reducing the question to one variable deserves skepticism when the cited evidence does not establish that exclusivity.

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

24. THE BOTTOM LINE OBEYS ALL OF THE ABOVE.
The summary may be shorter than the body. It may not be stronger than the body.

NORTH STAR:
RESEARCH THE CLAIMS.
SHOW WHAT THE EVIDENCE EARNS.
KEEP THE SIGNAL.
NAME THE NOISE.
LEAVE GENUINE UNCERTAINTY INTACT.`;

router.outputStandard = 'v2';
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
    'bottom_line_combines_or_generalizes_findings_into_a_proposition_the_packet_did_not_establish',
    'secondary_explanatory_or_commercial_site_used_to_establish_a_conclusion_when_primary_sources_were_available',
    'comparative_claim_x_more_than_y_without_a_cited_comparison_of_x_and_y',
    'finding_scope_expanded_beyond_the_population_age_country_duration_or_condition_studied',
    'association_restated_as_causation_without_a_causal_design_in_the_cited_source',
    'strong_verdict_resting_on_a_thesis_preprint_magazine_or_explanatory_article',
    'proposition_not_fully_established_by_any_single_cited_source',
    'bottom_line_stronger_than_the_body_it_summarizes',
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

  // A Signal conclusion rests on at least one tier 1–3 source (review, primary
  // research, government/regulator, professional body). Secondary-only
  // support — a company blog, an explainer — is enough to flag a question,
  // never to establish an answer. The prompt says so; this makes it true.
  const strongIds = new Set((packet?.sources || []).filter(s => tierOf(s) <= 3).map(s => String(s.id).toUpperCase()));
  parsed.the_signal ??= { items: [] };
  parsed.the_signal.items = (Array.isArray(parsed.the_signal.items) ? parsed.the_signal.items : [])
    .map(x => ({ ...x, source_ids: cleanIds(x?.source_ids, valid) }))
    .filter(x => nonBlank(x?.claim) && nonBlank(x?.basis) && x.source_ids.some(id => strongIds.has(id)))
    .slice(0, 4);

  parsed.the_noise = (Array.isArray(parsed.the_noise) ? parsed.the_noise : [])
    .map(x => ({ ...x, source_ids: cleanIds(x?.source_ids, valid) }))
    .filter(x => nonBlank(x?.claim) && nonBlank(x?.what_the_evidence_supports_instead) && nonBlank(x?.what_went_wrong) && x.source_ids.length)
    .slice(0, 5);

  parsed.still_worth_verifying = (Array.isArray(parsed.still_worth_verifying) ? parsed.still_worth_verifying : [])
    .map(x => ({ ...x, source_ids: cleanIds(x?.source_ids, valid) }))
    .filter(x => nonBlank(x?.question))
    .slice(0, 4);

  parsed.what_general_claims_cant_decide = (Array.isArray(parsed.what_general_claims_cant_decide) ? parsed.what_general_claims_cant_decide : [])
    .filter(nonBlank).slice(0, 3);

  parsed.sources_of_noise = (Array.isArray(parsed.sources_of_noise) ? parsed.sources_of_noise : [])
    .filter(x => nonBlank(x?.source_type) && nonBlank(x?.how_it_distorts) && nonBlank(x?.how_to_recognize_it))
    .slice(0, 3);

  parsed.the_bottom_line ??= {};
  for (const key of ['supported_takeaways', 'treat_skeptically', 'what_would_change_the_answer']) {
    parsed.the_bottom_line[key] = (Array.isArray(parsed.the_bottom_line[key]) ? parsed.the_bottom_line[key] : [])
      .filter(nonBlank).slice(0, 3);
  }

  // Build a source subset from IDs that survived the result. If a source was
  // researched but never actually used, it does not appear in the UI.
  const used = new Set();
  parsed.the_signal.items.forEach(x => x.source_ids.forEach(id => used.add(id)));
  parsed.the_noise.forEach(x => x.source_ids.forEach(id => used.add(id)));
  parsed.still_worth_verifying.forEach(x => x.source_ids.forEach(id => used.add(id)));
  parsed.sources_examined = packet.sources.filter(s => used.has(String(s.id).toUpperCase()));

  return parsed;
}

function buildSupplied(topic, conflictingAdvice, userContext) {
  return `TOPIC:\n${topic.trim()}\n\n${conflictingAdvice?.trim() ? `CLAIMS / CONFLICTING ADVICE:\n${conflictingAdvice.trim()}\n\n` : ''}${userContext?.trim() ? `VISITOR-SUPPLIED CONTEXT:\n${userContext.trim()}\n\n` : ''}`;
}

// The three shared prompt parts each synthesis call gets: the packet, the
// task, and the calibration rules. The two calls split the SCHEMA, not the
// evidence — both read the same packet, so their halves cannot disagree
// about what was found, only about how to say it (rule 15 covers that).
function synthesisPreamble(supplied, researchBlock) {
  return `${supplied}${researchBlock}

TASK

Synthesize the researched evidence into your part of a Signal vs. Noise result. Do not use outside facts that are absent from the WEB RESEARCH PACKET. Another writer is producing the other part from this same packet in parallel; write only the keys asked of you.

LENGTH — this is a screen, not a paper. Word caps are hard limits:
framing 45; a claim 30; basis 60; limits 35; what_the_evidence_supports_instead 60; what_went_wrong 45; kernel_of_truth 35; any bottom-line bullet 40; question / why_it_matters / what_would_help 35 each; source_type / how_it_distorts / how_to_recognize_it 30 each.`;
}

const SHARED_RULES = `- Analyze the visitor's actual claims; do not add adjacent controversies.
- Do not mention a paper, institution, statistic, mechanism, or real-world fact unless it is in the research packet.
- Do not copy long quotations from sources. Paraphrase.
- Do not turn correlation into causation unless the packet supports causation.
- Do not call evidence consensus, settled, definitive, or proven unless the packet explicitly justifies that strength.
- When evidence is mixed, say mixed. When unresolved, say unresolved.
- Return [] rather than manufacturing content.`;

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
      coldWaitMs: 0,
    });
    if (!research.packet) {
      // A failed fetch is negative-cached for a few minutes; without this the
      // client would poll "pending" for its whole budget and only then learn
      // there was nothing coming. 200, not an error status — the poll itself
      // succeeded; it is the research that did not.
      const state = researchState({ topic: topic.trim(), conflictingAdvice: conflictingAdvice?.trim() });
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

// ── Phase 2 (or the whole thing, for a direct caller) ───────────────────
router.post('/signal-vs-noise', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { topic, conflictingAdvice, userContext, userLanguage } = req.body;
    if (!topic?.trim()) return res.status(400).json({ error: 'What topic are you trying to cut through?' });

    const research = await claimResearch({
      topic: topic.trim(),
      conflictingAdvice: conflictingAdvice?.trim(),
      userContext: userContext?.trim(),
      region: req.body.userRegion,
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
    const signalPrompt = `${preamble}

YOUR PART: what the evidence supports and where the visitor's claims outrun it.

Return ONLY valid JSON:
{
  "topic_as_understood": "concise neutral description",
  "framing": "1-2 sentences naming the central distinction that makes the conflict easier to understand",
  "the_signal": {
    "items": [
      {
        "claim": "carefully calibrated conclusion the researched evidence supports",
        "basis": "plain-language explanation of why the evidence supports it — name the design and size where they matter (a controlled trial of 20 people; a 72-study meta-analysis)",
        "limits": "important limit or null",
        "source_ids": ["S1", "S2"]
      }
    ]
  },
  "the_noise": [
    {
      "claim": "visitor-supplied claim that outruns the evidence",
      "noise_type": "marketing | methodology_problem | cherry_picked | outdated | oversimplified | too_broad | context_dependent | media_distortion | weak_evidence",
      "noise_label": "short plain-language label",
      "what_the_evidence_supports_instead": "narrower version actually supported",
      "what_went_wrong": "exactly how the original wording exceeds the evidence",
      "kernel_of_truth": "supported core worth preserving or null",
      "source_ids": ["S1", "S3"]
    }
  ]
}

RULES
- Prefer 2-4 strong Signal/Noise conclusions total over exhaustive coverage.
- A Signal item MUST cite source_ids, at least one of them a review, primary study, government/regulator source, or professional body — a claim the packet marks "support": "secondary_only" is never a Signal item (the other writer lists it under still_worth_verifying). A Noise item MUST cite source_ids supporting the narrower replacement and critique. Cite only the sources that materially support THAT item.
${SHARED_RULES}`;

    const restPrompt = `${preamble}

YOUR PART: what remains open, what the general evidence cannot decide for one person, the bottom line, and how this kind of noise gets made.

Return ONLY valid JSON:
{
  "still_worth_verifying": [
    {
      "question": "genuinely mixed or unresolved empirical question",
      "why_it_matters": "why it matters to the visitor's claims",
      "what_would_help": "what better evidence or definition would reduce the uncertainty",
      "source_ids": ["S2"]
    }
  ],
  "what_general_claims_cant_decide": [
    "person-specific question the general evidence cannot answer from the information supplied"
  ],
  "the_bottom_line": {
    "supported_takeaways": ["2-3 concise takeaways, each traceable to a specific packet finding — end each with its source IDs in square brackets, e.g. '… [S1, S4]'; the page renders them as source chips"],
    "treat_skeptically": ["1-3 of the visitor's claims or framings that deserve skepticism, and why in a phrase — end with source IDs in square brackets where a source bears on it"],
    "what_would_change_the_answer": ["0-3 evidence gaps that materially matter"]
  },
  "sources_of_noise": [
    {
      "source_type": "general distortion mechanism visible in this topic",
      "how_it_distorts": "how the claim gets stronger or simpler than the evidence",
      "how_to_recognize_it": "observable sign to look for"
    }
  ]
}

RULES
- The Bottom Line summarizes what the PACKET establishes, at the packet's own strength — it may not strengthen, generalize, or combine findings into a broader proposition (rule 16). The Signal/Noise cards are being written from this same packet; do not assume anything beyond it.
- still_worth_verifying may cite the sources showing disagreement or limits; if no source bears on it, omit it. A packet claim marked "support": "secondary_only" belongs here, stated as unresolved, with its sources and a note that only secondary sources were found.
- sources_of_noise describes general mechanisms only — never a named actor's motive.
${SHARED_RULES}`;

    const [signalPart, restPart] = await Promise.all([
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 3000,
        system: withLanguage(PERSONALITY, userLanguage) + locale + `\n\n${NO_QUOTE_RULE}`,
        messages: [{ role: 'user', content: signalPrompt }],
      }, { label: 'signal-vs-noise:synthesis-signal' }),
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 2200,
        system: withLanguage(PERSONALITY, userLanguage) + locale + `\n\n${NO_QUOTE_RULE}`,
        messages: [{ role: 'user', content: restPrompt }],
      }, { label: 'signal-vs-noise:synthesis-rest' }),
    ]);

    let parsed = sanitizeResult({ ...(restPart || {}), ...(signalPart || {}) }, research.packet);
    if (!parsed?.framing || (!parsed.the_signal.items.length && !parsed.the_noise.length && !parsed.still_worth_verifying.length)) {
      return res.status(500).json({ error: 'Could not synthesize the researched claims. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'signal-vs-noise',
      fields: collectProseFields(parsed),
      supplied: `${supplied}\nRESEARCH PACKET:\n${JSON.stringify(research.packet)}`,
      promise: 'Research the visitor\'s competing claims, show what the retrieved evidence supports, distinguish overstatement from genuine uncertainty, and preserve source provenance.',
      guard: router.outputGuard,
      userLanguage,
    });

    // Guard repair can touch prose, but source IDs are code-owned. Re-run the
    // structural/source validation before anything reaches the visitor.
    parsed = sanitizeResult(parsed, research.packet);
    const softened = softenCompletenessClaims(parsed);
    if (softened) console.log(`[signal-vs-noise] softened ${softened} search-completeness superlative(s)`);
    res.json(parsed);
  } catch (error) {
    console.error('[SignalVsNoise]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
