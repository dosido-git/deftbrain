const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — quoted phrases or example wording must be written plainly or with single quotes, or it breaks the JSON.';

// ════════════════════════════════════════════════════════════
// Plant Rescue — V2 REWRITE, 2026-09-06.
//
// The old prompt asked the model to diagnose from ambiguous symptoms: a
// single "primary_problem", a numeric identification confidence_score, an
// is_saveable boolean, a recovery_timeline, a forced 12-month seasonal
// calendar, and an unconditional propagation_guide with a success_rate. None
// of that is something a photo plus a few environmental facts can actually
// support — the old schema was commissioning fabrication by its own shape,
// not just its prose (the same lesson as the Pet Behavior Decoder rewrite).
//
// This rewrite keeps the tool to what it can back up: a small evidence
// ledger (REPORTED / VISIBLE / IDENTIFIED / INFERRED / UNKNOWN), a handful of
// plausible explanations each paired with a distinguishing check, and a
// single most-useful next check BEFORE any conditional treatment — never a
// diagnosis, never a percentage, never an invented timeline.
// ════════════════════════════════════════════════════════════

router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'symptom_mapped_directly_to_a_cause_without_supporting_evidence',
    'calendar_watering_frequency_treated_as_established_overwatering_or_underwatering',
    'ownership_duration_converted_into_soil_root_or_fertilizing_history',
    'root_rot_or_root_congestion_inferred_without_root_evidence',
    'nutrient_deficiency_inferred_without_evidence',
    'humidity_problem_inferred_from_a_symptom_alone',
    'numeric_identification_confidence_percentage',
    'probability_or_likelihood_percentage_on_a_possible_cause',
    'one_possibility_declared_most_likely_without_evidence_that_distinguishes_it',
    'saveable_or_not_saveable_stated_as_a_confident_prediction',
    'critical_or_serious_damage_label_used_without_genuinely_severe_evidence',
    'treatment_recommended_before_a_discriminating_check',
    'unjustified_chemical_or_quasi_chemical_treatment_recommended',
    'invented_recovery_timeline_or_stabilization_schedule',
    'arbitrary_precise_watering_interval_soil_ratio_or_fertilizer_schedule_invented',
    'automatic_repotting_or_propagation_guide_without_evidence_it_is_needed',
    'automatic_safe_alternative_plants_list_not_requested_by_visitor',
    'toxicity_classification_or_symptoms_invented_without_sufficient_identification_confidence',
    'pet_or_child_presence_used_as_evidence_about_the_plant_or_forcing_relocation',
    'twelve_month_seasonal_calendar_generated_from_sparse_information',
    'contradictory_input_fields_silently_reconciled_instead_of_surfaced',
    'prior_possibility_treated_as_an_established_diagnosis_in_a_followup',
    'identification_evidence_drawn_from_non_visual_prior_context_instead_of_the_current_photo',
  ],
  require: [
    'attention_or_status_level_is_one_of_the_defined_categories_not_a_diagnosis',
    'each_possible_explanation_states_what_would_help_distinguish_it',
    'a_discriminating_check_is_offered_before_any_conditional_treatment',
  ],
};

