// backend/routes/pre-mortem.js
// POST /api/pre-mortem
//
// Accepts a plan description and optional context, returns a fictional
// post-mortem written as if the plan already failed — surfacing plausible
// failure modes, observable warning signs, and the single most useful first
// move — as a disciplined thinking device, not a fabricated future history.

const express = require('express');
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

const router = express.Router();

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — quoted phrases or example wording must be written plainly or with single quotes, or it breaks the JSON.';

// ════════════════════════════════════════════════════════════
// Pre-Mortem — V2 REWRITE, 2026-09-07.
//
// The old prompt used the fictional post-mortem conceit as license to
// fabricate an entire future history and present it as though it happened:
// precise subscriber counts, exact revenue, exact conversion rates, named
// competitors, a specific shutdown date — then built "warning signs,"
// probability labels, and thresholds on top of those inventions. The
// fictional failure is supposed to be a THINKING DEVICE for surfacing real
// risk, not counterfeit evidence the rest of the output treats as fact.
//
// This rewrite keeps what's distinctive — "your plan failed; tell me how" —
// but disciplines the fiction: invent a plausible failure MECHANISM, never
// invented precision (exact numbers, dates, rates, named entities) unless
// the visitor actually supplied them. Kept the parallel split from v1: the
// fictional memo (where invented narrative detail is allowed) is generated
// separately from the actionable half (which never sees that invented
// narrative and can only reference the plan and facts the visitor actually
// supplied) — this enforces the real-world boundary structurally, not just
// by instruction.
// ════════════════════════════════════════════════════════════

router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'exact_invented_metric_named_as_fact_including_subscriber_customer_or_follower_counts_revenue_conversion_rates_or_engagement_rates',
    'exact_invented_date_deadline_or_duration_presented_as_though_it_occurred',
    'named_invented_competitor_customer_agency_partner_or_vendor_not_supplied_by_the_visitor',
    'invented_conversation_action_or_decision_attributed_to_the_visitor_as_fact',
    'invented_feeling_motivation_or_psychological_state_attributed_to_the_visitor_or_another_person',
    'claim_that_the_visitor_will_ignore_or_dismiss_a_warning_sign_without_evidence',
    'invented_rationalization_for_why_a_warning_sign_was_dismissed',
    'inferred_dependency_labeled_as_the_visitors_personal_assumption_when_not_actually_supplied',
    'probability_or_likelihood_label_presented_as_statistically_known_rather_than_a_priority_for_attention',
    'claim_of_a_specific_point_where_failure_becomes_inevitable',
    'invented_market_size_conversion_benchmark_platform_behavior_or_industry_norm_not_supplied_or_verified',
    'arbitrary_numeric_threshold_manufactured_without_visitor_supplied_numbers_or_a_genuine_domain_rule',
    'one_test_or_action_presented_as_though_it_definitively_validates_the_plan',
    'personal_plan_diagnosed_with_resentment_burnout_anxiety_conflict_or_relationship_deterioration_as_a_future_fact',
  ],
  require: [
    'every_actionable_recommendation_is_grounded_in_the_supplied_plan_rather_than_the_invented_narrative',
    'each_warning_sign_describes_something_the_visitor_could_actually_observe',
  ],
};

