const express = require('express');
const router = express.Router();
const { anthropic, callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

router.post('/fake-review-detective', rateLimit(DEFAULT_LIMITS), async (req, res) => {
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

        const systemPrompt = `You are a fake review detection expert. You will receive a batch of product reviews with pre-computed statistics. Your job is to score EACH review individually for authenticity.`;

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
      "verdict": "likely_fake | uncertain | likely_genuine",
      "red_flags": ["Specific red flag 1", "Specific red flag 2"],
      "green_flags": [],
      "one_liner": "One sentence assessment of this specific review"
    }
  ]
}

Score EVERY review. Verdicts must be: "likely_fake" (score 0-39), "uncertain" (40-59), or "likely_genuine" (60-100).`;

        const parsed = await callClaudeWithRetry({
          model: MODELS.SMART,
          max_tokens: 8000, // per-review array — scales with review count; sized for large imports/pastes to avoid mid-array truncation (the import->submit 500)
          system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
          messages: [{ role: 'user', content: userPrompt }],
        }, { label: 'fake-review-detective' });
        if (!('scores' in parsed) && !('quick_verdict' in parsed) && !('author_groups' in parsed) && !('unified_trust_score' in parsed)) {
          return res.status(500).json({ error: 'Could not analyze reviews. Please try again.' });
        }
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

        const systemPrompt = `You are a review fraud analyst. You've received individual review scores and pre-computed statistics. Your job is to analyze PATTERNS across reviews and deliver a final assessment.`;

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

TRUST SCORE CALIBRATION — use this scale:
- 90-100: Nearly all reviews genuine, verified, specific; no manipulation
- 75-89: Strong majority genuine; 1-2 suspicious reviews in a set of many good verified ones
- 60-74: Notable doubts — multiple suspicious, low verification, or clear manipulation with some genuine
- 40-59: Majority suspicious or clearly manipulated; limited genuine signal
- 0-39: Overwhelmingly fake or no genuine reviews
Anchor: 1 suspicious review among 8 quality verified = 78-84. 2 fakes among 10 = 60-70.

