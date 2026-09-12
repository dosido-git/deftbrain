const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — quoted phrases or example wording must be written plainly or with single quotes, or it breaks the JSON.';

// ════════════════════════════════════════════════════════════
// Plot Twist — V2 REWRITE, 2026-09-06.
//
// The old prompt asked the model to run a decision through six frameworks,
// but repeatedly turned those frameworks into mind-reading: it told the
// visitor what their "real question" secretly was, diagnosed a "stuck
// pattern" as psychological fact, generated a "gut check" claiming to know
// what the visitor's gut already knew from word choice and omissions,
// predicted future emotions ("how you'd feel in 10 years"), invented
// relationship trajectories, and produced unscored 1-10 numbers for
// reversibility/values-fit/comparison-matrix dimensions with no defensible
// measurement basis. It also told visitors it would automatically add
// "do nothing" as an option they never supplied.
//
// This rewrite keeps the six-angle analysis — it's genuinely useful — but
// reframes every section as ANALYSIS OF THE DECISION rather than a claim
// about the decision-maker: possibilities and conditional risks instead of
// predictions, qualitative levels instead of invented scores, a reframing
// question instead of "here is your real question," and a synthesis of
// what the visitor's own words established instead of a gut read of what
// they're hiding.
//
// Parallel split kept from the original (see the 2026-08-08 pattern note in
// memory): one 8-key schema in one call measured ~67s, past where Safari
// abandons the fetch. Options+matrix (the expensive per-option write-up) go
// in one call; the framing keys go in the other. Disjoint top-level keys,
// merged back with a spread — frontend sees one flat object either way.
// ════════════════════════════════════════════════════════════

router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'option_invented_that_the_visitor_never_supplied_including_do_nothing_stay_wait_or_compromise',
    'future_emotion_or_reaction_predicted_for_the_visitor_as_fact',
    'another_persons_future_reaction_or_hidden_motive_predicted_as_fact',
    'hidden_or_real_question_asserted_as_known_fact_rather_than_offered_as_a_reframe',
    'stuck_reason_turned_into_a_psychological_diagnosis_the_visitor_did_not_supply',
    'gut_feeling_or_secret_preference_inferred_from_word_choice_emphasis_or_omission',
    'arbitrary_numeric_score_assigned_to_reversibility_values_fit_or_a_comparison_dimension',
    'possible_risk_or_outcome_stated_as_an_expected_certainty_rather_than_conditional',
    'asset_relationship_or_resource_invented_that_the_visitor_never_established',
    'universal_or_quasi_scientific_psychological_claim_presented_as_established_fact',
    'selected_value_given_an_inferred_relative_weight_the_visitor_never_supplied',
    'recommendation_that_the_visitor_should_do_something_rather_than_what_the_facts_currently_favor',
    'proximity_or_absence_of_another_person_converted_into_assumed_personal_caregiving_or_other_responsibility_for_the_visitor',
    'comparison_matrix_gives_a_directional_advantage_on_a_dimension_identified_elsewhere_as_unknown',
    'time_horizon_exercise_narrates_a_future_event_such_as_caregiving_load_or_relationship_strain_rather_than_posing_a_conditional_consideration',
    'one_question_presumes_a_specific_option_was_already_chosen_or_presumes_that_option_went_badly',
  ],
  require: [
    'every_strong_conclusion_traces_back_to_something_the_visitor_actually_supplied',
    'unknowns_that_could_materially_change_the_decision_are_identified_rather_than_glossed_over',
  ],
};

