const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// SHARED
// ════════════════════════════════════════════════════════════
const PERSONALITY = `Kitchen problem solver and culinary guide. Help cooks navigate substitutions, scaling, timing, and equipment gaps. Be practical: what actually works vs what cooking blogs claim. Honest about when a substitution changes the dish and when it doesn't.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`

function parseBase64Image(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) return { base64Data: dataUrl, mediaType: 'image/jpeg' };
  const base64Data = dataUrl.substring(commaIndex + 1);
  const mimeMatch = dataUrl.substring(0, commaIndex).match(/data:(image\/[a-zA-Z0-9.+-]+);base64/);
  const mediaType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  return { base64Data, mediaType };
}

// ════════════════════════════════════════════════════════════
// POST /recipe-chaos-solver — Main rescue endpoint
// ════════════════════════════════════════════════════════════
router.post('/recipe-chaos-solver', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      recipeContext,
      recipeImageBase64,
      pantryImageBase64,
      disasterImageBase64,
      problemCategory,
      problemDescription,
      missingIngredient,
      availableSubstitutes,
      availableIngredients,
      dietaryRestrictions,
      cookingSkill,
      timePressure,
      embraceChaos,
      userLanguage,
    } = req.body;

    if (!recipeContext && !problemDescription && !availableIngredients && !recipeImageBase64 && !pantryImageBase64 && !disasterImageBase64) {
      return res.status(400).json({ error: 'Describe what you\'re making or the problem' });
    }

    // Build multi-modal content blocks
    const contentBlocks = [];
    let hasRecipeImage = false;
    let hasPantryImage = false;
    let hasDisasterImage = false;

    if (recipeImageBase64) {
      const parsed = parseBase64Image(recipeImageBase64);
      if (parsed && parsed.base64Data && parsed.base64Data.length > 100) {
        hasRecipeImage = true;
        contentBlocks.push({
          type: 'image',
          source: { type: 'base64', media_type: parsed.mediaType, data: parsed.base64Data }
        });
        contentBlocks.push({
          type: 'text',
          text: 'IMPORTANT: The image above is the recipe. Read it carefully — extract ingredients and instructions, then use them as the basis for your advice.'
        });
      }
    }

    if (pantryImageBase64) {
      const parsed = parseBase64Image(pantryImageBase64);
      if (parsed && parsed.base64Data && parsed.base64Data.length > 100) {
        hasPantryImage = true;
        contentBlocks.push({
          type: 'image',
          source: { type: 'base64', media_type: parsed.mediaType, data: parsed.base64Data }
        });
        contentBlocks.push({
          type: 'text',
          text: 'IMPORTANT: This is the user\'s pantry/fridge. Identify ALL visible ingredients and list them in "pantry_items_identified". Use these for substitution suggestions.'
        });
      }
    }

    if (disasterImageBase64) {
      const parsed = parseBase64Image(disasterImageBase64);
      if (parsed && parsed.base64Data && parsed.base64Data.length > 100) {
        hasDisasterImage = true;
        contentBlocks.push({
          type: 'image',
          source: { type: 'base64', media_type: parsed.mediaType, data: parsed.base64Data }
        });
        contentBlocks.push({
          type: 'text',
          text: 'CRITICAL: This photo shows the CURRENT STATE of the food — what went wrong. Examine it carefully. Diagnose the problem from what you see: color, texture, consistency, separation, burning, etc. Use your diagnosis to provide the most accurate rescue advice. Include your visual diagnosis in the response.'
        });
      }
    }

    const systemPrompt = `${PERSONALITY}

PROBLEM-SOLVING APPROACH:

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `RESCUE THIS:
${hasRecipeImage ? 'Recipe: See photo above — extract the recipe from the image' : `Recipe/Dish: ${recipeContext || 'Not specified'}`}
${hasPantryImage ? 'Available ingredients: See pantry photo above' : (availableIngredients ? `Available ingredients: ${availableIngredients}` : '')}
${hasDisasterImage ? 'DISASTER PHOTO: See photo above — diagnose what went wrong from the visual evidence' : ''}
Problem category: ${problemCategory || 'general'}
Problem: ${problemDescription || 'General help needed'}
${missingIngredient ? `Missing ingredient: ${missingIngredient}` : ''}
${availableSubstitutes ? `Potential substitutes on hand: ${availableSubstitutes}` : ''}
Dietary restrictions: ${dietaryRestrictions || 'None'}
Cooking skill: ${cookingSkill || 'beginner'}
${timePressure ? `TIME PRESSURE: ${timePressure}` : ''}
Embrace chaos mode: ${embraceChaos ? 'YES — turn mistakes into intentional new dishes' : 'No'}

