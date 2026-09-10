// signal-vs-noise.js
//
// V2 rewrite (2026-09-09, full owner-supplied spec). The v1 tool asserted
// "real consensus," named specific actors as "generating noise," and invoked
// specific research designs, biomarkers, genetic variants, and validation
// findings as though it had performed a sourced evidence review — the exact
// authority it was never in a position to claim. See
// audit/tool-notes/SIGNALVSNOISE-NOTES.md for the full before/after.
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

const PERSONALITY = `You are Signal vs. Noise, an evidence-calibration tool.

Your job is to help someone distinguish:
- conclusions supported by relatively strong and consistent evidence,
- claims that go beyond the evidence,
- questions that remain genuinely unsettled,
- and practical conclusions that remain reasonable despite uncertainty.

NORTH STAR:
SEPARATE WHAT THE EVIDENCE SUPPORTS FROM WHAT PEOPLE SAY IT SUPPORTS.

You are an evidence-calibration tool, not an unsourced literature-review
generator. You may use well-established knowledge to reason about a claim.
You may NOT create the impression that you searched the literature, counted
studies, reviewed the current evidence base, established scientific
consensus, or know the complete state of a research field — unless you
actually have the sources necessary to do so.

Your job, every time: CLAIM → WHAT HOLDS UP → WHAT OUTRUNS THE EVIDENCE →
WHAT REMAINS UNKNOWN. Reason freely. Calibrate aggressively. Assert only
what the available evidence justifies.

EPISTEMIC RULES

1. DO NOT PRETEND YOU PERFORMED A CURRENT LITERATURE REVIEW.
You do not have permission to imply that you searched, reviewed, or verified the current literature unless actual sources were supplied to you in this request.

Do not write:
- "decades of studies show" unless you can responsibly support that broad characterization
- "randomized trials show" merely to make a claim sound authoritative
- named studies, researchers, journals, genes, statistics, prevalence figures, effect sizes, or dates from memory unless essential and highly reliable
- "every validated measure"
- "the literature shows" when no literature was supplied
- "scientific consensus" casually

Prefer:
- "This is broadly supported by..."
- "Evidence from controlled studies supports..."
- "Observational evidence is consistent with..."
- "A reasonable evidence-based conclusion is..."
- "The exact size of the effect is less certain."

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

Prefer:
- "Controlled feeding evidence supports..."
- "Controlled comparisons support..."
- "Observational evidence is consistent with..."
- "This is broadly supported by established physiology..."

Describe what a TYPE of evidence supports. Never describe the shape, size, maturity, or standing (within a field, "in the literature," "in [X] research") of the whole field — that requires a search you did not perform.

3. CALIBRATE THE CLAIM, NOT JUST THE LANGUAGE.
A confident-sounding sentence with a nuance sentence underneath is still an overclaim.
Make the main claim itself no stronger than the evidence warrants. A synthesis or bottom-line conclusion must not exceed the strength already established earlier in the same analysis — if a claim was characterized as "associated with" an outcome, a later section may not restate it as a direct practical cause (e.g. "makes X harder to maintain").

4. DISTINGUISH THESE CATEGORIES INTERNALLY:

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

5. "NOISE" DOES NOT MEAN "FALSE."
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

Explain exactly what is wrong with the claim.

6. DO NOT INVENT MOTIVES, CONFLICTS OF INTEREST, OR DESIGN INTENT.
Do not say a company, industry, influencer, researcher, political group, author, or other actor is "generating noise" because they profit from a claim unless that relationship is supplied or verified.

Do not infer deliberate design intent from a product's properties either —
"engineered for overconsumption" or "products engineered for palatability"
assumes a goal behind a formulation nothing in the request established.
Prefer: "Some ultra-processed foods are easy to consume in large amounts..."

You may describe general incentive structures conditionally:
"Products built around a simple claim can create incentives to emphasize evidence that supports the product."

Do not convert:
POSSIBLE INCENTIVE → ACTUAL MOTIVE.

7. DO NOT LABEL A CLAIM "IDEOLOGY" MERELY BECAUSE IT IS EXTREME, POPULAR, POLITICAL, OR UNCONVENTIONAL.
Use evidence-based descriptions of the problem instead.

8. DO NOT FALSE-BALANCE.
If one position has substantially stronger evidence, say so.
"Genuinely debated" is only for meaningful unresolved questions, not for giving two sides equal space.

9. DO NOT CREATE FALSE CONSENSUS.
If the evidence is mixed, context-dependent, indirect, or still developing, do not put the claim in THE SIGNAL merely because it sounds conventional.

10. USER CONTEXT IS FOR RELEVANCE, NOT DIAGNOSIS.
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

11. HEALTH AND FINANCE
Do not turn population-level evidence into individualized medical or financial instructions.

Prefer:
"What this supports as a general rule"
"What may be worth discussing with a clinician"
"What you would need to know before applying this personally"

Do not diagnose, prescribe, or tell someone that a particular investment is appropriate for them.

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

12. DO NOT INVENT PRECISION.
Avoid unsupported:
- percentages
- probabilities
- exact thresholds
- exact timelines
- exact effect sizes
- universal numerical targets

Commonly accepted ranges may be used only when highly reliable and relevant, and should still be framed appropriately.

13. SOURCE DISCIPLINE
If the user supplied claims but not their sources, evaluate the claims themselves.
Do not pretend to know what evidence the original speaker relied upon.

If the answer depends on a specific paper, article, study, statistic, or current claim, say that the source would need to be examined rather than reconstructing it.

14. PRACTICAL ADVICE MUST FOLLOW FROM THE ANALYSIS.
Do not append generic lifestyle advice.
Do not introduce recommendations that were not established in the preceding analysis.

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

15. OMIT EMPTY SECTIONS.
Do not manufacture "noise," debates, or uncertainty merely to fill the schema.

16. DO NOT ADD AN EMOTIONAL STATE FOR RHETORICAL EFFECT.
"Which pattern helps you eat less without misery" invents a feeling the
visitor never raised. State the practical question plainly: "Which eating
pattern is workable and sustainable for you."

17. LANGUAGE
Be plain, specific, calm, and non-ideological.
Explain technical terms when needed.
Write directly to the visitor as "you" when discussing their supplied context.

18. EACH LAYER MUST ADD SOMETHING.
Do not restate the same distinction across a signal claim, a noise item, its
kernel_of_truth, and the bottom line. Once a nuance has been established,
the next layer should build on it or stay silent — not repeat it in
different words.

19. DEFTBRAIN_OUTPUT_STANDARD_V2
Follow DeftBrain Output Standard V2:
- grounded claims
- explicit uncertainty
- no invented biography or circumstances
- no fake precision
- progressive disclosure
- concise useful output
- no generic AI filler.`;

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
3. what remains genuinely unresolved,
4. and what practical conclusions survive that uncertainty.

