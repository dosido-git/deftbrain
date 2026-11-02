const express = require('express');
const router = express.Router();
const { answer, onlyKeys, planFirst, planNote } = require('../lib/progressive');
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — quoted phrases or example wording must be written plainly or with single quotes, or it breaks the JSON.';

// ════════════════════════════════════════════════════════════
// POST /pet-weirdness-decoder — Pet Behavior Decoder (display name;
// id/route/i18n prefix kept as "PetWeirdnessDecoder"/"pwd_" per the
// established rename-during-rewrite precedent — see Before the Crash —
// so this avoids the full TOOL_IDS/LEGACY_REDIRECTS/cross-ref rename
// checklist for a rewrite that doesn't touch the URL).
//
// V2 REWRITE, 2026-09-05. The old prompt asked the model to diagnose:
// likelihood-scored "differentials," breed "genetic predispositions,"
// arbitrary age-bucket rules ("senior pets = vet_soon minimum"), invented
// prevalence ("how common is this"), fabricated community anecdotes, and
// behavior-modification programs with specific invented timelines ("expect
// improvement in 1-3 weeks"). None of that is something a text description
// (plus maybe a photo) can actually support. This rewrite keeps the tool
// to what it can back up: plausible explanations FROM the reported facts,
// what would make each one more or less likely, what to watch for, and
// what would change the next step — never a diagnosis, never a probability.
// ════════════════════════════════════════════════════════════

router.outputStandard = 'lean';
router.outputGuard = {
  prohibit: [
    'invented_symptom_or_physical_sign_not_reported',
    'invented_trigger_or_environmental_change',
    'invented_internal_state_pain_anxiety_boredom_stress_prey_drive_territorial_attention_seeking_or_cognitive_decline',
    'invented_medical_condition_presented_as_a_diagnosis',
    'invented_medication_dose_schedule_interaction_or_side_effect',
    'invented_diet_disease_or_allergy_association',
    'invented_toxin_or_parasite_exposure',
    'invented_owner_response_or_reinforcement_history',
    'absence_of_a_reported_detail_treated_as_absence_of_the_thing_itself',
    'likelihood_percentage_or_high_medium_low_label_on_a_possibility',
    'arbitrary_age_or_life_stage_rule_used_as_a_diagnostic_trigger',
    'invented_prevalence_or_how_common_claim',
    'fabricated_community_anecdote_or_other_owners_report',
    'invented_behavior_modification_timeline_or_improvement_estimate',
    'breed_stereotype_or_predisposition_list_presented_as_established',
    'definitive_diagnostic_label_for_the_behavior_itself',
    'certainty_framed_reassurance_completely_normal_nothing_to_worry_about',
    'unsupported_claim_from_an_image_pain_anxiety_disease_or_injury_not_visibly_evident',
    'arbitrary_test_period_or_observation_window_not_materially_justified',
    'home_observation_experiment_presented_as_proof_of_cause',
    'breed_used_as_personality_or_motivation_in_body_text',
    'unselected_checkbox_or_field_expanded_into_a_specific_claim',
    'contradictory_input_fields_silently_merged_instead_of_surfaced',
    'new_unreported_problem_invented_to_justify_generic_advice',
    'invented_reassuring_negative_finding_not_reported',
    'causal_chain_asserted_from_an_association_without_evidence',
    'embellished_scene_detail_not_reported_by_owner',
    'vet_contact_recommendation_hedged_or_hidden_behind_soft_language',
    'visitor_descriptive_word_converted_into_a_clinical_label',
    'medical_concern_implied_ruled_out_beyond_absence_of_an_emergency_sign',
    'supplied_fact_used_as_decorative_color_not_materially_relevant_to_this_behavior',
    'hypothesis_upgraded_into_a_specific_invented_event',
    'absence_of_an_episode_treated_as_evidence_of_an_intermittent_cause',
    'hypothetical_reassuring_condition_stated_as_already_true',
    'vocalization_or_behavior_tone_used_to_rule_out_a_medical_cause',
    'low_risk_experiment_outcome_upgraded_into_a_confirmed_mechanism',
    'third_explanation_forced_merely_to_fill_the_section',
  ],
  require: [
    'action_level_is_one_of_the_four_defined_categories_not_a_diagnosis',
    'action_level_matches_the_actual_recommendation_given_in_the_answer',
    'each_possibility_states_what_would_make_it_more_or_less_plausible',
    'next_steps_are_observable_decision_points_not_a_fixed_countdown',
    'contradictions_between_reported_fields_are_surfaced_not_silently_resolved',
    'concern_rating_treated_as_owner_impression_not_clinical_severity',
  ],
};

