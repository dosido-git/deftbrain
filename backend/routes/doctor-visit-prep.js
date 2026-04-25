const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

// ─────────────────────────────────────────────────────────────────────────────
// Doctor Visit Prep — pre-visit complement to DoctorVisitTranslator.
// DVT decodes what the doctor said. This shapes what YOU say.
//
// Input: chief concern, symptom details, current meds, history, appointment
//   type, specific worry, allergies.
// Output: one-sentence opener, prioritized questions, symptom description in
//   clinical language, "rule out" prompts, pre-visit checklist, red-flag
//   prompts for things the patient should mention even if the doctor doesn't
//   ask, and questions to ask if medication is prescribed.
//
// This tool does NOT diagnose, recommend treatment, or replace medical advice.
// It helps a patient walk in organized and leave having said what matters.
// ─────────────────────────────────────────────────────────────────────────────

const APPT_CONTEXT = {
  'new-problem':       '\n\nAPPOINTMENT TYPE: New problem / first visit for this issue\nFocus especially on: clear symptom description, timeline, what patient has already tried, what they are most worried about.',
  'follow-up':         '\n\nAPPOINTMENT TYPE: Follow-up on known condition\nFocus especially on: what has changed since last visit, whether current treatment is working, questions about medication adjustments or next steps.',
  'annual-physical':   '\n\nAPPOINTMENT TYPE: Annual physical / wellness visit\nFocus especially on: screenings due, family history updates, lifestyle concerns, preventive questions.',
  'specialist':        '\n\nAPPOINTMENT TYPE: Specialist consultation\nFocus especially on: why the patient was referred, what the specialist needs to know from the primary care visit, decision points the patient wants to reach.',
  'second-opinion':    '\n\nAPPOINTMENT TYPE: Second opinion\nFocus especially on: existing diagnosis and treatment plan the patient wants reviewed, what specifically is unclear or unsatisfying, decision-points they need help with.',
  'procedure-consult': '\n\nAPPOINTMENT TYPE: Pre-procedure or surgical consultation\nFocus especially on: risks, alternatives, recovery, what the procedure actually involves, success rates.',
  'mental-health':     '\n\nAPPOINTMENT TYPE: Mental or behavioral health\nFocus especially on: clear description of what the patient is experiencing, triggers, functional impact, what they have already tried.',
  'urgent-care':       '\n\nAPPOINTMENT TYPE: Urgent / acute care\nFocus especially on: onset, severity, red-flag symptoms, why they decided to come in now.',
};

const LANG_NAME = {
  es: 'Spanish', zh: 'Mandarin Chinese', vi: 'Vietnamese',
  tl: 'Tagalog', ko: 'Korean', fr: 'French', ar: 'Arabic',
  pt: 'Portuguese', ru: 'Russian', ht: 'Haitian Creole',
};