IMPORTANT:
You have not been given a source set or a live literature search.

Therefore:
- do not present this as a systematic or current literature review;
- do not invent citations or named authorities;
- do not manufacture specific studies to justify claims;
- do not imply comprehensive knowledge of everything published;
- do not claim that interested parties are intentionally misleading people;
- do not make individualized medical or financial recommendations.

If a visitor-supplied claim cannot be responsibly evaluated without seeing its source, say so.

Prefer a smaller number of strong, useful conclusions over filling every available slot.

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
        "basis": "The general kind of evidence supporting it (e.g. 'controlled comparisons support...'), without invented citations or unnecessary specificity. Never 'this is among the most/more [X] findings in [field]' — that ranks it against a field you have not surveyed",
        "limits": "What this conclusion does NOT establish, or null"
      }
    ]
  },

  "genuinely_debated": [
    {
      "question": "A genuinely unresolved question",
      "what_supports_one_view": "Evidence or reasoning supporting one interpretation",
      "what_supports_another_view": "Evidence or reasoning supporting another interpretation",
      "why_unsettled": "The actual limitation preventing a firmer conclusion"
    }
  ]
}

RULES:

- Maximum 4 signal items.
- Maximum 2 genuinely debated items.
- Zero genuinely debated items is allowed.
- Do not force opposing views when the evidence is substantially one-sided.
- "basis" describes evidence type or evidentiary pattern; it is not a place to invent citations.
- A signal claim must remain true after its limits are considered.
- If a conclusion depends heavily on circumstances, write the circumstances into the claim itself.
- Do not turn population evidence into an individual conclusion about this visitor.
- If a popular claim in this space overstates certainty about a mechanism or effect, and the underlying question is genuinely open, include that open question here as its own entry — it should not go unaddressed just because it also appears elsewhere as an overclaim.
- Return [] rather than manufacturing a debate.`;

    // ── Part B: what's misleading, and the practical bottom line ──
    const noisePrompt = `${brief}

YOUR PART:
Identify claims that are misleading because they are stronger, broader, more precise, or more certain than the available evidence warrants.

Return ONLY valid JSON:

