const express = require('express');
const router = express.Router();
const { anthropic, withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

router.post('/doctor-visit-translator', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { doctorNotes, visitType, concerns, currentMedications,
      language, documentType, knownMedications, pdfData, userLanguage } = req.body;

    // Validation — require either notes or a PDF
    if ((!doctorNotes || !doctorNotes.trim()) && !pdfData) {
      return res.status(400).json({ error: 'Doctor notes or a PDF document is required' });
    }

    const concernsContext = concerns ? `\n\nPATIENT'S MAIN CONCERNS: ${concerns}` : '';
    const medsContext = currentMedications ? `\n\nCURRENT MEDICATIONS (user-entered): ${currentMedications}` : '';
    // F3: Auto-injected from persistent medication list
    const knownMedsContext = knownMedications?.length
      ? `\n\nKNOWN MEDICATION HISTORY (from patient's tracked list):\n${knownMedications.map(m => `- ${m.name}: ${m.purpose} (since ${m.prescribedDate})`).join('\n')}\n\nIMPORTANT: Cross-reference ALL known medications with any new prescriptions for potential interactions.`
      : '';

    // F6: Document-type-specific context
    const docTypeContext = {
      'prescription-label': '\n\nDOCUMENT TYPE: Prescription Label / Medication Instructions\nFocus especially on: medication details, dosage, timing, side effects, interactions, storage, and pharmacist questions.',
      'lab-report': '\n\nDOCUMENT TYPE: Laboratory / Test Results\nFocus especially on: test result explanations, normal ranges, what values mean, trends, and whether results are concerning.',
      'insurance-eob': '\n\nDOCUMENT TYPE: Insurance Explanation of Benefits / Medical Bill\nFocus especially on: what was covered, what the patient owes, appeal options, billing codes explained, and cost-reduction resources.',
      'discharge': '\n\nDOCUMENT TYPE: Hospital Discharge Summary\nFocus especially on: recovery instructions, medication changes, activity restrictions, warning signs, and follow-up scheduling.',
    };
    const documentContext = docTypeContext[documentType] || '';

    // F2: Language instructions
    const langName = {
      es: 'Spanish', zh: 'Mandarin Chinese', vi: 'Vietnamese',
      tl: 'Tagalog', ko: 'Korean', fr: 'French', ar: 'Arabic',
      pt: 'Portuguese', ru: 'Russian', ht: 'Haitian Creole',
    };
    const bilingualInstructions = language && language !== 'en' && langName[language]
      ? `\n\nBILINGUAL OUTPUT: For the following fields, provide BOTH English AND ${langName[language]} translations. Format each as "English text ||| ${langName[language]} translation":\n- plain_english_summary.diagnosis\n- plain_english_summary.treatment_plan\n- plain_english_summary.prognosis\n- plain_english_summary.timeline\n- Each action in action_checklist (the "action" and "how" fields)\n- Each medication's "purpose" and "how_to_take" fields\n- follow_up_requirements.next_appointment\n- All items in follow_up_requirements.when_to_call_doctor and warning_signs_immediate\n\nKeep all other fields in English only. Use the ||| separator so the app can split and display both languages.`
      : '';

    // Build the notes/document section of the prompt
    let notesSection = '';
    if (pdfData && doctorNotes?.trim()) {
      // Both PDF and notes provided — tell Claude to read both
      notesSection = `ATTACHED DOCUMENT: A PDF has been uploaded. Read it in full and use its contents as the primary source of medical information to translate.\n\nADDITIONAL CONTEXT FROM PATIENT:\n${doctorNotes}`;
    } else if (pdfData) {
      // PDF only — instruct Claude to read it as the sole source
      notesSection = `ATTACHED DOCUMENT: A PDF has been uploaded (${documentType !== 'visit' ? (docTypeContext[documentType] ? documentType.replace('-', ' ') : 'medical document') : 'medical document'}). Read it in full. Extract and translate ALL medical information it contains — diagnoses, test results, medications, instructions, billing codes, or whatever is present. Do not say the document is unavailable or unreadable; use everything you can see in it.`;
    } else {
      notesSection = `DOCTOR'S NOTES/VISIT SUMMARY:\n${doctorNotes}`;
    }

    const prompt = `You are a medical interpreter helping patients understand their doctor visits. Translate medical jargon into clear, understandable language WITHOUT oversimplifying or losing important details.

VISIT TYPE: ${visitType}
${notesSection}${concernsContext}${medsContext}${knownMedsContext}${documentContext}${bilingualInstructions}

CRITICAL RULES:
1. Use clear, plain English but maintain medical accuracy
2. Never contradict the doctor's instructions
3. Include ALL important details
4. Identify red flags and urgent action items
5. Empower the patient to ask good questions
6. Provide medication safety information
7. Include second opinion guidance when appropriate
8. Focus on what patient needs to DO and UNDERSTAND
9. If known medications are provided, ACTIVELY check for interactions with any newly prescribed medications
10. For action_checklist items, include a "due_in_days" field (integer estimate) for scheduling reminders
11. VISUAL-AID DESCRIPTIONS: For every visual_aid_suggestion and every visual_aids_recommended field, name the EXACT structure/concept and embed the exact measured value(s) and normal range verbatim — e.g. "left ventricle INTERNAL CHAMBER diameter 4.0 cm vs normal 4.2–5.9 cm" or "aortic root 4.2 cm and ascending aorta 4.0 cm vs normal <4.0 cm", NOT "left ventricle measurement". A diagram is generated from this text using ONLY the numbers and labels you write here, so include the real figures, name the precise anatomy (do not let it be confused with a related concept such as wall thickness), and never imply a value you did not state.

CONCISENESS: Keep each field to 1-2 sentences max. For arrays (medical_terms_explained, action_checklist, medications, test_results_explained, questions_for_next_visit, health_literacy_tips), include only items actually present in the notes — do not pad with generic advice. Omit empty arrays entirely (use []).

Return ONLY this JSON structure (NO markdown):

{
  "plain_english_summary": {
    "diagnosis": "In simple terms, what condition or issue (or 'No specific diagnosis mentioned') — 1-2 sentences",
    "treatment_plan": "What patient needs to do - specific and actionable — one sentence",
    "prognosis": "What to expect - realistic but not scary — one sentence",
    "timeline": "When to see improvement or next steps — one sentence"
  },
  
  "medical_terms_explained": [
    {
      "term": "Medical term — 3-6 words",
      "definition": "Clear explanation — one sentence",
      "what_it_means_for_you": "Personal impact — one sentence",
      "visual_aid_suggestion": "Brief description of diagram that would help — one sentence"
    }
  ],
  
  "visual_aids_recommended": {
    "body_diagram_description": "What body parts/systems are affected and what diagram would help visualize this — 1-2 sentences",
    "treatment_timeline": "Step-by-step timeline visualization: Week 1: X, Week 2-4: Y, Month 2-3: Z — one sentence",
    "medication_schedule": "Daily schedule if multiple meds (e.g., 'Morning: X, Afternoon: Y, Evening: Z with food') — one sentence",
    "test_results_visualization": "How to visualize test results (e.g., 'Your cholesterol 240 on scale from 0-300, normal is <200') — one sentence"
  },
  
  "action_checklist": [
    {
      "action": "Specific task — one sentence",
      "why": "Why this matters — one sentence",
      "when": "Specific timing — one sentence",
      "how": "Step-by-step instructions — one sentence",
      "what_if_you_dont": "Realistic consequences of not doing this — one sentence",
      "priority": "high" | "medium" | "low",
      "due_in_days": 7
    }
  ],
  
  "medications": [
    {
      "name": "Medication name and dose — 3-6 words",
      "purpose": "What it does in plain English — one sentence",
      "how_to_take": "Exact instructions with timing — one sentence",
      "side_effects_to_watch": ["Important side effects"],
      "interactions_to_check": ["What to ask pharmacist about interactions"],
      "generic_available": "Yes/No and generic name if applicable — one sentence",
      "cost_considerations": "Typical cost range or 'Ask pharmacist about generic/discount programs' — one sentence",
      "questions_to_ask_pharmacist": ["Specific questions"]
    }
  ],
  
  "medication_safety": {
    "interaction_warnings": "If current medications mentioned, check for potential interactions. If none mentioned, say 'Make sure to tell your pharmacist about ALL medications, supplements, and vitamins you take' — one sentence",
    "timing_conflicts": "If multiple meds, note any timing issues (e.g., 'Take thyroid med 30 min before other meds') — one sentence",
    "food_interactions": "Foods or drinks to avoid with these medications — one sentence",
    "when_to_call_pharmacist": ["Specific scenarios requiring pharmacist consultation"],
    "known_med_interactions": "If known medications were provided, list specific potential interactions between existing and new medications here. Be specific: 'Lisinopril + Metformin: both affect kidney function - ensure regular kidney monitoring' or 'No significant interactions detected between your current medications and new prescriptions' — one sentence"
  },
  
  "test_results_explained": [
    {
      "test": "Test name — one sentence",
      "your_result": "Patient's value — one sentence",
      "normal_range": "Normal range — one sentence",
      "what_it_means": "Interpretation — one sentence",
      "trend": "If applicable: improving, stable, or worsening — one sentence",
      "next_steps": "What happens based on this result — one sentence"
    }
  ],
  
  "follow_up_requirements": {
    "next_appointment": "When to schedule — one sentence",
    "what_to_monitor": ["Symptoms to track"],
    "warning_signs_immediate": ["Call doctor immediately if..."],
    "warning_signs_soon": ["Call within 24-48 hours if..."],
    "expected_results_timeline": "When you should see improvement (and when to worry if you don't) — one sentence",
    "what_to_bring_next_time": ["Items or information to bring to follow-up"]
  },
  
  "questions_for_next_visit": [
    "Specific questions based on this visit",
    "Focus on gaps in understanding or next steps"
  ],
  
  "second_opinion_guidance": {
    "when_appropriate": "Situations where second opinion is reasonable or 'Not applicable for routine care' — one sentence",
    "how_to_request_records": "Steps to request medical records — one sentence",
    "what_to_say": "Exact phrase to use when requesting second opinion — one sentence",
    "not_offensive": "Reassurance that good doctors support second opinions — one sentence"
  },
  
  "patient_advocacy": {
    "if_you_disagree": "How to respectfully disagree — one sentence",
    "ask_for_clarification": "How to ask for simpler explanation — one sentence",
    "bring_support": "Encouragement to bring support person — one sentence",
    "get_it_in_writing": "What to ask for in writing — one sentence"
  },
  
  "insurance_navigation": {
    "likely_coverage": "Based on visit type, what insurance typically covers — one sentence",
    "prior_authorization": "If applicable, prior authorization guidance — one sentence",
    "appeal_process": "Steps if claim is denied — one sentence",
    "cost_resources": ["GoodRx for medications", "Ask about payment plans", "Hospital financial assistance programs", "Generic medication options"]
  },
  
  "health_literacy_tips": [
    "How to advocate for yourself",
    "What to ask if you don't understand",
    "How to prepare for appointments"
  ]
}

TONE GUIDELINES:
- Empowering, not condescending
- Reassuring but realistic
- Focus on actionability
- Acknowledge if something is concerning but provide next steps
- Use "you" language

MEDICAL ACCURACY:
- Don't change dosages or instructions
- Don't add medical advice beyond what doctor said
- Don't downplay serious conditions
- Don't promise outcomes doctor didn't promise

SECOND OPINION GUIDANCE:
- Appropriate for: major surgery, unclear diagnosis, not improving, major treatment change
- Not needed for: routine care, minor issues, clear straightforward treatment
- Frame as "getting more information" not "doctor shopping"

INSURANCE GUIDANCE:
- General guidance only - patient must verify with their insurance
- Focus on what questions to ask
- Provide resources for cost investigation
- Never guarantee coverage

Return ONLY the JSON object.`;

    // Apply language + locale to the prompt STRING. Do NOT wrap the content array:
    // `array + string` coerces the array to "[object Object],…", destroying the
    // prompt AND the document block (this broke every PDF upload).
    const augmentedPrompt = withLanguage(prompt, userLanguage)
      + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    // When a PDF is present, send the prompt text first, then the native document block.
    const userContent = pdfData
      ? [
          { type: 'text', text: augmentedPrompt },
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: pdfData },
          },
        ]
      : augmentedPrompt;

    const results = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      // Large nested schema: 2500 truncated the JSON → parse failure → 3 retries (~2.5 min) → error.
      max_tokens: 8000,
      messages: [{ role: 'user', content: userContent }]
    }, { label: 'doctor-visit-translator' });

    if (!results.plain_english_summary) {
      return res.status(500).json({ error: 'Could not translate your medical information. Please try again.' });
    }
    res.json(results);

  } catch (error) {
    console.error('Doctor Visit Translator error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ── Diagram generator ─────────────────────────────────────────────────────────
router.post('/generate-diagram', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { description, diagramType, userLanguage } = req.body;
    if (!description?.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const isDataViz = ['treatment_timeline', 'medication_schedule', 'test_results_visualization'].includes(diagramType);

    const prompt = isDataViz
      ? `Create a polished HTML visual for a patient based on this description:

"${description}"

Rules:
- ACCURACY (critical): use ONLY the exact numbers, units, and structure/label names that appear in the description above — never invent, round, or change a value, and never add a number the description did not state. If no specific number is given, show the relationship qualitatively rather than guessing one. Draw exactly the measurement/structure named; do not substitute a related concept.
- Output ONLY a single self-contained <div> element — no explanation, no markdown, no code fences
- No <html>, <body>, <head>, or <script> tags. No external resources. Inline styles only.
- Width 100%, height auto. Clean sans-serif font, 13px base.
- Color palette: #1565c0 dark blue, #1e88e5 mid blue, #42a5f5 light blue, #43a047 green, #ef5350 red, #ffb74d amber, #546e7a gray, #37474f dark text, #eceff1 very light bg, white
- For timelines: a vertical timeline — large numbered circles (32px, filled #1e88e5, white number) connected by a 2px #90caf9 line, each step has a bold title and 1-2 lines of description. Good whitespace.
- For medication schedules: a styled table or card grid grouped by time of day. Each row has a time label badge on the left and medication name(s) on the right. Use light color backgrounds per row.
- For test result scales: a horizontal gradient bar (green→amber→red) 400px wide, with a triangle marker showing patient value, numeric ticks below, "Normal range" bracketed, and a clear "Your result" callout above the marker.
- Every element must be clearly readable by a non-medical patient.
- Start your response with <div and end with </div>`

      : `Create a clean, patient-friendly SVG medical illustration for: "${description}"

Rules:
- ACCURACY (critical): use ONLY the exact numbers, units, and structure/label names in the description above — never invent, round, or change a value, and never add a number the description did not state. Draw exactly the structure/measurement named; do NOT substitute or relabel it as a related concept (e.g., never draw "wall thickness" when the description is a chamber's internal diameter). If no number is given, show it qualitatively.
- Output ONLY the raw SVG, starting with <svg and ending with </svg>. No markdown, no code fences, no prose.
- viewBox="0 0 520 340" width="100%" height="auto"
- KEEP IT COMPACT — aim for a clear, readable brochure-style figure, NOT an exhaustively detailed one. Use simple shapes and smooth <path> curves. You do NOT need a gradient on every element — one or two <linearGradient> defs are plenty. Favor clarity over realism, and keep the whole SVG well under 3000 tokens so it is never cut off.
- Draw and label every structure named in the description. Thin leader lines (1px #546e7a) to labels placed in clear space so they don't overlap structures; font-weight="600", font-size 11-12 for names.
- Highlight any injury/problem area with a dashed red outline (#ef5350) and a light red fill (#ef535033).
- Palette: #cfd8dc/#b0bec5 bone, #a5d6a7/#66bb6a muscle, #ef5350 injury, #1e88e5/#42a5f5 fluid/joint, #ffcc80 cartilage, #37474f text, #546e7a secondary.
- Short <text> title top-left (font-size 13, font-weight 700, #37474f). All styles inline — no CSS classes, no <style> blocks.`;

    let text = '';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const msg = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          // SVG/HTML output: 1500 truncated it (no closing tag → regex failed).
          // 8000 gives ample headroom; the prompts above are bounded to stay well under.
          max_tokens: 8000,
          messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
        });
        text = (msg.content.find(i => i.type === 'text')?.text || '').trim();
        break;
      } catch (retryErr) {
        if (attempt === 3) throw retryErr;
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }

    if (isDataViz) {
      const match = text.match(/<div[\s\S]*<\/div>/i);
      if (!match) throw new Error('Model did not return a <div> element');
      res.json({ html: match[0], type: 'html' });
    } else {
      const match = text.match(/<svg[\s\S]*<\/svg>/i);
      if (!match) throw new Error('Model did not return an <svg> element');
      res.json({ html: match[0], type: 'svg' });
    }

  } catch (error) {
    console.error('Diagram generation error:', error);
    res.status(500).json({ error: 'Could not generate diagram. Please try again.' });
  }
});

module.exports = router;
