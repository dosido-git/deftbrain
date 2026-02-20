import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Send, Scale, Search, ShieldCheck, Zap, Loader2, AlertCircle,
  Trophy, RotateCcw, Share2, MessageCircle, ArrowRight,
  CheckCircle, Users, X, Copy, Printer } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

// ════════════════════════════════════════════════════════
// THE FINAL WORD — Settle arguments with authority
// ════════════════════════════════════════════════════════

const TRIVIA_CATEGORIES = [
  { id: 'general', label: 'General Knowledge', emoji: '🧠' },
  { id: 'science', label: 'Science', emoji: '🔬' },
  { id: 'history', label: 'History', emoji: '🏛️' },
  { id: 'geography', label: 'Geography', emoji: '🌍' },
  { id: 'pop_culture', label: 'Pop Culture', emoji: '🎬' },
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'food', label: 'Food & Drink', emoji: '🍕' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'technology', label: 'Technology', emoji: '💻' },
];

const MODES = [
  { id: 'question', label: 'Quick Answer', icon: Search, desc: 'Ask anything', color: 'blue' },
  { id: 'dispute', label: 'Settle It', icon: Scale, desc: 'Two sides, one verdict', color: 'amber' },
  { id: 'factcheck', label: 'Fact Check', icon: ShieldCheck, desc: 'True or false?', color: 'emerald' },
  { id: 'trivia', label: 'Trivia Night', icon: Zap, desc: 'Quick-fire rounds', color: 'purple' },
];

