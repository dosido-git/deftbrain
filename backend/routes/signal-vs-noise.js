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
const { claimResearch } = require('../lib/claimResearch');

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
  ],
  require: ['fulfills_tool_promise'],
};

function validSourceIds(packet) {
  return new Set((packet?.sources || []).map(s => String(s.id || '').toUpperCase()));
}

function cleanIds(ids, valid) {
  return [...new Set((Array.isArray(ids) ? ids : [])
    .map(x => String(x || '').toUpperCase().trim())
    .filter(x => valid.has(x)))].slice(0, 5);
}

function sanitizeResult(parsed, packet) {
  const valid = validSourceIds(packet);
  const nonBlank = v => typeof v === 'string' && v.trim().length > 0;

  parsed.analysis_mode = 'verified_research';
  parsed.research_status = 'complete';
  parsed.researched_at = packet.researched_at || null;
  parsed.sources_examined = packet.sources;

  parsed.the_signal ??= { items: [] };
  parsed.the_signal.items = (Array.isArray(parsed.the_signal.items) ? parsed.the_signal.items : [])
    .map(x => ({ ...x, source_ids: cleanIds(x?.source_ids, valid) }))
    .filter(x => nonBlank(x?.claim) && nonBlank(x?.basis) && x.source_ids.length)
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
    const supplied = `TOPIC:\n${topic.trim()}\n\n${conflictingAdvice?.trim() ? `CLAIMS / CONFLICTING ADVICE:\n${conflictingAdvice.trim()}\n\n` : ''}${userContext?.trim() ? `VISITOR-SUPPLIED CONTEXT:\n${userContext.trim()}\n\n` : ''}`;

    const prompt = `${supplied}${research.block}

TASK

Synthesize the researched evidence into a Signal vs. Noise result. Do not use outside facts that are absent from the WEB RESEARCH PACKET.

Return ONLY valid JSON:
{
  "topic_as_understood": "concise neutral description",
  "framing": "1-2 sentences naming the central distinction that makes the conflict easier to understand",
  "the_signal": {
    "items": [
      {
        "claim": "carefully calibrated conclusion the researched evidence supports",
        "basis": "plain-language explanation of why the evidence supports it",
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
  ],
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
    "supported_takeaways": ["2-3 concise takeaways traceable to the Signal/Noise analysis"],
    "treat_skeptically": ["1-3 claims or framings examined above that deserve skepticism"],
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
- Prefer 2-4 strong Signal/Noise conclusions total over exhaustive coverage.
- Analyze the visitor's actual claims; do not add adjacent controversies.
- A Signal item MUST cite source_ids.
- A Noise item MUST cite source_ids supporting the narrower replacement and critique.
- still_worth_verifying may cite the sources showing disagreement/limits; if no source bears on it, omit it.
- Do not mention a paper, institution, statistic, mechanism, or real-world fact unless it is in the research packet.
- Do not copy long quotations from sources. Paraphrase.
- Do not turn correlation into causation unless the packet supports causation.
- Do not call evidence consensus, settled, definitive, or proven unless the packet explicitly justifies that strength.
- When evidence is mixed, say mixed. When unresolved, say unresolved.
- Bottom Line may summarize only conclusions already established above; it may not introduce new empirical claims.
- Return [] rather than manufacturing content.`;

    let parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 6000,
      system: withLanguage(PERSONALITY, userLanguage) + locale + `\n\n${NO_QUOTE_RULE}`,
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'signal-vs-noise:synthesis' });

    parsed = sanitizeResult(parsed || {}, research.packet);
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
    res.json(parsed);
  } catch (error) {
    console.error('[SignalVsNoise]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
