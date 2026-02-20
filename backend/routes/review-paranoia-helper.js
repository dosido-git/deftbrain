const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/review-paranoia-helper', async (req, res) => {
  console.log('✅ Review Paranoia Helper V2 endpoint called');
  
  try {
    const { 
      reviewText, 
      productUrl, 
      category 
    } = req.body;
    
    console.log('📝 Request:', { 
      reviewLength: reviewText?.length,
      hasUrl: !!productUrl,
      category 
    });

    // Validation
    if (!reviewText || !reviewText.trim()) {
      return res.status(400).json({ error: 'Review text is required' });
    }

    if (reviewText.trim().length < 100) {
      return res.status(400).json({ error: 'Please provide at least 100 characters of reviews to analyze' });
    }

    const prompt = `You are an expert at detecting fake product reviews, review bombing campaigns, and analyzing review patterns. Provide comprehensive analysis including timeline patterns, verification stats, and comparative benchmarks.

PRODUCT CATEGORY: ${category}
${productUrl ? `PRODUCT URL: ${productUrl}` : ''}

REVIEWS TO ANALYZE:
${reviewText}

COMPREHENSIVE ANALYSIS FRAMEWORK:

## 1. BASIC FAKE REVIEW DETECTION

**A. Language Patterns:**
- Overly Positive Language: Excessive !!!, ALL CAPS, hyperbole
- Generic Praise: Vague superlatives without specifics
- Incentivized Language: References to free products, discounts
- Template Language: Suspiciously similar phrasing
- Marketing Speak: Sounds like product copy

**B. Content Quality:**
- Lack of Specifics: No actual product features mentioned
- No Cons Mentioned: Suspiciously perfect
- Photo/Video Absence: Claims without supporting media

## 2. ADVANCED TIMELINE ANALYSIS

**Review Timing Patterns:**
- **Review Bombing Detection**: Identify clusters of reviews posted within 24-48 hours
  - Look for: 5+ reviews same day, especially all 5-stars or all 1-stars
  - Note posting dates and detect coordinated campaigns
  
- **Launch Day Spam**: Excessive reviews immediately after product launch
  - Suspicious: 10+ reviews on day 1
  - Natural: 1-2 reviews in first week, building gradually
  
- **Suspicious Clusters**: Groups of similar reviews at specific times
  - Example: "10 generic 5-star reviews posted Jan 15, then silence"
  - Pattern: Campaign coordination

**Sentiment Timeline:**
- Analyze if reviews are getting better or worse over time
- Early reviews vs recent reviews sentiment comparison
- Product improvement or degradation indicators
- Example: "Early reviews (Month 1-2) were 4-5 stars, recent reviews (Month 6+) dropped to 2-3 stars - possible quality control issues"

## 3. COMPETITOR REVIEW BOMBING DETECTION

**Negative Campaign Indicators:**
- **Coordinated 1-Star Attacks**: Multiple 1-star reviews posted same day with similar complaints
- **Generic Negative Language**: "Terrible!", "Worst product ever!", "Complete waste!" without specifics
- **Competitive Mentions**: Reviews that mention competitor products favorably
- **Suspicious Patterns**: 
  - Product had good reviews, then sudden spike of negative reviews
  - Negative reviews use similar phrasing or structure
  - Reviewers created accounts just to leave negative review
  
**Astroturfing Detection:**
- Fake grassroots campaigns
- Multiple accounts with similar review patterns
- Unnatural language that sounds scripted

**Evidence to Flag:**
- "Product had 4.5 stars, then 15 one-star reviews appeared in 2 days all saying 'broke immediately'"
- "Negative reviews mention Brand X (competitor) as better alternative"
- "1-star reviews are generic while 5-star reviews have specific details"

## 4. VERIFICATION & STATISTICS ANALYSIS

**Verified Purchase Analysis:**
Count and calculate:
- Total reviews with "Verified Purchase" indicator
- Total reviews without verification
- Percentage verified
- Suspicious if: <40% verified (red flag), 40-70% (caution), >70% (good sign)

**Review Length Statistics:**
Calculate:
- Average review length (word count)
- Shortest review length
- Longest review length
- Suspiciously short reviews (<10 words) - count them
- Pattern: Fake reviews often very short OR very long/templated

**Star Rating Distribution:**
Count reviews by star rating (1-5 stars):
- 5-star count
- 4-star count
- 3-star count
- 2-star count
- 1-star count

Natural distribution: Bell curve or slight skew to 4-5 stars
Suspicious distribution: 90%+ at 5 stars, or bimodal (all 5s and 1s, nothing in middle)

## 5. CATEGORY BENCHMARKING

**Category-Specific Norms for ${category}:**

Electronics: 
- Expect technical details (battery life, specs, compatibility)
- Natural: 60-70% 4-5 stars, some 3-star "works but..." reviews
- Suspicious: No technical terminology

Home & Kitchen:
- Expect size/dimension mentions, material quality
- Natural: Mix of ratings, mentions of durability over time
- Suspicious: All reviews focus on appearance, none on function

Beauty & Personal Care:
- Expect skin type mentions, ingredient discussions
- Natural: Wide review spread (products work differently for different people)
- Suspicious: Everyone has identical positive results

Books & Media:
- Expect plot/content discussion, subjective opinions
- Natural: Wide rating spread based on taste
- Suspicious: All praise, no content-specific discussion

**Comparison to Category Averages:**
- Typical verified purchase rate for this category
- Typical review length for this category
- Typical star distribution for this category
- Flag unusual patterns

## 6. COMPREHENSIVE OUTPUT STRUCTURE

Generate detailed JSON with ALL of the following sections:

{
  "overall_assessment": {
    "fake_review_likelihood": "high / medium / low",
    "confidence_score": 75,
    "total_reviews_analyzed": 10,
    "summary": "2-3 sentence overview of findings"
  },
  
  "timeline_analysis": {
    "review_bombing_detected": true/false,
    "bombing_details": "Specific description of bombing pattern if detected, or null",
    "clusters": [
      "10 reviews posted on Jan 15, 2026",
      "5 reviews posted on Jan 16, 2026"
    ],
    "sentiment_trend": "Early reviews were positive (4-5 stars average), recent reviews declining (3 stars average) - suggests quality degradation over time" or "Consistent 4-star average over time" or null
  },
  
  "competitor_bombing": {
    "detected": true/false,
    "description": "Description of suspected competitor attack if detected, or null",
    "evidence": [
      "Sudden spike of 1-star reviews after months of positive reviews",
      "Negative reviews mention Competitor X as better alternative",
      "Coordinated posting pattern (all on same day)"
    ] or []
  },
  
  "verification_stats": {
    "verified": 5,
    "unverified": 5,
    "percentage_verified": 50
  },
  
  "star_distribution": {
    "1": 2,
    "2": 1,
    "3": 2,
    "4": 3,
    "5": 2
  },
  
  "review_length_stats": {
    "average": 45,
    "shortest": 5,
    "longest": 150,
    "suspiciously_short": 2
  },
  
  "category_benchmark": {
    "comparison": "This product has 90% 5-star reviews, significantly higher than ${category} category average of 60%. Combined with low verified purchase rate (30%), this is suspicious.",
    "unusual_patterns": [
      "Verified purchase rate (30%) is below category average (65%)",
      "Review length average (15 words) much shorter than typical ${category} reviews (50 words)",
      "No technical terminology despite being an Electronics product"
    ] or []
  },
  
  "fake_indicators": [
    {
      "pattern": "Pattern name",
      "instances": 5,
      "severity": "high/medium/low",
      "examples": ["quote 1", "quote 2"]
    }
  ],
  
  "legitimate_indicators": [
    {
      "pattern": "Pattern name",
      "instances": 3,
      "examples": ["quote 1", "quote 2"]
    }
  ],
  
  "genuine_pros": ["verified positive 1", "verified positive 2"],
  "genuine_cons": ["legitimate concern 1", "legitimate concern 2"],
  
  "reviews_to_trust": [
    {
      "excerpt": "Review excerpt",
      "why_trustworthy": "Reason",
      "key_insights": ["insight 1", "insight 2"]
    }
  ],
  
  "reviews_to_ignore": [
    {
      "excerpt": "Review excerpt",
      "why_suspicious": "Reason"
    }
  ],
  
  "purchase_recommendation": {
    "should_buy": "yes/no/maybe",
    "confidence": "high/medium/low",
    "reasoning": "Detailed explanation considering ALL analysis - fake reviews, bombing, verification rate, timeline, category benchmarks"
  },
  
  "additional_insights": "Any other notable patterns or observations"
}

## 7. ANALYSIS GUIDELINES

**Timeline Analysis:**
- Extract dates from reviews (look for "Posted X days ago", "Posted Jan 15", etc.)
- Identify clusters (5+ reviews within 48 hours)
- Track sentiment changes over time
- Flag review bombing (positive or negative)

**Verification Analysis:**
- Count "Verified Purchase" mentions explicitly
- Calculate percentage
- Flag if <40% verified

**Category Benchmarking:**
- Apply category-specific expectations
- Compare patterns to typical category norms
- Flag unusual deviations

**Competitor Bombing:**
- Look for coordinated negative attacks
- Check for competitor mentions
- Detect sentiment shifts
- Identify astroturfing patterns

**Balanced Judgment:**
- Not all positive clusters are fake (product might genuinely be good)
- Consider context (new product launch = more early reviews is natural)
- Weight multiple signals together
- Be nuanced in recommendations

## 8. EXAMPLE COMPREHENSIVE ANALYSIS

Input: 10 reviews, 8 are 5-stars posted within 2 days, 2 are detailed 4-stars from verified purchasers posted weeks later

Output:
{
  "overall_assessment": {
    "fake_review_likelihood": "high",
    "confidence_score": 85,
    "total_reviews_analyzed": 10,
    "summary": "Strong evidence of review manipulation. 8 generic 5-star reviews posted within 48 hours with no verification, while only 2 verified reviews exist from actual purchasers."
  },
  "timeline_analysis": {
    "review_bombing_detected": true,
    "bombing_details": "8 five-star reviews posted Jan 15-16, 2026 within 48-hour window. All use generic language and lack verification.",
    "clusters": [
      "8 reviews posted Jan 15-16, 2026 (suspicious cluster)"
    ],
    "sentiment_trend": "Cannot assess trend - insufficient time span"
  },
  "competitor_bombing": {
    "detected": false,
    "description": null,
    "evidence": []
  },
  "verification_stats": {
    "verified": 2,
    "unverified": 8,
    "percentage_verified": 20
  },
  "star_distribution": {
    "5": 8,
    "4": 2,
    "3": 0,
    "2": 0,
    "1": 0
  },
  "review_length_stats": {
    "average": 18,
    "shortest": 8,
    "longest": 65,
    "suspiciously_short": 6
  },
  "category_benchmark": {
    "comparison": "For Electronics, verified purchase rate of 20% is extremely low (category average: 70%). Star distribution of 80% 5-stars is unusually high (category average: 50-60%).",
    "unusual_patterns": [
      "20% verified purchases vs 70% category average",
      "80% 5-star reviews vs 50-60% category average",
      "No technical details despite Electronics category"
    ]
  },
  "purchase_recommendation": {
    "should_buy": "no",
    "confidence": "high",
    "reasoning": "Multiple red flags: (1) Review bombing pattern with 8 reviews in 48 hours, (2) Only 20% verified purchases, (3) Unnaturally high 5-star concentration, (4) Reviews lack technical details expected for Electronics. The 2 verified reviews show product is mediocre (4 stars). Strong evidence of fake review campaign to inflate ratings. Wait for more legitimate reviews or consider alternatives."
  }
}

CRITICAL RULES:
1. Always include ALL sections in JSON output
2. Calculate actual statistics from review data
3. Detect timeline patterns from dates mentioned
4. Apply category-specific benchmarks
5. Look for competitor bombing evidence
6. Be specific with examples and numbers
7. Provide nuanced, balanced recommendations
8. Consider multiple signals together

Return ONLY valid JSON with all required sections.`;

    console.log('🤖 Calling Claude API...');

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
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
    console.log('📊 Analysis:', {
      fakeLikelihood: parsed.overall_assessment?.fake_review_likelihood,
      confidence: parsed.overall_assessment?.confidence_score,
      bombingDetected: parsed.timeline_analysis?.review_bombing_detected,
      competitorBombing: parsed.competitor_bombing?.detected,
      verifiedPercent: parsed.verification_stats?.percentage_verified,
      recommendation: parsed.purchase_recommendation?.should_buy
    });

    // Send response
    res.json(parsed);

  } catch (error) {
    console.error('❌ Review Paranoia Helper V2 error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to analyze reviews' 
    });
  }
});


module.exports = router;
