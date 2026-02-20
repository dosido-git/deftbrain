import React, { useState, useCallback, useMemo } from 'react';
import {
  Search, AlertTriangle, CheckCircle, XCircle, Loader2, ShieldCheck, ShieldAlert,
  Star, Clock, Copy, ChevronDown, ChevronUp, BarChart3, Target, Activity,
  ArrowUpDown, TrendingUp, TrendingDown, Minus, Info, Package, Zap, Globe, Link,
} from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

// ════════════════════════════════════════════════════════════
// THEME COLORS
// ════════════════════════════════════════════════════════════
function useColors() {
  const { theme } = useTheme();
  const d = theme === 'dark';
  return {
    bg: d ? 'bg-zinc-900' : 'bg-gradient-to-br from-slate-50 to-blue-50',
    card: d ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-slate-200',
    cardAlt: d ? 'bg-zinc-750 border-zinc-600' : 'bg-slate-50 border-slate-200',
    input: d
      ? 'bg-zinc-900 border-zinc-600 text-zinc-50 placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-100',
    text: d ? 'text-zinc-50' : 'text-slate-900',
    textSec: d ? 'text-zinc-400' : 'text-slate-600',
    textMuted: d ? 'text-zinc-500' : 'text-slate-500',
    label: d ? 'text-zinc-300' : 'text-slate-700',
    accent: d ? 'text-blue-400' : 'text-blue-600',
    btnPrimary: d ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white',
    btnSec: d ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-slate-100 hover:bg-slate-200 text-slate-800',
    btnOutline: d ? 'border-zinc-600 hover:border-zinc-500 text-zinc-300' : 'border-slate-300 hover:border-slate-400 text-slate-700',
    danger: d ? 'bg-red-900/20 border-red-700/50 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    dangerText: d ? 'text-red-400' : 'text-red-600',
    success: d ? 'bg-emerald-900/20 border-emerald-700/50 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800',
    successText: d ? 'text-emerald-400' : 'text-emerald-600',
    warning: d ? 'bg-amber-900/20 border-amber-700/50 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800',
    warningText: d ? 'text-amber-400' : 'text-amber-600',
    info: d ? 'bg-blue-900/20 border-blue-700/50 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800',
    pillRed: d ? 'bg-red-900/40 text-red-300 border-red-700/40' : 'bg-red-100 text-red-700 border-red-200',
    pillGreen: d ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40' : 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pillGray: d ? 'bg-zinc-700 text-zinc-400 border-zinc-600' : 'bg-slate-100 text-slate-500 border-slate-200',
    pillAmber: d ? 'bg-amber-900/40 text-amber-300 border-amber-700/40' : 'bg-amber-100 text-amber-700 border-amber-200',
    statCard: d ? 'bg-zinc-700/50 border-zinc-600' : 'bg-white border-slate-200',
    barBg: d ? 'bg-zinc-700' : 'bg-slate-200',
    skeleton: d ? 'bg-zinc-700 animate-pulse' : 'bg-slate-200 animate-pulse',
    quoteBg: d ? 'bg-zinc-900/60' : 'bg-slate-50',
  };
}

// ════════════════════════════════════════════════════════════
// REVIEW PARSER — all JavaScript, no AI
// ════════════════════════════════════════════════════════════

const GENERIC_PRAISE = [
  'best ever', 'amazing', 'love it', 'love this', 'loved it', 'highly recommend',
  'five stars', '5 stars', 'must buy', 'must have', "don't hesitate", 'do not hesitate',
  "won't regret", 'will not regret', 'game changer', 'life changing', 'life changer',
  'blown away', 'exceeded expectations', 'absolutely love', 'perfect product',
  'couldn\'t be happier', 'best purchase', 'buy this now', 'worth every penny',
];

const SPECIFIC_DETAIL_PATTERNS = [
  /\d+\s*(hours?|hrs?|minutes?|mins?|days?|weeks?|months?|years?|inches?|in|cm|mm|ft|feet|lbs?|kg|g|oz|ml|watts?|mah|gb|tb|mb)/i,
  /\b(after|for)\s+\d+\s*(hours?|days?|weeks?|months?|years?)/i,
  /\b(battery|screen|display|weight|size|dimension|resolution|speed|capacity|voltage)\b/i,
  /\b(compared to|better than|worse than|similar to|unlike|switch from|switched from)\b/i,
  /\b(i use(d)? (this|it|them) for)\b/i,
  /\b(after \d+ (months?|weeks?|years?) of use)\b/i,
];

const COMPETITOR_PATTERNS = [
  /\b(better than|worse than|compared to|unlike|switch(ed)? from|go with)\b.*\b[A-Z][a-z]+\b/i,
  /\b[A-Z][a-z]+\b.*(is|was|much) better/i,
];

const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5 };

function parseStarRating(text) {
  const filled = (text.match(/⭐/g) || []).length;
  if (filled >= 1 && filled <= 5) return filled;
  const black = (text.match(/★/g) || []).length;
  if (black >= 1 && black <= 5) return black;
  const slashMatch = text.match(/(\d)\s*\/\s*5/);
  if (slashMatch) return Math.min(5, Math.max(1, parseInt(slashMatch[1])));
  const starsMatch = text.match(/(\d)\s*stars?/i);
  if (starsMatch) return Math.min(5, Math.max(1, parseInt(starsMatch[1])));
  const wordMatch = text.match(/\b(one|two|three|four|five)\s*stars?\b/i);
  if (wordMatch) return NUMBER_WORDS[wordMatch[1].toLowerCase()];
  const outOf = text.match(/(\d)\s*out\s*of\s*5/i);
  if (outOf) return Math.min(5, Math.max(1, parseInt(outOf[1])));
  return null;
}

