const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/anti-gift-panic', async (req, res) => {
  console.log('✅ Anti-Gift Panic V2 endpoint called');
  
  try {
    const { 
      age, 
      interests, 
      occasion, 
      occasionDate,
      daysUntilOccasion,
      budget, 
      relationship,
      considerSustainability,
      excludeProduct 
    } = req.body;
    
    console.log('📝 Request:', { 
      age, 
      occasion, 
      occasionDate,
      daysUntil: daysUntilOccasion,
      budget, 
      relationship,
      sustainable: considerSustainability 
    });

    // Validation
    if (!age || age < 1 || age > 120) {
      return res.status(400).json({ error: 'Valid age is required (1-120)' });
    }

    if (!interests || !interests.trim()) {
      return res.status(400).json({ error: 'Interests are required to generate recommendations' });
    }

    // Calculate shipping urgency
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const isHolidaySeason = [10, 11, 12].includes(currentDate.getMonth()); // Nov, Dec, Jan

    const prompt = `You are an ethical gift recommendation specialist with expertise in current trends, sustainable products, and thoughtful gift-giving.

RECIPIENT INFORMATION:
AGE: ${age}
INTERESTS: ${interests}
OCCASION: ${occasion}
${occasionDate ? `OCCASION DATE: ${occasionDate}` : ''}
${daysUntilOccasion !== null ? `DAYS UNTIL OCCASION: ${daysUntilOccasion} days` : ''}
BUDGET: $${budget}
RELATIONSHIP: ${relationship || 'Not specified'}
CURRENT DATE: ${currentDate.toISOString().split('T')[0]}
CURRENT SEASON: ${currentMonth}${isHolidaySeason ? ' (Holiday Season - consider shipping delays)' : ''}
${considerSustainability ? 'SUSTAINABILITY: Prioritize eco-friendly, ethical, and sustainable products' : ''}
${excludeProduct ? `EXCLUDE: Do not recommend "${excludeProduct}" - provide a different option instead.` : ''}

ETHICAL FRAMEWORK - READ CAREFULLY:

1. **Transparency & Honesty:**
   - All recommendations are merit-based ONLY
   - NEVER prioritize products based on commissions or affiliations
   - Purchase links are search terms only, NOT affiliate links
   - Be transparent about recommendation sources

2. **Privacy Protection:**
   - This analysis is ephemeral - no personal data stored
   - Protect recipient privacy
   - Don't suggest products that invade privacy

3. **Sustainability (when requested):**
   - Prioritize: eco-friendly, fair-trade, locally-made, sustainable materials
   - Favor: durable over disposable, quality over quantity
   - Consider: minimal packaging, carbon footprint, ethical production
   - Examples: Patagonia, tentree, Package Free Shop, Etsy artisans

4. **Consumer Protection:**
   - Warn about shipping times if occasion is soon
   - Note if products might be sold out seasonally
   - Suggest backup options for time-sensitive gifts

TASK: Generate ${excludeProduct ? '1' : '5'} specific, ethical gift recommendation(s).

REQUIREMENTS:

**Product Specificity:**
- "Ember Temperature Control Mug 2" not "smart mug"
- "Kindle Paperwhite (11th Gen)" not "e-reader"
- Include brand, model, specific variant

**Current Trends (${currentMonth} 2026):**
- Consider what's popular/trending NOW
- Seasonal appropriateness
- Holiday availability if applicable

**Shipping Time Awareness:**
${daysUntilOccasion !== null ? `
- ${daysUntilOccasion} days until occasion
- ${daysUntilOccasion <= 2 ? 'CRITICAL: Recommend express-shippable or digital/experience gifts only' : ''}
- ${daysUntilOccasion <= 7 ? 'URGENT: Note which items need express shipping' : ''}
- ${daysUntilOccasion > 14 ? 'GOOD TIME: Mention you have time to find deals' : ''}
- Consider ${isHolidaySeason ? 'holiday season shipping delays' : 'normal shipping times'}
` : '- No specific date provided - assume standard shipping'}

**Budget Optimization:**
- Stay within $${budget} budget
- Suggest if combining 2-3 smaller items might be better
- Note if going slightly over ($5-10) gets significantly better quality
- Identify best value-for-money options

**Sustainability (if requested):**
${considerSustainability ? `
- MUST prioritize sustainable/ethical options
- Look for: organic, recycled materials, carbon-neutral, fair-trade
- Favor small businesses and artisans over mega-corporations
- Note environmental benefits in reasoning
- Examples: reusable over disposable, quality over fast-fashion
` : '- Not prioritized this search'}

**Gift Card Message:**
- Generate ONE thoughtful, appropriate message for the occasion
- Match tone to relationship (formal for boss, warm for mom, funny for friend)
- Length: 2-4 sentences
- Personalized to occasion and relationship
- NOT generic - make it meaningful

**Gift Wrap Suggestion:**
- Match recipient's aesthetic (from interests)
- Match occasion formality
- Include presentation tips
- Be specific about style/colors/materials

OUTPUT (JSON only):
{
  "gift_recommendations": [
    {
      "product_name": "Exact product name with brand/model",
      "why_this_works": "Detailed explanation connecting interests and values. Mention sustainability if applicable.",
      "price_range": "$XX-XX or ~$XX",
      "confidence_score": 8,
      "purchase_link": "https://www.amazon.com/s?k=PRODUCT+NAME or Google search term",
      "category": "Electronics / Home / Books / Experience / Hobby / Fashion / Food / Sustainable",
      "personality_match": "How this fits their personality/values",
      "is_sustainable": true/false,
      "price_tracking_note": "Optional: 'Consider price tracking - this item often goes on sale' or 'Check CamelCamelCamel for price history' or null"
    }
  ],
  "shopping_tips": [
    "Budget-specific tip",
    "Where to find deals", 
    "Timing/availability considerations"
  ],
  "timing_advice": "${daysUntilOccasion !== null 
    ? `Specific advice for ${daysUntilOccasion} days timeframe. Include shipping method recommendations.` 
    : `General timing advice for ${occasion}`}",
  "gift_wrap_suggestion": "Specific wrapping style matching recipient aesthetic and occasion. Include colors, materials, presentation tips.",
  "gift_card_message": "Thoughtful 2-4 sentence message appropriate for ${occasion} and ${relationship || 'recipient'}. Warm and personal, not generic.",
  "budget_optimization": "Advice on getting best value within $${budget}. Note if combining items or adjusting budget slightly could improve gift quality.",
  ${considerSustainability ? '"sustainability_note": "Explanation of sustainable choices made and their environmental/ethical impact.",' : ''}
  "ethical_disclosure": "Transparency statement: All recommendations are merit-based. Links are non-affiliated search terms. Verify product details before purchase."
}

EXAMPLES FOR REFERENCE:

Example 1: Sustainable Option
{
  "product_name": "tentree TreeFleece Zip Hoodie",
  "why_this_works": "For someone interested in sustainable living, tentree plants 10 trees for every item purchased. High-quality, comfortable fleece made from recycled materials. They'll love knowing their gift helps reforest the planet.",
  "is_sustainable": true,
  "sustainability_note": "TreeFleece made from recycled polyester. B-Corp certified. Carbon-neutral shipping. 10 trees planted per purchase verified through planting partners."
}

Example 2: Shipping Urgency (2 days until occasion)
{
  "timing_advice": "With only 2 days until the occasion, standard shipping won't work. Recommend: (1) Amazon Prime same-day or next-day delivery, (2) Purchase digital gift cards from recommended stores for immediate delivery, (3) Experience gifts (cooking class, concert tickets) you can print/email today.",
  "shopping_tips": [
    "Check Amazon Prime for same-day delivery in your area",
    "Digital options available immediately: Audible, Kindle books, streaming subscriptions",
    "Experience gifts: Airbnb gift card, MasterClass subscription, local restaurant gift certificates can be emailed instantly"
  ]
}

Example 3: Budget Optimization
{
  "budget_optimization": "At $75 budget, you're in the sweet spot for quality gifts. Consider: (1) One premium item ($65-75) makes bigger impact than multiple cheaper items, (2) Going $10 over to $85 unlocks significantly better coffee grinders (Baratza Encore vs hand grinders), (3) Alternative: Combine $40 V60 + $35 specialty coffee beans for complete experience.",
  "shopping_tips": [
    "Coffee gear: Quality matters more than quantity - one great tool beats multiple mediocre ones",
    "Bundle opportunity: Pair equipment with consumables (beans, filters) for complete gift",
    "Price tracking: Coffee equipment often on sale - check CamelCamelCamel for price history"
  ]
}

Example 4: Gift Card Message (Birthday, Coworker)
{
  "gift_card_message": "Happy Birthday! I know how much you love your morning coffee ritual, so I thought this would be perfect for taking it to the next level. Here's to many delicious cups ahead. Enjoy your special day!"
}

Example 5: Gift Card Message (Thank You, Boss)
{
  "gift_card_message": "Thank you so much for your mentorship and support this year. Your guidance has been invaluable to my growth. I hope you enjoy this small token of my appreciation."
}

CRITICAL RULES:
1. **ETHICS FIRST:** Merit-based recommendations only. No affiliate bias.
2. **PRIVACY:** Don't suggest invasive products (tracking devices, etc.)
3. **TRANSPARENCY:** Include ethical_disclosure in every response
4. **SHIPPING AWARENESS:** Account for days until occasion
5. **SUSTAINABILITY:** When requested, genuinely prioritize eco-friendly options
6. **BUDGET HONESTY:** Don't exceed budget without good reason
7. **SPECIFIC PRODUCTS:** Brand names and models required
8. **GIFT CARD:** Personalized, not generic. Match tone to relationship.
9. **SEASONALITY:** Consider current month and holiday seasons

Return ONLY valid JSON. No markdown, no explanations outside JSON.`;

    console.log('🤖 Calling Claude API...');

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }]
    });

    console.log('✅ Claude API responded');

    // Extract text content
    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    
    // Robust JSON extraction
    let cleaned = textContent.trim();
    
    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Find first { and last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON object found in response');
    }
    
    // Extract only the JSON object
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    
    console.log('Cleaned JSON length:', cleaned.length);
    
    // Parse JSON
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      console.error('Problematic JSON (first 500 chars):', cleaned.substring(0, 500));
      throw new Error('Failed to parse response as JSON: ' + parseError.message);
    }
    
    console.log('✅ Response parsed successfully');
    console.log('📊 Generated', parsed.gift_recommendations?.length || 0, 'recommendations');
    console.log('💚 Sustainable options:', considerSustainability);
    console.log('📅 Days until occasion:', daysUntilOccasion);

    // Send response
    res.json(parsed);

  } catch (error) {
    console.error('❌ Anti-Gift Panic V2 error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate gift recommendations' 
    });
  }
});


module.exports = router;
