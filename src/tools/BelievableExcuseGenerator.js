import React, { useState, useEffect } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { CopyBtn } from '../components/ActionButtons';

const YourTool = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  // Define theme-aware colors
  const colors = {
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-stone-200',
    input: isDark 
      ? 'bg-zinc-900 border-zinc-700 text-zinc-50 focus:border-[#D4AF37]'
      : 'bg-white border-stone-300 text-stone-900 focus:border-amber-600',
    text: isDark ? 'text-zinc-50' : 'text-stone-900',
    btnPrimary: isDark 
      ? 'bg-[#D4AF37] hover:bg-[#B8962F] text-zinc-900'
      : 'bg-stone-900 hover:bg-stone-800 text-white',
  };
  
  return (
    <div className={`${colors.card} border rounded-xl p-6`}>
      <input className={`${colors.input} p-3 rounded-lg`} />
      <button className={`${colors.btnPrimary} py-2 px-4 rounded-lg`}>
        Submit
      </button>
    </div>
  );
};

const BelievableExcuseGenerator = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Form state
  const [eventType, setEventType] = useState('');
  const [relationship, setRelationship] = useState('Acquaintance');
  const [noticeTime, setNoticeTime] = useState('1-2 days');
  const [tonePreference, setTonePreference] = useState('Apologetic');
  const [culturalContext, setCulturalContext] = useState('Western (US/Europe)');
  const [cannotUse, setCannotUse] = useState({
    work: false,
    health: false,
    family: false
  });

  // Results state
  const [results, setResults] = useState(null);
  const [selectedExcuse, setSelectedExcuse] = useState(0);
  const [error, setError] = useState('');
  
  // Ethical flow state
  const [showEthicalCheck, setShowEthicalCheck] = useState(true);
  const [agreedToEthics, setAgreedToEthics] = useState(false);
  const [showHonestAlternatives, setShowHonestAlternatives] = useState(true);
  const [viewCount, setViewCount] = useState(0);
  const [excuseHistory, setExcuseHistory] = useState([]);
  const [recentDecline, setRecentDecline] = useState(false);
  const [viewMode, setViewMode] = useState('alternatives'); // 'alternatives' or 'excuses'

  const relationshipOptions = [
    'Close friend',
    'Acquaintance',
    'Family',
    'Coworker',
    'Boss',
    'Neighbor',
    'Date/Romantic interest'
  ];

  const noticeOptions = [
    'Already late',
    'Last minute (hours)',
    '1-2 days',
    'Week+',
    '2+ weeks'
  ];

  const toneOptions = [
    'Apologetic',
    'Brief',
    'Warm but firm',
    'Professional'
  ];

  const culturalOptions = [
    'Western (US/Europe)',
    'East Asian (China, Japan, Korea)',
    'South Asian (India, Pakistan)',
    'Middle Eastern',
    'Latin American',
    'African',
    'Mixed/Not sure'
  ];

  // Honest boundary-setting scripts
  const honestAlternatives = {
    general: [
      "I appreciate the invitation, but I won't be able to make it.",
      "Thank you for thinking of me, but I need to decline.",
      "I'm not available that day, but I appreciate you asking."
    ],
    withBoundary: [
      "I'd prefer to keep my reasons private, but thank you for understanding.",
      "I'm not comfortable sharing why, but I hope you can respect my decision.",
      "I'd rather not go into details, but I appreciate your invitation."
    ],
    firm: [
      "I've decided to decline. I hope you have a great time!",
      "It's not going to work for me, but thanks for including me.",
      "I won't be able to attend. Enjoy!"
    ]
  };

  // Load usage tracking
  useEffect(() => {
    const visits = parseInt(localStorage.getItem('excuse-tool-visits') || '0');
    setViewCount(visits + 1);
    localStorage.setItem('excuse-tool-visits', (visits + 1).toString());

    const history = JSON.parse(localStorage.getItem('excuse-history') || '[]');
    setExcuseHistory(history);
  }, []);

  // Check for recent decline with same person
  useEffect(() => {
    if (relationship && eventType) {
      const recent = excuseHistory.find(h => 
        h.relationship === relationship && 
        h.eventType.toLowerCase().includes(eventType.toLowerCase().split(' ')[0]) &&
        Date.now() - new Date(h.timestamp).getTime() < 30 * 24 * 60 * 60 * 1000 // 30 days
      );
      setRecentDecline(!!recent);
    }
  }, [relationship, eventType, excuseHistory]);

  // Theme-aware colors
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-gradient-to-br from-amber-50 to-orange-50',
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-amber-200',
    cardAlt: isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-amber-50 border-amber-200',
    
    input: isDark 
      ? 'bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:border-amber-500 focus:ring-amber-500/20'
      : 'bg-white border-amber-300 text-amber-900 placeholder:text-amber-400 focus:border-amber-600 focus:ring-amber-100',
    
    text: isDark ? 'text-zinc-50' : 'text-amber-900',
    textSecondary: isDark ? 'text-zinc-400' : 'text-amber-700',
    textMuted: isDark ? 'text-zinc-500' : 'text-amber-600',
    label: isDark ? 'text-zinc-300' : 'text-amber-800',
    
    accent: isDark ? 'text-amber-400' : 'text-amber-600',
    
    btnPrimary: isDark
      ? 'bg-amber-600 hover:bg-amber-700 text-white'
      : 'bg-amber-600 hover:bg-amber-700 text-white',
    btnSecondary: isDark
      ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-50'
      : 'bg-amber-100 hover:bg-amber-200 text-amber-900',
    btnOutline: isDark
      ? 'border-zinc-600 hover:border-zinc-500 text-zinc-300'
      : 'border-amber-300 hover:border-amber-400 text-amber-700',
    
    warningBox: isDark
      ? 'bg-red-900/20 border-red-700 text-red-200'
      : 'bg-red-50 border-red-300 text-red-800',
    infoBox: isDark
      ? 'bg-blue-900/20 border-blue-700 text-blue-200'
      : 'bg-blue-50 border-blue-200 text-blue-900',
    successBox: isDark
      ? 'bg-emerald-900/20 border-emerald-700 text-emerald-200'
      : 'bg-emerald-50 border-emerald-200 text-emerald-800',
    excuseBox: isDark
      ? 'bg-amber-900/20 border-amber-700'
      : 'bg-amber-50 border-amber-300',
  };

  const handleGenerate = async () => {
    if (!eventType.trim()) {
      setError('Please enter what you\'re declining');
      return;
    }

    if (!agreedToEthics) {
      setError('Please review and agree to the ethical guidelines');
      setShowEthicalCheck(true);
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('believable-excuse-generator', {
        eventType: eventType.trim(),
        relationship,
        noticeTime,
        tonePreference,
        culturalContext,
        cannotUse
      });
      setResults(data);
      setSelectedExcuse(0);

      // Track this excuse
      const newHistory = [{
        eventType: eventType.trim(),
        relationship,
        timestamp: new Date().toISOString()
      }, ...excuseHistory].slice(0, 20);
      setExcuseHistory(newHistory);
      localStorage.setItem('excuse-history', JSON.stringify(newHistory));
    } catch (err) {
      setError(err.message || 'Failed to generate excuses. Please try again.');
    }
  };

  const handleRefine = async (direction) => {
    if (!results) return;

    try {
      const data = await callToolEndpoint('believable-excuse-generator', {
        eventType: eventType.trim(),
        relationship,
        noticeTime,
        tonePreference,
        culturalContext,
        cannotUse,
        refineDirection: direction,
        currentExcuse: results.excuse_options[selectedExcuse].excuse_text
      });
      setResults(data);
    } catch (err) {
      setError('Failed to refine excuse. Please try again.');
    }
  };

  const handleReset = () => {
    setEventType('');
    setResults(null);
    setError('');
    setSelectedExcuse(0);
    setShowHonestAlternatives(true);
  };

  const proceedPastEthics = () => {
    setShowEthicalCheck(false);
    setAgreedToEthics(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Critical Ethical Check - Must See First */}
      {showEthicalCheck && (
        <div className={`${c.card} border-4 ${isDark ? 'border-red-700' : 'border-red-400'} rounded-xl shadow-lg p-8 transition-colors duration-200`}>
          <div className="flex items-start gap-4 mb-6">
            <span className="text-4xl flex-shrink-0">⚠️</span>
            <div>
              <h2 className={`text-2xl font-bold ${c.text} mb-2`}>Before You Continue: Read This Carefully</h2>
              <p className={`text-lg ${c.textSecondary} mb-4`}>
                This tool is designed to help you protect your boundaries and mental health in <strong>rare, specific situations</strong>.
              </p>
            </div>
          </div>

          {/* Prohibited Uses */}
          <div className={`${c.warningBox} border-l-4 rounded-r-lg p-5 mb-6`}>
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <span>🛡️</span>
              STRICTLY PROHIBITED USES
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✗</span>
                <span>Avoiding legal obligations (court dates, official appointments, legal responsibilities)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✗</span>
                <span>Breaking important professional commitments (major presentations, client meetings, critical deadlines)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✗</span>
                <span>Lying to romantic partners about infidelity or cheating</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✗</span>
                <span>Avoiding necessary medical appointments or treatment</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✗</span>
                <span>Creating alibis for illegal activities or harmful behavior</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-500 font-bold">✗</span>
                <span>Regular, habitual use to avoid all social interaction</span>
              </div>
            </div>
          </div>

          {/* Healthy Use Warning */}
          <div className={`${c.infoBox} border-l-4 rounded-r-lg p-5 mb-6`}>
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <span>❤️</span>
              Healthy Use Guidelines
            </h3>
            <div className="space-y-2 text-sm">
              <p>✓ This tool is for <strong>occasional use</strong> to protect boundaries and mental health</p>
              <p>✓ Using excuses regularly may indicate a need to practice direct boundary-setting</p>
              <p>✓ Consider therapy or boundary-setting resources if you visit frequently</p>
              <p>✓ Honesty is usually the healthier long-term choice in close relationships</p>
            </div>
          </div>

          {/* Frequency Warning */}
          {viewCount > 5 && (
            <div className={`${isDark ? 'bg-amber-900/20 border-amber-700' : 'bg-amber-50 border-amber-300'} border-l-4 rounded-r-lg p-5 mb-6`}>
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <span>📈</span>
                You've visited this tool {viewCount} times
              </h3>
              <p className="text-sm mb-3">
                Frequent use might indicate difficulty with direct boundary-setting. Consider these resources:
              </p>
              <div className="space-y-1 text-sm">
                <a href="https://www.psychologytoday.com/us/therapists" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 ${c.accent} hover:underline`}>
                  <span className="text-xs">🔗</span>
                  Find a therapist (Psychology Today)
                </a>
                <a href="https://www.betterhelp.com" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 ${c.accent} hover:underline`}>
                  <span className="text-xs">🔗</span>
                  Online therapy (BetterHelp)
                </a>
                <a href="https://www.nedratawwab.com/book" target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 ${c.accent} hover:underline`}>
                  <span className="text-xs">🔗</span>
                  "Set Boundaries, Find Peace" by Nedra Glover Tawwab
                </a>
              </div>
            </div>
          )}

          {/* Agreement */}
          <div className="space-y-4">
            <label className={`flex items-start gap-3 p-4 rounded-lg cursor-pointer border-2 transition-all ${
              agreedToEthics
                ? isDark ? 'bg-emerald-900/20 border-emerald-700' : 'bg-emerald-50 border-emerald-300'
                : isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-amber-300'
            }`}>
              <input
                type="checkbox"
                checked={agreedToEthics}
                onChange={(e) => setAgreedToEthics(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500 mt-0.5"
              />
              <div className="flex-1">
                <div className={`font-bold ${c.text} mb-1`}>I understand and agree:</div>
                <ul className={`text-sm ${c.textSecondary} space-y-1`}>
                  <li>• This is for occasional use to protect boundaries, not habitual deception</li>
                  <li>• I will not use this for prohibited purposes listed above</li>
                  <li>• I understand that honesty is healthier in close relationships</li>
                  <li>• Frequent excuse-making may indicate I need help with boundary-setting</li>
                </ul>
              </div>
            </label>

            <div className="flex gap-3">
              <button
                onClick={proceedPastEthics}
                disabled={!agreedToEthics}
                className={`flex-1 ${c.btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed font-medium py-3 px-6 rounded-lg transition-all`}
              >
                I Understand - Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Honest Alternatives Section - Show BEFORE excuse generator */}
      {!showEthicalCheck && showHonestAlternatives && (
        <div className={`${c.successBox} border-l-4 rounded-r-lg p-6 transition-colors duration-200`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">📖</span>
              <h3 className={`text-xl font-bold`}>Try Honest Boundary-Setting First</h3>
            </div>
            <button
              onClick={() => setShowHonestAlternatives(false)}
              className="text-sm underline opacity-75 hover:opacity-100"
            >
              Skip to excuses
            </button>
          </div>

          <p className="mb-4">
            <strong>Did you know?</strong> Most people respect a simple "no" more than you think. 
            Try these honest scripts first - they protect your privacy <em>and</em> preserve trust:
          </p>

          <div className="space-y-4">
            {/* Simple Decline */}
            <div>
              <h4 className="font-semibold mb-2">Simple Decline (No explanation needed)</h4>
              <div className="space-y-2">
                {honestAlternatives.general.map((script, idx) => (
                  <div key={idx} className={`p-3 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-white'} flex items-center justify-between`}>
                    <p className="text-sm flex-1">"{script}"</p>
                    <CopyBtn content={script} />
                  </div>
                ))}
              </div>
            </div>

            {/* With Boundary */}
            <div>
              <h4 className="font-semibold mb-2">If They Ask Why</h4>
              <div className="space-y-2">
                {honestAlternatives.withBoundary.map((script, idx) => (
                  <div key={idx} className={`p-3 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-white'} flex items-center justify-between`}>
                    <p className="text-sm flex-1">"{script}"</p>
                    <CopyBtn content={script} />
                  </div>
                ))}
              </div>
            </div>

            {/* Firm */}
            <div>
              <h4 className="font-semibold mb-2">Firm but Kind</h4>
              <div className="space-y-2">
                {honestAlternatives.firm.map((script, idx) => (
                  <div key={idx} className={`p-3 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-white'} flex items-center justify-between`}>
                    <p className="text-sm flex-1">"{script}"</p>
                    <CopyBtn content={script} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`mt-4 p-4 ${isDark ? 'bg-zinc-700' : 'bg-white'} rounded-lg`}>
            <p className="text-sm">
              <strong>💡 Tip:</strong> These honest scripts work in 90% of situations. You don't need an elaborate excuse - 
              most people will respect a simple, firm decline. Save excuses for situations where honesty could genuinely harm you or the relationship.
            </p>
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setShowHonestAlternatives(false)}
              className={`flex-1 ${c.btnPrimary} font-medium py-3 px-6 rounded-lg transition-all`}
            >
              Still Need an Excuse? Continue Below
            </button>
          </div>
        </div>
      )}

      {/* Recent Decline Warning */}
      {!showEthicalCheck && !showHonestAlternatives && recentDecline && (
        <div className={`${c.warningBox} border-l-4 rounded-r-lg p-5 transition-colors duration-200`}>
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 mt-0.5">⚠️</span>
            <div>
              <h3 className="font-bold mb-2">⚠️ Warning: Recent Decline Detected</h3>
              <p className="text-sm mb-2">
                You've recently declined a similar event with this type of relationship. 
                Using excuses repeatedly with the same person can damage trust.
              </p>
              <p className="text-sm font-semibold">
                Consider: Saying yes this time, being directly honest, or using one of the honest boundary scripts above.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Input Form - Only show after ethics agreement */}
      {!showEthicalCheck && !showHonestAlternatives && (
        <div className={`${c.card} border rounded-xl shadow-sm p-6 transition-colors duration-200`}>
          
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-3 rounded-lg ${isDark ? 'bg-amber-900/30' : 'bg-amber-100'}`}>
              <span className="text-xl">💬</span>
            </div>
            <div>
              <h2 className={`text-xl font-bold ${c.text}`}>Generate Excuse (Use Sparingly)</h2>
              <p className={`text-sm ${c.textMuted}`}>For rare situations where honest boundaries won't work</p>
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-6">
            
            {/* Event type */}
            <div>
              <label htmlFor="event-type" className={`block text-sm font-medium ${c.label} mb-2`}>
                What are you declining?
              </label>
              <input
                id="event-type"
                type="text"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                placeholder="e.g., dinner party, work event, family gathering"
                className={`w-full p-4 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200`}
                onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
              />
            </div>

            {/* Relationship */}
            <div>
              <label htmlFor="relationship" className={`block text-sm font-medium ${c.label} mb-2`}>
                Your relationship to this person
              </label>
              <select
                id="relationship"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200`}
              >
                {relationshipOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Notice time */}
            <div>
              <label htmlFor="notice-time" className={`block text-sm font-medium ${c.label} mb-2`}>
                How much notice are you giving?
              </label>
              <select
                id="notice-time"
                value={noticeTime}
                onChange={(e) => setNoticeTime(e.target.value)}
                className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200`}
              >
                {noticeOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {/* Tone */}
            <div>
              <label className={`block text-sm font-medium ${c.label} mb-3`}>
                Tone preference
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {toneOptions.map(tone => (
                  <button
                    key={tone}
                    onClick={() => setTonePreference(tone)}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      tonePreference === tone ? c.btnPrimary : c.btnSecondary
                    }`}
                  >
                    {tone}
                  </button>
                ))}
              </div>
            </div>

            {/* Cultural context */}
            <div>
              <label htmlFor="cultural-context" className={`block text-sm font-medium ${c.label} mb-2`}>
                Cultural context (affects formality and excuse norms)
              </label>
              <select
                id="cultural-context"
                value={culturalContext}
                onChange={(e) => setCulturalContext(e.target.value)}
                className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200`}
              >
                {culturalOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <p className={`text-xs ${c.textMuted} mt-1`}>
                Different cultures have different norms for declining invitations
              </p>
            </div>

            {/* Cannot use */}
            <div>
              <label className={`block text-sm font-medium ${c.label} mb-3`}>
                Excuses to avoid (prevents overuse)
              </label>
              <div className="space-y-2">
                {Object.entries({
                  work: 'Work excuse',
                  health: 'Health excuse',
                  family: 'Family excuse'
                }).map(([key, label]) => (
                  <label
                    key={key}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer ${isDark ? 'hover:bg-zinc-700' : 'hover:bg-amber-50'}`}
                  >
                    <input
                      type="checkbox"
                      checked={cannotUse[key]}
                      onChange={(e) => setCannotUse({ ...cannotUse, [key]: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className={`text-sm ${c.textSecondary}`}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading || !eventType.trim()}
                className={`flex-1 ${c.btnPrimary} disabled:opacity-50 font-medium py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <span className="animate-spin inline-block">⏳</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <span>💬</span>
                    Generate Excuses
                  </>
                )}
              </button>

              {results && (
                <button
                  onClick={handleReset}
                  className={`px-6 py-3 border-2 ${c.btnOutline} font-medium rounded-lg transition-all`}
                >
                  New
                </button>
              )}
            </div>

            {error && (
              <div className={`p-4 ${c.warningBox} border rounded-lg flex items-start gap-3`} role="alert">
                <span className="flex-shrink-0 mt-0.5">⚠️</span>
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results - Cultural notes and excuse options */}
      {results && !showEthicalCheck && !showHonestAlternatives && (
        <div className="space-y-6">
          
          {/* Cultural appropriateness note */}
          {results.cultural_notes && (
            <div className={`${c.infoBox} border-l-4 rounded-r-lg p-4`}>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <span>ℹ️</span>
                Cultural Considerations
              </h4>
              <p className="text-sm">{results.cultural_notes}</p>
            </div>
          )}

          {/* Excuse options */}
          <div className={`${c.card} border rounded-xl shadow-sm p-6`}>
            <h3 className={`text-lg font-bold ${c.text} mb-4`}>
              Your Excuse Options
            </h3>

            <div className="flex gap-2 mb-4">
              {results.excuse_options?.map((excuse, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedExcuse(idx)}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    selectedExcuse === idx ? c.btnPrimary : c.btnSecondary
                  }`}
                >
                  Option {idx + 1}
                  {excuse.believability_score && (
                    <span className="ml-2 text-xs opacity-75">
                      {excuse.believability_score}/10
                    </span>
                  )}
                </button>
              ))}
            </div>

            {results.excuse_options?.[selectedExcuse] && (
              <div className="space-y-4">
                <div className={`${c.excuseBox} border-2 rounded-xl p-6`}>
                  <div className="flex justify-between mb-3">
                    <div className={`text-xs font-semibold uppercase ${c.textMuted}`}>
                      {results.excuse_options[selectedExcuse].excuse_category}
                    </div>
                    <CopyBtn content={results.excuse_options[selectedExcuse].excuse_text} />
                  </div>
                  
                  <p className={`text-lg ${c.text}`}>
                    {results.excuse_options[selectedExcuse].excuse_text}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRefine('more_specific')}
                    disabled={loading}
                    className={`flex-1 ${c.btnSecondary} py-2 rounded-lg`}
                  >
                    <span className="inline mr-2">🔄</span>
                    More specific
                  </button>
                  <button
                    onClick={() => handleRefine('simpler')}
                    disabled={loading}
                    className={`flex-1 ${c.btnSecondary} py-2 rounded-lg`}
                  >
                    <span className="inline mr-2">🔄</span>
                    Simpler
                  </button>
                </div>

                {results.excuse_options[selectedExcuse].supporting_details && (
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-amber-50'}`}>
                    <h4 className={`text-sm font-semibold ${c.text} mb-2`}>If asked for details:</h4>
                    <p className={`text-sm ${c.textSecondary}`}>
                      {results.excuse_options[selectedExcuse].supporting_details}
                    </p>
                  </div>
                )}

                {results.excuse_options[selectedExcuse].how_to_sell_it && (
                  <div className={`p-4 rounded-lg border ${isDark ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'}`}>
                    <h4 className={`text-sm font-semibold ${c.text} mb-2`}>How to deliver:</h4>
                    <p className={`text-sm ${c.textSecondary}`}>
                      {results.excuse_options[selectedExcuse].how_to_sell_it}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Additional guidance grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.timing_advice && (
              <div className={`${c.card} border rounded-xl p-4`}>
                <h4 className={`text-sm font-semibold ${c.text} mb-2 flex items-center gap-2`}>
                  <span>📅</span>
                  Timing
                </h4>
                <p className={`text-sm ${c.textSecondary}`}>{results.timing_advice}</p>
              </div>
            )}

            {results.apology_calibration && (
              <div className={`${c.card} border rounded-xl p-4`}>
                <h4 className={`text-sm font-semibold ${c.text} mb-2 flex items-center gap-2`}>
                  <span>❤️</span>
                  Apology Level
                </h4>
                <p className={`text-sm ${c.textSecondary}`}>{results.apology_calibration}</p>
              </div>
            )}

            {results.relationship_preservation && (
              <div className={`${c.card} border rounded-xl p-4`}>
                <h4 className={`text-sm font-semibold ${c.text} mb-2 flex items-center gap-2`}>
                  <span>👥</span>
                  Preserve Relationship
                </h4>
                <p className={`text-sm ${c.textSecondary}`}>{results.relationship_preservation}</p>
              </div>
            )}

            {results.reschedule_offer && (
              <div className={`${c.card} border rounded-xl p-4`}>
                <h4 className={`text-sm font-semibold ${c.text} mb-2 flex items-center gap-2`}>
                  <span>🔄</span>
                  Reschedule?
                </h4>
                <p className={`text-sm ${c.textSecondary}`}>{results.reschedule_offer}</p>
              </div>
            )}
          </div>

          {/* Final reminder */}
          <div className={`${c.successBox} border-l-4 rounded-r-lg p-4`}>
            <p className="text-sm flex items-start gap-2">
              <span className="mt-0.5 flex-shrink-0">❤️</span>
              <span>
                <strong>Remember:</strong> Use this excuse sparingly. Next time, try honest boundary-setting first. 
                Your relationships will be healthier when built on trust, not excuses.
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BelievableExcuseGenerator;