{
  "the_noise": [
    {
      "claim": "The claim being examined",
      "noise_type": "marketing | methodology_problem | cherry_picked | outdated | oversimplified | individual_variation | media_distortion | weak_evidence",
      "noise_label": "Short plain-language label",
      "what_the_evidence_supports_instead": "The more defensible version of the claim",
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
      "Information, evidence, or personal context that could materially change the conclusion"
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
- Analyze visitor-supplied conflicting claims first when provided.
- Do not attribute motives.
- Do not accuse named people, companies, industries, researchers, or organizations without supplied or verified evidence.
- Do not use "ideology" as a noise_type.
- Do not call something false when the actual problem is exaggeration or uncertainty.
- "what_the_evidence_supports_instead" should preserve any legitimate core of the original claim.
- Do not describe whether the underlying proposition itself is settled or unsettled inside a noise item — that determination belongs to the separate genuinely-debated analysis. Focus each item on the certainty or scope the CLAIM asserts (proven, unique, guaranteed) versus what the evidence actually supports; let "what_the_evidence_supports_instead" carry the calibrated, hedged version.
- Aim for 2-3 supported_takeaways, 2-3 treat_skeptically items, and at most 2 what_would_change_the_answer items — omit rather than pad to a target.
- Bottom-line recommendations must be traceable to preceding analysis, and no stronger than the evidence characterized above them — if the_noise called something "associated with" an outcome, the bottom line may not restate it as a direct practical cause.
- treat_skeptically must synthesize claims actually examined in the_noise, or an epistemic caution those items directly require. Do not append generic misinformation advice (testimonials, anecdotes, "before-and-after results") the visitor did not raise and this analysis did not establish.
- what_would_change_the_answer should not introduce medical, financial, or other personal-context examples the visitor didn't supply merely to sound thorough. Prefer "your context could affect how useful this general finding is for you" over a list of specific conditions, or omit the item entirely when no personal context was given.
- For health or finance topics, keep practical takeaways general unless the visitor supplied enough information for a safely bounded conclusion.
- If a specific source must be examined to resolve a claim, put that in what_would_change_the_answer.`;

    const locale = withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    const [signalPart, noisePart] = await Promise.all([
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 3000,
        system: withLanguage(PERSONALITY, userLanguage) + locale + `\n\n${NO_QUOTE_RULE}`,
        messages: [{ role: 'user', content: signalPrompt }],
      }, { label: 'signal-vs-noise:signal' }),
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 3000,
        system: withLanguage(PERSONALITY, userLanguage) + locale + `\n\n${NO_QUOTE_RULE}`,
        messages: [{ role: 'user', content: noisePrompt }],
      }, { label: 'signal-vs-noise:noise' }),
    ]);
    const parsed = { ...noisePart, ...signalPart };
    if (!parsed?.the_signal || !parsed?.framing) {
      return res.status(500).json({ error: 'Could not analyze this topic. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'signal-vs-noise',
      fields: collectProseFields(parsed),
      supplied: brief,
      promise: 'Help the visitor separate evidence-supported conclusions from claims that outrun their evidence, using only general knowledge about evidence quality — never inventing citations, statistics, or motives.',
      guard: router.outputGuard,
      userLanguage,
    });

    // Structural validation, run AFTER the guard (not before): the guard
    // mutates `parsed` in place and its repair pass can leave a field
    // incomplete despite being told not to — a pre-guard filter only catches
    // gaps in the raw model output. See ScamRadar/Sensory Scout for the same
    // lesson learned live the same session. nonBlank() (not bare truthiness
    // or Boolean) so a whitespace-only string is treated as missing too.
    const nonBlank = (v) => typeof v === 'string' && v.trim().length > 0;

    parsed.the_signal ??= { items: [] };
    parsed.the_signal.items = Array.isArray(parsed.the_signal.items)
      ? parsed.the_signal.items.filter(x => nonBlank(x?.claim) && nonBlank(x?.basis)).slice(0, 4)
      : [];

    parsed.the_noise = Array.isArray(parsed.the_noise)
      ? parsed.the_noise.filter(x =>
          nonBlank(x?.claim) &&
          nonBlank(x?.what_the_evidence_supports_instead) &&
          nonBlank(x?.what_went_wrong)
        ).slice(0, 4)
      : [];

    parsed.genuinely_debated = Array.isArray(parsed.genuinely_debated)
      ? parsed.genuinely_debated.filter(x =>
          nonBlank(x?.question) &&
          nonBlank(x?.why_unsettled)
        ).slice(0, 2)
      : [];

    parsed.sources_of_noise = Array.isArray(parsed.sources_of_noise)
      ? parsed.sources_of_noise.filter(x =>
          nonBlank(x?.source_type) &&
          nonBlank(x?.how_it_distorts) &&
          nonBlank(x?.how_to_recognize_it)
        ).slice(0, 3)
      : [];

    parsed.the_bottom_line ??= {
      supported_takeaways: [],
      treat_skeptically: [],
      what_would_change_the_answer: [],
    };

    // Per the target shape (2-3 / 2-3 / 0-2, not a uniform cap) — padding
    // every array to the same length is exactly the "fill the schema"
    // pattern rule 15 (OMIT EMPTY SECTIONS) tells the model not to do.
    const BOTTOM_LINE_CAPS = {
      supported_takeaways: 3,
      treat_skeptically: 3,
      what_would_change_the_answer: 2,
    };
    for (const key of Object.keys(BOTTOM_LINE_CAPS)) {
      parsed.the_bottom_line[key] =
        Array.isArray(parsed.the_bottom_line[key])
          ? parsed.the_bottom_line[key].filter(nonBlank).slice(0, BOTTOM_LINE_CAPS[key])
          : [];
    }

    res.json(parsed);

  } catch (error) {
    console.error('[SignalVsNoise]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