Return ONLY valid JSON:
{
  "immediate_action": "Do this RIGHT NOW — one sentence" or null,
  "safety_warning": "Safety concern — one sentence" or null,
  ${hasDisasterImage ? '"visual_diagnosis": "What you can see in the disaster photo — describe the problem you\'re observing and what likely caused it — 1-2 sentences",' : ''}
  "success_probability": 85,
  "difficulty": "easy|moderate|advanced",
  ${hasPantryImage ? '"pantry_items_identified": ["every item visible in the pantry photo"],' : ''}
  "recipes": [
    {
      "name": "Solution name — 3-6 words",
      "description": "What this produces — 1-2 sentences",
      "swap_quality": "excellent swap|will work but flavor differs|emergency only" or null,
      "ingredients_used": ["ingredient with amount"],
      "missing_staples": ["basic items needed"],
      "time": "estimated time — one sentence",
      "difficulty": "easy|moderate|advanced",
      "success_probability": 85,
      "instructions": ["Step 1", "Step 2"],
      "explanation": "WHY this works — cooking science in plain English — 1-2 sentences",
      "tips": "Helpful tip — one sentence",
      "preventive_tip": "How to avoid this next time — one sentence",
      "what_if_you_dont_have": "Additional substitution options — one sentence"
    }
  ],
  ${embraceChaos ? '"chaos_alternative": { "new_dish_name": "Creative name — 3-6 words", "description": "How to turn this mistake into something delicious — 1-2 sentences", "instructions": ["Steps"] },' : ''}
  "ingredients_not_used": ["leftover ingredients"],
  "meal_plan_suggestion": "How to use remaining ingredients — one sentence"
}

