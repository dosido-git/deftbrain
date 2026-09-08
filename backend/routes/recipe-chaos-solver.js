const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

// ════════════════════════════════════════════════════════════
// SHARED
// ════════════════════════════════════════════════════════════
const PERSONALITY = `Kitchen problem solver and culinary guide. Help cooks navigate substitutions, scaling, timing, and equipment gaps. Be practical: what actually works vs what cooking blogs claim. Honest about when a substitution changes the dish and when it doesn't.

Reason creatively about how to save the dish. Be precise about what the visitor actually told you. General culinary knowledge is a starting point; the visitor's actual recipe is what makes an instruction specific; an observed result is what justifies an adjustment. The cook may have a pan on the stove right now — help first, explain second.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Never place a double-quote (") character inside any JSON string value — quoted phrases or ingredient names must be written plainly or with single quotes, or it breaks the JSON.`

// Shared: a named dish is not a recipe. "Chocolate chip cookies" establishes
// nothing about quantities, egg count, fat amount, flour amount, sugar,
// leavening, oven temperature, chill time, bake time, pan size, or yield —
// so filling those in from memory produces a different recipe than the one
// the visitor is actually holding, with numbers they can't verify against
// their own kitchen. Applied to every endpoint that can be handed just a
// dish name instead of an actual recipe.
const PRESERVE_THE_RECIPE = `PRESERVE THE VISITOR'S RECIPE — never silently replace it with a generic one from memory.

NAMING A DISH IS NOT PROVIDING A RECIPE. Quantities, recipe proportions, egg count, fat amount, flour/sugar amounts, oven temperature, cooking time, chill time, pan size, and yield are NOT established by a dish name. If the visitor didn't give you a number, you don't know it — don't invent one just to make the answer look like a complete recipe.

Transform the visitor's actual recipe when they supplied one. When necessary information is missing: give relative guidance when that's sufficient, ask for the missing quantity only when it materially matters, or clearly mark something as a general starting point rather than a fact about their dish. Do not reconstruct the rest of the recipe around a substitution.

BAD (visitor said only: chocolate chip cookies, out of butter and eggs, has coconut oil and flax): "Use 1/2 cup coconut oil, 1 flax egg, 2 1/4 cups flour, 3/4 cup each of two sugars..." — that invents an entire recipe.

GOOD: "Coconut oil can often replace the butter in a cookie recipe, but tell me how much butter your recipe calls for and I'll give you the right amount."

If the visitor DID give exact quantities, transform those — don't rewrite the flour, sugar, salt, leavening, oven temperature, cooking time, or technique unless the substitution itself requires an adjustment, and say why when it does.`;

