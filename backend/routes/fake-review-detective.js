const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/fake-review-detective', async (req, res) => {
  const { action } = req.body;

  try {
    switch (action) {

      // ════════════════════════════════════════════════════════
      // ACTION: SCORE — per-review authenticity scoring
      // ════════════════════════════════════════════════════════
      case 'score': {
        const { reviews, stats, category, truncated, totalReviewCount, userLanguage } = req.body;

        if (!reviews || !reviews.length) {
          return res.status(400).json({ error: 'No reviews provided' });
        }

        const systemPrompt = `You are a fake review detection expert. You will receive a batch of product reviews with pre-computed statistics. Your job is to score EACH review individually for authenticity.

WHAT YOU'RE GOOD AT (focus here):
- Detecting marketing speak vs genuine user language
- Identifying templated/formulaic review patterns  
- Judging whether "specific details" are genuinely informative or filler
- Detecting emotional manipulation (fake urgency, fake disappointment)
- Recognizing when a negative review is a competitive attack vs legitimate complaint
- Noticing when multiple reviews share suspiciously similar phrasing or structure

WHAT'S ALREADY COMPUTED (trust these numbers — do NOT recalculate):
- Word counts, star ratings, verification status, posting dates
- Exclamation counts, caps ratios, generic praise flags
- Date clusters and timing patterns

SCORING GUIDELINES:
- 80-100: Almost certainly genuine. Specific experiences, natural language, realistic mix of praise/criticism
- 60-79: Probably genuine. Some specifics but nothing alarming either way
- 40-59: Uncertain. Could go either way — insufficient signals  
- 20-39: Probably fake. Multiple red flags — generic language, suspicious timing, no verification
- 0-19: Almost certainly fake. Reads like marketing copy, part of a posting cluster, no genuine user signals

Be calibrated. Not every 5-star review is fake. Not every short review is suspicious. Use the pre-computed signals AND your language analysis together. Be specific in your red_flags and green_flags — cite exact phrases or patterns you noticed.`;

        const reviewList = reviews.map(r => {
          return `[Review #${r.index}]
Rating: ${r.starRating || 'unknown'}/5 | Verified: ${r.isVerified ? 'YES' : 'NO'} | Posted: ${r.daysAgo !== null ? r.daysAgo + ' days ago' : 'unknown'}
Words: ${r.wordCount} | Exclamations: ${r.exclamationCount} | Caps ratio: ${r.capsRatio} | Has specifics: ${r.hasSpecificDetails} | Generic praise: ${r.hasGenericPraise} | Mentions competitor: ${r.mentionsCompetitor}
Text: "${r.rawText}"`;
        }).join('\n\n');

        const userPrompt = `PRODUCT CATEGORY: ${category}
${truncated ? `NOTE: Analyzing first 20 of ${totalReviewCount} reviews.\n` : ''}
PRE-COMPUTED AGGREGATE STATS:
- Total reviews: ${stats.totalReviews}
- Average rating: ${stats.averageRating}/5 (std dev: ${stats.starDeviation})
- Star distribution: 5★=${stats.starDistribution[5]}, 4★=${stats.starDistribution[4]}, 3★=${stats.starDistribution[3]}, 2★=${stats.starDistribution[2]}, 1★=${stats.starDistribution[1]}
- Verified: ${stats.verifiedCount}/${stats.totalReviews} (${stats.verifiedPercent}%)
- Avg word count: ${stats.avgWordCount}
- Short reviews (<15 words): ${stats.shortReviewCount}
- Date clusters (3+ reviews within 48hrs): ${stats.dateClusters?.length > 0 ? stats.dateClusters.map(cl => `${cl.count} reviews ${cl.daysAgoRange}`).join(', ') : 'none'}
- High caps reviews: ${stats.highCapsCount}
- High exclamation reviews: ${stats.highExclamationCount}
- Generic praise reviews: ${stats.genericPraiseCount}
- Specific detail reviews: ${stats.specificDetailCount}

REVIEWS TO SCORE:
${reviewList}

Return ONLY valid JSON with this exact structure:
{
  "scores": [
    {
      "index": 0,
      "authenticity_score": 25,
      "verdict": "likely_fake",
      "red_flags": ["Specific red flag 1", "Specific red flag 2"],
      "green_flags": [],
      "one_liner": "One sentence assessment of this specific review"
    }
  ]
}

Score EVERY review. Verdicts must be: "likely_fake" (score 0-39), "uncertain" (40-59), or "likely_genuine" (60-100).`;

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2500,
          system: withLanguage(systemPrompt, userLanguage),
          messages: [{ role: 'user', content: userPrompt }],
        });

        const text = message.content.find(b => b.type === 'text')?.text || '';
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const first = cleaned.indexOf('{');
        const last = cleaned.lastIndexOf('}');
        if (first === -1 || last === -1) throw new Error('No JSON in response');
        const parsed = JSON.parse(cleaned.substring(first, last + 1));

        return res.json(parsed);
      }

      // ════════════════════════════════════════════════════════
      // ACTION: ANALYZE — cross-review pattern analysis
      // ════════════════════════════════════════════════════════
      case 'analyze': {
        const { reviews, scores, stats, category, userLanguage } = req.body;

        if (!reviews || !scores) {
          return res.status(400).json({ error: 'Reviews and scores are required' });
        }

        const systemPrompt = `You are a review fraud analyst. You've received individual review scores and pre-computed statistics. Your job is to analyze PATTERNS across reviews and deliver a final assessment.

FOCUS ON:
1. Coordinated behavior: Do low-scoring reviews share timing, language patterns, or structure?
2. Review bombing: Is there evidence of a coordinated positive OR negative campaign?
3. Sentiment trajectory: Are reviews getting better or worse over time? Does this suggest product quality changes or manipulation?
4. Category norms: How do these patterns compare to typical ${category} products?
5. The gap between verified and unverified: Do verified reviews tell a different story than unverified ones?
6. Purchase recommendation: Based on ONLY the genuine reviews, what's the actual product quality?

IMPORTANT:
- All statistics are pre-computed and accurate. Trust them.
- Per-review scores are from a prior analysis pass. Use them but apply your own judgment.
- Be specific. "Reviews look suspicious" is useless. Cite specific reviews by number and specific patterns.
- Don't fearmonger. Some products genuinely have lots of positive reviews. Look for PATTERNS of manipulation, not just positivity.
- The purchase recommendation should be based on what the GENUINE reviews say about the product, not on whether fake reviews exist.
- The trust_score (0-100) represents overall trustworthiness of this review SET, not the product quality.`;

        const scoreSummary = scores.map(s =>
          `Review #${s.index}: score=${s.authenticity_score}, verdict=${s.verdict}, flags=[${(s.red_flags || []).join('; ')}]`
        ).join('\n');

        const reviewSummary = reviews.map(r =>
          `#${r.index}: ${r.starRating || '?'}★ | ${r.isVerified ? 'Verified' : 'Unverified'} | ${r.daysAgo !== null ? r.daysAgo + 'd ago' : '?'} | ${r.wordCount}w | "${r.rawText.slice(0, 120)}${r.rawText.length > 120 ? '...' : ''}"`
        ).join('\n');

        const userPrompt = `PRODUCT CATEGORY: ${category}

PRE-COMPUTED STATS:
- ${stats.totalReviews} reviews, avg rating ${stats.averageRating}/5
- Verified: ${stats.verifiedPercent}% (${stats.verifiedCount}/${stats.totalReviews})
- Star distribution: 5★=${stats.starDistribution[5]}, 4★=${stats.starDistribution[4]}, 3★=${stats.starDistribution[3]}, 2★=${stats.starDistribution[2]}, 1★=${stats.starDistribution[1]}
- Date clusters: ${stats.dateClusters?.length > 0 ? stats.dateClusters.map(cl => `${cl.count} reviews ${cl.daysAgoRange}`).join(', ') : 'none'}
- Generic praise: ${stats.genericPraiseCount}, Specific details: ${stats.specificDetailCount}

PER-REVIEW SCORES (from prior analysis):
${scoreSummary}

REVIEW TEXTS:
${reviewSummary}

Return ONLY valid JSON:
{
  "quick_verdict": {
    "trust_score": 42,
    "label": "Approach with Caution",
    "one_liner": "Concise 1-2 sentence summary of the overall situation"
  },
  "manipulation_detected": {
    "type": "positive_campaign | negative_bombing | mixed | none",
    "confidence": "high | medium | low",
    "description": "Specific description or null",
    "evidence": ["evidence 1", "evidence 2"]
  },
  "sentiment_trajectory": {
    "trend": "improving | declining | stable | insufficient_data",
    "description": "What the timeline tells us"
  },
  "genuine_consensus": {
    "summary": "What trustworthy reviews actually say about the product",
    "real_pros": ["specific pro"],
    "real_cons": ["specific con"],
    "real_rating": 3.5
  },
  "category_comparison": {
    "unusual_patterns": ["unusual pattern for this category"],
    "normal_patterns": ["normal pattern for this category"]
  },
  "purchase_recommendation": {
    "verdict": "buy | skip | wait",
    "confidence": "high | medium | low",
    "reasoning": "Based on genuine reviews only"
  }
}`;

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          system: withLanguage(systemPrompt, userLanguage),
          messages: [{ role: 'user', content: userPrompt }],
        });

        const text = message.content.find(b => b.type === 'text')?.text || '';
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const first = cleaned.indexOf('{');
        const last = cleaned.lastIndexOf('}');
        if (first === -1 || last === -1) throw new Error('No JSON in response');
        const parsed = JSON.parse(cleaned.substring(first, last + 1));

        return res.json(parsed);
      }

      // ════════════════════════════════════════════════════════
      // ACTION: EXTRACT — fetch URL and extract reviews via AI
      // ════════════════════════════════════════════════════════
      case 'extract': {
        const { url, userLanguage } = req.body;

        if (!url || !url.trim()) {
          return res.status(400).json({ error: 'URL is required' });
        }

        // Validate URL
        let parsedUrl;
        try {
          parsedUrl = new URL(url.trim());
          if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            throw new Error('Invalid protocol');
          }
        } catch {
          return res.status(400).json({ error: 'Please enter a valid URL (https://...)' });
        }

        // Fetch the page
        let html;
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 15000);

          const response = await fetch(parsedUrl.href, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9',
            },
            signal: controller.signal,
            redirect: 'follow',
          });
          clearTimeout(timeout);

          if (!response.ok) {
            throw new Error(`Page returned ${response.status} ${response.statusText}`);
          }

          html = await response.text();
        } catch (fetchErr) {
          if (fetchErr.name === 'AbortError') {
            return res.status(504).json({ error: 'Page took too long to load (15s timeout)' });
          }
          return res.status(502).json({
            error: `Couldn't fetch that page: ${fetchErr.message}. The site may be blocking automated requests.`
          });
        }

        // Truncate HTML to ~80k chars to stay within token limits
        const maxChars = 80000;
        const truncatedHtml = html.length > maxChars
          ? html.substring(0, maxChars) + '\n[... truncated ...]'
          : html;

        // Use AI to extract reviews from the HTML
        const systemPrompt = `You are an expert at extracting product reviews from web page HTML. Your job is to find ALL individual customer reviews on the page and output them in a clean, structured text format.

EXTRACTION RULES:
1. Find every customer review on the page
2. For each review, extract: star rating, review text, reviewer name (if available), date posted (if available), and whether it's a verified/confirmed purchase
3. Output each review in this exact format (one blank line between reviews):

⭐⭐⭐⭐⭐ [review text here]
- [Verified Purchase, ]Posted [date]

4. Convert numeric ratings to star emoji (e.g., 4.0 = ⭐⭐⭐⭐, 3 out of 5 = ⭐⭐⭐)
5. If a review has no star rating, omit the stars line and just include the text
6. Include "Verified Purchase" prefix on the date line only if the page indicates the reviewer actually purchased the product
7. Preserve the actual review text — don't summarize or paraphrase
8. If the page has no reviews, return exactly: NO_REVIEWS_FOUND
9. Also detect the product name and category if visible on the page

OUTPUT FORMAT:
First line: PRODUCT: [product name or "Unknown"]
Second line: CATEGORY: [best guess category: Electronics, Home & Kitchen, Beauty, Fashion, Sports, Books, Health, Food, Toys, Automotive, or Other]
Third line: REVIEWS_FOUND: [count]
Then a blank line, then all reviews separated by blank lines.

Only output the formatted reviews. No explanations, no commentary.`;

        const userPrompt = `Extract all customer/product reviews from this web page HTML:\n\n${truncatedHtml}`;

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          system: withLanguage(systemPrompt, userLanguage),
          messages: [{ role: 'user', content: userPrompt }],
        });

        const text = message.content.find(b => b.type === 'text')?.text || '';

        if (text.includes('NO_REVIEWS_FOUND')) {
          return res.json({
            reviews: '',
            productName: null,
            category: null,
            reviewCount: 0,
            message: 'No reviews found on that page. The site may require JavaScript to load reviews, or the page may not contain customer reviews.',
          });
        }

        // Parse metadata from response
        const productMatch = text.match(/^PRODUCT:\s*(.+)$/m);
        const categoryMatch = text.match(/^CATEGORY:\s*(.+)$/m);
        const countMatch = text.match(/^REVIEWS_FOUND:\s*(\d+)$/m);

        // Extract just the review text (everything after the metadata header)
        let reviewText = text;
        const headerEnd = text.search(/\n\s*\n⭐|^\n*⭐/m);
        if (headerEnd !== -1) {
          reviewText = text.substring(headerEnd).trim();
        } else {
          // Try to strip the metadata lines
          reviewText = text
            .replace(/^PRODUCT:.*$/m, '')
            .replace(/^CATEGORY:.*$/m, '')
            .replace(/^REVIEWS_FOUND:.*$/m, '')
            .trim();
        }

        return res.json({
          reviews: reviewText,
          productName: productMatch ? productMatch[1].trim() : null,
          category: categoryMatch ? categoryMatch[1].trim() : null,
          reviewCount: countMatch ? parseInt(countMatch[1]) : null,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

  } catch (error) {
    console.error('Fake Review Detective error:', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

module.exports = router;
