const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

router.post('/pet-weirdness-decoder', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  console.log('✅ Pet Weirdness Decoder endpoint called');

  try {
    const { petType, breed, age, behavior, duration, frequency, otherChanges, imageBase64, currentMeds, recentDietChanges, seasonalContext, userLanguage } = req.body;

    if (!petType) return res.status(400).json({ error: 'Pet type is required' });
    if (!age || age < 0) return res.status(400).json({ error: 'Valid age is required' });
    if (!behavior || behavior.trim().length < 20) return res.status(400).json({ error: 'Describe the behavior in detail (20+ characters)' });

    const otherChangesText = otherChanges?.length > 0 ? `Yes: ${otherChanges.join(', ')}` : 'None noted';

    const prompt = `Pet behavior expert. Analyze this pet's unusual behavior.

PET: ${petType} · ${breed || 'breed unknown'} · ${age}y
BEHAVIOR: ${behavior}
DURATION: ${duration} · FREQUENCY: ${frequency}
OTHER CHANGES: ${otherChangesText}
${currentMeds ? `CURRENT MEDICATIONS: ${currentMeds}` : ''}
${recentDietChanges ? `RECENT DIET CHANGES: ${recentDietChanges}` : ''}
${seasonalContext ? `SEASONAL CONTEXT: ${seasonalContext}` : ''}
${imageBase64 ? '\nPhoto attached — analyze visible signs, posture, skin, swelling, or other visual indicators.' : ''}

URGENCY RULES:
- vet_now 🚨: Breathing difficulty, seizures, bloat+retching, toxin ingestion, unable to urinate (esp male cats), collapse, pale gums, severe pain, bleeding
- vet_soon ⚠️: Persistent scratching/licking, limping >24h, appetite loss days, new lumps, eye discharge, coughing, behavior+symptom combo
- monitor 🤔: Unusual but no other symptoms, recent onset, stress/boredom
- not_urgent 😂: Breed/age-typical, no medical concern, quirky

ESCALATION: Multiple other changes = raise urgency. Senior pets with new behaviors = vet_soon minimum.

MEDICATION AWARENESS: If medications listed, consider drug side effects, interactions, or withdrawal as possible causes. Common: appetite changes from steroids, lethargy from antihistamines, GI issues from NSAIDs, behavioral changes from anti-anxiety meds.

DIET AWARENESS: Recent food changes can cause GI issues, allergies, behavioral changes from nutritional shifts. Grain-free diets linked to DCM in some breeds.

SEASONAL AWARENESS: If seasonal context provided, factor in environmental risks (allergies, toxins, temperature, parasites).

BREED: Herding (staring, nipping); Hounds (baying); Terriers (digging); Retrievers (carrying); Brachycephalic (breathing MORE concerning); Toy (shaking not always fear). Cats: Siamese (vocal); Maine Coon (chirping); Bengal (energy); Ragdoll (limp). Universal cat: zoomies, chattering, kneading, bunting.

LIFE STAGES: Puppy/Kitten (<1y) zoomies normal; Adolescent (1-2y) boundary testing; Adult (2-7y) sudden change = investigate; Senior (7+) cognitive decline possible.

Return ONLY this JSON:
{
  "behavior_analysis": { "behavior_category": "string", "urgency_level": "not_urgent|monitor|vet_soon|vet_now", "urgency_emoji": "😂|🤔|⚠️|🚨" },
  "breed_specific_info": { "is_breed_typical": bool, "breed_explanation": "...", "common_breed_behaviors": ["..."], "genetic_predispositions": ["..."] },
  "life_stage_context": { "life_stage": "string", "age_appropriate": bool, "stage_explanation": "...", "age_context": "..." },
  "most_likely_explanation": { "what_it_is": "...", "why_they_do_it": "..." },
  "how_common": "A sentence about how common this behavior is among this breed/species. Include approximate percentage or frequency if reasonable, e.g. 'Very common — most Golden Retriever owners report this at some point' or 'Relatively uncommon — worth monitoring'.",
  "other_possibilities": [{ "explanation": "...", "likelihood": "high|medium|low", "signs_that_suggest_this": ["..."] }],
  "when_to_worry": { "red_flags": ["..."], "timeline": "..." },
  "vet_visit_prep": { "questions_to_ask": ["..."], "what_to_observe": ["..."], "documentation_tips": "..." },
  "if_its_just_quirky": { "why_normal": "...", "enrichment_suggestions": ["..."], "enjoy_it": "..." },
  "behavioral_modification": [{ "if_you_want_to_change_it": "...", "how": "...", "patience_required": "..." }],
  "similar_pet_stories": "string or null"
}`;

    const systemPrompt = withLanguage(
      'You are a compassionate pet behavior expert. Return ONLY valid JSON. Be warm but medically responsible. Emergency = direct/clear. Quirky = celebratory. If medications or diet changes are mentioned, always consider them as potential causes.',
      userLanguage
    );

    // Build message content — support image
    const content = [];
    if (imageBase64) {
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      const mediaType = imageBase64.includes('image/png') ? 'image/png' : 'image/jpeg';
      content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } });
    }
    content.push({ type: 'text', text: prompt });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: 'user', content }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(textContent);

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const raw = textContent.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const first = raw.indexOf('{'); const last = raw.lastIndexOf('}');
      if (first === -1 || last === -1) throw new Error('No JSON found');
      parsed = JSON.parse(raw.substring(first, last + 1));
    }

    console.log('✅ Analysis:', {
      urgency: parsed.behavior_analysis?.urgency_level,
      hasImage: !!imageBase64,
      hasMeds: !!currentMeds,
      hasDiet: !!recentDietChanges
    });

    res.json(parsed);

  } catch (error) {
    console.error('❌ Pet Weirdness Decoder error:', error.message);
    res.status(500).json({ error: 'Failed to analyze pet behavior. Please try again.' });
  }
});

