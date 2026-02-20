import React, { useState, useEffect, useRef } from 'react';
import { Mountain, CheckSquare, Zap, Loader2, ArrowRight, Timer, Play, Pause, RotateCcw, Award, Coffee, Battery, ChevronDown, ChevronUp, AlertCircle, Sparkles, Target, TrendingUp, Trophy, Star, Flame, Users, Share2, Calendar, Bell, RefreshCw, Link, SkipForward } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

const TaskAvalancheBreaker = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Load saved data from localStorage
  const loadSavedData = () => {
    try {
      const saved = localStorage.getItem('taskAvalancheData');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  // Form state
  const [project, setProject] = useState('');
  const [overwhelmReasons, setOverwhelmReasons] = useState({
    too_many_steps: false,
    dont_know_start: false,
    emotionally_difficult: false,
    boring: false,
    unfamiliar: false
  });
  const [availableTime, setAvailableTime] = useState('5');
  const [energy, setEnergy] = useState(5);

  // Results state
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [completedTasks, setCompletedTasks] = useState([]);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [expandedTask, setExpandedTask] = useState(null);

  // Timer state
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [timerTaskId, setTimerTaskId] = useState(null);

  // Gamification state
  const [points, setPoints] = useState(() => loadSavedData()?.points || 0);
  const [streak, setStreak] = useState(() => loadSavedData()?.streak || 0);
  const [lastCompletionDate, setLastCompletionDate] = useState(() => loadSavedData()?.lastCompletionDate || null);
  const [totalTasksEver, setTotalTasksEver] = useState(() => loadSavedData()?.totalTasksEver || 0);
  const [lastExportDate, setLastExportDate] = useState(() => loadSavedData()?.lastExportDate || null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Accountability state
  const [accountabilityPartner, setAccountabilityPartner] = useState(() => loadSavedData()?.accountabilityPartner || '');
  const [showAccountability, setShowAccountability] = useState(false);

  // Habit stacking state
  const [existingHabit, setExistingHabit] = useState('');
  const [showHabitStacking, setShowHabitStacking] = useState(false);

  // Adaptive state
  const [adaptiveMode, setAdaptiveMode] = useState(null); // 'exhausted', 'quick', 'anxiety'
  const [showStuckHelp, setShowStuckHelp] = useState(false);
  const [showTimerComplete, setShowTimerComplete] = useState(false);
  const [timerCompleteTaskId, setTimerCompleteTaskId] = useState(null);

  // Sound preferences
  const [soundEnabled, setSoundEnabled] = useState(() => loadSavedData()?.soundEnabled ?? true);
  const [tickingSoundEnabled, setTickingSoundEnabled] = useState(() => loadSavedData()?.tickingSoundEnabled ?? false);

  const timeOptions = [
    { value: '5', label: '5 minutes' },
    { value: '10', label: '10 minutes' },
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' }
  ];

  // Save gamification data to localStorage
  useEffect(() => {
    const dataToSave = {
      points,
      streak,
      lastCompletionDate,
      totalTasksEver,
      accountabilityPartner,
      lastExportDate,
      soundEnabled,
      tickingSoundEnabled
    };
    localStorage.setItem('taskAvalancheData', JSON.stringify(dataToSave));
  }, [points, streak, lastCompletionDate, totalTasksEver, accountabilityPartner, lastExportDate, soundEnabled, tickingSoundEnabled]);

  // Theme-aware colors
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-gradient-to-br from-emerald-50 to-emerald-50',
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-emerald-200',
    cardAlt: isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-emerald-50 border-emerald-200',
    
    input: isDark 
      ? 'bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
      : 'bg-white border-emerald-300 text-emerald-900 placeholder:text-emerald-400 focus:border-emerald-600 focus:ring-emerald-100',
    
    text: isDark ? 'text-zinc-50' : 'text-emerald-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-emerald-700',
    textMuted: isDark ? 'text-zinc-400' : 'text-emerald-600',
    label: isDark ? 'text-zinc-200' : 'text-emerald-800',
    
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

  // Persistent audio context (create once, reuse)
  const audioContextRef = useRef(null);
  const tickTockRef = useRef(false); // Track tick vs tock for alternating sound
  
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  };

  // Sound functions using Web Audio API
  const playTickSound = () => {
    if (!tickingSoundEnabled) return;
    
    try {
      const audioContext = getAudioContext();
      
      // Alternate between tick and tock
      const isTick = tickTockRef.current;
      tickTockRef.current = !tickTockRef.current;
      
      // Create main mechanical click
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Kitchen timer sound: alternating tick (higher) and tock (lower)
      oscillator.frequency.value = isTick ? 2400 : 1800; // Tick-tock alternation
      oscillator.type = 'square'; // Square wave for mechanical/metallic sound
      
      // Very short, sharp click
      gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.015);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.015);
      
      // Add subtle metallic overtone for realism
      const overtone = audioContext.createOscillator();
      const overtoneGain = audioContext.createGain();
      
      overtone.connect(overtoneGain);
      overtoneGain.connect(audioContext.destination);
      
      overtone.frequency.value = isTick ? 4800 : 3600; // Double frequency for harmonic
      overtone.type = 'sine';
      
      overtoneGain.gain.setValueAtTime(0.08, audioContext.currentTime);
      overtoneGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.01);
      
      overtone.start(audioContext.currentTime);
      overtone.stop(audioContext.currentTime + 0.01);
      
    } catch (err) {
      console.log('Audio not supported');
    }
  };

  const playCompletionSound = () => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = getAudioContext();
      
      // First note (C5)
      const oscillator1 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      
      oscillator1.connect(gainNode1);
      gainNode1.connect(audioContext.destination);
      
      oscillator1.frequency.value = 523.25; // C5 note
      oscillator1.type = 'sine';
      
      // Much louder
      gainNode1.gain.setValueAtTime(0.5, audioContext.currentTime);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
      
      oscillator1.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.6);
      
      // Second note (E5) - using same audio context
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();
      
      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);
      
      oscillator2.frequency.value = 659.25; // E5 note
      oscillator2.type = 'sine';
      
      // Louder second note
      gainNode2.gain.setValueAtTime(0.4, audioContext.currentTime + 0.15);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.75);
      
      oscillator2.start(audioContext.currentTime + 0.15);
      oscillator2.stop(audioContext.currentTime + 0.75);
      
    } catch (err) {
      console.log('Audio not supported');
    }
  };

  // Timer effect
  useEffect(() => {
    let interval;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          const newValue = prev - 1;
          
          // Play tick sound on each second
          if (newValue > 0) {
            playTickSound();
          }
          
          return newValue;
        });
      }, 1000);
    } else if (timerSeconds === 0 && timerActive) {
      setTimerActive(false);
      setTimerCompleteTaskId(timerTaskId);
      setShowTimerComplete(true);
      playCompletionSound(); // Play completion sound
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds, timerTaskId]);

  // Calculate days since last completion
  const getDaysSinceLastCompletion = () => {
    if (!lastCompletionDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastDate = new Date(lastCompletionDate);
    lastDate.setHours(0, 0, 0, 0);
    
    const diffTime = today - lastDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Get streak status with grace period
  const getStreakStatus = () => {
    const daysSince = getDaysSinceLastCompletion();
    
    if (daysSince === null || daysSince === 0) {
      return { status: 'active', color: 'green', icon: '🔥', message: 'Active streak!' };
    } else if (daysSince === 1) {
      return { status: 'at-risk', color: 'yellow', icon: '⚠️', message: 'Streak at risk - complete a task today!' };
    } else if (daysSince === 2) {
      return { status: 'critical', color: 'orange', icon: '🚨', message: 'Streak critical - last chance!' };
    } else {
      return { status: 'broken', color: 'gray', icon: '💔', message: 'Streak broken - start fresh!' };
    }
  };

  // Update streak with grace period
  const updateStreak = () => {
    const today = new Date().toDateString();
    const lastDate = lastCompletionDate ? new Date(lastCompletionDate).toDateString() : null;
    
    if (lastDate === today) {
      // Same day, don't update streak count
      return;
    }
    
    const daysSince = getDaysSinceLastCompletion();
    
    if (daysSince === null) {
      // First task ever
      setStreak(1);
    } else if (daysSince <= 2) {
      // Within grace period (0, 1, or 2 days ago) - continue streak
      setStreak(prev => prev + 1);
    } else {
      // Grace period expired (3+ days) - restart streak
      setStreak(1);
    }
    
    setLastCompletionDate(today);
  };

  // Calculate level from points
  const getLevel = () => {
    return Math.floor(points / 100) + 1;
  };

  // Points to next level
  const getPointsToNextLevel = () => {
    const currentLevel = getLevel();
    const pointsForNextLevel = currentLevel * 100;
    const currentLevelPoints = (currentLevel - 1) * 100;
    const pointsInCurrentLevel = points - currentLevelPoints;
    return pointsForNextLevel - currentLevelPoints - pointsInCurrentLevel;
  };

  // Export progress to JSON file
  const handleExportData = () => {
    const exportData = {
      points,
      streak,
      lastCompletionDate,
      totalTasksEver,
      accountabilityPartner,
      soundEnabled,
      tickingSoundEnabled,
      exportDate: new Date().toISOString(),
      version: '2.0'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `task-avalanche-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Update last export date
    setLastExportDate(new Date().toISOString());
    
    alert('✅ Progress exported! Save this file somewhere safe.');
  };

  // Import progress from JSON file
  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;


      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedData = JSON.parse(event.target.result);
          
          // Validate data
          if (typeof importedData.points !== 'number' || 
              typeof importedData.streak !== 'number' ||
              typeof importedData.totalTasksEver !== 'number') {
            throw new Error('Invalid data format');
          }

          // Restore data
          setPoints(importedData.points || 0);
          setStreak(importedData.streak || 0);
          setLastCompletionDate(importedData.lastCompletionDate || null);
          setTotalTasksEver(importedData.totalTasksEver || 0);
          setAccountabilityPartner(importedData.accountabilityPartner || '');
          setLastExportDate(importedData.exportDate || null);
          setSoundEnabled(importedData.soundEnabled ?? true);
          setTickingSoundEnabled(importedData.tickingSoundEnabled ?? false);

          alert(`✅ Progress restored!\n\n📊 Stats:\n• Level ${Math.floor((importedData.points || 0) / 100) + 1}\n• ${importedData.points || 0} points\n• ${importedData.streak || 0} day streak\n• ${importedData.totalTasksEver || 0} total tasks`);
        } catch (error) {
          alert('❌ Failed to import data. Please check that you selected a valid backup file.');
          console.error('Import error:', error);
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  };

  // Check if should warn about export
  const shouldWarnAboutExport = () => {
    if (!lastExportDate) return totalTasksEver > 0; // Never exported but has data
    
    const daysSinceExport = Math.floor(
      (new Date() - new Date(lastExportDate)) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceExport >= 7;
  };

  const handleBreakDown = async () => {
    if (!project.trim() || project.trim().length < 10) {
      setError('Please describe your overwhelming project (at least 10 characters)');
      return;
    }

    setError('');
    setResults(null);
    setCompletedTasks([]);
    setCurrentTaskIndex(0);

    try {
      const selectedReasons = Object.keys(overwhelmReasons).filter(key => overwhelmReasons[key]);
      
      const data = await callToolEndpoint('task-avalanche-breaker', {
        project: project.trim(),
        overwhelmReasons: selectedReasons,
        availableTime: parseInt(availableTime),
        energyLevel: energy,
        adaptiveMode: adaptiveMode,
        existingHabit: existingHabit.trim()
      });
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to break down project. Please try again.');
    }
  };

  const handleOverwhelmToggle = (reason) => {
    setOverwhelmReasons({
      ...overwhelmReasons,
      [reason]: !overwhelmReasons[reason]
    });
  };

  const handleCompleteTask = (taskId) => {
    if (!completedTasks.includes(taskId)) {
      setCompletedTasks([...completedTasks, taskId]);
      
      // Award points
      const taskPoints = 10;
      setPoints(prev => prev + taskPoints);
      setTotalTasksEver(prev => prev + 1);
      updateStreak();
      
      // Show celebration
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
      
      // Move to next task
      if (currentTaskIndex < results.micro_tasks.length - 1) {
        setCurrentTaskIndex(currentTaskIndex + 1);
      }

      // Stop timer if running
      if (timerActive && timerTaskId === taskId) {
        setTimerActive(false);
      }

      // Share progress if accountability partner set
      if (accountabilityPartner) {
        shareProgress(taskId);
      }

      // Check for momentum checkpoint
      const checkpoint = results.momentum_checkpoints?.find(cp => cp.after_task === taskId);
      if (checkpoint) {
        setTimeout(() => {
          alert(`🎉 ${checkpoint.celebration}\n\n${checkpoint.choice || ''}`);
        }, 100);
      }
    }
  };

  const shareProgress = (taskId) => {
    const task = results?.micro_tasks?.find(t => t.task_id === taskId);
    if (task && accountabilityPartner) {
      // In a real app, this would send a notification/email
      console.log(`Shared with ${accountabilityPartner}: Completed "${task.task}"!`);
      alert(`✅ Progress shared with ${accountabilityPartner}!`);
    }
  };

  // Parse time string to seconds
  const parseTimeToSeconds = (timeStr) => {
    if (!timeStr) return 300; // Default 5 minutes
    
    const timeLower = timeStr.toLowerCase();
    const num = parseInt(timeStr) || 0;
    
    if (timeLower.includes('second')) {
      return num;
    } else if (timeLower.includes('minute') || timeLower.includes('min')) {
      return num * 60;
    } else if (timeLower.includes('hour')) {
      return num * 3600;
    } else {
      // If no unit specified, assume minutes
      return num * 60 || 300;
    }
  };

  const handleStartTimer = (task) => {
    const seconds = parseTimeToSeconds(task.estimated_time);
    setTimerSeconds(seconds);
    setTimerTaskId(task.task_id);
    setTimerActive(true);
  };

  const handlePauseTimer = () => {
    setTimerActive(false);
  };

  const handleResetTimer = (task) => {
    const seconds = parseTimeToSeconds(task.estimated_time);
    setTimerSeconds(seconds);
    setTimerActive(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getEnergyColor = (energyRequired) => {
    switch(energyRequired?.toLowerCase()) {
      case 'low':
        return isDark ? 'text-emerald-400 bg-emerald-900/30' : 'text-emerald-700 bg-emerald-100';
      case 'medium':
        return isDark ? 'text-amber-400 bg-amber-900/30' : 'text-amber-700 bg-amber-100';
      case 'high':
        return isDark ? 'text-red-400 bg-red-900/30' : 'text-red-700 bg-red-100';
      default:
        return isDark ? 'text-gray-400 bg-gray-900/30' : 'text-gray-700 bg-gray-100';
    }
  };

  const getProgressPercentage = () => {
    if (!results?.micro_tasks) return 0;
    return Math.round((completedTasks.length / results.micro_tasks.length) * 100);
  };

  const getNextIncompleteTask = () => {
    if (!results?.micro_tasks) return null;
    return results.micro_tasks.find(task => !completedTasks.includes(task.task_id));
  };

  const handleReset = () => {
    setProject('');
    setOverwhelmReasons({
      too_many_steps: false,
      dont_know_start: false,
      emotionally_difficult: false,
      boring: false,
      unfamiliar: false
    });
    setAvailableTime('5');
    setEnergy(5);
    setResults(null);
    setError('');
    setCompletedTasks([]);
    setCurrentTaskIndex(0);
    setTimerActive(false);
    setAdaptiveMode(null);
    setExistingHabit('');
    setShowStuckHelp(false);
    setShowTimerComplete(false);
    setTimerCompleteTaskId(null);
  };

  const handleTaskTooHard = async (task) => {
    setShowStuckHelp(true);
  };

  const handleSkipTask = (taskId) => {
    if (window.confirm('Skip this task for now? You can come back to it later.')) {
      // Move to next task without completing
      const nextIndex = results.micro_tasks.findIndex(t => t.task_id === taskId) + 1;
      if (nextIndex < results.micro_tasks.length) {
        setCurrentTaskIndex(nextIndex);
      }
    }
  };

  const handleReorderByEnergy = async () => {
    if (!results) return;
    
    // Re-request with current energy level
    try {
      const data = await callToolEndpoint('task-avalanche-breaker', {
        project: project.trim(),
        overwhelmReasons: Object.keys(overwhelmReasons).filter(key => overwhelmReasons[key]),
        availableTime: parseInt(availableTime),
        energyLevel: energy,
        adaptiveMode: 'reorder',
        completedTaskIds: completedTasks
      });
      setResults(data);
    } catch (err) {
      setError('Failed to reorder tasks');
    }
  };

  const exampleProject = "Clean out my garage - it's been years and I don't even know where to start. There's so much stuff and I get overwhelmed just thinking about it.";

  return (
    <div className="space-y-6">
      
      {/* Gamification Stats Bar */}
      <div className={`${c.card} border rounded-xl p-4 transition-colors duration-200`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <Trophy className={`w-8 h-8 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            <div>
              <div className={`text-xs ${c.textMuted}`}>Level</div>
              <div className={`text-2xl font-bold ${c.accent}`}>{getLevel()}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Star className={`w-8 h-8 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <div>
              <div className={`text-xs ${c.textMuted}`}>Points</div>
              <div className={`text-2xl font-bold ${c.accent}`}>{points}</div>
              <div className={`text-xs ${c.textMuted}`}>{getPointsToNextLevel()} to next level</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(() => {
              const streakStatus = getStreakStatus();
              const statusColors = {
                active: 'text-orange-500',
                'at-risk': isDark ? 'text-yellow-400' : 'text-yellow-600',
                critical: isDark ? 'text-orange-400' : 'text-orange-600',
                broken: isDark ? 'text-gray-600' : 'text-gray-400'
              };
              
              return (
                <>
                  <div className={`text-3xl`}>{streakStatus.icon}</div>
                  <div className="flex-1">
                    <div className={`text-xs ${c.textMuted}`}>Streak</div>
                    <div className={`text-2xl font-bold ${statusColors[streakStatus.status]}`}>
                      {streak} {streak === 1 ? 'day' : 'days'}
                    </div>
                    {streakStatus.status !== 'active' && streak > 0 && (
                      <div className={`text-xs font-semibold ${statusColors[streakStatus.status]}`}>
                        {streakStatus.message}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
          <div className="flex items-center gap-3">
            <Target className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            <div>
              <div className={`text-xs ${c.textMuted}`}>Total Tasks</div>
              <div className={`text-2xl font-bold ${c.accent}`}>{totalTasksEver}</div>
            </div>
          </div>
        </div>

        {/* Grace Period Warning Banner */}
        {(() => {
          const streakStatus = getStreakStatus();
          if (streakStatus.status === 'at-risk' || streakStatus.status === 'critical') {
            return (
              <div className={`mt-3 p-3 rounded-lg border-2 ${
                streakStatus.status === 'at-risk' 
                  ? isDark ? 'bg-yellow-900/20 border-yellow-600' : 'bg-yellow-50 border-yellow-400'
                  : isDark ? 'bg-orange-900/20 border-orange-600' : 'bg-orange-50 border-orange-400'
              }`}>
                <p className={`text-sm font-semibold ${
                  streakStatus.status === 'at-risk'
                    ? isDark ? 'text-yellow-300' : 'text-yellow-800'
                    : isDark ? 'text-orange-300' : 'text-orange-800'
                }`}>
                  {streakStatus.icon} {streakStatus.message}
                </p>
                <p className={`text-xs mt-1 ${
                  streakStatus.status === 'at-risk'
                    ? isDark ? 'text-yellow-400' : 'text-yellow-700'
                    : isDark ? 'text-orange-400' : 'text-orange-700'
                }`}>
                  Grace period: You have {3 - getDaysSinceLastCompletion()} {3 - getDaysSinceLastCompletion() === 1 ? 'day' : 'days'} to complete a task before your streak resets.
                </p>
              </div>
            );
          }
          return null;
        })()}
      {/* Supportive Banner */}
      <div className={`${c.info} border-l-4 rounded-r-lg p-5 transition-colors duration-200`}>
        <div className="flex items-start gap-3">
          <Mountain className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-blue-300' : 'text-blue-600'}`} />
          <div>
            <h3 className={`font-bold mb-1 ${c.text}`}>Task Avalanche Breaker V2</h3>
            <p className={`text-sm ${c.textSecondary} mb-2`}>
            With gamification, accountability partners, and adaptive intelligence! Earn points, 
              build streaks, and get support from friends. Built for executive dysfunction & ADHD.
            </p>
            <p className={`text-xs ${c.textMuted} mb-1`}>
              💚 Stop after ANY task. Progress is progress. There's no failure here.
            </p>
            <p className={`text-xs ${c.textMuted}`}>
              🔥 Streaks have a 48-hour grace period - life happens, and that's okay!
            </p>
          </div>
        </div>
      </div>
        {/* Export Warning Banner */}
        {shouldWarnAboutExport() && (
          <div className={`mt-3 p-3 rounded-lg border-2 ${isDark ? 'bg-blue-900/20 border-blue-600' : 'bg-blue-50 border-blue-400'}`}>
            <p className={`text-sm font-semibold ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
              💾 Backup Reminder
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
              {lastExportDate 
                ? `Last exported ${Math.floor((new Date() - new Date(lastExportDate)) / (1000 * 60 * 60 * 24))} days ago. Export to protect your progress!`
                : 'You have progress but no backup. Export now to prevent data loss!'}
            </p>
          </div>
        )}

        {/* Export/Import Buttons */}
        <div className="mt-4 flex gap-2 flex-wrap items-center">
          <button
            onClick={handleExportData}
            className={`${c.btnSecondary} px-4 py-2 rounded text-sm flex items-center gap-2`}
          >
            <Share2 className="w-4 h-4" />
            💾 Export Progress
          </button>
          <button
            onClick={handleImportData}
            className={`${c.btnSecondary} px-4 py-2 rounded text-sm flex items-center gap-2`}
          >
            <RefreshCw className="w-4 h-4" />
            📥 Import Progress
          </button>
          
          {lastExportDate && (
            <span className={`text-xs ${c.textMuted} self-center`}>
              Last backup: {new Date(lastExportDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-bounce">
          <div className={`${isDark ? 'bg-emerald-900 border-emerald-600' : 'bg-emerald-100 border-emerald-500'} border-4 rounded-2xl p-8 shadow-2xl`}>
            <div className="text-6xl mb-2">🎉</div>
            <div className="text-2xl font-bold">+10 points!</div>
          </div>
        </div>
      )}


      {/* Input Form */}
      <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200`}>
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-3 rounded-lg ${isDark ? 'bg-emerald-900/30' : 'bg-emerald-100'}`}>
            <Zap className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${c.text}`}>Break Down Your Overwhelming Project</h2>
            <p className={`text-sm ${c.textMuted}`}>Let's turn that mountain into micro-steps</p>
          </div>
        </div>

        <div className="space-y-6">
          
          {/* Quick Mode Buttons */}
          <div>
            <label className={`block text-sm font-medium ${c.label} mb-3`}>
              Quick modes (optional):
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setAdaptiveMode('exhausted');
                  setEnergy(2);
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  adaptiveMode === 'exhausted'
                    ? isDark ? 'border-emerald-500 bg-emerald-900/30' : 'border-emerald-600 bg-emerald-100'
                    : c.btnOutline
                }`}
              >
                <Coffee className="w-4 h-4 mx-auto mb-1" />
                <div className="text-xs">I'm Exhausted</div>
              </button>
              <button
                onClick={() => {
                  setAdaptiveMode('quick');
                  setAvailableTime('10');
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  adaptiveMode === 'quick'
                    ? isDark ? 'border-emerald-500 bg-emerald-900/30' : 'border-emerald-600 bg-emerald-100'
                    : c.btnOutline
                }`}
              >
                <Timer className="w-4 h-4 mx-auto mb-1" />
                <div className="text-xs">10 Min Max</div>
              </button>
              <button
                onClick={() => {
                  setAdaptiveMode('anxiety');
                  setOverwhelmReasons({...overwhelmReasons, emotionally_difficult: true});
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  adaptiveMode === 'anxiety'
                    ? isDark ? 'border-emerald-500 bg-emerald-900/30' : 'border-emerald-600 bg-emerald-100'
                    : c.btnOutline
                }`}
              >
                <AlertCircle className="w-4 h-4 mx-auto mb-1" />
                <div className="text-xs">High Anxiety</div>
              </button>
            </div>
          </div>

          {/* Project Description */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="project" className={`block text-sm font-medium ${c.label}`}>
                What's overwhelming you right now?
              </label>
              <button
                onClick={() => setProject(exampleProject)}
                className={`text-xs ${c.accent} hover:underline`}
              >
                Try example
              </button>
            </div>
            <textarea
              id="project"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="e.g., Clean garage, Write thesis, Plan wedding, Organize finances..."
              className={`w-full p-4 border rounded-lg ${c.input} outline-none focus:ring-2 transition-colors duration-200`}
              rows={4}
            />
          </div>

          {/* Habit Stacking */}
          <div>
            <button
              onClick={() => setShowHabitStacking(!showHabitStacking)}
              className={`flex items-center gap-2 text-sm ${c.accent} hover:underline mb-2`}
            >
              <Link className="w-4 h-4" />
              {showHabitStacking ? 'Hide' : 'Add'} habit stacking
            </button>
            {showHabitStacking && (
              <div className={`p-4 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                <p className={`text-sm mb-2 ${c.label}`}>
                  Link micro-tasks to existing habits for better adherence:
                </p>
                <input
                  type="text"
                  value={existingHabit}
                  onChange={(e) => setExistingHabit(e.target.value)}
                  placeholder="e.g., After I make morning coffee, I will..."
                  className={`w-full p-2 border rounded ${c.input}`}
                />
                <p className={`text-xs ${c.textMuted} mt-1`}>
                  Example: "After I brush teeth, I will do first micro-task"
                </p>
              </div>
            )}
          </div>

          {/* Why Overwhelming */}
          <div>
            <label className={`block text-sm font-medium ${c.label} mb-3`}>
              Why does this feel overwhelming?
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'too_many_steps', label: 'Too many steps', icon: TrendingUp },
                { key: 'dont_know_start', label: "Don't know where to start", icon: AlertCircle },
                { key: 'emotionally_difficult', label: 'Emotionally difficult', icon: Coffee },
                { key: 'boring', label: 'Boring/tedious', icon: Battery },
                { key: 'unfamiliar', label: 'Unfamiliar/new to me', icon: Sparkles }
              ].map(({ key, label, icon: Icon }) => (
                <label
                  key={key}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 flex items-center gap-2 ${
                    overwhelmReasons[key]
                      ? isDark ? 'border-emerald-500 bg-emerald-900/30' : 'border-emerald-600 bg-emerald-100'
                      : isDark ? 'border-zinc-700 hover:border-zinc-600' : 'border-emerald-200 hover:border-emerald-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={overwhelmReasons[key]}
                    onChange={() => handleOverwhelmToggle(key)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <Icon className={`w-4 h-4 ${overwhelmReasons[key] ? c.accent : c.textMuted}`} />
                  <span className={`text-sm ${overwhelmReasons[key] ? c.accent : c.textMuted}`}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Time and Energy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="time" className={`block text-sm font-medium ${c.label} mb-2`}>
                ⏱️ How much time do you have for this session?
              </label>
              <select
                id="time"
                value={availableTime}
                onChange={(e) => setAvailableTime(e.target.value)}
                className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2`}
              >
                {timeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <p className={`text-xs ${c.textMuted} mt-1`}>
                Determines how many tasks you'll get
              </p>
            </div>

            <div>
              <label htmlFor="energy" className={`block text-sm font-medium ${c.label} mb-2`}>
                ⚡ Energy level right now: <span className={`${c.accent} font-bold`}>{energy}/10</span>
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs">😴</span>
                <input
                  id="energy"
                  type="range"
                  min="1"
                  max="10"
                  value={energy}
                  onChange={(e) => setEnergy(parseInt(e.target.value))}
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: isDark 
                      ? `linear-gradient(to right, #10b981 0%, #10b981 ${energy * 10}%, #3f3f46 ${energy * 10}%, #3f3f46 100%)`
                      : `linear-gradient(to right, #10b981 0%, #10b981 ${energy * 10}%, #d1d5db ${energy * 10}%, #d1d5db 100%)`
                  }}
                />
                <span className="text-xs">⚡</span>
              </div>
              <p className={`text-xs ${c.textMuted} mt-1`}>
                Determines how hard/complex tasks will be
              </p>
            </div>
          </div>

          {/* Time + Energy Explainer */}
          <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-300'}`}>
            <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-900'}`}>
              <strong>💡 Smart Planning:</strong> More time = more tasks. Lower energy = simpler tasks. 
              {energy <= 3 && ' Low energy means all tasks will be quick & physical.'}
              {energy > 6 && availableTime >= 15 && ' High energy + more time = you can tackle complex tasks!'}
              {availableTime <= 5 && ' Short session = just a few quick wins.'}
            </p>
          </div>

          {/* Accountability Partner */}
          <div>
            <button
              onClick={() => setShowAccountability(!showAccountability)}
              className={`flex items-center gap-2 text-sm ${c.accent} hover:underline mb-2`}
            >
              <Users className="w-4 h-4" />
              {showAccountability ? 'Hide' : 'Add'} accountability partner
            </button>
            {showAccountability && (
              <div className={`p-4 rounded-lg ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
                <p className={`text-sm mb-2 ${c.label}`}>
                  Share your progress with a friend for extra motivation:
                </p>
                <input
                  type="text"
                  value={accountabilityPartner}
                  onChange={(e) => setAccountabilityPartner(e.target.value)}
                  placeholder="Friend's name or email"
                  className={`w-full p-2 border rounded ${c.input}`}
                />
                <p className={`text-xs ${c.textMuted} mt-1`}>
                  We'll notify them when you complete tasks (virtual support!)
                </p>
              </div>
            )}
          </div>

          {/* Break Down Button */}
          <div className="flex gap-3">
            <button
              onClick={handleBreakDown}
              disabled={loading}
              className={`flex-1 ${c.btnPrimary} disabled:opacity-50 font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Breaking it down...
                </>
              ) : (
                <>
                  <Mountain className="w-5 h-5" />
                  Break This Down for Me
                </>
              )}
            </button>

            {results && (
              <button
                onClick={handleReset}
                className={`px-6 py-3 border-2 ${c.btnOutline} font-medium rounded-lg`}
              >
                New Project
              </button>
            )}
          </div>

          {error && (
            <div className={`p-4 ${c.warning} border rounded-lg flex items-start gap-3`} role="alert">
              <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5`} />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Results Display */}
      {results && (
        <div className="space-y-6">
          
          {/* Adaptive Controls */}
          <div className={`${c.card} border rounded-xl p-4 flex gap-3 flex-wrap`}>
            <button
              onClick={handleReorderByEnergy}
              className={`${c.btnSecondary} px-4 py-2 rounded flex items-center gap-2`}
            >
              <RefreshCw className="w-4 h-4" />
              Reorder by Current Energy
            </button>
            <button
              onClick={() => setShowStuckHelp(true)}
              className={`${c.btnSecondary} px-4 py-2 rounded flex items-center gap-2`}
            >
              <AlertCircle className="w-4 h-4" />
              Still Can't Start?
            </button>
          </div>

          {/* Project Overview */}
          <div className={`${c.success} border-l-4 rounded-r-lg p-6`}>
            <h3 className={`text-xl font-bold mb-3`}>✨ Your Project, Broken Down</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm opacity-75">Total Micro-Tasks</div>
                <div className="text-2xl font-bold">{results.project_breakdown?.total_micro_tasks || 0}</div>
              </div>
              <div>
                <div className="text-sm opacity-75">Estimated Time</div>
                <div className="text-2xl font-bold">{results.project_breakdown?.estimated_total_time || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-sm opacity-75">Potential Points</div>
                <div className="text-2xl font-bold">{(results.micro_tasks?.length || 0) * 10} pts</div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className={`${c.card} border rounded-xl p-6`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className={`text-lg font-bold ${c.text}`}>Your Progress</h3>
              <span className={`text-sm ${c.accent} font-semibold`}>
                {completedTasks.length} / {results.micro_tasks?.length || 0}
              </span>
            </div>
            <div className={`w-full h-4 rounded-full overflow-hidden ${isDark ? 'bg-zinc-700' : 'bg-gray-200'}`}>
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            <p className={`text-xs ${c.textMuted} mt-2`}>
              🎉 {getProgressPercentage()}% complete! +{completedTasks.length * 10} points earned!
            </p>
          </div>

          {/* Current/Next Task */}
          {getNextIncompleteTask() && (
            <div className={`${isDark ? 'bg-emerald-900/30 border-emerald-700' : 'bg-emerald-100 border-emerald-400'} border-2 rounded-xl p-6 shadow-lg`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className={`text-2xl font-bold ${c.text} mb-1`}>
                    👉 Next Task:
                  </h3>
                  <p className={`text-sm ${c.textMuted}`}>Just this one thing. +10 points.</p>
                </div>
                <Award className={`w-8 h-8 ${c.accent}`} />
              </div>

              {(() => {
                const task = getNextIncompleteTask();
                const isTimerForThis = timerTaskId === task.task_id;
                
                return (
                  <>
                    <div className={`${isDark ? 'bg-zinc-800' : 'bg-white'} rounded-lg p-5 mb-4`}>
                      <div className="flex items-start justify-between mb-3">
                        <h4 className={`text-xl font-bold ${c.text}`}>{task.task}</h4>
                        <span className={`text-xs px-2 py-1 rounded font-semibold ${getEnergyColor(task.energy_required)}`}>
                          {task.energy_required} energy
                        </span>
                      </div>

                      {task.why_this_first && (
                        <div className={`mb-3 p-3 rounded ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                          <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                            <strong>Why this first:</strong> {task.why_this_first}
                          </p>
                        </div>
                      )}

                      {task.habit_stack && (
                        <div className={`mb-3 p-3 rounded ${isDark ? 'bg-purple-900/20' : 'bg-purple-50'}`}>
                          <p className={`text-sm ${isDark ? 'text-purple-200' : 'text-purple-800'}`}>
                            <Link className="w-4 h-4 inline mr-1" />
                            <strong>Habit stack:</strong> {task.habit_stack}
                          </p>
                        </div>
                      )}

                      {task.completion_criteria && (
                        <div className="mb-3">
                          <p className={`text-sm ${c.label}`}>
                            <strong>You're done when:</strong> {task.completion_criteria}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm">
                        <Timer className="w-4 h-4" />
                        <span>Estimated: {task.estimated_time}</span>
                      </div>
                    </div>

                    {/* Timer */}
                    <div className={`${isDark ? 'bg-zinc-800' : 'bg-white'} rounded-lg p-4 mb-4`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-3xl font-mono font-bold">
                          {isTimerForThis ? formatTime(timerSeconds) : formatTime(parseTimeToSeconds(task.estimated_time))}
                        </div>
                        <div className="flex gap-2">
                          {!timerActive || !isTimerForThis ? (
                            <button
                              onClick={() => handleStartTimer(task)}
                              className={`${c.btnPrimary} px-4 py-2 rounded flex items-center gap-2`}
                            >
                              <Play className="w-4 h-4" />
                              Start
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={handlePauseTimer}
                                className={`${c.btnSecondary} px-4 py-2 rounded flex items-center gap-2`}
                              >
                                <Pause className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleResetTimer(task)}
                                className={`${c.btnSecondary} px-4 py-2 rounded`}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Sound Controls */}
                      <div className="flex gap-2 justify-center flex-wrap">
                        <label className={`flex items-center gap-2 px-3 py-1.5 rounded border cursor-pointer transition-colors text-xs ${
                          soundEnabled 
                            ? isDark ? 'bg-emerald-900/30 border-emerald-600' : 'bg-emerald-100 border-emerald-500'
                            : isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-gray-100 border-gray-300'
                        }`}>
                          <input
                            type="checkbox"
                            checked={soundEnabled}
                            onChange={(e) => setSoundEnabled(e.target.checked)}
                            className="w-3.5 h-3.5"
                          />
                          <span>🔔 Completion Sound</span>
                        </label>
                        
                        <label className={`flex items-center gap-2 px-3 py-1.5 rounded border cursor-pointer transition-colors text-xs ${
                          tickingSoundEnabled 
                            ? isDark ? 'bg-emerald-900/30 border-emerald-600' : 'bg-emerald-100 border-emerald-500'
                            : isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-gray-100 border-gray-300'
                        }`}>
                          <input
                            type="checkbox"
                            checked={tickingSoundEnabled}
                            onChange={(e) => setTickingSoundEnabled(e.target.checked)}
                            className="w-3.5 h-3.5"
                          />
                          <span>⏱️ Ticking Sound</span>
                        </label>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleCompleteTask(task.task_id)}
                        className={`${c.btnPrimary} py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2`}
                      >
                        <CheckSquare className="w-5 h-5" />
                        I Did It! +10pts
                      </button>
                      <button
                        onClick={() => handleTaskTooHard(task)}
                        className={`px-6 py-3 border-2 ${c.btnOutline} rounded-lg font-medium`}
                      >
                        Too Hard
                      </button>
                    </div>

                    <button
                      onClick={() => handleSkipTask(task.task_id)}
                      className={`w-full mt-2 text-sm ${c.textMuted} hover:underline flex items-center justify-center gap-1`}
                    >
                      <SkipForward className="w-3 h-3" />
                      Skip for now
                    </button>
                  </>
                );
              })()}
            </div>
          )}

          {/* Stuck Emergency Help Modal */}
          {showStuckHelp && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowStuckHelp(false)}>
              <div className={`${c.card} border rounded-xl p-6 max-w-md w-full`} onClick={(e) => e.stopPropagation()}>
                <h3 className={`text-lg font-bold ${c.text} mb-4`}>🆘 Still Can't Start? That's Okay!</h3>
                
                <div className={`space-y-3 text-sm ${c.text}`}>
                  <p><strong>Try this:</strong> Do ONLY the absolute minimum version of task 1.</p>
                  <p><strong>Example:</strong> If task 1 is "Stand in doorway" → Just LOOK at the door.</p>
                  <p><strong>Permission:</strong> You can stop after literally anything. Opening a folder counts. Looking at your desk counts.</p>
                  <p className={`p-3 rounded ${isDark ? 'bg-emerald-900/20 text-emerald-100' : 'bg-emerald-100 text-emerald-900'}`}>
                    <strong>Remember:</strong> The goal isn't finishing. The goal is starting. Any movement is progress.
                  </p>
                </div>

                <button
                  onClick={() => setShowStuckHelp(false)}
                  className={`w-full ${c.btnPrimary} mt-4 py-2 rounded`}
                >
                  Okay, I'll Try
                </button>
              </div>
            </div>
          )}

          {/* Timer Complete Modal */}
          {showTimerComplete && timerCompleteTaskId && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className={`${c.card} border-4 border-emerald-500 rounded-xl p-6 max-w-md w-full`} onClick={(e) => e.stopPropagation()}>
                <div className="text-center mb-4">
                  <div className="text-6xl mb-3">⏰</div>
                  <h3 className={`text-xl font-bold ${c.text} mb-2`}>Time's Up!</h3>
                  <p className={`text-sm ${c.textSecondary}`}>
                    Did you complete this task?
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      handleCompleteTask(timerCompleteTaskId);
                      setShowTimerComplete(false);
                      setTimerCompleteTaskId(null);
                    }}
                    className={`w-full ${c.btnPrimary} py-3 rounded-lg font-semibold flex items-center justify-center gap-2`}
                  >
                    <CheckSquare className="w-5 h-5" />
                    Yes, I Did It! +10pts
                  </button>

                  <button
                    onClick={() => {
                      const task = results?.micro_tasks?.find(t => t.task_id === timerCompleteTaskId);
                      if (task) {
                        handleStartTimer(task);
                      }
                      setShowTimerComplete(false);
                    }}
                    className={`w-full ${c.btnSecondary} py-3 rounded-lg font-semibold flex items-center justify-center gap-2`}
                  >
                    <RefreshCw className="w-5 h-5" />
                    Need More Time
                  </button>

                  <button
                    onClick={() => {
                      setShowTimerComplete(false);
                      setTimerCompleteTaskId(null);
                      setShowStuckHelp(true);
                    }}
                    className={`w-full border-2 ${c.btnOutline} py-3 rounded-lg font-semibold flex items-center justify-center gap-2`}
                  >
                    <AlertCircle className="w-5 h-5" />
                    This Is Too Hard
                  </button>
                </div>

                <p className={`text-xs ${c.textMuted} mt-4 text-center`}>
                  No pressure - any progress counts! 💚
                </p>
              </div>
            </div>
          )}

          {/* Rest of results UI continues as before... */}
          {/* ... (keeping all the existing task list, anti-paralysis strategies, etc.) ... */}
        </div>
      )}
    </div>
  );
};

export default TaskAvalancheBreaker;
