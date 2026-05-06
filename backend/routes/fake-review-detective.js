const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

router.post('/fake-review-detective', rateLimit(), async (req, res) => {
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

Be calibrated. Not every 5-star review is fake. Not every short review is suspicious. Use the pre-computed signals AND your language analysis together. Be specific in your red_flags and green_flags — cite exact phrases or patterns you noticed.

Return ONLY valid JSON.`;

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
          model: 'claude-sonnet-4-6',
          max_tokens: 2500,
          system: withLanguage(systemPrompt, userLanguage),
          messages: [{ role: 'user', content: userPrompt }],
        });

        const text = message.content.find(b => b.type === 'text')?.text || '';
        const parsed = JSON.parse(cleanJsonResponse(text));
        return res.json(parsed);
      }

      // ════════════════════════════════════════════════════════
      // ACTION: ANALYZE — cross-review pattern analysis + playbook
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
7. PLAYBOOK EDUCATION: Identify which specific fake review tactics are being used and explain them in plain language so the user learns to spot them independently.

IMPORTANT:
- All statistics are pre-computed and accurate. Trust them.
- Per-review scores are from a prior analysis pass. Use them but apply your own judgment.
- Be specific. "Reviews look suspicious" is useless. Cite specific reviews by number and specific patterns.
- Don't fearmonger. Some products genuinely have lots of positive reviews.
- The purchase recommendation should be based on what the GENUINE reviews say about the product.
- The trust_score (0-100) represents overall trustworthiness of this review SET.
- For the playbook: identify specific named tactics (review seeding, review bombing, incentivized reviews, competitive sabotage, template farming, etc.) and explain what to look for next time.

Return ONLY valid JSON.`;

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
    "one_liner": "Concise 1-2 sentence summary"
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
    "summary": "What trustworthy reviews actually say",
    "real_pros": ["specific pro"],
    "real_cons": ["specific con"],
    "real_rating": 3.5
  },
  "category_comparison": {
    "unusual_patterns": ["unusual pattern"],
    "normal_patterns": ["normal pattern"]
  },
  "purchase_recommendation": {
    "verdict": "buy | skip | wait",
    "confidence": "high | medium | low",
    "reasoning": "Based on genuine reviews only"
  },
  "playbook": {
    "tactics_detected": [
      {
        "name": "Review Seeding",
        "icon": "🌱",
        "description": "Brief explanation of what this tactic is",
        "evidence_here": "How it shows up in these specific reviews",
        "how_to_spot": "What to look for next time you see this in the wild"
      }
    ],
    "overall_tip": "One actionable takeaway for the user"
  }
}`;

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 2500,
          system: withLanguage(systemPrompt, userLanguage),
          messages: [{ role: 'user', content: userPrompt }],
        });

        const text = message.content.find(b => b.type === 'text')?.text || '';
        const parsed = JSON.parse(cleanJsonResponse(text));
        return res.json(parsed);
      }

      // ════════════════════════════════════════════════════════
      // ACTION: FINGERPRINT — detect same-author patterns
      // ════════════════════════════════════════════════════════
      case 'fingerprint': {
        const { reviews, scores, userLanguage } = req.body;

        if (!reviews || reviews.length < 3) {
          return res.status(400).json({ error: 'Need at least 3 reviews for fingerprinting' });
        }

        const systemPrompt = `You are a forensic linguistics expert specializing in authorship attribution. Your job is to analyze a set of product reviews and detect if any were likely written by the same person, the same organization, or from the same template.

ANALYZE THESE DIMENSIONS:
1. Sentence structure patterns: Do any reviews use suspiciously similar grammar, sentence openings, or paragraph structures?
2. Vocabulary fingerprints: Shared unusual word choices, phrases, or idioms across reviews
3. Punctuation habits: Similar use of exclamation marks, ellipses, capitalization patterns, emoji usage
4. Review structure: Do multiple reviews follow the same template (e.g., "intro praise → feature mention → recommendation")?
5. Content patterns: Suspiciously similar topics covered in the same order, or the same product features highlighted
6. Length similarity: Groups of reviews with unusually similar character/word counts

GROUP reviews that appear linked. A group means "likely same author or same template." Provide specific evidence for each group. Not every review needs to be in a group — solo reviews are fine.

Be precise. Don't flag reviews as linked just because they're both positive or both short. The fingerprint needs to be in the LANGUAGE itself.

