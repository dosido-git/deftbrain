const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');

// ─── Shared helpers ───
function normalizeConstraint(constraint) {
  if (Array.isArray(constraint)) return constraint.filter(c => c?.trim()).join(' AND ');
  return constraint?.trim() || '';
}

function buildProfileCtx(p) {
  if (!p) return '';
  const parts = [];
  if (p.budget) parts.push(`Budget: ${p.budget}`);
  if (p.cookingSkill) parts.push(`Cooking skill: ${p.cookingSkill}`);
  if (p.location) parts.push(`Location: ${p.location}`);
  if (p.groceryAccess) parts.push(`Grocery access: ${p.groceryAccess}`);
  return parts.length ? `\nUSER PROFILE: ${parts.join('. ')}.` : '';
}

function buildDislikedCtx(arr) {
  return arr?.length ? `\nUSER HAS REJECTED THESE (do NOT suggest them or similar): ${arr.join(', ')}` : '';
}

function buildFavoritesCtx(arr) {
  return arr?.length ? `\nUSER FAVORITES (they like swaps similar to): ${arr.map(f => f.name || f).join(', ')}` : '';
}

function buildSeasonCtx() {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const d = new Date();
  return `\nCURRENT DATE: ${months[d.getMonth()]} ${d.getFullYear()}. Factor in seasonal produce availability and pricing.`;
}

function buildJournalCtx(journal) {
  if (!journal?.length) return '';
  const recent = journal.slice(0, 10);
  const liked = recent.filter(j => j.rating >= 7).map(j => j.swapName);
  const disliked = recent.filter(j => j.rating <= 4).map(j => j.swapName);
  let ctx = '';
  if (liked.length) ctx += `\nSWAPS USER HAS TRIED AND LIKED (7+/10): ${liked.join(', ')}`;
  if (disliked.length) ctx += `\nSWAPS USER TRIED AND DISLIKED (4-/10): ${disliked.join(', ')}`;
  return ctx;
}

