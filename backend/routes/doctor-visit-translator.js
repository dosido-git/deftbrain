const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

router.post('/doctor-visit-translator', rateLimit(), async (req, res) => {
  try {
    const {
      doctorNotes, visitType, concerns, currentMedications,
      language, documentType, knownMedications, pdfData
    } = req.body;

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

Return ONLY this JSON structure (NO markdown):

{
  "plain_english_summary": {
    "diagnosis": "In simple terms, what condition or issue (or 'No specific diagnosis mentioned')",
    "treatment_plan": "What patient needs to do - specific and actionable",
    "prognosis": "What to expect - realistic but not scary",
    "timeline": "When to see improvement or next steps"
  },
  
  "medical_terms_explained": [
    {
      "term": "Medical term",
      "definition": "Clear explanation",
      "what_it_means_for_you": "Personal impact",
      "visual_aid_suggestion": "Brief description of diagram that would help"
    }
  ],
  
  "visual_aids_recommended": {
    "body_diagram_description": "What body parts/systems are affected and what diagram would help visualize this",
    "treatment_timeline": "Step-by-step timeline visualization: Week 1: X, Week 2-4: Y, Month 2-3: Z",
    "medication_schedule": "Daily schedule if multiple meds (e.g., 'Morning: X, Afternoon: Y, Evening: Z with food')",
    "test_results_visualization": "How to visualize test results (e.g., 'Your cholesterol 240 on scale from 0-300, normal is <200')"
  },
  
  "action_checklist": [
    {
      "action": "Specific task",
      "why": "Why this matters",
      "when": "Specific timing",
      "how": "Step-by-step instructions",
      "what_if_you_dont": "Realistic consequences of not doing this",
      "priority": "high" | "medium" | "low",
      "due_in_days": 7
    }
  ],
  
  "medications": [
    {
      "name": "Medication name and dose",
      "purpose": "What it does in plain English",
      "how_to_take": "Exact instructions with timing",
      "side_effects_to_watch": ["Important side effects"],
      "interactions_to_check": ["What to ask pharmacist about interactions"],
      "generic_available": "Yes/No and generic name if applicable",
      "cost_considerations": "Typical cost range or 'Ask pharmacist about generic/discount programs'",
      "questions_to_ask_pharmacist": ["Specific questions"]
    }
  ],
  
  "medication_safety": {
    "interaction_warnings": "If current medications mentioned, check for potential interactions. If none mentioned, say 'Make sure to tell your pharmacist about ALL medications, supplements, and vitamins you take'",
    "timing_conflicts": "If multiple meds, note any timing issues (e.g., 'Take thyroid med 30 min before other meds')",
    "food_interactions": "Foods or drinks to avoid with these medications",
    "when_to_call_pharmacist": ["Specific scenarios requiring pharmacist consultation"],
    "known_med_interactions": "If known medications were provided, list specific potential interactions between existing and new medications here. Be specific: 'Lisinopril + Metformin: both affect kidney function - ensure regular kidney monitoring' or 'No significant interactions detected between your current medications and new prescriptions'"
  },
  
  "test_results_explained": [
    {
      "test": "Test name",
      "your_result": "Patient's value",
      "normal_range": "Normal range",
      "what_it_means": "Interpretation",
      "trend": "If applicable: improving, stable, or worsening",
      "next_steps": "What happens based on this result"
    }
  ],
  
  "follow_up_requirements": {
    "next_appointment": "When to schedule",
    "what_to_monitor": ["Symptoms to track"],
    "warning_signs_immediate": ["Call doctor immediately if..."],
    "warning_signs_soon": ["Call within 24-48 hours if..."],
    "expected_results_timeline": "When you should see improvement (and when to worry if you don't)",
    "what_to_bring_next_time": ["Items or information to bring to follow-up"]
  },
  
  "questions_for_next_visit": [
    "Specific questions based on this visit",
    "Focus on gaps in understanding or next steps"
  ],
  
  "second_opinion_guidance": {
    "when_appropriate": "Situations where second opinion is reasonable or 'Not applicable for routine care'",
    "how_to_request_records": "Steps to request medical records",
    "what_to_say": "Exact phrase to use when requesting second opinion",
    "not_offensive": "Reassurance that good doctors support second opinions"
  },
  
  "patient_advocacy": {
    "if_you_disagree": "How to respectfully disagree",
    "ask_for_clarification": "How to ask for simpler explanation",
    "bring_support": "Encouragement to bring support person",
    "get_it_in_writing": "What to ask for in writing"
  },
  
  "insurance_navigation": {
    "likely_coverage": "Based on visit type, what insurance typically covers",
    "prior_authorization": "If applicable, prior authorization guidance",
    "appeal_process": "Steps if claim is denied",
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

    // Build message content — when a PDF is present, send it as a native document
    // The text prompt comes first so Claude reads the instructions before the document
    const userContent = pdfData
      ? [
          { type: 'text', text: prompt },
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: pdfData },
          },
        ]
      : prompt;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 5000,
      messages: [{ role: 'user', content: withLanguage(userContent, userLanguage) }]
    });

    let jsonText = message.content[0].text.trim();
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON found in AI response');
    }
    
    jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
    
    let results;
    try {
      results = JSON.parse(cleanJsonResponse(jsonText));
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError.message);
      const pos = parseInt(parseError.message.match(/position (\d+)/)?.[1] || '0');
      if (pos > 0) {
        console.error('Context:', jsonText.substring(Math.max(0, pos - 100), Math.min(jsonText.length, pos + 100)));
      }
      throw new Error(`JSON parse failed: ${parseError.message}`);
    }

    if (!results.plain_english_summary) {
      throw new Error('Invalid response structure');
    }

    res.json(results);

  } catch (error) {
    console.error('Doctor Visit Translator error:', error);
    res.status(500).json({
      error: 'Failed to translate medical information',
      details: error.message
    });
  }
});

