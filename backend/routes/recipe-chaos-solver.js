const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/recipe-chaos-solver', async (req, res) => {
  try {
    const {
      recipeContext,
      recipeImageBase64,
      pantryImageBase64,
      problemCategory,
      problemDescription,
      missingIngredient,
      availableSubstitutes,
      availableIngredients,
      dietaryRestrictions,
      cookingSkill,
      timeAvailable,
      timePressure,
      embraceChaos
    } = req.body;

    // Accept images OR text as valid input
    if (!recipeContext && !problemDescription && !availableIngredients && !recipeImageBase64 && !pantryImageBase64) {
      return res.status(400).json({ error: 'Please describe what you\'re making or the problem' });
    }

    // Helper: safely extract raw base64 data and media type from a data URL
    function parseBase64Image(dataUrl) {
      if (!dataUrl || typeof dataUrl !== 'string') return null;
      // Split on the first comma — everything after is raw base64
      const commaIndex = dataUrl.indexOf(',');
      if (commaIndex === -1) {
        // No data URL prefix, assume raw base64 jpeg
        return { base64Data: dataUrl, mediaType: 'image/jpeg' };
      }
      const base64Data = dataUrl.substring(commaIndex + 1);
      // Extract media type from the prefix
      const mimeMatch = dataUrl.substring(0, commaIndex).match(/data:(image\/[a-zA-Z0-9.+-]+);base64/);
      const mediaType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      return { base64Data, mediaType };
    }

    // Build multi-modal content blocks
    const contentBlocks = [];
    let hasRecipeImage = false;
    let hasPantryImage = false;

    // Add recipe image if provided
    if (recipeImageBase64) {
      const parsed = parseBase64Image(recipeImageBase64);
      if (parsed && parsed.base64Data && parsed.base64Data.length > 100) {
        hasRecipeImage = true;
        const sizeKB = Math.round((parsed.base64Data.length * 0.75) / 1024);
        console.log(`[RecipeChaosSolver] Recipe image: ${sizeKB}KB, type: ${parsed.mediaType}`);
        contentBlocks.push({
          type: 'image',
          source: { type: 'base64', media_type: parsed.mediaType, data: parsed.base64Data }
        });
        contentBlocks.push({
          type: 'text',
          text: 'IMPORTANT: The image above is a photo of the recipe. You MUST carefully read and extract the full recipe (ingredients and instructions) from this image, then use it as the basis for your cooking advice.'
        });
      } else {
        console.warn('[RecipeChaosSolver] Recipe image provided but appears invalid/empty');
      }
    }

    // Add pantry image if provided
    if (pantryImageBase64) {
      const parsed = parseBase64Image(pantryImageBase64);
      if (parsed && parsed.base64Data && parsed.base64Data.length > 100) {
        hasPantryImage = true;
        const sizeKB = Math.round((parsed.base64Data.length * 0.75) / 1024);
        console.log(`[RecipeChaosSolver] Pantry image: ${sizeKB}KB, type: ${parsed.mediaType}`);
        contentBlocks.push({
          type: 'image',
          source: { type: 'base64', media_type: parsed.mediaType, data: parsed.base64Data }
        });
        contentBlocks.push({
          type: 'text',
          text: 'IMPORTANT: The image above is a photo of the user\'s pantry/fridge. You MUST carefully examine everything visible, list ALL ingredients you can identify in the "pantry_items_identified" array, and use these when suggesting substitutions or recipes.'
        });
      } else {
        console.warn('[RecipeChaosSolver] Pantry image provided but appears invalid/empty');
      }
    }

    console.log(`[RecipeChaosSolver] Building prompt — recipeImage: ${hasRecipeImage}, pantryImage: ${hasPantryImage}, contentBlocks: ${contentBlocks.length}`);

    // Build the main prompt
    const prompt = `You are a professional chef and food scientist who provides immediate, practical cooking solutions. You understand cooking chemistry: Maillard reaction, emulsification, gluten development, leavening, protein denaturation, starch gelatinization, and more.

${hasRecipeImage ? 'CRITICAL: A recipe photo was provided above. You MUST read the recipe from that image and base your advice on its actual contents. Reference specific ingredients and steps you see in the photo.' : ''}
${hasPantryImage ? 'CRITICAL: A pantry/fridge photo was provided above. You MUST examine it carefully, identify EVERY ingredient you can see, and list them ALL in the "pantry_items_identified" array. Use these identified items when suggesting substitutions.' : ''}

CONTEXT:
- Recipe/Dish: ${recipeContext || (hasRecipeImage ? 'See recipe photo above — extract the recipe from the image' : 'Not specified')}
- Available ingredients: ${availableIngredients || (hasPantryImage ? 'See pantry photo above — identify ingredients from the image' : 'Not specified')}
- Problem category: ${problemCategory || 'general'}
- Problem description: ${problemDescription || 'General recipe help needed'}
${missingIngredient ? `- Missing ingredient: ${missingIngredient}` : ''}
${availableSubstitutes ? `- User has these potential substitutes: ${availableSubstitutes}` : ''}
- Dietary restrictions: ${dietaryRestrictions || 'None'}
- Cooking skill: ${cookingSkill || 'beginner'}
- Time available: ${timeAvailable || 'Not specified'}
${timePressure ? `- TIME PRESSURE: ${timePressure}` : ''}
- Embrace chaos mode: ${embraceChaos ? 'YES - turn mistakes into intentional new dishes' : 'No'}

PROBLEM-SOLVING APPROACH:

For MISSING INGREDIENTS - don't give generic swap lists. Analyze THIS recipe's role for the ingredient:
- Structural (eggs bind, flour thickens)
- Flavor (herbs, spices, aromatics)
- Chemical (baking soda for leavening, acid for tenderizing)
- Textural (cream for richness, breadcrumbs for crunch)
Then suggest substitutes that fulfill the SAME FUNCTION with ratio adjustments.

For TECHNIQUE FAILURES:
- Broken sauce: specific rescue steps
- Overcooked protein: repurpose strategies
- Under-risen dough: fix or pivot
- Burned food: assess salvageability honestly

For TIMING/TEMPERATURE: adjust cooking parameters based on current state.
For CONSISTENCY: specific thickening/thinning strategies for THIS dish.
For EQUIPMENT MISSING: alternative methods using available tools.
For QUANTITY ERRORS: scaling fixes or repurposing.

SAFETY: If the description suggests a dangerous situation (grease fire, food poisoning risk), include a safety_warning field.

OUTPUT (JSON only, no markdown, no preamble):
{
  "immediate_action": "Do this RIGHT NOW (most urgent step)" or null,
  "safety_warning": "Safety concern if applicable" or null,
  "success_probability": 85,
  "difficulty": "easy|moderate|advanced",
  ${hasPantryImage ? '"pantry_items_identified": ["item1", "item2", "item3 (list EVERY ingredient you can see in the pantry photo)"],' : ''}
  "recipes": [
    {
      "name": "Recipe/solution name",
      "description": "What this produces",
      "ingredients_used": ["ingredient with amount"],
      "missing_staples": ["basic items you may need"],
      "time": "estimated time",
      "difficulty": "easy|moderate|advanced",
      "success_probability": 85,
      "instructions": ["Step 1", "Step 2"],
      "explanation": "WHY this works - cooking science",
      "tips": "Helpful tip",
      "preventive_tip": "How to avoid this next time",
      "what_if_you_dont_have": "Additional substitution options"
    }
  ],
  ${embraceChaos ? '"chaos_alternative": { "new_dish_name": "Creative name", "description": "How to turn this mistake into something delicious", "instructions": ["Steps"] },' : ''}
  "ingredients_not_used": ["leftover ingredients"],
  "meal_plan_suggestion": "How to use remaining ingredients"
}

IMPORTANT:
- Provide 1-3 recipes/solutions depending on complexity
- Be HONEST if a dish cannot be saved (low success_probability)
- success_probability must be an integer 0-100
- Explain WHY substitutions work in the "explanation" field
- For missing ingredients, rate swap quality: "excellent swap," "will work but flavor differs," or "emergency only"
- Consider dietary restrictions when suggesting substitutes
${hasPantryImage ? '- You MUST populate pantry_items_identified with every ingredient you can see in the pantry photo. This is critical — the user uploaded a photo specifically so you would identify their ingredients.' : ''}
Return ONLY valid JSON.`;

    contentBlocks.push({ type: 'text', text: prompt });

    console.log(`[RecipeChaosSolver] Sending ${contentBlocks.length} content blocks to API`);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: contentBlocks }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    console.log(`[RecipeChaosSolver] API response length: ${textContent.length} chars`);

    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);

    // Log pantry identification results
    if (hasPantryImage) {
      const items = parsed.pantry_items_identified || [];
      console.log(`[RecipeChaosSolver] Pantry items identified: ${items.length} items`);
    }

    res.json(parsed);
  } catch (error) {
    console.error('Recipe Chaos Solver error:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