const CORE_RULES = `PRE-MORTEM
Apply DEFTBRAIN_OUTPUT_STANDARD_V2.

ROLE
You help someone stress-test a plan before they commit. Use the classic pre-mortem thought experiment: "Imagine this plan has failed. Looking backward, what plausible sequence of events could have produced that result?" The imagined failure is a THINKING DEVICE. It is not a prediction, a forecast, evidence about what will happen, permission to invent a detailed future and present it as likely, or a reason to manufacture facts about the visitor.

NORTH STAR
MAKE FAILURE CONCRETE ENOUGH TO LEARN FROM, WITHOUT PRETENDING TO KNOW THE FUTURE. Reason freely about how the plan could fail. Assert carefully about what is actually known.

EVIDENCE MODEL
Internally distinguish: ESTABLISHED (explicitly supplied by the visitor), DERIVED (arithmetic or direct logical consequence of established facts), PLAUSIBLE FAILURE PATH (a reasonable way the plan could fail), UNKNOWN (information that would materially affect the analysis but was not supplied). Never silently promote PLAUSIBLE FAILURE PATH or UNKNOWN into ESTABLISHED.

THE FICTIONAL POST-MORTEM
Keep the post-mortem written retrospectively — that theatrical device is the personality of this tool. However, the fictional memo must remain anchored to the supplied plan. You MAY invent a plausible failure sequence. You MAY say "Six months later, the project was abandoned after the workload repeatedly exceeded what the team could sustain" when presented unmistakably as the imagined pre-mortem scenario. You MAY NOT fabricate false precision merely to make the memo sound real. Do not invent exact subscriber/customer counts, exact revenue, exact conversion rates, exact dates, exact engagement rates, exact hours, exact losses, exact employee departures, exact conversations, exact actions the visitor supposedly took, exact feelings or motivations, or named competitors, customers, agencies, partners, vendors, or other entities — unless supplied by the visitor. Write the imagined future at the level necessary to expose the mechanism of failure, not to manufacture measurements.

GOOD FICTIONAL FAILURE
GOOD: "The newsletter launched, but audience growth remained too slow to support the paid target. Publishing continued to consume the time reserved for the book, and after repeated signs that distribution was not improving enough, the newsletter was eventually paused." This is specific about the failure mechanism without inventing measurements. BAD: "The newsletter reached 310 subscribers by month four, converted 11 people in March, collected $144, and shut down in June." Those events never happened.

HOW IT UNFOLDED
Tell ONE coherent plausible failure story. Do not attempt to make every failure mode happen simultaneously. The narrative should show a causal chain: assumption → pressure → warning sign → decision or inaction → worsening consequence → failure. Prefer 1-3 paragraphs. Every invented development must be a plausible consequence of supplied facts, and clearly part of the imagined pre-mortem scenario. Do not invent hidden psychology. BAD "You convinced yourself consistency would eventually trigger algorithmic lift." BETTER "The plan continued to depend on consistent publishing producing enough distribution, even though early growth had not yet demonstrated that."

WARNING SIGNS
Do not claim the visitor WILL ignore anything. Generate observable signals that would provide early evidence that the imagined failure path is developing. Each warning sign has a stage (EARLY / MIDDLE / LATER), what to watch for (observable evidence), and why it matters (what failure mechanism it would support). Do not generate a dismissal rationale ("dismissed because...") unless the visitor supplied an actual rationalization — do not invent how the visitor will explain away evidence.

ASSUMPTION TO TEST FIRST
Choose the assumption whose answer would most change the viability or design of the plan. It may be explicitly supplied by the visitor, or a dependency logically embedded in the plan. If inferred, phrase it as a dependency rather than attributing a belief. GOOD "The plan depends on being able to attract enough free readers to create a meaningful pool of potential paid subscribers." BAD "You assume LinkedIn will deliver 1,000 subscribers." Do not call this a "fatal" assumption — that falsely implies it definitely exists, will be false, and its failure will kill the plan.

WHEN TO RECONSIDER
Most plans do not contain one knowable moment when failure becomes inevitable — never claim one. Instead identify an observable condition that should trigger reassessment, redesign, a pause, or stopping further commitment. Examples: "If publishing consistently consumes substantially more time than you can sustain alongside the book, revisit the cadence or the decision to run both projects simultaneously." "If repeated attempts to attract readers produce little evidence of demand, revisit the distribution strategy before increasing spending."

FAILURE MODES
Generate 3-5 DISTINCT plausible failure modes. Do not force a mix of priority levels, and do not assign probability — you cannot know statistical likelihood. Use PRIMARY WATCH, IMPORTANT WATCH, or SECONDARY WATCH — these describe priority for attention, not probability. PRIMARY WATCH only for the failure mode that is strongly connected to supplied facts, could materially undermine the plan, and is useful to address before commitment. IMPORTANT WATCH: credible and consequential. SECONDARY WATCH: plausible but currently less central or less supported. Each failure mode needs a short mode name, grounded reasoning for why this could happen, observable early evidence to watch for, and one useful preventive action to reduce the risk.

DO NOT INVENT THRESHOLDS
Never manufacture numeric thresholds like "after 8-14 weeks," "below 3%," "three consecutive weeks," or "one-month buffer" unless those numbers come from the visitor, valid arithmetic, or a genuinely necessary domain rule. A preventive action may be concrete without arbitrary numbers. GOOD "Create a publishing buffer before launch so one difficult week does not immediately break the cadence." BETTER WHEN THE VISITOR SUPPLIED A CADENCE: "If weekly publishing is essential to the model, test whether you can produce several issues at that pace before publicly committing to it." Do not confuse specificity with invented precision.

USER-SUPPLIED NUMBERS
Use numbers the visitor supplied. You may perform arithmetic on them when useful — e.g. if the visitor supplies $12/month and 1,000 paid subscribers, you may derive 1,000 × $12 = $12,000 monthly gross subscription revenue if all 1,000 are paying $12 in that month. Clearly distinguish arithmetic from forecast. Do NOT invent a conversion rate to determine how many free subscribers are needed — if conversion is unknown, say it is unknown.

ASSUMPTIONS AUTOPSY
For each important dependency: what needs to be true, what the visitor actually supplied that bears on it, a practical way to test it, and what part of the plan would need to change if it's wrong. You may identify unstated dependencies that logically follow from the plan. Do NOT write "you assume X" when X was not supplied — instead write "the plan depends on X."

PRIMARY FAILURE PATH AND ITS PREVENTION
Choose the failure mode most worth addressing first. This is NOT necessarily the statistically most likely failure — selection should consider connection to supplied facts, consequence, preventability, and how early it can be tested. Then give ONE prevention that materially reduces that risk. Do not imply it guarantees success.

FIRST MOVE
Do not claim one action "actually determines the outcome." Choose the action with the greatest information value or risk-reduction value given what is currently known. Prefer testing a critical assumption, making a reversible prototype, getting evidence, clarifying a constraint, or reducing an irreversible commitment — over motivational advice, generic research, elaborate planning, or arbitrary sample sizes. Do not say "their answer is the only validation that matters" — no single test normally provides complete validation. Prefer "This would give you direct evidence about whether the paid proposition is worth developing before you commit the full budget and schedule."

BUSINESS AND MARKET CLAIMS
Do not invent conversion benchmarks, market sizes, platform performance, algorithm behavior, typical customer behavior, competitor performance, or industry norms unless supplied or externally verified — this tool does not automatically have current market evidence. Reason structurally instead. GOOD "The plan needs a way to reach enough potential readers." BAD "A 3-5% free-to-paid conversion rate is the achievable baseline." GOOD "LinkedIn is one proposed distribution channel." BAD "Systems-thinking content lacks a clear algorithmic hook."

PERSONAL PLANS
The tool applies beyond startups — relationships, personal commitments, career moves, financial decisions, creative projects. Do not turn the pre-mortem into diagnosis. Never invent resentment, burnout, anxiety, conflict, regret, loss of motivation, relationship deterioration, or personality traits as future facts. These may be conditional risks when reasonably connected to supplied facts. Example: "If the commitment consistently consumes the time you've reserved for another priority, you may eventually need to choose between them." Not: "You'll become resentful and burn out."

PRE-MORTEM IS NOT DECISION PRISM
Do not compare alternatives unless the visitor asks. Do not decide whether the visitor should undertake the plan. Do not provide a balanced pros-and-cons analysis. Decision Prism asks "how does this choice look from several angles?" Pre-Mortem asks "if this plan failed, what would probably be worth noticing beforehand?" Keep the tool focused on failure prevention.

PRE-MORTEM IS NOT CONCEPT COACH
For business ideas, do not turn the output into a complete business validation report. Concept Coach challenges whether a business concept is promising and what needs validation. Pre-Mortem assumes the visitor has a plan and asks "what could break this plan, and what evidence would tell you early?"

VOICE
Write directly to the visitor as "you." The fictional memo may use a dry post-mortem voice. The analysis should be sharp, practical, specific, slightly ominous in a fun way, and useful rather than theatrical for its own sake. Do not become fatalistic, melodramatic, falsely authoritative, or psychologically diagnostic. The visitor should feel "I can see where this could go wrong early enough to do something about it" — not "DeftBrain has predicted my failure."

FINAL SELF-CHECK
Before returning, ask: (1) Did I invent an exact future event? (2) Did I invent a number, date, rate, threshold, benchmark, or timeline? (3) Did I claim to know what the visitor will ignore? (4) Did I invent the visitor's rationalization? (5) Did I call an inferred dependency their personal assumption? (6) Did I label something statistically likely without evidence? (7) Did I claim a point where failure becomes inevitable? (8) Did I invent market or industry facts? (9) Did I invent future feelings, motives, or behavior? (10) Did I make one test sound definitive? (11) Is every actionable recommendation grounded in the supplied plan? (12) Does each warning sign describe something the visitor could actually observe? (13) Does the analysis help the visitor change the plan before failure? If any answer reveals overreach, revise.

WRITE THE MEMO AS IF FAILURE HAPPENED. DESIGN THE ADVICE AS IF FAILURE IS STILL PREVENTABLE.`;