function parseDaysAgo(text) {
  const lower = text.toLowerCase();
  if (/\btoday\b/.test(lower) || /\bjust now\b/.test(lower)) return 0;
  if (/\byesterday\b/.test(lower)) return 1;
  const agoMatch = lower.match(/(\d+)\s*(day|week|month|year)s?\s*ago/);
  if (agoMatch) {
    const n = parseInt(agoMatch[1]);
    const unit = agoMatch[2];
    if (unit === 'day') return n;
    if (unit === 'week') return n * 7;
    if (unit === 'month') return n * 30;
    if (unit === 'year') return n * 365;
  }
  const aWeek = lower.match(/\ba\s*(day|week|month|year)\s*ago/);
  if (aWeek) {
    const unit = aWeek[1];
    if (unit === 'day') return 1;
    if (unit === 'week') return 7;
    if (unit === 'month') return 30;
    if (unit === 'year') return 365;
  }
  // Try parsing absolute dates like "Jan 15, 2025" or "01/15/2025"
  const datePatterns = [
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s*(\d{4})/i,
    /\b(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /\b(\d{4})-(\d{1,2})-(\d{1,2})/,
  ];
  for (const pat of datePatterns) {
    const m = text.match(pat);
    if (m) {
      try {
        const d = new Date(m[0]);
        if (!isNaN(d.getTime())) {
          return Math.max(0, Math.round((Date.now() - d.getTime()) / 86400000));
        }
      } catch {}
    }
  }
  return null;
}

function extractDateText(text) {
  const patterns = [
    /posted\s+.*?ago/i,
    /\d+\s*(days?|weeks?|months?|years?)\s*ago/i,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s*\d{4}/i,
    /\b\d{1,2}\/\d{1,2}\/\d{4}/,
    /\btoday\b/i,
    /\byesterday\b/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0];
  }
  return null;
}

function splitIntoReviews(rawText) {
  const text = rawText.trim();
  if (!text) return [];

  // Try splitting on star emoji at start of line
  const starSplit = text.split(/(?=^⭐)/m).filter(s => s.trim());
  if (starSplit.length > 1) return starSplit.map(s => s.trim());

  const blackStar = text.split(/(?=^[★☆])/m).filter(s => s.trim());
  if (blackStar.length > 1) return blackStar.map(s => s.trim());

  // Try splitting on rating patterns at start of line
  const ratingSplit = text.split(/(?=^\d\s*\/\s*5)|(?=^\d\s*stars?\b)|(?=^\d\s*out\s*of\s*5)/mi).filter(s => s.trim());
  if (ratingSplit.length > 1) return ratingSplit.map(s => s.trim());

  // Double newline fallback
  const paraSplit = text.split(/\n\s*\n/).filter(s => s.trim());
  if (paraSplit.length > 1) return paraSplit.map(s => s.trim());

  return [text];
}

function parseReview(rawText, index) {
  const words = rawText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  const letters = rawText.replace(/[^a-zA-Z]/g, '');
  const upperLetters = rawText.replace(/[^A-Z]/g, '');
  const capsRatio = letters.length > 0 ? upperLetters.length / letters.length : 0;
  const exclamationCount = (rawText.match(/!/g) || []).length;
  const lower = rawText.toLowerCase();
  const hasSpecificDetails = SPECIFIC_DETAIL_PATTERNS.some(p => p.test(rawText));
  const genericHits = GENERIC_PRAISE.filter(phrase => lower.includes(phrase)).length;
  const hasGenericPraise = genericHits >= 2 && wordCount < 40 && !hasSpecificDetails;
  const mentionsCompetitor = COMPETITOR_PATTERNS.some(p => p.test(rawText));

  return {
    index,
    rawText,
    starRating: parseStarRating(rawText),
    isVerified: /verified\s*(purchase|buyer)|confirmed\s*purchase/i.test(rawText),
    dateText: extractDateText(rawText),
    daysAgo: parseDaysAgo(rawText),
    wordCount,
    charCount: rawText.length,
    exclamationCount,
    capsRatio: Math.round(capsRatio * 100) / 100,
    hasSpecificDetails,
    hasGenericPraise,
    genericHits,
    mentionsCompetitor,
  };
}

function computeAggregateStats(reviews) {
  const total = reviews.length;
  const starDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let ratedCount = 0;
  let ratingSum = 0;
  let verifiedCount = 0;
  let shortCount = 0;
  let totalWords = 0;
  let highCaps = 0;
  let highExcl = 0;
  let genericCount = 0;
  let specificCount = 0;

  for (const r of reviews) {
    if (r.starRating) { starDist[r.starRating]++; ratedCount++; ratingSum += r.starRating; }
    if (r.isVerified) verifiedCount++;
    if (r.wordCount < 15) shortCount++;
    totalWords += r.wordCount;
    if (r.capsRatio > 0.3) highCaps++;
    if (r.exclamationCount >= 3) highExcl++;
    if (r.hasGenericPraise) genericCount++;
    if (r.hasSpecificDetails) specificCount++;
  }

  const avgRating = ratedCount > 0 ? Math.round((ratingSum / ratedCount) * 10) / 10 : null;
  const avgWords = total > 0 ? Math.round(totalWords / total) : 0;
  const verifiedPct = total > 0 ? Math.round((verifiedCount / total) * 1000) / 10 : 0;

  // Star rating standard deviation
  let starDev = null;
  if (ratedCount >= 2 && avgRating) {
    let sumSqDiff = 0;
    for (const r of reviews) {
      if (r.starRating) sumSqDiff += Math.pow(r.starRating - avgRating, 2);
    }
    starDev = Math.round(Math.sqrt(sumSqDiff / ratedCount) * 100) / 100;
  }

  // Date clusters: group reviews within 2 days of each other, clusters of 3+
  const dated = reviews.filter(r => r.daysAgo !== null).sort((a, b) => a.daysAgo - b.daysAgo);
  const clusters = [];
  let i = 0;
  while (i < dated.length) {
    const cluster = [dated[i]];
    let j = i + 1;
    while (j < dated.length && dated[j].daysAgo - dated[j - 1].daysAgo <= 2) {
      cluster.push(dated[j]);
      j++;
    }
    if (cluster.length >= 3) {
      const minDays = cluster[0].daysAgo;
      const maxDays = cluster[cluster.length - 1].daysAgo;
      clusters.push({
        daysAgoRange: minDays === maxDays ? `${minDays} days ago` : `${minDays}-${maxDays} days ago`,
        count: cluster.length,
        indices: cluster.map(r => r.index),
      });
    }
    i = j;
  }

  return {
    totalReviews: total,
    starDistribution: starDist,
    averageRating: avgRating,
    starDeviation: starDev,
    ratedCount,
    verifiedCount,
    unverifiedCount: total - verifiedCount,
    verifiedPercent: verifiedPct,
    avgWordCount: avgWords,
    shortReviewCount: shortCount,
    dateClusters: clusters,
    hasTimingCluster: clusters.length > 0,
    highCapsCount: highCaps,
    highExclamationCount: highExcl,
    genericPraiseCount: genericCount,
    specificDetailCount: specificCount,
  };
}

// ════════════════════════════════════════════════════════════
// TRUST SCORE HELPERS
// ════════════════════════════════════════════════════════════