// ═══════════════════════════════════════════════════
// ROUTE 1: MAIN — Find closest satisfying swaps
// ═══════════════════════════════════════════════════
router.post('/food-swap', async (req, res) => {
  try {
    const { food, constraint, priorities, profileCtx, dislikedSwaps, favorites, journal, userLanguage } = req.body;
    if (!food?.trim()) return res.status(400).json({ error: 'Describe the food you love.' });
    const ct = normalizeConstraint(constraint);
    if (!ct) return res.status(400).json({ error: 'Describe your dietary constraint.' });

    const prompt = withLanguage(`You are a food swap genius. Find the CLOSEST satisfying replacement — not a "healthy alternative" lecture.

KEY PRINCIPLES:
- Match the CRAVING PROFILE (texture, richness, salt, umami, sweetness, comfort factor)
- Be specific: exact brands, products, recipes — not vague suggestions
- Never suggest known disappointing substitutes
- Honest closeness scores. 90%+ = say so. 70% = be honest about what's different
- Respect ALL constraints absolutely — no "just a little won't hurt"
- When multiple constraints: every swap must satisfy ALL simultaneously

FOOD THEY LOVE: "${food.trim()}"
DIETARY CONSTRAINTS: "${ct}"
${priorities?.length ? `\nPRIORITIES: ${priorities.join(', ')}` : ''}
${buildProfileCtx(profileCtx)}${buildDislikedCtx(dislikedSwaps)}${buildFavoritesCtx(favorites)}${buildJournalCtx(journal)}

Return ONLY valid JSON:
{
  "craving_analysis": {
    "what_you_actually_crave": "Underlying craving profile",
    "key_elements": ["creamy", "salty", "umami", "crunchy top"],
    "hardest_to_replace": "Which element is trickiest and why",
    "constraint_challenge": "What makes this constraint combo tricky for this food"
  },
  "swaps": [
    {
      "name": "Specific swap name",
      "type": "product|recipe|restaurant_hack|combo",
      "closeness_score": 85,
      "description": "What it is and why it works",
      "brand_or_recipe": "Exact brand OR recipe approach",
      "where_to_find": "Store section, online, specialty",
      "cost_comparison": "Cheaper|Same|Slightly more|Premium",
      "prep_difficulty": "No prep|5 min|15 min|30+ min",
      "pro_tip": "The one thing that makes this swap work",
      "honest_gap": "What's different — be candid"
    }
  ],
  "avoid_these": [{ "swap": "Disappointing substitute", "why_it_fails": "Why" }],
  "surprise_option": { "name": "Unexpected suggestion", "why_it_works": "How it works", "closeness_score": 75 },
  "stacking_tip": "How to combine 2+ swaps for an even closer match"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'FoodSwapMain', max_tokens: 2500,
      system: withLanguage('You are a culinary swap specialist who actually eats food and understands cravings. Specific product names, exact brands, honest assessments. Never lecture. Never suggest nutritional yeast unless it genuinely works. When multiple constraints: every suggestion must satisfy ALL. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[FoodSwapMain] "${food.trim().substring(0, 40)}" → ${ct.substring(0, 40)} | ${parsed.swaps?.length || 0} swaps`);
    res.json(parsed);
  } catch (error) {
    console.error('[FoodSwapMain] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to find swaps.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 2: RESTAURANT — What to order at a specific cuisine
// ═══════════════════════════════════════════════════
router.post('/food-swap-restaurant', async (req, res) => {
  try {
    const { cuisine, constraint, cravingType, specificRestaurant, profileCtx, userLanguage } = req.body;
    if (!cuisine?.trim()) return res.status(400).json({ error: 'What type of restaurant or cuisine?' });
    const ct = normalizeConstraint(constraint);
    if (!ct) return res.status(400).json({ error: 'Describe your dietary constraint.' });

    const prompt = withLanguage(`You're the friend who's eaten at every restaurant with these constraints. Practical, specific ordering advice.

CUISINE: "${cuisine.trim()}"
CONSTRAINTS: "${ct}"
${specificRestaurant?.trim() ? `\nRESTAURANT: "${specificRestaurant.trim()}"` : ''}
${cravingType?.trim() ? `\nCRAVING: "${cravingType.trim()}"` : ''}
${buildProfileCtx(profileCtx)}

Return ONLY valid JSON:
{
  "cuisine_overview": { "how_friendly": "Very friendly|Manageable|Tricky|Minefield", "good_news": "What this cuisine does well", "watch_out": "Hidden violations" },
  "safe_bets": [{ "dish": "Name (native + English)", "why_safe": "Why", "how_to_order": "Exact modification", "satisfaction_level": "Hits the spot|Good enough|Compromise" }],
  "hidden_traps": [{ "dish": "Seems safe but isn't", "hidden_ingredient": "What's hiding", "why_sneaky": "Why missed" }],
  "server_script": "What to say — natural, not awkward. Mention ALL constraints.",
  "backup_plan": "If nothing works",
  "pro_move": "Insider hack"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'FoodSwapRestaurant', max_tokens: 2000,
      system: withLanguage('Dining-out expert for dietary restrictions. Every dish must satisfy ALL constraints. Real dish names, practical server scripts. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[FoodSwapRestaurant] ${cuisine.trim()} + ${ct.substring(0, 30)} | ${parsed.safe_bets?.length || 0} safe bets`);
    res.json(parsed);
  } catch (error) {
    console.error('[FoodSwapRestaurant]', error);
    res.status(500).json({ error: error.message || 'Failed to get restaurant guide.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 3: PANTRY TRANSITION — Swap your whole kitchen
// ═══════════════════════════════════════════════════
router.post('/food-swap-pantry', async (req, res) => {
  try {
    const { stapleMeals, constraint, profileCtx, userLanguage } = req.body;
    if (!stapleMeals?.trim()) return res.status(400).json({ error: 'List your staple meals or ingredients.' });
    const ct = normalizeConstraint(constraint);
    if (!ct) return res.status(400).json({ error: 'Describe your dietary constraint.' });

    const prompt = withLanguage(`Kitchen transition plan. Make it feel like an upgrade, not a loss. Keep routine intact. Every swap must satisfy ALL constraints.

STAPLES: "${stapleMeals.trim()}"
CONSTRAINTS: "${ct}"
${buildProfileCtx(profileCtx)}
${buildSeasonCtx()}

Return ONLY valid JSON:
{
  "transition_difficulty": "Easy pivot|Moderate adjustment|Major overhaul",
  "good_news_first": "What they can keep as-is",
  "pantry_swaps": [{ "current": "X", "replacement": "Y (with brand)", "taste_match": "Identical|Very close|Different but good|Acquired taste", "price_difference": "Cheaper|Same|+$1-2|+$3-5|Premium", "where_to_buy": "Regular grocery|Health aisle|Specialty|Online", "notes": "Tips" }],
  "meal_makeovers": [{ "original_meal": "X", "swapped_version": "Y", "changes_needed": ["list"], "effort_change": "Same|Slightly more|Noticeably more", "taste_verdict": "Honest" }],
  "shopping_list": { "essentials": ["Week 1 must-buys with brands"], "nice_to_have": ["Smoother transition"], "skip_for_now": ["Explore later"] },
  "first_week_plan": "Simple 3-day rotation",
  "budget_impact": "Honest weekly cost change"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'FoodSwapPantry', max_tokens: 3000,
      system: withLanguage('Kitchen transition specialist. Specific brands, store sections, honest comparisons. All swaps satisfy ALL constraints. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[FoodSwapPantry] ${ct.substring(0, 30)} | ${parsed.pantry_swaps?.length || 0} swaps`);
    res.json(parsed);
  } catch (error) {
    console.error('[FoodSwapPantry]', error);
    res.status(500).json({ error: error.message || 'Failed to build pantry plan.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 4: CRAVING DECODER
// ═══════════════════════════════════════════════════
router.post('/food-swap-craving', async (req, res) => {
  try {
    const { craving, constraint, mood, timeOfDay, profileCtx, userLanguage } = req.body;
    if (!craving?.trim()) return res.status(400).json({ error: 'Describe what you\'re craving.' });
    const ct = normalizeConstraint(constraint);
    if (!ct) return res.status(400).json({ error: 'Describe your dietary constraint.' });

    const prompt = withLanguage(`Decode the craving — sensory, emotional, nutritional layers. All suggestions must satisfy ALL constraints.

CRAVING: "${craving.trim()}"
CONSTRAINTS: "${ct}"
${mood?.trim() ? `\nMOOD: "${mood.trim()}"` : ''}
${timeOfDay?.trim() ? `\nTIME: ${timeOfDay.trim()}` : ''}
${buildProfileCtx(profileCtx)}

Return ONLY valid JSON:
{
  "decoded_craving": {
    "surface_level": "What they said",
    "sensory_profile": { "texture": "X", "temperature": "X", "flavor": "X", "satisfaction_type": "X" },
    "emotional_layer": "What's driving this",
    "possible_nutrient_signal": "What body might need"
  },
  "sideways_solutions": [{ "suggestion": "Specific food/recipe", "why_it_works": "Which layers it satisfies", "satisfaction_prediction": "Should nail it|Pretty close|Worth trying|Might surprise", "effort": "Grab and go|5 min|15 min|Cooking project" }],
  "quick_fix": { "item": "Fastest option right now", "where": "Store/pantry", "honest_rating": "1-10" },
  "weekend_project": { "recipe": "From-scratch version", "why_worth_it": "Why special", "time": "Cook time" },
  "mindset_reframe": "Non-preachy perspective shift"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'FoodSwapCraving', max_tokens: 2000,
      system: withLanguage('Craving psychologist and food scientist. Decode all layers. Never dismiss cravings or lecture about willpower. All solutions satisfy ALL constraints. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[FoodSwapCraving] "${craving.trim().substring(0, 30)}" | ${parsed.sideways_solutions?.length || 0} solutions`);
    res.json(parsed);
  } catch (error) {
    console.error('[FoodSwapCraving]', error);
    res.status(500).json({ error: error.message || 'Failed to decode craving.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 5: BATCH SWAP
// ═══════════════════════════════════════════════════
router.post('/food-swap-batch', async (req, res) => {
  try {
    const { meals, constraint, profileCtx, userLanguage } = req.body;
    if (!meals?.length) return res.status(400).json({ error: 'Add at least one meal.' });
    const ct = normalizeConstraint(constraint);
    if (!ct) return res.status(400).json({ error: 'Describe your dietary constraint.' });

    const prompt = withLanguage(`Swap multiple meals. Specific, honest. Every swap satisfies ALL constraints.

MEALS:\n${meals.map((m, i) => `${i + 1}. "${m}"`).join('\n')}
CONSTRAINTS: "${ct}"
${buildProfileCtx(profileCtx)}

Return ONLY valid JSON:
{
  "swaps": [{ "original": "X", "best_swap": "Y with details", "closeness": 85, "key_change": "Main difference", "brand_tip": "Product/brand", "effort_change": "Same|More|Less" }],
  "overall_assessment": { "easy_wins": "Barely change", "biggest_challenges": "Need creativity", "weekly_prep_tip": "Batch strategy" }
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'FoodSwapBatch', max_tokens: 2500,
      system: withLanguage('Meal planning specialist. Specific brands, honest scores. All swaps satisfy ALL constraints. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[FoodSwapBatch] ${meals.length} meals × ${ct.substring(0, 20)}`);
    res.json(parsed);
  } catch (error) {
    console.error('[FoodSwapBatch]', error);
    res.status(500).json({ error: error.message || 'Failed to batch swap.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 6: DEEP DIVE — Detailed swap analysis
// ═══════════════════════════════════════════════════
router.post('/food-swap-deep', async (req, res) => {
  try {
    const { swapName, originalFood, constraint, userLanguage } = req.body;
    if (!swapName?.trim() || !originalFood?.trim()) return res.status(400).json({ error: 'Specify swap and original food.' });
    const ct = normalizeConstraint(constraint);

    const prompt = withLanguage(`Detailed deep dive on this food swap.

ORIGINAL: "${originalFood.trim()}"
SWAP: "${swapName.trim()}"
CONSTRAINTS: "${ct || 'Not specified'}"

Return ONLY valid JSON:
{
  "swap_name": "${swapName.trim()}",
  "detailed_comparison": { "taste": "X", "texture": "X", "appearance": "X", "aroma": "X" },
  "best_brands": [{ "brand": "X", "product": "X", "price_range": "$X-Y", "available_at": "X", "verdict": "X" }],
  "cooking_tips": ["Specific technique"],
  "common_mistakes": ["What people do wrong"],
  "recipes": [{ "name": "X", "description": "X", "time": "X", "difficulty": "Easy|Medium|Advanced" }],
  "honest_verdict": "When it works, when it doesn't, who loves vs tolerates it"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'FoodSwapDeep', max_tokens: 2000,
      system: withLanguage('Food swap expert with personal experience. Specific brands, honest assessments. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[FoodSwapDeep] ${swapName.trim()} for ${originalFood.trim()}`);
    res.json(parsed);
  } catch (error) {
    console.error('[FoodSwapDeep]', error);
    res.status(500).json({ error: error.message || 'Failed to deep dive.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 7: LABEL READER
// ═══════════════════════════════════════════════════
router.post('/food-swap-label', async (req, res) => {
  try {
    const { productName, ingredients, constraint, userLanguage } = req.body;
    if (!productName?.trim() && !ingredients?.trim()) return res.status(400).json({ error: 'Enter a product name or ingredient list.' });
    const ct = normalizeConstraint(constraint);
    if (!ct) return res.status(400).json({ error: 'Describe your dietary constraint.' });

    const prompt = withLanguage(`Label detective. Check against ALL constraints.

PRODUCT: "${productName?.trim() || 'Unknown'}"
INGREDIENTS: "${ingredients?.trim() || 'Not provided — analyze based on product name'}"
CONSTRAINTS: "${ct}"

Return ONLY valid JSON:
{
  "verdict": "Safe|Caution|Avoid|Check version",
  "verdict_emoji": "✅|⚠️|❌|🔍",
  "explanation": "Why — highlight problematic ingredients and which constraint they violate",
  "flagged_ingredients": [{ "ingredient": "X", "why_flagged": "X", "which_constraint": "X", "severity": "Definite|Possible|Trace risk" }],
  "safe_alternative": { "product": "Safe alternative for ALL constraints", "brand": "X", "where_to_find": "X" },
  "hidden_names": ["Other names ingredient hides under"],
  "label_tip": "Label-reading skill for these constraints"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'FoodSwapLabel', max_tokens: 1500,
      system: withLanguage('Food label expert. Every hidden name, cross-contamination risk, regulatory loophole. Check ALL constraints. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[FoodSwapLabel] "${productName?.trim() || 'product'}" → ${parsed.verdict}`);
    res.json(parsed);
  } catch (error) {
    console.error('[FoodSwapLabel]', error);
    res.status(500).json({ error: error.message || 'Failed to analyze label.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 8: SOCIAL SCRIPT
// ═══════════════════════════════════════════════════
router.post('/food-swap-social', async (req, res) => {
  try {
    const { situation, constraint, relationship, userLanguage } = req.body;
    if (!situation?.trim()) return res.status(400).json({ error: 'Describe the social situation.' });
    const ct = normalizeConstraint(constraint);
    if (!ct) return res.status(400).json({ error: 'Describe your dietary constraint.' });

    const prompt = withLanguage(`Navigate awkward social eating with dietary restrictions. Eat safely without making it weird.

SITUATION: "${situation.trim()}"
CONSTRAINTS: "${ct}"
${relationship?.trim() ? `\nRELATIONSHIP: "${relationship.trim()}"` : ''}

Return ONLY valid JSON:
{
  "situation_read": "Social dynamics assessment",
  "before_scripts": [{ "timing": "When to say this", "script": "Exact words — casual, not clinical", "tone": "Matter-of-fact|Appreciative|Humorous|Direct" }],
  "during_strategies": ["Practical strategy"],
  "if_they_push_back": { "pushback_type": "Common pushback", "response": "Firm but kind", "boundary_line": "When to be direct" },
  "backup_plan": "Eat before, bring food, order separately",
  "perspective": "Non-preachy thought"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'FoodSwapSocial', max_tokens: 1500,
      system: withLanguage('Social skills expert for dietary restrictions. Natural scripts, not rehearsed. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[FoodSwapSocial] ${situation.trim().substring(0, 40)}`);
    res.json(parsed);
  } catch (error) {
    console.error('[FoodSwapSocial]', error);
    res.status(500).json({ error: error.message || 'Failed to generate social script.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 9: RESWAP — Regenerate a single swap slot
// ═══════════════════════════════════════════════════
router.post('/food-swap-reswap', async (req, res) => {
  try {
    const { food, constraint, rejectedSwap, allRejected, profileCtx, favorites, userLanguage } = req.body;
    if (!food?.trim()) return res.status(400).json({ error: 'Describe the food.' });
    const ct = normalizeConstraint(constraint);
    if (!ct) return res.status(400).json({ error: 'Describe your constraint.' });

    const prompt = withLanguage(`User rejected "${rejectedSwap || 'a previous suggestion'}" as a swap for "${food.trim()}" (constraint: ${ct}). Generate ONE new swap — genuinely different direction.

FOOD: "${food.trim()}"
CONSTRAINTS: "${ct}"
REJECTED (do NOT suggest these or similar): ${(allRejected || [rejectedSwap]).filter(Boolean).join(', ')}
${buildProfileCtx(profileCtx)}${buildFavoritesCtx(favorites)}

Think creatively — different cuisine, different approach (homemade vs store-bought), unexpected angle.

Return ONLY valid JSON:
{
  "swap": {
    "name": "X", "type": "product|recipe|restaurant_hack|combo", "closeness_score": 80,
    "description": "Why it works differently from rejected", "brand_or_recipe": "X",
    "where_to_find": "X", "cost_comparison": "X", "prep_difficulty": "X",
    "pro_tip": "X", "honest_gap": "X", "why_different": "How this differs from rejected"
  }
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'FoodSwapReswap', max_tokens: 1000,
      system: withLanguage('Creative food swap specialist. User rejected a suggestion — think outside the box. Different direction entirely. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[FoodSwapReswap] New swap for "${food.trim().substring(0, 30)}" replacing "${rejectedSwap}"`);
    res.json(parsed);
  } catch (error) {
    console.error('[FoodSwapReswap]', error);
    res.status(500).json({ error: error.message || 'Failed to find alternative.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 10: MEAL PLAN — Full week under constraints
// ═══════════════════════════════════════════════════
router.post('/food-swap-mealplan', async (req, res) => {
  try {
    const { constraint, days, preferences, profileCtx, favorites, userLanguage } = req.body;
    const ct = normalizeConstraint(constraint);
    if (!ct) return res.status(400).json({ error: 'Describe your dietary constraint.' });
    const numDays = Math.min(Math.max(days || 7, 3), 7);

    const prompt = withLanguage(`Create a ${numDays}-day meal plan. Normal, delicious eating — not a "diet plan."

CONSTRAINTS: "${ct}"
${preferences?.trim() ? `\nPREFERENCES: "${preferences.trim()}"` : ''}
${buildFavoritesCtx(favorites)}
${buildProfileCtx(profileCtx)}
${buildSeasonCtx()}

RULES: Breakfast + lunch + dinner + 1 snack per day. Variety. Mix quick and worth-the-effort. ALL items satisfy ALL constraints. Include one "treat yourself" meal. Specific brands. Prefer seasonal produce for freshness and cost savings.

Return ONLY valid JSON:
{
  "plan_overview": { "difficulty": "Easy|Moderate|Involved", "estimated_weekly_grocery_cost": "$XX-YY", "prep_strategy": "Best batch approach" },
  "days": [{ "day": 1,
    "breakfast": { "meal": "X with brands", "prep_time": "X", "notes": "tip" },
    "lunch": { "meal": "X", "prep_time": "X", "notes": "tip" },
    "dinner": { "meal": "X", "prep_time": "X", "notes": "tip" },
    "snack": { "meal": "X", "notes": "tip" }
  }],
  "grocery_list": ["Organized by store section"],
  "leftover_strategy": "How to reuse leftovers",
  "treat_meal": { "what": "Indulgent meal", "when": "Which day", "why_it_feels_special": "Why" }
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'FoodSwapMealPlan', max_tokens: 3500,
      system: withLanguage(`Meal planning expert. Delicious plans, not punishment. Specific brands and times. Every item satisfies ALL constraints: ${ct}. Return ONLY valid JSON. No markdown.`, userLanguage) });
    console.log(`[FoodSwapMealPlan] ${numDays}-day plan for ${ct.substring(0, 30)}`);
    res.json(parsed);
  } catch (error) {
    console.error('[FoodSwapMealPlan]', error);
    res.status(500).json({ error: error.message || 'Failed to generate meal plan.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 11: HOST DINNER — Someone else is cooking for you
// ═══════════════════════════════════════════════════
router.post('/food-swap-host', async (req, res) => {
  try {
    const { hostContext, constraint, relationship, plannedMenu, userLanguage } = req.body;
    if (!hostContext?.trim()) return res.status(400).json({ error: 'Describe the dinner situation.' });
    const ct = normalizeConstraint(constraint);
    if (!ct) return res.status(400).json({ error: 'Describe your dietary constraint.' });

    const prompt = withLanguage(`Someone else is cooking for the user. Navigate dietary constraints gracefully.

SITUATION: "${hostContext.trim()}"
CONSTRAINTS: "${ct}"
${relationship?.trim() ? `\nRELATIONSHIP: "${relationship.trim()}"` : ''}
${plannedMenu?.trim() ? `\nPLANNED MENU: "${plannedMenu.trim()}"` : ''}

Return ONLY valid JSON:
{
  "approach": "Offer to help|Send suggestions|Bring a dish|Full guidance",
  "message_to_host": { "script": "Text/say to host — warm, specific, not demanding", "tone": "Appreciative and helpful", "what_to_offer": "Proactive offer" },
  "easy_swaps_for_host": [{ "if_they_planned": "Common dish", "simple_modification": "Easiest modification", "host_effort": "No change|Tiny tweak|Different ingredient|Different dish" }],
  "dishes_to_suggest": [{ "dish": "Crowd-pleaser that satisfies ALL constraints", "why_suggest": "Great for everyone", "complexity": "Easy|Medium|Involved" }],
  "bring_this": { "dish": "Specific dish to bring", "why": "Takes pressure off host", "how_to_frame_it": "What to say so bringing food isn't weird" },
  "worst_case_plan": "If nothing works",
  "gratitude_script": "What to say after dinner"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'FoodSwapHost', max_tokens: 2000,
      system: withLanguage('Expert at dietary restrictions when others cook. Balance clarity with graciousness. Dishes work for EVERYONE, not just restricted eater. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[FoodSwapHost] ${hostContext.trim().substring(0, 40)}`);
    res.json(parsed);
  } catch (error) {
    console.error('[FoodSwapHost]', error);
    res.status(500).json({ error: error.message || 'Failed to generate host guide.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 12: FULL RECIPE — Complete recipe for a swap
// ═══════════════════════════════════════════════════
router.post('/food-swap-recipe', async (req, res) => {
  try {
    const { recipeName, originalFood, constraint, servings, profileCtx, userLanguage } = req.body;
    if (!recipeName?.trim()) return res.status(400).json({ error: 'Specify the recipe.' });
    const ct = normalizeConstraint(constraint);

    const prompt = withLanguage(`Complete, cookable recipe for this dietary swap. Detailed enough to actually use.

RECIPE: "${recipeName.trim()}"
REPLACES: "${originalFood?.trim() || 'Not specified'}"
CONSTRAINTS: "${ct || 'Not specified'}"
SERVINGS: ${servings || 4}
${buildProfileCtx(profileCtx)}

Return ONLY valid JSON:
{
  "recipe_name": "${recipeName.trim()}",
  "replaces": "${originalFood?.trim() || ''}",
  "servings": ${servings || 4},
  "prep_time": "15 min", "cook_time": "30 min", "total_time": "45 min",
  "difficulty": "Easy|Medium|Advanced",
  "ingredients": [{ "item": "Ingredient with brand if it matters", "amount": "1 cup", "notes": "Optional", "substitution": "If hard to find use X" }],
  "steps": [{ "step": 1, "instruction": "Detailed — not 'mix ingredients' but specific technique", "time": "2 min", "tip": "Optional pro tip" }],
  "critical_tips": ["Make-or-break tips"],
  "storage": "How to store, how long",
  "closeness_to_original": "Honest assessment",
  "variations": ["Easy modifications"]
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'FoodSwapRecipe', max_tokens: 2500,
      system: withLanguage('Recipe developer for dietary restrictions. Precise, tested, honest. Specific brands and techniques that make the difference. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[FoodSwapRecipe] ${recipeName.trim()} | ${parsed.ingredients?.length || 0} ingredients, ${parsed.steps?.length || 0} steps`);
    res.json(parsed);
  } catch (error) {
    console.error('[FoodSwapRecipe]', error);
    res.status(500).json({ error: error.message || 'Failed to generate recipe.' });
  }
});



// ═══════════════════════════════════════════════════
// ROUTE 13: TRAVEL MODE — Eating safely abroad
// ═══════════════════════════════════════════════════
router.post('/food-swap-travel', async (req, res) => {
  try {
    const { destination, constraint, tripLength, profileCtx, userLanguage } = req.body;
    if (!destination?.trim()) return res.status(400).json({ error: 'Where are you traveling?' });
    const ct = normalizeConstraint(constraint);
    if (!ct) return res.status(400).json({ error: 'Describe your dietary constraint.' });

    const prompt = withLanguage(`Complete travel eating survival guide for someone with dietary constraints visiting a specific destination. NOT just restaurant ordering — cover everything from convenience stores to cultural norms.

DESTINATION: "${destination.trim()}"
DIETARY CONSTRAINTS: "${ct}"
TRIP LENGTH: ${tripLength || 'Not specified'}
${buildProfileCtx(profileCtx)}

Return ONLY valid JSON:
{
  "destination_overview": {
    "how_friendly": "Very friendly|Manageable|Challenging|Pack snacks",
    "cultural_attitude": "How this culture views dietary restrictions — helpful context for expectations",
    "good_news": "What's naturally easy about eating here with these constraints",
    "biggest_challenge": "The main hurdle you'll face"
  },
  "language_card": {
    "constraint_phrase": "How to say your constraint in the local language (phonetic + native script)",
    "safe_question": "How to ask 'does this contain X?' in local language",
    "emergency_phrase": "How to say 'I have an allergy to X, this is serious' in local language",
    "printable_card": "A full text block to show servers — native language — explaining your constraints clearly"
  },
  "safe_foods": [
    { "food": "Specific local food that's safe", "where_to_find": "Street stall / restaurant / convenience store", "how_to_identify": "What it looks like or how to ask for it", "price_range": "Budget estimate" }
  ],
  "convenience_stores": {
    "chains_to_know": "Which chains exist and which are best for your constraints",
    "safe_products": ["Specific products available at convenience stores that are safe"],
    "label_reading_tip": "How to read labels in this country — what to look for"
  },
  "hidden_dangers": [
    { "item": "Something tourists assume is safe but isn't", "why_dangerous": "Hidden ingredient or prep method", "local_name": "What it's called locally" }
  ],
  "packing_list": ["Things to bring from home — specific products"],
  "restaurant_survival": {
    "best_cuisine_types": "Which local restaurant types are safest",
    "worst_cuisine_types": "Which to avoid or approach with extreme caution",
    "booking_tip": "How to communicate constraints when making reservations"
  },
  "emergency_plan": "If you accidentally eat something wrong — what to do, local pharmacy terms, hospital phrase"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'FoodSwapTravel', max_tokens: 3000,
      system: withLanguage('You are a travel eating expert for people with dietary restrictions. You know local languages, convenience store chains, cultural attitudes, and hidden ingredients in every country. Give specific, life-saving advice. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[FoodSwapTravel] ${destination.trim()} + ${ct.substring(0, 30)}`);
    res.json(parsed);
  } catch (error) {
    console.error('[FoodSwapTravel]', error);
    res.status(500).json({ error: error.message || 'Failed to generate travel guide.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 14: SWAP STYLE — Analyze journal patterns
// ═══════════════════════════════════════════════════
router.post('/food-swap-style', async (req, res) => {
  try {
    const { journalEntries, constraint, userLanguage } = req.body;
    if (!journalEntries?.length || journalEntries.length < 5) return res.status(400).json({ error: 'Need at least 5 journal entries for a style analysis.' });
    const ct = normalizeConstraint(constraint);

    const entrySummary = journalEntries.slice(0, 30).map((e, i) =>
      `${i + 1}. "${e.swapName}" for "${e.originalFood}" — rated ${e.rating}/10${e.notes ? ` | Notes: "${e.notes}"` : ''}`
    ).join('\n');

    const prompt = withLanguage(`Analyze this person's food swap journal to identify their swap personality — what patterns reveal about their preferences, what works for them, and how to make future suggestions better.

JOURNAL ENTRIES:
${entrySummary}

DIETARY CONSTRAINTS: "${ct || 'Various'}"

Return ONLY valid JSON:
{
  "swap_personality": {
    "title": "A fun, specific personality name — e.g., 'The Texture Purist', 'The Brand Explorer', 'The Homemade Hero'",
    "description": "2-3 sentences describing their swap style based on the data"
  },
  "patterns": {
    "prefers_texture_over_flavor": true,
    "prefers_convenience_over_taste": false,
    "prefers_homemade_over_store": true,
    "adventurous_vs_safe": "adventurous|safe|mixed",
    "price_sensitivity": "high|medium|low"
  },
  "insights": [
    "Specific insight from their data — e.g., 'You consistently rate Asian-inspired swaps 2+ points higher than Western ones'",
    "Another data-backed insight",
    "A third insight"
  ],
  "avoid_ingredients": ["Ingredients/bases that consistently disappoint them based on low ratings"],
  "seek_ingredients": ["Ingredients/bases that consistently work well for them"],
  "recommendations": [
    "Personalized recommendation based on their patterns — specific products or approaches to try next"
  ],
  "stats": {
    "total_entries": ${journalEntries.length},
    "average_rating": 0,
    "highest_rated": "The swap they liked most",
    "most_common_food": "What they swap most often"
  },
  "encouragement": "A specific, non-generic encouragement based on their actual progress"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'FoodSwapStyle', max_tokens: 2000,
      system: withLanguage('You are a food preference analyst. Identify real patterns from actual data — not generic personality quizzes. Every insight must be backed by specific entries. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[FoodSwapStyle] ${journalEntries.length} entries analyzed`);
    res.json(parsed);
  } catch (error) {
    console.error('[FoodSwapStyle]', error);
    res.status(500).json({ error: error.message || 'Failed to analyze swap style.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 15: INGREDIENT DECODE — Explain a mystery ingredient
// ═══════════════════════════════════════════════════
router.post('/food-swap-decode-ingredient', async (req, res) => {
  try {
    const { ingredient, constraint, userLanguage } = req.body;
    if (!ingredient?.trim()) return res.status(400).json({ error: 'Enter an ingredient name.' });
    const ct = normalizeConstraint(constraint);

    const prompt = withLanguage(`Decode this ingredient for someone with dietary constraints. Be the expert friend who can translate label jargon.

INGREDIENT: "${ingredient.trim()}"
DIETARY CONSTRAINTS: "${ct || 'General'}"

Return ONLY valid JSON:
{
  "ingredient": "${ingredient.trim()}",
  "plain_english": "What this actually is in simple terms",
  "safe_for_constraints": true,
  "verdict": "Safe|Avoid|Depends|Check source",
  "verdict_emoji": "✅|❌|⚠️|🔍",
  "why": "Why it's safe or not for these specific constraints",
  "also_known_as": ["Other names this ingredient hides under"],
  "commonly_found_in": ["Product types where this ingredient shows up"],
  "derived_from": "What it's made from — the source matters for some constraints",
  "fun_fact": "One interesting thing about this ingredient most people don't know"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'FoodSwapDecodeIngredient', max_tokens: 1000,
      system: withLanguage('Food science expert. Decode ingredients clearly. Be specific about which constraints each ingredient violates or is safe for. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[FoodSwapDecodeIngredient] "${ingredient.trim()}" → ${parsed.verdict}`);
    res.json(parsed);
  } catch (error) {
    console.error('[FoodSwapDecodeIngredient]', error);
    res.status(500).json({ error: error.message || 'Failed to decode ingredient.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 16: PARTY PLANNER — Host multiple guests' constraints
// ═══════════════════════════════════════════════════
router.post('/food-swap-party', async (req, res) => {
  try {
    const { guests, occasion, headcount, preferences, profileCtx, userLanguage } = req.body;
    if (!guests?.length) return res.status(400).json({ error: 'Add at least one guest with constraints.' });

    const guestList = guests.map((g, i) => `${i + 1}. ${g.name || `Guest ${i + 1}`}: ${normalizeConstraint(g.constraints) || 'No restrictions'}`).join('\n');

    const prompt = withLanguage(`Plan a menu for a gathering where different guests have different dietary constraints. Every guest should feel included, not like a special case. The food should be genuinely delicious for EVERYONE.

GUESTS:
${guestList}

TOTAL HEADCOUNT: ${headcount || guests.length}
OCCASION: "${occasion?.trim() || 'Dinner party'}"
${preferences?.trim() ? `\nHOST PREFERENCES: "${preferences.trim()}"` : ''}
${buildProfileCtx(profileCtx)}
${buildSeasonCtx()}

STRATEGY: Maximize dishes that work for EVERYONE. Minimize separate "special" dishes. Use a smart mix of naturally-inclusive dishes + clearly-labeled options.

Return ONLY valid JSON:
{
  "strategy": {
    "approach": "How to handle this specific combination of constraints",
    "universal_dishes": "How many dishes work for literally everyone",
    "needs_separate": "What specifically needs a separate option and for whom"
  },
  "menu": [
    {
      "dish": "Specific dish name",
      "works_for": ["Guest names/numbers this dish satisfies"],
      "excludes": ["Anyone who CAN'T eat this — empty if universal"],
      "why_chosen": "Why this dish is strategic",
      "recipe_brief": "Brief recipe approach",
      "prep_difficulty": "Easy|Medium|Involved",
      "make_ahead": true
    }
  ],
  "shopping_list": ["Consolidated list organized by store section"],
  "prep_timeline": {
    "day_before": ["Tasks to do ahead"],
    "day_of": ["Tasks for the day"],
    "last_minute": ["Right before serving"]
  },
  "labeling_strategy": "How to label dishes so guests can self-serve confidently without asking",
  "conversation_tip": "How to mention the dietary accommodations without making it A Thing",
  "backup_plan": "Quick-grab items to have on hand just in case"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'FoodSwapParty', max_tokens: 3000,
      system: withLanguage('You are a dinner party planner who specializes in dietary-inclusive menus. Every dish should taste great for everyone, not like a compromise. Give specific recipes, not vague suggestions. Make the host look effortlessly accommodating. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[FoodSwapParty] ${guests.length} guests, ${occasion || 'dinner'} | ${parsed.menu?.length || 0} dishes`);
    res.json(parsed);
  } catch (error) {
    console.error('[FoodSwapParty]', error);
    res.status(500).json({ error: error.message || 'Failed to plan party menu.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 17: CONFIDENCE CHECK — Transition milestone + encouragement
// ═══════════════════════════════════════════════════
router.post('/food-swap-confidence', async (req, res) => {
  try {
    const { constraint, weekNumber, currentFeeling, journalCount, favoriteCount, challengeThisWeek, userLanguage } = req.body;
    const ct = normalizeConstraint(constraint);
    if (!ct) return res.status(400).json({ error: 'Describe your constraint.' });

    const prompt = withLanguage(`Give a personalized transition check-in for someone adapting to dietary constraints. This is NOT therapy — it's practical encouragement timed to where they are in the transition.

CONSTRAINTS: "${ct}"
WEEK NUMBER: ${weekNumber || 1}
CURRENT FEELING: "${currentFeeling?.trim() || 'Not specified'}"
JOURNAL ENTRIES SO FAR: ${journalCount || 0}
FAVORITE SWAPS FOUND: ${favoriteCount || 0}
THIS WEEK'S CHALLENGE: "${challengeThisWeek?.trim() || 'Not specified'}"

KNOWN TRANSITION TIMELINE:
- Weeks 1-2: Overwhelming, everything feels hard
- Weeks 3-4: Starting to find a groove, some wins
- Weeks 5-8: Autopilot forming, occasional frustration
- Months 3+: New normal, but slip risk from decision fatigue

Return ONLY valid JSON:
{
  "check_in_title": "A specific, encouraging title — not generic",
  "where_you_are": "Honest assessment of where they are in the transition arc based on their data",
  "validation": "Acknowledge their specific challenge or feeling without dismissing it",
  "milestone": {
    "headline": "A specific milestone to celebrate — based on their actual numbers",
    "context": "Why this milestone matters"
  },
  "this_week_tip": "One specific, actionable suggestion for THIS week based on where they are",
  "anticipate_next": "What to expect in the coming week — what gets easier, what might be hard",
  "reframe": "A perspective shift that's genuinely helpful, not toxic-positive",
  "challenge": {
    "title": "A small, fun food challenge for the week",
    "description": "Specific and doable",
    "reward": "How to reward yourself when you complete it"
  }
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'FoodSwapConfidence', max_tokens: 1500,
      system: withLanguage('You are a dietary transition coach who is warm, practical, and honest. You know the emotional arc of food restriction and meet people where they are. Never preachy. Never dismissive. Always specific to their situation. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[FoodSwapConfidence] Week ${weekNumber || 1} check-in`);
    res.json(parsed);
  } catch (error) {
    console.error('[FoodSwapConfidence]', error);
    res.status(500).json({ error: error.message || 'Failed to generate check-in.' });
  }
});
// ═══════════════════════════════════════════════════
// ROUTE 13: TRAVEL MODE — Eating safely abroad
// ═══════════════════════════════════════════════════
router.post('/food-swap-travel', async (req, res) => {
  try {
    const { destination, constraint, tripLength, profileCtx, userLanguage } = req.body;
    if (!destination?.trim()) return res.status(400).json({ error: 'Where are you traveling?' });
    const ct = normalizeConstraint(constraint);
    if (!ct) return res.status(400).json({ error: 'Describe your dietary constraint.' });

    const tripCtx = tripLength?.trim() ? `\nTRIP LENGTH: ${tripLength.trim()}` : '';

    const prompt = withLanguage(`Complete travel eating survival guide for someone with dietary constraints visiting a foreign country. This is NOT restaurant recommendations — it's "how to not starve and not get sick."

DESTINATION: "${destination.trim()}"
DIETARY CONSTRAINTS: "${ct}"
${tripCtx}
${buildProfileCtx(profileCtx)}

Return ONLY valid JSON:
{
  "destination_overview": {
    "difficulty": "Easy|Moderate|Challenging|Survival mode",
    "cultural_attitude": "How this culture generally views dietary restrictions — supportive, confused, offended, indifferent",
    "good_news": "What this destination naturally does well for these constraints",
    "biggest_challenge": "The main thing that will trip you up"
  },
  "language_card": {
    "phrase": "How to explain your constraint in the local language — phonetic pronunciation included",
    "allergy_statement": "A formal allergy/restriction statement to show servers — in the local script + English",
    "key_words": [
      { "local": "Word in local language", "english": "English meaning", "pronunciation": "Phonetic guide" }
    ],
    "printable_card": "A complete 2-3 sentence card to show at restaurants — local language"
  },
  "labeling_laws": {
    "how_labels_work": "How food labeling works in this country — are allergens marked?",
    "trusted_symbols": "Certification marks or symbols to look for",
    "gotchas": "Labeling practices that differ from the US/UK — what to watch for"
  },
  "safe_shopping": {
    "convenience_stores": ["Safe grab-and-go items at convenience stores — specific brands/products"],
    "grocery_staples": ["What to buy at a grocery store for self-catering"],
    "markets": "What's safe and what to avoid at local markets"
  },
  "restaurant_survival": {
    "cuisine_types_ranked": [
      { "type": "Cuisine type available in this destination", "safety": "Very safe|Manageable|Risky", "tip": "Specific ordering advice" }
    ],
    "universal_safe_orders": ["Dishes that are almost always safe anywhere in this country"],
    "danger_dishes": ["Dishes that seem safe but contain hidden violations"]
  },
  "pack_these": ["Items to bring from home that you won't easily find there"],
  "emergency_plan": "What to do if you accidentally eat something you shouldn't — local pharmacy products, hospital phrase",
  "apps_and_resources": ["Useful apps or websites for this destination + constraint"]
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'FoodSwapTravel', max_tokens: 3000,
      system: withLanguage('You are a dietary-restriction travel expert who has navigated eating safely in every country. You give specific brand names, phonetic pronunciations, and practical survival advice. You know the labeling laws, the cultural attitudes, and the hidden ingredients in every cuisine. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[FoodSwapTravel] ${destination.trim()} + ${ct.substring(0, 30)}`);
    res.json(parsed);
  } catch (error) {
    console.error('[FoodSwapTravel]', error);
    res.status(500).json({ error: error.message || 'Failed to generate travel guide.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 14: PARTY PLANNER — Host for guests with mixed constraints
// ═══════════════════════════════════════════════════
router.post('/food-swap-party', async (req, res) => {
  try {
    const { guestCount, guestConstraints, occasion, cuisinePreference, profileCtx, userLanguage } = req.body;
    if (!guestConstraints?.length) return res.status(400).json({ error: 'List your guests and their dietary needs.' });

    const prompt = withLanguage(`Plan a menu for a gathering where guests have DIFFERENT dietary constraints. The magic trick: find dishes that work for everyone (or smart pairings where every person has plenty to eat) without making anyone feel singled out.

GUESTS: ${guestCount || guestConstraints.length} people
DIETARY CONSTRAINTS BY GUEST:
${guestConstraints.map((g, i) => `Guest ${i + 1}: ${g.name || 'Guest ' + (i + 1)} — ${normalizeConstraint(g.constraints)}`).join('\n')}
${occasion?.trim() ? `\nOCCASION: "${occasion.trim()}"` : ''}
${cuisinePreference?.trim() ? `\nCUISINE PREFERENCE: "${cuisinePreference.trim()}"` : ''}
${buildProfileCtx(profileCtx)}

RULES:
- Prioritize dishes that EVERYONE can eat — label which constraints each dish satisfies
- For dishes that don't work for everyone, always have a paired alternative
- Make the "restricted" options look and feel as good as everything else — no sad side plates
- Include appetizers, main, sides, dessert
- Be specific with recipes/brands

Return ONLY valid JSON:
{
  "strategy": "Overview of how you're solving this puzzle — which constraints overlap and which need special handling",
  "universal_dishes": [
    {
      "dish": "Dish that works for ALL guests",
      "satisfies": ["list of all constraints it satisfies"],
      "description": "What it is — specific enough to cook from",
      "crowd_appeal": "Why this doesn't feel like a 'restricted' dish"
    }
  ],
  "paired_dishes": [
    {
      "main_dish": "The main version",
      "alternative": "The alternative for guests who can't eat the main",
      "who_needs_alt": "Which guests need the alternative",
      "presentation_tip": "How to present both so nobody feels singled out"
    }
  ],
  "menu": {
    "appetizers": ["Specific dishes with notes on which constraints they satisfy"],
    "mains": ["Specific dishes"],
    "sides": ["Specific dishes"],
    "dessert": ["Specific dishes"]
  },
  "shopping_list": ["Consolidated list organized by section"],
  "prep_timeline": {
    "day_before": ["What to prep ahead"],
    "day_of": ["Timeline of cooking tasks"],
    "last_minute": ["Final assembly"]
  },
  "hosting_tips": [
    "Practical tips — label cards, buffet layout, how to handle questions without making it awkward"
  ]
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'FoodSwapParty', max_tokens: 3000,
      system: withLanguage('You are a party menu planner who specializes in mixed dietary requirements. You find dishes that work for everyone without making anyone feel like a burden. Specific recipes, brands, and presentation tips. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[FoodSwapParty] ${guestConstraints.length} guests, ${occasion || 'gathering'}`);
    res.json(parsed);
  } catch (error) {
    console.error('[FoodSwapParty]', error);
    res.status(500).json({ error: error.message || 'Failed to plan party menu.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 15: SWAP STYLE PROFILE — Analyze journal patterns
// ═══════════════════════════════════════════════════
router.post('/food-swap-style', async (req, res) => {
  try {
    const { journalEntries, constraint, favorites, userLanguage } = req.body;
    if (!journalEntries?.length || journalEntries.length < 5) return res.status(400).json({ error: 'Need at least 5 journal entries for a meaningful profile.' });

    const prompt = withLanguage(`Analyze this person's food swap journal to build a "Swap Style Profile" — their personal pattern of what works and what doesn't. This should feel like an insight, not a report.

DIETARY CONSTRAINTS: "${normalizeConstraint(constraint)}"
FAVORITES: ${favorites?.map(f => f.name || f).join(', ') || 'None yet'}

JOURNAL ENTRIES (most recent first):
${journalEntries.slice(0, 30).map((e, i) => `${i + 1}. "${e.swapName}" for "${e.originalFood}" — rated ${e.rating}/10. Notes: "${e.notes || 'none'}"`).join('\n')}

Analyze patterns. What textures do they prefer? Do they lean toward products or homemade? Do certain base ingredients keep appearing (or keep disappointing)? What's their comfort zone vs. adventure zone?

Return ONLY valid JSON:
{
  "swap_style": {
    "title": "A fun, memorable 2-3 word style name — e.g., 'Texture-First Explorer' or 'Comfort Zone Maximizer'",
    "description": "2-3 sentences describing their swap personality",
    "emoji": "A single emoji that captures their style"
  },
  "patterns": {
    "texture_preference": "What textures they consistently rate highest",
    "approach_preference": "Products vs homemade vs restaurant hacks — which they gravitate toward",
    "flavor_profile": "The flavor profiles that work best for them",
    "sweet_spot": "The overlap of easy + satisfying that works best for their lifestyle",
    "adventure_level": "How willing they are to try unexpected swaps"
  },
  "insights": [
    "Specific, actionable insight — e.g., 'You rate coconut-based swaps 3/10 on average — avoid these' or 'Homemade versions consistently score 2+ points higher than products for you'"
  ],
  "avoid_for_you": ["Ingredients or approaches that consistently disappoint THIS person"],
  "lean_into": ["Ingredients or approaches that consistently work for THIS person"],
  "next_to_try": [
    {
      "suggestion": "A specific swap to try based on their patterns",
      "why": "How it matches their style"
    }
  ],
  "milestone": {
    "total_logged": ${journalEntries.length},
    "average_rating": "X.X",
    "best_swap": "Their highest-rated swap",
    "message": "An encouraging, specific message about their progress"
  }
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'FoodSwapStyle', max_tokens: 2000,
      system: withLanguage('You are a food preference analyst. Find real patterns in the data — not generic advice. Every insight should reference specific entries from their journal. Be warm and encouraging. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[FoodSwapStyle] ${journalEntries.length} entries → "${parsed.swap_style?.title || '?'}"`);
    res.json(parsed);
  } catch (error) {
    console.error('[FoodSwapStyle]', error);
    res.status(500).json({ error: error.message || 'Failed to analyze swap style.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 16: FRIDGE CHECK — Do I have what I need?
// ═══════════════════════════════════════════════════
router.post('/food-swap-fridge', async (req, res) => {
  try {
    const { onHand, constraint, mealsPlanned, profileCtx, userLanguage } = req.body;
    if (!onHand?.trim()) return res.status(400).json({ error: 'List what you have on hand.' });
    const ct = normalizeConstraint(constraint);

    const prompt = withLanguage(`Quick fridge/pantry check. The user has listed what they have. Tell them if they're set for their planned meals, what's missing, and what they can make right now.

ON HAND: "${onHand.trim()}"
DIETARY CONSTRAINTS: "${ct || 'None specified'}"
${mealsPlanned?.trim() ? `\nPLANNED MEALS: "${mealsPlanned.trim()}"` : ''}
${buildProfileCtx(profileCtx)}

Return ONLY valid JSON:
{
  "status": "You're set|Almost there|Need a store run",
  "status_emoji": "✅|⚠️|🛒",
  "can_make_now": [
    { "meal": "Something they can make right now with what they have", "missing_nothing": true }
  ],
  "gaps": [
    { "item": "What's missing", "needed_for": "Which planned meal needs it", "substitute": "Can they sub with something they already have? If so, what" }
  ],
  "quick_shop_list": ["Only what they actually need — nothing extra"],
  "bonus_meal": "An unexpected meal they could make with what they have that they might not have thought of"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'FoodSwapFridge', max_tokens: 1500,
      system: withLanguage('Quick, practical fridge assessment. Tell them what they can make NOW, what they need, and nothing else. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[FoodSwapFridge] ${parsed.status} | ${parsed.gaps?.length || 0} gaps`);
    res.json(parsed);
  } catch (error) {
    console.error('[FoodSwapFridge]', error);
    res.status(500).json({ error: error.message || 'Failed to check fridge.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 17: EXPIRATION GUIDE — Shelf life and quirks of swap products
// ═══════════════════════════════════════════════════
router.post('/food-swap-expiry', async (req, res) => {
  try {
    const { products, constraint, userLanguage } = req.body;
    if (!products?.length) return res.status(400).json({ error: 'List the swap products you bought.' });

    const prompt = withLanguage(`Give shelf life and usage quirks for these dietary substitute products. Most people learn these the hard way (curdled oat milk, crumbly GF bread) — save them the trouble.

PRODUCTS: ${products.map(p => `"${p}"`).join(', ')}
DIETARY CONTEXT: "${normalizeConstraint(constraint) || 'General'}"

Return ONLY valid JSON:
{
  "products": [
    {
      "name": "Product name",
      "opened_shelf_life": "How long it lasts once opened — be specific",
      "unopened_shelf_life": "Shelf life sealed",
      "storage": "Fridge|Pantry|Freezer — and any special requirements",
      "quirks": [
        "Behavior that differs from the 'original' version — e.g., 'Curdles in hot coffee after day 4' or 'Gets crumbly if not stored in airtight bag'"
      ],
      "freezer_friendly": "Yes with notes|No|Partially",
      "signs_its_gone_bad": "What to look for — different from regular dairy/gluten products",
      "pro_tip": "The one thing that extends life or improves the product"
    }
  ],
  "general_tips": [
    "Universal storage tips for this category of substitutes"
  ]
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'FoodSwapExpiry', max_tokens: 2000,
      system: withLanguage('You are an expert on dietary substitute product shelf life and storage. You know every quirk — when oat milk curdles, when GF bread goes stale, when vegan cheese sweats. Practical, specific advice. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[FoodSwapExpiry] ${products.length} products`);
    res.json(parsed);
  } catch (error) {
    console.error('[FoodSwapExpiry]', error);
    res.status(500).json({ error: error.message || 'Failed to get expiration guide.' });
  }
});

module.exports = router;