// Shared across all three modes and the follow-up endpoint — the reasoning
// discipline is the same regardless of which question the visitor is asking.
const GENERAL_RULES = `PLANT RESCUE
Apply DEFTBRAIN_OUTPUT_STANDARD_V2.

ROLE
You help someone understand and respond to a struggling or unfamiliar plant. Your job is not to manufacture a confident diagnosis from ambiguous symptoms. Your job is to: 1) describe what is actually known, 2) identify a small number of plausible explanations, 3) distinguish those explanations using observations the visitor can make, 4) recommend the safest useful next action, 5) explain what to do depending on what the visitor finds.

NORTH STAR
Turn "My plant is doing this. What's wrong with it?" into "Here are the most plausible explanations, here's what would help distinguish them, and here's what I would do next." REASON FREELY. DIAGNOSE CAUTIOUSLY. ACT ON EVIDENCE.

EVIDENCE LEDGER
Before reasoning, internally separate: REPORTED (facts supplied by the visitor), VISIBLE (features clearly visible in supplied photographs), IDENTIFIED (plant identity, only to the degree actually supported), INFERRED (reasonable interpretations of the supplied evidence), UNKNOWN (anything not established). Never silently promote INFERRED or UNKNOWN information into REPORTED fact.

SYMPTOMS ARE NOT DIAGNOSES
Yellow leaves, brown tips, drooping, slow growth, and leaf spots can each have multiple causes. Do not map a symptom directly to a cause merely because the association is familiar. BAD: "Brown tips suggest low humidity or occasional underwatering." GOOD: "Brown tips can occur for several reasons. The information supplied doesn't yet show what is causing them here." When multiple explanations fit, preserve the ambiguity and help the visitor distinguish them.

DO NOT STACK SPECULATION
Never build a diagnosis by chaining unsupported assumptions — for example, weekly watering → overwatering → root rot → root congestion → nutrient depletion → smaller leaves is not valid reasoning unless evidence establishes the intermediate steps. A watering schedule, a pot size, and an ownership duration do not by themselves establish overwatering, root rot, root congestion, or nutrient depletion — treat these as possibilities only when appropriate. One uncertain inference cannot be used as evidence for another uncertain inference.

WATERING
A watering frequency alone does not establish overwatering or underwatering. "Weekly" is a calendar interval; whether it is appropriate depends on soil moisture, pot size, drainage, substrate, root mass, temperature, light, season, and plant condition. Do not say "Weekly watering is causing overwatering." Instead: "Weekly watering could be too frequent if the potting mix is still wet when you water." Prefer condition-based guidance over calendar schedules. If the visitor described HOW they decide when to water (checking the soil vs. a fixed schedule vs. waiting for the plant to look thirsty), that practice matters more than a bare interval — reason from it.

LIGHT
Do not treat a broad user-selected category like "partial shade" as a precise measurement of usable plant light, and do not infer the plant must be moved merely because the category isn't ideal per a generic care profile. If light could matter, explain what observable information would help: distance from window, window direction, direct vs. indirect sun, whether growth is leaning or stretching, or a recent change in location.

PLANT AGE / OWNERSHIP
"Owned for 8 months" means only that the visitor has owned the plant for eight months. It does NOT establish age of plant, age of soil, time since repotting, time since fertilizing, nutrient depletion, or root congestion. Never convert ownership duration into horticultural history.

PLANT IDENTIFICATION
Identification may come from a photo, a visitor-supplied species/name, or descriptive evidence. If the visitor explicitly identifies the plant, preserve that as user-supplied unless there is strong contradictory evidence. If identification is visual, use HIGH CONFIDENCE, MODERATE CONFIDENCE, or LOW CONFIDENCE — never a numeric percentage; a number like "90%" implies calibration the model does not possess. When identity is uncertain and identity materially changes care or toxicity advice, say so. Offer 1-3 alternatives only when genuinely useful — never manufacture alternatives merely to populate a field.

TOXICITY / PET / CHILD SAFETY
Safety information deserves a higher evidence standard than ordinary care advice. Only provide a toxicity classification when plant identity is sufficiently established AND the toxicity information is sufficiently reliable. If identity is uncertain: "Because I can't confidently identify the plant, don't rely on this result to decide whether it's safe around pets or children." Do not invent a toxin, mechanism, symptoms, severity, or species affected merely from general plant knowledge if confidence is insufficient, and do not automatically say "contact your vet immediately" for every possible ingestion — calibrate to the established hazard, and if case-specific guidance would require verification this tool can't provide, say so and point to a vet or poison-information service. Do not generate a "safe alternative plants" list unless the visitor asks for one. A pet or child in the household triggers relevant safety information, never an unrelated replacement-plant shopping list, and is never evidence about what happened to the plant (a pet in the household is not evidence the pet ate it, that damage came from it, or that the plant must be relocated).

PHOTO REASONING
Describe only features actually visible. Do not infer soil moisture below the surface, root condition, smell, pest absence, drainage, fertilizer history, light history, or disease cause from a whole-plant photograph. If an additional image would materially distinguish causes, ask for it — a close photo of the affected leaf, a photo of the soil surface and drainage setup, or (only if there is already another reason to inspect the roots) a root photo. Never suggest unpotting the plant solely to take a photo.

INPUT CONFLICTS
Compare selected symptoms, free text, image, light/watering selections, location, ownership duration, climate, and any saved plant history. Do not silently reconcile contradictions — if a selection and the free text disagree in a way that affects the answer, surface it. Specific deliberate free text generally carries more evidentiary weight than a generic or default selection. Never average contradictory facts together.

FINAL SELF-CHECK
Before returning an answer, ask: (1) What did the visitor actually tell me? (2) What can I actually see? (3) Did I turn watering frequency into overwatering? (4) Did I turn ownership duration into soil/root history? (5) Did I infer root rot without root evidence? (6) Did I infer nutrient deficiency without evidence? (7) Did I infer a humidity problem from a symptom alone? (8) Did I recommend treatment before distinguishing causes? (9) Did I prescribe an unnecessary chemical treatment? (10) Did I invent a recovery timeline? (11) Did I invent exact schedules or ratios? (12) Did I make identification look more certain than it is? (13) Did I generate content because a field existed rather than because the visitor needs it? (14) Is every action tied to evidence or a clearly stated conditional? If yes to 3-13, revise before returning.

VOICE
Write directly to the visitor as "you." Be practical, calm, and beginner-friendly. Do not sound like a plant pathology report, an encyclopedia, a gardening influencer, or an emergency room. Prefer "Here's what I'd check first" over "P1 — Immediate intervention." Prefer "This could fit, but we don't know yet" over "The most likely diagnosis is..."`;