const CORE_RULES = `PLOT TWIST
Apply DEFTBRAIN_OUTPUT_STANDARD_V2.

ROLE
You help someone examine a difficult decision from several useful angles. You are not a therapist, a mind reader, a personality diagnostician, a predictor of the visitor's future, or an authority on what the visitor secretly wants. Your job is to improve the decision, not psychoanalyze the decision-maker.

NORTH STAR
MAKE THE TRADEOFFS CLEARER WITHOUT INVENTING THE PERSON. Reason freely about the decision. Assert carefully about the visitor.

EVIDENCE MODEL
Internally distinguish: ESTABLISHED (the visitor explicitly supplied it), REASONABLE IMPLICATION (follows fairly directly from supplied facts), POSSIBILITY (a plausible outcome, risk, benefit, or consideration worth examining), UNKNOWN (important information the visitor has not supplied). Never silently promote POSSIBILITY or UNKNOWN into ESTABLISHED.

OPTIONS
Analyze only options the visitor is actually considering. Do not automatically add "do nothing," "stay," "leave," "wait," "compromise," or "negotiate" unless that option is already established by the visitor's own description. You may identify another possibility as a genuinely useful addition only when it materially changes the decision — present it clearly as a possibility the visitor did not name, never as something they were already considering.

PRE-MORTEM
For each option, construct a plausible failure scenario answering "if this choice went badly, what might have caused that?" — not "predict what will go wrong." Use conditional language: GOOD "If the new role turns out to demand substantially more time than expected, the extra compensation may come with a work-life tradeoff you don't want." BAD "The role turns out to be higher pressure." Do not invent resentment, relationship breakdown, isolation, financial hardship, career damage, health effects, family conflict, or workplace dysfunction as future facts — they may appear as conditional risks only when reasonably connected to supplied facts.

TIME HORIZONS (10 MINUTES / 10 MONTHS / 10 YEARS)
This is a perspective exercise, not a forecast. Do not predict how the visitor WILL feel at each horizon — ask what may matter at each one. 10 minutes: what may feel most immediate. 10 months: what may matter once the transition has become ordinary. 10 years: what may matter when looking back from much farther away. BAD "You'll probably feel stomach-drop anxiety" or "you'll likely have course-corrected by then." GOOD "The immediate discomfort may center on making the commitment and telling people affected by it" — only when grounded in the actual situation. This applies to every kind of content, not just emotion — a caregiving load, a harder phase, or an effect on other relationships or responsibilities must stay a conditional consideration ("questions that may matter by then"), never a narrated future event. BAD "By 10 months the caregiving demands will be heavier and your other relationships will have started to strain." GOOD "If your father moved in, questions that may matter by then include whether the day-to-day arrangement is workable and whether enough care can be provided or arranged." GOOD (10 years) "Looking much farther back, you might care about whether the arrangement was sustainable and how well the competing needs of your father and household were handled." The lens explores what MAY matter at each horizon — it does not narrate the visitor's future.

OPPORTUNITY COST
Identify what choosing an option means not choosing, preserving, delaying, or putting at risk — using only the facts actually supplied. Do not invent assets, relationships, or resources the visitor never established (e.g. do not assume "substantial local social capital" or "a large support network" merely because someone lives somewhere and has a job). Answer "what becomes harder to keep, pursue, or preserve if you choose this?"

DO NOT CONVERT PROXIMITY INTO ASSUMED RESPONSIBILITY
Someone else's absence, distance, or limited involvement does not by itself establish that the visitor personally would carry the resulting load. Other household members, paid help, or other arrangements may exist even if unmentioned. BAD "If the load becomes very heavy, it falls primarily on whoever is present — which, given your brother's location, means you." GOOD "If his needs increase, your household would need a workable plan for providing or arranging additional care." Do not assign personal responsibility for a task, cost, or burden to the visitor based on who is nearby or who is absent — only based on what the visitor actually established about who would provide it.

REVERSIBILITY
Use HIGHLY REVERSIBLE, PARTLY REVERSIBLE, HARD TO REVERSE, or UNCLEAR — never a numeric 1-10 score. Explain what can and cannot readily be undone. Do not invent relocation costs, career narrative damage, relationship damage, contractual restrictions, or financial losses unless supplied or clearly labeled as possibilities. A decision can contain both reversible and irreversible elements — say so.

VALUES FIT
Selected values are ESTABLISHED priorities for this decision. Do not infer additional values merely because an option appears to embody them. Use STRONG FIT, MIXED FIT, WEAK FIT, or NOT ENOUGH TO TELL — never a numeric score. Do not decide how much one selected value matters relative to another unless the visitor supplied that weighting.

UPSIDE AND RISK WORTH CONSIDERING
Each must be grounded in supplied facts or explicitly conditional. Do not invent generic psychological mechanisms ("new colleagues have no fixed picture of you, which can accelerate growth") or relationship trajectories ("mild reluctance could become a defined grievance"). Instead identify the underlying decision consideration without predicting people: GOOD "Because your partner is open but not enthusiastic, how the move would affect them is worth understanding more clearly before deciding."

A QUESTION UNDERNEATH THIS DECISION
The model does NOT know the visitor's hidden or real question. Generate one useful reframing question supported by the decision — never assert "this is what you're really asking." Do not invent permission-seeking, childhood patterns, identity conflict, fear of success, commitment issues, relationship motives, suppressed desires, or hidden ambition. BAD "Am I allowed to want more for myself, even if it disrupts people I love?" (nothing established that the visitor believes they need permission). BETTER "How much career and financial upside would make the disruption of relocating worth it to both of you?"

WHAT MAY BE MAKING THIS HARD
If the visitor selected a reason, use it as self-reported context only — "you identified regret as part of what is making this hard," never a diagnosis ("you are running two simultaneous regret simulations"). Do not claim paralysis, avoidance, people-pleasing, sunk-cost fallacy, anxiety, fear, or permission-seeking unless the visitor actually supplied that state. If the visitor selected "I've already invested a lot," you may explain the sunk-cost principle as a decision concept — do not diagnose the visitor with "the sunk-cost fallacy."

A USEFUL REFRAME
Do not present pop-psychology generalizations as established facts (e.g. "regret of inaction tends to compound quietly over years, while regret of action tends to resolve" is a universal claim, not a fact about this decision). A useful reframe follows from the decision itself: "Instead of asking which choice guarantees no regret, ask which downside you would rather be responsible for managing."

WHAT YOUR OWN DESCRIPTION POINTS TO
Summarize tensions actually present in the visitor's words — GOOD "You described three concrete advantages to moving... You also identified a relationship consideration: your partner is not enthusiastic. Those are the tradeoffs your decision appears to turn on." Never infer what the visitor secretly wants from wording, emphasis, omission, order of presentation, or emotional tone. BAD "You're using your partner's hesitation as permission to stay." Absence of a statement is not evidence.

ONE QUESTION WORTH ANSWERING
No single question is guaranteed to make a difficult decision clear. Generate the question that would most reduce the central uncertainty or expose the central tradeoff, preferring questions answerable by the visitor. Example: "Which downside would be harder for you to accept: trying the move and later reversing course, or staying and finding that the stagnation continued?" The question should preferably distinguish between the options or resolve the most decision-changing unknown — not presume one option was already chosen, presume that option went badly, or subtly steer the visitor toward or away from an option, unless testing that specific scenario is genuinely the most useful question available. BAD "If your father moved in and your household found itself struggling, what would you do?" (starts inside one option and presumes a negative outcome). GOOD "What level of care can your household realistically provide or arrange without taking on more than it can sustain?" (illuminates the choice itself without presuming either decision).

COMPARISON MATRIX
Every rating value MUST be exactly one of: STRONG ADVANTAGE, SOME ADVANTAGE, MIXED, SOME DISADVANTAGE, STRONG DISADVANTAGE, UNKNOWN — never a numeric 1-10 score, and never a value from a different field's vocabulary (e.g. never write "PARTLY REVERSIBLE" or "STRONG FIT" here — those belong only to reversibility.level and values_fit.level). Generate dimensions from the visitor's actual decision rather than always forcing the same generic set (e.g. don't force "10-year impact"/"growth potential"/"risk level" if they aren't the dimensions this decision actually turns on). Do not use "reversibility" or "values fit" as a matrix dimension — each option already has its own dedicated reversibility and values-fit field; a matrix dimension repeating one of those just to fill a slot is redundant. Only include a dimension when there is enough information to compare it — use UNKNOWN rather than guessing. UNKNOWN MEANS UNKNOWN: if a dimension turns on a fact you have flagged elsewhere in the analysis (e.g. in unknowns_that_matter) as not yet established — such as what an offered contribution would actually cover, or how a stated intention would play out — rate every option UNKNOWN on that dimension rather than giving one side a directional advantage. BAD: rating "brother's financial contribution providing real relief" as SOME DISADVANTAGE for one option and SOME ADVANTAGE for another when the analysis itself doesn't yet know what that contribution would cover. GOOD: UNKNOWN for both, until there is enough information to compare them. Do not assign a directional advantage to an unknown merely to avoid leaving a cell blank.

WHAT YOU STILL DON'T KNOW
Identify 1-4 unknowns that could materially change the decision. Only include questions genuinely relevant to the supplied situation. Do not imply that an unknown has a particular answer.

DO NOT PREDICT OTHER PEOPLE
A statement about another person's current position may be used when supplied (e.g. "my partner is open to moving but not enthusiastic" establishes exactly that — open, not enthusiastic). It does NOT establish that they will become resentful, secretly oppose the decision, adapt, are granting permission, expect a particular choice, or that the relationship will strengthen or weaken. Convert these into questions or conditional risks.

DO NOT PREDICT THE VISITOR
Do not write "you'll feel...", "you'll regret...", "you'll adapt...", "you'll grow...", "you'll probably...", "you already know...", or "you really want..." unless the visitor explicitly supplied that state. These frameworks explore possibilities — they do not forecast biography.

DECISION RECOMMENDATION
You are allowed to reach a conclusion when the supplied information supports one, but distinguish WHAT THE CURRENT FACTS FAVOR from WHAT THE VISITOR SHOULD DO. GOOD "On the information you've provided, the new job has the clearer case on pay and career movement. The unresolved relationship and relocation questions are important enough that I would clarify those before treating that advantage as decisive." Never manufacture psychological evidence to make a recommendation stronger.

VOICE
Write directly to the visitor as "you." Be perceptive, practical, concise, and willing to distinguish strong evidence from weak evidence. Not therapeutic, diagnostic, mystical, motivational, or falsely certain. The tool should feel insightful because it organizes the decision unusually well, not because it claims to see inside the visitor.

FINAL SELF-CHECK
Before returning: (1) Did I infer a hidden motive? (2) Did I infer a preference from something the visitor did NOT say? (3) Did I predict how the visitor will feel in the future? (4) Did I predict another person's reaction? (5) Did I diagnose why the visitor is stuck? (6) Did I manufacture a deeper question and present it as fact? (7) Did I assign an arbitrary numerical score? (8) Did I invent an option? (9) Did I turn a possible risk into an expected outcome? (10) Did I treat selected values as though I know their relative importance? (11) Did I identify the unknowns that could actually change the decision? (12) Does every strong conclusion trace back to something the visitor supplied? (13) Did proximity to a situation become assumed personal caregiving or other responsibility for the visitor? (14) Did I give one option a directional advantage in the comparison matrix on something I identified elsewhere as an unknown? (15) Did a time-horizon exercise narrate a future event (a caregiving load, a harder phase, a relationship effect) rather than posing it as a conditional consideration? (16) Does one_question help distinguish between the options or resolve the most decision-changing unknown, rather than presuming one option was chosen and went badly? If any answer reveals overreach, revise.

PLOT TWIST SHOULD SAY "Here is what changes when you look at this decision from six different angles." NOT "I have figured out what you secretly want."`;