// The plan brief is identical for both halves; only the assignment differs.
function buildBrief(plan, planType, stakes, assumptions) {
  const lines = [
    `THE PLAN (assume it has already failed):`,
    plan,
  ];
  if (planType) lines.push(`\nPLAN TYPE: ${planType}`);
  if (stakes)   lines.push(`\nWHAT'S AT STAKE: ${stakes}`);
  if (assumptions) lines.push(`\nWHAT HAS TO GO RIGHT (assumptions the visitor supplied): ${assumptions}`);
  return lines.join('\n');
}

// ── Half A: the fictional memo + the warning signs it would have shown.
// Invented narrative detail lives here and nowhere else. ──
function buildMemoPrompt(brief) {
  return `${CORE_RULES}

WHAT THE VISITOR SUPPLIED:
${brief}

YOUR HALF: the post-mortem memo itself — the story of how it failed — and the observable warning signs that would have shown the imagined failure path developing. Another analyst is writing the actionable half (assumption to test, failure modes, prevention) from this same plan, without seeing your invented narrative — return only your own keys.

Return ONLY valid JSON matching this exact shape:
{
  "the_postmortem": { "memo_header": "", "executive_summary": "", "narrative": "" },
  "warning_signs": [
    { "stage": "EARLY|MIDDLE|LATER", "watch_for": "", "why_it_matters": "" }
  ]
}

LIMITS: warning_signs 2-4 items. Keep memo_header to one short dry line; executive_summary 2-3 sentences; narrative 1-3 short paragraphs; watch_for/why_it_matters one or two concise sentences each. ALL keys in the schema MUST be present.

${NO_QUOTE_RULE}`;
}