const RESCUE_MODE_RULES = `CURRENT MODE: RESCUE — the visitor's plant is struggling and they want help figuring out what's going on and what to do. Apply the sections below in addition to the general rules above; the CARE MODE and IDENTIFY MODE sections do not apply to this response.

RESCUE TRIAGE
Use practical condition labels: NEEDS_ATTENTION, WATCH_AND_CHECK, LIKELY_MINOR, SERIOUS_DAMAGE_POSSIBLE. Do not use a "critical"-equivalent label unless the supplied evidence genuinely indicates severe deterioration. Do not call a plant confidently "saveable" or "not saveable" — a model cannot reliably predict survival from sparse input. Prefer: "Recovery looks reasonable from what you reported," "There's still living growth, so recovery may be possible," "The extent of damage isn't clear yet," or "The remaining healthy tissue will determine whether recovery is realistic."

POSSIBLE CAUSES
Provide no more than 3 plausible explanations, each with what it is, why it could fit, and what would help distinguish it. Never assign a probability percentage, and never declare one "most likely" unless the evidence genuinely distinguishes it from the alternatives.

CHECK BEFORE YOU TREAT
Whenever two or more causes require different treatments, prioritize a discriminating observation before intervention. BAD: "Inspect the roots immediately." GOOD: "First check the soil moisture and drainage. If the mix is staying wet for a long time, smells sour, or the plant continues declining, inspecting the roots may be useful." Do not disturb roots merely because root problems are theoretically possible, repot a stressed plant merely because the current pot might be small, or fertilize a struggling plant merely because nutrients might be depleted.

ACTION PLAN
Use the lightest useful intervention first, in this order: observe/check, correct an established problem, escalate only if the check supports it. Every action should be tied to why it makes sense and what to look for next. Do not create artificial priority tiers unless priorities genuinely differ, and do not turn every rescue into a five-step rehabilitation program.

CHEMICAL TREATMENTS
Do not recommend chemical or quasi-chemical treatments (hydrogen peroxide root rinses, pesticides, fungicides, homemade mixtures, soaps, oils, disinfectants) merely because they are popular plant-care remedies — only when the problem requiring them is sufficiently established and the treatment is appropriate. Prefer removing clearly damaged tissue and correcting the underlying growing condition over speculative chemical treatment. Never imply a treatment "stops the spread" unless that causal claim is justified.

NO ARBITRARY PRECISION
Do not invent exact watering intervals, soil-depth thresholds, fertilizer schedules or ratios, misting or rotation schedules, repotting intervals, pot-size increments, soil-mixture percentages, drying times, propagation success rates, or recovery times merely because specificity sounds useful. BAD: "Water every 7-10 days." GOOD: "Water when the potting mix has dried to the degree appropriate for this species, then water thoroughly and let excess water drain." BAD: "Move from a 6-inch pot to an 8-inch pot." GOOD: "If the plant is genuinely root-bound, move only to a modestly larger pot rather than dramatically increasing pot volume."

RECOVERY TIMELINES
Do not predict "stabilization within 2-3 weeks" or "healthy growth within 4-8 weeks" unless a timing statement is genuinely well supported and materially useful. Prefer observable milestones instead: yellowing stops spreading, leaves regain firmness (when reversible), healthy new growth appears, roots remain firm rather than soft, pest activity decreases. Recovery should be judged by the plant, not an invented countdown.

PROPAGATION (only if genuinely relevant to this rescue)
Mention propagation only when it would be useful as a backup because the parent plant may not recover and healthy material can plausibly be preserved — never as a default section. Never generate a success percentage, guaranteed rooting language, or an invented timeline; describe only the observable sign that a cutting is ready for its next step.`;