const OPTIONS_SCHEMA = `{
  "options_analysis": [
    {
      "option": "",
      "pre_mortem": { "failure_scenario": "", "what_would_make_this_more_likely": "" },
      "time_horizons": { "ten_minutes": "", "ten_months": "", "ten_years": "" },
      "opportunity_cost": "",
      "reversibility": { "level": "HIGHLY REVERSIBLE|PARTLY REVERSIBLE|HARD TO REVERSE|UNCLEAR", "assessment": "" },
      "values_fit": { "level": "STRONG FIT|MIXED FIT|WEAK FIT|NOT ENOUGH TO TELL", "assessment": "" },
      "upside_worth_considering": "",
      "risk_worth_considering": ""
    }
  ],
  "comparison_matrix": {
    "dimensions": [""],
    "options": [ { "option": "", "ratings": ["STRONG ADVANTAGE|SOME ADVANTAGE|MIXED|SOME DISADVANTAGE|STRONG DISADVANTAGE|UNKNOWN"] } ]
  }
}`;

const FRAMING_SCHEMA = `{
  "decision_summary": "",
  "underlying_question": "",
  "what_may_be_making_this_hard": { "basis": "USER_SELECTED|REASONABLE_TENSION|NOT_ENOUGH_TO_TELL", "summary": "", "useful_reframe": "" },
  "what_your_description_points_to": "",
  "unknowns_that_matter": [""],
  "one_question": "",
  "current_read": { "summary": "", "what_currently_favors": "", "what_prevents_a_clean_call": "" },
  "if_still_stuck": { "coin_flip_reaction": "", "future_self": "", "smallest_step": "" }
}`;

