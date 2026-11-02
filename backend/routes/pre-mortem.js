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
const { answer, onlyKeys, planFirst, planNote } = require('../lib/progressive');

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

router.outputStandard = 'lean';
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
    'invented_fictional_memo_event_reused_elsewhere_in_the_output_as_though_it_actually_happened',
    'specific_persons_future_behavior_or_internal_state_predicted_including_withdrawing_disengaging_or_becoming_resentful',
    'inferred_hidden_management_or_organizational_motive_the_visitor_did_not_supply',
    'unverified_organizational_effect_asserted_as_fact_rather_than_conditional_possibility',
    'invented_exact_timeline_week_or_day_count_waiting_period_or_observation_window_not_supplied_or_required',
    'more_than_one_failure_mode_assigned_primary_watch',
    'mitigation_prescribed_as_mandatory_command_from_a_still_hypothetical_condition',
    'multiple_speculative_claims_stacked_into_one_confident_chain_of_inference',
    'inferred_internal_state_such_as_morale_trust_or_resentment_presented_as_an_observable_warning_sign',
    'two_or_more_failure_modes_describing_the_same_underlying_mechanism_in_different_wording',
    'single_dependency_called_the_load_bearing_wall_or_the_one_thing_implying_testing_it_alone_validates_the_plan',
  ],
  require: [
    'every_actionable_recommendation_is_grounded_in_the_supplied_plan_rather_than_the_invented_narrative',
    'each_warning_sign_describes_something_the_visitor_could_actually_observe',
  ],
};

// LEAN (2026-11-01, audit/LEAN-PROMPT-STANDARD.md): ~2,900 words of rules
// condensed to what a good pre-mortem is; the guard below still checks each.
const CORE_RULES = `PRE-MORTEM
Help someone stress-test a plan before they commit: imagine it has failed, look back at how, and turn that into what to watch, what to test first, and how to reduce the risk.

THE FICTIONAL MEMO
- Written looking back, as a thought experiment: one coherent, plausible failure story told as a chain (assumption, pressure, warning sign, decision, failure). Invent only enough detail to show the mechanism. No exact metrics, dates, named competitors, customers or vendors, and no feelings or motives for real people.
- Everything the memo invents stays in the memo. Every other section reasons from the plan as supplied, never from the story's events.

EVERYTHING ELSE
- Warning signs are things they could actually observe, never inner states like morale, trust or resentment.
- Failure modes are distinct mechanisms, exactly one PRIMARY WATCH; priority means attention, not a probability. Never a point where failure becomes inevitable.
- Don't predict how a specific person will act or feel, not even with "could" (disengaging, withdrawing, resisting, resenting); name the structural risk instead (unclear ownership, a decision nobody owns). Don't invent hidden management motives; organizational effects are conditional.
- No invented thresholds, timelines, benchmarks or market facts. Use their own numbers where they gave them.
- Mitigations are options, not commands. No single test validates the whole plan; the first move is small and tells them something.
- Assumptions are labelled as theirs only when they stated them; otherwise they're dependencies the plan relies on.
- Personal plans: no burnout, resentment or relationship damage as future fact.`;

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