Return ONLY valid JSON.`;

        const reviewTexts = reviews.map(r => {
          const sc = scores?.find(s => s.index === r.index);
          return `[Review #${r.index}] Score: ${sc?.authenticity_score ?? '?'} | ${r.starRating || '?'}★ | ${r.isVerified ? 'Verified' : 'Unverified'} | ${r.wordCount}w
"${r.rawText}"`;
        }).join('\n\n');

        const userPrompt = `REVIEWS TO FINGERPRINT:
${reviewTexts}

Return ONLY valid JSON:
{
  "author_groups": [
    {
      "group_id": 1,
      "review_indices": [0, 2, 4],
      "confidence": "high | medium | low",
      "pattern_type": "same_author | same_template | same_organization",
      "evidence": [
        "Specific linguistic evidence 1",
        "Specific linguistic evidence 2"
      ],
      "shared_phrases": ["exact phrase found in multiple reviews"],
      "summary": "One sentence explaining the connection"
    }
  ],
  "singleton_reviews": [1, 3, 5],
  "overall_assessment": "One paragraph summary of authorship patterns found",
  "template_detected": true,
  "template_structure": "Description of the template structure if found, or null"
}`;

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          system: withLanguage(systemPrompt, userLanguage),
          messages: [{ role: 'user', content: userPrompt }],
        });

        const text = message.content.find(b => b.type === 'text')?.text || '';
        const parsed = JSON.parse(cleanJsonResponse(text));
        return res.json(parsed);
      }

      // ════════════════════════════════════════════════════════
      // ACTION: SYNTHESIZE — cross-platform analysis
      // ════════════════════════════════════════════════════════
      case 'synthesize': {
        const { sources, userLanguage } = req.body;

        if (!sources || sources.length < 2) {
          return res.status(400).json({ error: 'Need at least 2 sources to synthesize' });
        }

        const systemPrompt = `You are a cross-platform review analyst. You've received review analysis results from MULTIPLE sources (e.g., Amazon, Best Buy, Reddit, etc.) for the SAME or similar products. Your job is to synthesize them into a unified truth.

KEY PRINCIPLES:
1. Compare trust scores across platforms. If one source is manipulated but others aren't, the genuine sources are more reliable.
2. Look for consensus: What do the genuine reviews across ALL platforms agree on?
3. Identify platform-specific manipulation: Some platforms are easier to manipulate than others.
4. Give a unified "real" recommendation that weighs all sources appropriately.
5. Identify disagreements between sources and explain why they might differ.
6. Be specific about which source you trust most and why.

Return ONLY valid JSON.`;

        const sourceSummaries = sources.map((s, i) => `
[SOURCE ${i + 1}: ${s.sourceName || 'Unknown'}]
- Trust Score: ${s.trustScore}/100
- Reviews: ${s.reviewCount} total, ${s.fakeCount} fake, ${s.genuineCount} genuine
- Verdict: ${s.verdict || 'N/A'}
- Category: ${s.category}
- Summary: ${s.summary}
- Genuine Pros: ${(s.realPros || []).join(', ') || 'none listed'}
- Genuine Cons: ${(s.realCons || []).join(', ') || 'none listed'}
- Manipulation: ${s.manipulationType || 'none'}
- Real Rating: ${s.realRating || '?'}/5`).join('\n');

        const userPrompt = `MULTI-SOURCE ANALYSIS:
${sourceSummaries}

Return ONLY valid JSON:
{
  "unified_trust_score": 65,
  "unified_verdict": "buy | skip | wait",
  "unified_confidence": "high | medium | low",
  "source_rankings": [
    {
      "source_name": "Best Buy",
      "trust_level": "most_reliable | reliable | somewhat_reliable | unreliable",
      "reasoning": "Why this source ranks here"
    }
  ],
  "consensus": {
    "agreed_pros": ["Things all genuine reviews across platforms agree on"],
    "agreed_cons": ["Cons agreed upon across platforms"],
    "real_rating": 3.5,
    "summary": "The cross-platform truth about this product"
  },
  "disagreements": [
    {
      "topic": "Battery life",
      "description": "Amazon reviews say 8hrs, Best Buy reviews say 5hrs — likely different usage patterns or different product versions"
    }
  ],
  "platform_insights": "What the cross-platform comparison reveals about manipulation",
  "final_recommendation": "Clear, actionable recommendation based on all sources"
}`;

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 2000,
          system: withLanguage(systemPrompt, userLanguage),
          messages: [{ role: 'user', content: userPrompt }],
        });

        const text = message.content.find(b => b.type === 'text')?.text || '';
        const parsed = JSON.parse(cleanJsonResponse(text));
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

        let parsedUrl;
        try {
          parsedUrl = new URL(url.trim());
          if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error('Invalid protocol');
        } catch {
          return res.status(400).json({ error: 'Please enter a valid URL (https://...)' });
        }

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
            signal: controller.signal, redirect: 'follow',
          });
          clearTimeout(timeout);
          if (!response.ok) throw new Error(`Page returned ${response.status} ${response.statusText}`);
          html = await response.text();
        } catch (fetchErr) {
          if (fetchErr.name === 'AbortError') return res.status(504).json({ error: 'Page took too long (15s timeout)' });
          return res.status(502).json({ error: `Couldn't fetch: ${fetchErr.message}. Site may block automated requests.` });
        }

        // ── Step 1: Try JSON-LD structured data (richest source on many retail sites) ──
        const jsonLdBlocks = [];
        const jsonLdRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
        let m;
        while ((m = jsonLdRe.exec(html)) !== null) {
          try {
            const parsed = JSON.parse(m[1]);
            const flat = JSON.stringify(parsed);
            // Only keep blocks that mention reviews/ratings
            if (/review|rating|ratingValue|reviewBody/i.test(flat)) jsonLdBlocks.push(flat);
          } catch { /* ignore malformed JSON */ }
        }

        // ── Step 2: Try embedded JSON state blobs (Amazon, Walmart, etc.) ──
        const stateBlobs = [];
        const stateBlobRe = /(?:window\.__)?(?:INITIAL_STATE|APP_STATE|DATA|__reactProps\$[^=]+=|reviewData|reviewsData)\s*=\s*({[\s\S]{200,8000}?});/g;
        while ((m = stateBlobRe.exec(html)) !== null) {
          if (/review|rating/i.test(m[1])) stateBlobs.push(m[1].substring(0, 4000));
        }

        // ── Step 3: Strip HTML to readable text (removes tags, scripts, styles) ──
        const stripped = html
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
          .replace(/<!--[\s\S]*?-->/g, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
          .replace(/\s{3,}/g, '\n')
          .trim();

        // ── Assemble content for Claude, prioritising structured data ──
        const maxChars = 80000;
        let contentForClaude = '';
        if (jsonLdBlocks.length > 0) {
          contentForClaude += '=== STRUCTURED REVIEW DATA (JSON-LD) ===\n' + jsonLdBlocks.join('\n').substring(0, 30000) + '\n\n';
        }
        if (stateBlobs.length > 0) {
          contentForClaude += '=== EMBEDDED STATE DATA ===\n' + stateBlobs.join('\n').substring(0, 20000) + '\n\n';
        }
        contentForClaude += '=== PAGE TEXT ===\n' + stripped.substring(0, maxChars - contentForClaude.length);

        const systemPrompt = `You are an expert at extracting product reviews from web page content. The content may include structured JSON-LD data, embedded state blobs, and stripped page text. Prioritise JSON-LD and structured data over raw text. Find ALL individual customer reviews.

EXTRACTION RULES:
1. Find every customer review — check JSON-LD "review" arrays, "aggregateRating", embedded JSON state blobs, and page text
2. For each review output: star rating, text, date, verified purchase status
3. Output format (one blank line between reviews):

⭐⭐⭐⭐⭐ [review text]
- [Verified Purchase, ]Posted [date]

4. Convert numeric ratings (1-5) to the corresponding number of ⭐ emoji
5. Include "Verified Purchase" only if indicated
6. Preserve actual review text — do NOT summarise
7. If no reviews found anywhere: return exactly NO_REVIEWS_FOUND
8. Detect product name and category if visible

OUTPUT FORMAT:
First line: PRODUCT: [name or "Unknown"]
Second line: CATEGORY: [Electronics, Home & Kitchen, Beauty, Fashion, Sports, Books, Health, Food, Toys, Automotive, or Other]
Third line: REVIEWS_FOUND: [count]
Then blank line, then the reviews.

Return ONLY valid JSON.`;

        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 8000,
          system: withLanguage(systemPrompt, userLanguage),
          messages: [{ role: 'user', content: `Extract all customer reviews from this page content:\n\n${contentForClaude}` }],
        });

        const text = message.content.find(b => b.type === 'text')?.text || '';

        if (text.includes('NO_REVIEWS_FOUND')) {
          return res.json({ reviews: '', productName: null, category: null, reviewCount: 0,
            message: 'No reviews found in the page. This site likely loads reviews via JavaScript — try copying and pasting the reviews directly into the text box instead.' });
        }

        const productMatch = text.match(/^PRODUCT:\s*(.+)$/m);
        const categoryMatch = text.match(/^CATEGORY:\s*(.+)$/m);
        const countMatch = text.match(/^REVIEWS_FOUND:\s*(\d+)$/m);

        let reviewText = text;
        const headerEnd = text.search(/\n\s*\n⭐|^\n*⭐/m);
        if (headerEnd !== -1) { reviewText = text.substring(headerEnd).trim(); }
        else { reviewText = text.replace(/^PRODUCT:.*$/m, '').replace(/^CATEGORY:.*$/m, '').replace(/^REVIEWS_FOUND:.*$/m, '').trim(); }

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