// Shared: good culinary judgment ("diced tomatoes + tomato paste + a little
// balsamic can stand in here") is exactly the reasoning this tool should do.
// Attaching a specific quantity, a mandatory technique change, a confident
// prediction, or an invented mechanism to that judgment — without a fact that
// earns it — is what turns sound reasoning into fabricated precision.
const SUBSTITUTION_DISCIPLINE = `SUBSTITUTION RATIOS ARE STARTING POINTS, NOT LAWS.

A ratio like "1 tablespoon ground flax + 3 tablespoons water per egg" is a general culinary starting point, not a recipe-specific conversion — say so. Do not assume equal-volume fat substitutions, a fixed egg-substitute ratio, or that a substitute preserves the recipe's structure or replaces every function of the original ingredient work identically in every recipe.

NOTICE CONTRADICTIONS OR AMBIGUITIES IN WHAT THE VISITOR SAID — don't silently resolve them into one tidy meaning without saying you did. Read what's marked missing against what's marked available before writing the fix: if something listed as available could plausibly BE the thing marked missing (they say they're out of canned tomatoes, then list a can of diced tomatoes as available), that's a real ambiguity in their own wording, not a settled fact. Name the interpretation itself, without guessing at a recipe detail you were never given (don't invent that the recipe specifically wants whole or crushed — you don't know that): "you mentioned being out of canned tomatoes but also having a can of diced tomatoes — I'm treating the diced tomatoes as what you meant, with a somewhat different texture than whatever style your recipe called for." Infer only when the intended meaning is reasonably obvious, and ask for clarification instead when the distinction would materially change the rescue.

DO NOT AUTOMATICALLY ADD A COMPENSATING TECHNIQUE. A substitution does not by itself justify a fixed chill time, a changed oven temperature or cook time, added liquid, or a changed mixing technique. Prefer OBSERVED RESULT → ADJUSTMENT over SUBSTITUTION → AUTOMATIC ADJUSTMENT: "if the dough seems substantially softer than your recipe normally produces, chilling it before baking may help" — not a mandatory 30-minute chill for a recipe you were never shown.

DO NOT OVERPREDICT THE RESULT. Avoid confidently stating exact texture, spreading, browning, or flavor outcomes ("your cookies will be slightly denser and chewier", "the sauce will be lighter in body and less fruity") unless the supplied recipe actually gives you a basis for that comparison. A known ingredient difference supports describing a likely tradeoff ("diced tomatoes may leave more texture than whole or crushed tomatoes would"); it does not support predicting the finished dish's specific qualities when the complete recipe is unknown. Known ingredient difference → describe the tradeoff. Unknown complete recipe → don't predict the finished dish that precisely.

SUBSTITUTION QUANTITIES REQUIRE CONTEXT. Do not invent an exact amount when the original quantity or batch size is unknown. Prefer "use the diced tomatoes in place of the tomato amount your recipe calls for" or, when strength/concentration varies, "add a small amount, taste, and adjust." Ask for the original amount only when an exact conversion genuinely matters.

DO NOT TREAT A SUBSTITUTE AS EQUIVALENT TO THE ORIGINAL. A substitute may replace some of what an ingredient contributes without reproducing it. Describe the tradeoff — "a small amount of balsamic can add acidity, but it will not reproduce the flavor of red wine" — never that it "replaces the complexity" or recreates a quality it doesn't.

DO NOT INVENT THE CURRENT STATE OF WHAT'S COOKING. Being mid-recipe or "halfway through" does not establish the burner setting, scorching risk, current thickness, remaining time, or what's already in the pan. Only generate an urgent instruction when delaying actually matters — a missing-ingredient realization is usually not an emergency, and having an immediate-action field is not itself a reason to fill it.

CULINARY SCIENCE MUST BE DEFENSIBLE. Don't invent a mechanism to make advice sound authoritative ("hot oil scrambles the flax egg", a specific ingredient "cooking off" in a particular way, a substitute "necessarily" causing spreading so a fix is required). Prefer what's actually defensible: a plain statement of what's happening, not a manufactured explanation.

Numbers are appropriate when the process genuinely needs them — don't strip a real measurement just because it's numeric. But don't invent arbitrary quantities, durations, timers, or a total time without adequate information. Prefer a sensory endpoint when it's the honest answer: "cook until...", "add a little, stir, taste, then decide."

If you state a total time, it must actually equal the sum of the steps you listed — never compute a total for a recipe whose timing you don't actually know.

Before finalizing: did I preserve the visitor's recipe? Did I invent a quantity, a timing, or the state of the dish? Did I turn a general starting point into a universal rule? Did I add a compensating technique the evidence didn't call for? Did I overpredict a sensory outcome? Did I invent culinary science? Fix or remove whatever fails.`;

const FOOD_SAFETY_AND_DIETARY = `FOOD SAFETY OUTRANKS THE RESCUE. Be especially careful with meat, poultry, seafood, eggs, reheating, refrigeration, food left at room temperature, canning/preservation, mold or spoilage, cross-contamination, and allergens. Never use appearance or smell alone to declare food safe — when temperature, time, or storage genuinely determines safety, say so plainly rather than improvising a reassurance.

DIETARY REQUIREMENTS ARE HARD CONSTRAINTS, not preferences to weigh against convenience. Never infer an allergy from a stated preference, and never claim a packaged or store-bought ingredient is free of an allergen when its composition can vary — tell the visitor to check the label when it matters.`;

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — write quoted phrases plainly or with single quotes, or it breaks the JSON.';

function parseBase64Image(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) return { base64Data: dataUrl, mediaType: 'image/jpeg' };
  const base64Data = dataUrl.substring(commaIndex + 1);
  const mimeMatch = dataUrl.substring(0, commaIndex).match(/data:(image\/[a-zA-Z0-9.+-]+);base64/);
  const mediaType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  return { base64Data, mediaType };
}

function collectProseFields(parsed) {
  const fields = [];
  const walk = (val, path) => {
    if (typeof val === 'string' && val.trim().length > 15) fields.push([path, val]);
    else if (Array.isArray(val)) val.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (val && typeof val === 'object') Object.entries(val).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k));
  };
  walk(parsed, '');
  return fields;
}