LIMITS: failure_modes 3-5 items (never forced to a probability mix — only as many DISTINCT modes as the plan actually supports; merge any two that share a mechanism). EXACTLY ONE failure mode has priority "PRIMARY WATCH" — never zero, never more than one. assumptions_autopsy 3-5 items. primary_failure_path.failure_mode MUST name one of the modes listed in failure_modes, identically, and SHOULD be the one marked PRIMARY WATCH. Keep every field to one or two concise sentences. ALL keys in the schema MUST be present.

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
    // Progressive (2026-10-16, lib/progressive.js): the prevention half is
    // split three ways beside the memo — the failure modes (with the primary
    // path that must name one of them) show first. The guard runs after the
    // answer is on screen. The prevention passes still never see the memo.
    const call = (system, maxTokens, content, label) => callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: maxTokens,
      system: withLanguage(system, userLanguage) + systemSuffix,
      messages: [{ role: 'user', content }],
    }, { label });
    const prevention = buildPreventionPrompt(brief);
    const FULL_MODE = '{ "mode": "", "priority": "PRIMARY WATCH|IMPORTANT WATCH|SECONDARY WATCH", "why_this_could_happen": "", "watch_for": "", "reduce_the_risk": "" }';
    const PLAN_MODE = '{ "mode": "", "priority": "PRIMARY WATCH|IMPORTANT WATCH|SECONDARY WATCH" }';
    // The planned modes, with the detail pass's fields filled in by position;
    // the plan keeps the last word on each mode's name and priority.
    const withDetail = (d) => {
      const { modeDetail, ...rest } = d;
      if (Array.isArray(rest.failure_modes) && Array.isArray(modeDetail)) {
        rest.failure_modes = rest.failure_modes.map((m, i) => (modeDetail[i] ? { ...modeDetail[i], mode: m.mode, priority: m.priority } : m));
      }
      return rest;
    };
    const onePrimary = (parsed) => {
      if (!Array.isArray(parsed.failure_modes)) return parsed;
      // Safety net: exactly one PRIMARY WATCH, no matter what the model returned.
      // Zero (everything IMPORTANT/SECONDARY) leaves no clear "address this first"
      // signal; more than one defeats the point of a single priority. Deterministic
      // fallback keeps the first PRIMARY WATCH found and demotes the rest; if none
      // was marked, promotes primary_failure_path's named mode, or failing that
      // the first mode in the list.
      {
        const primaryIdx = [];
        parsed.failure_modes.forEach((f, i) => { if (f.priority === 'PRIMARY WATCH') primaryIdx.push(i); });
        if (primaryIdx.length > 1) {
          primaryIdx.slice(1).forEach(i => { parsed.failure_modes[i].priority = 'IMPORTANT WATCH'; });
        } else if (primaryIdx.length === 0 && parsed.failure_modes.length > 0) {
          const namedIdx = parsed.failure_modes.findIndex(f => f.mode === parsed.primary_failure_path?.failure_mode);
          parsed.failure_modes[namedIdx >= 0 ? namedIdx : 0].priority = 'PRIMARY WATCH';
        }
      }
      return parsed;
    };
    // Owner decision 2026-10-09: the imagined failure story is not shown — a
    // made-up story reads like evidence. It is still written (the warning
    // signs are derived from it) but never leaves the server.
    const shown = (d) => { const parsed = onePrimary(withDetail(structuredClone(d))); delete parsed.the_postmortem; return parsed; };
    return await answer(req, res, {
      label: 'pre-mortem',
      parts: [
        // T11 (audit/DEFECT-TYPES.md), plan first: one small pass names the
        // failure modes together (distinct, with one PRIMARY WATCH) and the
        // primary path, and shows them; three passes then write the details,
        // handed that list — so the modes stay distinct and the assumptions
        // and first move speak to the same risks.
        ...planFirst(['failure_modes', 'primary_failure_path'],
          () => call(onlyKeys(prevention.replace(FULL_MODE, PLAN_MODE), ['failure_modes', 'primary_failure_path']) + '\nTHIS PASS names the failure modes only: each item has ONLY mode and priority. Other passes write the details for each mode afterwards.', 900, 'Name the failure modes.', 'pre-mortem-prevention1'),
          [['failure_modes'], ['assumption_to_test_first', 'when_to_reconsider', 'first_move'], ['assumptions_autopsy']],
          (keys, i, plan) => call(onlyKeys(prevention, keys) + planNote(plan, ['failure_modes', 'primary_failure_path'])
            + (keys[0] === 'failure_modes' ? '\nTHIS PASS writes failure_modes in full for EXACTLY the modes above — same mode names, same priorities, same order.' : ''),
          2000, 'Build your part of the actionable half.', `pre-mortem-prevention${i + 2}`)
        ).map((p, i) => (i === 1 ? { ...p, apply: (d, out) => { d.modeDetail = Array.isArray(out?.failure_modes) ? out.failure_modes : []; } } : p)),
        { run: () => call(buildMemoPrompt(brief), 2500, 'Write the post-mortem memo and its warning signs.', 'pre-mortem-memo'), apply: (d, out) => { ['the_postmortem', 'warning_signs'].forEach(k => { if (out?.[k] !== undefined) d[k] = out[k]; }); } },
      ],
      finish: shown,
      ready: d => Array.isArray(d.failure_modes),
      complete: d => Array.isArray(d.failure_modes),
      check: async (draft) => {
        const parsed = onePrimary(withDetail(draft));
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
        // Back into the draft: the details are merged now, repairs included.
        Object.keys(draft).forEach(k => delete draft[k]);
        Object.assign(draft, parsed);
      },
    });
  } catch (err) {
    console.error('pre-mortem error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
