import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { usePersistentState } from '../hooks/usePersistentState';
import { CopyBtn, PrintBtn, ShareBtn } from '../components/ActionButtons';

// ════════════════════════════════════════════════════════
// THE FINAL WORD — Settle arguments with authority
// ════════════════════════════════════════════════════════

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';

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
  { id: 'question', label: 'Quick Answer', icon: '🔍', desc: 'Ask anything' },
  { id: 'dispute', label: 'Settle It', icon: '⚖️', desc: 'Two sides, one verdict' },
  { id: 'factcheck', label: 'Fact Check', icon: '🛡️', desc: 'True or false?' },
  { id: 'trivia', label: 'Trivia Night', icon: '⚡', desc: 'Quick-fire rounds' },
];

const ROUND_OPTIONS = [5, 10, 15, 20];

const EMPTY_STATS = {
  totalVerdicts: 0,
  byMode: { question: 0, dispute: 0, factcheck: 0, trivia: 0, 'devils-advocate': 0 },
  trivia: { totalQuestions: 0, totalCorrect: 0, bestStreak: 0, byCategory: {} },
  factChecks: { total: 0, rulings: {} },
  firstUsed: null,
  lastUsed: null,
};

const getSoloFeedback = (correct, total, streak) => {
  if (streak >= 5) return { emoji: '🔥', text: 'Unstoppable!' };
  if (streak >= 3) return { emoji: '🔥', text: 'On fire!' };
  if (total < 3) return { emoji: '🎯', text: "Let's go!" };
  const pct = Math.round((correct / total) * 100);
  if (pct >= 90) return { emoji: '🏆', text: 'Genius level!' };
  if (pct >= 70) return { emoji: '💪', text: 'Strong showing!' };
  if (pct >= 50) return { emoji: '👍', text: 'Solid!' };
  if (pct >= 30) return { emoji: '🤔', text: 'Hang in there...' };
  return { emoji: '😅', text: 'Rough patch!' };
};

function getTimeAgo(timestamp) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

