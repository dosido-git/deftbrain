const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/doctor-visit-translator', async (req, res) => {
  try {
    const { doctorNotes, visitType, concerns, currentMedications } = req.body;

    // Validation
    if (!doctorNotes || !doctorNotes.trim()) {
      return res.status(400).json({ error: 'Doctor notes or visit summary is required' });
    }

    const concernsContext = concerns ? `\n\nPATIENT'S MAIN CONCERNS: ${concerns}` : '';
    const medsContext = currentMedications ? `\n\nCURRENT MEDICATIONS: ${currentMedications}` : '';

    const prompt = `You are a medical interpreter helping patients understand their doctor visits. Translate medical jargon into clear, understandable language WITHOUT oversimplifying or losing important details.

VISIT TYPE: ${visitType}
DOCTOR'S NOTES/VISIT SUMMARY:
${doctorNotes}${concernsContext}${medsContext}

CRITICAL RULES:
1. Use clear, plain English but maintain medical accuracy
2. Never contradict the doctor's instructions
3. Include ALL important details
4. Identify red flags and urgent action items
5. Empower the patient to ask good questions
6. Provide medication safety information
7. Include second opinion guidance when appropriate
8. Focus on what patient needs to DO and UNDERSTAND

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
      "visual_aid_suggestion": "Brief description of diagram that would help (e.g., 'Diagram showing blood flow through heart' or 'Cross-section of affected joint')"
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
      "priority": "high" | "medium" | "low"
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
    "when_to_call_pharmacist": ["Specific scenarios requiring pharmacist consultation"]
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
    "when_appropriate": "Situations where second opinion is reasonable (e.g., 'Major surgery recommended', 'Unclear diagnosis', 'Not improving with treatment', or 'Not applicable for routine care')",
    "how_to_request_records": "Steps: Call office, request medical records, may need to fill form, usually small fee, legally entitled within 30 days",
    "what_to_say": "Exact phrase: 'I'd like to get a second opinion. Can you send my records to [other doctor]? I'm not leaving your care, just want another perspective.'",
    "not_offensive": "Reassurance that good doctors support second opinions for major decisions"
  },
  
  "patient_advocacy": {
    "if_you_disagree": "How to respectfully disagree: 'I understand your recommendation. Can you help me understand why this is the best option? Are there alternatives we could discuss?'",
    "ask_for_clarification": "It's okay to say: 'Can you explain that in simpler terms?' or 'I'm not sure I understand - can you draw a picture or use a metaphor?'",
    "bring_support": "You can bring someone to appointments to take notes and ask questions",
    "get_it_in_writing": "Ask for: written instructions, medication list, test results, treatment plan"
  },
  
  "insurance_navigation": {
    "likely_coverage": "Based on visit type, what insurance typically covers (e.g., 'Preventive care usually covered 100%', 'Specialist visits have copay', 'Medications need prescription coverage check')",
    "prior_authorization": "If expensive tests/treatments/meds mentioned: 'May require prior authorization - ask office to submit before appointment'",
    "appeal_process": "If denied: '1. Get denial reason in writing, 2. Doctor writes letter of medical necessity, 3. Submit appeal within timeline on denial letter, 4. Escalate to state insurance commissioner if needed'",
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

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4500,
      messages: [{role: 'user', content: prompt}]
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
      results = JSON.parse(jsonText);
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


module.exports = router;