router.post('/doctor-visit-prep', rateLimit(), async (req, res) => {
  try {
    const {
      chiefConcern,
      symptomDetails,
      durationText,
      severity,
      whatMakesItBetterWorse,
      currentMedications,
      allergies,
      relevantHistory,
      appointmentType,
      specificWorry,
      knownMedications,
      language,
      locale,
    } = req.body;

    const lang = withLanguage(locale);

    // ── S7.3: validate every required field BEFORE building the prompt ──
    if (!chiefConcern?.trim()) {
      return res.status(400).json({ error: 'A chief concern (the main reason for your visit) is required' });
    }

    // ── Optional context blocks — silently omitted if absent ──
    const detailBlock = symptomDetails?.trim()
      ? `\n\nSYMPTOM DETAILS: ${symptomDetails.trim()}`
      : '';
    const durationBlock = durationText?.trim()
      ? `\n\nDURATION / ONSET: ${durationText.trim()}`
      : '';
    const severityBlock = severity
      ? `\n\nSEVERITY (1-10): ${severity}`
      : '';
    const modifiersBlock = whatMakesItBetterWorse?.trim()
      ? `\n\nWHAT MAKES IT BETTER OR WORSE: ${whatMakesItBetterWorse.trim()}`
      : '';
    const medsBlock = currentMedications?.trim()
      ? `\n\nCURRENT MEDICATIONS (user-entered): ${currentMedications.trim()}`
      : '';
    const knownMedsBlock = knownMedications?.length
      ? `\n\nKNOWN MEDICATION HISTORY (from patient's tracked list):\n${knownMedications.map(m => `- ${m.name}${m.purpose ? ': ' + m.purpose : ''}${m.prescribedDate ? ' (since ' + m.prescribedDate + ')' : ''}`).join('\n')}`
      : '';
    const allergiesBlock = allergies?.trim()
      ? `\n\nALLERGIES / ADVERSE REACTIONS: ${allergies.trim()}`
      : '';
    const historyBlock = relevantHistory?.trim()
      ? `\n\nRELEVANT PERSONAL OR FAMILY HISTORY: ${relevantHistory.trim()}`
      : '';
    const worryBlock = specificWorry?.trim()
      ? `\n\nWHAT THE PATIENT IS MOST WORRIED ABOUT: ${specificWorry.trim()}\n(Make sure the output addresses this worry head-on — either with a direct question to ask or with reassurance about how to raise it.)`
      : '';
    const apptBlock = APPT_CONTEXT[appointmentType] || '';

    // Bilingual side-by-side instructions for specific fields.
    // `language` is the user's *bilingual output* preference (separate from `locale`,
    // the site UI language handled by withLanguage above).
    const bilingualInstructions = language && language !== 'en' && LANG_NAME[language]
      ? `\n\nBILINGUAL OUTPUT: For the following fields, provide BOTH English AND ${LANG_NAME[language]} translations. Format each as "English text ||| ${LANG_NAME[language]} translation":\n- opener\n- symptom_description_clinical\n- Each item in prioritized_questions (question field only)\n- Each item in things_to_mention_even_if_not_asked\n- Each item in red_flag_symptoms_to_report\n\nKeep all other fields in English only. Use the ||| separator so the app can split and display both languages.`
      : '';

    const prompt = `You are helping a patient prepare for a doctor appointment. Your job is to turn the patient's scattered worries and symptoms into a focused, organized set of things they can say and ask during a short visit.

The goal is NOT diagnosis. The goal is: the patient walks in knowing exactly what to say in the first two minutes, which questions matter most, and what they should mention even if the doctor does not ask.

CHIEF CONCERN: ${chiefConcern.trim()}${detailBlock}${durationBlock}${severityBlock}${modifiersBlock}${medsBlock}${knownMedsBlock}${allergiesBlock}${historyBlock}${worryBlock}${apptBlock}${bilingualInstructions}

CRITICAL RULES:
1. DO NOT diagnose. DO NOT recommend specific treatments or medications.
2. DO NOT contradict what a doctor might say.
3. DO help the patient describe symptoms in language a clinician will understand (frequency, quality, triggers, functional impact) without the patient having to learn medical jargon.
4. DO prioritize questions so if the doctor only has time for two, the patient asks the two that matter most.
5. DO include things the patient should mention proactively (medication interactions, family history, allergies, functional impact) even if the doctor does not ask.
6. DO flag any red-flag symptoms from the patient's description that warrant urgent attention, and tell the patient to mention these first.
7. Be empowering, not clinical. Use "you" language. Assume the patient is intelligent but nervous.
8. If the patient's chief concern is vague or very broad, your opener and questions should help them narrow it down — not paper over the vagueness.

Return ONLY this JSON structure (NO markdown, NO code fences):

{
  "opener": "A single clear sentence the patient can use to open the visit. Example: 'I've had a dull pain on the right side of my lower back for about three weeks — it's getting worse when I sit for long periods.' Specific, concrete, clinical-ready.",
  "symptom_description_clinical": "A 2-3 sentence paragraph the patient can read aloud or paraphrase that describes the symptom in the terms a clinician would use: location, quality (sharp/dull/burning/aching), frequency, duration, triggers, functional impact. Do NOT invent details — only use what the patient provided.",
  "prioritized_questions": [
    {
      "question": "The actual question in plain language — something the patient can read off a phone screen.",
      "why_this_matters": "One sentence on why this question is worth asking.",
      "priority": "high" | "medium" | "low",
      "category": "diagnosis" | "treatment" | "medication" | "follow-up" | "logistics" | "lifestyle" | "prognosis"
    }
  ],
  "things_to_mention_even_if_not_asked": [
    "Specific thing the patient should say proactively. Each item is a single, concrete sentence — not advice, not a category."
  ],
  "red_flag_symptoms_to_report": [
    "If any symptom from the patient's description warrants urgent mention, list it here with a short reason. Only populate this array if the patient's input actually suggests a red flag. If not, return an empty array — do not invent red flags."
  ],
  "pre_visit_checklist": [
    "Specific, actionable prep items the patient can check off before walking in. Examples: 'Write down the exact dates your symptoms started.' 'Bring your medication bottles in a bag.' 'Measure your blood pressure twice a day for three days before the visit.' Be specific to this patient's situation, not generic."
  ],
  "what_to_bring": [
    "Short list of physical items to bring. Examples: 'Insurance card', 'List of current medications with doses', 'A notebook or your phone to take notes', 'Photos of the rash when it was at its worst'. Tailored to the chief concern."
  ],
  "conversation_tips": [
    "2-4 short tips on how to have the conversation itself. Examples: 'If the doctor starts typing before you finish, pause and ask if they'd like you to continue.' 'If you leave without understanding the plan, ask: what should I do, and when should I come back?' Practical, not preachy."
  ],
  "goal_for_the_visit": "One sentence stating the patient's realistic goal for this visit. Example: 'Leave with either a clear diagnosis, a referral, or specific next tests to run — not another waiting period.' Specific to the patient's situation.",
  "questions_to_ask_if_medication_is_prescribed": [
    "If the appointment type or chief concern suggests medication may be prescribed, include 3-5 high-value questions to ask in that moment. Examples: 'What is this treating?' 'What side effects should I watch for in the first week?' 'Is there a generic version?' 'How will we know if it's working?' 'When and why would we stop it?' If medication is clearly NOT relevant, return an empty array."
  ]
}

TONE GUIDELINES:
- Empowering. Treat the patient as the expert on their own body and experience.
- Concrete. Every sentence should be something the patient could actually say or do.
- Not scary. Red flags are noted matter-of-factly, not alarmed.
- Use "you" language throughout.

Return ONLY the JSON object.${lang}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content.find(i => i.type === 'text')?.text || '';

    let results;
    try {
      results = JSON.parse(cleanJsonResponse(text));
    } catch (parseError) {
      console.error('Doctor Visit Prep JSON parse error:', parseError.message);
      throw new Error(`JSON parse failed: ${parseError.message}`);
    }

    // Minimal validation — opener + prioritized_questions are the core outputs
    if (!results.opener || !Array.isArray(results.prioritized_questions)) {
      throw new Error('Invalid response structure');
    }

    res.json(results);

  } catch (error) {
    console.error('Doctor Visit Prep error:', error);
    res.status(500).json({
      error: 'Failed to prepare your visit',
      details: error.message,
    });
  }
});

module.exports = router;