Return ONLY valid JSON:
{
  "quick_verdict": {
    "trust_score": 42,
    "label": "Approach with Caution — one sentence",
    "one_liner": "Concise 1-2 sentence summary"
  },
  "manipulation_detected": {
    "type": "positive_campaign | negative_bombing | mixed | none",
    "confidence": "high | medium | low",
    "description": "Specific description or null — 1-2 sentences",
    "evidence": ["evidence 1", "evidence 2"]
  },
  "sentiment_trajectory": {
    "trend": "improving | declining | stable | insufficient_data",
    "description": "What the timeline tells us — 1-2 sentences"
  },
  "genuine_consensus": {
    "summary": "What trustworthy reviews actually say — 1-2 sentences",
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
    "reasoning": "Based on genuine reviews only — one sentence"
  },
  "playbook": {
    "tactics_detected": [
      {
        "name": "Review Seeding — 3-6 words",
        "icon": "🌱",
        "description": "Brief explanation of what this tactic is — 1-2 sentences",
        "evidence_here": "How it shows up in these specific reviews — one sentence",
        "how_to_spot": "What to look for next time you see this in the wild — one sentence"
      }
    ],
    "overall_tip": "One actionable takeaway for the user — one sentence"
  }
}`;

        const parsed = await callClaudeWithRetry({
          model: MODELS.SMART,
          max_tokens: 4000, // fixed-structure assessment + playbook array — headroom so a verbose run can't truncate the step after scoring
          system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
          messages: [{ role: 'user', content: userPrompt }],
        }, { label: 'fake-review-detective-2' });
        if (!('scores' in parsed) && !('quick_verdict' in parsed) && !('author_groups' in parsed) && !('unified_trust_score' in parsed)) {
          return res.status(500).json({ error: 'Could not analyze reviews. Please try again.' });
        }
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

        const systemPrompt = `You are a forensic linguistics expert specializing in authorship attribution. Your job is to analyze a set of product reviews and detect if any were likely written by the same person, the same organization, or from the same template.`;

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
  "overall_assessment": "One paragraph summary of authorship patterns found — 1-2 sentences",
  "template_detected": true,
  "template_structure": "Description of the template structure if found, or null — one sentence"
}`;

        const parsed = await callClaudeWithRetry({
          model: MODELS.SMART,
          max_tokens: 2000,
          system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
          messages: [{ role: 'user', content: userPrompt }],
        }, { label: 'fake-review-detective-3' });
        if (!('scores' in parsed) && !('quick_verdict' in parsed) && !('author_groups' in parsed) && !('unified_trust_score' in parsed)) {
          return res.status(500).json({ error: 'Could not analyze reviews. Please try again.' });
        }
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

        const systemPrompt = `You are a cross-platform review analyst. You've received review analysis results from MULTIPLE sources (e.g., Amazon, Best Buy, Reddit, etc.) for the SAME or similar products. Your job is to synthesize them into a unified truth.`;

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
      "source_name": "Best Buy — 3-6 words",
      "trust_level": "most_reliable | reliable | somewhat_reliable | unreliable",
      "reasoning": "Why this source ranks here — one sentence"
    }
  ],
  "consensus": {
    "agreed_pros": ["Things all genuine reviews across platforms agree on"],
    "agreed_cons": ["Cons agreed upon across platforms"],
    "real_rating": 3.5,
    "summary": "The cross-platform truth about this product — 1-2 sentences"
  },
  "disagreements": [
    {
      "topic": "Battery life — 3-6 words",
      "description": "Amazon reviews say 8hrs, Best Buy reviews say 5hrs — likely different usage patterns or different product versions — 1-2 sentences"
    }
  ],
  "platform_insights": "What the cross-platform comparison reveals about manipulation — one sentence",
  "final_recommendation": "Clear, actionable recommendation based on all sources — one sentence"
}`;

        const parsed = await callClaudeWithRetry({
          model: MODELS.SMART,
          max_tokens: 2000,
          system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
          messages: [{ role: 'user', content: userPrompt }],
        }, { label: 'fake-review-detective-4' });
        if (!('scores' in parsed) && !('quick_verdict' in parsed) && !('author_groups' in parsed) && !('unified_trust_score' in parsed)) {
          return res.status(500).json({ error: 'Could not analyze reviews. Please try again.' });
        }
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
1. Find every customer review — check JSON-LD "review" arrays, embedded state blobs, AND the PAGE TEXT section
2. Output ONLY the structured format below — no preamble, no explanation, no markdown headers, no "---" separators
3. Only output NO_REVIEWS_FOUND if the page has absolutely no review content of any kind

FINDING REVIEWS IN PAGE TEXT:
Amazon and retailer pages often include reviews in the stripped page text. Look for these patterns:
- "N.N out of 5 stars" (star rating) followed by a title, then "Reviewed in [Country] on [Date]", then optionally "Verified Purchase", then the review body
- Blocks of text that follow a star rating and read like genuine customer feedback
- Star ratings may also appear as integers: "5 stars", "4 stars", etc.

STAR RATING CONVERSION — always output star emojis:
5 or 5.0 out of 5 → ⭐⭐⭐⭐⭐
4 or 4.0 out of 5 → ⭐⭐⭐⭐
3 or 3.0 out of 5 → ⭐⭐⭐
2 or 2.0 out of 5 → ⭐⭐
1 or 1.0 out of 5 → ⭐
Partial ratings (4.5, 3.5, etc.) round to nearest whole number

TRANSLATION: For reviews written in any language other than English, translate the review body to English and prepend "(Translated from [Language]) " to the review text.

OUTPUT FORMAT:
PRODUCT: [product name or Unknown]
CATEGORY: [Electronics | Home & Kitchen | Beauty | Fashion | Sports | Books | Health | Food | Toys | Automotive | Other]
REVIEWS_FOUND: [count]

⭐⭐⭐⭐⭐
[review body text only — no reviewer name, no title line]
Verified Purchase | Posted 3 days ago

⭐⭐⭐
(Translated from Spanish) [translated review body]
Posted 2 months ago

FORMAT RULES FOR EACH REVIEW BLOCK:
- First line: star emojis only (⭐ repeated 1–5 times matching the rating)
- Following lines: review body text only (translate non-English to English)
- Final line: "Verified Purchase | Posted X" if verified, or "Posted X" if not, using available date info; omit entirely if no date
- One blank line between reviews — no "---" separators, no **bold** headers, no reviewer names`;

        let message;
        for (let _att = 1; _att <= 3; _att++) {
          try {
            message = await anthropic.messages.create({
          model: MODELS.SMART,
          max_tokens: 1250,
          system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
          messages: [{ role: 'user', content: `Extract all customer reviews from this page content:\n\n${contentForClaude}` }],
        });
            break;
          } catch (_e) {
            if (_att === 3) throw _e;
            await new Promise(r => setTimeout(r, 1000 * _att));
          }
        }

        const text = message.content.find(b => b.type === 'text')?.text || '';

        if (text.includes('NO_REVIEWS_FOUND')) {
          return res.json({ reviews: '', productName: null, category: null, reviewCount: 0,
            message: 'No reviews found in the page source. Amazon and many retailers load reviews via JavaScript after the page loads — the server can only see the initial HTML. Copy and paste the reviews directly for reliable results.' });
        }

        const productMatch = text.match(/^PRODUCT:\s*(.+)$/m);
        const categoryMatch = text.match(/^CATEGORY:\s*(.+)$/m);
        const countMatch = text.match(/^REVIEWS_FOUND:\s*(\d+)$/m);

        let reviewText = text;
        const headerEnd = text.search(/\n\s*\n⭐|^\n*⭐/m);
        if (headerEnd !== -1) { reviewText = text.substring(headerEnd).trim(); }
        else { reviewText = text.replace(/^PRODUCT:.*$/m, '').replace(/^CATEGORY:.*$/m, '').replace(/^REVIEWS_FOUND:.*$/m, '').trim(); }

        // If no ⭐-formatted reviews survived, treat as no reviews found regardless of model wording
        if (!reviewText.includes('⭐')) {
          return res.json({ reviews: '', productName: null, category: null, reviewCount: 0,
            message: 'No reviews found in the page source. Reviews on this page likely load dynamically via JavaScript and aren\'t present in the initial HTML the server receives — copy and paste the reviews directly for reliable results.' });
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
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
