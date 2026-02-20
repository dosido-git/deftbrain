import React, { useState } from 'react';
import { Search, AlertTriangle, CheckCircle, XCircle, Loader2, TrendingUp, MessageSquare, ShieldAlert, ShieldCheck, Star, Clock, Award, Copy, ChevronDown, ChevronUp, BarChart3, ExternalLink, Calendar, Target, Users, Info, TrendingDown, Activity } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

const ReviewParanoiaHelper = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Form state
  const [reviewText, setReviewText] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [category, setCategory] = useState('Electronics');

  // Results state
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [expandedFakes, setExpandedFakes] = useState({});
  const [expandedLegit, setExpandedLegit] = useState({});
  const [copiedItem, setCopiedItem] = useState(null);

  const categoryOptions = [
    'Electronics',
    'Home & Kitchen',
    'Beauty & Personal Care',
    'Clothing & Fashion',
    'Sports & Outdoors',
    'Books & Media',
    'Toys & Games',
    'Health & Wellness',
    'Automotive',
    'Pet Supplies',
    'Office Products',
    'Other'
  ];

  // Theme-aware colors
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-gradient-to-br from-blue-50 to-cyan-50',
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-blue-200',
    cardAlt: isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-blue-50 border-blue-200',
    
    input: isDark 
      ? 'bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20'
      : 'bg-white border-blue-300 text-blue-900 placeholder:text-blue-400 focus:border-blue-600 focus:ring-blue-100',
    
    text: isDark ? 'text-zinc-50' : 'text-blue-900',
    textSecondary: isDark ? 'text-zinc-400' : 'text-blue-700',
    textMuted: isDark ? 'text-zinc-500' : 'text-blue-600',
    label: isDark ? 'text-zinc-300' : 'text-blue-800',
    
    accent: isDark ? 'text-blue-400' : 'text-blue-600',
    
    btnPrimary: isDark
      ? 'bg-blue-600 hover:bg-blue-700 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white',
    btnSecondary: isDark
      ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-50'
      : 'bg-blue-100 hover:bg-blue-200 text-blue-900',
    btnOutline: isDark
      ? 'border-zinc-600 hover:border-zinc-500 text-zinc-300'
      : 'border-blue-300 hover:border-blue-400 text-blue-700',
    
    danger: isDark
      ? 'bg-red-900/20 border-red-700 text-red-200'
      : 'bg-red-50 border-red-300 text-red-800',
    success: isDark
      ? 'bg-emerald-900/20 border-emerald-700 text-emerald-200'
      : 'bg-emerald-50 border-emerald-300 text-emerald-800',
    warning: isDark
      ? 'bg-amber-900/20 border-amber-700 text-amber-200'
      : 'bg-amber-50 border-amber-300 text-amber-800',
    info: isDark
      ? 'bg-blue-900/20 border-blue-700 text-blue-200'
      : 'bg-blue-50 border-blue-200 text-blue-900',
  };

  const handleAnalyze = async () => {
    if (!reviewText.trim() || reviewText.trim().length < 100) {
      setError('Please paste at least 100 characters of product reviews to analyze');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('review-paranoia-helper', {
        reviewText: reviewText.trim(),
        productUrl: productUrl.trim(),
        category
      });
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze reviews. Please try again.');
    }
  };

  const copyToClipboard = async (text, item) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(item);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const toggleExpandFake = (index) => {
    setExpandedFakes({ ...expandedFakes, [index]: !expandedFakes[index] });
  };

  const toggleExpandLegit = (index) => {
    setExpandedLegit({ ...expandedLegit, [index]: !expandedLegit[index] });
  };

  const getSeverityColor = (severity) => {
    switch(severity?.toLowerCase()) {
      case 'high':
      case 'critical':
        return isDark ? 'text-red-400 bg-red-900/30' : 'text-red-700 bg-red-100';
      case 'medium':
      case 'moderate':
        return isDark ? 'text-amber-400 bg-amber-900/30' : 'text-amber-700 bg-amber-100';
      case 'low':
        return isDark ? 'text-yellow-400 bg-yellow-900/30' : 'text-yellow-700 bg-yellow-100';
      default:
        return isDark ? 'text-gray-400 bg-gray-900/30' : 'text-gray-700 bg-gray-100';
    }
  };

  const getLikelihoodColor = (likelihood) => {
    switch(likelihood?.toLowerCase()) {
      case 'high':
        return isDark ? 'bg-red-900/30 border-red-700 text-red-200' : 'bg-red-50 border-red-300 text-red-800';
      case 'medium':
        return isDark ? 'bg-amber-900/30 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800';
      case 'low':
        return isDark ? 'bg-emerald-900/30 border-emerald-700 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-800';
      default:
        return c.info;
    }
  };

  const getRecommendationColor = (shouldBuy) => {
    switch(shouldBuy?.toLowerCase()) {
      case 'yes':
        return c.success;
      case 'no':
        return c.danger;
      case 'maybe':
        return c.warning;
      default:
        return c.info;
    }
  };

  const handleReset = () => {
    setReviewText('');
    setProductUrl('');
    setCategory('Electronics');
    setResults(null);
    setError('');
    setExpandedFakes({});
    setExpandedLegit({});
  };

  const exampleReviews = `⭐⭐⭐⭐⭐ Amazing product! Best purchase ever! 100% recommend!!! 👍👍👍
- Posted 2 days ago

⭐⭐⭐⭐⭐ This is the BEST thing I've ever bought. You NEED this in your life! Five stars!
- Posted 2 days ago

⭐⭐⭐⭐ Decent headphones. Sound quality is good for the price. The bass is a bit weak and the padding could be better, but they're comfortable for 2-3 hour sessions. Battery lasts about 8 hours like advertised. Would buy again.
- Verified Purchase, Posted 1 month ago

⭐⭐⭐⭐⭐ AMAZING!!!!! Love love love these!!! Best ever!!! 
- Posted 2 days ago

⭐⭐⭐ They work but there's a slight hissing noise when Bluetooth is connected. Not a deal-breaker for me but something to consider. Customer service was helpful when I reached out about it.
- Verified Purchase, Posted 3 weeks ago`;

  // Render star rating distribution chart
  const renderStarDistribution = (distribution) => {
    if (!distribution) return null;
    
    const maxCount = Math.max(...Object.values(distribution));
    
    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map(stars => {
          const count = distribution[stars] || 0;
          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
          
          return (
            <div key={stars} className="flex items-center gap-3">
              <div className="w-16 text-sm flex items-center gap-1">
                <span>{stars}</span>
                <Star className="w-3 h-3 fill-current text-amber-500" />
              </div>
              <div className={`flex-1 h-6 rounded overflow-hidden ${isDark ? 'bg-zinc-700' : 'bg-gray-200'}`}>
                <div
                  className={`h-full transition-all ${
                    stars >= 4 ? 'bg-emerald-500' : stars === 3 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-12 text-sm text-right">{count}</div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render verified vs unverified breakdown
  const renderVerifiedBreakdown = (stats) => {
    if (!stats) return null;
    
    const total = stats.verified + stats.unverified;
    const verifiedPercent = total > 0 ? (stats.verified / total) * 100 : 0;
    
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Verified Purchases</span>
          <span className={`text-2xl font-bold ${verifiedPercent >= 70 ? 'text-emerald-500' : verifiedPercent >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
            {Math.round(verifiedPercent)}%
          </span>
        </div>
        <div className={`w-full h-6 rounded overflow-hidden ${isDark ? 'bg-zinc-700' : 'bg-gray-200'}`}>
          <div
            className={`h-full ${verifiedPercent >= 70 ? 'bg-emerald-500' : verifiedPercent >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${verifiedPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-xs">
          <span className={c.textMuted}>✓ Verified: {stats.verified}</span>
          <span className={c.textMuted}>✗ Unverified: {stats.unverified}</span>
        </div>
        {verifiedPercent < 40 && (
          <p className="text-xs text-red-500">
            ⚠️ Low verified purchase rate is suspicious
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Ethical Considerations Banner */}
      <div className={`${c.info} border-l-4 rounded-r-lg p-5 transition-colors duration-200`}>
        <div className="flex items-start gap-3">
          <ShieldAlert className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
          <div>
            <h3 className={`font-bold mb-1 ${c.text}`}>Fake Review Detection AI with Ethical Analysis</h3>
            <p className={`text-sm ${c.textSecondary} mb-2`}>
              Paste product reviews and I'll analyze patterns, detect review bombing (both positive and negative), 
              verify purchase indicators, and help you make confident decisions.
            </p>
            <p className={`text-xs ${c.textMuted}`}>
              <strong>Note:</strong> This tool analyzes text you paste - it doesn't scrape websites. If scraping 
              reviews elsewhere, please respect robots.txt, rate limits, and terms of service.
            </p>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200`}>
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
            <Search className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${c.text}`}>Review Paranoia Helper V2</h2>
            <p className={`text-sm ${c.textMuted}`}>Advanced fake review detection with timeline analysis</p>
          </div>
        </div>

        <div className="space-y-6">
          
          {/* Review Text Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="review-text" className={`block text-sm font-medium ${c.label}`}>
                Paste product reviews
              </label>
              <button
                onClick={() => setReviewText(exampleReviews)}
                className={`text-xs ${c.accent} hover:underline`}
              >
                Try example
              </button>
            </div>
            <textarea
              id="review-text"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder={`Paste multiple product reviews here. Include ratings, dates, and verified purchase indicators.

Example format:
⭐⭐⭐⭐⭐ Amazing product! Best ever!
- Posted 2 days ago

⭐⭐⭐⭐ Good but has minor issues with the battery...
- Verified Purchase, Posted 1 month ago

💡 For best analysis, include:
• Star ratings
• Posting dates (for timeline analysis)
• Verified Purchase indicators
• Review text

The more reviews you paste, the better the pattern detection!`}
              className={`w-full p-4 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200 font-mono text-sm`}
              rows={12}
            />
            <p className={`text-xs ${c.textMuted} mt-1`}>
              💡 Minimum 100 characters. Include dates and verified indicators for timeline and verification analysis.
            </p>
          </div>

          {/* Product URL (Optional) */}
          <div>
            <label htmlFor="product-url" className={`block text-sm font-medium ${c.label} mb-2`}>
              Product URL (optional - for context only)
            </label>
            <input
              id="product-url"
              type="url"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://amazon.com/product-name/... (provides context but doesn't fetch reviews)"
              className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200`}
            />
            <p className={`text-xs ${c.textMuted} mt-1`}>
              This tool doesn't scrape reviews from URLs - paste reviews manually above
            </p>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className={`block text-sm font-medium ${c.label} mb-2`}>
              Product category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200`}
            >
              {categoryOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            <p className={`text-xs ${c.textMuted} mt-1`}>
              Helps benchmark against category-typical review patterns
            </p>
          </div>

          {/* Analyze Button */}
          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className={`flex-1 ${c.btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing patterns...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Analyze Reviews
                </>
              )}
            </button>

            {results && (
              <button
                onClick={handleReset}
                className={`px-6 py-3 border-2 ${c.btnOutline} font-medium rounded-lg transition-all duration-200`}
              >
                New Analysis
              </button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className={`p-4 ${c.danger} border rounded-lg flex items-start gap-3 transition-colors duration-200`} role="alert">
              <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Results Display */}
      {results && (
        <div className="space-y-6">
          
          {/* Overall Assessment */}
          <div className={`${getLikelihoodColor(results.overall_assessment?.fake_review_likelihood)} border-l-4 rounded-r-lg p-6 transition-colors duration-200`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-2`}>
                  Overall Assessment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <div className="text-sm opacity-75">Fake Review Likelihood</div>
                    <div className="text-2xl font-bold uppercase">
                      {results.overall_assessment?.fake_review_likelihood || 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm opacity-75">Confidence Score</div>
                    <div className="text-2xl font-bold">
                      {results.overall_assessment?.confidence_score || 0}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm opacity-75">Reviews Analyzed</div>
                    <div className="text-2xl font-bold">
                      {results.overall_assessment?.total_reviews_analyzed || 0}
                    </div>
                  </div>
                </div>
                {results.overall_assessment?.summary && (
                  <p className="text-sm">{results.overall_assessment.summary}</p>
                )}
              </div>
            </div>
          </div>

          {/* Analytics Dashboard */}
          {(results.timeline_analysis || results.verification_stats || results.star_distribution) && (
            <div className={`${c.card} border rounded-xl p-6 transition-colors duration-200`}>
              <h3 className={`text-lg font-bold ${c.text} mb-4 flex items-center gap-2`}>
                <BarChart3 className="w-6 h-6" />
                Analytics Dashboard
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Star Distribution */}
                {results.star_distribution && (
                  <div>
                    <h4 className={`text-sm font-semibold ${c.label} mb-3`}>Star Rating Distribution</h4>
                    {renderStarDistribution(results.star_distribution)}
                  </div>
                )}

                {/* Verified Purchase Stats */}
                {results.verification_stats && (
                  <div>
                    <h4 className={`text-sm font-semibold ${c.label} mb-3`}>Verification Rate</h4>
                    {renderVerifiedBreakdown(results.verification_stats)}
                  </div>
                )}

                {/* Review Length Stats */}
                {results.review_length_stats && (
                  <div>
                    <h4 className={`text-sm font-semibold ${c.label} mb-3`}>Review Length Analysis</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Average:</span>
                        <span className="font-semibold">{results.review_length_stats.average} words</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Shortest:</span>
                        <span>{results.review_length_stats.shortest} words</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Longest:</span>
                        <span>{results.review_length_stats.longest} words</span>
                      </div>
                      {results.review_length_stats.suspiciously_short > 0 && (
                        <p className="text-xs text-amber-500 mt-2">
                          ⚠️ {results.review_length_stats.suspiciously_short} suspiciously short reviews (&lt;10 words)
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline Analysis */}
          {results.timeline_analysis && (
            <div className={`${results.timeline_analysis.review_bombing_detected ? c.danger : c.info} border-l-4 rounded-r-lg p-5 transition-colors duration-200`}>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className={`font-semibold mb-2`}>Timeline Analysis</h3>
                  {results.timeline_analysis.review_bombing_detected && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Review Bombing Detected
                      </p>
                      <p className="text-sm mt-1">{results.timeline_analysis.bombing_details}</p>
                    </div>
                  )}
                  {results.timeline_analysis.clusters && results.timeline_analysis.clusters.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Suspicious Clusters:</p>
                      <ul className="text-sm space-y-1">
                        {results.timeline_analysis.clusters.map((cluster, idx) => (
                          <li key={idx}>• {cluster}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {results.timeline_analysis.sentiment_trend && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold mb-1">Sentiment Trend:</p>
                      <p className="text-sm">{results.timeline_analysis.sentiment_trend}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Competitor Bombing Detection */}
          {results.competitor_bombing && results.competitor_bombing.detected && (
            <div className={`${c.danger} border-l-4 rounded-r-lg p-5 transition-colors duration-200`}>
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className={`font-semibold mb-2 flex items-center gap-2`}>
                    <TrendingDown className="w-4 h-4" />
                    Potential Competitor Attack Detected
                  </h3>
                  <p className="text-sm mb-2">{results.competitor_bombing.description}</p>
                  {results.competitor_bombing.evidence && results.competitor_bombing.evidence.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Evidence:</p>
                      <ul className="text-sm space-y-1">
                        {results.competitor_bombing.evidence.map((item, idx) => (
                          <li key={idx}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Category Benchmark */}
          {results.category_benchmark && (
            <div className={`${c.info} border-l-4 rounded-r-lg p-5 transition-colors duration-200`}>
              <div className="flex items-start gap-3">
                <Activity className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className={`font-semibold mb-2`}>Category Benchmark ({category})</h3>
                  <p className="text-sm mb-2">{results.category_benchmark.comparison}</p>
                  {results.category_benchmark.unusual_patterns && results.category_benchmark.unusual_patterns.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Unusual Patterns for This Category:</p>
                      <ul className="text-sm space-y-1">
                        {results.category_benchmark.unusual_patterns.map((pattern, idx) => (
                          <li key={idx}>• {pattern}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Fake Indicators */}
          {results.fake_indicators && results.fake_indicators.length > 0 && (
            <div className={`${c.card} border rounded-xl p-6 transition-colors duration-200`}>
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="w-6 h-6 text-red-500" />
                <h3 className={`text-lg font-bold ${c.text}`}>
                  ⚠️ Fake Review Indicators ({results.fake_indicators.length})
                </h3>
              </div>
              <div className="space-y-3">
                {results.fake_indicators.map((indicator, idx) => (
                  <div key={idx} className={`${c.danger} border rounded-lg p-4 transition-colors duration-200`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-4 h-4" />
                          <h4 className="font-semibold">{indicator.pattern}</h4>
                          {indicator.severity && (
                            <span className={`text-xs px-2 py-0.5 rounded font-semibold ${getSeverityColor(indicator.severity)}`}>
                              {indicator.severity.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="text-sm opacity-75">
                          Found in {indicator.instances} review(s)
                        </div>
                      </div>
                      <button
                        onClick={() => toggleExpandFake(idx)}
                        className={`p-1 rounded ${c.btnSecondary}`}
                      >
                        {expandedFakes[idx] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {expandedFakes[idx] && indicator.examples && indicator.examples.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-current opacity-50">
                        <div className="text-xs font-semibold mb-2">Examples:</div>
                        <div className="space-y-2">
                          {indicator.examples.map((example, exIdx) => (
                            <div key={exIdx} className={`p-2 rounded text-xs italic ${isDark ? 'bg-zinc-800' : 'bg-white'} opacity-75`}>
                              "{example}"
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legitimate Indicators */}
          {results.legitimate_indicators && results.legitimate_indicators.length > 0 && (
            <div className={`${c.card} border rounded-xl p-6 transition-colors duration-200`}>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-6 h-6 text-emerald-500" />
                <h3 className={`text-lg font-bold ${c.text}`}>
                  ✅ Legitimate Review Indicators ({results.legitimate_indicators.length})
                </h3>
              </div>
              <div className="space-y-3">
                {results.legitimate_indicators.map((indicator, idx) => (
                  <div key={idx} className={`${c.success} border rounded-lg p-4 transition-colors duration-200`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldCheck className="w-4 h-4" />
                          <h4 className="font-semibold">{indicator.pattern}</h4>
                        </div>
                        <div className="text-sm opacity-75">
                          Found in {indicator.instances} review(s)
                        </div>
                      </div>
                      <button
                        onClick={() => toggleExpandLegit(idx)}
                        className={`p-1 rounded ${c.btnSecondary}`}
                      >
                        {expandedLegit[idx] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    {expandedLegit[idx] && indicator.examples && indicator.examples.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-current opacity-50">
                        <div className="text-xs font-semibold mb-2">Examples:</div>
                        <div className="space-y-2">
                          {indicator.examples.map((example, exIdx) => (
                            <div key={exIdx} className={`p-2 rounded text-xs italic ${isDark ? 'bg-zinc-800' : 'bg-white'} opacity-75`}>
                              "{example}"
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Genuine Pros & Cons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.genuine_pros && results.genuine_pros.length > 0 && (
              <div className={`${c.success} border rounded-lg p-5 transition-colors duration-200`}>
                <h3 className={`font-bold mb-3 flex items-center gap-2`}>
                  <TrendingUp className="w-5 h-5" />
                  Genuine Pros
                </h3>
                <ul className="space-y-2">
                  {results.genuine_pros.map((pro, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {results.genuine_cons && results.genuine_cons.length > 0 && (
              <div className={`${c.warning} border rounded-lg p-5 transition-colors duration-200`}>
                <h3 className={`font-bold mb-3 flex items-center gap-2`}>
                  <AlertTriangle className="w-5 h-5" />
                  Genuine Cons
                </h3>
                <ul className="space-y-2">
                  {results.genuine_cons.map((con, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Reviews to Trust */}
          {results.reviews_to_trust && results.reviews_to_trust.length > 0 && (
            <div className={`${c.card} border rounded-xl p-6 transition-colors duration-200`}>
              <h3 className={`text-lg font-bold ${c.text} mb-4 flex items-center gap-2`}>
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
                Reviews That Matter ({results.reviews_to_trust.length})
              </h3>
              <div className="space-y-4">
                {results.reviews_to_trust.map((review, idx) => (
                  <div key={idx} className={`${c.success} border rounded-lg p-4 transition-colors duration-200`}>
                    <div className={`italic text-sm mb-3 p-3 rounded ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
                      "{review.excerpt}"
                    </div>
                    <div className="mb-2">
                      <div className="text-xs font-semibold opacity-75 mb-1">Why trustworthy:</div>
                      <p className="text-sm">{review.why_trustworthy}</p>
                    </div>
                    {review.key_insights && review.key_insights.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold opacity-75 mb-1">Key insights:</div>
                        <ul className="text-sm space-y-1">
                          {review.key_insights.map((insight, insIdx) => (
                            <li key={insIdx} className="flex items-start gap-2">
                              <span className="opacity-50">•</span>
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews to Ignore */}
          {results.reviews_to_ignore && results.reviews_to_ignore.length > 0 && (
            <div className={`${c.card} border rounded-xl p-6 transition-colors duration-200`}>
              <h3 className={`text-lg font-bold ${c.text} mb-4 flex items-center gap-2`}>
                <XCircle className="w-6 h-6 text-red-500" />
                Suspicious Reviews to Ignore ({results.reviews_to_ignore.length})
              </h3>
              <div className="space-y-4">
                {results.reviews_to_ignore.map((review, idx) => (
                  <div key={idx} className={`${c.danger} border rounded-lg p-4 transition-colors duration-200`}>
                    <div className={`italic text-sm mb-3 p-3 rounded ${isDark ? 'bg-zinc-800' : 'bg-white'} opacity-75`}>
                      "{review.excerpt}"
                    </div>
                    <div>
                      <div className="text-xs font-semibold opacity-75 mb-1">Why suspicious:</div>
                      <p className="text-sm">{review.why_suspicious}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Purchase Recommendation */}
          {results.purchase_recommendation && (
            <div className={`${getRecommendationColor(results.purchase_recommendation.should_buy)} border-l-4 rounded-r-lg p-6 transition-colors duration-200`}>
              <h3 className="text-xl font-bold mb-3">
                📊 Purchase Recommendation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm opacity-75">Should You Buy?</div>
                  <div className="text-3xl font-bold uppercase">
                    {results.purchase_recommendation.should_buy}
                  </div>
                </div>
                <div>
                  <div className="text-sm opacity-75">Confidence</div>
                  <div className="text-3xl font-bold uppercase">
                    {results.purchase_recommendation.confidence}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold opacity-75 mb-2">Reasoning:</div>
                <p className="text-sm">{results.purchase_recommendation.reasoning}</p>
              </div>
            </div>
          )}

          {/* Additional Insights */}
          {results.additional_insights && (
            <div className={`${c.info} border-l-4 rounded-r-lg p-5 transition-colors duration-200`}>
              <h3 className={`font-semibold mb-2 ${c.text} flex items-center gap-2`}>
                <BarChart3 className="w-5 h-5" />
                Additional Insights
              </h3>
              <p className={`text-sm ${c.textSecondary}`}>{results.additional_insights}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewParanoiaHelper;