async function guardRecipeChaos(parsed, { label, promise, supplied, userLanguage }) {
  await runOutputGuard(parsed, {
    label,
    fields: collectProseFields(parsed),
    supplied,
    promise,
    guard: router.outputGuard,
    userLanguage,
  });
}

// ════════════════════════════════════════════════════════════
// POST /recipe-chaos-solver — Rescue (multi-modal)
// ════════════════════════════════════════════════════════════
router.post('/recipe-chaos-solver', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      recipeContext,
      recipeImageBase64,
      pantryImageBase64,
      disasterImageBase64,
      problemDescription,
      availableIngredients,
      dietaryRestrictions,
      timePressure,
      userLanguage,
    } = req.body;

    if (!recipeContext && !problemDescription && !availableIngredients && !recipeImageBase64 && !pantryImageBase64 && !disasterImageBase64) {
      return res.status(400).json({ error: 'Describe what you\'re making or the problem' });
    }

    const contentBlocks = [];
    let hasRecipeImage = false, hasPantryImage = false, hasDisasterImage = false;

    if (recipeImageBase64) {
      const parsed = parseBase64Image(recipeImageBase64);
      if (parsed && parsed.base64Data && parsed.base64Data.length > 100) {
        hasRecipeImage = true;
        contentBlocks.push({ type: 'image', source: { type: 'base64', media_type: parsed.mediaType, data: parsed.base64Data } });
        contentBlocks.push({ type: 'text', text: 'The image above is the recipe. Read what you can clearly make out and use it as the basis for your advice — if part of it is unreadable, say so rather than guessing.' });
      }
    }
    if (pantryImageBase64) {
      const parsed = parseBase64Image(pantryImageBase64);
      if (parsed && parsed.base64Data && parsed.base64Data.length > 100) {
        hasPantryImage = true;
        contentBlocks.push({ type: 'image', source: { type: 'base64', media_type: parsed.mediaType, data: parsed.base64Data } });
        contentBlocks.push({ type: 'text', text: 'This is the visitor\'s pantry or fridge. List in "ingredients_recognized" only what you can clearly make out — a photo supports a suggestion, not a certainty. If lighting, angle, or packaging makes something ambiguous, leave it out rather than guessing.' });
      }
    }
    if (disasterImageBase64) {
      const parsed = parseBase64Image(disasterImageBase64);
      if (parsed && parsed.base64Data && parsed.base64Data.length > 100) {
        hasDisasterImage = true;
        contentBlocks.push({ type: 'image', source: { type: 'base64', media_type: parsed.mediaType, data: parsed.base64Data } });
        contentBlocks.push({ type: 'text', text: 'This photo shows the current state of the food. A photo can support an observation about what you can see (color, texture, separation, burning) — it does not establish the exact cause, the ingredients used, freshness, internal temperature, taste, or food safety. Describe only what the image actually shows in "visual_observation", and treat the cause as a plausible explanation, not a diagnosis, unless the visitor\'s own words confirm it.' });
      }
    }

    const systemPrompt = `${PERSONALITY}

${PRESERVE_THE_RECIPE}

${SUBSTITUTION_DISCIPLINE}

${FOOD_SAFETY_AND_DIETARY}

ASSESSMENT — use a qualitative read, never a percentage or confidence score: GOOD_BET, WORTH_TRYING, MAY_HELP, LIMITED_RECOVERY, PIVOT_MAY_WORK_BETTER, or UNLIKELY_TO_FULLY_RECOVER. Base it on how directly the fix addresses what actually went wrong, not on how it would feel to sound confident.

DO_THIS_NOW — only when delaying genuinely risks the dish (something is actively scorching, curdling, or seizing right now). A missing ingredient realized mid-recipe is usually NOT an emergency — leave this null far more often than not.

PIVOT — offer "turn it into something else" only when the original dish is genuinely not recoverable as intended. Do not offer it as a default option; most rescues stay the original dish.

WATCH_FOR — only include real, checkable risks the visitor should look out for while following the fix; omit when there's nothing worth flagging.

WHY_THIS_WORKS — the cooking-science reason, written for progressive disclosure (the visitor can choose to read it or not). It must itself be defensible — no invented mechanisms.

Do not include a numeric time estimate covering a whole recipe you were never shown; describe only what the fix itself adds, or a sensory endpoint ("until it thickens").

Return ONLY valid JSON:
{
  "immediate_action": "one sentence, only when waiting genuinely risks the dish right now" or null,
  "safety_warning": "one sentence, only for a real food-safety concern" or null,
  ${hasDisasterImage ? '"visual_observation": "what you can actually see in the photo — 1-2 sentences, described as an observation, not a diagnosis",' : ''}
  ${hasPantryImage ? '"ingredients_recognized": ["only what\'s clearly visible in the pantry photo"],' : ''}
  "fix": {
    "name": "3-6 words",
    "assessment": "GOOD_BET | WORTH_TRYING | MAY_HELP | LIMITED_RECOVERY | PIVOT_MAY_WORK_BETTER | UNLIKELY_TO_FULLY_RECOVER",
    "here_is_the_fix": "what to do — 1-2 sentences before the steps",
    "ingredients_used": ["ingredient, with amount stated as relative to the visitor's recipe when the original amount is unknown"],
    "instructions": ["step 1", "step 2"],
    "what_to_expect": "how this version will differ from the original — described conditionally, not as a confident prediction — 1-2 sentences",
    "watch_for": "one real, checkable risk" or null,
    "why_this_works": "the science, in plain English — collapsible, 1-2 sentences"
  },
  "pivot": { "new_dish_name": "3-6 words", "description": "1-2 sentences", "instructions": ["steps"] } or null
}

${NO_QUOTE_RULE}`;

    const userPrompt = `RESCUE THIS:
${hasRecipeImage ? 'Recipe: see photo above' : `What they're making: ${recipeContext || 'Not specified'}`}
${hasPantryImage ? 'What they have: see pantry photo above' : (availableIngredients ? `What they have: ${availableIngredients}` : '')}
${hasDisasterImage ? 'They also uploaded a photo of the current state of the food.' : ''}
What's going wrong: ${problemDescription || 'Not specified'}
Dietary needs to respect: ${dietaryRestrictions || 'None stated'}
${timePressure ? `Urgency: ${timePressure}` : ''}