// ════════════════════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════════════════════

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
    btnPrimary: isDark ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white',
    btnSecondary: isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700',
    accent: isDark ? 'text-amber-400' : 'text-amber-600',
    border: isDark ? 'border-zinc-700' : 'border-slate-200',
    success: isDark ? 'text-green-400' : 'text-green-600',
    error: isDark ? 'text-red-400' : 'text-red-600',
  };

  // ─── Core State ───
  const [mode, setMode] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Question
  const [question, setQuestion] = useState('');
  // Dispute
  const [personA, setPersonA] = useState('');
  const [personB, setPersonB] = useState('');
  const [claimA, setClaimA] = useState('');
  const [claimB, setClaimB] = useState('');
  const [disputeContext, setDisputeContext] = useState('');
  // Fact-check
  const [claim, setClaim] = useState('');

  // Trivia (local)
  const [triviaCategory, setTriviaCategory] = useState('general');
  const [triviaDifficulty, setTriviaDifficulty] = useState('medium');
  const [triviaQuestion, setTriviaQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [triviaRevealed, setTriviaRevealed] = useState(false);
  const [previousQuestions, setPreviousQuestions] = useState([]);
  const [triviaSetup, setTriviaSetup] = useState(true);
  const [teams, setTeams] = useState([{ name: 'Team 1', score: 0, streak: 0, bestStreak: 0 }, { name: 'Team 2', score: 0, streak: 0, bestStreak: 0 }]);
  const [activeTeamIdx, setActiveTeamIdx] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [roundLimit, setRoundLimit] = useState(10);
  const [triviaFinished, setTriviaFinished] = useState(false);
  const [categoryBreakdown, setCategoryBreakdown] = useState({});

  // Voice
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef(null);

  // Challenge
  const [showChallenge, setShowChallenge] = useState(false);
  const [challengeText, setChallengeText] = useState('');
  const [challengeResult, setChallengeResult] = useState(null);

  // Follow-up
  const [followUpText, setFollowUpText] = useState('');
  const [followUpResults, setFollowUpResults] = useState([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);

  // History & Stats
  const [history, setHistory] = usePersistentState('tfw-history', []);
  const [stats, setStats] = usePersistentState('tfw-stats', EMPTY_STATS);
  const [showHistory, setShowHistory] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Appeal Court
  const [showAppeal, setShowAppeal] = useState(false);
  const [appealEvidence, setAppealEvidence] = useState('');
  const [appealResult, setAppealResult] = useState(null);
  const [appealLoading, setAppealLoading] = useState(false);

  // Devil's Advocate
  const [devilsAdvocate, setDevilsAdvocate] = useState(false);
  const [daPosition, setDaPosition] = useState('');
  const [daTopic, setDaTopic] = useState('');
  const [daResult, setDaResult] = useState(null);

  // Shareable Link
  const [shareId, setShareId] = useState(null);
  const [shareLoading, setShareLoading] = useState(false);

  // Multiplayer
  const [mpMode, setMpMode] = useState(null); // 'host' | 'join' | 'lobby' | 'playing'
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [mpName, setMpName] = useState('');
  const [mpPlayerId, setMpPlayerId] = useState('');
  const [roomState, setRoomState] = useState(null);
  const [mpLoading, setMpLoading] = useState(false);
  const [mpError, setMpError] = useState('');
  const pollingRef = useRef(null);

  // ─── Voice Setup ───
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      setVoiceSupported(true);
      const recognition = new SR();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results).map(r => r[0].transcript).join('');
        setVoiceTranscript(transcript);
        if (event.results[0].isFinal) {
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
      recognition.onerror = () => { setIsListening(false); setVoiceTranscript(''); };
      recognition.onend = () => { setIsListening(false); };
      recognitionRef.current = recognition;
    }
  }, [mode, claimA, claimB]);

  const toggleVoice = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); }
    else { setVoiceTranscript(''); recognitionRef.current.start(); setIsListening(true); }
  }, [isListening]);

  // ─── Multiplayer Polling ───
  useEffect(() => {
    if ((mpMode === 'lobby' || mpMode === 'playing') && roomCode && mpPlayerId) {
      const poll = async () => {
        try {
          const resp = await fetch(`${BACKEND_URL}/api/the-final-word/room/${roomCode}/state?playerId=${mpPlayerId}`);
          if (resp.ok) {
            const state = await resp.json();
            setRoomState(state);
            if (state.finished && mpMode !== 'playing') setMpMode('playing'); // ensure we transition
          }
        } catch (e) { /* silent polling failure */ }
      };
      poll(); // immediate first poll
      pollingRef.current = setInterval(poll, 2000);
      return () => clearInterval(pollingRef.current);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [mpMode, roomCode, mpPlayerId]);

  // ─── Stats Tracking ───
  const trackStat = (mode, result) => {
    setStats(prev => {
      const s = { ...prev };
      s.totalVerdicts = (s.totalVerdicts || 0) + 1;
      if (!s.byMode) s.byMode = {};
      s.byMode[mode] = (s.byMode[mode] || 0) + 1;
      if (!s.firstUsed) s.firstUsed = new Date().toISOString();
      s.lastUsed = new Date().toISOString();

      if (mode === 'factcheck' && result?.ruling) {
        if (!s.factChecks) s.factChecks = { total: 0, rulings: {} };
        s.factChecks.total++;
        s.factChecks.rulings[result.ruling] = (s.factChecks.rulings[result.ruling] || 0) + 1;
      }
      return s;
    });
  };

  const trackTriviaStat = (isCorrect, category, streak) => {
    setStats(prev => {
      const s = { ...prev };
      if (!s.trivia) s.trivia = { totalQuestions: 0, totalCorrect: 0, bestStreak: 0, byCategory: {} };
      s.trivia.totalQuestions++;
      if (isCorrect) s.trivia.totalCorrect++;
      if (streak > (s.trivia.bestStreak || 0)) s.trivia.bestStreak = streak;
      if (!s.trivia.byCategory[category]) s.trivia.byCategory[category] = { correct: 0, total: 0 };
      s.trivia.byCategory[category].total++;
      if (isCorrect) s.trivia.byCategory[category].correct++;
      s.lastUsed = new Date().toISOString();
      return s;
    });
  };

  // ─── Save to History ───
  const saveToHistory = (resultData, inputSummary) => {
    const entry = { id: Date.now(), mode: resultData._mode, input: inputSummary, result: resultData, timestamp: new Date().toISOString() };
    setHistory(prev => [entry, ...prev].slice(0, 50));
  };

  // ─── Submit Handlers ───
  const handleSubmit = async () => {
    setError('');
    setResult(null);
    setShowChallenge(false);
    setChallengeResult(null);
    setFollowUpResults([]);
    setFollowUpText('');
    setShowAppeal(false);
    setAppealResult(null);
    setShareId(null);

    let payload = { mode };
    let inputSummary = '';

    if (mode === 'question') {
      payload.question = question.trim();
      inputSummary = question.trim();
    } else if (mode === 'dispute') {
      payload.claimA = claimA.trim();
      payload.claimB = claimB.trim();
      payload.personA = personA.trim() || undefined;
      payload.personB = personB.trim() || undefined;
      payload.context = disputeContext.trim() || undefined;
      inputSummary = `${personA || 'A'} vs ${personB || 'B'}`;
    } else if (mode === 'factcheck') {
      payload.claim = claim.trim();
      inputSummary = claim.trim();
    }

    try {
      const data = await callToolEndpoint('the-final-word', payload);
      setResult(data);
      saveToHistory(data, inputSummary);
      trackStat(mode, data);
    } catch (err) {
      setError(err.message || 'Failed to get the verdict');
    }
  };

  // Devil's Advocate
  const handleDevilsAdvocate = async () => {
    setError('');
    setDaResult(null);
    setShareId(null);
    try {
      const data = await callToolEndpoint('the-final-word', {
        mode: 'devils-advocate',
        position: daPosition.trim(),
        topic: daTopic.trim() || undefined,
      });
      setDaResult(data);
      saveToHistory({ ...data, _mode: 'devils-advocate' }, `DA: ${daTopic || daPosition.substring(0, 40)}`);
      trackStat('devils-advocate', data);
    } catch (err) {
      setError(err.message || 'Failed to generate counter-argument');
    }
  };

  // Trivia
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
    } catch (err) { setError(err.message || 'Failed to generate question'); }
  };

  const handleTriviaAnswer = (idx) => {
    if (triviaRevealed) return;
    setSelectedAnswer(idx);
    setTriviaRevealed(true);
    const isCorrect = idx === triviaQuestion.correct_index;
    const cat = triviaQuestion.category_label || 'General';

    setTeams(prev => prev.map((team, i) => {
      if (i !== activeTeamIdx) return team;
      const newStreak = isCorrect ? team.streak + 1 : 0;
      return { ...team, score: team.score + (isCorrect ? 1 : 0), streak: newStreak, bestStreak: Math.max(team.bestStreak || 0, newStreak) };
    }));
    setQuestionCount(prev => prev + 1);
    setPreviousQuestions(prev => [...prev.slice(-15), triviaQuestion.question]);
    setCategoryBreakdown(prev => ({
      ...prev,
      [cat]: { correct: (prev[cat]?.correct || 0) + (isCorrect ? 1 : 0), total: (prev[cat]?.total || 0) + 1 },
    }));

    // Track lifetime stat
    const newStreak = isCorrect ? (teams[activeTeamIdx]?.streak || 0) + 1 : 0;
    trackTriviaStat(isCorrect, cat, newStreak);
  };

  const advanceTrivia = () => {
    if (questionCount >= roundLimit) { setTriviaFinished(true); return; }
    setActiveTeamIdx((activeTeamIdx + 1) % teams.length);
    handleTrivia();
  };

  const updateTeamName = (idx, name) => setTeams(prev => prev.map((t, i) => i === idx ? { ...t, name } : t));
  const addTeam = () => { if (teams.length < 6) setTeams(prev => [...prev, { name: `Team ${prev.length + 1}`, score: 0, streak: 0, bestStreak: 0 }]); };
  const removeTeam = (idx) => {
    if (teams.length <= 1) return;
    setTeams(prev => prev.filter((_, i) => i !== idx));
    if (activeTeamIdx >= teams.length - 1) setActiveTeamIdx(0);
  };

  // Challenge
  const handleChallenge = async () => {
    if (!challengeText.trim()) return;
    setChallengeResult(null);
    const questionSummary = result
      ? `Q: ${result.answer || result.ruling_display || ''} — ${result.explanation || ''}`
      : `Q: ${triviaQuestion?.question || ''} — Answer: ${triviaQuestion?.correct_answer || ''}`;
    try {
      const data = await callToolEndpoint('the-final-word', { mode: 'trivia-check', originalQuestion: questionSummary, userChallenge: challengeText.trim() });
      setChallengeResult(data);
    } catch (err) { setError(err.message || 'Failed to review challenge'); }
  };

  // Follow-up
  const handleFollowUp = async () => {
    if (!followUpText.trim() || !result) return;
    setFollowUpLoading(true);
    const originalQuestion = result._mode === 'question' ? question : result._mode === 'factcheck' ? claim : `${personA || 'A'}: ${claimA} vs ${personB || 'B'}: ${claimB}`;
    const originalAnswer = result._mode === 'question' ? result.answer : result._mode === 'factcheck' ? `${result.ruling_display}: ${result.explanation}` : `${result.verdict_headline}: ${result.explanation}`;
    try {
      const data = await callToolEndpoint('the-final-word', { mode: 'follow-up', originalMode: result._mode, originalQuestion, originalAnswer, followUpQuestion: followUpText.trim() });
      setFollowUpResults(prev => [...prev, { question: followUpText.trim(), result: data }]);
      setFollowUpText('');
    } catch (err) { setError(err.message || 'Failed to get follow-up'); }
    finally { setFollowUpLoading(false); }
  };

  // Appeal
  const handleAppeal = async () => {
    if (!appealEvidence.trim() || !result) return;
    setAppealLoading(true);
    const appellantName = result.winner_name === result.score?.person_a?.name ? result.score?.person_b?.name : result.score?.person_a?.name;
    try {
      const data = await callToolEndpoint('the-final-word', { mode: 'appeal', originalVerdict: result, newEvidence: appealEvidence.trim(), appellantName });
      setAppealResult(data);
    } catch (err) { setError(err.message || 'Failed to process appeal'); }
    finally { setAppealLoading(false); }
  };

  // Share link
  const handleCreateShareLink = async () => {
    if (!result && !daResult) return;
    setShareLoading(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/the-final-word/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verdict: result || daResult, inputSummary: result?.answer || result?.verdict_headline || daResult?.verdict_headline || '' }),
      });
      const data = await resp.json();
      if (data.id) {
        setShareId(data.id);
        const link = `${window.location.origin}/verdict/${data.id}`;
        navigator.clipboard?.writeText(link);
      }
    } catch (err) { setError('Failed to create share link'); }
    finally { setShareLoading(false); }
  };

  // Fact-check related claim
  const handleCheckRelatedClaim = (relatedClaim) => {
    setClaim(relatedClaim);
    setResult(null);
    setFollowUpResults([]);
    setShowChallenge(false);
    setShareId(null);
    // Small delay to let state update, then submit
    setTimeout(() => {
      setMode('factcheck');
    }, 50);
  };

  // Multiplayer
  const handleCreateRoom = async () => {
    if (!mpName.trim()) { setMpError('Enter your name'); return; }
    setMpLoading(true);
    setMpError('');
    try {
      const catLabel = TRIVIA_CATEGORIES.find(c => c.id === triviaCategory)?.label || 'General Knowledge';
      const resp = await fetch(`${BACKEND_URL}/api/the-final-word/room/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName: mpName.trim(), settings: { category: catLabel, categoryId: triviaCategory, difficulty: triviaDifficulty, rounds: roundLimit } }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setRoomCode(data.code);
      setMpPlayerId(data.playerId);
      setMpMode('lobby');
    } catch (err) { setMpError(err.message); }
    finally { setMpLoading(false); }
  };

  const handleJoinRoom = async () => {
    if (!mpName.trim() || !joinCode.trim()) { setMpError('Enter your name and room code'); return; }
    setMpLoading(true);
    setMpError('');
    try {
      const resp = await fetch(`${BACKEND_URL}/api/the-final-word/room/${joinCode.trim().toUpperCase()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerName: mpName.trim() }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setRoomCode(joinCode.trim().toUpperCase());
      setMpPlayerId(data.playerId);
      setMpMode('lobby');
    } catch (err) { setMpError(err.message); }
    finally { setMpLoading(false); }
  };

  const handleMpStartGame = async () => {
    setMpLoading(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/the-final-word/room/${roomCode}/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: mpPlayerId }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setMpMode('playing');
    } catch (err) { setMpError(err.message); }
    finally { setMpLoading(false); }
  };

  const handleMpAnswer = async (idx) => {
    try {
      await fetch(`${BACKEND_URL}/api/the-final-word/room/${roomCode}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: mpPlayerId, answerIndex: idx }),
      });
    } catch (e) { /* will sync via polling */ }
  };

  const handleMpReveal = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/the-final-word/room/${roomCode}/reveal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: mpPlayerId }),
      });
    } catch (e) { /* will sync via polling */ }
  };

  const handleMpNext = async () => {
    setMpLoading(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/the-final-word/room/${roomCode}/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: mpPlayerId }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
    } catch (err) { setMpError(err.message); }
    finally { setMpLoading(false); }
  };

  const exitMultiplayer = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setMpMode(null);
    setRoomCode('');
    setRoomState(null);
    setMpPlayerId('');
    setMpError('');
  };

  // ─── Build Text ───
  const getVerdictText = () => {
    let text = '';
    if (result?._mode === 'question') text = `⚖️ The Final Word: ${result.answer}\n\n${result.explanation}`;
    else if (result?._mode === 'dispute') text = `⚖️ The Final Word: ${result.verdict_headline}\n\n${result.explanation}`;
    else if (result?._mode === 'factcheck') text = `⚖️ ${result.ruling_display}\n\n${result.explanation}`;
    if (result?.sources?.length) text += `\n\nSources: ${result.sources.join(', ')}`;
    return text + '\n\n— Generated by DeftBrain · deftbrain.com';
  };

  const buildTriviaShareText = () => {
    const sorted = [...teams].sort((a, b) => b.score - a.score);
    let text = `🏆 Trivia Night Results\n${questionCount} rounds · ${TRIVIA_CATEGORIES.find(c => c.id === triviaCategory)?.label || 'General'} · ${triviaDifficulty}\n\n`;
    sorted.forEach((team, i) => {
      const pct = questionCount > 0 ? Math.round((team.score / Math.ceil(questionCount / teams.length)) * 100) : 0;
      text += `${i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} ${team.name}: ${team.score} correct (${pct}%)`;
      if (team.bestStreak >= 3) text += ` · Best streak: ${team.bestStreak}🔥`;
      text += '\n';
    });
    return text + '\n— Generated by DeftBrain · deftbrain.com';
  };

  const resetAll = () => {
    setResult(null); setError(''); setShowChallenge(false); setChallengeResult(null); setChallengeText('');
    setQuestion(''); setClaim(''); setClaimA(''); setClaimB(''); setPersonA(''); setPersonB(''); setDisputeContext('');
    setFollowUpText(''); setFollowUpResults([]);
    setShowAppeal(false); setAppealResult(null); setAppealEvidence('');
    setDevilsAdvocate(false); setDaResult(null); setDaPosition(''); setDaTopic('');
    setShareId(null);
  };

  const resetTrivia = () => {
    setTriviaQuestion(null); setTriviaRevealed(false); setSelectedAnswer(null);
    setTriviaSetup(true); setTriviaFinished(false);
    setTeams(prev => prev.map(t => ({ ...t, score: 0, streak: 0, bestStreak: 0 })));
    setQuestionCount(0); setActiveTeamIdx(0); setPreviousQuestions([]); setCategoryBreakdown({});
    setMode(null);
  };

  // ─── Style Helpers ───
  const getConfidenceStyle = (confidence) => {
    const styles = {
      certain: { text: isDark ? 'text-green-300' : 'text-green-800', width: '100%' },
      high: { text: isDark ? 'text-emerald-300' : 'text-emerald-800', width: '85%' },
      moderate: { text: isDark ? 'text-amber-300' : 'text-amber-800', width: '60%' },
      low: { text: isDark ? 'text-orange-300' : 'text-orange-800', width: '35%' },
      uncertain: { text: isDark ? 'text-red-300' : 'text-red-800', width: '15%' },
    };
    return styles[confidence] || styles.moderate;
  };

  const getRulingStyle = (ruling) => {
    if (['true', 'mostly_true'].includes(ruling)) return isDark ? 'text-green-400 bg-green-900/20' : 'text-green-700 bg-green-50';
    if (['false', 'mostly_false'].includes(ruling)) return isDark ? 'text-red-400 bg-red-900/20' : 'text-red-700 bg-red-50';
    if (ruling === 'misleading') return isDark ? 'text-amber-400 bg-amber-900/20' : 'text-amber-700 bg-amber-50';
    return isDark ? 'text-blue-400 bg-blue-900/20' : 'text-blue-700 bg-blue-50';
  };

  const confBarColor = (conf) => conf === 'certain' ? 'bg-green-500' : conf === 'high' ? 'bg-emerald-500' : conf === 'moderate' ? 'bg-amber-500' : conf === 'low' ? 'bg-orange-500' : 'bg-red-500';

  // ─── Reusable Sub-Components ───
  const VoiceButton = () => {
    if (!voiceSupported) return null;
    return (
      <button onClick={toggleVoice} className={`p-3 rounded-xl border-2 transition-all ${isListening ? 'border-red-500 bg-red-500/10 text-red-500 animate-pulse' : isDark ? 'border-zinc-600 text-zinc-400 hover:border-amber-500 hover:text-amber-400' : 'border-slate-300 text-slate-400 hover:border-amber-500 hover:text-amber-500'}`} title={isListening ? 'Stop listening' : 'Speak your question'}>
        <span className="text-lg">{isListening ? '🔇' : '🎤'}</span>
      </button>
    );
  };

  const ConfidenceBar = ({ confidence }) => {
    if (!confidence) return null;
    const style = getConfidenceStyle(confidence);
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-xs font-bold uppercase tracking-wider ${c.textMuted}`}>Confidence</span>
          <span className={`text-xs font-bold uppercase tracking-wider ${style.text}`}>{confidence}</span>
        </div>
        <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-zinc-700' : 'bg-slate-100'}`}>
          <div className={`h-full rounded-full transition-all duration-700 ${confBarColor(confidence)}`} style={{ width: style.width }} />
        </div>
      </div>
    );
  };

  const SourcesList = ({ sources }) => {
    if (!sources?.length) return null;
    return (
      <div className={`mt-3 p-3 rounded-xl border ${c.cardAlt}`}>
        <p className={`text-xs font-bold uppercase tracking-wider mb-1.5 ${c.textMuted}`}>📚 Sources</p>
        <div className="flex flex-wrap gap-2">
          {sources.map((src, i) => (
            <span key={i} className={`text-xs px-2 py-1 rounded-lg ${isDark ? 'bg-zinc-600 text-zinc-200' : 'bg-slate-100 text-slate-700'}`}>{src}</span>
          ))}
        </div>
      </div>
    );
  };

  const VerdictActions = ({ resetLabel, showAppealBtn }) => (
    <div className={`px-6 py-3 border-t flex items-center justify-between flex-wrap gap-2 ${c.border}`}>
      <div className="flex gap-1.5 flex-wrap">
        <ShareBtn content={getVerdictText()} title="The Final Word" />
        <CopyBtn content={getVerdictText()} label="Copy" />
        <PrintBtn content={getVerdictText()} title="The Final Word" />
        <button onClick={() => setShowChallenge(!showChallenge)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${c.btnSecondary}`}>
          <span>💬</span> Actually...
        </button>
        <button onClick={handleCreateShareLink} disabled={shareLoading} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${c.btnSecondary}`}>
          <span>{shareLoading ? '⏳' : '🔗'}</span> {shareId ? 'Linked!' : 'Get Link'}
        </button>
        {showAppealBtn && (
          <button onClick={() => setShowAppeal(!showAppeal)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${c.btnSecondary}`}>
            <span>🏛️</span> Appeal
          </button>
        )}
      </div>
      <button onClick={() => { resetAll(); setMode(null); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${c.btnSecondary}`}>
        <span>🔄</span> {resetLabel || 'New'}
      </button>
    </div>
  );

  // Share link display
  const ShareLinkDisplay = () => {
    if (!shareId) return null;
    const link = `${window.location.origin}/verdict/${shareId}`;
    return (
      <div className={`mx-6 mb-3 p-3 rounded-xl border flex items-center gap-2 ${isDark ? 'bg-green-900/10 border-green-800/50' : 'bg-green-50 border-green-200'}`}>
        <span>✅</span>
        <span className={`text-xs flex-1 truncate ${c.textSecondary}`}>Link copied: {link}</span>
        <CopyBtn content={link} label="Copy" />
      </div>
    );
  };

  // ─── Trivia Option Button (reused in local & multiplayer) ───
  const TriviaOption = ({ option, idx, isSelected, isCorrect, revealed, onClick, disabled }) => {
    let optionStyle = isDark ? 'border-zinc-700 hover:border-zinc-500 bg-zinc-800' : 'border-slate-200 hover:border-slate-300 bg-white';
    if (revealed) {
      if (isCorrect) optionStyle = isDark ? 'border-green-500 bg-green-900/20 text-green-300' : 'border-green-400 bg-green-50 text-green-800';
      else if (isSelected && !isCorrect) optionStyle = isDark ? 'border-red-500 bg-red-900/20 text-red-300' : 'border-red-400 bg-red-50 text-red-800';
      else optionStyle = isDark ? 'border-zinc-700 bg-zinc-800/50 opacity-50' : 'border-slate-200 bg-slate-50 opacity-50';
    } else if (isSelected) {
      optionStyle = isDark ? 'border-purple-500 bg-purple-900/20' : 'border-purple-400 bg-purple-50';
    }
    return (
      <button key={idx} onClick={onClick} disabled={disabled} className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all flex items-center gap-3 ${optionStyle}`}>
        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${revealed && isCorrect ? 'bg-green-500 text-white' : revealed && isSelected && !isCorrect ? 'bg-red-500 text-white' : isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-slate-100 text-slate-600'}`}>
          {revealed && isCorrect ? '✓' : revealed && isSelected ? '✗' : String.fromCharCode(65 + idx)}
        </span>
        <span className={revealed && !isCorrect && !isSelected ? c.textMuted : c.text}>{option}</span>
      </button>
    );
  };

  // Is this player the host?
  const isHost = roomState?.players?.find(p => p.id === mpPlayerId)?.isHost;

  // ════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════
  return (
    <div className={`min-h-screen ${c.bg} py-8 px-4`}>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="text-center space-y-2 mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 text-3xl ${isDark ? 'bg-amber-900/30 border border-amber-700/50' : 'bg-amber-100 border border-amber-200'}`}>⚖️</div>
          <h1 className={`text-3xl font-black tracking-tight ${c.text}`}>The Final Word</h1>
          <p className={`text-sm ${c.textMuted}`}>Arguments settled. Facts checked. No appeals.*</p>

          {/* Header actions */}
          {!result && !triviaQuestion && !triviaFinished && !mpMode && (
            <div className="flex items-center justify-center gap-2 mt-3">
              {history.length > 0 && (
                <button onClick={() => { setShowHistory(!showHistory); setShowStats(false); }} className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${c.btnSecondary}`}>
                  📜 {showHistory ? 'Hide' : `History (${history.length})`}
                </button>
              )}
              {stats.totalVerdicts > 0 && (
                <button onClick={() => { setShowStats(!showStats); setShowHistory(false); }} className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${c.btnSecondary}`}>
                  📊 {showStats ? 'Hide Stats' : 'Stats'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ═══════ STATS DASHBOARD ═══════ */}
        {showStats && !result && !triviaQuestion && (
          <div className={`rounded-2xl border p-5 space-y-4 ${c.card}`}>
            <h3 className={`text-sm font-bold ${c.text}`}>📊 Your Stats</h3>

            {/* Overview row */}
            <div className="grid grid-cols-3 gap-3">
              <div className={`p-3 rounded-xl border text-center ${c.cardAlt}`}>
                <p className={`text-2xl font-black ${c.accent}`}>{stats.totalVerdicts || 0}</p>
                <p className={`text-xs ${c.textMuted}`}>Total Verdicts</p>
              </div>
              <div className={`p-3 rounded-xl border text-center ${c.cardAlt}`}>
                <p className={`text-2xl font-black ${c.accent}`}>{stats.trivia?.totalQuestions || 0}</p>
                <p className={`text-xs ${c.textMuted}`}>Trivia Qs</p>
              </div>
              <div className={`p-3 rounded-xl border text-center ${c.cardAlt}`}>
                <p className={`text-2xl font-black ${c.accent}`}>
                  {stats.trivia?.totalQuestions ? `${Math.round((stats.trivia.totalCorrect / stats.trivia.totalQuestions) * 100)}%` : '—'}
                </p>
                <p className={`text-xs ${c.textMuted}`}>Trivia Accuracy</p>
              </div>
            </div>

            {/* Mode breakdown */}
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${c.textMuted}`}>By Mode</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.byMode || {}).filter(([,v]) => v > 0).map(([m, count]) => (
                  <span key={m} className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${c.cardAlt} border ${c.text}`}>
                    {MODES.find(md => md.id === m)?.icon || '🎯'} {m}: {count}
                  </span>
                ))}
              </div>
            </div>

            {/* Trivia categories */}
            {stats.trivia?.byCategory && Object.keys(stats.trivia.byCategory).length > 0 && (
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${c.textMuted}`}>Trivia by Category</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(stats.trivia.byCategory).sort(([,a],[,b]) => b.total - a.total).map(([cat, data]) => (
                    <div key={cat} className={`p-2 rounded-lg border text-center ${c.cardAlt}`}>
                      <p className={`text-xs font-semibold truncate ${c.text}`}>{cat}</p>
                      <p className={`text-sm font-black ${data.total > 0 && data.correct / data.total >= 0.7 ? c.success : c.textSecondary}`}>
                        {data.correct}/{data.total}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fact-check rulings */}
            {stats.factChecks?.total > 0 && (
              <div>
                <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${c.textMuted}`}>Fact-Check Rulings</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.factChecks.rulings || {}).map(([ruling, count]) => (
                    <span key={ruling} className={`text-xs px-2 py-1 rounded-lg font-semibold ${getRulingStyle(ruling)}`}>
                      {ruling.replace('_', ' ')}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {stats.trivia?.bestStreak > 0 && (
              <p className={`text-xs ${c.textMuted}`}>🔥 Longest trivia streak: {stats.trivia.bestStreak}</p>
            )}

            <button onClick={() => { setStats(EMPTY_STATS); setShowStats(false); }} className={`text-xs font-semibold px-2 py-1 rounded-lg transition-all ${c.btnSecondary}`}>
              🗑️ Reset Stats
            </button>
          </div>
        )}

        {/* ═══════ HISTORY PANEL ═══════ */}
        {showHistory && !result && !triviaQuestion && (
          <div className={`rounded-2xl border p-5 space-y-3 ${c.card}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-bold ${c.text}`}>📜 Past Verdicts</h3>
              <button onClick={() => setHistory([])} className={`text-xs font-semibold px-2 py-1 rounded-lg transition-all ${c.btnSecondary}`}>🗑️ Clear All</button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {history.map((entry) => {
                const modeInfo = MODES.find(m => m.id === entry.mode) || { icon: '🎯', label: entry.mode };
                return (
                  <div key={entry.id} className={`p-3 rounded-xl border transition-all ${c.cardAlt}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm">{modeInfo.icon}</span>
                          <span className={`text-xs font-bold uppercase tracking-wider ${c.textMuted}`}>{modeInfo.label}</span>
                          <span className={`text-xs ${c.textMuted}`}>· {getTimeAgo(entry.timestamp)}</span>
                        </div>
                        <p className={`text-sm font-semibold truncate ${c.text}`}>{entry.result?.answer || entry.result?.verdict_headline || entry.result?.ruling_display || entry.input}</p>
                        <p className={`text-xs truncate ${c.textSecondary}`}>{entry.input}</p>
                      </div>
                      <button onClick={() => setHistory(prev => prev.filter(e => e.id !== entry.id))} className={`p-1 rounded-lg transition-all flex-shrink-0 ${isDark ? 'text-zinc-600 hover:text-red-400' : 'text-slate-300 hover:text-red-500'}`}>
                        <span className="text-xs">✕</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════ MODE SELECTION ═══════ */}
        {!result && !daResult && !triviaQuestion && !triviaFinished && !mpMode && (
          <div className={`${c.card} border rounded-2xl p-5 space-y-4`}>
            <div className="grid grid-cols-2 gap-3">
              {MODES.map(m => {
                const isActive = mode === m.id;
                return (
                  <button key={m.id} onClick={() => { setMode(m.id); setError(''); setResult(null); setDevilsAdvocate(false); setDaResult(null); }}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${isActive ? isDark ? 'border-amber-500 bg-amber-900/10 shadow-sm' : 'border-amber-400 bg-amber-50 shadow-sm' : isDark ? 'border-zinc-700 hover:border-zinc-500 bg-zinc-800' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                    <span className="text-xl mb-2 block">{m.icon}</span>
                    <div className={`text-sm font-bold ${isActive ? c.text : c.textSecondary}`}>{m.label}</div>
                    <div className={`text-xs mt-0.5 ${c.textMuted}`}>{m.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Voice transcript */}
            {isListening && (
              <div className={`p-3 rounded-lg border-2 border-red-500/30 ${isDark ? 'bg-red-900/10' : 'bg-red-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-red-400' : 'text-red-600'}`}>Listening...</span>
                </div>
                {voiceTranscript && <p className={`text-sm italic ${c.textSecondary}`}>"{voiceTranscript}"</p>}
              </div>
            )}

            {/* ════ QUICK QUESTION ════ */}
            {mode === 'question' && (
              <div className="space-y-3">
                <label className={`block text-xs font-bold uppercase tracking-wider ${c.textMuted}`}>What do you want to know?</label>
                <div className="flex gap-2">
                  <input value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !loading && handleSubmit()} placeholder="Who won the 1994 World Cup?" className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm transition-all focus:outline-none focus:ring-2 ${c.input}`} />
                  <VoiceButton />
                </div>
                <button onClick={handleSubmit} disabled={loading || !question.trim()} className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 ${c.btnPrimary}`}>
                  {loading ? <span className="animate-spin inline-block">⏳</span> : <span>🔍</span>} {loading ? 'Deliberating...' : 'Get The Final Word'}
                </button>
              </div>
            )}

            {/* ════ DISPUTE (with Devil's Advocate toggle) ════ */}
            {mode === 'dispute' && (
              <div className="space-y-4">
                {/* Devil's Advocate Toggle */}
                <div className={`p-3 rounded-xl border ${c.cardAlt} flex items-center justify-between`}>
                  <div>
                    <p className={`text-xs font-bold ${c.text}`}>😈 Devil's Advocate</p>
                    <p className={`text-xs ${c.textMuted}`}>No opponent? AI argues against you</p>
                  </div>
                  <button
                    onClick={() => setDevilsAdvocate(!devilsAdvocate)}
                    className={`w-12 h-6 rounded-full transition-all relative ${devilsAdvocate ? 'bg-amber-500' : isDark ? 'bg-zinc-600' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${devilsAdvocate ? 'left-6' : 'left-0.5'}`} />
                  </button>
                </div>

                {devilsAdvocate ? (
                  /* Devil's Advocate Input */
                  <div className="space-y-3">
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${c.textMuted}`}>Topic (optional)</label>
                      <input value={daTopic} onChange={(e) => setDaTopic(e.target.value)} placeholder="e.g., Remote work, AI regulation, pineapple on pizza..." className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm transition-all focus:outline-none focus:ring-2 ${c.input}`} />
                    </div>
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${c.textMuted}`}>Your position</label>
                      <textarea value={daPosition} onChange={(e) => setDaPosition(e.target.value)} placeholder="State your position clearly... e.g., 'Remote work is strictly better than office work for knowledge workers'" rows={3} className={`w-full px-4 py-3 rounded-xl border-2 text-sm transition-all focus:outline-none focus:ring-2 resize-none ${c.input}`} />
                    </div>
                    <button onClick={handleDevilsAdvocate} disabled={loading || !daPosition.trim()} className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 ${c.btnPrimary}`}>
                      {loading ? <span className="animate-spin inline-block">⏳</span> : <span>😈</span>} {loading ? 'Building counter-argument...' : 'Challenge My Position'}
                    </button>
                  </div>
                ) : (
                  /* Normal Dispute Input */
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${c.textMuted}`}>Name (optional)</label>
                        <input value={personA} onChange={(e) => setPersonA(e.target.value)} placeholder="Person A" className={`w-full px-3 py-2 rounded-lg border-2 text-sm transition-all focus:outline-none focus:ring-2 ${c.input}`} />
                      </div>
                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${c.textMuted}`}>Name (optional)</label>
                        <input value={personB} onChange={(e) => setPersonB(e.target.value)} placeholder="Person B" className={`w-full px-3 py-2 rounded-lg border-2 text-sm transition-all focus:outline-none focus:ring-2 ${c.input}`} />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${c.textMuted}`}>{personA || 'Person A'} says...</label>
                      <div className="flex gap-2">
                        <textarea value={claimA} onChange={(e) => setClaimA(e.target.value)} placeholder='"The Great Wall of China is visible from space"' rows={2} className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm transition-all focus:outline-none focus:ring-2 resize-none ${c.input}`} />
                        <VoiceButton />
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>VS</div>
                    </div>
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${c.textMuted}`}>{personB || 'Person B'} says...</label>
                      <div className="flex gap-2">
                        <textarea value={claimB} onChange={(e) => setClaimB(e.target.value)} placeholder="No way, that is totally a myth" rows={2} className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm transition-all focus:outline-none focus:ring-2 resize-none ${c.input}`} />
                        <VoiceButton />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${c.textMuted}`}>Context (optional)</label>
                      <input value={disputeContext} onChange={(e) => setDisputeContext(e.target.value)} placeholder="Any extra context..." className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm transition-all focus:outline-none focus:ring-2 ${c.input}`} />
                    </div>
                    <button onClick={handleSubmit} disabled={loading || !claimA.trim() || !claimB.trim()} className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 ${c.btnPrimary}`}>
                      {loading ? <span className="animate-spin inline-block">⏳</span> : <span>⚖️</span>} {loading ? 'Reviewing evidence...' : 'Deliver the Verdict'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ════ FACT CHECK ════ */}
            {mode === 'factcheck' && (
              <div className="space-y-3">
                <label className={`block text-xs font-bold uppercase tracking-wider ${c.textMuted}`}>What claim do you want to check?</label>
                <div className="flex gap-2">
                  <textarea value={claim} onChange={(e) => setClaim(e.target.value)} placeholder="Humans only use 10% of their brains" rows={2} className={`flex-1 px-4 py-3 rounded-xl border-2 text-sm transition-all focus:outline-none focus:ring-2 resize-none ${c.input}`} />
                  <VoiceButton />
                </div>
                <button onClick={handleSubmit} disabled={loading || !claim.trim()} className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 ${c.btnPrimary}`}>
                  {loading ? <span className="animate-spin inline-block">⏳</span> : <span>🛡️</span>} {loading ? 'Fact-checking...' : 'Check This Claim'}
                </button>
              </div>
            )}

            {/* ════ TRIVIA SETUP ════ */}
            {mode === 'trivia' && (triviaSetup || (!triviaQuestion && loading)) && (
              <div className="space-y-4">
                {/* Team Setup */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${c.textMuted}`}>Players / Teams</label>
                  <div className="space-y-2">
                    {teams.map((team, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>{idx + 1}</div>
                        <input value={team.name} onChange={(e) => updateTeamName(idx, e.target.value)} placeholder={`Player/Team ${idx + 1}`} className={`flex-1 px-3 py-2 rounded-lg border-2 text-sm transition-all focus:outline-none focus:ring-2 ${c.input}`} />
                        {teams.length > 1 && <button onClick={() => removeTeam(idx)} className={`p-1.5 rounded-lg transition-all ${isDark ? 'text-zinc-500 hover:text-red-400' : 'text-slate-400 hover:text-red-500'}`}><span className="text-sm">✕</span></button>}
                      </div>
                    ))}
                  </div>
                  {teams.length < 6 && <button onClick={addTeam} className={`mt-2 text-xs font-semibold flex items-center gap-1 ${c.accent} hover:underline`}>➕ Add player/team</button>}
                </div>

                {/* Rounds */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${c.textMuted}`}>Number of Rounds</label>
                  <div className="flex gap-2">
                    {ROUND_OPTIONS.map(n => (
                      <button key={n} onClick={() => setRoundLimit(n)} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all border ${roundLimit === n ? isDark ? 'border-purple-500 bg-purple-900/20 text-purple-300' : 'border-purple-400 bg-purple-50 text-purple-700' : isDark ? 'border-zinc-700 text-zinc-400 hover:border-zinc-500' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>{n}</button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${c.textMuted}`}>Category</label>
                  <div className="flex flex-wrap gap-2">
                    {TRIVIA_CATEGORIES.map(cat => (
                      <button key={cat.id} onClick={() => setTriviaCategory(cat.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${triviaCategory === cat.id ? isDark ? 'border-purple-500 bg-purple-900/20 text-purple-300' : 'border-purple-400 bg-purple-50 text-purple-700' : isDark ? 'border-zinc-700 text-zinc-400 hover:border-zinc-500' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                        {cat.emoji} {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${c.textMuted}`}>Difficulty</label>
                  <div className="flex gap-2">
                    {['easy', 'medium', 'hard'].map(d => (
                      <button key={d} onClick={() => setTriviaDifficulty(d)} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${triviaDifficulty === d ? isDark ? 'border-purple-500 bg-purple-900/20 text-purple-300' : 'border-purple-400 bg-purple-50 text-purple-700' : isDark ? 'border-zinc-700 text-zinc-400 hover:border-zinc-500' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>{d}</button>
                    ))}
                  </div>
                </div>

                {/* Start buttons */}
                <button onClick={() => { setTriviaSetup(false); handleTrivia(); }} disabled={loading || teams.every(t => !t.name.trim())} className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-40 ${isDark ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}>
                  {loading ? <span className="animate-spin inline-block">⏳</span> : <span>⚡</span>} {loading ? 'Generating...' : 'Start Local Game'}
                </button>

                {/* Multiplayer buttons */}
                <div className="flex gap-2">
                  <button onClick={() => setMpMode('host')} className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 border-2 ${isDark ? 'border-purple-700 text-purple-300 hover:bg-purple-900/20' : 'border-purple-300 text-purple-700 hover:bg-purple-50'}`}>
                    📡 Host Online Game
                  </button>
                  <button onClick={() => setMpMode('join')} className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 border-2 ${isDark ? 'border-purple-700 text-purple-300 hover:bg-purple-900/20' : 'border-purple-300 text-purple-700 hover:bg-purple-50'}`}>
                    🎮 Join Game
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && <div className={`p-3 rounded-xl border flex items-start gap-2 ${isDark ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}><span className="flex-shrink-0 mt-0.5">⚠️</span><p className="text-sm">{error}</p></div>}
          </div>
        )}

        {/* ═══════ MULTIPLAYER SETUP ═══════ */}
        {mpMode === 'host' && !roomCode && (
          <div className={`rounded-2xl border p-5 space-y-4 ${c.card}`}>
            <h3 className={`text-sm font-bold ${c.text}`}>📡 Host Online Trivia</h3>
            <input value={mpName} onChange={(e) => setMpName(e.target.value)} placeholder="Your name" className={`w-full px-4 py-3 rounded-xl border-2 text-sm transition-all focus:outline-none focus:ring-2 ${c.input}`} />
            {mpError && <p className={`text-xs ${c.error}`}>{mpError}</p>}
            <div className="flex gap-2">
              <button onClick={handleCreateRoom} disabled={mpLoading} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 ${isDark ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}>
                {mpLoading ? <span className="animate-spin inline-block">⏳</span> : 'Create Room'}
              </button>
              <button onClick={() => setMpMode(null)} className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${c.btnSecondary}`}>Cancel</button>
            </div>
          </div>
        )}

        {mpMode === 'join' && !roomCode && (
          <div className={`rounded-2xl border p-5 space-y-4 ${c.card}`}>
            <h3 className={`text-sm font-bold ${c.text}`}>🎮 Join Online Trivia</h3>
            <input value={mpName} onChange={(e) => setMpName(e.target.value)} placeholder="Your name" className={`w-full px-4 py-3 rounded-xl border-2 text-sm transition-all focus:outline-none focus:ring-2 ${c.input}`} />
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="Room code (e.g., ABCD)" maxLength={4} className={`w-full px-4 py-3 rounded-xl border-2 text-sm text-center font-black tracking-[0.3em] uppercase transition-all focus:outline-none focus:ring-2 ${c.input}`} />
            {mpError && <p className={`text-xs ${c.error}`}>{mpError}</p>}
            <div className="flex gap-2">
              <button onClick={handleJoinRoom} disabled={mpLoading} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 ${isDark ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}>
                {mpLoading ? <span className="animate-spin inline-block">⏳</span> : 'Join Room'}
              </button>
              <button onClick={() => setMpMode(null)} className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${c.btnSecondary}`}>Cancel</button>
            </div>
          </div>
        )}

        {/* ═══════ MULTIPLAYER LOBBY ═══════ */}
        {mpMode === 'lobby' && roomState && (
          <div className={`rounded-2xl border p-5 space-y-4 ${c.card}`}>
            <div className="text-center">
              <p className={`text-xs font-bold uppercase tracking-wider ${c.textMuted}`}>Room Code</p>
              <p className={`text-4xl font-black tracking-[0.3em] ${c.accent}`}>{roomCode}</p>
              <p className={`text-xs mt-1 ${c.textMuted}`}>Share this code with other players</p>
            </div>

            <div>
              <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${c.textMuted}`}>Players ({roomState.players?.length || 0}/8)</p>
              <div className="space-y-1.5">
                {roomState.players?.map((p, i) => (
                  <div key={p.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${c.cardAlt} border`}>
                    <span className="text-sm">{p.isHost ? '👑' : '🎮'}</span>
                    <span className={`text-sm font-semibold ${c.text}`}>{p.name}</span>
                    {p.isHost && <span className={`text-xs ml-auto ${c.textMuted}`}>Host</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className={`p-3 rounded-xl border ${c.cardAlt}`}>
              <p className={`text-xs ${c.textSecondary}`}>
                {roomState.settings?.category} · {roomState.settings?.difficulty} · {roomState.settings?.rounds} rounds
              </p>
            </div>

            {isHost ? (
              <button onClick={handleMpStartGame} disabled={mpLoading || (roomState.players?.length || 0) < 2} className={`w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 ${isDark ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}>
                {mpLoading ? <span className="animate-spin inline-block">⏳</span> : `Start Game (${roomState.players?.length || 0} players)`}
              </button>
            ) : (
              <div className={`text-center py-4`}>
                <span className="animate-spin inline-block mr-2">⏳</span>
                <span className={`text-sm ${c.textSecondary}`}>Waiting for host to start...</span>
              </div>
            )}

            <button onClick={exitMultiplayer} className={`w-full text-center text-xs font-semibold ${c.textMuted} hover:underline`}>Leave Room</button>
          </div>
        )}

        {/* ═══════ MULTIPLAYER GAME ═══════ */}
        {(mpMode === 'lobby' || mpMode === 'playing') && roomState?.started && roomState?.currentQuestion && !roomState?.finished && (
          <div className={`rounded-2xl overflow-hidden border-2 shadow-lg ${isDark ? 'border-purple-700/50 bg-zinc-800' : 'border-purple-300 bg-white'}`}>
            <div className={`px-6 py-4 ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'} border-b ${c.border}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{roomState.currentQuestion.category_label || 'Trivia'}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-slate-100 text-slate-600'}`}>Q{roomState.questionNumber}/{roomState.settings?.rounds} · 📡 {roomCode}</span>
              </div>
              <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-700' : 'bg-slate-200'}`}>
                <div className="h-full rounded-full bg-purple-500 transition-all duration-500" style={{ width: `${(roomState.questionNumber / (roomState.settings?.rounds || 10)) * 100}%` }} />
              </div>
            </div>

            {/* Scoreboard */}
            <div className={`px-6 py-2 border-b ${c.border} flex gap-2 overflow-x-auto`}>
              {roomState.players?.map(p => (
                <div key={p.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${p.id === mpPlayerId ? isDark ? 'bg-purple-900/20 border border-purple-700 text-purple-300' : 'bg-purple-50 border border-purple-300 text-purple-700' : isDark ? 'bg-zinc-700/50 text-zinc-300' : 'bg-slate-50 text-slate-600'}`}>
                  <span>{p.name}</span>
                  <span className={`font-black ${c.accent}`}>{p.score}</span>
                  {p.answered && !roomState.revealed && <span>✓</span>}
                  {p.streak >= 3 && <span>🔥{p.streak}</span>}
                </div>
              ))}
            </div>

            <div className="px-6 py-5">
              <h3 className={`text-lg font-bold mb-5 ${c.text}`}>{roomState.currentQuestion.question}</h3>
              <div className="space-y-2">
                {roomState.currentQuestion.options?.map((option, idx) => (
                  <TriviaOption
                    key={idx}
                    option={option}
                    idx={idx}
                    isSelected={roomState.myAnswer === idx}
                    isCorrect={idx === roomState.currentQuestion.correct_index}
                    revealed={roomState.revealed}
                    onClick={() => handleMpAnswer(idx)}
                    disabled={roomState.revealed || roomState.myAnswer !== null}
                  />
                ))}
              </div>

              {roomState.revealed && roomState.currentQuestion.explanation && (
                <div className={`mt-4 p-4 rounded-xl border ${c.cardAlt}`}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${c.accent}`}>
                    {roomState.myAnswer === roomState.currentQuestion.correct_index ? '🎉 You got it!' : '😬 Not quite...'}
                  </p>
                  <p className={`text-sm ${c.textSecondary}`}>{roomState.currentQuestion.explanation}</p>
                </div>
              )}
            </div>

            {/* MP Actions */}
            <div className={`px-6 py-3 border-t flex items-center justify-between ${c.border}`}>
              <span className={`text-xs ${c.textMuted}`}>
                {roomState.revealed ? '' : `${roomState.players?.filter(p => p.answered).length}/${roomState.players?.length} answered`}
              </span>
              {isHost && (
                <div className="flex gap-2">
                  {!roomState.revealed ? (
                    <button onClick={handleMpReveal} disabled={!roomState.allAnswered && !roomState.revealed} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isDark ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'} ${!roomState.allAnswered ? 'opacity-60' : ''}`}>
                      {roomState.allAnswered ? 'Reveal Answer' : 'Reveal Early'}
                    </button>
                  ) : (
                    <button onClick={handleMpNext} disabled={mpLoading} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isDark ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}>
                      {mpLoading ? <span className="animate-spin inline-block">⏳</span> : '→'} {roomState.questionNumber >= (roomState.settings?.rounds || 10) ? 'See Results' : 'Next Question'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════ MULTIPLAYER FINISHED ═══════ */}
        {roomState?.finished && (mpMode === 'lobby' || mpMode === 'playing') && (
          <div className={`rounded-2xl overflow-hidden border-2 shadow-lg ${isDark ? 'border-purple-700/50 bg-zinc-800' : 'border-purple-300 bg-white'}`}>
            <div className={`px-6 py-8 text-center ${isDark ? 'bg-purple-900/20' : 'bg-gradient-to-b from-purple-50 to-white'}`}>
              <span className="text-5xl block mb-3">🏆</span>
              <p className={`text-xs font-black uppercase tracking-widest mb-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Online Trivia · Room {roomCode}</p>
              {(() => {
                const sorted = [...(roomState.players || [])].sort((a, b) => b.score - a.score);
                const isTie = sorted.length > 1 && sorted[0].score === sorted[1].score;
                return <h2 className={`text-2xl font-black ${c.text}`}>{isTie ? "It's a Tie!" : `${sorted[0]?.name} Wins!`}</h2>;
              })()}
            </div>
            <div className={`px-6 py-4 border-t ${c.border} space-y-3`}>
              {[...(roomState.players || [])].sort((a, b) => b.score - a.score).map((p, rank) => (
                <div key={p.id} className={`p-3 rounded-xl border ${rank === 0 ? isDark ? 'bg-purple-900/10 border-purple-700/50' : 'bg-purple-50 border-purple-200' : c.cardAlt}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : ''}</span>
                      <span className={`text-sm font-bold ${c.text}`}>{p.name}</span>
                      {p.id === mpPlayerId && <span className={`text-xs ${c.textMuted}`}>(you)</span>}
                    </div>
                    <span className={`text-xl font-black ${rank === 0 ? c.accent : c.textSecondary}`}>{p.score}</span>
                  </div>
                  {p.bestStreak >= 2 && <p className={`text-xs mt-1 ${c.textMuted}`}>🔥 Best streak: {p.bestStreak}</p>}
                </div>
              ))}
            </div>
            <div className={`px-6 py-3 border-t ${c.border}`}>
              <button onClick={exitMultiplayer} className={`w-full py-2 rounded-xl text-sm font-semibold transition-all ${c.btnSecondary}`}>← Back to Menu</button>
            </div>
          </div>
        )}

        {/* ═══════ VERDICT CARDS ═══════ */}

        {/* Quick Question Result */}
        {result?._mode === 'question' && (
          <div className={`rounded-2xl overflow-hidden border-2 shadow-lg ${isDark ? 'border-amber-700/50 bg-zinc-800' : 'border-amber-300 bg-white'}`}>
            <div className={`px-6 py-4 ${isDark ? 'bg-amber-900/20' : 'bg-amber-50'} border-b ${c.border}`}>
              <div className="flex items-center gap-2"><span>⚖️</span><span className={`text-xs font-black uppercase tracking-widest ${c.accent}`}>The Final Word</span>
                {result.category && <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-slate-100 text-slate-600'}`}>{result.category}</span>}
              </div>
            </div>
            <div className="px-6 py-5">
              <h2 className={`text-xl font-black leading-snug mb-4 ${c.text}`}>{result.answer}</h2>
              <ConfidenceBar confidence={result.confidence} />
              <p className={`text-sm leading-relaxed mb-4 ${c.textSecondary}`}>{result.explanation}</p>
              {result.supporting_facts?.length > 0 && <div className={`p-3 rounded-xl border ${c.cardAlt} mb-3`}><p className={`text-xs font-bold uppercase tracking-wider mb-2 ${c.textMuted}`}>Key Facts</p>{result.supporting_facts.map((f, i) => <p key={i} className={`text-sm ${c.textSecondary} mb-1`}>• {f}</p>)}</div>}
              {result.common_misconception && <div className={`p-3 rounded-xl border ${isDark ? 'bg-amber-900/10 border-amber-800/50' : 'bg-amber-50 border-amber-200'}`}><p className={`text-xs font-bold uppercase tracking-wider mb-1 ${c.accent}`}>Common Misconception</p><p className={`text-sm ${c.textSecondary}`}>{result.common_misconception}</p></div>}
              {result.fun_extra && <div className={`mt-3 p-3 rounded-xl border ${c.cardAlt}`}><p className={`text-xs font-bold mb-1 ${c.accent}`}>💡 Bonus</p><p className={`text-sm ${c.textSecondary}`}>{result.fun_extra}</p></div>}
              <SourcesList sources={result.sources} />
            </div>
            <ShareLinkDisplay />
            <VerdictActions resetLabel="New Question" />
          </div>
        )}

        {/* Dispute Result */}
        {result?._mode === 'dispute' && (
          <div className={`rounded-2xl overflow-hidden border-2 shadow-lg ${isDark ? 'border-amber-700/50 bg-zinc-800' : 'border-amber-300 bg-white'}`}>
            <div className={`px-6 py-5 text-center ${isDark ? 'bg-gradient-to-r from-amber-900/30 to-zinc-800' : 'bg-gradient-to-r from-amber-50 to-amber-100'}`}>
              <p className={`text-xs font-black uppercase tracking-widest mb-2 ${c.accent}`}>⚖️ The Verdict</p>
              <h2 className={`text-2xl font-black leading-snug ${c.text}`}>{result.verdict_headline}</h2>
            </div>
            {result.score && (
              <div className="grid grid-cols-2 gap-0 border-t border-b" style={{ borderColor: isDark ? '#3f3f46' : '#e2e8f0' }}>
                {[result.score.person_a, result.score.person_b].map((person, i) => {
                  const isWinner = result.winner_name === person?.name;
                  return (
                    <div key={i} className={`p-4 ${i === 0 ? `border-r ${c.border}` : ''} ${isWinner ? isDark ? 'bg-green-900/10' : 'bg-green-50/50' : ''}`}>
                      <div className="flex items-center gap-2 mb-2">{isWinner && <span>🏆</span>}<p className={`text-sm font-bold ${c.text}`}>{person?.name}</p></div>
                      <div className={`text-3xl font-black mb-2 ${(person?.accuracy || 0) >= 70 ? c.success : (person?.accuracy || 0) >= 40 ? c.accent : c.error}`}>{person?.accuracy ?? '?'}%</div>
                      {person?.what_they_got_right && <p className={`text-xs mb-1 ${c.textSecondary}`}><span className={c.success}>✓</span> {person.what_they_got_right}</p>}
                      {person?.what_they_got_wrong && <p className={`text-xs ${c.textMuted}`}><span className={c.error}>✗</span> {person.what_they_got_wrong}</p>}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="px-6 py-4 space-y-3">
              <p className={`text-sm leading-relaxed ${c.textSecondary}`}>{result.explanation}</p>
              {result.the_actual_answer && <div className={`p-3 rounded-xl border ${c.cardAlt}`}><p className={`text-xs font-bold uppercase tracking-wider mb-1 ${c.accent}`}>The Actual Answer</p><p className={`text-sm font-semibold ${c.text}`}>{result.the_actual_answer}</p></div>}
              {result.time_sensitive && result.how_to_verify && <div className={`p-3 rounded-xl border ${isDark ? 'bg-blue-900/10 border-blue-800/50' : 'bg-blue-50 border-blue-200'}`}><p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>📡 Verify live</p><p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>{result.how_to_verify}</p></div>}
              {result.settlement_suggestion && <div className={`p-3 rounded-xl ${isDark ? 'bg-purple-900/10 border border-purple-800/50' : 'bg-purple-50 border border-purple-200'}`}><p className={`text-sm italic ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>🤝 {result.settlement_suggestion}</p></div>}
              <SourcesList sources={result.sources} />
            </div>
            <ShareLinkDisplay />
            <VerdictActions resetLabel="New Dispute" showAppealBtn={true} />
          </div>
        )}

        {/* Fact Check Result */}
        {result?._mode === 'factcheck' && (
          <div className={`rounded-2xl overflow-hidden border-2 shadow-lg ${isDark ? 'border-amber-700/50 bg-zinc-800' : 'border-amber-300 bg-white'}`}>
            <div className={`px-6 py-6 text-center ${getRulingStyle(result.ruling)}`}>
              <p className={`text-xs font-black uppercase tracking-widest mb-2 ${c.textMuted}`}>Ruling</p>
              <h2 className="text-3xl font-black tracking-tight">{result.ruling_display}</h2>
            </div>
            <div className="px-6 py-4 space-y-3">
              <ConfidenceBar confidence={result.confidence} />
              <p className={`text-sm leading-relaxed ${c.textSecondary}`}>{result.explanation}</p>
              {result.what_is_true && <div className={`p-3 rounded-xl border ${c.cardAlt}`}><p className={`text-xs font-bold uppercase tracking-wider mb-1 ${c.accent}`}>What's Actually True</p><p className={`text-sm ${c.text}`}>{result.what_is_true}</p></div>}
              {result.the_nuance && <div className={`p-3 rounded-xl border ${c.cardAlt}`}><p className={`text-xs font-bold uppercase tracking-wider mb-1 ${c.textMuted}`}>The Nuance</p><p className={`text-sm ${c.textSecondary}`}>{result.the_nuance}</p></div>}
              {result.origin_of_myth && <div className={`p-3 rounded-xl ${isDark ? 'bg-purple-900/10 border border-purple-800/50' : 'bg-purple-50 border border-purple-200'}`}><p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Where This Myth Started</p><p className={`text-sm ${isDark ? 'text-purple-200' : 'text-purple-700'}`}>{result.origin_of_myth}</p></div>}
              <SourcesList sources={result.sources} />

              {/* ═══ FACT-CHECK CHAINS ═══ */}
              {result.related_claims?.length > 0 && (
                <div className={`p-4 rounded-xl border ${c.cardAlt}`}>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${c.accent}`}>🔗 Related Claims — check these too</p>
                  <div className="space-y-2">
                    {result.related_claims.map((rc, i) => (
                      <button key={i} onClick={() => handleCheckRelatedClaim(rc)} className={`w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all flex items-center gap-2 ${isDark ? 'border-zinc-600 hover:border-amber-500 hover:bg-amber-900/10 text-zinc-200' : 'border-slate-200 hover:border-amber-400 hover:bg-amber-50 text-slate-700'}`}>
                        <span className="flex-shrink-0">🛡️</span>
                        <span className="flex-1">{rc}</span>
                        <span className={`text-xs ${c.textMuted}`}>Check →</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <ShareLinkDisplay />
            <VerdictActions resetLabel="New Claim" />
          </div>
        )}

        {/* ═══════ DEVIL'S ADVOCATE RESULT ═══════ */}
        {daResult && (
          <div className={`rounded-2xl overflow-hidden border-2 shadow-lg ${isDark ? 'border-amber-700/50 bg-zinc-800' : 'border-amber-300 bg-white'}`}>
            <div className={`px-6 py-5 text-center ${isDark ? 'bg-gradient-to-r from-amber-900/30 to-zinc-800' : 'bg-gradient-to-r from-amber-50 to-amber-100'}`}>
              <p className={`text-xs font-black uppercase tracking-widest mb-2 ${c.accent}`}>😈 Devil's Advocate Verdict</p>
              <h2 className={`text-2xl font-black leading-snug ${c.text}`}>{daResult.verdict_headline}</h2>
            </div>

            {/* Counter-argument */}
            <div className={`px-6 py-4 border-b ${c.border}`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>😈 The Counter-Argument</p>
              <p className={`text-sm font-semibold ${c.text} mb-2`}>{daResult.counter_position}</p>
              {daResult.counter_supporting_facts?.map((f, i) => <p key={i} className={`text-xs ${c.textSecondary} mb-0.5`}>• {f}</p>)}
            </div>

            {/* Scores */}
            <div className="grid grid-cols-2 gap-0 border-b" style={{ borderColor: isDark ? '#3f3f46' : '#e2e8f0' }}>
              <div className={`p-4 border-r ${c.border}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${c.textMuted}`}>Your Position</p>
                <div className={`text-3xl font-black mb-2 ${(daResult.user_score?.accuracy || 0) >= 60 ? c.success : c.error}`}>{daResult.user_score?.accuracy}%</div>
                <p className={`text-xs mb-0.5 ${c.textSecondary}`}><span className={c.success}>✓</span> {daResult.user_score?.strengths}</p>
                <p className={`text-xs ${c.textMuted}`}><span className={c.error}>✗</span> {daResult.user_score?.weaknesses}</p>
              </div>
              <div className="p-4">
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${c.textMuted}`}>Counter</p>
                <div className={`text-3xl font-black mb-2 ${(daResult.counter_score?.accuracy || 0) >= 60 ? c.success : c.error}`}>{daResult.counter_score?.accuracy}%</div>
                <p className={`text-xs mb-0.5 ${c.textSecondary}`}><span className={c.success}>✓</span> {daResult.counter_score?.strengths}</p>
                <p className={`text-xs ${c.textMuted}`}><span className={c.error}>✗</span> {daResult.counter_score?.weaknesses}</p>
              </div>
            </div>

            <div className="px-6 py-4 space-y-3">
              <p className={`text-sm leading-relaxed ${c.textSecondary}`}>{daResult.explanation}</p>
              {daResult.the_nuance && <div className={`p-3 rounded-xl border ${c.cardAlt}`}><p className={`text-xs font-bold uppercase tracking-wider mb-1 ${c.accent}`}>The Key Insight</p><p className={`text-sm ${c.text}`}>{daResult.the_nuance}</p></div>}
              {daResult.recommendation && <div className={`p-3 rounded-xl ${isDark ? 'bg-blue-900/10 border border-blue-800/50' : 'bg-blue-50 border border-blue-200'}`}><p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>💡 What to Consider</p><p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>{daResult.recommendation}</p></div>}
              <SourcesList sources={daResult.sources} />
            </div>
            <div className={`px-6 py-3 border-t flex items-center justify-between ${c.border}`}>
              <CopyBtn content={`😈 Devil's Advocate: ${daResult.verdict_headline}\n\n${daResult.explanation}\n\n— Generated by DeftBrain · deftbrain.com`} label="Copy" />
              <button onClick={() => { resetAll(); setMode(null); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${c.btnSecondary}`}><span>🔄</span> New</button>
            </div>
          </div>
        )}

        {/* ═══════ LOCAL TRIVIA QUESTION ═══════ */}
        {triviaQuestion && !triviaFinished && !mpMode && (
          <div className={`rounded-2xl overflow-hidden border-2 shadow-lg ${isDark ? 'border-purple-700/50 bg-zinc-800' : 'border-purple-300 bg-white'}`}>
            <div className={`px-6 py-4 ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'} border-b ${c.border}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>⚡ Trivia Night</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-purple-100 text-purple-500'}`}>{triviaQuestion.category_label || 'General'}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-slate-100 text-slate-600'}`}>Q{questionCount + (triviaRevealed ? 0 : 1)}/{roundLimit} · {triviaQuestion.difficulty_actual || triviaDifficulty}</span>
              </div>
              <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-zinc-700' : 'bg-slate-200'}`}>
                <div className="h-full rounded-full bg-purple-500 transition-all duration-500" style={{ width: `${(questionCount / roundLimit) * 100}%` }} />
              </div>
              {teams.length > 1 && <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg mt-2 ${isDark ? 'bg-purple-900/30' : 'bg-purple-100'}`}><span>👥</span><span className={`text-sm font-bold ${isDark ? 'text-purple-200' : 'text-purple-800'}`}>{teams[activeTeamIdx]?.name}&apos;s turn</span></div>}
              {teams.length === 1 && questionCount > 0 && (() => { const fb = getSoloFeedback(teams[0].score, questionCount, teams[0].streak); return <div className={`flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'}`}><span>{fb.emoji}</span><span className={`text-xs font-bold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>{fb.text}</span><span className={`ml-auto text-xs font-bold ${c.accent}`}>{teams[0].score}/{questionCount} ({Math.round((teams[0].score / questionCount) * 100)}%)</span></div>; })()}
            </div>
            {teams.length > 1 && <div className={`px-6 py-2 border-b ${c.border} flex gap-2 overflow-x-auto`}>{teams.map((team, idx) => <div key={idx} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${idx === activeTeamIdx && !triviaRevealed ? isDark ? 'bg-purple-900/20 border border-purple-700 text-purple-300' : 'bg-purple-50 border border-purple-300 text-purple-700' : isDark ? 'bg-zinc-700/50 text-zinc-300' : 'bg-slate-50 text-slate-600'}`}><span>{team.name}</span><span className={`font-black ${c.accent}`}>{team.score}</span>{team.streak >= 3 && <span>🔥{team.streak}</span>}</div>)}</div>}
            <div className="px-6 py-5">
              <h3 className={`text-lg font-bold mb-5 ${c.text}`}>{triviaQuestion.question}</h3>
              <div className="space-y-2">
                {triviaQuestion.options?.map((option, idx) => (
                  <TriviaOption key={idx} option={option} idx={idx} isSelected={selectedAnswer === idx} isCorrect={idx === triviaQuestion.correct_index} revealed={triviaRevealed} onClick={() => handleTriviaAnswer(idx)} disabled={triviaRevealed} />
                ))}
              </div>
              {triviaRevealed && <div className={`mt-4 p-4 rounded-xl border ${c.cardAlt}`}><p className={`text-xs font-bold uppercase tracking-wider mb-1 ${c.accent}`}>{selectedAnswer === triviaQuestion.correct_index ? `🎉 ${teams[activeTeamIdx]?.name || 'You'} got it!` : `😬 Not quite${teams.length > 1 ? `, ${teams[activeTeamIdx]?.name}` : ''}...`}</p><p className={`text-sm ${c.textSecondary}`}>{triviaQuestion.explanation}</p></div>}
            </div>
            {triviaRevealed && (
              <div className={`px-6 py-3 border-t flex items-center justify-between ${c.border}`}>
                <div className="flex items-center gap-3">{teams.length === 1 ? <span className={`text-sm font-bold ${c.text}`}>{teams[0].score}/{questionCount}</span> : <span className={`text-xs ${c.textMuted}`}>{teams.map(t => `${t.name}: ${t.score}`).join(' · ')}</span>}</div>
                <div className="flex gap-2">
                  <button onClick={() => setShowChallenge(!showChallenge)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${c.btnSecondary}`}><span>💬</span> Actually...</button>
                  <button onClick={advanceTrivia} disabled={loading} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isDark ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}>
                    {loading ? <span className="animate-spin inline-block">⏳</span> : <span>→</span>} {questionCount >= roundLimit ? 'See Results' : teams.length > 1 ? `${teams[(activeTeamIdx + 1) % teams.length]?.name}'s turn` : 'Next'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════ LOCAL TRIVIA ENDGAME ═══════ */}
        {triviaFinished && !mpMode && (
          <div className={`rounded-2xl overflow-hidden border-2 shadow-lg ${isDark ? 'border-purple-700/50 bg-zinc-800' : 'border-purple-300 bg-white'}`}>
            <div className={`px-6 py-8 text-center ${isDark ? 'bg-purple-900/20' : 'bg-gradient-to-b from-purple-50 to-white'}`}>
              <span className="text-5xl block mb-3">🏆</span>
              <p className={`text-xs font-black uppercase tracking-widest mb-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>Trivia Night Champion</p>
              {(() => { const sorted = [...teams].sort((a, b) => b.score - a.score); const isTie = sorted.length > 1 && sorted[0].score === sorted[1].score; return <h2 className={`text-2xl font-black ${c.text}`}>{isTie ? "It's a Tie!" : `${sorted[0].name} Wins!`}</h2>; })()}
              <p className={`text-sm mt-1 ${c.textMuted}`}>{questionCount} rounds · {TRIVIA_CATEGORIES.find(ct => ct.id === triviaCategory)?.label || 'General'} · {triviaDifficulty}</p>
            </div>
            <div className={`px-6 py-4 border-t ${c.border} space-y-3`}>
              {[...teams].sort((a, b) => b.score - a.score).map((team, rank) => {
                const total = teams.length > 1 ? Math.ceil(questionCount / teams.length) : questionCount;
                const pct = total > 0 ? Math.round((team.score / total) * 100) : 0;
                return (
                  <div key={team.name} className={`p-4 rounded-xl border ${rank === 0 ? isDark ? 'bg-purple-900/10 border-purple-700/50' : 'bg-purple-50 border-purple-200' : c.cardAlt}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2"><span className="text-lg">{rank === 0 ? '🥇' : rank === 1 ? '🥈' : '🥉'}</span><span className={`text-sm font-bold ${c.text}`}>{team.name}</span></div>
                      <span className={`text-2xl font-black ${rank === 0 ? c.accent : c.textSecondary}`}>{team.score}/{total}</span>
                    </div>
                    <div className="flex items-center gap-4"><div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-zinc-700' : 'bg-slate-100'}`}><div className={`h-full rounded-full transition-all duration-700 ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} /></div><span className={`text-xs font-bold ${c.textSecondary}`}>{pct}%</span></div>
                    {(team.bestStreak || 0) >= 2 && <p className={`text-xs mt-1.5 ${c.textMuted}`}>🔥 Best streak: {team.bestStreak}</p>}
                  </div>
                );
              })}
            </div>
            {Object.keys(categoryBreakdown).length > 0 && <div className={`px-6 py-4 border-t ${c.border}`}><p className={`text-xs font-bold uppercase tracking-wider mb-3 ${c.textMuted}`}>By Category</p><div className="grid grid-cols-2 gap-2">{Object.entries(categoryBreakdown).map(([cat, data]) => <div key={cat} className={`p-2.5 rounded-lg border text-center ${c.cardAlt}`}><p className={`text-xs font-semibold ${c.text}`}>{cat}</p><p className={`text-lg font-black ${data.correct === data.total ? c.success : c.textSecondary}`}>{data.correct}/{data.total}</p></div>)}</div></div>}
            <div className={`px-6 py-3 border-t flex items-center justify-between ${c.border}`}>
              <div className="flex gap-1.5"><ShareBtn content={buildTriviaShareText()} title="Trivia Night Results" /><CopyBtn content={buildTriviaShareText()} label="Copy" /></div>
              <div className="flex gap-2">
                <button onClick={() => { setTriviaFinished(false); setTeams(prev => prev.map(t => ({ ...t, score: 0, streak: 0, bestStreak: 0 }))); setQuestionCount(0); setActiveTeamIdx(0); setPreviousQuestions([]); setCategoryBreakdown({}); setTriviaSetup(false); handleTrivia(); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isDark ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}><span>🔄</span> Rematch</button>
                <button onClick={resetTrivia} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${c.btnSecondary}`}><span>⚡</span> New Game</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════ CHALLENGE PANEL ═══════ */}
        {showChallenge && (
          <div className={`rounded-2xl p-5 border space-y-3 ${c.card}`}>
            <h4 className={`text-sm font-bold flex items-center gap-2 ${c.text}`}><span className={c.accent}>💬</span>Think we got it wrong?</h4>
            <textarea value={challengeText} onChange={(e) => setChallengeText(e.target.value)} placeholder="Tell us why..." rows={2} className={`w-full px-4 py-3 rounded-xl border-2 text-sm resize-none transition-all focus:outline-none focus:ring-2 ${c.input}`} />
            <button onClick={handleChallenge} disabled={loading || !challengeText.trim()} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 ${c.btnPrimary}`}>{loading ? <span className="animate-spin inline-block">⏳</span> : 'Submit Challenge'}</button>
            {challengeResult && (
              <div className={`p-4 rounded-xl border ${challengeResult.challenge_valid === true ? isDark ? 'bg-green-900/10 border-green-800/50' : 'bg-green-50 border-green-200' : challengeResult.challenge_valid === 'partially' ? isDark ? 'bg-amber-900/10 border-amber-800/50' : 'bg-amber-50 border-amber-200' : isDark ? 'bg-red-900/10 border-red-800/50' : 'bg-red-50 border-red-200'}`}>
                <p className={`text-sm font-bold mb-1 ${c.text}`}>{challengeResult.ruling}</p>
                <p className={`text-sm ${c.textSecondary}`}>{challengeResult.explanation}</p>
                {challengeResult.definitive_answer && <p className={`text-sm font-semibold mt-2 ${c.text}`}>Final answer: {challengeResult.definitive_answer}</p>}
              </div>
            )}
          </div>
        )}

        {/* ═══════ APPEAL COURT ═══════ */}
        {showAppeal && result?._mode === 'dispute' && (
          <div className={`rounded-2xl p-5 border space-y-3 ${c.card}`}>
            <h4 className={`text-sm font-bold flex items-center gap-2 ${c.text}`}><span>🏛️</span> Appeal Court</h4>
            <p className={`text-xs ${c.textSecondary}`}>Present new evidence or arguments to challenge the verdict. Appeals are judged more rigorously.</p>
            <textarea value={appealEvidence} onChange={(e) => setAppealEvidence(e.target.value)} placeholder="New evidence or arguments for your appeal..." rows={3} className={`w-full px-4 py-3 rounded-xl border-2 text-sm resize-none transition-all focus:outline-none focus:ring-2 ${c.input}`} />
            <button onClick={handleAppeal} disabled={appealLoading || !appealEvidence.trim()} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 ${c.btnPrimary}`}>{appealLoading ? <span className="animate-spin inline-block">⏳</span> : 'File Appeal'}</button>

            {appealResult && (
              <div className={`p-4 rounded-xl border space-y-3 ${
                appealResult.appeal_ruling === 'overturned' ? isDark ? 'bg-green-900/10 border-green-800/50' : 'bg-green-50 border-green-200'
                : appealResult.appeal_ruling === 'modified' ? isDark ? 'bg-amber-900/10 border-amber-800/50' : 'bg-amber-50 border-amber-200'
                : isDark ? 'bg-red-900/10 border-red-800/50' : 'bg-red-50 border-red-200'
              }`}>
                <div className="text-center">
                  <span className="text-2xl">{appealResult.appeal_ruling === 'overturned' ? '⚖️' : appealResult.appeal_ruling === 'modified' ? '📝' : '🔨'}</span>
                  <p className={`text-lg font-black mt-1 ${c.text}`}>{appealResult.ruling_headline}</p>
                </div>
                {appealResult.new_evidence_assessment && <p className={`text-sm ${c.textSecondary}`}><span className="font-bold">Evidence assessment:</span> {appealResult.new_evidence_assessment}</p>}
                <p className={`text-sm ${c.textSecondary}`}>{appealResult.explanation}</p>
                {appealResult.updated_scores && (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(appealResult.updated_scores).map((p, i) => (
                      <div key={i} className={`p-2 rounded-lg border text-center ${c.cardAlt}`}>
                        <p className={`text-xs font-bold ${c.text}`}>{p.name}</p>
                        <p className={`text-xs ${c.textMuted}`}>{p.original_accuracy}% → <span className="font-bold">{p.revised_accuracy}%</span></p>
                      </div>
                    ))}
                  </div>
                )}
                {appealResult.final_answer && <div className={`p-3 rounded-lg border ${c.cardAlt}`}><p className={`text-xs font-bold ${c.accent}`}>Final Answer</p><p className={`text-sm font-semibold ${c.text}`}>{appealResult.final_answer}</p></div>}
                {appealResult.case_closed && <p className={`text-sm font-bold italic text-center ${c.accent}`}>"{appealResult.case_closed}"</p>}
                <SourcesList sources={appealResult.sources} />
              </div>
            )}
          </div>
        )}

        {/* ═══════ FOLLOW-UP SECTION ═══════ */}
        {result && !showChallenge && !showAppeal && result._mode !== 'trivia' && (
          <div className={`rounded-2xl border p-5 space-y-3 ${c.card}`}>
            <h4 className={`text-sm font-bold flex items-center gap-2 ${c.text}`}><span>💬</span> Want to dig deeper?</h4>
            <div className="flex gap-2">
              <input value={followUpText} onChange={(e) => setFollowUpText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !followUpLoading && handleFollowUp()} placeholder="But what about..." className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm transition-all focus:outline-none focus:ring-2 ${c.input}`} />
              <button onClick={handleFollowUp} disabled={followUpLoading || !followUpText.trim()} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 ${c.btnPrimary}`}>{followUpLoading ? <span className="animate-spin inline-block">⏳</span> : '→'}</button>
            </div>
            {followUpResults.map((fu, i) => (
              <div key={i} className={`p-4 rounded-xl border space-y-2 ${c.cardAlt}`}>
                <p className={`text-xs font-bold ${c.accent}`}>💬 {fu.question}</p>
                <p className={`text-sm font-bold ${c.text}`}>{fu.result.answer}</p>
                <p className={`text-sm ${c.textSecondary}`}>{fu.result.explanation}</p>
                {fu.result.changes_original && <div className={`p-2.5 rounded-lg border ${isDark ? 'bg-amber-900/10 border-amber-800/50' : 'bg-amber-50 border-amber-200'}`}><p className={`text-xs font-bold mb-0.5 ${c.accent}`}>⚠️ Updates original answer</p><p className={`text-xs ${c.textSecondary}`}>{fu.result.changes_original}</p></div>}
                {fu.result.supporting_facts?.length > 0 && fu.result.supporting_facts.map((f, j) => <p key={j} className={`text-xs ${c.textSecondary}`}>• {f}</p>)}
                <SourcesList sources={fu.result.sources} />
              </div>
            ))}
          </div>
        )}

        {/* ═══════ NAVIGATION ═══════ */}
        {(result || daResult || triviaQuestion) && !showChallenge && !showAppeal && mode !== 'trivia' && !triviaFinished && (
          <button onClick={() => { resetAll(); setMode(null); }} className={`w-full py-2 text-center text-sm font-semibold ${c.textMuted} transition-colors`}>← Choose a different mode</button>
        )}
        {mode === 'trivia' && triviaQuestion && !triviaFinished && !mpMode && (
          <button onClick={resetTrivia} className={`w-full py-2 text-center text-sm font-semibold ${c.textMuted} transition-colors`}>← End trivia session</button>
        )}

        {/* Cross-references */}
        {!result && !daResult && !triviaQuestion && !triviaFinished && !mpMode && (
          <div className={`text-center py-4 ${c.textMuted}`}>
            <p className="text-xs">
              Need a creative debate topic? Try <a href="/tool/BrainRoulette" target="_blank" rel="noopener noreferrer" className={`font-semibold underline ${c.accent}`}>Brain Roulette</a>
              {' '}· Drafting an argument? <a href="/tool/JargonAssassin" target="_blank" rel="noopener noreferrer" className={`font-semibold underline ${c.accent}`}>Jargon Assassin</a> can sharpen it
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

TheFinalWord.displayName = 'TheFinalWord';
export default TheFinalWord;
