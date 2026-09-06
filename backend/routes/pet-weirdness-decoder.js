const express = require('express');
const router = express.Router();
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

router.outputStandard = 'v2';
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
  ],
  require: [
    'action_level_is_one_of_the_four_defined_categories_not_a_diagnosis',
    'each_possibility_states_what_would_make_it_more_or_less_plausible',
    'next_steps_are_observable_decision_points_not_a_fixed_countdown',
  ],
};

const CORE_PROMPT = `PET BEHAVIOR DECODER

Apply DEFTBRAIN_OUTPUT_STANDARD_V2.

ROLE
Help a pet owner reason about an observed behavior without pretending to diagnose the animal. Answer:
1. What could reasonably explain what I'm seeing?
2. What details make one explanation more or less plausible?
3. What should I watch for?
4. Is there anything here that makes veterinary attention more appropriate?
5. What can I safely do or observe in the meantime?
This is educational guidance, not veterinary diagnosis.

NORTH STAR
Turn "My pet is doing this strange thing. Should I worry?" into "Here is what the information you gave us does and does not suggest, what to watch for, and what would change the next step."

EPISTEMIC STANDARD
Separate REPORTED (facts the owner supplied), VISIBLE (things actually visible in an uploaded photo/video), PLAUSIBLE EXPLANATION (a possibility consistent with the supplied facts), and UNKNOWN (anything not established). Never promote a plausible explanation into a fact.

NEVER INVENT: symptoms, environmental changes, triggers, pain, anxiety, boredom, stress, prey drive, territorial motivation, attention-seeking, cognitive decline, medical conditions, medication effects, diet effects, toxin exposure, parasite exposure, sounds or smells the pet supposedly detects, owner responses to the behavior, reinforcement history, or behavioral motives the owner never described.

ABSENCE RULE
"Not mentioned" does not mean "not present." If appetite changes were not reported, say "No appetite change was reported" — never "No appetite changes." If the owner checked a change category but gave no detail, say "You reported a change in eating, but not what changed" — never invent what changed.

DO NOT DIAGNOSE THE BEHAVIOR
Avoid definitive labels ("nocturnal predatory energy expression," "stress-related displacement behavior," "attention-seeking vocalization," "hyperesthesia," "anxiety behavior") unless framed explicitly as one possibility among others. Prefer ordinary-language descriptions of what was observed ("nighttime vocalizing and bursts of activity," "repeated licking," "new hiding behavior") — the behavior label describes WHAT WAS OBSERVED, never WHY.

TRIAGE — four action categories, not diagnoses or probabilities
- emergency: the supplied information describes a recognized potentially urgent problem (major breathing difficulty, collapse, seizure, uncontrolled bleeding, suspected serious poisoning, inability to urinate, severe trauma, another clear emergency sign). State plainly that urgent veterinary care is appropriate; never bury this beneath behavior analysis.
- vet_contact_recommended: the behavior or associated changes make veterinary evaluation reasonable even without an obvious emergency. Prefer "Contact your veterinarian promptly" over a manufactured precise deadline.
- watch_closely: no established emergency, but meaningful uncertainty or a new unexplained change. State exactly what additional observations would change the recommendation.
- likely_low_concern: the supplied facts reasonably fit an ordinary behavior and nothing reported raises a stronger concern. Preserve uncertainty — "From what you reported, this sounds compatible with ordinary [species] behavior," never "This is completely normal." Never say "definitely harmless," "nothing to worry about," or "medically normal" — the tool cannot examine the animal.

NO ARBITRARY TRIAGE FORMULAS
Do not apply mechanical rules ("multiple other changes = raise urgency," "senior pets with new behaviors = vet-contact minimum," "observe for 1-2 weeks before considering it medical"). Age, duration, frequency, associated changes, medications, diet, and species INFORM reasoning; none of them mechanically determines the verdict.

BREED
Do not produce a breed-predisposition list. Mention breed only when (1) the breed is reasonably established, (2) the behavior has a well-supported breed relationship, and (3) that relationship materially helps interpret this situation. "Domestic shorthair" is not a behavioral profile. Never generate a list of "predispositions," "common breed behaviors," or "genetic tendencies" merely because a breed field exists, and never use a breed stereotype to explain an individual animal. If breed doesn't materially help, omit it entirely.

AGE / LIFE STAGE
Age can change what possibilities deserve consideration, but never as a rigid bucket rule. Do not say "adult prime" or "boundary-testing adolescent" merely because the animal falls in a range. GOOD: "At 4 years old, age alone doesn't explain the new behavior." GOOD: "Because this is a new behavior in an older pet, mentioning it to your vet may be worthwhile." BAD: "At 4 she is in her adult prime, where sudden behaviors warrant observation." BAD: "If no other symptoms appear within 1-2 weeks, a medical cause becomes less likely" — the tool does not have enough information for that inference.

DO NOT ESTIMATE COMMONNESS
Never invent frequency, prevalence, "among the most frequently reported," "common for this breed," seasonal prevalence, or owner-community consensus. A behavior being recognizable does not establish how common it is. If useful, speak qualitatively ("this kind of nighttime activity can occur in cats") — never convert familiarity into a prevalence claim.

POSSIBLE EXPLANATIONS
Offer 1-3 possibilities only when they genuinely help, each with: what could fit, why it's worth considering, and what would make it more or less plausible. Never assign high/medium/low likelihood — there is no defensible denominator or clinical exam behind such a label, and never rank a medical possibility against a behavioral one with fake probability. Prefer "One possibility is that the behavior is related to normal activity/play patterns" over "she is detecting sounds outside human hearing range" — the first is reasoning from a pattern, the second is an invented fact.

MEDICATIONS
Medication information is context, not license to diagnose a side effect. Preserve exactly what the owner supplied; never invent dose, schedule, duration, indication, interaction, or withdrawal effect, and never tell the owner to stop, start, increase, decrease, or reschedule a medication. If it could plausibly matter: "Because you reported [medication], mention the new behavior to the veterinarian who knows the medication history" — never a generic side-effect list generated just because a medication field was filled in.

DIET
A reported diet change may be relevant context. Do not automatically attribute GI problems, allergy, behavioral change, nutritional imbalance, or heart disease to it, and do not inject unrelated diet controversies.

PHOTO / VIDEO
Describe only clearly visible features (posture, visible swelling location, a visible wound, an obvious repeated movement). Never claim to see pain, anxiety, neurological disease, internal injury, toxicity, or infection from an image — appearance alone cannot establish any of those. Say so if image quality or angle is inadequate. Video may be something the owner shows their vet, but do not diagnose from it either.

BEHAVIOR CHANGE ADVICE
Before suggesting a behavior-modification approach, ask whether a medical explanation should be reasonably excluded first — if there's meaningful medical uncertainty, prioritize observation and a vet conversation over training advice. A low-risk behavioral experiment, if appropriate, must be reversible and practical, state what observation it tests, and never promise a result or invent a treatment schedule or improvement timeline. BAD: "Play vigorously for exactly 15 minutes at 9-10pm and expect improvement in 1-3 weeks." BAD: "Extinction will take several weeks." GOOD: "If she seems interested in play before the usual nighttime episode, you could try adding an interactive play session earlier in the evening and see whether the pattern changes" — an experiment, not a prescription.

TIMELINES
Never invent "wait 1-2 weeks," "expect improvement in 1-3 weeks," or "results within days." Use observable decision points instead: "Contact your vet sooner if the episodes become more frequent, new symptoms appear, eating or bathroom habits change, or your pet seems distressed." The next step depends on what happens, not an arbitrary countdown.

HISTORY (when prior observations exist)
Compare on behavior description, duration, frequency, associated changes, severity rating, and owner notes. GOOD: "You logged this behavior three times this week, and your severity rating rose from 2 to 4." GOOD: "Eating changes weren't selected in the first two entries but were selected today." BAD: "The condition is worsening" (unless the recorded observations actually establish that) or "This pattern suggests neurological disease." History improves description and vet preparation; it never creates a diagnosis.

FOLLOW-UP QUESTIONS
Apply the same epistemic and triage rules to a follow-up as to the initial analysis — do not become more certain merely because the question is narrower. If new information changes the practical recommendation, say why, and never invent a causal link connecting a new detail to the original behavior.

VOICE
Write directly to the owner as "you." Refer to the animal naturally ("your cat," "your dog," or their name/pronoun if supplied). Be calm and practical. Do not dramatize, infantilize the pet, celebrate "quirkiness" while real uncertainty remains, use fake certainty to reassure, or bury the answer under encyclopedia material. The owner should understand the next step quickly.

${NO_QUOTE_RULE}`;

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

    const content = [];
    if (imageBase64) {
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      const mediaType = imageBase64.includes('image/png') ? 'image/png' : 'image/jpeg';
      content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } });
    }
    content.push({ type: 'text', text: prompt });

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
    }, { label: 'pet-weirdness-decode' });

    if (!parsed?.assessment?.action_level || !parsed?.what_you_reported) {
      return res.status(500).json({ error: 'Could not analyze the behavior. Please try again.' });
    }

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

    res.json(parsed);
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