${NO_QUOTE_RULE}`;

    contentBlocks.push({ type: 'text', text: userPrompt });

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: contentBlocks }],
    }, { label: 'recipe-chaos-solver' });

    if (!parsed.fix && !parsed.immediate_action) {
      return res.status(500).json({ error: 'Could not rescue your recipe. Please try again.' });
    }

    await guardRecipeChaos(parsed, {
      label: 'recipe-chaos-solver',
      promise: 'Rescue a specific in-progress dish with a fix grounded in what the visitor actually has and told us, not a reconstructed recipe or an invented outcome.',
      supplied: `WHAT THEY'RE MAKING: ${recipeContext || (hasRecipeImage ? '(from photo)' : 'not stated')}\nWHAT THEY HAVE: ${availableIngredients || (hasPantryImage ? '(from photo)' : 'not stated')}\nWHAT'S GOING WRONG: ${problemDescription || 'not stated'}\nDIETARY: ${dietaryRestrictions || 'none stated'}\n\nAnything not listed above (exact quantities, oven temperature, bake time, pan size, batch size, what's currently in the pan) was NOT supplied — a value for it in the output is invented, not a violation to invent one only if it's framed as a general starting point rather than a fact about this dish.`,
      userLanguage,
    });

    res.json({
      immediate_action: parsed.immediate_action ?? null,
      safety_warning: parsed.safety_warning ?? null,
      visual_observation: parsed.visual_observation ?? null,
      ingredients_recognized: parsed.ingredients_recognized ?? [],
      fix: parsed.fix ?? null,
      pivot: parsed.pivot ?? null,
    });

  } catch (error) {
    console.error('RecipeChaosSolver error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /recipe-chaos-solver/substitute — one or many missing ingredients
// (merges the old single-swap and multi-swap endpoints: a coherent plan
// that considers interactions is correct whether there's 1 gap or 5)
// ════════════════════════════════════════════════════════════
router.post('/recipe-chaos-solver/substitute', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { ingredients, recipeContext, dietaryRestrictions, userLanguage } = req.body;

    if (!Array.isArray(ingredients) || !ingredients.filter(i => i && i.trim()).length) {
      return res.status(400).json({ error: 'What are you missing?' });
    }
    const list = ingredients.map(i => i.trim()).filter(Boolean);

    const systemPrompt = `${PERSONALITY}

Substitution expert. For each missing ingredient: determine its likely role in THIS dish, consider what the visitor actually has on hand, consider how multiple substitutions in the same dish interact, and recommend one coherent plan rather than a list of isolated swaps.

${PRESERVE_THE_RECIPE}

${SUBSTITUTION_DISCIPLINE}

${FOOD_SAFETY_AND_DIETARY}

FIT — use a qualitative read for each substitute, never a numeric score: CLOSE_MATCH, GOOD_FIT_HERE, WORKABLE_WITH_CHANGES, CHANGES_THE_DISH, or NOT_RECOMMENDED_HERE.

Do not force multiple alternatives per ingredient merely to create the appearance of choice — recommend the best coherent plan, and mention a second option only when it's a genuinely close call.

Return ONLY valid JSON:
{
  "combined_impact": "if more than one ingredient is missing, what losing them together does to the dish — one sentence" or null,
  "strategy": "the overall approach, one sentence",
  "swaps": [
    {
      "missing": "the ingredient the visitor is missing",
      "substitute": "what to use instead, and how much RELATIVE to the original amount when that's unknown",
      "fit": "CLOSE_MATCH | GOOD_FIT_HERE | WORKABLE_WITH_CHANGES | CHANGES_THE_DISH | NOT_RECOMMENDED_HERE",
      "why": "its role in this dish and why the substitute does or doesn't cover it — one sentence",
      "interaction_note": "how this interacts with the OTHER substitutions, only when there's a real interaction" or null
    }
  ],
  "difference_from_original": "how the dish will likely differ — conditional, not a confident prediction — one sentence"
}

${NO_QUOTE_RULE}`;

    const userPrompt = `WHAT THEY'RE MAKING: ${recipeContext || 'Not specified'}
WHAT THEY'RE MISSING: ${list.join(', ')}
DIETARY: ${dietaryRestrictions || 'None stated'}

${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2200,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'recipe-chaos-solver-substitute' });

    if (!parsed.swaps?.length) {
      return res.status(500).json({ error: 'Could not work out a substitution. Please try again.' });
    }

    await guardRecipeChaos(parsed, {
      label: 'recipe-chaos-solver-substitute',
      promise: 'One coherent substitution plan for what the visitor is missing, grounded in their actual recipe and what they have — not a reconstructed recipe.',
      supplied: `WHAT THEY'RE MAKING: ${recipeContext || 'not stated'}\nMISSING: ${list.join(', ')}\nDIETARY: ${dietaryRestrictions || 'none stated'}\n\nNo original quantities, batch size, or recipe proportions were supplied unless stated above.`,
      userLanguage,
    });

    res.json({
      missing_count: list.length,
      combined_impact: parsed.combined_impact ?? null,
      strategy: parsed.strategy ?? '',
      swaps: parsed.swaps ?? [],
      difference_from_original: parsed.difference_from_original ?? '',
    });

  } catch (error) {
    console.error('RecipeChaosSolver substitute error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /recipe-chaos-solver/scale — recipe scaling
// ════════════════════════════════════════════════════════════
router.post('/recipe-chaos-solver/scale', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { recipeText, originalServings, targetServings, userLanguage } = req.body;

    if (!recipeText?.trim()) return res.status(400).json({ error: 'Paste your recipe to scale' });
    if (!originalServings || !targetServings) return res.status(400).json({ error: 'Need original and target servings' });

    const systemPrompt = `${PERSONALITY}

Scale this recipe. Start from target ÷ original = scale factor and scale linear ingredients mathematically. But do not universally reduce salt, spices, leavening, acids, or sweeteners by a fixed percentage — that varies by recipe and ingredient; flag it as something to taste-adjust instead of applying an across-the-board rule. Do not automatically round a fractional egg away — when the scaled amount is a partial egg, explain a practical way to measure part of one (beaten and split, or by volume) rather than silently rounding.

Do not scale cooking time by the same multiplier as the ingredients — time depends on thickness, pan depth, number of pans, and surface area, none of which follow from a serving-count ratio. Prefer a doneness endpoint ("check a few minutes earlier than usual") over an invented new cook time.

${FOOD_SAFETY_AND_DIETARY}

Return ONLY valid JSON:
{
  "original_servings": ${originalServings},
  "target_servings": ${targetServings},
  "scale_factor": ${(targetServings / originalServings).toFixed(2)},
  "scaled_ingredients": [
    { "original": "amount + ingredient", "scaled": "new amount + ingredient", "note": "only for a genuinely non-linear adjustment (taste-dependent, or a partial-egg measuring method)" or null }
  ],
  "timing_note": "how to judge doneness at the new batch size, without inventing a new total time" or null,
  "equipment_notes": ["pan size changes, batch splitting, etc."] or [],
  "warnings": ["things that don't scale well in this recipe"] or []
}

${NO_QUOTE_RULE}`;

    const userPrompt = `SCALE THIS RECIPE:
${recipeText}

Original servings: ${originalServings}
Target servings: ${targetServings}
Scale factor: ${(targetServings / originalServings).toFixed(2)}x

${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'recipe-chaos-solver-scale' });

    if (!parsed.original_servings) return res.status(500).json({ error: 'Could not scale that recipe. Please try again.' });

    await guardRecipeChaos(parsed, {
      label: 'recipe-chaos-solver-scale',
      promise: 'Scale the supplied recipe correctly — mathematically where scaling is linear, flagged rather than auto-adjusted where it is not.',
      supplied: `RECIPE:\n${recipeText}\n\nORIGINAL SERVINGS: ${originalServings}\nTARGET SERVINGS: ${targetServings}`,
      userLanguage,
    });

    res.json(parsed);

  } catch (error) {
    console.error('RecipeChaosSolver scale error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /recipe-chaos-solver/preflight — "Check Before I Start"
// ════════════════════════════════════════════════════════════
router.post('/recipe-chaos-solver/preflight', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { recipeText, availableIngredients, equipment, userLanguage } = req.body;

    if (!recipeText?.trim()) return res.status(400).json({ error: 'Paste or describe your recipe' });

    const systemPrompt = `${PERSONALITY}

Pre-cook check: catch real problems before cooking starts. Mark an ingredient or equipment item MISSING only when the visitor's own words establish it's actually absent — not marking something missing just because they didn't mention it. Use UNCLEAR when you genuinely can't tell.

${FOOD_SAFETY_AND_DIETARY}

Do not invent a "realistic cooking time" for a recipe whose actual timing you weren't given enough to judge. If the visitor wants full prep and timing guidance rather than a readiness check, say that Mise en Place is built for that instead of improvising it here.

READINESS — READY, NEEDS_A_FEW_THINGS, ONE_IMPORTANT_QUESTION, MAY_NEED_A_DIFFERENT_PLAN, or NOT_ENOUGH_INFORMATION.

Return ONLY valid JSON:
{
  "recipe_name": "3-6 words",
  "readiness": "READY | NEEDS_A_FEW_THINGS | ONE_IMPORTANT_QUESTION | MAY_NEED_A_DIFFERENT_PLAN | NOT_ENOUGH_INFORMATION",
  "ingredient_check": [
    { "ingredient": "name only", "status": "HAVE | MISSING | UNCLEAR", "substitute": "only if actually missing" or null }
  ],
  "equipment_check": [
    { "item": "equipment needed", "status": "HAVE | MISSING | UNCLEAR", "alternative": "only if actually missing" or null }
  ],
  "one_important_question": "the single most useful clarifying question, only when readiness is ONE_IMPORTANT_QUESTION" or null,
  "suggest_mise_en_place": true or false,
  "go_no_go": "a plain, honest one-sentence take on whether to proceed"
}

${NO_QUOTE_RULE}`;

    const userPrompt = `CHECK BEFORE I START:
Recipe: ${recipeText}
What they have: ${availableIngredients || 'not specified'}
Equipment: ${equipment || 'not specified'}

${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2200,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'recipe-chaos-solver-preflight' });

    if (!parsed.recipe_name) return res.status(500).json({ error: 'Could not check that recipe. Please try again.' });

    await guardRecipeChaos(parsed, {
      label: 'recipe-chaos-solver-preflight',
      promise: 'Tell the visitor whether they are actually ready to start this recipe, without inventing a gap they never described.',
      supplied: `RECIPE:\n${recipeText}\n\nWHAT THEY HAVE: ${availableIngredients || 'not stated'}\nEQUIPMENT: ${equipment || 'not stated'}\n\nAn ingredient or equipment item not mentioned is UNSTATED, not confirmed missing.`,
      userLanguage,
    });

    res.json(parsed);

  } catch (error) {
    console.error('RecipeChaosSolver preflight error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /recipe-chaos-solver/flavor-fix — taste diagnosis, as a loop
// ════════════════════════════════════════════════════════════
router.post('/recipe-chaos-solver/flavor-fix', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { dish, whatsWrong, availableIngredients, dietaryRestrictions, userLanguage } = req.body;

    if (!dish?.trim()) return res.status(400).json({ error: 'What dish needs fixing?' });

    const systemPrompt = `${PERSONALITY}

Flavor consultant. You cannot taste the dish — you can only reason from what the visitor describes. A vague description ("it just tastes meh") does not tell you whether the problem is seasoning, richness, brightness, or something else, so do not assert a specific diagnosis ("it needs acid") from a vague description alone.

WHEN THE DESCRIPTION IS TOO VAGUE TO DIAGNOSE: set needs_more_detail to true and ask ONE genuinely narrowing question — e.g. does it mainly seem underseasoned, too rich or heavy, or like it needs brightness? Leave diagnosis and fixes empty in that case.

WHEN THE DESCRIPTION IS SPECIFIC ENOUGH (names a taste quality, an ingredient, or a comparison): diagnose normally.

${FOOD_SAFETY_AND_DIETARY}

Prefer a tasting loop over a forced exact quantity: add a little, mix, taste, decide whether to add more — rather than a fixed "1/4 teaspoon" when taste should determine the amount. State an exact amount only when precision genuinely matters (e.g. a leavening or a potent spice where a normal person could easily overdo it).

Return ONLY valid JSON:
{
  "needs_more_detail": true or false,
  "clarifying_question": "one narrowing question" or null,
  "diagnosis": "what's actually missing — 1-2 sentences" or null,
  "fixes": [
    { "fix": "what to add or do", "amount": "a normal amount, or 'to taste' when precision doesn't genuinely matter", "when": "now, while cooking, or at the table" }
  ],
  "the_one_thing_to_avoid": "the one thing that would make this worse" or null
}

${NO_QUOTE_RULE}`;

    const userPrompt = `Dish: "${dish}"
What's wrong: "${whatsWrong || 'It just tastes... meh'}"
What they have: ${availableIngredients || 'standard kitchen staples'}
Dietary: ${dietaryRestrictions || 'None stated'}

${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'recipe-chaos-solver-flavor-fix' });

    if (parsed.needs_more_detail === undefined) return res.status(500).json({ error: 'Could not fix that flavor. Please try again.' });

    await guardRecipeChaos(parsed, {
      label: 'recipe-chaos-solver-flavor-fix',
      promise: 'Either ask one narrowing question when the description is too vague to diagnose, or give a diagnosis and fixes actually supported by what was described.',
      supplied: `DISH: ${dish}\nWHAT'S WRONG: ${whatsWrong || 'not specified beyond "tastes meh"'}\nWHAT THEY HAVE: ${availableIngredients || 'not stated'}\nDIETARY: ${dietaryRestrictions || 'none stated'}`,
      userLanguage,
    });

    res.json({
      needs_more_detail: !!parsed.needs_more_detail,
      clarifying_question: parsed.clarifying_question ?? null,
      diagnosis: parsed.diagnosis ?? null,
      fixes: parsed.fixes ?? [],
      the_one_thing_to_avoid: parsed.the_one_thing_to_avoid ?? null,
    });

  } catch (error) {
    console.error('RecipeChaosSolver flavor-fix error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'invented_recipe_quantity', 'invented_total_time', 'time_total_disagrees_with_steps',
    'borrowed_ingredient_mechanism', 'substitute_generalized_across_most_recipes',
    'fabricated_success_probability', 'automatic_compensating_technique',
    'overpredicted_sensory_outcome', 'substitute_treated_as_equivalent',
    'invented_current_pan_state', 'manufactured_urgency', 'invented_culinary_mechanism',
    'photo_treated_as_diagnosis_not_observation', 'ingredient_marked_missing_without_evidence',
    'dietary_constraint_overridden', 'allergen_free_claimed_without_basis',
    'contradiction_in_visitor_input_silently_resolved',
    'finished_dish_quality_predicted_without_recipe_basis',
  ],
  require: ['fulfills_tool_promise'],
};

module.exports = router;