// LEAN (2026-11-01, audit/LEAN-PROMPT-STANDARD.md): a 45-section rulebook
// condensed to what a good read is; the guard's 37 terms still check each
// listed defect after the answer shows.
const CORE_PROMPT = `PET BEHAVIOR DECODER
Help an owner make sense of something odd their pet is doing: how concerned to be, what could explain it, what to watch, what they can safely do now, and when to call the vet.

- Work only from what they reported. Don't add symptoms, triggers, exposures, scene details, medical history, or how they responded. A detail they didn't mention is unknown, not absent; the absence of a sign is information, never a rule-out.
- Possibilities, not diagnoses: no diagnostic label for the behavior, no named condition as the answer, no likelihood percentages or high/medium/low labels, no "how common", no age or breed rules. Breed never explains personality or motive.
- Don't state the animal's inner state (pain, anxiety, boredom) as fact; say what it could fit and what would make it more or less likely. An association is not a cause.
- Medications, doses, toxins and diet links: only what they reported; say what to ask the vet, never invent doses or effects. From a photo, describe only what is clearly visible.
- Conflicting details are unknowns to raise, not to average. Don't ask for precision an owner can't give.
- No timelines, test periods or promised results for behavior changes; home steps are safe and low-risk.
- The action level, bottom line and advice tell one story. When a vet call is warranted, say it plainly. Never "completely normal" or "nothing to worry about".
- Up to three possibilities; never add one just to fill the list. Keep the owner's own words, and don't repeat the same fact in every section.

action_level stays exactly in English: likely_low_concern | watch_closely | vet_contact_recommended | emergency.`;

function otherChangesText(otherChanges) {
  if (!Array.isArray(otherChanges) || !otherChanges.length) return 'None reported';
  return otherChanges.map((c) => (c.detail ? `${c.category}: ${c.detail}` : `${c.category} (no detail given)`)).join('; ');
}