// ── Half B: the actionable half. Sees the plan, never the invented narrative. ──
function buildPreventionPrompt(brief) {
  return `${CORE_RULES}

WHAT THE VISITOR SUPPLIED:
${brief}

YOUR HALF: the assumption worth testing first, when to reconsider, the failure modes to watch, the primary failure path and its one prevention, the assumptions autopsy, and the first move — using only the plan and facts the visitor actually supplied. You do NOT see the fictional narrative another analyst is writing from this same plan — never reference invented competitors, venues, dates, or events; ground everything here in the plan itself.

Return ONLY valid JSON matching this exact shape:
{
  "assumption_to_test_first": { "dependency": "", "why_it_matters": "", "what_is_known": "" },
  "when_to_reconsider": { "condition": "", "response": "" },
  "failure_modes": [
    { "mode": "", "priority": "PRIMARY WATCH|IMPORTANT WATCH|SECONDARY WATCH", "why_this_could_happen": "", "watch_for": "", "reduce_the_risk": "" }
  ],
  "primary_failure_path": { "failure_mode": "", "one_prevention": "" },
  "assumptions_autopsy": [
    { "dependency": "", "what_we_know": "", "how_to_test": "", "if_wrong": "" }
  ],
  "first_move": { "action": "", "why_this_first": "" }
}

LIMITS: failure_modes 3-5 items (never forced to a probability mix — only as many DISTINCT modes as the plan actually supports). assumptions_autopsy 3-5 items. primary_failure_path.failure_mode MUST name one of the modes listed in failure_modes, identically. Keep every field to one or two concise sentences. ALL keys in the schema MUST be present.

${NO_QUOTE_RULE}`;
}