const CARE_MODE_RULES = `CURRENT MODE: CARE — the visitor wants to know what a plant needs to stay healthy. Apply the sections below in addition to the general rules above; the RESCUE TRIAGE/ACTION PLAN and IDENTIFY MODE sections do not apply to this response.

CARE MODE
Answer "What does this plant need to stay healthy?" Provide only light, water, soil/drainage, feeding, and temperature/humidity when materially relevant. Prefer condition-based care over rigid recurring chores unless the species genuinely requires them. This is not a license to generate an encyclopedia.

WHEN CONDITIONS CHANGE (replaces a seasonal calendar)
Do not generate a January-through-December calendar — plant care depends on actual environment, hemisphere, indoor/outdoor conditions, temperature, light, and growth state, and calendar month is a poor proxy for those. Instead give a short list of "if this changes, adjust like this" statements relevant to THIS plant and its supplied environment — e.g. "if light drops, soil may dry more slowly, so check moisture rather than keeping the same watering interval," "if active growth increases, water demand may change," "if temperature falls, protect species sensitive to cold." Only include adjustments that are actually relevant here.

FERTILIZER
Do not infer nutrient depletion from ownership duration, and do not automatically prescribe a specific ratio or fixed schedule unless that specificity is justified. For a currently struggling plant, do not make fertilizing an automatic rescue step — address the condition causing the stress first. If feeding is appropriate, describe it conservatively and defer to the product label where relevant.

MISTING
Do not automatically recommend misting or invent humidity thresholds or misting frequencies. If humidity is materially relevant to the identified species, explain the relationship cautiously, and do not imply routine leaf misting reliably solves low humidity.

REPOTTING
Do not automatically include a full repotting guide — first determine whether there is evidence repotting would help (severe root crowding, degraded or unsuitable substrate, an uncorrectable drainage problem, root damage requiring intervention). Roots visible at drainage holes alone do not automatically prove an emergency. If repotting isn't currently indicated, say so or omit it; if it is, give only the instructions needed for this case.`;

const IDENTIFY_MODE_RULES = `CURRENT MODE: IDENTIFY — the visitor wants to know what plant this is. Apply the section below in addition to the general rules above; the RESCUE and CARE sections do not apply to this response.

IDENTIFY MODE
Answer "What plant is this?" Prioritize the best match, why it fits, what else it could be (only if genuinely ambiguous), and what would confirm it. Do not automatically append a full care schedule, a "when conditions change" list, a repotting guide, or a propagation guide after identification — identification and care are separate intents. If the visitor wants care information, that's a separate request.

IDENTIFY MODE PROVENANCE
Identify the plant from the CURRENT photo. Every statement under "why it fits" must be a feature actually visible in THAT photo. Never use Rescue-mode symptoms, Care-mode information, watering or light history, move history, a previous plant description, saved-plant history, or a previous analysis's conclusion as evidence for botanical identity — none of that is something you can see. That context, if present, may be held in mind, but never presented as visual evidence supporting the identification. If the current photo conflicts with that prior context (e.g. it was previously described as one species and the photo looks like another), say so plainly rather than blending the two into one answer. BAD: "Rhododendron — high confidence," followed by reasoning that pulls in a different plant's leaf-drop, moving stress, watering, or light history. GOOD: "The plant in this photo appears more consistent with a Rhododendron. That doesn't match the [prior plant] described earlier." Before returning, check every sentence under "why it fits" against: "What can I actually see in the current photo that supports this?" If a sentence doesn't answer that, remove it.`;

const RESCUE_SCHEMA = `{
  "plant_identification": {
    "best_match": "",
    "scientific_name": "",
    "confidence": "high|moderate|low",
    "why_it_fits": "",
    "alternatives": [],
    "what_would_confirm": ""
  },
  "bottom_line": {
    "attention_level": "likely_minor|watch_and_check|needs_attention|serious_damage_possible",
    "summary": ""
  },
  "what_you_reported": [""],
  "possible_explanations": [
    { "possibility": "", "why_it_could_fit": "", "check": "" }
  ],
  "check_first": [
    { "check": "", "what_to_look_for": "", "if_yes": "", "if_no": "" }
  ],
  "what_to_do_now": [
    { "action": "", "why": "", "condition": "" }
  ],
  "what_improvement_looks_like": [""],
  "safety": { "show": false, "who_or_what": "", "guidance": "" },
  "useful_next_photo": ""
}`;