// ── Follow-up Q&A endpoint ──
router.post('/pet-weirdness-decoder/followup', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  console.log('✅ Pet Weirdness Decoder Follow-Up called');

  try {
    const { question, originalAnalysis, petType, breed, age, behavior, imageBase64, userLanguage } = req.body;

    if (!question || !question.trim()) return res.status(400).json({ error: 'Please provide a question.' });
    if (!originalAnalysis) return res.status(400).json({ error: 'No analysis context. Run an analysis first.' });

    const ctx = [
      `Pet: ${petType || 'Unknown'} · ${breed || 'Mixed'} · ${age || '?'}y`,
      `Original behavior: ${behavior || 'Not specified'}`
    ];
    if (originalAnalysis.behavior_analysis) {
      ctx.push(`Urgency: ${originalAnalysis.behavior_analysis.urgency_level}`);
      ctx.push(`Category: ${originalAnalysis.behavior_analysis.behavior_category}`);
    }
    if (originalAnalysis.most_likely_explanation) {
      ctx.push(`Most likely: ${originalAnalysis.most_likely_explanation.what_it_is}`);
    }
    if (originalAnalysis.when_to_worry?.red_flags?.length) {
      ctx.push(`Red flags: ${originalAnalysis.when_to_worry.red_flags.join('; ')}`);
    }
    if (originalAnalysis.how_common) {
      ctx.push(`Commonality: ${originalAnalysis.how_common}`);
    }

    const systemPrompt = withLanguage(
      `You are a compassionate pet behavior expert. A user already received an analysis and has a follow-up question.

ORIGINAL CONTEXT:
${ctx.join('\n')}

Answer the follow-up based on context. Be specific, practical, warm.
- New symptoms mentioned → update urgency assessment.
- Photo shared → analyze visible signs.
- Keep to 2-4 paragraphs.
- Always include safety note if symptoms could be serious.
- If question is about medications or food, consider interactions/side effects.`,
      userLanguage
    );

    const content = [];
    if (imageBase64) {
      const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      const mediaType = imageBase64.includes('image/png') ? 'image/png' : 'image/jpeg';
      content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } });
    }
    content.push({ type: 'text', text: question.trim() });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content }]
    });

    const answer = message.content.find(item => item.type === 'text')?.text || 'No answer available.';
    console.log('✅ Follow-up answered');
    res.json({ answer: answer.trim() });

  } catch (error) {
    console.error('❌ Follow-up error:', error.message);
    res.status(500).json({ error: 'Failed to answer follow-up question.' });
  }
});

module.exports = router;