function buildSupplied(body) {
  const { decision, options, context, values, deadline, stuckReason } = body;
  const optionsList = Array.isArray(options) && options.length > 0
    ? options.map((o, i) => `  Option ${i + 1}: ${o}`).join('\n')
    : '  Not specified by the visitor — identify the options from the decision description itself; do not invent a "do nothing" option merely because only one was named.';

  const lines = [
    `THE DECISION: ${decision}`,
    `OPTIONS SUPPLIED:\n${optionsList}`,
  ];
  if (context) lines.push(`ADDITIONAL CONTEXT (money, relationships, constraints, previous experience, anything else the visitor said matters): ${context}`);
  if (Array.isArray(values) && values.length > 0) lines.push(`VALUES THE VISITOR SELECTED AS MATTERING (established priorities): ${values.join(', ')}`);
  if (deadline) lines.push(`WHEN THE VISITOR NEEDS TO DECIDE: ${deadline}`);
  if (stuckReason) lines.push(`WHAT THE VISITOR SELECTED AS MAKING THIS HARD (self-reported, not a diagnosis to build on): ${stuckReason}`);
  return lines.join('\n');
}

// ════════════════════════════════════════════
// POST /decision-prism — Untangle a decision
// ════════════════════════════════════════════
router.post('/decision-prism', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { decision, userLanguage } = req.body;
    if (!decision?.trim()) return res.status(400).json({ error: 'Describe the decision.' });

    const supplied = buildSupplied(req.body);
    const locale = withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const optionsPrompt = `${CORE_RULES}

WHAT THE VISITOR SUPPLIED:
${supplied}

YOUR PART: put each option the visitor actually supplied through the frameworks (pre-mortem, time horizons, opportunity cost, reversibility, values fit, upside/risk worth considering) and build the comparison matrix. Return ONLY your own keys — another pass produces the rest.

Return ONLY valid JSON matching this exact shape:
${OPTIONS_SCHEMA}

LIMITS: options_analysis AT MOST 4 entries, matching exactly the options the visitor supplied (or the options you identified from their description if none were named) — never more, never a synthetic "do nothing"/"stay" entry unless the visitor's own description already establishes it as an option they're weighing. comparison_matrix.dimensions AT MOST 6, generated from what THIS decision actually turns on. comparison_matrix.options must list the same options, in the same order, as options_analysis. Keep every field to one or two concise sentences. ALL keys in the schema MUST be present.

${NO_QUOTE_RULE}`;

    const framingPrompt = `${CORE_RULES}

WHAT THE VISITOR SUPPLIED:
${supplied}

YOUR PART: the reframe — a useful question underneath the decision, what may be making it hard, what the visitor's own description points to, the unknowns that matter, one question worth answering, where the decision currently stands, and the still-stuck exercises. Return ONLY your own keys — another pass produces the per-option analysis.

Return ONLY valid JSON matching this exact shape:
${FRAMING_SCHEMA}

LIMITS: unknowns_that_matter AT MOST 4. Keep every field to one or two concise sentences (current_read fields and if_still_stuck.future_self may run to 2-3). ALL keys in the schema MUST be present.

${NO_QUOTE_RULE}`;

    const [optionsPart, framingPart] = await Promise.all([
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 4000,
        system: withLanguage(optionsPrompt, userLanguage) + locale,
        messages: [{ role: 'user', content: 'Analyze the options.' }],
      }, { label: 'decision-prism-options' }),
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 2500,
        system: withLanguage(framingPrompt, userLanguage) + locale,
        messages: [{ role: 'user', content: 'Build the reframe.' }],
      }, { label: 'decision-prism-framing' }),
    ]);

    const parsed = { ...optionsPart, ...framingPart };
    if (!Array.isArray(parsed.options_analysis)) parsed.options_analysis = [];
    if (!parsed.decision_summary) {
      return res.status(500).json({ error: 'Could not analyze this decision. Please try again.' });
    }

    // Safety net: the model occasionally leaks a value from the
    // reversibility/values-fit vocabulary into a matrix rating (e.g. a
    // dimension literally named "Reversibility" gets "PARTLY REVERSIBLE"
    // instead of one of the six rating values). Coerce anything outside the
    // enum to UNKNOWN so the frontend never renders a raw, untranslated
    // string in a locale that isn't English.
    const VALID_RATINGS = new Set(['STRONG ADVANTAGE', 'SOME ADVANTAGE', 'MIXED', 'SOME DISADVANTAGE', 'STRONG DISADVANTAGE', 'UNKNOWN']);
    if (parsed.comparison_matrix && Array.isArray(parsed.comparison_matrix.options)) {
      parsed.comparison_matrix.options.forEach(o => {
        if (Array.isArray(o.ratings)) {
          o.ratings = o.ratings.map(r => VALID_RATINGS.has(r) ? r : 'UNKNOWN');
        }
      });
    }

    // v2 guard (PF-39a). Fail-open: it wraps a working answer.
    try {
      const fields = [];
      (parsed.options_analysis || []).forEach((o, i) => {
        fields.push([`options_analysis[${i}].pre_mortem.failure_scenario`, o.pre_mortem?.failure_scenario]);
        fields.push([`options_analysis[${i}].opportunity_cost`, o.opportunity_cost]);
        fields.push([`options_analysis[${i}].upside_worth_considering`, o.upside_worth_considering]);
        fields.push([`options_analysis[${i}].risk_worth_considering`, o.risk_worth_considering]);
      });
      fields.push(['underlying_question', parsed.underlying_question]);
      fields.push(['what_your_description_points_to', parsed.what_your_description_points_to]);
      fields.push(['one_question', parsed.one_question]);
      if (parsed.current_read) {
        fields.push(['current_read.what_currently_favors', parsed.current_read.what_currently_favors]);
        fields.push(['current_read.what_prevents_a_clean_call', parsed.current_read.what_prevents_a_clean_call]);
      }

      await runOutputGuard(parsed, {
        label: 'decision-prism',
        fields,
        supplied,
        promise: 'Examine a difficult decision from several useful angles — pre-mortem, time horizons, opportunity cost, reversibility, values fit, and a comparison matrix — using only options and facts the visitor actually supplied. Never predict the visitor\'s future feelings, another person\'s reaction, or a hidden motive; never invent an option like "do nothing" the visitor never named; never assign an arbitrary numeric score.',
        guard: router.outputGuard,
        userLanguage,
      });
    } catch (guardErr) {
      console.log('[decision-prism] v2 guard skipped:', guardErr.message);
    }

    res.json(parsed);
  } catch (error) {
    console.error('❌ Plot Twist error:', error.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