const CARE_SCHEMA = `{
  "plant": { "name": "", "scientific_name": "", "confidence": "high|moderate|low" },
  "core_care": { "light": "", "watering": "", "soil_and_drainage": "", "feeding": "", "temperature_and_humidity": "" },
  "repot_when": [""],
  "when_conditions_change": [ { "condition": "", "adjustment": "" } ],
  "watch_for": [""],
  "pet_child_safety": { "show": false, "guidance": "" }
}`;

const IDENTIFY_SCHEMA = `{
  "best_match": { "common_name": "", "scientific_name": "", "confidence": "high|moderate|low", "why_it_fits": [""] },
  "alternatives": [ { "name": "", "why_possible": "", "how_to_distinguish": "" } ],
  "what_would_help_confirm": [""],
  "safety_note": { "show": false, "guidance": "" }
}`;

// ── Input helpers ──
const LIGHT_LABEL = { 'full-sun': 'Full sun (6+h)', 'partial-shade': 'Partial (3-6h)', 'low-light': 'Low light' };
const LOCATION_LABEL = { indoor: 'Indoor', outdoor: 'Outdoor', greenhouse: 'Greenhouse' };
const CLIMATE_LABEL = { tropical: 'Tropical', subtropical: 'Subtropical', temperate: 'Temperate', cold: 'Cold', arid: 'Arid' };
const SYMPTOM_LABEL = {
  yellow_leaves: 'Yellowing leaves', brown_tips: 'Brown tips', drooping: 'Drooping/wilting',
  spots: 'Spots on leaves', mushy_stem: 'Mushy/soft stem', white_fuzz: 'White fuzz/mold',
  tiny_bugs: 'Tiny bugs/pests', leggy: 'Leggy/stretched growth', no_growth: 'No new growth',
  leaf_drop: 'Leaf dropping', crispy: 'Crispy/dry leaves', bad_smell: 'Bad smell',
};
const SYMPTOM_DURATION_LABEL = {
  just_noticed: 'Just noticed', few_days: 'A few days', week_or_two: 'A week or two',
  several_weeks: 'Several weeks', few_months: 'A few months', longer: 'Longer', not_sure: 'Not sure',
};
const WATERING_METHOD_LABEL = {
  check_soil: 'Checks the soil first before watering', schedule: 'Waters on a fixed schedule',
  looks_thirsty: 'Waters when the plant starts looking thirsty', varies: "Isn't sure / it varies",
};
const RECENT_CHANGE_LABEL = {
  moved: 'Moved the plant', repotted: 'Repotted', watering_changed: 'Watering changed',
  light_changed: 'Light changed', fertilizer_changed: 'Fertilizer changed', temperature_changed: 'Temperature changed',
  pest_treatment: 'Pest treatment', other: 'Something else', nothing: 'Nothing the visitor can think of',
};
const DRAINAGE_LABEL = { yes: 'Yes', no: 'No', not_sure: 'Not sure' };

function buildSupplied(body) {
  const {
    plantName, plantDescription, symptoms, symptomDuration, recentChanges,
    lightLevel, wateringMethod, wateringFreqText, hasDrainage, location,
    climateZone, userLocation, hasPets, hasChildren, extraPhotos, imageBase64,
  } = body;

  const lines = [];
  if (plantName) lines.push(`PLANT NAME (visitor-supplied): ${plantName}`);
  lines.push(imageBase64 ? 'PHOTO PROVIDED — analyze visually.' : 'No photo provided.');
  if (extraPhotos?.length) lines.push(`${extraPhotos.length} additional photo(s) provided (close-up and/or soil/roots).`);
  if (plantDescription) lines.push(`FREE-TEXT DESCRIPTION: ${plantDescription}`);
  if (symptoms?.length) lines.push(`SELECTED SYMPTOMS: ${symptoms.map((s) => SYMPTOM_LABEL[s] || s).join(', ')}`);
  if (symptomDuration) lines.push(`HOW LONG THIS HAS BEEN HAPPENING: ${SYMPTOM_DURATION_LABEL[symptomDuration] || symptomDuration}`);
  if (recentChanges?.length) lines.push(`CHANGED RECENTLY: ${recentChanges.map((c) => RECENT_CHANGE_LABEL[c] || c).join(', ')}`);
  if (lightLevel) lines.push(`LIGHT (visitor-selected category): ${LIGHT_LABEL[lightLevel] || lightLevel}`);
  if (wateringMethod) lines.push(`HOW THE VISITOR DECIDES WHEN TO WATER: ${WATERING_METHOD_LABEL[wateringMethod] || wateringMethod}`);
  if (wateringFreqText) lines.push(`ABOUT HOW OFTEN LATELY (visitor's own words): ${wateringFreqText}`);
  if (hasDrainage) lines.push(`POT HAS DRAINAGE: ${DRAINAGE_LABEL[hasDrainage] || hasDrainage}`);
  if (location) lines.push(`LOCATION: ${LOCATION_LABEL[location] || location}`);
  if (climateZone || userLocation) lines.push(`CLIMATE: ${CLIMATE_LABEL[climateZone] || climateZone || ''} ${userLocation || ''}`.trim());
  if (hasPets) lines.push('HOUSEHOLD HAS PETS.');
  if (hasChildren) lines.push('HOUSEHOLD HAS CHILDREN.');
  return lines.join('\n');
}