const TheFinalWord = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // ─── Theme ───
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-gradient-to-br from-slate-50 to-amber-50/30',
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-slate-200',
    cardAlt: isDark ? 'bg-zinc-700/50 border-zinc-600' : 'bg-slate-50 border-slate-200',
    input: isDark
      ? 'bg-zinc-900 border-zinc-600 text-zinc-50 placeholder:text-zinc-500 focus:border-amber-500 focus:ring-amber-500/20'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-amber-100',
    text: isDark ? 'text-zinc-50' : 'text-slate-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-slate-600',
    textMuted: isDark ? 'text-zinc-500' : 'text-slate-400',
    label: isDark ? 'text-zinc-200' : 'text-slate-700',
    btnPrimary: isDark
      ? 'bg-amber-600 hover:bg-amber-500 text-white'
      : 'bg-amber-500 hover:bg-amber-600 text-white',
    btnSecondary: isDark
      ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200'
      : 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    accent: isDark ? 'text-amber-400' : 'text-amber-600',
    border: isDark ? 'border-zinc-700' : 'border-slate-200',
    verdictBg: isDark ? 'bg-zinc-800' : 'bg-white',
    success: isDark ? 'text-green-400' : 'text-green-600',
    error: isDark ? 'text-red-400' : 'text-red-600',
  };

  // ─── State ───
  const [mode, setMode] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Question mode
  const [question, setQuestion] = useState('');

  // Dispute mode
  const [personA, setPersonA] = useState('');
  const [personB, setPersonB] = useState('');
  const [claimA, setClaimA] = useState('');
  const [claimB, setClaimB] = useState('');
  const [disputeContext, setDisputeContext] = useState('');

  // Fact-check mode
  const [claim, setClaim] = useState('');

  // Trivia mode
  const [triviaCategory, setTriviaCategory] = useState('general');
  const [triviaDifficulty, setTriviaDifficulty] = useState('medium');
  const [triviaQuestion, setTriviaQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [triviaRevealed, setTriviaRevealed] = useState(false);
  const [previousQuestions, setPreviousQuestions] = useState([]);

  // Trivia teams
  const [triviaSetup, setTriviaSetup] = useState(true); // show setup screen
  const [teams, setTeams] = useState([
    { name: 'Team 1', score: 0, streak: 0 },
    { name: 'Team 2', score: 0, streak: 0 },
  ]);
  const [activeTeamIdx, setActiveTeamIdx] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);

  // Voice
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef(null);

  // "Actually..." challenge
  const [showChallenge, setShowChallenge] = useState(false);
  const [challengeText, setChallengeText] = useState('');
  const [challengeResult, setChallengeResult] = useState(null);

  // ─── Voice Setup ───
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(r => r[0].transcript)
          .join('');
        setVoiceTranscript(transcript);

        if (event.results[0].isFinal) {
          // Auto-fill the active input
          if (mode === 'question') setQuestion(transcript);
          else if (mode === 'factcheck') setClaim(transcript);
          else if (mode === 'dispute') {
            if (!claimA.trim()) setClaimA(transcript);
            else if (!claimB.trim()) setClaimB(transcript);
          }
          setIsListening(false);
          setVoiceTranscript('');
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceTranscript('');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [mode, claimA, claimB]);

  const toggleVoice = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setVoiceTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  // ─── Submit Handlers ───
  const handleSubmit = async () => {
    setError('');
    setResult(null);
    setShowChallenge(false);
    setChallengeResult(null);

    let payload = { mode };

    if (mode === 'question') {
      payload.question = question.trim();
    } else if (mode === 'dispute') {
      payload.claimA = claimA.trim();
      payload.claimB = claimB.trim();
      payload.personA = personA.trim() || undefined;
      payload.personB = personB.trim() || undefined;
      payload.context = disputeContext.trim() || undefined;
    } else if (mode === 'factcheck') {
      payload.claim = claim.trim();
    }

    try {
      const data = await callToolEndpoint('the-final-word', payload);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to get the verdict');
    }
  };

  const handleTrivia = async () => {
    setError('');
    setTriviaQuestion(null);
    setSelectedAnswer(null);
    setTriviaRevealed(false);

    try {
      const data = await callToolEndpoint('the-final-word', {
        mode: 'trivia',
        category: TRIVIA_CATEGORIES.find(c => c.id === triviaCategory)?.label || 'General Knowledge',
        difficulty: triviaDifficulty,
        previousQuestions,
      });
      setTriviaQuestion(data);
    } catch (err) {
      setError(err.message || 'Failed to generate question');
    }
  };

  const handleTriviaAnswer = (idx) => {
    if (triviaRevealed) return;
    setSelectedAnswer(idx);
    setTriviaRevealed(true);
    const isCorrect = idx === triviaQuestion.correct_index;
    setTeams(prev => prev.map((team, i) => {
      if (i !== activeTeamIdx) return team;
      return {
        ...team,
        score: team.score + (isCorrect ? 1 : 0),
        streak: isCorrect ? team.streak + 1 : 0,
      };
    }));
    setQuestionCount(prev => prev + 1);
    setPreviousQuestions(prev => [...prev.slice(-15), triviaQuestion.question]);
  };

  const advanceTrivia = () => {
    setActiveTeamIdx((activeTeamIdx + 1) % teams.length);
    handleTrivia();
  };

  const updateTeamName = (idx, name) => {
    setTeams(prev => prev.map((t, i) => i === idx ? { ...t, name } : t));
  };

  const addTeam = () => {
    if (teams.length >= 6) return;
    setTeams(prev => [...prev, { name: `Team ${prev.length + 1}`, score: 0, streak: 0 }]);
  };

  const removeTeam = (idx) => {
    if (teams.length <= 1) return;
    setTeams(prev => prev.filter((_, i) => i !== idx));
    if (activeTeamIdx >= teams.length - 1) setActiveTeamIdx(0);
  };

  const handleChallenge = async () => {
    if (!challengeText.trim()) return;
    setChallengeResult(null);

    const questionSummary = result
      ? `Q: ${result.answer || result.ruling_display || ''} — Explanation: ${result.explanation || ''}`
      : `Q: ${triviaQuestion?.question || ''} — Answer: ${triviaQuestion?.correct_answer || ''}`;

    try {
      const data = await callToolEndpoint('the-final-word', {
        mode: 'trivia-check',
        originalQuestion: questionSummary,
        userChallenge: challengeText.trim(),
      });
      setChallengeResult(data);
    } catch (err) {
      setError(err.message || 'Failed to review challenge');
    }
  };

  const getVerdictText = () => {
    if (result?._mode === 'question') {
      return `⚖️ The Final Word: ${result.answer}\n\n${result.explanation}`;
    } else if (result?._mode === 'dispute') {
      return `⚖️ The Final Word: ${result.verdict_headline}\n\n${result.explanation}`;
    } else if (result?._mode === 'factcheck') {
      return `⚖️ ${result.ruling_display}\n\n${result.explanation}`;
    }
    return '';
  };

  const shareVerdict = async () => {
    const text = getVerdictText();
    if (navigator.share) {
      try {
        await navigator.share({ title: 'The Final Word', text });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // user cancelled
      }
    }
    // Fallback: copy to clipboard
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyVerdictToClipboard = () => {
    const text = getVerdictText();
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const printVerdict = () => {
    window.print();
  };

  const resetAll = () => {
    setResult(null);
    setError('');
    setShowChallenge(false);
    setChallengeResult(null);
    setChallengeText('');
    setQuestion('');
    setClaim('');
    setClaimA('');
    setClaimB('');
    setPersonA('');
    setPersonB('');
    setDisputeContext('');
  };

  // ─── Confidence / Ruling Colors ───
  const getConfidenceStyle = (confidence) => {
    const styles = {
      certain: { bg: isDark ? 'bg-green-900/30' : 'bg-green-100', text: isDark ? 'text-green-300' : 'text-green-800', width: '100%' },
      high: { bg: isDark ? 'bg-emerald-900/30' : 'bg-emerald-100', text: isDark ? 'text-emerald-300' : 'text-emerald-800', width: '85%' },
      moderate: { bg: isDark ? 'bg-amber-900/30' : 'bg-amber-100', text: isDark ? 'text-amber-300' : 'text-amber-800', width: '60%' },
      low: { bg: isDark ? 'bg-orange-900/30' : 'bg-orange-100', text: isDark ? 'text-orange-300' : 'text-orange-800', width: '35%' },
      uncertain: { bg: isDark ? 'bg-red-900/30' : 'bg-red-100', text: isDark ? 'text-red-300' : 'text-red-800', width: '15%' },
    };
    return styles[confidence] || styles.moderate;
  };

  const getRulingStyle = (ruling) => {
    if (['true', 'mostly_true'].includes(ruling)) return isDark ? 'text-green-400 bg-green-900/20' : 'text-green-700 bg-green-50';
    if (['false', 'mostly_false'].includes(ruling)) return isDark ? 'text-red-400 bg-red-900/20' : 'text-red-700 bg-red-50';
    if (ruling === 'misleading') return isDark ? 'text-amber-400 bg-amber-900/20' : 'text-amber-700 bg-amber-50';
    return isDark ? 'text-blue-400 bg-blue-900/20' : 'text-blue-700 bg-blue-50';
  };

  // ─── Voice Button Component ───
  const VoiceButton = () => {
    if (!voiceSupported) return null;
    return (
      <button
        onClick={toggleVoice}
        className={`p-3 rounded-xl border-2 transition-all ${
          isListening
            ? 'border-red-500 bg-red-500/10 text-red-500 animate-pulse'
            : isDark
              ? 'border-zinc-600 text-zinc-400 hover:border-amber-500 hover:text-amber-400'
              : 'border-slate-300 text-slate-400 hover:border-amber-500 hover:text-amber-500'
        }`}
        title={isListening ? 'Stop listening' : 'Speak your question'}
      >
        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>
    );
  };

  // ════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════
  return (
    <div className={`min-h-screen ${c.bg} py-8 px-4`}>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="text-center space-y-2 mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 ${
            isDark ? 'bg-amber-900/30 border border-amber-700/50' : 'bg-amber-100 border border-amber-200'
          }`}>
            <Scale className={`w-8 h-8 ${c.accent}`} />
          </div>
          <h1 className={`text-3xl font-black tracking-tight ${c.text}`}>
            The Final Word
          </h1>
          <p className={`text-sm ${c.textMuted}`}>
            Arguments settled. Facts checked. No appeals.
          </p>
        </div>

        {/* ── Mode Selection ── */}
        {!result && !triviaQuestion && (
          <div className={`${c.card} border rounded-2xl p-5 space-y-4`}>
            <div className="grid grid-cols-2 gap-3">
              {MODES.map(m => {
                const Icon = m.icon;
                const isActive = mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => { setMode(m.id); setError(''); setResult(null); }}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                      isActive
                        ? isDark
                          ? 'border-amber-500 bg-amber-900/10 shadow-sm'
                          : 'border-amber-400 bg-amber-50 shadow-sm'
                        : isDark
                          ? 'border-zinc-700 hover:border-zinc-500 bg-zinc-800'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isActive ? c.accent : c.textMuted}`} />
                    <div className={`text-sm font-bold ${isActive ? c.text : c.textSecondary}`}>{m.label}</div>
                    <div className={`text-xs mt-0.5 ${c.textMuted}`}>{m.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* ── Voice Transcript ── */}
            {isListening && (
              <div className={`p-3 rounded-lg border-2 border-red-500/30 ${isDark ? 'bg-red-900/10' : 'bg-red-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                    Listening...
                  </span>
                </div>
                {voiceTranscript && (
                  <p className={`text-sm italic ${c.textSecondary}`}>"{voiceTranscript}"</p>
                )}
              </div>
            )}

            {/* ════ QUICK QUESTION INPUT ════ */}
            {mode === 'question' && (
              <div className="space-y-3">
                <label className={`block text-xs font-bold uppercase tracking-wider ${c.textMuted}`}>
                  What do you want to know?
                </label>
                <div className="flex gap-2">
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit()}
                    placeholder="Who won the 1994 World Cup?"
                    className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm transition-all focus:outline-none focus:ring-2 ${c.input}`}
                  />
                  <VoiceButton />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !question.trim()}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 ${c.btnPrimary}`}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {loading ? 'Deliberating...' : 'Get The Final Word'}
                </button>
              </div>
            )}

            {/* ════ DISPUTE INPUT ════ */}
            {mode === 'dispute' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${c.textMuted}`}>
                      Name (optional)
                    </label>
                    <input
                      value={personA}
                      onChange={(e) => setPersonA(e.target.value)}
                      placeholder="Person A"
                      className={`w-full px-3 py-2 rounded-lg border-2 text-sm transition-all focus:outline-none focus:ring-2 ${c.input}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${c.textMuted}`}>
                      Name (optional)
                    </label>
                    <input
                      value={personB}
                      onChange={(e) => setPersonB(e.target.value)}
                      placeholder="Person B"
                      className={`w-full px-3 py-2 rounded-lg border-2 text-sm transition-all focus:outline-none focus:ring-2 ${c.input}`}
                    />
                  </div>
                </div>

                <div className="relative">
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${c.textMuted}`}>
                    {personA || 'Person A'} says...
                  </label>
                  <div className="flex gap-2">
                    <textarea
                      value={claimA}
                      onChange={(e) => setClaimA(e.target.value)}
                      placeholder='"The Great Wall of China is visible from space"'
                      rows={2}
                      className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm transition-all focus:outline-none focus:ring-2 resize-none ${c.input}`}
                    />
                    <VoiceButton />
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                    isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'
                  }`}>VS</div>
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${c.textMuted}`}>
                    {personB || 'Person B'} says...
                  </label>
                  <div className="flex gap-2">
                    <textarea
                      value={claimB}
                      onChange={(e) => setClaimB(e.target.value)}
                      placeholder="No way, that is totally a myth"
                      rows={2}
                      className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm transition-all focus:outline-none focus:ring-2 resize-none ${c.input}`}
                    />
                    <VoiceButton />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${c.textMuted}`}>
                    Context (optional)
                  </label>
                  <input
                    value={disputeContext}
                    onChange={(e) => setDisputeContext(e.target.value)}
                    placeholder="Any extra context about the argument..."
                    className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm transition-all focus:outline-none focus:ring-2 ${c.input}`}
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || !claimA.trim() || !claimB.trim()}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 ${c.btnPrimary}`}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
                  {loading ? 'Reviewing evidence...' : 'Deliver the Verdict'}
                </button>
              </div>
            )}

            {/* ════ FACT CHECK INPUT ════ */}
            {mode === 'factcheck' && (
              <div className="space-y-3">
                <label className={`block text-xs font-bold uppercase tracking-wider ${c.textMuted}`}>
                  What claim do you want to check?
                </label>
                <div className="flex gap-2">
                  <textarea
                    value={claim}
                    onChange={(e) => setClaim(e.target.value)}
                    placeholder="Humans only use 10% of their brains"
                    rows={2}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm transition-all focus:outline-none focus:ring-2 resize-none ${c.input}`}
                  />
                  <VoiceButton />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !claim.trim()}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 ${c.btnPrimary}`}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  {loading ? 'Fact-checking...' : 'Check This Claim'}
                </button>
              </div>
            )}

            {/* ════ TRIVIA INPUT ════ */}
            {mode === 'trivia' && (triviaSetup || (!triviaQuestion && loading)) && (
              <div className="space-y-4">
                {/* Team Setup */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${c.textMuted}`}>
                    Players / Teams
                  </label>
                  <div className="space-y-2">
                    {teams.map((team, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                          isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'
                        }`}>{idx + 1}</div>
                        <input
                          value={team.name}
                          onChange={(e) => updateTeamName(idx, e.target.value)}
                          placeholder={`Player/Team ${idx + 1}`}
                          className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm transition-all focus:outline-none focus:ring-2 ${c.input}`}
                        />
                        {teams.length > 1 && (
                          <button
                            onClick={() => removeTeam(idx)}
                            className={`p-1.5 rounded-lg transition-all ${isDark ? 'text-zinc-500 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {teams.length < 6 && (
                    <button
                      onClick={addTeam}
                      className={`mt-2 text-xs font-semibold flex items-center gap-1 ${c.accent} hover:underline`}
                    >
                      + Add player/team
                    </button>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${c.textMuted}`}>
                    Category
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TRIVIA_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setTriviaCategory(cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                          triviaCategory === cat.id
                            ? isDark
                              ? 'border-purple-500 bg-purple-900/20 text-purple-300'
                              : 'border-purple-400 bg-purple-50 text-purple-700'
                            : isDark
                              ? 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                              : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {cat.emoji} {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${c.textMuted}`}>
                    Difficulty
                  </label>
                  <div className="flex gap-2">
                    {['easy', 'medium', 'hard'].map(d => (
                      <button
                        key={d}
                        onClick={() => setTriviaDifficulty(d)}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                          triviaDifficulty === d
                            ? isDark
                              ? 'border-purple-500 bg-purple-900/20 text-purple-300'
                              : 'border-purple-400 bg-purple-50 text-purple-700'
                            : isDark
                              ? 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                              : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => { setTriviaSetup(false); handleTrivia(); }}
                  disabled={loading || teams.every(t => !t.name.trim())}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 ${
                    isDark
                      ? 'bg-purple-600 hover:bg-purple-500 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {loading ? 'Generating...' : 'Start Trivia Night'}
                </button>
              </div>
            )}

            {/* ── Error ── */}
            {error && (
              <div className={`p-3 rounded-xl border flex items-start gap-2 ${
                isDark ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════
             VERDICT CARDS — Results Display
        ════════════════════════════════════════════ */}

        {/* ── Quick Question Result ── */}
        {result && result._mode === 'question' && (
          <div className={`rounded-2xl overflow-hidden border-2 shadow-lg ${
            isDark ? 'border-amber-700/50 bg-zinc-800' : 'border-amber-300 bg-white'
          }`}>
            {/* Header */}
            <div className={`px-6 py-4 ${isDark ? 'bg-amber-900/20' : 'bg-amber-50'} border-b ${c.border}`}>
              <div className="flex items-center gap-2 mb-1">
                <Scale className={`w-4 h-4 ${c.accent}`} />
                <span className={`text-xs font-black uppercase tracking-widest ${c.accent}`}>The Final Word</span>
                {result.category && (
                  <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {result.category}
                  </span>
                )}
              </div>
            </div>

            {/* Main Answer */}
            <div className="px-6 py-5">
              <h2 className={`text-xl font-black leading-snug mb-4 ${c.text}`}>
                {result.answer}
              </h2>

              {/* Confidence Bar */}
              {result.confidence && (() => {
                const style = getConfidenceStyle(result.confidence);
                return (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-bold uppercase tracking-wider ${c.textMuted}`}>Confidence</span>
                      <span className={`text-xs font-bold uppercase tracking-wider ${style.text}`}>{result.confidence}</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-zinc-700' : 'bg-slate-100'}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          result.confidence === 'certain' ? 'bg-green-500' :
                          result.confidence === 'high' ? 'bg-emerald-500' :
                          result.confidence === 'moderate' ? 'bg-amber-500' :
                          result.confidence === 'low' ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: style.width }}
                      />
                    </div>
                  </div>
                );
              })()}

              <p className={`text-sm leading-relaxed mb-4 ${c.textSecondary}`}>{result.explanation}</p>

              {/* Supporting Facts */}
              {result.supporting_facts && result.supporting_facts.length > 0 && (
                <div className={`p-3 rounded-xl border ${c.cardAlt} mb-3`}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${c.textMuted}`}>Key Facts</p>
                  {result.supporting_facts.map((fact, i) => (
                    <p key={i} className={`text-sm ${c.textSecondary} mb-1`}>• {fact}</p>
                  ))}
                </div>
              )}

              {/* Misconception */}
              {result.common_misconception && (
                <div className={`p-3 rounded-xl border ${
                  isDark ? 'bg-amber-900/10 border-amber-800/50' : 'bg-amber-50 border-amber-200'
                }`}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${c.accent}`}>Common Misconception</p>
                  <p className={`text-sm ${c.textSecondary}`}>{result.common_misconception}</p>
                </div>
              )}

              {/* Fun Extra */}
              {result.fun_extra && (
                <div className={`mt-3 p-3 rounded-xl border ${c.cardAlt}`}>
                  <p className={`text-xs font-bold mb-1 ${c.accent}`}>💡 Bonus</p>
                  <p className={`text-sm ${c.textSecondary}`}>{result.fun_extra}</p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className={`px-6 py-3 border-t flex items-center justify-between ${c.border}`}>
              <div className="flex gap-1.5">
                <button onClick={shareVerdict} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${c.btnSecondary}`}>
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                <button onClick={copyVerdictToClipboard} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${c.btnSecondary}`}>
                  {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={printVerdict} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${c.btnSecondary}`}>
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  onClick={() => setShowChallenge(!showChallenge)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${c.btnSecondary}`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Actually...
                </button>
              </div>
              <button onClick={resetAll} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${c.btnSecondary}`}>
                <RotateCcw className="w-3.5 h-3.5" />
                New Question
              </button>
            </div>
          </div>
        )}

        {/* ── Dispute Result ── */}
        {result && result._mode === 'dispute' && (
          <div className={`rounded-2xl overflow-hidden border-2 shadow-lg ${
            isDark ? 'border-amber-700/50 bg-zinc-800' : 'border-amber-300 bg-white'
          }`}>
            {/* Verdict Headline */}
            <div className={`px-6 py-5 text-center ${
              isDark ? 'bg-gradient-to-r from-amber-900/30 to-zinc-800' : 'bg-gradient-to-r from-amber-50 to-amber-100'
            }`}>
              <p className={`text-xs font-black uppercase tracking-widest mb-2 ${c.accent}`}>⚖️ The Verdict</p>
              <h2 className={`text-2xl font-black leading-snug ${c.text}`}>
                {result.verdict_headline}
              </h2>
            </div>

            {/* Score Cards */}
            {result.score && (
              <div className="grid grid-cols-2 gap-0 border-t border-b" style={{ borderColor: isDark ? '#3f3f46' : '#e2e8f0' }}>
                {[result.score.person_a, result.score.person_b].map((person, i) => {
                  const isWinner = result.winner_name === person?.name;
                  return (
                    <div key={i} className={`p-4 ${i === 0 ? `border-r ${c.border}` : ''} ${
                      isWinner
                        ? isDark ? 'bg-green-900/10' : 'bg-green-50/50'
                        : ''
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        {isWinner && <Trophy className="w-4 h-4 text-amber-500" />}
                        <p className={`text-sm font-bold ${c.text}`}>{person?.name}</p>
                      </div>
                      <div className={`text-3xl font-black mb-2 ${
                        (person?.accuracy || 0) >= 70 ? c.success :
                        (person?.accuracy || 0) >= 40 ? c.accent : c.error
                      }`}>
                        {person?.accuracy ?? '?'}%
                      </div>
                      {person?.what_they_got_right && (
                        <p className={`text-xs mb-1 ${c.textSecondary}`}>
                          <span className={c.success}>✓</span> {person.what_they_got_right}
                        </p>
                      )}
                      {person?.what_they_got_wrong && (
                        <p className={`text-xs ${c.textMuted}`}>
                          <span className={c.error}>✗</span> {person.what_they_got_wrong}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="px-6 py-4 space-y-3">
              <p className={`text-sm leading-relaxed ${c.textSecondary}`}>{result.explanation}</p>

              {result.the_actual_answer && (
                <div className={`p-3 rounded-xl border ${c.cardAlt}`}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${c.accent}`}>The Actual Answer</p>
                  <p className={`text-sm font-semibold ${c.text}`}>{result.the_actual_answer}</p>
                </div>
              )}

              {result.time_sensitive && result.how_to_verify && (
                <div className={`p-3 rounded-xl border ${
                  isDark ? 'bg-blue-900/10 border-blue-800/50' : 'bg-blue-50 border-blue-200'
                }`}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    📡 This changes over time — verify live
                  </p>
                  <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>{result.how_to_verify}</p>
                </div>
              )}

              {result.settlement_suggestion && (
                <div className={`p-3 rounded-xl ${isDark ? 'bg-purple-900/10 border border-purple-800/50' : 'bg-purple-50 border border-purple-200'}`}>
                  <p className={`text-sm italic ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                    🤝 {result.settlement_suggestion}
                  </p>
                </div>
              )}
            </div>

            <div className={`px-6 py-3 border-t flex items-center justify-between ${c.border}`}>
              <div className="flex gap-1.5">
                <button onClick={shareVerdict} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${c.btnSecondary}`}>
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                <button onClick={copyVerdictToClipboard} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${c.btnSecondary}`}>
                  {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={printVerdict} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${c.btnSecondary}`}>
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button onClick={() => setShowChallenge(!showChallenge)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${c.btnSecondary}`}>
                  <MessageCircle className="w-3.5 h-3.5" /> Actually...
                </button>
              </div>
              <button onClick={resetAll} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${c.btnSecondary}`}>
                <RotateCcw className="w-3.5 h-3.5" /> New Dispute
              </button>
            </div>
          </div>
        )}

        {/* ── Fact Check Result ── */}
        {result && result._mode === 'factcheck' && (
          <div className={`rounded-2xl overflow-hidden border-2 shadow-lg ${
            isDark ? 'border-amber-700/50 bg-zinc-800' : 'border-amber-300 bg-white'
          }`}>
            {/* Big Ruling */}
            <div className={`px-6 py-6 text-center ${getRulingStyle(result.ruling)}`}>
              <p className={`text-xs font-black uppercase tracking-widest mb-2 ${c.textMuted}`}>Ruling</p>
              <h2 className="text-3xl font-black tracking-tight">
                {result.ruling_display}
              </h2>
            </div>

            <div className="px-6 py-4 space-y-3">
              {/* Confidence */}
              {result.confidence && (() => {
                const style = getConfidenceStyle(result.confidence);
                return (
                  <div className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold uppercase tracking-wider ${c.textMuted}`}>Confidence</span>
                      <span className={`text-xs font-bold ${style.text}`}>{result.confidence}</span>
                    </div>
                    <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-700' : 'bg-slate-100'}`}>
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          result.confidence === 'certain' ? 'bg-green-500' :
                          result.confidence === 'high' ? 'bg-emerald-500' :
                          result.confidence === 'moderate' ? 'bg-amber-500' : 'bg-orange-500'
                        }`}
                        style={{ width: style.width }}
                      />
                    </div>
                  </div>
                );
              })()}

              <p className={`text-sm leading-relaxed ${c.textSecondary}`}>{result.explanation}</p>

              {result.what_is_true && (
                <div className={`p-3 rounded-xl border ${c.cardAlt}`}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${c.accent}`}>What's Actually True</p>
                  <p className={`text-sm ${c.text}`}>{result.what_is_true}</p>
                </div>
              )}

              {result.the_nuance && (
                <div className={`p-3 rounded-xl border ${c.cardAlt}`}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${c.textMuted}`}>The Nuance</p>
                  <p className={`text-sm ${c.textSecondary}`}>{result.the_nuance}</p>
                </div>
              )}

              {result.origin_of_myth && (
                <div className={`p-3 rounded-xl ${isDark ? 'bg-purple-900/10 border border-purple-800/50' : 'bg-purple-50 border border-purple-200'}`}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Where This Myth Started</p>
                  <p className={`text-sm ${isDark ? 'text-purple-200' : 'text-purple-700'}`}>{result.origin_of_myth}</p>
                </div>
              )}
            </div>

            <div className={`px-6 py-3 border-t flex items-center justify-between ${c.border}`}>
              <div className="flex gap-1.5">
                <button onClick={shareVerdict} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${c.btnSecondary}`}>
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                <button onClick={copyVerdictToClipboard} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${c.btnSecondary}`}>
                  {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={printVerdict} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${c.btnSecondary}`}>
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button onClick={() => setShowChallenge(!showChallenge)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${c.btnSecondary}`}>
                  <MessageCircle className="w-3.5 h-3.5" /> Actually...
                </button>
              </div>
              <button onClick={resetAll} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${c.btnSecondary}`}>
                <RotateCcw className="w-3.5 h-3.5" /> New Claim
              </button>
            </div>
          </div>
        )}

        {/* ── Trivia Question Card ── */}
        {triviaQuestion && (
          <div className={`rounded-2xl overflow-hidden border-2 shadow-lg ${
            isDark ? 'border-purple-700/50 bg-zinc-800' : 'border-purple-300 bg-white'
          }`}>
            {/* Header with turn indicator */}
            <div className={`px-6 py-4 ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'} border-b ${c.border}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                  {triviaQuestion.category_label || 'Trivia'}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-slate-100 text-slate-600'
                }`}>
                  Q{questionCount + (triviaRevealed ? 0 : 1)} · {triviaQuestion.difficulty_actual || triviaDifficulty}
                </span>
              </div>
              {teams.length > 1 && (
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                  isDark ? 'bg-purple-900/30' : 'bg-purple-100'
                }`}>
                  <Users className={`w-3.5 h-3.5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  <span className={`text-sm font-bold ${isDark ? 'text-purple-200' : 'text-purple-800'}`}>
                    {teams[activeTeamIdx]?.name || 'Team'}&apos;s turn
                  </span>
                </div>
              )}
            </div>

            {/* Scoreboard */}
            {teams.length > 1 && (
              <div className={`px-6 py-2 border-b ${c.border} flex gap-2 overflow-x-auto`}>
                {teams.map((team, idx) => (
                  <div key={idx} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                    idx === activeTeamIdx && !triviaRevealed
                      ? isDark ? 'bg-purple-900/20 border border-purple-700 text-purple-300' : 'bg-purple-50 border border-purple-300 text-purple-700'
                      : isDark ? 'bg-zinc-700/50 text-zinc-300' : 'bg-slate-50 text-slate-600'
                  }`}>
                    <span>{team.name}</span>
                    <span className={`font-black ${c.accent}`}>{team.score}</span>
                    {team.streak >= 3 && <span>🔥{team.streak}</span>}
                  </div>
                ))}
              </div>
            )}

            <div className="px-6 py-5">
              <h3 className={`text-lg font-bold mb-5 ${c.text}`}>{triviaQuestion.question}</h3>

              <div className="space-y-2">
                {triviaQuestion.options?.map((option, idx) => {
                  const isSelected = selectedAnswer === idx;
                  const isCorrect = idx === triviaQuestion.correct_index;
                  const revealed = triviaRevealed;

                  let optionStyle = isDark
                    ? 'border-zinc-700 hover:border-zinc-500 bg-zinc-800'
                    : 'border-slate-200 hover:border-slate-300 bg-white';

                  if (revealed) {
                    if (isCorrect) {
                      optionStyle = isDark
                        ? 'border-green-500 bg-green-900/20 text-green-300'
                        : 'border-green-400 bg-green-50 text-green-800';
                    } else if (isSelected && !isCorrect) {
                      optionStyle = isDark
                        ? 'border-red-500 bg-red-900/20 text-red-300'
                        : 'border-red-400 bg-red-50 text-red-800';
                    } else {
                      optionStyle = isDark
                        ? 'border-zinc-700 bg-zinc-800/50 opacity-50'
                        : 'border-slate-200 bg-slate-50 opacity-50';
                    }
                  } else if (isSelected) {
                    optionStyle = isDark
                      ? 'border-purple-500 bg-purple-900/20'
                      : 'border-purple-400 bg-purple-50';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleTriviaAnswer(idx)}
                      disabled={triviaRevealed}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all flex items-center gap-3 ${optionStyle}`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                        revealed && isCorrect
                          ? 'bg-green-500 text-white'
                          : revealed && isSelected && !isCorrect
                            ? 'bg-red-500 text-white'
                            : isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {revealed && isCorrect ? '✓' : revealed && isSelected ? '✗' : String.fromCharCode(65 + idx)}
                      </span>
                      <span className={revealed && !isCorrect && !isSelected ? c.textMuted : c.text}>
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation after reveal */}
              {triviaRevealed && (
                <div className={`mt-4 p-4 rounded-xl border ${c.cardAlt}`}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${c.accent}`}>
                    {selectedAnswer === triviaQuestion.correct_index
                      ? `🎉 ${teams[activeTeamIdx]?.name || 'You'} got it!`
                      : `😬 Not quite${teams.length > 1 ? `, ${teams[activeTeamIdx]?.name}` : ''}...`
                    }
                  </p>
                  <p className={`text-sm ${c.textSecondary}`}>{triviaQuestion.explanation}</p>
                </div>
              )}
            </div>

            {/* Trivia Actions */}
            {triviaRevealed && (
              <div className={`px-6 py-3 border-t flex items-center justify-between ${c.border}`}>
                <div className="flex items-center gap-3">
                  {teams.length === 1 ? (
                    <span className={`text-sm font-bold ${c.text}`}>
                      {teams[0].score}/{questionCount}
                    </span>
                  ) : (
                    <span className={`text-xs ${c.textMuted}`}>
                      {teams.map(t => `${t.name}: ${t.score}`).join(' · ')}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowChallenge(!showChallenge)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${c.btnSecondary}`}>
                    <MessageCircle className="w-3.5 h-3.5" /> Actually...
                  </button>
                  <button
                    onClick={advanceTrivia}
                    disabled={loading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isDark ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    {teams.length > 1 ? `${teams[(activeTeamIdx + 1) % teams.length]?.name}'s turn` : 'Next'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── "Actually..." Challenge ── */}
        {showChallenge && (
          <div className={`rounded-2xl p-5 border space-y-3 ${c.card}`}>
            <h4 className={`text-sm font-bold flex items-center gap-2 ${c.text}`}>
              <MessageCircle className={`w-4 h-4 ${c.accent}`} />
              Think we got it wrong?
            </h4>
            <textarea
              value={challengeText}
              onChange={(e) => setChallengeText(e.target.value)}
              placeholder="Tell us why you think the answer is different..."
              rows={2}
              className={`w-full px-4 py-3 rounded-xl border-2 text-sm resize-none transition-all focus:outline-none focus:ring-2 ${c.input}`}
            />
            <button
              onClick={handleChallenge}
              disabled={loading || !challengeText.trim()}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 ${c.btnPrimary}`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Challenge'}
            </button>

            {challengeResult && (
              <div className={`p-4 rounded-xl border ${
                challengeResult.challenge_valid === true
                  ? isDark ? 'bg-green-900/10 border-green-800/50' : 'bg-green-50 border-green-200'
                  : challengeResult.challenge_valid === 'partially'
                    ? isDark ? 'bg-amber-900/10 border-amber-800/50' : 'bg-amber-50 border-amber-200'
                    : isDark ? 'bg-red-900/10 border-red-800/50' : 'bg-red-50 border-red-200'
              }`}>
                <p className={`text-sm font-bold mb-1 ${c.text}`}>{challengeResult.ruling}</p>
                <p className={`text-sm ${c.textSecondary}`}>{challengeResult.explanation}</p>
                {challengeResult.definitive_answer && (
                  <p className={`text-sm font-semibold mt-2 ${c.text}`}>
                    Final answer: {challengeResult.definitive_answer}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Back to mode selection from result ── */}
        {(result || triviaQuestion) && !showChallenge && mode !== 'trivia' && (
          <button
            onClick={() => { resetAll(); setMode(null); }}
            className={`w-full py-2 text-center text-sm font-semibold ${c.textMuted} hover:${c.textSecondary} transition-colors`}
          >
            ← Choose a different mode
          </button>
        )}
        {mode === 'trivia' && triviaQuestion && (
          <button
            onClick={() => {
              setTriviaQuestion(null);
              setTriviaRevealed(false);
              setSelectedAnswer(null);
              setTriviaSetup(true);
              setTeams(prev => prev.map(t => ({ ...t, score: 0, streak: 0 })));
              setQuestionCount(0);
              setActiveTeamIdx(0);
              setPreviousQuestions([]);
              setMode(null);
            }}
            className={`w-full py-2 text-center text-sm font-semibold ${c.textMuted} hover:${c.textSecondary} transition-colors`}
          >
            ← End trivia session
          </button>
        )}
      </div>
    </div>
  );
};

TheFinalWord.displayName = 'TheFinalWord';
export default TheFinalWord;
