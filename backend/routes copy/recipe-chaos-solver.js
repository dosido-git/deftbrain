const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

// ════════════════════════════════════════════════════════════
// SHARED
// ════════════════════════════════════════════════════════════
const PERSONALITY = `You are a chef friend who is calm in a crisis. You have deep food science knowledge (Maillard reaction, emulsification, gluten development, leavening, protein denaturation, starch gelatinization) but you explain things simply. You're honest when a dish can't be saved. Never condescending. Think fast, explain clearly, save dinner.`;

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
router.post('/recipe-chaos-solver', async (req, res) => {
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

For MISSING INGREDIENTS — analyze THIS recipe's role for the ingredient:
- Structural (eggs bind, flour thickens)
- Flavor (herbs, spices, aromatics)
- Chemical (baking soda for leavening, acid for tenderizing)
- Textural (cream for richness, breadcrumbs for crunch)
Then suggest substitutes that fulfill the SAME FUNCTION with ratio adjustments.

For TECHNIQUE FAILURES — specific rescue steps. Broken sauce: re-emulsify. Overcooked protein: repurpose. Under-risen dough: fix or pivot. Burned: assess salvageability honestly.

For TIMING/TEMPERATURE — adjust cooking parameters based on current state.
For CONSISTENCY — specific thickening/thinning strategies for THIS dish.
For EQUIPMENT MISSING — alternative methods using available tools.
For QUANTITY ERRORS — scaling fixes or repurposing.

SAFETY: If description suggests danger (grease fire, food poisoning risk), include safety_warning.`;

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
  "immediate_action": "Do this RIGHT NOW" or null,
  "safety_warning": "Safety concern" or null,
  ${hasDisasterImage ? '"visual_diagnosis": "What you can see in the disaster photo — describe the problem you\'re observing and what likely caused it",' : ''}
  "success_probability": 85,
  "difficulty": "easy|moderate|advanced",
  ${hasPantryImage ? '"pantry_items_identified": ["every item visible in the pantry photo"],' : ''}
  "recipes": [
    {
      "name": "Solution name",
      "description": "What this produces",
      "swap_quality": "excellent swap|will work but flavor differs|emergency only" or null,
      "ingredients_used": ["ingredient with amount"],
      "missing_staples": ["basic items needed"],
      "time": "estimated time",
      "difficulty": "easy|moderate|advanced",
      "success_probability": 85,
      "instructions": ["Step 1", "Step 2"],
      "explanation": "WHY this works — cooking science in plain English",
      "tips": "Helpful tip",
      "preventive_tip": "How to avoid this next time",
      "what_if_you_dont_have": "Additional substitution options"
    }
  ],
  ${embraceChaos ? '"chaos_alternative": { "new_dish_name": "Creative name", "description": "How to turn this mistake into something delicious", "instructions": ["Steps"] },' : ''}
  "ingredients_not_used": ["leftover ingredients"],
  "meal_plan_suggestion": "How to use remaining ingredients"
}

Provide 1-3 solutions. Be HONEST if dish can't be saved. success_probability must be integer 0-100.`;

    contentBlocks.push({ type: 'text', text: userPrompt });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: contentBlocks }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('RecipeChaosSolver error:', error);
    res.status(500).json({ error: error.message || 'Rescue failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /recipe-chaos-solver/swap — Quick substitution lookup
// ════════════════════════════════════════════════════════════
router.post('/recipe-chaos-solver/swap', async (req, res) => {
  try {
    const { ingredient, recipeContext, dietaryRestrictions, userLanguage } = req.body;

    if (!ingredient?.trim()) {
      return res.status(400).json({ error: 'What ingredient do you need to swap?' });
    }

    const systemPrompt = `${PERSONALITY}

You are the world's best ingredient substitution expert. For every swap, explain:
1. The FUNCTION the original ingredient serves (binding, leavening, flavor, moisture, structure)
2. Why each substitute works or doesn't
3. Exact ratios and any technique adjustments
4. Honest quality rating`;

    const userPrompt = `QUICK SWAP: "${ingredient}"
${recipeContext ? `In the context of: ${recipeContext}` : 'General cooking context'}
${dietaryRestrictions ? `Dietary: ${dietaryRestrictions}` : ''}

Return ONLY valid JSON:
{
  "ingredient": "${ingredient}",
  "function_in_cooking": "What this ingredient does (binding, leavening, fat, moisture, flavor, structure, acid, sweetener, thickener, etc.)",
  "swaps": [
    {
      "name": "Substitute name",
      "ratio": "Exact ratio (e.g., 1 egg = 1/4 cup applesauce)",
      "quality": "excellent|good|workable|emergency",
      "best_for": "What dishes this works best in",
      "avoid_in": "What dishes to avoid this in" or null,
      "science": "One sentence — why this works chemically/physically",
      "notes": "Any technique adjustment needed"
    }
  ],
  "pro_tip": "One expert-level insight about this ingredient's role",
  "common_mistake": "What people usually get wrong when substituting this"
}

List 3-5 swaps ranked from best to worst. Be specific about ratios.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('RecipeChaosSolver swap error:', error);
    res.status(500).json({ error: error.message || 'Swap lookup failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /recipe-chaos-solver/multi-swap — Multiple ingredient swap
// ════════════════════════════════════════════════════════════
router.post('/recipe-chaos-solver/multi-swap', async (req, res) => {
  try {
    const { ingredients, recipeContext, dietaryRestrictions, userLanguage } = req.body;

    if (!ingredients?.length || ingredients.length < 2) {
      return res.status(400).json({ error: 'List at least 2 missing ingredients' });
    }

    const systemPrompt = `${PERSONALITY}

You are handling a MULTI-INGREDIENT substitution. This is harder than single swaps because substitutions INTERACT:
- Removing both eggs AND butter from a cake changes the structure dramatically
- Replacing both cream AND cheese in a sauce means zero dairy fat — texture collapses
- Multiple flour swaps in baking affect gluten development compoundly

You must consider the COMBINED EFFECT, not just individual replacements. Recommend a coherent substitution strategy that works as a system.`;

    const userPrompt = `MULTI-SWAP: I'm missing ALL of these:
${ingredients.map((ing, i) => `${i + 1}. ${ing}`).join('\n')}

${recipeContext ? `Recipe context: ${recipeContext}` : 'General cooking context'}
${dietaryRestrictions ? `Dietary: ${dietaryRestrictions}` : ''}

Return ONLY valid JSON:
{
  "missing_count": ${ingredients.length},
  "combined_impact": "What losing all these ingredients at once does to the dish — the compound effect",
  "strategy": "Overall substitution strategy — how to approach replacing all of these together",
  "feasibility": "doable|tricky|risky|abandon ship",
  "feasibility_note": "Honest assessment of whether this will work",
  "swaps": [
    {
      "original": "Missing ingredient",
      "substitute": "What to use instead",
      "ratio": "Exact ratio",
      "quality": "excellent|good|workable|emergency",
      "interaction_note": "How this swap interacts with the OTHER swaps — critical adjustments"
    }
  ],
  "combined_adjustments": [
    "Technique or timing changes needed because of the combined substitutions"
  ],
  "expected_result": "Honest description of how the final dish will differ from the original",
  "pro_tip": "Expert insight for managing multi-substitution cooking"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('RecipeChaosSolver multi-swap error:', error);
    res.status(500).json({ error: error.message || 'Multi-swap failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /recipe-chaos-solver/scale — Recipe scaling with science
// ════════════════════════════════════════════════════════════
router.post('/recipe-chaos-solver/scale', async (req, res) => {
  try {
    const { recipeText, originalServings, targetServings, userLanguage } = req.body;

    if (!recipeText?.trim()) {
      return res.status(400).json({ error: 'Paste your recipe to scale' });
    }
    if (!originalServings || !targetServings) {
      return res.status(400).json({ error: 'Need original and target servings' });
    }

    const systemPrompt = `${PERSONALITY}

You are scaling a recipe. CRITICAL: Not everything scales linearly.
- Spices/salt: scale at ~70-80% (doubling a recipe does NOT mean double the salt)
- Leavening (baking powder/soda): scale at ~70-80%
- Cooking times: may change (larger volume = longer cook)
- Pan sizes: may need adjustment
- Eggs: round to nearest whole egg
Flag anything that won't scale linearly.`;

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
      "original": "Original amount + ingredient",
      "scaled": "New amount + ingredient",
      "note": "Any non-linear adjustment explanation" or null
    }
  ],
  "timing_changes": ["Any cooking time adjustments needed"] or [],
  "equipment_notes": ["Pan size changes, batch splitting, etc."] or [],
  "warnings": ["Things that don't scale well in this recipe"] or [],
  "pro_tip": "One expert tip for scaling this type of recipe"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('RecipeChaosSolver scale error:', error);
    res.status(500).json({ error: error.message || 'Scaling failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /recipe-chaos-solver/preflight — Pre-cook readiness check
// ════════════════════════════════════════════════════════════
router.post('/recipe-chaos-solver/preflight', async (req, res) => {
  try {
    const { recipeText, availableIngredients, equipment, skillLevel, savedSwaps, userLanguage } = req.body;

    if (!recipeText?.trim()) {
      return res.status(400).json({ error: 'Paste or describe your recipe' });
    }

    const systemPrompt = `${PERSONALITY}

You are doing a PRE-FLIGHT CHECK before the user starts cooking. Your job is to catch every potential problem BEFORE it happens. Be thorough but not paranoid — flag real issues, not theoretical ones. If they have saved substitutes from past sessions, suggest those first.`;

    const userPrompt = `PRE-FLIGHT CHECK:
Recipe: ${recipeText}
What I have: ${availableIngredients || 'not specified'}
Equipment: ${equipment || 'standard kitchen'}
Skill level: ${skillLevel || 'beginner'}
${savedSwaps?.length ? `My saved substitutes:\n${savedSwaps.map(s => `• ${s}`).join('\n')}` : ''}

Return ONLY valid JSON:
{
  "recipe_name": "What they're making",
  "readiness": "READY|ALMOST|MISSING CRITICAL|NOT FEASIBLE",
  "readiness_emoji": "✅|🟡|🔴|🚫",
  "ingredient_check": [
    {
      "ingredient": "ingredient name",
      "status": "have|missing|unclear",
      "critical": true or false,
      "substitute": "suggested substitute if missing" or null,
      "from_saved": true or false,
      "sub_ratio": "ratio if substitute given" or null
    }
  ],
  "equipment_check": [
    {"item": "equipment needed", "status": "have|missing|alternative", "alternative": "what to use instead" or null}
  ],
  "technique_warnings": [
    {"technique": "technique name", "difficulty": "easy|moderate|tricky", "tip": "Quick explanation for their skill level"}
  ],
  "time_estimate": {
    "recipe_says": "what recipe claims",
    "realistic": "actual time including prep",
    "note": "Why the difference"
  },
  "pro_tips": ["1-3 tips specific to this recipe that prevent common mistakes"],
  "go_no_go": "Final honest assessment — should they proceed?"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('RecipeChaosSolver preflight error:', error);
    res.status(500).json({ error: error.message || 'Pre-flight check failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /recipe-chaos-solver/flavor-fix — Upgrade bland food
// ════════════════════════════════════════════════════════════
router.post('/recipe-chaos-solver/flavor-fix', async (req, res) => {
  try {
    const { dish, whatsWrong, availableIngredients, dietaryRestrictions, userLanguage } = req.body;

    if (!dish?.trim()) {
      return res.status(400).json({ error: 'What dish needs fixing?' });
    }

    const systemPrompt = `${PERSONALITY}

You are a flavor consultant. The food isn't ruined — it's just boring, flat, or missing something. Your job is to diagnose WHAT'S MISSING from a flavor perspective (acid, fat, salt, heat, umami, sweetness, texture contrast, aromatics) and give specific, actionable fixes using what they have on hand.

Think like a chef tasting a dish and saying "it needs..." — confident, specific, playful.`;

    const userPrompt = `FLAVOR FIX:
Dish: "${dish}"
What's wrong: "${whatsWrong || 'It just tastes... meh'}"
Available ingredients: ${availableIngredients || 'standard kitchen staples'}
${dietaryRestrictions ? `Dietary: ${dietaryRestrictions}` : ''}

Return ONLY valid JSON:
{
  "diagnosis": "What's actually missing — the flavor gap",
  "flavor_profile": {
    "needs_more": ["acid|fat|salt|heat|umami|sweetness|texture|aromatics"],
    "explanation": "Why this dish tastes flat — the science"
  },
  "quick_fixes": [
    {
      "fix": "What to add/do",
      "amount": "How much",
      "when": "When to add it (now, while cooking, at the table)",
      "impact": "high|medium|subtle",
      "why": "Chef trick explanation in one sentence"
    }
  ],
  "the_move": "The single best thing to do right now — if they only do one fix, do this one",
  "chef_trick": "One insider technique that elevates this specific dish",
  "do_not": "The one thing people do that makes this WORSE"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('RecipeChaosSolver flavor-fix error:', error);
    res.status(500).json({ error: error.message || 'Flavor fix failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /recipe-chaos-solver/teach — Turn a rescue into a lesson
// ════════════════════════════════════════════════════════════
router.post('/recipe-chaos-solver/teach', async (req, res) => {
  try {
    const { rescueContext, rescueType, userLanguage } = req.body;

    if (!rescueContext?.trim()) {
      return res.status(400).json({ error: 'What rescue should I teach about?' });
    }

    const systemPrompt = `${PERSONALITY}

Turn a cooking rescue into a 60-second lesson. The user just solved a problem — now teach them WHY it worked so they can handle it themselves next time. Be concise, memorable, and practical. Use analogies. Make it stick.`;

    const userPrompt = `TEACH ME — 60-second lesson:
What happened: ${rescueContext}
Type: ${rescueType || 'general'}

Return ONLY valid JSON:
{
  "lesson_title": "Short memorable title (e.g., 'Why Eggs Do 3 Jobs')",
  "lesson_emoji": "🎓",
  "the_principle": "The underlying cooking principle in 1-2 sentences — the 'aha' moment",
  "analogy": "A non-cooking analogy that makes it click",
  "the_rule": "A simple rule they can remember forever (e.g., 'Fat carries flavor. No fat = no flavor.')",
  "apply_it": [
    "2-3 other situations where this same principle applies"
  ],
  "common_myth": "One thing people believe about this that's wrong",
  "next_experiment": "One thing they can try next time to deepen this understanding"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('RecipeChaosSolver teach error:', error);
    res.status(500).json({ error: error.message || 'Lesson generation failed' });
  }
});

module.exports = router;