// ── Diagram generator ─────────────────────────────────────────────────────────
router.post('/generate-diagram', rateLimit(), async (req, res) => {
  try {
    const { description, diagramType } = req.body;
    if (!description?.trim()) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const isDataViz = ['treatment_timeline', 'medication_schedule', 'test_results_visualization'].includes(diagramType);

    const prompt = isDataViz
      ? `Create a polished HTML visual for a patient based on this description:

"${description}"

Rules:
- Output ONLY a single self-contained <div> element — no explanation, no markdown, no code fences
- No <html>, <body>, <head>, or <script> tags. No external resources. Inline styles only.
- Width 100%, height auto. Clean sans-serif font, 13px base.
- Color palette: #1565c0 dark blue, #1e88e5 mid blue, #42a5f5 light blue, #43a047 green, #ef5350 red, #ffb74d amber, #546e7a gray, #37474f dark text, #eceff1 very light bg, white
- For timelines: a vertical timeline — large numbered circles (32px, filled #1e88e5, white number) connected by a 2px #90caf9 line, each step has a bold title and 1-2 lines of description. Good whitespace.
- For medication schedules: a styled table or card grid grouped by time of day. Each row has a time label badge on the left and medication name(s) on the right. Use light color backgrounds per row.
- For test result scales: a horizontal gradient bar (green→amber→red) 400px wide, with a triangle marker showing patient value, numeric ticks below, "Normal range" bracketed, and a clear "Your result" callout above the marker.
- Every element must be clearly readable by a non-medical patient.
- Start your response with <div and end with </div>`

      : `Create a detailed, realistic SVG medical illustration for a patient based on this description:

"${description}"

Requirements:
- Output ONLY the raw SVG — nothing else, no explanation, no markdown, no code fences
- Start with <svg and end with </svg>
- viewBox="0 0 520 340" width="100%" height="auto"
- Define a <defs> block with linearGradient elements for 3D shading on anatomical structures
- Anatomical accuracy: draw structures with realistic proportions and curvature using <path> elements with bezier curves, not just rectangles/circles
- Shading: use gradients on every filled structure to give a 3D/rounded appearance. Bones should look cylindrical, muscles should look rounded and fleshy.
- Injury/problem areas: use a dashed red ellipse outline with a semi-transparent red fill (#ef535033) to highlight damage. Add small jagged lines inside to suggest tissue disruption.
- Labels: use leader lines (thin 1px #546e7a lines from structure to label text). Labels must NOT overlap structures. Place labels in clear space. Use font-weight="600" for structure names.
- Color palette: #cfd8dc/#b0bec5 bone with gradient shading, #a5d6a7/#66bb6a muscle/tendon green with gradient, #ef5350 injury red, #1e88e5/#42a5f5 joint/fluid blue, #ffcc80 cartilage amber, #37474f dark text, #546e7a secondary text
- Title: include a <text> element at top-left, font-size="13" font-weight="700" fill="#37474f" with a short descriptive title
- All styles inline — no CSS classes, no <style> blocks
- Every structure named in the description must be drawn and labeled
- The illustration should look like something from a patient-education brochure, not a programmer's sketch`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3500,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) }],
    });

    const text = message.content[0]?.text?.trim() || '';

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
    res.status(500).json({ error: 'Failed to generate diagram', details: error.message });
  }
});

module.exports = router;