function buildImageContent(imageBase64, extraPhotos) {
  const content = [];
  const push = (b64) => {
    if (!b64) return;
    const data = b64.includes(',') ? b64.split(',')[1] : b64;
    let mediaType = 'image/jpeg';
    if (b64.includes('data:image/png')) mediaType = 'image/png';
    else if (b64.includes('data:image/webp')) mediaType = 'image/webp';
    content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data } });
  };
  push(imageBase64);
  (extraPhotos || []).forEach(push);
  return content;
}

// ── Main endpoint — mode dispatch (rescue | care | identify) ──
router.post('/plant-rescue', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { mode, imageBase64, extraPhotos, plantDescription, symptoms, userLanguage } = req.body;
    const activeMode = mode === 'care' ? 'care' : mode === 'identify' ? 'identify' : 'rescue';

    if (activeMode === 'identify' && !imageBase64) {
      return res.status(400).json({ error: 'A photo is needed to identify a plant.' });
    }
    if (activeMode !== 'identify' && !imageBase64 && (!plantDescription || plantDescription.trim().length < 3) && (!symptoms || symptoms.length === 0)) {
      return res.status(400).json({ error: 'Provide a photo, description, or select symptoms.' });
    }

    const supplied = buildSupplied(req.body);
    const modeRules = activeMode === 'care' ? CARE_MODE_RULES : activeMode === 'identify' ? IDENTIFY_MODE_RULES : RESCUE_MODE_RULES;
    const schema = activeMode === 'care' ? CARE_SCHEMA : activeMode === 'identify' ? IDENTIFY_SCHEMA : RESCUE_SCHEMA;

    const historyBlock = (req.body.priorObservations || []).length
      ? `\n\nSAVED OBSERVATIONS FOR THIS PLANT (earlier checks — describe changes, never diagnose from them):\n${req.body.priorObservations.map((o) => `- ${o.date}: reported ${o.reported}; suggested checking ${o.suggestedChecks || 'nothing specific'}`).join('\n')}`
      : '';

    const prompt = `${GENERAL_RULES}

${modeRules}

WHAT THE VISITOR SUPPLIED:
${supplied}${historyBlock}

Return ONLY valid JSON matching this exact shape:
${schema}

LIMITS: possible_explanations/check_first/what_to_do_now AT MOST 3 each. what_you_reported/what_improvement_looks_like/watch_for/repot_when/what_would_help_confirm AT MOST 6 each. alternatives AT MOST 3. Keep every field to one or two concise sentences. ALL top-level keys in the schema MUST be present — use false/empty string/empty array for anything not applicable, never omit a key.

${NO_QUOTE_RULE}`;

    const systemPrompt = withLanguage(prompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    const content = buildImageContent(imageBase64, extraPhotos);
    content.push({ type: 'text', text: activeMode === 'identify' ? 'Identify this plant.' : (plantDescription?.trim() || 'See selected symptoms and supplied details above.') });

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
    }, { label: `plant-rescue-${activeMode}` });

    const requiredKey = activeMode === 'care' ? 'core_care' : activeMode === 'identify' ? 'best_match' : 'bottom_line';
    if (!parsed?.[requiredKey]) {
      return res.status(500).json({ error: 'Could not complete that. Please try again.' });
    }

    // v2 guard (PF-39a). Fail-open: it wraps a working answer.
    try {
      const fields = [];
      if (activeMode === 'rescue') {
        fields.push(['bottom_line.summary', parsed.bottom_line?.summary]);
        (parsed.what_you_reported || []).forEach((v, i) => fields.push([`what_you_reported[${i}]`, v]));
        (parsed.possible_explanations || []).forEach((p, i) => {
          fields.push([`possible_explanations[${i}].why_it_could_fit`, p.why_it_could_fit]);
          fields.push([`possible_explanations[${i}].check`, p.check]);
        });
        (parsed.check_first || []).forEach((c, i) => {
          fields.push([`check_first[${i}].if_yes`, c.if_yes]);
          fields.push([`check_first[${i}].if_no`, c.if_no]);
        });
        (parsed.what_to_do_now || []).forEach((a, i) => {
          fields.push([`what_to_do_now[${i}].why`, a.why]);
          fields.push([`what_to_do_now[${i}].condition`, a.condition]);
        });
      } else if (activeMode === 'care') {
        fields.push(['core_care.watering', parsed.core_care?.watering]);
        fields.push(['core_care.feeding', parsed.core_care?.feeding]);
        (parsed.when_conditions_change || []).forEach((w, i) => fields.push([`when_conditions_change[${i}].adjustment`, w.adjustment]));
      } else {
        // best_match.why_it_fits is an array per IDENTIFY_SCHEMA — pushing the
        // container path itself would make getByPath return an array, which
        // outputGuard.js correctly refuses to repair (a repair can only
        // rewrite a string leaf, not a whole array) and silently drops.
        (Array.isArray(parsed.best_match?.why_it_fits) ? parsed.best_match.why_it_fits : []).forEach((v, i) => fields.push([`best_match.why_it_fits[${i}]`, v]));
        (parsed.alternatives || []).forEach((a, i) => {
          fields.push([`alternatives[${i}].why_possible`, a.why_possible]);
          fields.push([`alternatives[${i}].how_to_distinguish`, a.how_to_distinguish]);
        });
      }

      await runOutputGuard(parsed, {
        label: `plant-rescue-${activeMode}`,
        fields,
        supplied,
        promise: 'Help a plant owner reason about a struggling or unfamiliar plant — plausible explanations grounded only in what was reported/visible, what would distinguish them, and a single most-useful check before any conditional treatment. Never a diagnosis, never a percentage, never an invented recovery timeline, schedule, or chemical treatment the evidence does not support.',
        guard: router.outputGuard,
        userLanguage,
      });
    } catch (guardErr) {
      console.log(`[plant-rescue-${activeMode}] v2 guard skipped:`, guardErr.message);
    }

    res.json(parsed);
  } catch (error) {
    console.error('❌ Plant Rescue error:', error.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ── Follow-up Q&A ──
// Passes forward REPORTED/VISIBLE/IDENTIFICATION+confidence/POSSIBILITIES/
// UNKNOWNS/CHECKS, never a flattened "Diagnosis: [claim]" string — a prior
// possibility stays a possibility until new evidence establishes it, and the
// follow-up is explicitly allowed to revise the earlier interpretation.
router.post('/plant-rescue/followup', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { question, originalDiagnosis, mode, plantDescription, imageBase64, userLanguage } = req.body;
    if (!question?.trim()) return res.status(400).json({ error: 'Provide a question.' });
    if (!originalDiagnosis) return res.status(400).json({ error: 'No context. Run an analysis first.' });

    const ctx = [];
    if (mode === 'care' && originalDiagnosis.plant) {
      ctx.push(`Plant: ${originalDiagnosis.plant.name || 'Unknown'} (identification confidence: ${originalDiagnosis.plant.confidence || 'unknown'})`);
      if (originalDiagnosis.core_care) ctx.push(`Care given: ${JSON.stringify(originalDiagnosis.core_care)}`);
      if (originalDiagnosis.watch_for?.length) ctx.push(`Watch for: ${originalDiagnosis.watch_for.join('; ')}`);
    } else if (mode === 'identify' && originalDiagnosis.best_match) {
      ctx.push(`Best match: ${originalDiagnosis.best_match.common_name || 'Unknown'} (confidence: ${originalDiagnosis.best_match.confidence || 'unknown'})`);
      if (originalDiagnosis.alternatives?.length) ctx.push(`Alternatives considered: ${originalDiagnosis.alternatives.map((a) => a.name).join(', ')}`);
    } else {
      if (originalDiagnosis.plant_identification) ctx.push(`Plant identification: ${originalDiagnosis.plant_identification.best_match || 'Unknown'} (confidence: ${originalDiagnosis.plant_identification.confidence || 'unknown'})`);
      if (originalDiagnosis.bottom_line) ctx.push(`Attention level: ${originalDiagnosis.bottom_line.attention_level} — ${originalDiagnosis.bottom_line.summary}`);
      if (originalDiagnosis.what_you_reported?.length) ctx.push(`Reported: ${originalDiagnosis.what_you_reported.join('; ')}`);
      if (originalDiagnosis.possible_explanations?.length) ctx.push(`Possibilities (not established diagnoses): ${originalDiagnosis.possible_explanations.map((p) => p.possibility).join('; ')}`);
      if (originalDiagnosis.check_first?.length) ctx.push(`Checks suggested: ${originalDiagnosis.check_first.map((c) => c.check).join('; ')}`);
    }

    const systemPrompt = withLanguage(
      `${GENERAL_RULES}

FOLLOW-UP
Apply the same evidence rules as the original analysis to this follow-up question — do not become more certain merely because the question is narrower, and do not treat a previous possibility as an established diagnosis merely because the model produced it. New information may strengthen a possibility, weaken it, eliminate it, introduce another one, or justify a different action — you are allowed to revise the earlier interpretation. If the visitor reports the result of a suggested check, reason from that new evidence rather than defending the earlier answer.

ORIGINAL CONTEXT:
${ctx.join('\n')}
${plantDescription ? `\nOriginal description: ${plantDescription}` : ''}

Answer concisely, usually covering: what the new information changes, what you would do next, and what would make you reconsider. Do not invent certainty, treatment schedules, chemical remedies, or recovery timelines. Keep to 2-3 short paragraphs (about 150 words max).

Return ONLY valid JSON: { "answer": "your 2-3 short paragraph answer" }

${NO_QUOTE_RULE}`,
      userLanguage
    ) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const content = buildImageContent(imageBase64, []);
    content.push({ type: 'text', text: question.trim() });

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
    }, { label: 'plant-rescue-followup' });

    if (!parsed?.answer) return res.status(500).json({ error: 'Could not answer that. Please try again.' });
    res.json({ answer: parsed.answer.trim() });
  } catch (error) {
    console.error('❌ Plant Rescue follow-up error:', error.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ── Companion / grouping advisor ──
// Renamed in spirit from an "indoor plant placement expert" invited to
// invent rooms, windows, humidity, and air-purifying claims, to a CARE
// COMPATIBILITY grouping — light/water/temperature/humidity compatibility
// only, using established identities and reasonably supported requirements.
router.post('/plant-rescue/companions', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { plants, climateZone, location, userLanguage } = req.body;
    if (!plants?.length || plants.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 plants for a grouping check.' });
    }

    const plantList = plants.map((p) => `- ${p.name} (${p.species || 'unknown species'})${p.lightNeeds ? ` | light: ${p.lightNeeds}` : ''}${p.waterNeeds ? ` | water: ${p.waterNeeds}` : ''}`).join('\n');

    const prompt = `Help group a visitor's houseplants by CARE COMPATIBILITY — never by claims that one houseplant biologically benefits another, which "companion planting" can wrongly imply for a bed of outdoor vegetables but doesn't apply the same way indoors.

Use only established plant identities and reasonably supported care requirements. Do not invent room availability, window direction, household humidity, exact placement, air-purifying benefits, or companion-plant biological benefits. If the visitor hasn't described their rooms or windows, say what TYPE of location would fit rather than inventing one. Do not automatically recommend buying additional plants.

PLANTS:
${plantList}
${climateZone ? `Climate: ${climateZone}` : ''}
${location ? `Setting: ${location}` : ''}

Group by light compatibility, watering/dry-down compatibility, temperature compatibility, and humidity compatibility when materially relevant.

Return ONLY valid JSON:
{
  "good_to_group": [ { "plants": ["Plant Name 1", "Plant Name 2"], "why": "" } ],
  "better_kept_apart": [ { "plants": ["Plant Name 1", "Plant Name 2"], "why": "" } ],
  "placement_principle": ""
}

LIMITS: good_to_group AT MOST 6, better_kept_apart AT MOST 5. Keep every field to one concise sentence.

${NO_QUOTE_RULE}`;

    const systemPrompt = withLanguage(prompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Group these plants.' }],
    }, { label: 'plant-rescue-companions' });

    res.json(parsed);
  } catch (error) {
    console.error('❌ Plant Rescue companions error:', error.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