function trustScoreColor(score) {
  if (score >= 76) return { bg: '#10b981', text: '#065f46', ring: '#10b981' };
  if (score >= 51) return { bg: '#84cc16', text: '#365314', ring: '#84cc16' };
  if (score >= 26) return { bg: '#f59e0b', text: '#78350f', ring: '#f59e0b' };
  return { bg: '#ef4444', text: '#7f1d1e', ring: '#ef4444' };
}

function verdictLabel(score) {
  if (score >= 76) return 'Reviews Look Genuine';
  if (score >= 51) return 'Mostly Trustworthy';
  if (score >= 26) return 'Approach with Caution';
  return 'Likely Manipulated';
}

function reviewVerdictColor(score, isDark) {
  if (score >= 60) return isDark ? 'border-l-emerald-500' : 'border-l-emerald-500';
  if (score >= 40) return isDark ? 'border-l-amber-500' : 'border-l-amber-500';
  return isDark ? 'border-l-red-500' : 'border-l-red-500';
}

function reviewScoreBadgeBg(score) {
  if (score >= 60) return 'bg-emerald-500 text-white';
  if (score >= 40) return 'bg-amber-500 text-white';
  return 'bg-red-500 text-white';
}

// ════════════════════════════════════════════════════════════
// CATEGORY OPTIONS
// ════════════════════════════════════════════════════════════
const CATEGORIES = [
  'Electronics', 'Home & Kitchen', 'Beauty', 'Fashion', 'Sports',
  'Books', 'Health', 'Food', 'Toys', 'Automotive', 'Other',
];

