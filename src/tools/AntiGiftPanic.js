import React, { useState, useEffect } from 'react';
import { Gift, Loader2, AlertCircle, ExternalLink, ShoppingBag, Sparkles, Clock, Package, Heart, Copy, CheckCircle, RefreshCw, Filter, Calendar, Leaf, MessageCircle, Truck, DollarSign, Info } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

const AntiGiftPanic = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Form state
  const [age, setAge] = useState('');
  const [interests, setInterests] = useState('');
  const [occasion, setOccasion] = useState('Birthday');
  const [occasionDate, setOccasionDate] = useState('');
  const [budget, setBudget] = useState(100);
  const [relationship, setRelationship] = useState('');
  const [considerSustainability, setConsiderSustainability] = useState(false);

  // Results state
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copiedItem, setCopiedItem] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [savedFavorites, setSavedFavorites] = useState([]);
  const [daysUntilOccasion, setDaysUntilOccasion] = useState(null);

  const occasionOptions = [
    'Birthday',
    'Holiday',
    'Anniversary',
    'Thank You',
    'Just Because',
    'Graduation',
    'Wedding',
    'Baby Shower',
    'Retirement',
    'Other'
  ];

  // Calculate days until occasion
  useEffect(() => {
    if (occasionDate) {
      const today = new Date();
      const targetDate = new Date(occasionDate);
      const diffTime = targetDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysUntilOccasion(diffDays);
    } else {
      setDaysUntilOccasion(null);
    }
  }, [occasionDate]);

  // Theme-aware colors
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-gradient-to-br from-emerald-50 to-emerald-50',
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-emerald-200',
    cardAlt: isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-emerald-50 border-emerald-200',
    
    input: isDark 
      ? 'bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
      : 'bg-white border-emerald-300 text-emerald-900 placeholder:text-emerald-400 focus:border-emerald-600 focus:ring-emerald-100',
    
    text: isDark ? 'text-zinc-50' : 'text-emerald-900',
    textSecondary: isDark ? 'text-zinc-400' : 'text-emerald-700',
    textMuted: isDark ? 'text-zinc-500' : 'text-emerald-600',
    label: isDark ? 'text-zinc-300' : 'text-emerald-800',
    
    accent: isDark ? 'text-emerald-400' : 'text-emerald-600',
    
    btnPrimary: isDark
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
      : 'bg-emerald-600 hover:bg-emerald-700 text-white',
    btnSecondary: isDark
      ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-50'
      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900',
    btnOutline: isDark
      ? 'border-zinc-600 hover:border-zinc-500 text-zinc-300'
      : 'border-emerald-300 hover:border-emerald-400 text-emerald-700',
    
    infoBox: isDark
      ? 'bg-blue-900/20 border-blue-700'
      : 'bg-blue-50 border-blue-200',
    successBox: isDark
      ? 'bg-emerald-900/20 border-emerald-700'
      : 'bg-emerald-50 border-emerald-200',
    warningBox: isDark
      ? 'bg-red-900/20 border-red-700'
      : 'bg-red-50 border-red-200',
    sustainBox: isDark
      ? 'bg-emerald-900/20 border-emerald-700'
      : 'bg-emerald-50 border-emerald-200',
  };

  const handleGenerate = async () => {
    if (!age || age < 1 || age > 120) {
      setError('Please enter a valid age (1-120)');
      return;
    }

    if (!interests.trim()) {
      setError('Please enter some interests to help find the perfect gift');
      return;
    }

    setError('');
    setResults(null);
    setSelectedCategory('all');

    try {
      const data = await callToolEndpoint('anti-gift-panic', {
        age: parseInt(age),
        interests: interests.trim(),
        occasion,
        occasionDate,
        daysUntilOccasion,
        budget,
        relationship: relationship.trim(),
        considerSustainability
      });
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to generate gift recommendations. Please try again.');
    }
  };

  const handleRegenerateGift = async (index) => {
    try {
      const data = await callToolEndpoint('anti-gift-panic', {
        age: parseInt(age),
        interests: interests.trim(),
        occasion,
        occasionDate,
        daysUntilOccasion,
        budget,
        relationship: relationship.trim(),
        considerSustainability,
        excludeProduct: results.gift_recommendations[index].product_name
      });
      
      const updatedRecommendations = [...results.gift_recommendations];
      updatedRecommendations[index] = data.gift_recommendations[0];
      setResults({
        ...results,
        gift_recommendations: updatedRecommendations
      });
    } catch (err) {
      setError('Failed to regenerate gift. Please try again.');
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

  const toggleFavorite = (gift) => {
    const isFavorite = savedFavorites.some(f => f.product_name === gift.product_name);
    if (isFavorite) {
      setSavedFavorites(savedFavorites.filter(f => f.product_name !== gift.product_name));
    } else {
      setSavedFavorites([...savedFavorites, gift]);
    }
  };

  const isFavorite = (gift) => {
    return savedFavorites.some(f => f.product_name === gift.product_name);
  };

  const getFilteredGifts = () => {
    if (!results?.gift_recommendations) return [];
    if (selectedCategory === 'all') return results.gift_recommendations;
    return results.gift_recommendations.filter(gift => 
      gift.category?.toLowerCase() === selectedCategory.toLowerCase()
    );
  };

  const getUniqueCategories = () => {
    if (!results?.gift_recommendations) return [];
    const categories = results.gift_recommendations.map(g => g.category).filter(Boolean);
    return ['all', ...new Set(categories)];
  };

  const getConfidenceColor = (score) => {
    if (score >= 8) return isDark ? 'text-emerald-400' : 'text-emerald-600';
    if (score >= 6) return isDark ? 'text-amber-400' : 'text-amber-600';
    return isDark ? 'text-red-400' : 'text-red-600';
  };

  const getConfidenceLabel = (score) => {
    if (score >= 8) return 'High Confidence';
    if (score >= 6) return 'Good Match';
    return 'Decent Option';
  };

  const getShippingUrgency = () => {
    if (!daysUntilOccasion) return null;
    if (daysUntilOccasion < 0) return { label: 'Past Due', color: 'text-red-500', urgent: true };
    if (daysUntilOccasion <= 2) return { label: 'Express Shipping Required', color: 'text-red-500', urgent: true };
    if (daysUntilOccasion <= 7) return { label: 'Order Soon', color: 'text-amber-500', urgent: true };
    if (daysUntilOccasion <= 14) return { label: 'Good Time to Order', color: 'text-emerald-500', urgent: false };
    return { label: 'Plenty of Time', color: 'text-emerald-500', urgent: false };
  };

  const handleReset = () => {
    setAge('');
    setInterests('');
    setOccasion('Birthday');
    setOccasionDate('');
    setBudget(100);
    setRelationship('');
    setConsiderSustainability(false);
    setResults(null);
    setError('');
    setSelectedCategory('all');
    setDaysUntilOccasion(null);
  };

return (
  <div className={`min-h-screen ${c.bg} py-8 px-4`}>
    <div className="max-w-4xl mx-auto space-y-6">
      
        {/* Header */}
      <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-3 rounded-lg ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-100'}`}>
            <Gift className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
          </div>
          <div>
            <h2 className={`text-2xl font-bold ${c.text}`}>Anti-Gift Panic 🎁</h2>
            <p className={`text-sm ${c.textMuted}`}>Find the perfect gift without the paralysis</p>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200`}>
        


      {/* Input Form */}
      <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200`}>
          
          {/* Age */}
          <div>
            <label htmlFor="age" className={`block text-sm font-medium ${c.label} mb-2`}>
              Recipient's age
            </label>
            <input
              id="age"
              type="number"
              min="1"
              max="120"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g., 28"
              className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200`}
            />
          </div>

          {/* Interests */}
          <div>
            <label htmlFor="interests" className={`block text-sm font-medium ${c.label} mb-2`}>
              General interests
            </label>
            <textarea
              id="interests"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="e.g., coffee enthusiast, sci-fi reader, minimalist aesthetic, yoga, sustainable living"
              className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200`}
              rows={3}
            />
            <p className={`text-xs ${c.textMuted} mt-1`}>
              The more specific, the better! Mention hobbies, values, aesthetic preferences, or things they talk about.
            </p>
          </div>

          {/* Occasion, Date, and Relationship */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="occasion" className={`block text-sm font-medium ${c.label} mb-2`}>
                Occasion
              </label>
              <select
                id="occasion"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200`}
              >
                {occasionOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="occasion-date" className={`block text-sm font-medium ${c.label} mb-2 flex items-center gap-2`}>
                <Calendar className="w-4 h-4" />
                Occasion date (optional)
              </label>
              <input
                id="occasion-date"
                type="date"
                value={occasionDate}
                onChange={(e) => setOccasionDate(e.target.value)}
                className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200`}
              />
            </div>

            <div>
              <label htmlFor="relationship" className={`block text-sm font-medium ${c.label} mb-2`}>
                Relationship
              </label>
              <input
                id="relationship"
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="e.g., mom, coworker"
                className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200`}
              />
            </div>
          </div>

          {/* Shipping Urgency Warning */}
          {daysUntilOccasion !== null && (
            <div className={`p-4 rounded-lg border-l-4 ${
              getShippingUrgency().urgent 
                ? c.warningBox 
                : c.successBox
            }`}>
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                <div>
                  <div className={`font-semibold ${getShippingUrgency().color}`}>
                    {daysUntilOccasion} days until {occasion}
                  </div>
                  <div className={`text-sm ${c.textSecondary}`}>
                    {getShippingUrgency().label} - {
                      daysUntilOccasion <= 2 
                        ? 'Consider express shipping or digital/experience gifts'
                        : daysUntilOccasion <= 7
                        ? 'Standard shipping should work, but order soon'
                        : 'You have time to shop for the best deals'
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Budget Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="budget" className={`block text-sm font-medium ${c.label}`}>
                Budget
              </label>
              <span className={`text-lg font-bold ${c.accent}`}>
                ${budget}
              </span>
            </div>
            <input
              id="budget"
              type="range"
              min="10"
              max="500"
              step="10"
              value={budget}
              onChange={(e) => setBudget(parseInt(e.target.value))}
              className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-xs mt-1">
              <span className={c.textMuted}>$10</span>
              <span className={c.textMuted}>$500</span>
            </div>
          </div>

          {/* Sustainability Toggle */}
          <div className={`p-4 rounded-lg ${c.sustainBox} border transition-colors duration-200`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={considerSustainability}
                onChange={(e) => setConsiderSustainability(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Leaf className="w-4 h-4" />
                  <span className={`font-semibold ${c.text}`}>Prioritize sustainable & ethical options</span>
                </div>
                <p className={`text-xs ${c.textSecondary}`}>
                  Favor eco-friendly, fair-trade, locally-made, or sustainable products when available. 
                  May slightly limit options but supports ethical businesses.
                </p>
              </div>
            </label>
          </div>

          {/* Generate Button */}
          <div className="flex gap-3">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`flex-1 ${c.btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Finding perfect gifts...
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  Find Gifts
                </>
              )}
            </button>

            {results && (
              <button
                onClick={handleReset}
                className={`px-6 py-3 border-2 ${c.btnOutline} font-medium rounded-lg transition-all duration-200`}
              >
                New Search
              </button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className={`p-4 ${c.warningBox} border rounded-lg flex items-start gap-3 transition-colors duration-200`} role="alert">
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          
          {/* Budget Optimization Tip */}
          {results.budget_optimization && (
            <div className={`${c.infoBox} border-l-4 rounded-r-lg p-4 transition-colors duration-200`}>
              <div className="flex items-start gap-3">
                <DollarSign className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
                <div>
                  <h3 className={`font-semibold mb-1 ${c.text}`}>Budget Optimization</h3>
                  <p className={`text-sm ${c.textSecondary}`}>{results.budget_optimization}</p>
                </div>
              </div>
            </div>
          )}

          {/* Gift Card Message */}
          {results.gift_card_message && (
            <div className={`${c.card} border rounded-xl p-6 transition-colors duration-200`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-lg font-bold ${c.text} flex items-center gap-2`}>
                  <MessageCircle className="w-5 h-5" />
                  Suggested Gift Card Message
                </h3>
                <button
                  onClick={() => copyToClipboard(results.gift_card_message, 'card-message')}
                  className={`px-3 py-2 ${c.btnSecondary} rounded-lg text-sm flex items-center gap-2 transition-all`}
                >
                  {copiedItem === 'card-message' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Message
                    </>
                  )}
                </button>
              </div>
              <div className={`p-4 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-emerald-50'} border ${isDark ? 'border-zinc-600' : 'border-emerald-200'}`}>
                <p className={`text-sm ${c.text} italic`}>"{results.gift_card_message}"</p>
              </div>
              <p className={`text-xs ${c.textMuted} mt-2`}>
                Personalize this message to make it your own!
              </p>
            </div>
          )}

          {/* Tips & Timing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.timing_advice && (
              <div className={`${c.successBox} border-l-4 rounded-r-lg p-4 transition-colors duration-200`}>
                <div className="flex items-start gap-3">
                  <Clock className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <div>
                    <h3 className={`font-semibold mb-1 ${c.text}`}>Timing Advice</h3>
                    <p className={`text-sm ${c.textSecondary}`}>{results.timing_advice}</p>
                  </div>
                </div>
              </div>
            )}

            {results.gift_wrap_suggestion && (
              <div className={`${c.successBox} border-l-4 rounded-r-lg p-4 transition-colors duration-200`}>
                <div className="flex items-start gap-3">
                  <Package className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <div>
                    <h3 className={`font-semibold mb-1 ${c.text}`}>Gift Wrap Style</h3>
                    <p className={`text-sm ${c.textSecondary}`}>{results.gift_wrap_suggestion}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Shopping Tips */}
          {results.shopping_tips && results.shopping_tips.length > 0 && (
            <div className={`${c.infoBox} border-l-4 rounded-r-lg p-4 transition-colors duration-200`}>
              <h3 className={`font-semibold mb-2 ${c.text}`}>💡 Shopping Tips</h3>
              <ul className={`text-sm ${c.textSecondary} space-y-1`}>
                {results.shopping_tips.map((tip, idx) => (
                  <li key={idx}>• {tip}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Sustainability Note */}
          {considerSustainability && results.sustainability_note && (
            <div className={`${c.sustainBox} border-l-4 rounded-r-lg p-4 transition-colors duration-200`}>
              <div className="flex items-start gap-3">
                <Leaf className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                <div>
                  <h3 className={`font-semibold mb-1 ${c.text}`}>Sustainable Choices</h3>
                  <p className={`text-sm ${c.textSecondary}`}>{results.sustainability_note}</p>
                </div>
              </div>
            </div>
          )}

          {/* Category Filter */}
          {getUniqueCategories().length > 2 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className={`w-4 h-4 ${c.textMuted}`} />
              <span className={`text-sm font-medium ${c.label}`}>Filter:</span>
              {getUniqueCategories().map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? c.btnPrimary
                      : c.btnSecondary
                  }`}
                >
                  {category === 'all' ? 'All' : category}
                </button>
              ))}
            </div>
          )}

          {/* Gift Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFilteredGifts().map((gift, idx) => (
              <div key={idx} className={`${c.card} border rounded-xl shadow-sm p-5 transition-all duration-200 hover:shadow-lg`}>
                
                {/* Header with Category, Sustainable Badge, & Favorite */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {gift.category && (
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${isDark ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                        {gift.category}
                      </span>
                    )}
                    {gift.is_sustainable && (
                      <span className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1 ${isDark ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'}`}>
                        <Leaf className="w-3 h-3" />
                        Eco-Friendly
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleFavorite(gift)}
                    className={`p-1 rounded transition-colors ${
                      isFavorite(gift)
                        ? 'text-emerald-500'
                        : isDark ? 'text-zinc-500 hover:text-emerald-400' : 'text-gray-400 hover:text-emerald-500'
                    }`}
                    title={isFavorite(gift) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite(gift) ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Product Name */}
                <h3 className={`text-lg font-bold ${c.text} mb-3`}>
                  {gift.product_name}
                </h3>

                {/* Why This Works */}
                <div className="mb-4">
                  <h4 className={`text-sm font-semibold ${c.label} mb-1`}>Why this works:</h4>
                  <p className={`text-sm ${c.textSecondary}`}>{gift.why_this_works}</p>
                </div>

                {/* Personality Match */}
                {gift.personality_match && (
                  <div className="mb-4">
                    <h4 className={`text-sm font-semibold ${c.label} mb-1`}>Personality match:</h4>
                    <p className={`text-sm ${c.textSecondary}`}>{gift.personality_match}</p>
                  </div>
                )}

                {/* Price and Confidence */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className={`text-xs ${c.textMuted}`}>Price</div>
                    <div className={`text-lg font-bold ${c.accent}`}>{gift.price_range}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs ${c.textMuted}`}>Confidence</div>
                    <div className={`text-lg font-bold ${getConfidenceColor(gift.confidence_score)}`}>
                      {gift.confidence_score}/10
                    </div>
                    <div className={`text-xs ${getConfidenceColor(gift.confidence_score)}`}>
                      {getConfidenceLabel(gift.confidence_score)}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  
                    <a href={gift.purchase_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full ${c.btnPrimary} py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Search Product
                  </a>

                  <button
                    onClick={() => copyToClipboard(gift.product_name, `link-${idx}`)}
                    className={`w-full ${c.btnSecondary} py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-all`}
                    title="Copy product name"
                  >
                    {copiedItem === `link-${idx}` ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleRegenerateGift(idx)}
                    disabled={loading}
                    className={`w-full ${c.btnSecondary} py-2 px-3 rounded-lg text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50`}
                    title="Get another suggestion"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Regenerate
                  </button>
                </div>

                {/* Price Tracking Note */}
                {gift.price_tracking_note && (
                  <div className={`mt-3 p-2 rounded text-xs ${isDark ? 'bg-zinc-700' : 'bg-emerald-50'}`}>
                    <p className={c.textMuted}>💡 {gift.price_tracking_note}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Saved Favorites */}
          {savedFavorites.length > 0 && (
            <div className={`${c.cardAlt} border rounded-xl p-6 transition-colors duration-200`}>
              <h3 className={`text-lg font-bold ${c.text} mb-4 flex items-center gap-2`}>
                <Heart className="w-5 h-5 fill-current text-emerald-500" />
                Saved Favorites ({savedFavorites.length})
              </h3>
              <div className="space-y-2">
                {savedFavorites.map((gift, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-white'}`}>
                    <div className="flex-1">
                      <div className={`font-semibold ${c.text}`}>{gift.product_name}</div>
                      <div className={`text-sm ${c.textMuted}`}>{gift.price_range}</div>
                    </div>
                    <button
                      onClick={() => toggleFavorite(gift)}
                      className={`text-emerald-500 hover:text-emerald-600 transition-colors text-sm`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Privacy & Ethics Note */}
          <div className={`${c.infoBox} border rounded-lg p-4 transition-colors duration-200`}>
            <p className={`text-xs ${c.textSecondary}`}>
              <strong>Privacy & Ethics:</strong> These recommendations are AI-generated based on your inputs. 
              No personal data is stored. Purchase links are non-affiliated search terms. 
              Always verify product details and prices before purchasing.
              {considerSustainability && " Sustainable options prioritized where available."}
            </p>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default AntiGiftPanic;