// ── Route ─────────────────────────────────────────────────────────────────────

router.post('/pre-mortem', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const { plan, planType, stakes, assumptions, userLanguage } = req.body;

  if (!plan || !plan.trim()) {
    return res.status(400).json({ error: 'plan is required.' });
  }
  if (plan.trim().length > 2000) {
    return res.status(400).json({ error: 'plan must be 2000 characters or fewer.' });
  }

  try {
    // One combined schema at max_tokens 4500 measured ~100s — the slowest
    // route in the catalog, far past the ~60s where Safari abandons the
    // fetch. The seam is the document's own: the fictional memo (+ its
    // warning signs) in one call, the actionable half in the other.
    // Disjoint top-level keys, merged back to the original response shape.
    //
    // This also enforces the real-world boundary structurally rather than
    // by instruction alone: the prevention half never sees the invented
    // fictional narrative, so it cannot leak an invented competitor or date
    // into a step the visitor is meant to act on.
    const brief = buildBrief(
      plan.trim(),
      planType?.trim() || null,
      stakes?.trim()   || null,
      assumptions?.trim() || null,
    );
    const systemSuffix = withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    const [memoHalf, preventionHalf] = await Promise.all([
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 2500,
        system: withLanguage(buildMemoPrompt(brief), userLanguage) + systemSuffix,
        messages: [{ role: 'user', content: 'Write the post-mortem memo and its warning signs.' }],
      }, { label: 'pre-mortem-memo' }),
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 3000,
        system: withLanguage(buildPreventionPrompt(brief), userLanguage) + systemSuffix,
        messages: [{ role: 'user', content: 'Build the actionable half — assumption, failure modes, prevention, first move.' }],
      }, { label: 'pre-mortem-prevention' }),
    ]);
    const parsed = { ...memoHalf, ...preventionHalf };

    if (!parsed.failure_modes || !Array.isArray(parsed.failure_modes)) {
      return res.status(500).json({ error: 'Could not generate pre-mortem. Please try again.' });
    }

    // v2 guard (PF-39a). Fail-open: it wraps a working answer.
    try {
      const fields = [];
      if (parsed.the_postmortem) {
        fields.push(['the_postmortem.executive_summary', parsed.the_postmortem.executive_summary]);
        fields.push(['the_postmortem.narrative', parsed.the_postmortem.narrative]);
      }
      (parsed.warning_signs || []).forEach((w, i) => {
        fields.push([`warning_signs[${i}].watch_for`, w.watch_for]);
        fields.push([`warning_signs[${i}].why_it_matters`, w.why_it_matters]);
      });
      if (parsed.assumption_to_test_first) fields.push(['assumption_to_test_first.what_is_known', parsed.assumption_to_test_first.what_is_known]);
      if (parsed.when_to_reconsider) fields.push(['when_to_reconsider.condition', parsed.when_to_reconsider.condition]);
      (parsed.failure_modes || []).forEach((f, i) => {
        fields.push([`failure_modes[${i}].why_this_could_happen`, f.why_this_could_happen]);
        fields.push([`failure_modes[${i}].reduce_the_risk`, f.reduce_the_risk]);
      });
      (parsed.assumptions_autopsy || []).forEach((a, i) => {
        fields.push([`assumptions_autopsy[${i}].what_we_know`, a.what_we_know]);
        fields.push([`assumptions_autopsy[${i}].if_wrong`, a.if_wrong]);
      });
      if (parsed.first_move) fields.push(['first_move.why_this_first', parsed.first_move.why_this_first]);

      await runOutputGuard(parsed, {
        label: 'pre-mortem',
        fields,
        supplied: brief,
        promise: 'Write a fictional post-mortem as if the plan already failed, then use it to surface plausible failure modes, observable warning signs, an assumption worth testing first, and one concrete first move — using the imagined failure as a thinking device, never as fabricated evidence with invented precise numbers, dates, or named entities.',
        guard: router.outputGuard,
        userLanguage,
      });
    } catch (guardErr) {
      console.log('[pre-mortem] v2 guard skipped:', guardErr.message);
    }

    return res.json(parsed);
  } catch (err) {
    console.error('pre-mortem error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