// ════════════════════════════════════════════════════════════
// EXAMPLE REVIEWS
// ════════════════════════════════════════════════════════════
const EXAMPLE_REVIEWS = `⭐⭐⭐⭐⭐ AMAZING product!!! Best headphones I've EVER bought!! You NEED these!! Don't hesitate, just buy them NOW!!!
- Posted 2 days ago

⭐⭐⭐⭐⭐ Absolutely love these! Five stars! Best purchase ever! Highly recommend to everyone!
- Posted 2 days ago

⭐⭐⭐⭐⭐ Perfect! Must buy! Game changer!!!
- Posted 2 days ago

⭐⭐⭐⭐ Decent wireless headphones for the price. Sound quality is solid — bass is a bit weak compared to my old Sony WH-1000XM4s, but the mids are clear. Battery lasts about 8 hours with ANC on. The ear cushions get warm after 2 hours but overall comfortable. Build quality feels plasticky.
- Verified Purchase, Posted 1 month ago

⭐⭐⭐ They work fine for calls and casual listening. There's a noticeable hissing sound when Bluetooth is connected but no audio is playing. ANC blocks maybe 60% of outside noise — decent for the $45 price point. I've been using them daily for 3 weeks and the left earcup creaks when I adjust them.
- Verified Purchase, Posted 3 weeks ago

⭐ TERRIBLE. Don't buy these garbage headphones. Worst audio I've ever heard. Save your money and get SoundMax Pro instead — those are 10x better for the same price. Complete waste of money.
- Posted 3 days ago

⭐⭐⭐⭐⭐ Great sound and comfortable. My daughter uses them for school and loves them. Good battery life.
- Posted 1 week ago

⭐⭐ Broke after 2 months of daily use. The headband snapped where it connects to the right earcup. I contacted support and they said it's out of warranty because I bought from a third-party seller. Disappointing because the sound was actually decent while they lasted.
- Verified Purchase, Posted 2 months ago`;

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
const FakeReviewDetective = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const c = useColors();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Form
  const [reviewText, setReviewText] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [productUrl, setProductUrl] = useState('');

  // Phases
  const [phase, setPhase] = useState('input'); // input | extracting | parsing | scoring | analyzing | done
  const [scoreProgress, setScoreProgress] = useState('');
  const [error, setError] = useState('');

  // Results
  const [parsedReviews, setParsedReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [reviewScores, setReviewScores] = useState(null);
  const [analysis, setAnalysis] = useState(null);

  // UI
  const [sortMostSuspicious, setSortMostSuspicious] = useState(true);
  const [expandedCards, setExpandedCards] = useState({});
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const toggleCard = useCallback((idx) => {
    setExpandedCards(prev => ({ ...prev, [idx]: !prev[idx] }));
  }, []);

  // ──────────────────────────────────────────
  // URL EXTRACTION FLOW
  // ──────────────────────────────────────────
  const extractFromUrl = useCallback(async () => {
    const url = productUrl.trim();
    if (!url) {
      setError('Please enter a product URL.');
      return;
    }
    if (!/^https?:\/\/.+/i.test(url)) {
      setError('Please enter a valid URL starting with https://');
      return;
    }
    setError('');
    setPhase('extracting');
    setScoreProgress('Fetching page and extracting reviews...');

    try {
      const data = await callToolEndpoint('fake-review-detective', {
        action: 'extract',
        url,
      });

      if (!data.reviews || data.reviews.trim().length === 0) {
        setError(data.message || 'No reviews found on that page. Try pasting reviews manually instead.');
        setPhase('input');
        return;
      }

      // Populate textarea with extracted reviews
      setReviewText(data.reviews);

      // Auto-set category if detected
      if (data.category && CATEGORIES.includes(data.category)) {
        setCategory(data.category);
      }

      setPhase('input');
      setScoreProgress('');
    } catch (err) {
      setError(err.message || 'Failed to extract reviews from that URL.');
      setPhase('input');
    }
  }, [productUrl, callToolEndpoint]);

  // ──────────────────────────────────────────
  // MAIN ANALYSIS FLOW
  // ──────────────────────────────────────────
  const runAnalysis = useCallback(async () => {
    if (!reviewText.trim() || reviewText.trim().length < 100) {
      setError('Please paste at least 100 characters of reviews to analyze.');
      return;
    }
    setError('');
    setPhase('parsing');
    setReviewScores(null);
    setAnalysis(null);
    setExpandedCards({});
    setShowAllReviews(false);

    // Phase 0: JS Pre-processing (instant)
    const rawChunks = splitIntoReviews(reviewText);
    const reviews = rawChunks.map((chunk, i) => parseReview(chunk, i));
    const aggregateStats = computeAggregateStats(reviews);
    setParsedReviews(reviews);
    setStats(aggregateStats);

    // Limit to 20 reviews for AI
    const aiReviews = reviews.slice(0, 20);
    const truncated = reviews.length > 20;

    // Phase 1: Score individual reviews
    setPhase('scoring');
    setScoreProgress(`Scoring ${aiReviews.length} reviews...`);
    let scores = null;
    try {
      const scoreData = await callToolEndpoint('fake-review-detective', {
        action: 'score',
        reviews: aiReviews.map(r => ({
          index: r.index, rawText: r.rawText, starRating: r.starRating,
          isVerified: r.isVerified, daysAgo: r.daysAgo, wordCount: r.wordCount,
          exclamationCount: r.exclamationCount, capsRatio: r.capsRatio,
          hasSpecificDetails: r.hasSpecificDetails, hasGenericPraise: r.hasGenericPraise,
          mentionsCompetitor: r.mentionsCompetitor,
        })),
        stats: aggregateStats,
        category,
        truncated,
        totalReviewCount: reviews.length,
      });
      scores = scoreData?.scores || [];
      setReviewScores(scores);
    } catch (err) {
      setError('Failed to score reviews: ' + (err.message || 'Unknown error'));
      setPhase('done');
      return;
    }

    // Phase 2: Pattern analysis
    if (reviews.length < 2) {
      setPhase('done');
      return;
    }

    setPhase('analyzing');
    setScoreProgress('Analyzing patterns...');
    try {
      const analysisData = await callToolEndpoint('fake-review-detective', {
        action: 'analyze',
        reviews: aiReviews.map(r => ({
          index: r.index, rawText: r.rawText, starRating: r.starRating,
          isVerified: r.isVerified, daysAgo: r.daysAgo, wordCount: r.wordCount,
          hasSpecificDetails: r.hasSpecificDetails, hasGenericPraise: r.hasGenericPraise,
          mentionsCompetitor: r.mentionsCompetitor,
        })),
        scores,
        stats: aggregateStats,
        category,
      });
      setAnalysis(analysisData);
    } catch (err) {
      setError('Failed to analyze patterns: ' + (err.message || 'Unknown error'));
    }
    setPhase('done');
  }, [reviewText, category, callToolEndpoint]);

  const handleReset = useCallback(() => {
    setReviewText('');
    setProductUrl('');
    setCategory('Electronics');
    setPhase('input');
    setParsedReviews([]);
    setStats(null);
    setReviewScores(null);
    setAnalysis(null);
    setError('');
    setExpandedCards({});
    setCopiedSummary(false);
    setShowAllReviews(false);
  }, []);

  // ──────────────────────────────────────────
  // COPY SUMMARY
  // ──────────────────────────────────────────
  const copySummary = useCallback(() => {
    if (!analysis?.quick_verdict) return;
    const qv = analysis.quick_verdict;
    const gc = analysis.genuine_consensus;
    const pr = analysis.purchase_recommendation;
    const suspicious = reviewScores?.filter(s => s.verdict === 'likely_fake').length || 0;
    const total = reviewScores?.length || 0;
    const text = `Fake Review Detective Analysis\nTrust Score: ${qv.trust_score}/100 — ${qv.label}\n${qv.one_liner}\n\n${suspicious} of ${total} reviews flagged as suspicious.\n${gc?.summary || ''}\n\nVerdict: ${pr?.verdict?.toUpperCase() || 'N/A'} — ${pr?.reasoning || ''}`;
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    });
  }, [analysis, reviewScores]);

  // ──────────────────────────────────────────
  // SORTED REVIEW CARDS
  // ──────────────────────────────────────────
  const sortedReviewsWithScores = useMemo(() => {
    if (!reviewScores || !parsedReviews.length) return [];
    const merged = parsedReviews.slice(0, 20).map(r => {
      const score = reviewScores.find(s => s.index === r.index);
      return { ...r, ...(score || {}) };
    });
    if (sortMostSuspicious) {
      return [...merged].sort((a, b) => (a.authenticity_score ?? 50) - (b.authenticity_score ?? 50));
    }
    return merged;
  }, [parsedReviews, reviewScores, sortMostSuspicious]);

  const visibleReviews = showAllReviews ? sortedReviewsWithScores : sortedReviewsWithScores.slice(0, 5);
  const isRunning = phase === 'extracting' || phase === 'parsing' || phase === 'scoring' || phase === 'analyzing';
  const canAnalyze = reviewText.trim().length >= 100 && !isRunning;

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div className={`space-y-6 ${c.text}`}>

      {/* ── TOOL HEADER ── */}
      <div className="mb-2">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Fake Review Detective 🔍</h2>
        <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Spot fake reviews before you get burned</p>
      </div>

      {/* ── INTRO BANNER ── */}
      <div className={`${c.info} border rounded-xl p-5`}>
        <div className="flex items-start gap-3">
          <ShieldAlert className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.accent}`} />
          <div>
            <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
              Paste product reviews or import them from a URL. The tool computes real statistics, then uses AI to score each review individually and detect manipulation patterns across the set.
            </p>
          </div>
        </div>
      </div>

      {/* ── URL EXTRACTION ── */}
      <div className={`${c.card} border rounded-xl p-5`}>
        <div className="flex items-center gap-2 mb-3">
          <Globe className={`w-4 h-4 ${c.accent}`} />
          <h3 className={`text-sm font-bold ${c.text}`}>Import from URL</h3>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.pillGray} border`}>Optional</span>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Link className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${c.textMuted}`} />
            <input
              type="url"
              value={productUrl}
              onChange={e => setProductUrl(e.target.value)}
              placeholder="https://amazon.com/product-name/..."
              className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm ${c.input} outline-none focus:ring-2`}
              disabled={isRunning}
            />
          </div>
          <button
            onClick={extractFromUrl}
            disabled={!productUrl.trim() || isRunning}
            className={`${c.btnSec} disabled:opacity-40 disabled:cursor-not-allowed font-semibold px-4 py-2.5 rounded-lg text-sm flex items-center gap-1.5 min-h-[44px] whitespace-nowrap`}
          >
            {phase === 'extracting' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                Extract Reviews
              </>
            )}
          </button>
        </div>
        <p className={`text-[11px] ${c.textMuted} mt-1.5`}>
          Fetches the page and uses AI to extract review text. Works best with Amazon, Best Buy, Walmart, and similar product pages. Some sites may block extraction.
        </p>
      </div>

      {/* ── INPUT SECTION ── */}
      <div className={`${c.card} border rounded-xl p-6`}>
        <div className="flex items-center gap-3 mb-5">
          <div className={`p-2.5 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
            <Search className={`w-5 h-5 ${c.accent}`} />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${c.text}`}>Paste Reviews</h2>
            <p className={`text-xs ${c.textMuted}`}>Or edit reviews imported from URL above</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Textarea */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={`text-sm font-semibold ${c.label}`}>Product reviews</label>
              <button onClick={() => setReviewText(EXAMPLE_REVIEWS)} className={`text-xs font-semibold ${c.accent} hover:underline`}>
                Try example
              </button>
            </div>
            <textarea
              value={reviewText}
              onChange={e => setReviewText(e.target.value)}
              placeholder={`Paste multiple reviews here...\n\n⭐⭐⭐⭐⭐ Amazing! Best ever!!!\n- Posted 2 days ago\n\n⭐⭐⭐⭐ Good but battery only lasts 8 hours.\n- Verified Purchase, Posted 1 month ago`}
              className={`w-full p-4 border rounded-lg ${c.input} outline-none focus:ring-2 font-mono text-sm`}
              rows={10}
            />
            <p className={`text-xs ${c.textMuted} mt-1`}>
              Minimum 100 characters · {reviewText.length} entered
            </p>
          </div>

          {/* Category pills */}
          <div>
            <label className={`text-sm font-semibold ${c.label} block mb-2`}>Product category</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    category === cat
                      ? (isDark ? 'bg-blue-600 border-blue-500 text-white' : 'bg-blue-600 border-blue-600 text-white')
                      : `${c.btnSec} border-transparent`
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={runAnalysis}
              disabled={!canAnalyze}
              className={`flex-1 ${c.btnPrimary} disabled:opacity-40 disabled:cursor-not-allowed font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 min-h-[48px]`}
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">{scoreProgress || 'Processing...'}</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Detect Fakes
                </>
              )}
            </button>
            {(stats || reviewScores || analysis) && (
              <button onClick={handleReset} className={`px-5 py-3 border-2 ${c.btnOutline} font-semibold rounded-lg`}>
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={`${c.danger} border rounded-lg p-4 flex items-start gap-3`}>
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.dangerText}`} />
          <p className={`text-sm ${isDark ? 'text-red-200' : 'text-red-700'}`}>{error}</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* INSTANT STATS (appears immediately after parsing)       */}
      {/* ══════════════════════════════════════════════════════════ */}
      {stats && (
        <div className={`${c.card} border rounded-xl p-6`}>
          <h3 className={`text-sm font-bold ${c.text} mb-4 flex items-center gap-2`}>
            <BarChart3 className={`w-4 h-4 ${c.accent}`} />
            Computed Stats
            <span className={`text-[10px] font-bold ${c.textMuted} uppercase`}>Instant · No AI</span>
          </h3>

          {/* Stat cards row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
            <StatCard label="Reviews Found" value={stats.totalReviews} c={c} />
            <StatCard
              label="Avg Rating"
              value={stats.averageRating ? `${stats.averageRating} ★` : 'N/A'}
              color={stats.averageRating >= 3.5 ? 'green' : stats.averageRating >= 2.5 ? 'amber' : 'red'}
              c={c}
            />
            <StatCard
              label="Verified"
              value={`${stats.verifiedPercent}%`}
              color={stats.verifiedPercent >= 70 ? 'green' : stats.verifiedPercent >= 40 ? 'amber' : 'red'}
              c={c}
            />
            <StatCard
              label="Short Reviews"
              value={stats.shortReviewCount}
              color={stats.totalReviews > 0 && stats.shortReviewCount / stats.totalReviews > 0.4 ? 'red' : 'neutral'}
              c={c}
            />
            <StatCard
              label="Date Clusters"
              value={stats.hasTimingCluster ? stats.dateClusters.length : 'None'}
              color={stats.hasTimingCluster ? 'red' : 'green'}
              c={c}
            />
          </div>

          {/* Star distribution + warnings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Star chart */}
            {stats.ratedCount > 0 && (
              <div>
                <p className={`text-xs font-bold ${c.label} mb-2`}>Star Distribution</p>
                <div className="space-y-1.5">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = stats.starDistribution[star] || 0;
                    const maxCount = Math.max(...Object.values(stats.starDistribution), 1);
                    const pct = (count / maxCount) * 100;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className={`w-8 text-xs text-right font-semibold ${c.textSec}`}>{star} ★</span>
                        <div className={`flex-1 h-5 rounded-sm overflow-hidden ${c.barBg}`}>
                          <div
                            className={`h-full rounded-sm ${star >= 4 ? 'bg-emerald-500' : star === 3 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${pct}%`, transition: 'width 0.4s ease' }}
                          />
                        </div>
                        <span className={`w-6 text-xs text-right font-semibold ${c.textMuted}`}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Warnings */}
            <div className="space-y-2">
              {stats.hasTimingCluster && stats.dateClusters.map((cl, i) => (
                <div key={i} className={`${c.danger} border rounded-lg p-3 flex items-start gap-2`}>
                  <Clock className={`w-4 h-4 flex-shrink-0 mt-0.5 ${c.dangerText}`} />
                  <p className={`text-xs ${isDark ? 'text-red-200' : 'text-red-700'}`}>
                    <span className="font-bold">{cl.count} reviews</span> posted within 48 hours of each other ({cl.daysAgoRange})
                  </p>
                </div>
              ))}
              {stats.verifiedPercent < 40 && stats.totalReviews >= 3 && (
                <div className={`${c.warning} border rounded-lg p-3 flex items-start gap-2`}>
                  <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${c.warningText}`} />
                  <p className={`text-xs ${isDark ? 'text-amber-200' : 'text-amber-700'}`}>
                    Only <span className="font-bold">{stats.verifiedPercent}%</span> verified — below the typical 60-70% for most categories
                  </p>
                </div>
              )}
              {stats.genericPraiseCount > 0 && stats.totalReviews >= 3 && (
                <div className={`${c.warning} border rounded-lg p-3 flex items-start gap-2`}>
                  <Info className={`w-4 h-4 flex-shrink-0 mt-0.5 ${c.warningText}`} />
                  <p className={`text-xs ${isDark ? 'text-amber-200' : 'text-amber-700'}`}>
                    <span className="font-bold">{stats.genericPraiseCount} review{stats.genericPraiseCount !== 1 ? 's' : ''}</span> contain generic praise with no specific product details
                  </p>
                </div>
              )}
              {stats.starDeviation !== null && stats.starDeviation < 0.5 && stats.ratedCount >= 4 && (
                <div className={`${c.warning} border rounded-lg p-3 flex items-start gap-2`}>
                  <Activity className={`w-4 h-4 flex-shrink-0 mt-0.5 ${c.warningText}`} />
                  <p className={`text-xs ${isDark ? 'text-amber-200' : 'text-amber-700'}`}>
                    Suspiciously uniform ratings — standard deviation of only <span className="font-bold">{stats.starDeviation}</span>
                  </p>
                </div>
              )}
              {!stats.hasTimingCluster && stats.verifiedPercent >= 40 && stats.genericPraiseCount === 0 && (
                <div className={`${c.success} border rounded-lg p-3 flex items-start gap-2`}>
                  <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${c.successText}`} />
                  <p className={`text-xs ${isDark ? 'text-emerald-200' : 'text-emerald-700'}`}>
                    No obvious red flags in computed stats — AI analysis will check deeper patterns
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* PHASE INDICATOR                                          */}
      {/* ══════════════════════════════════════════════════════════ */}
      {isRunning && (
        <div className={`${c.card} border rounded-xl p-4 flex items-center gap-3`}>
          <Loader2 className={`w-5 h-5 animate-spin ${c.accent}`} />
          <div>
            <p className={`text-sm font-bold ${c.text}`}>
              {phase === 'extracting' ? 'Extracting reviews from URL...' : phase === 'parsing' ? 'Parsing reviews...' : phase === 'scoring' ? 'Step 1/2: Scoring individual reviews' : 'Step 2/2: Analyzing patterns'}
            </p>
            <p className={`text-xs ${c.textMuted}`}>{scoreProgress}</p>
          </div>
          <div className="flex-1" />
          <div className="flex gap-1">
            {phase !== 'extracting' && (<>
              <div className={`w-2 h-2 rounded-full ${phase === 'scoring' || phase === 'analyzing' ? 'bg-blue-500' : c.barBg}`} />
              <div className={`w-2 h-2 rounded-full ${phase === 'analyzing' ? 'bg-blue-500' : c.barBg}`} />
            </>)}
          </div>
        </div>
      )}

      {/* Only 1 review warning */}
      {stats && parsedReviews.length === 1 && phase !== 'input' && (
        <div className={`${c.info} border rounded-lg p-3 flex items-start gap-2`}>
          <Info className={`w-4 h-4 flex-shrink-0 mt-0.5 ${c.accent}`} />
          <p className={`text-xs ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>
            Only 1 review detected — pattern analysis works best with 3+ reviews. Showing individual score only.
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* QUICK VERDICT                                            */}
      {/* ══════════════════════════════════════════════════════════ */}
      {analysis?.quick_verdict && (
        <div className={`${c.card} border rounded-xl p-6 relative overflow-hidden`}>
          {/* Subtle background tint */}
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ backgroundColor: trustScoreColor(analysis.quick_verdict.trust_score).bg }}
          />
          <div className="relative flex flex-col sm:flex-row items-center gap-5">
            {/* Trust score circle */}
            <div className="flex-shrink-0">
              <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="38" fill="none" stroke={isDark ? '#374151' : '#e2e8f0'} strokeWidth="6" />
                <circle
                  cx="45" cy="45" r="38"
                  fill="none"
                  stroke={trustScoreColor(analysis.quick_verdict.trust_score).ring}
                  strokeWidth="6"
                  strokeDasharray={`${(analysis.quick_verdict.trust_score / 100) * 239} 239`}
                  strokeLinecap="round"
                  transform="rotate(-90 45 45)"
                  style={{ transition: 'stroke-dasharray 0.6s ease' }}
                />
                <text x="45" y="42" textAnchor="middle" className="text-xl font-black" fill={trustScoreColor(analysis.quick_verdict.trust_score).ring}>
                  {analysis.quick_verdict.trust_score}
                </text>
                <text x="45" y="56" textAnchor="middle" className="text-[9px] font-bold" fill={isDark ? '#9ca3af' : '#64748b'}>
                  / 100
                </text>
              </svg>
            </div>

            {/* Verdict text */}
            <div className="flex-1 text-center sm:text-left">
              <p className={`text-xs font-bold uppercase tracking-wider ${c.textMuted} mb-1`}>Trust Score</p>
              <h3 className={`text-xl font-black ${c.text} mb-1`}>
                {analysis.quick_verdict.label || verdictLabel(analysis.quick_verdict.trust_score)}
              </h3>
              <p className={`text-sm ${c.textSec}`}>{analysis.quick_verdict.one_liner}</p>
            </div>

            {/* Copy button */}
            <button
              onClick={copySummary}
              className={`flex-shrink-0 p-2.5 rounded-lg ${c.btnSec} flex items-center gap-1.5 min-h-[44px]`}
              title="Copy summary"
            >
              <Copy className="w-4 h-4" />
              <span className="text-xs font-semibold">{copiedSummary ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Skeleton for quick verdict while analyzing */}
      {phase === 'analyzing' && !analysis && (
        <div className={`${c.card} border rounded-xl p-6 flex items-center gap-5`}>
          <div className={`w-[90px] h-[90px] rounded-full ${c.skeleton}`} />
          <div className="flex-1 space-y-3">
            <div className={`h-4 w-32 rounded ${c.skeleton}`} />
            <div className={`h-6 w-48 rounded ${c.skeleton}`} />
            <div className={`h-4 w-full rounded ${c.skeleton}`} />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* PER-REVIEW CARDS                                         */}
      {/* ══════════════════════════════════════════════════════════ */}
      {reviewScores && reviewScores.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-bold ${c.text} flex items-center gap-2`}>
              <ShieldCheck className={`w-4 h-4 ${c.accent}`} />
              Individual Review Scores ({reviewScores.length})
              {parsedReviews.length > 20 && (
                <span className={`text-[10px] font-bold ${c.textMuted}`}>
                  (first 20 of {parsedReviews.length})
                </span>
              )}
            </h3>
            <button
              onClick={() => setSortMostSuspicious(p => !p)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold ${c.btnSec} min-h-[36px]`}
            >
              <ArrowUpDown className="w-3 h-3" />
              {sortMostSuspicious ? 'Most suspicious' : 'Original order'}
            </button>
          </div>

          <div className="space-y-3">
            {visibleReviews.map((review) => (
              <ReviewCard
                key={review.index}
                review={review}
                expanded={!!expandedCards[review.index]}
                onToggle={() => toggleCard(review.index)}
                c={c}
                isDark={isDark}
              />
            ))}
          </div>

          {sortedReviewsWithScores.length > 5 && !showAllReviews && (
            <button
              onClick={() => setShowAllReviews(true)}
              className={`w-full mt-3 py-3 rounded-lg text-sm font-semibold ${c.btnSec} flex items-center justify-center gap-1.5 min-h-[44px]`}
            >
              <ChevronDown className="w-4 h-4" />
              Show all {sortedReviewsWithScores.length} reviews
            </button>
          )}
        </div>
      )}

      {/* Skeleton for review cards while scoring */}
      {phase === 'scoring' && !reviewScores && parsedReviews.length > 0 && (
        <div className="space-y-3">
          {parsedReviews.slice(0, 3).map((_, i) => (
            <div key={i} className={`${c.card} border rounded-xl p-4 border-l-4 border-l-slate-300`}>
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <div className={`h-3 w-full rounded ${c.skeleton}`} />
                  <div className={`h-3 w-2/3 rounded ${c.skeleton}`} />
                </div>
                <div className={`w-10 h-10 rounded-full ${c.skeleton}`} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* PATTERN ANALYSIS SECTIONS                                */}
      {/* ══════════════════════════════════════════════════════════ */}
      {analysis && (
        <div className="space-y-4">

          {/* Manipulation Detection */}
          {analysis.manipulation_detected && (
            <div className={`${analysis.manipulation_detected.type === 'none'
              ? c.success : c.danger} border rounded-xl p-5`}>
              <div className="flex items-start gap-3">
                {analysis.manipulation_detected.type === 'none'
                  ? <ShieldCheck className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.successText}`} />
                  : <Target className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.dangerText}`} />}
                <div>
                  <h4 className="text-sm font-bold mb-1">
                    {analysis.manipulation_detected.type === 'none'
                      ? 'No Coordinated Manipulation Detected'
                      : `${analysis.manipulation_detected.type === 'positive_campaign' ? 'Positive Campaign' : analysis.manipulation_detected.type === 'negative_bombing' ? 'Negative Bombing' : 'Mixed Manipulation'} Detected`}
                    {analysis.manipulation_detected.confidence && analysis.manipulation_detected.type !== 'none' && (
                      <span className={`ml-2 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        analysis.manipulation_detected.confidence === 'high' ? (isDark ? 'bg-red-800 text-red-200' : 'bg-red-200 text-red-800')
                        : (isDark ? 'bg-amber-800 text-amber-200' : 'bg-amber-200 text-amber-800')
                      }`}>
                        {analysis.manipulation_detected.confidence} confidence
                      </span>
                    )}
                  </h4>
                  {analysis.manipulation_detected.description && (
                    <p className="text-sm mb-2">{analysis.manipulation_detected.description}</p>
                  )}
                  {analysis.manipulation_detected.evidence?.length > 0 && (
                    <ul className="space-y-1">
                      {analysis.manipulation_detected.evidence.map((e, i) => (
                        <li key={i} className="text-xs flex items-start gap-1.5">
                          <span className="mt-0.5">•</span><span>{e}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Genuine Consensus */}
          {analysis.genuine_consensus && (
            <div className={`${c.success} border rounded-xl p-5`}>
              <div className="flex items-start gap-3">
                <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.successText}`} />
                <div className="flex-1">
                  <h4 className="text-sm font-bold mb-2">What Genuine Reviews Say</h4>
                  <p className="text-sm mb-3">{analysis.genuine_consensus.summary}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {analysis.genuine_consensus.real_pros?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold mb-1 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> Real Pros
                        </p>
                        <ul className="space-y-0.5">
                          {analysis.genuine_consensus.real_pros.map((p, i) => (
                            <li key={i} className="text-xs flex items-start gap-1"><span>✓</span><span>{p}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysis.genuine_consensus.real_cons?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold mb-1 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" /> Real Cons
                        </p>
                        <ul className="space-y-0.5">
                          {analysis.genuine_consensus.real_cons.map((cn, i) => (
                            <li key={i} className="text-xs flex items-start gap-1"><span>✗</span><span>{cn}</span></li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {analysis.genuine_consensus.real_rating && (
                    <p className={`text-xs font-bold mt-2 ${c.successText}`}>
                      Genuine rating: {analysis.genuine_consensus.real_rating}/5 ★
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sentiment Trajectory */}
          {analysis.sentiment_trajectory && analysis.sentiment_trajectory.trend !== 'insufficient_data' && (
            <div className={`${c.info} border rounded-xl p-5`}>
              <div className="flex items-start gap-3">
                {analysis.sentiment_trajectory.trend === 'improving'
                  ? <TrendingUp className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.successText}`} />
                  : analysis.sentiment_trajectory.trend === 'declining'
                  ? <TrendingDown className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.dangerText}`} />
                  : <Minus className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.accent}`} />}
                <div>
                  <h4 className="text-sm font-bold mb-1">
                    Sentiment Trend: {analysis.sentiment_trajectory.trend.charAt(0).toUpperCase() + analysis.sentiment_trajectory.trend.slice(1)}
                  </h4>
                  <p className="text-sm">{analysis.sentiment_trajectory.description}</p>
                </div>
              </div>
            </div>
          )}

          {/* Category Comparison */}
          {analysis.category_comparison && (analysis.category_comparison.unusual_patterns?.length > 0 || analysis.category_comparison.normal_patterns?.length > 0) && (
            <div className={`${c.card} border rounded-xl p-5`}>
              <div className="flex items-start gap-3">
                <Package className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.accent}`} />
                <div className="flex-1">
                  <h4 className={`text-sm font-bold mb-2 ${c.text}`}>Category Comparison ({category})</h4>
                  {analysis.category_comparison.unusual_patterns?.length > 0 && (
                    <div className="mb-2">
                      <p className={`text-xs font-bold ${c.warningText} mb-1`}>Unusual for this category:</p>
                      <ul className="space-y-0.5">
                        {analysis.category_comparison.unusual_patterns.map((p, i) => (
                          <li key={i} className={`text-xs flex items-start gap-1.5 ${c.textSec}`}>
                            <AlertTriangle className={`w-3 h-3 flex-shrink-0 mt-0.5 ${c.warningText}`} /><span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysis.category_comparison.normal_patterns?.length > 0 && (
                    <div>
                      <p className={`text-xs font-bold ${c.successText} mb-1`}>Normal for this category:</p>
                      <ul className="space-y-0.5">
                        {analysis.category_comparison.normal_patterns.map((p, i) => (
                          <li key={i} className={`text-xs flex items-start gap-1.5 ${c.textSec}`}>
                            <CheckCircle className={`w-3 h-3 flex-shrink-0 mt-0.5 ${c.successText}`} /><span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Purchase Recommendation */}
          {analysis.purchase_recommendation && (
            <div className={`${
              analysis.purchase_recommendation.verdict === 'buy' ? c.success
              : analysis.purchase_recommendation.verdict === 'skip' ? c.danger
              : c.warning
            } border rounded-xl p-5`}>
              <div className="flex items-start gap-3">
                <Zap className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  analysis.purchase_recommendation.verdict === 'buy' ? c.successText
                  : analysis.purchase_recommendation.verdict === 'skip' ? c.dangerText
                  : c.warningText
                }`} />
                <div className="flex-1">
                  <h4 className="text-sm font-bold mb-1">
                    Purchase Verdict: <span className="uppercase">{analysis.purchase_recommendation.verdict}</span>
                    {analysis.purchase_recommendation.confidence && (
                      <span className={`ml-2 text-[10px] font-bold uppercase opacity-70`}>
                        ({analysis.purchase_recommendation.confidence} confidence)
                      </span>
                    )}
                  </h4>
                  <p className="text-sm">{analysis.purchase_recommendation.reasoning}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      {(reviewScores || analysis) && (
        <p className={`text-[10px] ${c.textMuted} text-center px-4`}>
          This analysis is AI-assisted and based only on the text you pasted. It cannot verify reviewer identities or access external data.
          Always use your own judgment when making purchase decisions.
        </p>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
// STAT CARD
// ════════════════════════════════════════════════════════════
function StatCard({ label, value, color = 'neutral', c }) {
  const valueColor = color === 'green' ? c.successText
    : color === 'red' ? c.dangerText
    : color === 'amber' ? c.warningText
    : c.text;
  return (
    <div className={`${c.statCard} border rounded-lg p-3 text-center`}>
      <p className={`text-[10px] font-bold ${c.textMuted} uppercase`}>{label}</p>
      <p className={`text-lg font-black mt-0.5 ${valueColor}`}>{value}</p>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// REVIEW CARD
// ════════════════════════════════════════════════════════════
function ReviewCard({ review, expanded, onToggle, c, isDark }) {
  const score = review.authenticity_score ?? 50;
  const edgeColor = reviewVerdictColor(score, isDark);
  const badgeBg = reviewScoreBadgeBg(score);

  const verdictText = review.verdict === 'likely_fake' ? '🔴 Likely Fake'
    : review.verdict === 'likely_genuine' ? '🟢 Likely Genuine'
    : '🟡 Uncertain';

  return (
    <div className={`${c.card} border rounded-xl border-l-4 ${edgeColor} overflow-hidden`}>
      <button onClick={onToggle} className="w-full p-4 text-left">
        <div className="flex items-start gap-3">
          {/* Review text preview */}
          <div className="flex-1 min-w-0">
            {/* Stars + verdict */}
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {review.starRating && (
                <span className="text-xs">
                  {'⭐'.repeat(review.starRating)}{'☆'.repeat(5 - review.starRating)}
                </span>
              )}
              <span className={`text-[10px] font-bold ${c.textMuted}`}>{verdictText}</span>
            </div>

            {/* Text excerpt */}
            <p className={`text-xs ${c.textSec} ${expanded ? '' : 'line-clamp-2'}`}>
              {review.rawText.slice(0, expanded ? undefined : 200)}
              {!expanded && review.rawText.length > 200 ? '...' : ''}
            </p>

            {/* Tags row */}
            <div className="flex flex-wrap gap-1 mt-2">
              {(review.red_flags || []).slice(0, expanded ? undefined : 2).map((flag, i) => (
                <span key={`r${i}`} className={`${c.pillRed} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>
                  {flag}
                </span>
              ))}
              {(review.green_flags || []).slice(0, expanded ? undefined : 2).map((flag, i) => (
                <span key={`g${i}`} className={`${c.pillGreen} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>
                  {flag}
                </span>
              ))}
              {!expanded && (
                <>
                  {review.isVerified && <span className={`${c.pillGreen} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>Verified</span>}
                  {review.wordCount && <span className={`${c.pillGray} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>{review.wordCount} words</span>}
                  {review.daysAgo !== null && review.daysAgo !== undefined && (
                    <span className={`${c.pillGray} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>
                      {review.daysAgo === 0 ? 'Today' : review.daysAgo === 1 ? 'Yesterday' : `${review.daysAgo}d ago`}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Score badge + chevron */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className={`w-10 h-10 rounded-full ${badgeBg} flex items-center justify-center`}>
              <span className="text-xs font-black">{score}</span>
            </div>
            {expanded ? <ChevronUp className={`w-3 h-3 ${c.textMuted}`} /> : <ChevronDown className={`w-3 h-3 ${c.textMuted}`} />}
          </div>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className={`mt-3 pt-3 border-t ${isDark ? 'border-zinc-700' : 'border-slate-200'}`}>
            {/* Full review text */}
            <div className={`${c.quoteBg} p-3 rounded-lg mb-3`}>
              <p className={`text-xs ${c.textSec} italic whitespace-pre-wrap`}>"{review.rawText}"</p>
            </div>

            {/* AI one-liner */}
            {review.one_liner && (
              <p className={`text-xs font-semibold ${c.text} mb-2`}>
                AI Assessment: {review.one_liner}
              </p>
            )}

            {/* All tags */}
            <div className="flex flex-wrap gap-1">
              {review.isVerified && <span className={`${c.pillGreen} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>Verified Purchase</span>}
              {!review.isVerified && <span className={`${c.pillRed} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>Unverified</span>}
              <span className={`${c.pillGray} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>{review.wordCount} words</span>
              {review.daysAgo !== null && review.daysAgo !== undefined && (
                <span className={`${c.pillGray} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>
                  {review.daysAgo === 0 ? 'Today' : review.daysAgo === 1 ? 'Yesterday' : `${review.daysAgo}d ago`}
                </span>
              )}
              {review.hasSpecificDetails && <span className={`${c.pillGreen} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>Has specific details</span>}
              {review.hasGenericPraise && <span className={`${c.pillRed} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>Generic praise</span>}
              {review.mentionsCompetitor && <span className={`${c.pillAmber} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>Mentions competitor</span>}
              {review.capsRatio > 0.3 && <span className={`${c.pillAmber} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>High CAPS</span>}
              {review.exclamationCount >= 3 && <span className={`${c.pillAmber} border text-[9px] font-semibold px-1.5 py-0.5 rounded`}>Excessive !!!</span>}
            </div>
          </div>
        )}
      </button>
    </div>
  );
}

FakeReviewDetective.displayName = 'FakeReviewDetective';
export default FakeReviewDetective;
