import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Globe, Book, Loader2, Play, Copy, Heart, AlertCircle, Save, Bookmark, X, Mic, Square, Pause, RotateCcw, Zap, Award, Calendar, Users, Languages, Info, CheckCircle } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

const NameAnxietyDestroyer = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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

  // Form state
  const [nameToLearn, setNameToLearn] = useState('');
  const [context, setContext] = useState('');
  const [userLanguage, setUserLanguage] = useState('English (American)');
  
  // Results state
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  
  // Display preferences
  const [showIPA, setShowIPA] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(0.8);
  const [showEtymology, setShowEtymology] = useState(false);
  
  // Audio state
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioSupported, setAudioSupported] = useState(false);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [recordingPlayback, setRecordingPlayback] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingSupported, setRecordingSupported] = useState(false);
  
  // Practice mode state
  const [practiceMode, setPracticeMode] = useState(null); // 'syllable' | 'repetition' | 'speed'
  const [practiceCount, setPracticeCount] = useState(0);
  const [currentSyllable, setCurrentSyllable] = useState(0);
  
  // Saved names state
  const [savedNames, setSavedNames] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  
  // Refs
  const audioRef = useRef(null);
  const recordedAudioRef = useRef(null);
  
  // Check for audio support
  useEffect(() => {
    setAudioSupported('speechSynthesis' in window);
    setRecordingSupported('MediaRecorder' in window && navigator.mediaDevices);
  }, []);
  
  // Load saved names from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('saved-names');
    if (saved) {
      try {
        setSavedNames(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved names:', e);
      }
    }
  }, []);

  const userLanguageOptions = [
    'English (American)',
    'English (British)',
    'English (Australian)',
    'Spanish',
    'French',
    'German',
    'Italian',
    'Portuguese',
    'Mandarin Chinese',
    'Japanese',
    'Korean',
    'Arabic',
    'Hindi',
    'Russian',
    'Other'
  ];

  // Theme-aware colors
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-gradient-to-br from-emerald-50 to-purple-50',
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-emerald-200',
    cardAlt: isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-emerald-50 border-emerald-200',
    
    input: isDark 
      ? 'bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:border-purple-500 focus:ring-purple-500/20'
      : 'bg-white border-emerald-300 text-emerald-900 placeholder:text-emerald-400 focus:border-emerald-600 focus:ring-emerald-100',
    
    text: isDark ? 'text-zinc-50' : 'text-emerald-900',
    textSecondary: isDark ? 'text-zinc-400' : 'text-emerald-700',
    textMuted: isDark ? 'text-zinc-500' : 'text-emerald-600',
    label: isDark ? 'text-zinc-300' : 'text-emerald-800',
    
    accent: isDark ? 'text-purple-400' : 'text-emerald-600',
    accentBg: isDark ? 'bg-purple-600' : 'bg-emerald-600',
    
    btnPrimary: isDark
      ? 'bg-purple-600 hover:bg-purple-700 text-white'
      : 'bg-emerald-600 hover:bg-emerald-700 text-white',
    btnSecondary: isDark
      ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-50'
      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900',
    btnOutline: isDark
      ? 'border-zinc-600 hover:border-zinc-500 text-zinc-300'
      : 'border-emerald-300 hover:border-emerald-400 text-emerald-700',
    
    infoBox: isDark
      ? 'bg-blue-900/20 border-blue-700 text-blue-200'
      : 'bg-blue-50 border-blue-200 text-blue-900',
    successBox: isDark
      ? 'bg-emerald-900/20 border-emerald-700 text-emerald-200'
      : 'bg-emerald-50 border-emerald-200 text-emerald-800',
    errorBox: isDark
      ? 'bg-red-900/20 border-red-700 text-red-200'
      : 'bg-red-50 border-red-200 text-red-800',
    warningBox: isDark
      ? 'bg-amber-900/20 border-amber-700 text-amber-200'
      : 'bg-amber-50 border-amber-200 text-amber-900',
    recordingBox: isDark
      ? 'bg-red-900/20 border-red-600'
      : 'bg-red-50 border-red-300',
  };

  const handleGenerate = async () => {
    if (!nameToLearn.trim()) {
      setError('Please enter a name to learn');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('name-anxiety-destroyer', {
        nameToLearn: nameToLearn.trim(),
        context: context.trim() || null,
        userLanguage,
        includeIPA: true,
        includeEtymology: true,
        includeFamousBearers: true,
        includeRegionalVariations: true
      });
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze pronunciation. Please try again.');
    }
  };

  const playAudio = (speed = playbackSpeed) => {
    if (!audioSupported || !nameToLearn) return;

    setAudioPlaying(true);

    const utterance = new SpeechSynthesisUtterance(nameToLearn);
    utterance.rate = speed;
    utterance.pitch = 1.0;
    
    utterance.onend = () => setAudioPlaying(false);
    utterance.onerror = () => setAudioPlaying(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const startRecording = async () => {
    if (!recordingSupported) {
      setError('Recording not supported in your browser');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Detect best supported MIME type
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
      }
      
      console.log('Recording with MIME type:', mimeType);
      
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const audioUrl = URL.createObjectURL(blob);
        setRecordedAudio(audioUrl);
        stream.getTracks().forEach(track => track.stop());
        console.log('Recording saved, size:', blob.size, 'bytes');
      };
      
      recorder.onerror = (e) => {
        console.error('Recording error:', e);
        setError('Recording failed. Please try again.');
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setError(''); // Clear previous errors
    } catch (err) {
      setError('Failed to access microphone. Please grant permission.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const playRecording = () => {
    if (!recordedAudio || !recordedAudioRef.current) {
      console.error('No recording or audio element');
      return;
    }
    
    const audio = recordedAudioRef.current;
    
    // Reset audio element
    audio.pause();
    audio.currentTime = 0;
    
    // Set source if not already set
    if (audio.src !== recordedAudio) {
      audio.src = recordedAudio;
    }
    
    // Load and play with error handling
    audio.load();
    
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setRecordingPlayback(true);
          console.log('Playback started');
        })
        .catch(err => {
          console.error('Playback error:', err);
          setError('Cannot play recording. Try recording again or use a different browser (Chrome recommended).');
          setRecordingPlayback(false);
        });
    }
  };

  const deleteRecording = () => {
    // Stop playback if playing
    if (recordedAudioRef.current) {
      recordedAudioRef.current.pause();
      recordedAudioRef.current.currentTime = 0;
      recordedAudioRef.current.src = '';
    }
    
    // Revoke blob URL to free memory
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio);
    }
    
    setRecordedAudio(null);
    setRecordingPlayback(false);
  };

  // Practice Mode: Syllable Practice
  const startSyllablePractice = () => {
    setPracticeMode('syllable');
    setCurrentSyllable(0);
    setPracticeCount(0);
  };

  const nextSyllable = () => {
    if (results?.pronunciation?.syllable_breakdown) {
      const next = (currentSyllable + 1) % results.pronunciation.syllable_breakdown.length;
      setCurrentSyllable(next);
      setPracticeCount(prev => prev + 1);
    }
  };

  // Practice Mode: Repetition
  const startRepetitionPractice = () => {
    setPracticeMode('repetition');
    setPracticeCount(0);
  };

  const practiceRepetition = () => {
    playAudio();
    setPracticeCount(prev => prev + 1);
  };

  // Practice Mode: Speed Variations
  const startSpeedPractice = () => {
    setPracticeMode('speed');
    setPracticeCount(0);
  };

  const saveName = () => {
    if (!results) return;

    const nameData = {
      name: nameToLearn,
      phonetic: results.pronunciation.phonetic_spelling,
      ipa: results.pronunciation.ipa_notation,
      origin: results.name_analysis.origin,
      savedAt: new Date().toISOString()
    };

    const updated = [nameData, ...savedNames.filter(n => n.name !== nameToLearn)].slice(0, 20);
    setSavedNames(updated);
    localStorage.setItem('saved-names', JSON.stringify(updated));
  };

  const loadSavedName = (name) => {
    setNameToLearn(name.name);
    setShowSaved(false);
  };

  const removeSavedName = (nameToRemove) => {
    const updated = savedNames.filter(n => n.name !== nameToRemove);
    setSavedNames(updated);
    localStorage.setItem('saved-names', JSON.stringify(updated));
  };

  const copyPhonetic = async () => {
    if (!results?.pronunciation?.phonetic_spelling) return;
    try {
      const text = showIPA ? results.pronunciation.ipa_notation : results.pronunciation.phonetic_spelling;
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleReset = () => {
    setNameToLearn('');
    setContext('');
    setResults(null);
    setError('');
    setPracticeMode(null);
    setPracticeCount(0);
    setRecordedAudio(null);
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className={`${c.card} border rounded-xl shadow-sm p-6 transition-colors duration-200`}>
        
        {/* Header with icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-lg ${isDark ? 'bg-purple-900/30' : 'bg-emerald-100'}`}>
            <Volume2 className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-emerald-600'}`} />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${c.text}`}>Learn Any Name</h2>
            <p className={`text-sm ${c.textMuted}`}>With respect, confidence, and cultural awareness</p>
          </div>
        </div>

        {/* Name Input */}
        <div className="mb-6">
          <label htmlFor="name-input" className={`block text-sm font-medium ${c.label} mb-2`}>
            What name do you want to learn?
          </label>
          <input
            id="name-input"
            type="text"
            value={nameToLearn}
            onChange={(e) => setNameToLearn(e.target.value)}
            placeholder="e.g., Xiomara, Saoirse, Nguyen, Rajesh"
            className={`w-full p-4 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200 text-lg`}
            aria-required="true"
            onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
          />
        </div>

        {/* Context Input */}
        <div className="mb-6">
          <label htmlFor="context-input" className={`block text-sm font-medium ${c.label} mb-2`}>
            Context (optional but helpful)
          </label>
          <input
            id="context-input"
            type="text"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g., Irish colleague, Vietnamese friend, Spanish name, etc."
            className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200`}
          />
        </div>

        {/* User Language */}
        <div className="mb-6">
          <label htmlFor="user-language" className={`block text-sm font-medium ${c.label} mb-2`}>
            Your native language/accent
          </label>
          <select
            id="user-language"
            value={userLanguage}
            onChange={(e) => setUserLanguage(e.target.value)}
            className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200`}
          >
            {userLanguageOptions.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleGenerate}
            disabled={loading || !nameToLearn.trim()}
            className={`flex-1 ${c.btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing pronunciation...
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5" />
                Learn Pronunciation
              </>
            )}
          </button>

          {savedNames.length > 0 && (
            <button
              onClick={() => setShowSaved(!showSaved)}
              className={`px-4 py-3 border-2 ${c.btnOutline} font-medium rounded-lg transition-all duration-200 flex items-center gap-2`}
            >
              <Bookmark className="w-5 h-5" />
              {savedNames.length}
            </button>
          )}

          {results && (
            <button
              onClick={handleReset}
              className={`px-6 py-3 border-2 ${c.btnOutline} font-medium rounded-lg transition-all duration-200`}
            >
              New Name
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className={`mt-4 p-4 ${c.errorBox} border rounded-lg flex items-start gap-3 transition-colors duration-200`} role="alert">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Info Box */}
        <div className={`mt-4 p-4 ${c.infoBox} border-l-4 rounded-r-lg transition-colors duration-200`}>
          <p className="text-sm">
            <strong>💙 Remember:</strong> Making the effort to pronounce someone's name correctly is a sign of respect. 
            It's okay to ask for help, and it's okay to practice!
          </p>
        </div>
      </div>

      {/* Saved Names Sidebar */}
      {showSaved && savedNames.length > 0 && (
        <div className={`${c.card} border rounded-xl shadow-sm p-6 transition-colors duration-200`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-semibold ${c.text} flex items-center gap-2`}>
              <Bookmark className="w-5 h-5" />
              Saved Names ({savedNames.length})
            </h3>
            <button onClick={() => setShowSaved(false)} className={`${c.textMuted} hover:${c.text}`}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            {savedNames.map((name, idx) => (
              <div 
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-emerald-50 hover:bg-emerald-100'} transition-colors cursor-pointer`}
              >
                <div onClick={() => loadSavedName(name)} className="flex-1">
                  <div className={`font-medium ${c.text}`}>{name.name}</div>
                  <div className={`text-sm ${c.textMuted}`}>{name.phonetic}</div>
                  <div className={`text-xs ${c.textMuted}`}>{name.origin}</div>
                </div>
                <button
                  onClick={() => removeSavedName(name.name)}
                  className={`p-2 rounded hover:bg-red-100 ${isDark ? 'hover:bg-red-900/30' : ''} transition-colors`}
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results Display */}
      {results && (
        <div className="space-y-6">
          
          {/* Main Pronunciation Card */}
          <div className={`${c.card} border-2 rounded-xl shadow-lg p-8 transition-colors duration-200`}>
            
            {/* Name Analysis Header */}
            <div className="mb-6 text-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3 ${isDark ? 'bg-purple-900/30' : 'bg-emerald-100'}`}>
                <Globe className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-emerald-600'}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-purple-400' : 'text-emerald-600'}`}>
                  {results.name_analysis.origin}
                </span>
              </div>
              
              <h2 className={`text-4xl font-bold mb-2 ${c.text}`}>
                {results.name_analysis.name}
              </h2>
              
              {results.name_analysis.meaning && (
                <p className={`text-lg ${c.textSecondary} italic`}>
                  Meaning: {results.name_analysis.meaning}
                </p>
              )}
            </div>

            {/* Phonetic Display with IPA Toggle */}
            <div className={`${isDark ? 'bg-purple-900/20 border-purple-700' : 'bg-emerald-50 border-emerald-300'} border-2 rounded-xl p-6 mb-6 transition-colors duration-200`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`text-sm font-semibold uppercase tracking-wide ${isDark ? 'text-purple-400' : 'text-emerald-600'}`}>
                    How to Say It
                  </div>
                  {results.pronunciation.ipa_notation && (
                    <button
                      onClick={() => setShowIPA(!showIPA)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        showIPA 
                          ? isDark ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white'
                          : isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-emerald-200 text-emerald-700'
                      }`}
                      title="Toggle IPA notation"
                    >
                      <Languages className="w-3 h-3 inline mr-1" />
                      {showIPA ? 'IPA' : 'Simple'}
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={copyPhonetic}
                    className={`p-2 rounded-lg ${c.btnSecondary} transition-all duration-200`}
                    title="Copy pronunciation"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {audioSupported && (
                    <button
                      onClick={() => playAudio()}
                      disabled={audioPlaying}
                      className={`p-2 rounded-lg ${c.btnPrimary} transition-all duration-200 disabled:opacity-50`}
                      title="Play audio"
                    >
                      {audioPlaying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              <div className={`text-3xl font-bold mb-3 ${isDark ? 'text-purple-200' : 'text-emerald-900'}`}>
                {showIPA && results.pronunciation.ipa_notation 
                  ? results.pronunciation.ipa_notation 
                  : results.pronunciation.phonetic_spelling}
              </div>
              
              {showIPA && results.pronunciation.ipa_notation && (
                <div className={`text-sm ${c.textMuted} mb-2`}>
                  <Info className="w-3 h-3 inline mr-1" />
                  International Phonetic Alphabet (IPA) - Linguistically precise
                </div>
              )}
              
              {results.pronunciation.sounds_like && (
                <div className={`text-sm ${c.textSecondary}`}>
                  <strong>Sounds like:</strong> {results.pronunciation.sounds_like}
                </div>
              )}
            </div>

            {/* Speed Control */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className={`text-sm font-medium ${c.label}`}>
                  Playback Speed
                </label>
                <span className={`text-sm ${c.textMuted}`}>{playbackSpeed}x</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setPlaybackSpeed(0.5); playAudio(0.5); }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    playbackSpeed === 0.5 ? c.btnPrimary : c.btnSecondary
                  }`}
                >
                  Slow (0.5x)
                </button>
                <button
                  onClick={() => { setPlaybackSpeed(0.8); playAudio(0.8); }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    playbackSpeed === 0.8 ? c.btnPrimary : c.btnSecondary
                  }`}
                >
                  Normal (0.8x)
                </button>
                <button
                  onClick={() => { setPlaybackSpeed(1.0); playAudio(1.0); }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    playbackSpeed === 1.0 ? c.btnPrimary : c.btnSecondary
                  }`}
                >
                  Fast (1.0x)
                </button>
              </div>
            </div>

            {/* Recording Feature */}
            {recordingSupported && (
              <div className={`mb-6 p-4 border rounded-xl ${isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-emerald-50 border-emerald-200'} transition-colors duration-200`}>
                <h3 className={`text-sm font-semibold ${c.text} mb-3 flex items-center gap-2`}>
                  <Mic className="w-4 h-4" />
                  Practice Recording
                </h3>
                
                <div className="flex gap-2 mb-3">
                  {!isRecording && !recordedAudio && (
                    <button
                      onClick={startRecording}
                      className={`flex-1 ${c.btnPrimary} py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2`}
                    >
                      <Mic className="w-4 h-4" />
                      Start Recording
                    </button>
                  )}
                  
                  {isRecording && (
                    <button
                      onClick={stopRecording}
                      className={`flex-1 ${c.recordingBox} border py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 animate-pulse`}
                    >
                      <Square className="w-4 h-4" />
                      Stop Recording
                    </button>
                  )}
                  
                  {recordedAudio && (
                    <>
                      <button
                        onClick={playRecording}
                        className={`flex-1 ${c.btnSecondary} py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2`}
                      >
                        <Play className="w-4 h-4" />
                        Play My Recording
                      </button>
                      <button
                        onClick={deleteRecording}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${isDark ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400' : 'bg-red-100 hover:bg-red-200 text-red-700'}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
                
                {recordedAudio && (
                  <audio 
                    ref={recordedAudioRef} 
                    src={recordedAudio}
                    onEnded={() => {
                      setRecordingPlayback(false);
                      console.log('Playback ended');
                    }}
                    onError={(e) => {
                      console.error('Audio playback error:', e.target.error);
                      setRecordingPlayback(false);
                      setError('Playback failed. Try recording in Chrome or refresh the page.');
                    }}
                    onLoadedData={() => console.log('Audio loaded successfully')}
                    preload="auto"
                  />
                )}
                
                {/* Status messages */}
                {isRecording && (
                  <div className={`text-xs ${isDark ? 'text-red-400' : 'text-red-600'} flex items-center gap-2 mb-2`}>
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    Recording in progress...
                  </div>
                )}
                
                {recordedAudio && !isRecording && (
                  <div className={`text-xs ${c.accent} flex items-center gap-2 mb-2`}>
                    <CheckCircle className="w-3 h-3" />
                    Recording ready to play
                  </div>
                )}
                
                <p className={`text-xs ${c.textMuted}`}>
                  💡 Record yourself saying the name, then listen back to compare
                </p>
              </div>
            )}

            {/* Syllable Breakdown */}
            <div className="mb-6">
              <h3 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${isDark ? 'text-purple-400' : 'text-emerald-600'}`}>
                Break It Down
              </h3>
              <div className="flex flex-wrap gap-2">
                {results.pronunciation.syllable_breakdown?.map((syllable, idx) => (
                  <div 
                    key={idx}
                    className={`px-4 py-2 rounded-lg text-xl font-medium transition-all cursor-pointer ${
                      practiceMode === 'syllable' && currentSyllable === idx
                        ? isDark ? 'bg-purple-500 text-white ring-2 ring-purple-400' : 'bg-emerald-500 text-white ring-2 ring-emerald-400'
                        : results.pronunciation.stress_pattern?.includes(String(idx + 1)) || 
                          results.pronunciation.stress_pattern?.toLowerCase().includes('first') && idx === 0 ||
                          results.pronunciation.stress_pattern?.toLowerCase().includes('second') && idx === 1
                          ? isDark ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white'
                          : isDark ? 'bg-zinc-700 text-zinc-200 hover:bg-zinc-600' : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                    }`}
                    onClick={() => {
                      if (audioSupported) {
                        const utterance = new SpeechSynthesisUtterance(syllable);
                        utterance.rate = 0.6;
                        window.speechSynthesis.speak(utterance);
                      }
                    }}
                    title="Click to hear this syllable"
                  >
                    {syllable}
                  </div>
                ))}
              </div>
              <p className={`text-sm ${c.textMuted} mt-2`}>
                <strong>Stress:</strong> {results.pronunciation.stress_pattern}
              </p>
              {results.pronunciation.stress_markers && (
                <p className={`text-xs ${c.textMuted} mt-1`}>
                  {results.pronunciation.stress_markers}
                </p>
              )}
            </div>

            {/* Practice Modes */}
            <div className="mb-6">
              <h3 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${isDark ? 'text-purple-400' : 'text-emerald-600'}`}>
                Practice Modes
              </h3>
              
              {!practiceMode && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={startSyllablePractice}
                    className={`${c.btnSecondary} p-4 rounded-lg transition-all hover:scale-105`}
                  >
                    <Zap className="w-5 h-5 mx-auto mb-2" />
                    <div className="font-medium">Syllable Practice</div>
                    <div className={`text-xs ${c.textMuted} mt-1`}>Focus on each part</div>
                  </button>
                  
                  <button
                    onClick={startRepetitionPractice}
                    className={`${c.btnSecondary} p-4 rounded-lg transition-all hover:scale-105`}
                  >
                    <RotateCcw className="w-5 h-5 mx-auto mb-2" />
                    <div className="font-medium">Repetition</div>
                    <div className={`text-xs ${c.textMuted} mt-1`}>Build muscle memory</div>
                  </button>
                  
                  <button
                    onClick={startSpeedPractice}
                    className={`${c.btnSecondary} p-4 rounded-lg transition-all hover:scale-105`}
                  >
                    <Zap className="w-5 h-5 mx-auto mb-2" />
                    <div className="font-medium">Speed Variations</div>
                    <div className={`text-xs ${c.textMuted} mt-1`}>Slow to fast</div>
                  </button>
                </div>
              )}
              
              {practiceMode === 'syllable' && (
                <div className={`p-4 ${isDark ? 'bg-purple-900/20' : 'bg-emerald-100'} rounded-lg`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`font-medium ${c.text}`}>
                      Syllable Practice: {currentSyllable + 1} / {results.pronunciation.syllable_breakdown?.length}
                    </div>
                    <button onClick={() => setPracticeMode(null)} className={`text-sm ${c.textMuted}`}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-center mb-3">
                    <div className={`text-4xl font-bold ${c.text}`}>
                      {results.pronunciation.syllable_breakdown?.[currentSyllable]}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={nextSyllable}
                      className={`flex-1 ${c.btnPrimary} py-2 rounded-lg font-medium`}
                    >
                      Next Syllable
                    </button>
                  </div>
                  <p className={`text-xs ${c.textMuted} mt-2 text-center`}>
                    Practice count: {practiceCount}
                  </p>
                </div>
              )}
              
              {practiceMode === 'repetition' && (
                <div className={`p-4 ${isDark ? 'bg-purple-900/20' : 'bg-emerald-100'} rounded-lg`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`font-medium ${c.text}`}>Repetition Practice</div>
                    <button onClick={() => setPracticeMode(null)} className={`text-sm ${c.textMuted}`}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={practiceRepetition}
                    className={`w-full ${c.btnPrimary} py-3 rounded-lg font-medium flex items-center justify-center gap-2`}
                  >
                    <Play className="w-5 h-5" />
                    Practice Again ({practiceCount})
                  </button>
                  <p className={`text-xs ${c.textMuted} mt-2 text-center`}>
                    Goal: 10+ repetitions for muscle memory
                  </p>
                </div>
              )}
              
              {practiceMode === 'speed' && (
                <div className={`p-4 ${isDark ? 'bg-purple-900/20' : 'bg-emerald-100'} rounded-lg`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`font-medium ${c.text}`}>Speed Variation Practice</div>
                    <button onClick={() => setPracticeMode(null)} className={`text-sm ${c.textMuted}`}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => { playAudio(0.5); setPracticeCount(prev => prev + 1); }}
                      className={`w-full ${c.btnSecondary} py-2 rounded-lg font-medium`}
                    >
                      Very Slow (0.5x)
                    </button>
                    <button
                      onClick={() => { playAudio(0.7); setPracticeCount(prev => prev + 1); }}
                      className={`w-full ${c.btnSecondary} py-2 rounded-lg font-medium`}
                    >
                      Slow (0.7x)
                    </button>
                    <button
                      onClick={() => { playAudio(1.0); setPracticeCount(prev => prev + 1); }}
                      className={`w-full ${c.btnSecondary} py-2 rounded-lg font-medium`}
                    >
                      Normal Speed (1.0x)
                    </button>
                  </div>
                  <p className={`text-xs ${c.textMuted} mt-2 text-center`}>
                    Practices: {practiceCount}
                  </p>
                </div>
              )}
            </div>

            {/* Common Mistakes */}
            {results.pronunciation.common_mistakes && results.pronunciation.common_mistakes.length > 0 && (
              <div className="mb-6">
                <h3 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${isDark ? 'text-purple-400' : 'text-emerald-600'}`}>
                  Common Mistakes to Avoid
                </h3>
                <div className="space-y-3">
                  {results.pronunciation.common_mistakes.map((mistake, idx) => (
                    <div 
                      key={idx}
                      className={`p-4 rounded-lg border ${isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-red-50 border-red-200'} transition-colors duration-200`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <span className="text-red-500 font-bold">✗</span>
                        <div className="flex-1">
                          <div className={`font-medium ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                            "{mistake.wrong}"
                          </div>
                          <div className={`text-sm ${c.textSecondary} mt-1`}>
                            {mistake.why_wrong}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 ml-6">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <div className={`font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                          {mistake.correction}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regional Variations */}
            {results.pronunciation.regional_variations && results.pronunciation.regional_variations.length > 0 && (
              <div className="mb-6">
                <h3 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${isDark ? 'text-purple-400' : 'text-emerald-600'}`}>
                  Regional Variations
                </h3>
                <div className="space-y-2">
                  {results.pronunciation.regional_variations.map((variation, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-emerald-50'}`}
                    >
                      <div className={`font-medium ${c.text}`}>{variation.region}</div>
                      <div className={`text-sm ${c.textSecondary}`}>{variation.pronunciation}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={saveName}
              className={`w-full ${c.btnSecondary} py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2`}
            >
              <Save className="w-5 h-5" />
              Save This Name
            </button>
          </div>

          {/* Etymology & Cultural Deep-Dive */}
          {results.etymology && (
            <div className={`${c.card} border rounded-xl shadow-sm p-6 transition-colors duration-200`}>
              <button
                onClick={() => setShowEtymology(!showEtymology)}
                className="w-full flex items-center justify-between mb-4"
              >
                <h3 className={`font-semibold ${c.text} flex items-center gap-2`}>
                  <Book className="w-5 h-5 text-amber-500" />
                  Name Origins & Cultural Deep-Dive
                </h3>
                <span className={`transform transition-transform ${showEtymology ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>
              
              {showEtymology && (
                <div className="space-y-4">
                  {/* Etymology */}
                  {results.etymology.historical_origin && (
                    <div>
                      <h4 className={`text-sm font-semibold ${c.label} mb-2`}>Historical Origin</h4>
                      <p className={`${c.textSecondary}`}>{results.etymology.historical_origin}</p>
                    </div>
                  )}
                  
                  {/* Linguistic Evolution */}
                  {results.etymology.linguistic_evolution && (
                    <div>
                      <h4 className={`text-sm font-semibold ${c.label} mb-2`}>Linguistic Evolution</h4>
                      <p className={`${c.textSecondary}`}>{results.etymology.linguistic_evolution}</p>
                    </div>
                  )}
                  
                  {/* Famous Bearers */}
                  {results.etymology.famous_bearers && results.etymology.famous_bearers.length > 0 && (
                    <div>
                      <h4 className={`text-sm font-semibold ${c.label} mb-2 flex items-center gap-2`}>
                        <Award className="w-4 h-4" />
                        Famous People with This Name
                      </h4>
                      <ul className="space-y-2">
                        {results.etymology.famous_bearers.map((person, idx) => (
                          <li key={idx} className={`flex items-start gap-2 ${c.textSecondary}`}>
                            <Users className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{person}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Name Day */}
                  {results.etymology.name_day && (
                    <div>
                      <h4 className={`text-sm font-semibold ${c.label} mb-2 flex items-center gap-2`}>
                        <Calendar className="w-4 h-4" />
                        Name Day Celebration
                      </h4>
                      <p className={`${c.textSecondary}`}>{results.etymology.name_day}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Cultural Context */}
          {results.cultural_context && (
            <div className={`${c.card} border rounded-xl shadow-sm p-6 transition-colors duration-200`}>
              <h3 className={`font-semibold ${c.text} mb-4 flex items-center gap-2`}>
                <Globe className="w-5 h-5 text-blue-500" />
                Cultural Context & Etiquette
              </h3>
              
              <div className="space-y-4">
                {results.cultural_context.name_order && (
                  <div>
                    <span className={`text-sm font-medium ${c.label}`}>Name Order:</span>
                    <p className={`${c.textSecondary} mt-1`}>{results.cultural_context.name_order}</p>
                  </div>
                )}
                
                {results.cultural_context.honorifics && (
                  <div>
                    <span className={`text-sm font-medium ${c.label}`}>Honorifics & Titles:</span>
                    <p className={`${c.textSecondary} mt-1`}>{results.cultural_context.honorifics}</p>
                  </div>
                )}
                
                {results.cultural_context.honorific_usage_by_region && (
                  <div>
                    <span className={`text-sm font-medium ${c.label}`}>Regional Honorific Customs:</span>
                    <p className={`${c.textSecondary} mt-1`}>{results.cultural_context.honorific_usage_by_region}</p>
                  </div>
                )}
                
                {results.cultural_context.nickname_conventions && (
                  <div>
                    <span className={`text-sm font-medium ${c.label}`}>About Nicknames:</span>
                    <p className={`${c.textSecondary} mt-1`}>{results.cultural_context.nickname_conventions}</p>
                  </div>
                )}
                
                {results.cultural_context.pronunciation_importance && (
                  <div className={`p-4 ${c.infoBox} border-l-4 rounded-r-lg transition-colors duration-200`}>
                    <p className="text-sm">
                      <strong>Cultural Note:</strong> {results.cultural_context.pronunciation_importance}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Practice Tips */}
          {results.practice_tips && results.practice_tips.length > 0 && (
            <div className={`${c.card} border rounded-xl shadow-sm p-6 transition-colors duration-200`}>
              <h3 className={`font-semibold ${c.text} mb-4 flex items-center gap-2`}>
                <Book className="w-5 h-5 text-emerald-500" />
                Practice Tips
              </h3>
              <ul className="space-y-2">
                {results.practice_tips.map((tip, idx) => (
                  <li key={idx} className={`flex items-start gap-2 ${c.textSecondary}`}>
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Similar Sounding Names */}
          {results.similar_names && results.similar_names.length > 0 && (
            <div className={`${c.card} border rounded-xl shadow-sm p-6 transition-colors duration-200`}>
              <h3 className={`font-semibold ${c.text} mb-4`}>
                ⚠️ Don't Confuse With
              </h3>
              <div className="space-y-2">
                {results.similar_names.map((name, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded-lg ${isDark ? 'bg-zinc-700' : 'bg-amber-50'}`}
                  >
                    <div className={`font-medium ${c.text}`}>{name.name}</div>
                    <div className={`text-sm ${c.textSecondary}`}>{name.difference}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Asking Permission Script */}
          {results.asking_permission_script && (
            <div className={`${c.warningBox} border-l-4 rounded-r-lg p-5 transition-colors duration-200`}>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                💬 How to Ask for Help
              </h3>
              <p className="italic">"{results.asking_permission_script}"</p>
            </div>
          )}

          {/* Confidence Builder */}
          {results.confidence_builder && (
            <div className={`${c.successBox} border-l-4 rounded-r-lg p-5 transition-colors duration-200 text-center`}>
              <Heart className={`w-6 h-6 mx-auto mb-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              <p className="font-medium">
                {results.confidence_builder}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NameAnxietyDestroyer;