Provide 1-3 solutions. Be HONEST if dish can't be saved. success_probability must be integer 0-100.`;

    contentBlocks.push({ type: 'text', text: userPrompt });

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: contentBlocks }],
    }, { label: 'recipe-chaos-solver' });
    if (!parsed.immediate_action) {
      return res.status(500).json({ error: 'Could not rescue your recipe. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('RecipeChaosSolver error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /recipe-chaos-solver/swap — Quick substitution lookup
// ════════════════════════════════════════════════════════════
router.post('/recipe-chaos-solver/swap', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { ingredient, recipeContext, dietaryRestrictions, userLanguage } = req.body;

    if (!ingredient?.trim()) {
      return res.status(400).json({ error: 'What ingredient do you need to swap?' });
    }

    const systemPrompt = `${PERSONALITY}

Substitution expert. For each swap: the ingredient's function (binding/leavening/flavor/moisture/structure), why substitutes work, exact ratios, honest quality rating.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `QUICK SWAP: "${ingredient}"
${recipeContext ? `In the context of: ${recipeContext}` : 'General cooking context'}
${dietaryRestrictions ? `Dietary: ${dietaryRestrictions}` : ''}

Return ONLY valid JSON:
{
  "ingredient": "${ingredient}",
  "function_in_cooking": "What this ingredient does (binding, leavening, fat, moisture, flavor, structure, acid, sweetener, thickener, etc.) — one sentence",
  "swaps": [
    {
      "name": "Substitute name — 3-6 words",
      "ratio": "Exact ratio (e.g., 1 egg = 1/4 cup applesauce) — one sentence",
      "quality": "excellent|good|workable|emergency",
      "best_for": "What dishes this works best in — one sentence",
      "avoid_in": "What dishes to avoid this in — one sentence" or null,
      "science": "One sentence — why this works chemically/physically",
      "notes": "Any technique adjustment needed — one sentence"
    }
  ],
  "pro_tip": "One expert-level insight about this ingredient's role — one sentence",
  "common_mistake": "What people usually get wrong when substituting this — one sentence"
}

List 3-5 swaps ranked from best to worst. Be specific about ratios.`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'recipe-chaos-solver-2' });
    if (!parsed.ingredient) {
      return res.status(500).json({ error: 'Could not rescue your recipe. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('RecipeChaosSolver swap error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /recipe-chaos-solver/multi-swap — Multiple ingredient swap
// ════════════════════════════════════════════════════════════
router.post('/recipe-chaos-solver/multi-swap', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { ingredients, recipeContext, dietaryRestrictions, userLanguage } = req.body;

    if (!ingredients?.length || ingredients.length < 2) {
      return res.status(400).json({ error: 'List at least 2 missing ingredients' });
    }

    const systemPrompt = `${PERSONALITY}

Multi-ingredient substitution. Consider the combined effect — substitutions interact. Recommend a coherent strategy that works as a system, not just individual swaps.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `MULTI-SWAP: I'm missing ALL of these:
${ingredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n')}

${recipeContext ? `Recipe context: ${recipeContext}` : 'General cooking context'}
${dietaryRestrictions ? `Dietary: ${dietaryRestrictions}` : ''}

Return ONLY valid JSON:
{
  "missing_count": ${ingredients.length},
  "combined_impact": "What losing all these ingredients at once does to the dish — the compound effect — one sentence",
  "strategy": "Overall substitution strategy — how to approach replacing all of these together — one sentence",
  "feasibility": "doable|tricky|risky|abandon ship",
  "feasibility_note": "Honest assessment of whether this will work — one sentence",
  "swaps": [
    {
      "original": "Missing ingredient — one sentence",
      "substitute": "What to use instead — one sentence",
      "ratio": "Exact ratio — one sentence",
      "quality": "excellent|good|workable|emergency",
      "interaction_note": "How this swap interacts with the OTHER swaps — critical adjustments — one sentence"
    }
  ],
  "combined_adjustments": [
    "Technique or timing changes needed because of the combined substitutions"
  ],
  "expected_result": "Honest description of how the final dish will differ from the original — one sentence",
  "pro_tip": "Expert insight for managing multi-substitution cooking — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'recipe-chaos-solver-3' });
    if (!parsed.missing_count) {
      return res.status(500).json({ error: 'Could not rescue your recipe. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('RecipeChaosSolver multi-swap error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /recipe-chaos-solver/scale — Recipe scaling with science
// ════════════════════════════════════════════════════════════
router.post('/recipe-chaos-solver/scale', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { recipeText, originalServings, targetServings, userLanguage } = req.body;

    if (!recipeText?.trim()) {
      return res.status(400).json({ error: 'Paste your recipe to scale' });
    }
    if (!originalServings || !targetServings) {
      return res.status(400).json({ error: 'Need original and target servings' });
    }

    const systemPrompt = `${PERSONALITY}

Scale this recipe. Not everything is linear — spices/salt and leavening at ~70-80%, cooking times may shift, pan sizes may change, eggs round to whole. Flag anything non-linear.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `SCALE THIS RECIPE:
${recipeText}

Original servings: ${originalServings}
Target servings: ${targetServings}
Scale factor: ${(targetServings / originalServings).toFixed(2)}x

Return ONLY valid JSON:
{
  "original_servings": ${originalServings},
  "target_servings": ${targetServings},
  "scale_factor": ${(targetServings / originalServings).toFixed(2)},
  "scaled_ingredients": [
    {
      "original": "Original amount + ingredient — one sentence",
      "scaled": "New amount + ingredient — one sentence",
      "note": "Any non-linear adjustment explanation — one sentence" or null
    }
  ],
  "timing_changes": ["Any cooking time adjustments needed"] or [],
  "equipment_notes": ["Pan size changes, batch splitting, etc."] or [],
  "warnings": ["Things that don't scale well in this recipe"] or [],
  "pro_tip": "One expert tip for scaling this type of recipe — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'recipe-chaos-solver-4' });
    if (!parsed.original_servings) {
      return res.status(500).json({ error: 'Could not rescue your recipe. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('RecipeChaosSolver scale error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /recipe-chaos-solver/preflight — Pre-cook readiness check
// ════════════════════════════════════════════════════════════
router.post('/recipe-chaos-solver/preflight', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { recipeText, availableIngredients, equipment, skillLevel, savedSwaps, userLanguage } = req.body;

    if (!recipeText?.trim()) {
      return res.status(400).json({ error: 'Paste or describe your recipe' });
    }

    const systemPrompt = `${PERSONALITY}

Pre-flight check: catch every real problem before cooking starts. Flag genuine issues, not theoretical ones.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `PRE-FLIGHT CHECK:
Recipe: ${recipeText}
What I have: ${availableIngredients || 'not specified'}
Equipment: ${equipment || 'standard kitchen'}
Skill level: ${skillLevel || 'beginner'}
${savedSwaps?.length ? `My saved substitutes:\n${savedSwaps.map(s => `• ${s}`).join('\n')}` : ''}

Return ONLY valid JSON:
{
  "recipe_name": "What they're making — 3-6 words",
  "readiness": "READY|ALMOST|MISSING CRITICAL|NOT FEASIBLE",
  "readiness_emoji": "✅|🟡|🔴|🚫",
  "ingredient_check": [
    {
      "ingredient": "ingredient name — one sentence",
      "status": "have|missing|unclear",
      "critical": true or false,
      "substitute": "suggested substitute if missing — one sentence" or null,
      "from_saved": true or false,
      "sub_ratio": "ratio if substitute given — one sentence" or null
    }
  ],
  "equipment_check": [
    {"item": "equipment needed — one sentence", "status": "have|missing|alternative", "alternative": "what to use instead — one sentence" or null}
  ],
  "technique_warnings": [
    {"technique": "technique name — one sentence", "difficulty": "easy|moderate|tricky", "tip": "Quick explanation for their skill level — one sentence"}
  ],
  "time_estimate": {
    "recipe_says": "what recipe claims — one sentence",
    "realistic": "actual time including prep — one sentence",
    "note": "Why the difference — one sentence"
  },
  "pro_tips": ["1-3 tips specific to this recipe that prevent common mistakes"],
  "go_no_go": "Final honest assessment — should they proceed? — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'recipe-chaos-solver-5' });
    if (!parsed.recipe_name) {
      return res.status(500).json({ error: 'Could not rescue your recipe. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('RecipeChaosSolver preflight error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /recipe-chaos-solver/flavor-fix — Upgrade bland food
// ════════════════════════════════════════════════════════════
router.post('/recipe-chaos-solver/flavor-fix', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { dish, whatsWrong, availableIngredients, dietaryRestrictions, userLanguage } = req.body;

    if (!dish?.trim()) {
      return res.status(400).json({ error: 'What dish needs fixing?' });
    }

    const systemPrompt = `${PERSONALITY}

Flavor consultant. Diagnose what's missing: acid, fat, salt, heat, umami, sweetness, texture, aromatics. Specific fixes with what they have. Chef tasting a dish: confident, specific.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `FLAVOR FIX:
Dish: "${dish}"
What's wrong: "${whatsWrong || 'It just tastes... meh'}"
Available ingredients: ${availableIngredients || 'standard kitchen staples'}
${dietaryRestrictions ? `Dietary: ${dietaryRestrictions}` : ''}

Return ONLY valid JSON:
{
  "diagnosis": "What's actually missing — the flavor gap — 1-2 sentences",
  "flavor_profile": {
    "needs_more": ["acid|fat|salt|heat|umami|sweetness|texture|aromatics"],
    "explanation": "Why this dish tastes flat — the science — 1-2 sentences"
  },
  "quick_fixes": [
    {
      "fix": "What to add/do — one sentence",
      "amount": "How much (number)",
      "when": "When to add it (now, while cooking, at the table) — one sentence",
      "impact": "high|medium|subtle",
      "why": "Chef trick explanation in one sentence"
    }
  ],
  "the_move": "The single best thing to do right now — if they only do one fix, do this one — one sentence",
  "chef_trick": "One insider technique that elevates this specific dish — one sentence",
  "do_not": "The one thing people do that makes this WORSE — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'recipe-chaos-solver-6' });
    if (!parsed.diagnosis) {
      return res.status(500).json({ error: 'Could not rescue your recipe. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('RecipeChaosSolver flavor-fix error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /recipe-chaos-solver/teach — Turn a rescue into a lesson
// ════════════════════════════════════════════════════════════
router.post('/recipe-chaos-solver/teach', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { rescueContext, rescueType, userLanguage } = req.body;

    if (!rescueContext?.trim()) {
      return res.status(400).json({ error: 'What rescue should I teach about?' });
    }

    const systemPrompt = `${PERSONALITY}

Turn the rescue into a 60-second lesson. Teach WHY it worked. Concise, memorable, analogies.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `TEACH ME — 60-second lesson:
What happened: ${rescueContext}
Type: ${rescueType || 'general'}

Return ONLY valid JSON:
{
  "lesson_title": "Short memorable title (e.g., 'Why Eggs Do 3 Jobs') — 3-6 words",
  "lesson_emoji": "🎓",
  "the_principle": "The underlying cooking principle in 1-2 sentences — the 'aha' moment",
  "analogy": "A non-cooking analogy that makes it click — one sentence",
  "the_rule": "A simple rule they can remember forever (e.g., 'Fat carries flavor. No fat = no flavor.') — one sentence",
  "apply_it": [
    "2-3 other situations where this same principle applies"
  ],
  "common_myth": "One thing people believe about this that's wrong — one sentence",
  "next_experiment": "One thing they can try next time to deepen this understanding — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'recipe-chaos-solver-7' });
    if (!parsed.lesson_title) {
      return res.status(500).json({ error: 'Could not rescue your recipe. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('RecipeChaosSolver teach error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