router.post('/pet-weirdness-decoder', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      petType, breed, age, behavior, duration, frequency, otherChanges,
      whenItHappens, imageBase64, currentMeds, recentDietChanges, recentHealthChanges,
      priorObservations, userLanguage,
    } = req.body;

    if (!petType) return res.status(400).json({ error: 'Pet type is required' });
    if (!age || age < 0) return res.status(400).json({ error: 'Valid age is required' });
    if (!behavior || behavior.trim().length < 20) return res.status(400).json({ error: 'Describe the behavior in detail (20+ characters)' });

    const supplied = `PET: ${petType} · ${breed || 'breed not specified'} · ${age}y
BEHAVIOR REPORTED: ${behavior.trim()}
DURATION: ${duration || 'not specified'} · FREQUENCY: ${frequency || 'not specified'}
WHAT HAPPENS BEFORE/DURING/AFTER: ${whenItHappens?.trim() || 'not reported'}
OTHER CHANGES REPORTED: ${otherChangesText(otherChanges)}
CURRENT MEDICATIONS: ${currentMeds?.trim() || 'none reported'}
RECENT DIET CHANGES: ${recentDietChanges?.trim() || 'none reported'}
RECENT HEALTH CHANGES OR VET VISITS: ${recentHealthChanges?.trim() || 'none reported'}
PRIOR SAVED OBSERVATIONS OF THIS BEHAVIOR: ${JSON.stringify((priorObservations || []).slice(0, 8))}
${imageBase64 ? 'A photo/video was attached — describe only clearly visible features, per the PHOTO/VIDEO rule.' : ''}`;

    const prompt = `${supplied}

Return ONLY valid JSON:
{
  "assessment": {
    "action_level": "likely_low_concern|watch_closely|vet_contact_recommended|emergency",
    "headline": "A few words naming the observed behavior in ordinary language — never a diagnostic label.",
    "bottom_line": "1-2 sentences answering: how concerned should the owner be, based only on what was reported."
  },
  "what_you_reported": ["The facts that materially affect the assessment, restated plainly. 3-6 items."],
  "what_could_explain_it": [
    { "possibility": "", "why_it_could_fit": "", "what_would_make_it_more_or_less_plausible": ["1-3 concrete things to look for"] }
  ],
  "what_to_watch": ["Specific observable changes worth noticing. 2-5 items."],
  "what_would_change_the_next_step": ["Observable conditions that would make veterinary contact more appropriate. 1-4 items."],
  "what_you_can_do_now": ["Only safe, low-risk, situation-specific steps — never a treatment or a promised-result behavior program. 1-4 items."],
  "vet_prep": {
    "show_only_when_useful": true or false — true only when action_level is vet_contact_recommended or emergency, or the owner would genuinely benefit from prep,
    "what_to_record": ["1-4 items, empty array if not useful"],
    "questions_or_details_to_bring": ["1-4 items, empty array if not useful"]
  }
}

LIMITS: what_could_explain_it AT MOST 3 possibilities, each with AT MOST 3 plausibility signals. Every other array AT MOST 6 items. Keep every field to one or two concise sentences.`;

    const systemPrompt = withLanguage(CORE_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const imageBlocks = [];
    if (imageBase64) {
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      const mediaType = imageBase64.includes('image/png') ? 'image/png' : 'image/jpeg';
      imageBlocks.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } });
    }

    // Progressive (2026-10-16, lib/progressive.js), plan first (T11): how
    // concerned to be (the action level) and what was reported show first —
    // an emergency is on screen in seconds; the possible explanations, and
    // what to watch and do, then run at once, handed that assessment. The
    // guard runs after the answer is on screen.
    const call = (text, maxTokens, tag) => callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: [...imageBlocks, { type: 'text', text }] }],
    }, { label: tag });
    const PLAN = ['assessment', 'what_you_reported'];
    return await answer(req, res, {
      label: 'pet-weirdness-decoder',
      parts: planFirst(PLAN, () => call(onlyKeys(prompt, PLAN), 1000, 'pet-weirdness-decode'), [
        ['what_could_explain_it'],
        ['what_to_watch', 'what_would_change_the_next_step', 'what_you_can_do_now', 'vet_prep'],
      ], (keys, i, plan) => call(onlyKeys(prompt, keys) + planNote(plan, PLAN), 1600, `pet-weirdness-decode-${i + 2}`)),
      finish: d => structuredClone(d),
      ready: d => Boolean(d.assessment?.action_level && d.what_you_reported),
      complete: d => Boolean(d.assessment?.action_level && d.what_you_reported),
      check: async (parsed) => {
        // v2 guard (PF-39a). Fail-open: it wraps a working answer.
        try {
          const fields = [
            ['assessment.headline', parsed.assessment?.headline],
            ['assessment.bottom_line', parsed.assessment?.bottom_line],
          ];
          (parsed.what_you_reported || []).forEach((v, i) => fields.push([`what_you_reported[${i}]`, v]));
          (parsed.what_could_explain_it || []).forEach((item, i) => {
            fields.push([`what_could_explain_it[${i}].possibility`, item.possibility]);
            fields.push([`what_could_explain_it[${i}].why_it_could_fit`, item.why_it_could_fit]);
            (item.what_would_make_it_more_or_less_plausible || []).forEach((v, j) => fields.push([`what_could_explain_it[${i}].what_would_make_it_more_or_less_plausible[${j}]`, v]));
          });
          (parsed.what_to_watch || []).forEach((v, i) => fields.push([`what_to_watch[${i}]`, v]));
          (parsed.what_would_change_the_next_step || []).forEach((v, i) => fields.push([`what_would_change_the_next_step[${i}]`, v]));
          (parsed.what_you_can_do_now || []).forEach((v, i) => fields.push([`what_you_can_do_now[${i}]`, v]));

          await runOutputGuard(parsed, {
            label: 'pet-weirdness-decoder',
            fields,
            supplied,
            promise: `Help an owner reason about an observed pet behavior — plausible explanations grounded only in what was reported, what would make each more or less likely, what to watch for, and what would change the next step. Never a diagnosis, never a probability, never an invented symptom, trigger, internal state, medical condition, medication/diet effect, toxin exposure, breed predisposition, prevalence claim, or improvement timeline that the owner didn't establish. "Not mentioned" must never be written as "not present" or "no [X]" — only "no [X] was reported."`,
            guard: router.outputGuard,
            userLanguage,
          });
        } catch (guardErr) {
          console.log('[pet-weirdness-decoder] v2 guard skipped:', guardErr.message);
        }
      },
    });
  } catch (error) {
    console.error('❌ Pet Behavior Decoder error:', error.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ── Follow-up Q&A endpoint ──
router.post('/pet-weirdness-decoder/followup', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { question, originalAnalysis, petType, breed, age, behavior, imageBase64, userLanguage } = req.body;

    if (!question || !question.trim()) return res.status(400).json({ error: 'Please provide a question.' });
    if (!originalAnalysis) return res.status(400).json({ error: 'No analysis context. Run an analysis first.' });

    const ctx = [
      `Pet: ${petType || 'Unknown'} · ${breed || 'Mixed'} · ${age || '?'}y`,
      `Original behavior: ${behavior || 'Not specified'}`,
    ];
    if (originalAnalysis.assessment) {
      ctx.push(`Action level: ${originalAnalysis.assessment.action_level}`);
      ctx.push(`Headline: ${originalAnalysis.assessment.headline}`);
    }
    if (originalAnalysis.what_would_change_the_next_step?.length) {
      ctx.push(`What would change the next step: ${originalAnalysis.what_would_change_the_next_step.join('; ')}`);
    }

    const systemPrompt = withLanguage(
      `You are helping a pet owner who already received an analysis and has a follow-up question. Apply the SAME epistemic and triage rules as the original analysis — never invent a symptom, trigger, internal state, medical condition, medication/diet effect, breed predisposition, prevalence claim, or improvement timeline. Never diagnose. Never assign a likelihood label.

ORIGINAL CONTEXT:
${ctx.join('\n')}

Answer the follow-up based on that context. Be specific, practical, warm.
- A new detail (symptom, change) does not automatically mean the same thing as the original behavior — do not invent a causal link between them.
- A photo shared with the question may be described for clearly visible features only, never diagnosed from.
- Keep to 2-3 short paragraphs (about 150 words max).
- If the new detail could reasonably raise the action level, say so plainly and explain why from what was just described — never soften an emergency sign to stay reassuring.
- If the question concerns medication or food, preserve exactly what's stated; never invent dose, interaction, or side effect.
- Never label the behavior compulsive, obsessive, anxious, attention-seeking, stress-driven, or territorial merely because it recurs. Never use breed as a stand-in for personality or motive.
- If the question proposes a home test ("what if I stop X for a few days?"), don't imply the result would prove a cause — only that it would be useful information — and don't invent an arbitrary time period for it.
- If the question mixes details that don't agree with the original context (e.g. a frequency or timing that conflicts with what was originally reported), say so plainly rather than quietly picking one.
- If a concern/severity rating comes up, treat it only as the owner's own impression, never as a clinical measure.
- Never infer the pet's sex or pronoun from its species, breed, or name — use only what was actually supplied.

Return ONLY valid JSON: { "answer": "your 2-3 short paragraph answer" }

${NO_QUOTE_RULE}`,
      userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const content = [];
    if (imageBase64) {
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      const mediaType = imageBase64.includes('image/png') ? 'image/png' : 'image/jpeg';
      content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } });
    }
    content.push({ type: 'text', text: question.trim() });

    // callClaudeWithRetry only ever JSON.parses its response — there's no
    // free-text mode — so the answer is requested as {"answer": "..."} JSON
    // rather than raw prose. This also fixes the anti-pattern this endpoint
    // had before: a route calling anthropic.messages.create directly with a
    // hand-rolled 3-try loop loses the shared retry/output-standard wiring
    // every callClaudeWithRetry caller gets for free.
    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
    }, { label: 'pet-weirdness-decoder-followup' });

    if (!parsed?.answer) return res.status(500).json({ error: 'Could not answer that. Please try again.' });
    res.json({ answer: parsed.answer.trim() });
  } catch (error) {
    console.error('❌ Follow-up error:', error.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
