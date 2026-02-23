import React, { useState, useEffect } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { getToolById } from '../data/tools';
import { CopyBtn } from '../components/ActionButtons';

const CrisisPrioritizer = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const toolData = getToolById('CrisisPrioritizer');

  // --- Theme ---
  const c = {
    card: isDark ? 'bg-zinc-800' : 'bg-white',
    cardAlt: isDark ? 'bg-zinc-700/50' : 'bg-slate-50',
    text: isDark ? 'text-zinc-50' : 'text-gray-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-gray-600',
    textMuted: isDark ? 'text-zinc-500' : 'text-gray-400',
    input: isDark ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder-zinc-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400',
    btnPrimary: isDark ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-red-600 hover:bg-red-700 text-white',
    btnSecondary: isDark ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    border: isDark ? 'border-zinc-700' : 'border-gray-200',
    chip: (active) => active
      ? (isDark ? 'bg-red-900/40 border-red-500 text-red-200' : 'bg-red-100 border-red-400 text-red-800')
      : (isDark ? 'border-zinc-600 text-zinc-400 hover:border-zinc-500' : 'border-gray-200 text-gray-500 hover:border-gray-300'),
    success: isDark ? 'bg-emerald-900/20 border-emerald-700 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-800',
    warning: isDark ? 'bg-amber-900/20 border-amber-700 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-800',
    danger: isDark ? 'bg-red-900/20 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800',
    info: isDark ? 'bg-blue-900/20 border-blue-700 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800',
    purple: isDark ? 'bg-purple-900/20 border-purple-700 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-800',
    critical: isDark ? 'bg-red-900/30 border-red-600 text-red-200' : 'bg-red-50 border-red-400 text-red-900',
    important: isDark ? 'bg-orange-900/30 border-orange-600 text-orange-200' : 'bg-orange-50 border-orange-400 text-orange-900',
    medium: isDark ? 'bg-amber-900/30 border-amber-600 text-amber-200' : 'bg-amber-50 border-amber-400 text-amber-900',
    low: isDark ? 'bg-emerald-900/30 border-emerald-600 text-emerald-200' : 'bg-emerald-50 border-emerald-400 text-emerald-900',
    optional: isDark ? 'bg-zinc-700/50 border-zinc-600 text-zinc-300' : 'bg-slate-50 border-slate-300 text-slate-700',
  };

  // --- State ---
  const [timeframe, setTimeframe] = useState('right_now');
  const [tasks, setTasks] = useState([{ text: '', deadline: '', who: '' }]);
  const [showDetails, setShowDetails] = useState({});
  const [energyLevel, setEnergyLevel] = useState('');
  const [hoursAvailable, setHoursAvailable] = useState('');
  const [emotionalState, setEmotionalState] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [showBreather, setShowBreather] = useState(false);
  const [breatherDone, setBreatherDone] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [checkedTasks, setCheckedTasks] = useState({});
  const [validationFailed, setValidationFailed] = useState(false);

  // --- Options ---
  const energyOptions = [
    { value: 'running_on_fumes', label: 'Running on fumes', emoji: '🪫' },
    { value: 'low', label: 'Low energy', emoji: '😴' },
    { value: 'okay', label: 'Okay-ish', emoji: '😐' },
    { value: 'decent', label: 'Decent', emoji: '👍' },
    { value: 'wired', label: 'Wired / anxious energy', emoji: '⚡' },
  ];

  const emotionalOptions = [
    { value: 'panicking', label: 'Panicking', emoji: '😰' },
    { value: 'overwhelmed', label: 'Overwhelmed', emoji: '🌊' },
    { value: 'frozen', label: 'Frozen / can\'t start', emoji: '🧊' },
    { value: 'guilty', label: 'Drowning in guilt', emoji: '😞' },
    { value: 'frustrated', label: 'Frustrated', emoji: '😤' },
    { value: 'numb', label: 'Numb / checked out', emoji: '😶' },
    { value: 'okay', label: 'Stressed but functional', emoji: '🫤' },
  ];

  const hoursOptions = [
    { value: '1', label: '~1 hour' },
    { value: '2', label: '~2 hours' },
    { value: '4', label: '~4 hours' },
    { value: '8', label: 'Full day' },
    { value: 'unknown', label: 'No idea' },
  ];

  const timeframeOptions = [
    { value: 'right_now', label: 'Right now', emoji: '🔥', desc: 'Today\'s triage' },
    { value: 'this_week', label: 'This week', emoji: '📅', desc: 'Day-by-day plan' },
    { value: 'few_weeks', label: 'Next few weeks', emoji: '🗓️', desc: 'Longer crisis' },
  ];

  // --- Handlers ---
  const toggleSection = (key) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const addTask = () => setTasks([...tasks, { text: '', deadline: '', who: '' }]);
  const removeTask = (index) => setTasks(tasks.filter((_, i) => i !== index));
  const updateTask = (index, field, value) => {
    const updated = [...tasks];
    updated[index] = { ...updated[index], [field]: value };
    setTasks(updated);
  };
  const toggleDetails = (index) => setShowDetails(prev => ({ ...prev, [index]: !prev[index] }));
  const toggleCheck = (id) => setCheckedTasks(prev => ({ ...prev, [id]: !prev[id] }));

  const filledTasks = tasks.filter(t => t.text.trim());

  const handlePrioritize = async () => {
    if (filledTasks.length === 0) {
      setError('Please add at least one task');
      setValidationFailed(true);
      setTimeout(() => setValidationFailed(false), 2000);
      return;
    }
    setError('');
    setValidationFailed(false);
    setResults(null);
    setBreatherDone(false);
    setShowBreather(true);
    setCheckedTasks({});

    try {
      const data = await callToolEndpoint('crisis-prioritizer', {
        tasks: filledTasks.map((t, idx) => ({
          id: idx + 1,
          task: t.text.trim(),
          deadline: t.deadline.trim() || null,
          who_waiting: t.who.trim() || null,
        })),
        energy_level: energyLevel || null,
        hours_available: hoursAvailable || null,
        emotional_state: emotionalState || null,
        timeframe: timeframe,
      });
      setResults(data);
    } catch (err) {
      setShowBreather(false);
      setError(err.message || 'Failed to prioritize. Please try again.');
    }
  };

  // Breather timer
  useEffect(() => {
    if (showBreather && results) {
      const timer = setTimeout(() => {
        setBreatherDone(true);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [showBreather, results]);

  const dismissBreather = () => {
    setShowBreather(false);
    setBreatherDone(false);
  };

  const reset = () => {
    setTimeframe('right_now');
    setTasks([{ text: '', deadline: '', who: '' }]);
    setShowDetails({});
    setEnergyLevel('');
    setHoursAvailable('');
    setEmotionalState('');
    setResults(null);
    setError('');
    setShowBreather(false);
    setBreatherDone(false);
    setExpandedSections({});
    setCheckedTasks({});
    setValidationFailed(false);
  };

  // --- Urgency styling ---
  const urgencyStyle = (level) => {
    const map = { critical: c.critical, important: c.important, medium: c.medium, low: c.low, optional: c.optional };
    return map[level] || c.medium;
  };

  const urgencyEmoji = (level) => {
    const map = { critical: '🔴', important: '🟠', medium: '🟡', low: '🟢', optional: '⚪' };
    return map[level] || '🟡';
  };

  // --- Build full text for copy/print ---
  const buildFullText = () => {
    if (!results) return '';
    const L = [];
    const hr = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';

    L.push('CRISIS PRIORITIZER — REALITY CHECK');
    L.push(hr, '');

    // Reality check
    if (results.reality_check) {
      L.push('💡 REALITY CHECK');
      L.push(results.reality_check);
      L.push('');
      L.push(`Tasks analyzed: ${results.tasks_analyzed ?? filledTasks.length}`);
      L.push(`Actually urgent: ${results.actual_crisis_tasks ?? '?'}`);
      L.push(`Can wait: ${results.can_wait ?? '?'}`);
      L.push('');
    }

    // Grounding
    if (results.grounding_message) {
      L.push('🫁 BREATHE');
      L.push(results.grounding_message);
      L.push('');
    }

    // Today's must-dos
    if (results.todays_actual_must_dos?.length > 0) {
      L.push(hr);
      L.push('🔥 TODAY\'S ACTUAL MUST-DOS');
      L.push(hr);
      results.todays_actual_must_dos.forEach(t => L.push(`  [ ] ${t}`));
      if (results.estimated_time) L.push(`\nEstimated time: ${results.estimated_time}`);
      L.push('');
    }

    // Full priority list
    if (results.objective_priorities?.length > 0) {
      L.push(hr);
      L.push('📋 PRIORITIZED TASK LIST');
      L.push(hr);
      results.objective_priorities.forEach(item => {
        L.push(`\n#${item.rank} — ${item.task} [${(item.actual_urgency || '').toUpperCase()}]`);
        if (item.deadline) L.push(`  Deadline: ${item.deadline}`);
        if (item.consequence_if_missed) L.push(`  If missed: ${item.consequence_if_missed}`);
        if (item.anxiety_vs_reality) L.push(`  Reality: ${item.anxiety_vs_reality}`);
        if (item.do_this) L.push(`  → ${item.do_this}`);
      });
      L.push('');
    }

    // Anxiety audit
    if (results.anxiety_audit) {
      L.push(hr);
      L.push('🧠 ANXIETY AUDIT');
      L.push(hr);
      if (results.anxiety_audit.anxiety_driven?.length > 0) {
        L.push('Feels urgent but ISN\'T:');
        results.anxiety_audit.anxiety_driven.forEach(a => L.push(`  ⚠ ${a.task}: ${a.why_it_feels_urgent} → ${a.reality}`));
        L.push('');
      }
      if (results.anxiety_audit.legitimately_urgent?.length > 0) {
        L.push('Actually urgent:');
        results.anxiety_audit.legitimately_urgent.forEach(a => L.push(`  🔴 ${a.task}: ${a.why}`));
        L.push('');
      }
    }

    // Guilt-free deferrals
    if (results.guilt_free_deferrals?.length > 0) {
      L.push(hr);
      L.push('✅ PERMISSION TO DEFER');
      L.push(hr);
      results.guilt_free_deferrals.forEach(d => L.push(`  • ${d}`));
      L.push('');
    }

    // Energy-matched plan
    if (results.energy_plan) {
      L.push(hr);
      L.push('🔋 YOUR ENERGY-MATCHED PLAN');
      L.push(hr);
      L.push(results.energy_plan);
      L.push('');
    }

    // Weekly plan (this_week timeframe)
    if (results.weekly_plan?.length > 0) {
      L.push(hr);
      L.push('📅 YOUR WEEK — DAY BY DAY');
      L.push(hr);
      results.weekly_plan.forEach(day => {
        L.push(`\n${day.day_label}${day.theme ? ' — ' + day.theme : ''}`);
        if (day.energy_note) L.push(`  Energy note: ${day.energy_note}`);
        day.tasks?.forEach(t => L.push(`  [ ] ${t.task}${t.time_estimate ? ' (' + t.time_estimate + ')' : ''}`));
        if (day.rest_reminder) L.push(`  💤 ${day.rest_reminder}`);
      });
      L.push('');
    }

    // Multi-week plan (few_weeks timeframe)
    if (results.multi_week_plan?.length > 0) {
      L.push(hr);
      L.push('🗓️ YOUR MULTI-WEEK PLAN');
      L.push(hr);
      results.multi_week_plan.forEach(week => {
        L.push(`\n${week.week_label}${week.focus ? ' — Focus: ' + week.focus : ''}`);
        if (week.must_dos?.length > 0) {
          L.push('  Must-dos:');
          week.must_dos.forEach(t => L.push(`    [ ] ${t}`));
        }
        if (week.delegate?.length > 0) {
          L.push('  Delegate:');
          week.delegate.forEach(t => L.push(`    → ${t}`));
        }
        if (week.delete?.length > 0) {
          L.push('  Drop/delete:');
          week.delete.forEach(t => L.push(`    ✕ ${t}`));
        }
        if (week.self_care) L.push(`  Self-care: ${week.self_care}`);
      });
      L.push('');
    }

    // Sustainability check (few_weeks)
    if (results.sustainability_check) {
      L.push(hr);
      L.push('💛 SUSTAINABILITY CHECK');
      L.push(hr);
      L.push(results.sustainability_check);
      L.push('');
    }

    L.push(hr);
    L.push('Generated by Crisis Prioritizer • deftbrain.now');
    return L.join('\n');
  };

  const handlePrint = () => {
    const content = buildFullText();
    const pw = window.open('', '_blank');
    if (!pw) return;
    pw.document.write(`<!DOCTYPE html><html><head><title>Crisis Prioritizer — Results</title><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:0 20px;color:#1a1a1a;line-height:1.7;font-size:13px;}pre{white-space:pre-wrap;word-wrap:break-word;font-family:inherit;margin:0;}@media print{body{margin:20px;}}</style></head><body><pre>${content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></body></html>`);
    pw.document.close(); pw.focus(); setTimeout(() => pw.print(), 250);
  };

  // --- Collapsible section ---
  const Section = ({ id, title, emoji, children, defaultOpen = false, badge }) => {
    const isOpen = expandedSections[id] !== undefined ? expandedSections[id] : defaultOpen;
    return (
      <div className={`${c.card} rounded-xl shadow-lg p-6`}>
        <button onClick={() => toggleSection(id)} className={`w-full flex items-center justify-between ${c.text}`}>
          <h3 className="font-bold flex items-center gap-2">
            <span>{emoji}</span> {title}
            {badge && <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.danger} border`}>{badge}</span>}
          </h3>
          <span className="text-lg">{isOpen ? '▲' : '▼'}</span>
        </button>
        {isOpen && <div className="mt-4">{children}</div>}
      </div>
    );
  };

  // === RENDER ===
  return (
    <div>
      <div className="mb-5">
        <h2 className={`text-2xl font-bold ${c.text}`}>{toolData?.title || 'Crisis Prioritizer'} {toolData?.icon || '🚨'}</h2>
        <p className={`text-sm ${c.textMuted}`}>{toolData?.tagline || 'Separate real urgency from anxiety urgency'}</p>
      </div>

      {/* ═══════ BREATHER OVERLAY ═══════ */}
      {showBreather && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div className={`max-w-md w-full rounded-2xl p-8 text-center shadow-2xl ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
            {!results ? (
              <>
                <p className="text-4xl mb-4">🫁</p>
                <h3 className={`text-xl font-bold mb-3 ${c.text}`}>Taking a breath while we analyze...</h3>
                <p className={`text-sm ${c.textSecondary} mb-6`}>
                  In through your nose... out through your mouth. The tasks will still be there in a moment.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <span className="inline-block animate-spin text-2xl">⏳</span>
                  <span className={`text-sm ${c.textMuted}`}>Separating real urgency from anxiety...</span>
                </div>
              </>
            ) : !breatherDone ? (
              <>
                <p className="text-4xl mb-4">🫁</p>
                <h3 className={`text-xl font-bold mb-3 ${c.text}`}>Before we look at this...</h3>
                <p className={`text-sm ${c.textSecondary} mb-6`}>
                  One slow breath. In through your nose... out through your mouth. The tasks will still be there in 3 seconds.
                </p>
                <div className={`w-16 h-16 mx-auto rounded-full border-4 ${isDark ? 'border-zinc-600' : 'border-gray-200'} animate-pulse`}>
                  <div className="w-full h-full rounded-full bg-blue-400/30 animate-ping" style={{ animationDuration: '2s' }} />
                </div>
              </>
            ) : (
              <>
                <p className="text-4xl mb-4">✓</p>
                <h3 className={`text-xl font-bold mb-3 ${c.text}`}>Good. Let's look clearly.</h3>
                <p className={`text-sm ${c.textSecondary} mb-6`}>
                  {results.grounding_message || 'Not everything that feels urgent is actually urgent. Let\'s separate the two.'}
                </p>
                <button onClick={dismissBreather} className={`px-6 py-3 rounded-xl font-semibold transition-all ${c.btnPrimary}`}>
                  Show My Priorities
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══════ INPUT VIEW ═══════ */}
      {!results && !showBreather && (
        <div className="space-y-5">

          {/* Timeframe */}
          <div className="flex gap-2">
            {timeframeOptions.map(opt => (
              <button key={opt.value} onClick={() => setTimeframe(opt.value)}
                className={`flex-1 px-3 py-3 rounded-xl border text-sm font-semibold transition-all text-center ${c.chip(timeframe === opt.value)}`}>
                <span className="block text-lg mb-0.5">{opt.emoji}</span>
                {opt.label}
                <span className={`block text-xs font-normal mt-0.5 ${c.textMuted}`}>{opt.desc}</span>
              </button>
            ))}
          </div>

          {/* How are you right now? */}
          <div className={`${c.card} rounded-xl shadow-lg p-6`}>
            <label className={`block font-semibold ${c.text} mb-3`}>How are you feeling right now?</label>
            <div className="flex flex-wrap gap-2">
              {emotionalOptions.map(opt => (
                <button key={opt.value} onClick={() => setEmotionalState(opt.value)}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${c.chip(emotionalState === opt.value)}`}>
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Energy + Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`${c.card} rounded-xl shadow-lg p-6`}>
              <label className={`block font-semibold ${c.text} mb-3`}>Energy level</label>
              <div className="flex flex-wrap gap-2">
                {energyOptions.map(opt => (
                  <button key={opt.value} onClick={() => setEnergyLevel(opt.value)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${c.chip(energyLevel === opt.value)}`}>
                    {opt.emoji} {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className={`${c.card} rounded-xl shadow-lg p-6`}>
              <label className={`block font-semibold ${c.text} mb-3`}>
                {timeframe === 'right_now' ? 'How much time do you have?' :
                 timeframe === 'this_week' ? 'Hours per day you can work on this?' :
                 'Roughly how much capacity do you have?'}
              </label>
              <div className="flex flex-wrap gap-2">
                {(timeframe === 'right_now' ? hoursOptions : [
                  { value: '2', label: '~2 hrs/day' },
                  { value: '4', label: '~4 hrs/day' },
                  { value: '6', label: '~6 hrs/day' },
                  { value: '8', label: 'Full days' },
                  { value: 'unknown', label: 'Varies' },
                ]).map(opt => (
                  <button key={opt.value} onClick={() => setHoursAvailable(opt.value)}
                    className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${c.chip(hoursAvailable === opt.value)}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tasks */}
          <div className={`${c.card} rounded-xl shadow-lg p-6 transition-all ${validationFailed ? 'ring-2 ring-red-500 ring-offset-2' : ''} ${isDark && validationFailed ? 'ring-offset-zinc-900' : ''}`}>
            <label className={`block font-semibold ${c.text} mb-1`}>
              {timeframe === 'right_now' ? 'What tasks feel urgent right now?' :
               timeframe === 'this_week' ? 'Everything on your plate this week' :
               'Everything weighing on you over the next few weeks'} <span className="text-red-500">*</span>
            </label>
            <p className={`text-xs ${validationFailed ? 'text-red-500 font-medium' : c.textMuted} mb-4`}>
              {validationFailed ? 'Add at least one task to continue' :
               timeframe === 'right_now' ? 'List everything that\'s weighing on you — the analysis will sort what\'s real from what\'s anxiety.' :
               timeframe === 'this_week' ? 'Include everything — work, personal, errands, obligations. The plan will spread them across your week.' :
               'Brain-dump it all. The plan will sort by week, flag what to delegate or delete, and build in rest.'}
            </p>

            <div className="space-y-3 mb-4">
              {tasks.map((task, index) => (
                <div key={index}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={task.text}
                      onChange={(e) => { updateTask(index, 'text', e.target.value); if (validationFailed) setValidationFailed(false); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
                          e.preventDefault();
                          if (index === tasks.length - 1 && task.text.trim()) addTask();
                          else if (index < tasks.length - 1) {
                            const next = document.querySelector(`[data-task-index="${index + 1}"]`);
                            if (next) next.focus();
                          }
                        }
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && filledTasks.length > 0) {
                          e.preventDefault();
                          handlePrioritize();
                        }
                      }}
                      data-task-index={index}
                      placeholder={`Task ${index + 1}...`}
                      className={`flex-1 p-3 border rounded-lg outline-none text-sm focus:ring-2 focus:ring-red-300 ${c.input} ${validationFailed ? 'border-red-500' : ''}`}
                    />
                    <button
                      onClick={() => toggleDetails(index)}
                      title="Add deadline/context"
                      className={`px-3 rounded-lg border text-sm transition-all ${showDetails[index] ? c.chip(true) : c.chip(false)}`}>
                      ℹ️
                    </button>
                    {tasks.length > 1 && (
                      <button onClick={() => removeTask(index)}
                        className={`px-3 rounded-lg ${c.btnSecondary}`}>✕</button>
                    )}
                  </div>
                  {showDetails[index] && (
                    <div className="flex gap-2 mt-2 ml-0 sm:ml-2">
                      <input
                        type="text"
                        value={task.deadline}
                        onChange={(e) => updateTask(index, 'deadline', e.target.value)}
                        placeholder="Deadline? (e.g., today 5pm, this week, none)"
                        className={`flex-1 p-2 border rounded-lg outline-none text-xs focus:ring-2 focus:ring-red-300 ${c.input}`}
                      />
                      <input
                        type="text"
                        value={task.who}
                        onChange={(e) => updateTask(index, 'who', e.target.value)}
                        placeholder="Who's waiting on this?"
                        className={`flex-1 p-2 border rounded-lg outline-none text-xs focus:ring-2 focus:ring-red-300 ${c.input}`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button onClick={addTask}
              className={`w-full py-2 rounded-lg border text-sm font-medium transition-all ${c.chip(false)}`}>
              + Add Another Task
            </button>
          </div>

          {/* Submit */}
          <div>
            <button onClick={handlePrioritize}
              disabled={loading}
              className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
                loading ? (isDark ? 'bg-zinc-700 text-zinc-400' : 'bg-gray-200 text-gray-400') : c.btnPrimary
              }`}>
            {loading ? (<><span className="inline-block animate-spin">⏳</span> Analyzing urgency...</>)
              : (<>🚨 {timeframe === 'right_now' ? 'Prioritize These Tasks' : timeframe === 'this_week' ? 'Build My Week Plan' : 'Build My Multi-Week Plan'}</>)}
          </button>
            <p className={`text-xs text-center mt-2 ${c.textMuted}`}>Enter adds a task · Ctrl+Enter submits</p>
          </div>

          {error && (
            <div className={`p-4 rounded-xl flex items-start gap-3 ${c.danger} border`}>
              <span className="flex-shrink-0 mt-0.5">⚠️</span><p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════ RESULTS VIEW ═══════ */}
      {results && !showBreather && (
        <div className="space-y-5">

          {/* Controls */}
          <div className={`${c.card} rounded-xl shadow-lg p-4 flex items-center justify-between flex-wrap gap-3`}>
            <span className={`text-sm font-semibold ${c.text}`}>
              {timeframe === 'right_now' ? 'Priority Analysis' : timeframe === 'this_week' ? 'Weekly Plan' : 'Multi-Week Plan'} — {filledTasks.length} tasks
            </span>
            <div className="flex items-center gap-2">
              <CopyBtn content={buildFullText()} label="Copy All" />
              <button onClick={handlePrint} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${c.btnSecondary}`}>
                🖨️ Print
              </button>
              <button onClick={reset} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700'}`}>
                🔄 Start Over
              </button>
            </div>
          </div>

          {/* Reality Check */}
          {results.reality_check && (
            <div className={`${c.card} rounded-xl shadow-lg p-6 border-l-4 ${isDark ? 'border-blue-500' : 'border-blue-400'}`}>
              <h3 className={`text-lg font-bold mb-3 ${c.text}`}>💡 Reality Check</h3>
              <p className={`text-sm ${c.textSecondary} leading-relaxed mb-4`}>{results.reality_check}</p>
              <div className="flex flex-wrap gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${c.text}`}>{results.tasks_analyzed ?? filledTasks.length}</div>
                  <div className={`text-xs ${c.textMuted}`}>analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">{results.actual_crisis_tasks ?? '?'}</div>
                  <div className={`text-xs ${c.textMuted}`}>actually urgent</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{results.can_wait ?? '?'}</div>
                  <div className={`text-xs ${c.textMuted}`}>can wait</div>
                </div>
                {results.estimated_time && (
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{results.estimated_time}</div>
                    <div className={`text-xs ${c.textMuted}`}>for the must-dos</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Today's Must-Dos */}
          {results.todays_actual_must_dos?.length > 0 && (
            <div className={`p-5 rounded-xl ${c.critical} border-2`}>
              <h3 className="text-sm font-bold mb-3">🔥 TODAY'S ACTUAL MUST-DOS</h3>
              <ul className="space-y-2">
                {results.todays_actual_must_dos.map((task, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={!!checkedTasks[`must-${idx}`]}
                      onChange={() => toggleCheck(`must-${idx}`)}
                      className="w-5 h-5 rounded accent-red-500 flex-shrink-0"
                    />
                    <span className={`text-sm font-medium ${checkedTasks[`must-${idx}`] ? 'line-through opacity-60' : ''}`}>{task}</span>
                  </li>
                ))}
              </ul>
              {results.estimated_time && (
                <p className={`text-xs mt-3 ${c.textMuted}`}>Estimated time for all must-dos: {results.estimated_time}</p>
              )}
            </div>
          )}

          {/* Anxiety Audit */}
          {results.anxiety_audit && (
            <Section id="anxiety" title="Anxiety Audit" emoji="🧠" defaultOpen>
              <div className="space-y-4">
                {results.anxiety_audit.anxiety_driven?.length > 0 && (
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wide ${c.textMuted} mb-2`}>Feels urgent but ISN'T</p>
                    <div className="space-y-2">
                      {results.anxiety_audit.anxiety_driven.map((item, idx) => (
                        <div key={idx} className={`p-3 rounded-lg ${c.warning} border`}>
                          <p className="text-sm font-semibold mb-1">{item.task}</p>
                          <p className={`text-xs ${c.textSecondary}`}>
                            <span className="font-medium">Feels urgent because:</span> {item.why_it_feels_urgent}
                          </p>
                          <p className={`text-xs ${c.textSecondary}`}>
                            <span className="font-medium">Reality:</span> {item.reality}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {results.anxiety_audit.legitimately_urgent?.length > 0 && (
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wide ${c.textMuted} mb-2`}>Actually time-sensitive</p>
                    <div className="space-y-2">
                      {results.anxiety_audit.legitimately_urgent.map((item, idx) => (
                        <div key={idx} className={`p-3 rounded-lg ${c.danger} border`}>
                          <p className="text-sm font-semibold">{item.task}</p>
                          <p className={`text-xs ${c.textSecondary}`}>{item.why}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* Full Priority List */}
          {results.objective_priorities?.length > 0 && (
            <Section id="priorities" title="Full Priority List" emoji="📋" defaultOpen>
              <div className="space-y-3">
                {results.objective_priorities.map((item, idx) => (
                  <div key={idx} className={`border-2 rounded-lg p-4 ${urgencyStyle(item.actual_urgency)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold">#{item.rank}</span>
                        <h4 className="font-bold">{item.task}</h4>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isDark ? 'bg-black/20' : 'bg-white/80'} capitalize flex items-center gap-1`}>
                        {urgencyEmoji(item.actual_urgency)} {item.actual_urgency}
                      </span>
                    </div>
                    {item.deadline && <p className={`text-sm mb-1 ${c.textSecondary}`}><span className="font-semibold">Deadline:</span> {item.deadline}</p>}
                    {item.consequence_if_missed && <p className={`text-sm mb-1 ${c.textSecondary}`}><span className="font-semibold">If missed:</span> {item.consequence_if_missed}</p>}
                    {item.anxiety_vs_reality && (
                      <p className={`text-sm mb-1 ${c.textSecondary}`}><span className="font-semibold">Reality:</span> {item.anxiety_vs_reality}</p>
                    )}
                    {item.do_this && (
                      <p className={`text-sm font-semibold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>→ {item.do_this}</p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Guilt-Free Deferrals */}
          {results.guilt_free_deferrals?.length > 0 && (
            <div className={`p-5 rounded-xl ${c.success} border`}>
              <h3 className="text-sm font-bold mb-3">✅ Permission to Defer</h3>
              <ul className="space-y-2">
                {results.guilt_free_deferrals.map((statement, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="flex-shrink-0">•</span>
                    <span>{statement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Energy-Matched Plan */}
          {results.energy_plan && (
            <Section id="energy" title="Your Energy-Matched Plan" emoji="🔋">
              <p className={`text-sm ${c.textSecondary} leading-relaxed`}>{results.energy_plan}</p>
            </Section>
          )}

          {/* Weekly Plan (this_week timeframe) */}
          {results.weekly_plan?.length > 0 && (
            <Section id="weekly" title="Your Week — Day by Day" emoji="📅" defaultOpen>
              <div className="space-y-4">
                {results.weekly_plan.map((day, idx) => (
                  <div key={idx} className={`p-4 rounded-lg border ${c.cardAlt} ${c.border}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-bold text-sm ${c.text}`}>{day.day_label}</h4>
                      {day.theme && <span className={`text-xs px-2 py-0.5 rounded-full ${c.info} border`}>{day.theme}</span>}
                    </div>
                    {day.energy_note && (
                      <p className={`text-xs ${c.textMuted} mb-2 italic`}>🔋 {day.energy_note}</p>
                    )}
                    {day.tasks?.length > 0 && (
                      <ul className="space-y-1.5 mb-2">
                        {day.tasks.map((t, ti) => (
                          <li key={ti} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!!checkedTasks[`w${idx}-${ti}`]}
                              onChange={() => toggleCheck(`w${idx}-${ti}`)}
                              className="w-4 h-4 rounded accent-red-500 flex-shrink-0"
                            />
                            <span className={`text-sm ${checkedTasks[`w${idx}-${ti}`] ? 'line-through opacity-60' : ''} ${c.textSecondary}`}>
                              {t.task}
                              {t.time_estimate && <span className={`text-xs ${c.textMuted}`}> ({t.time_estimate})</span>}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {day.tasks?.length === 0 && (
                      <p className={`text-sm italic ${c.textMuted}`}>No tasks — rest day</p>
                    )}
                    {day.rest_reminder && (
                      <p className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-600'} mt-1`}>💤 {day.rest_reminder}</p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Multi-Week Plan (few_weeks timeframe) */}
          {results.multi_week_plan?.length > 0 && (
            <Section id="multiweek" title="Multi-Week Plan" emoji="🗓️" defaultOpen>
              <div className="space-y-5">
                {results.multi_week_plan.map((week, idx) => (
                  <div key={idx} className={`p-5 rounded-xl border-2 ${c.card} ${c.border}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className={`font-bold ${c.text}`}>{week.week_label}</h4>
                      {week.focus && <span className={`text-xs px-2 py-0.5 rounded-full ${c.warning} border font-semibold`}>{week.focus}</span>}
                    </div>

                    {week.must_dos?.length > 0 && (
                      <div className="mb-3">
                        <p className={`text-xs font-bold uppercase tracking-wide ${c.textMuted} mb-1`}>🔴 Must-dos</p>
                        <ul className="space-y-1">
                          {week.must_dos.map((t, ti) => (
                            <li key={ti} className="flex items-center gap-2">
                              <input type="checkbox" checked={!!checkedTasks[`mw${idx}-${ti}`]}
                                onChange={() => toggleCheck(`mw${idx}-${ti}`)} className="w-4 h-4 rounded accent-red-500 flex-shrink-0" />
                              <span className={`text-sm ${checkedTasks[`mw${idx}-${ti}`] ? 'line-through opacity-60' : ''} ${c.textSecondary}`}>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {week.delegate?.length > 0 && (
                      <div className="mb-3">
                        <p className={`text-xs font-bold uppercase tracking-wide ${c.textMuted} mb-1`}>🤝 Delegate</p>
                        <ul className="space-y-1">
                          {week.delegate.map((t, ti) => (
                            <li key={ti} className={`text-sm ${c.textSecondary} flex items-start gap-2`}>
                              <span className="flex-shrink-0">→</span><span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {week.delete?.length > 0 && (
                      <div className="mb-3">
                        <p className={`text-xs font-bold uppercase tracking-wide ${c.textMuted} mb-1`}>🗑️ Drop / Delete</p>
                        <ul className="space-y-1">
                          {week.delete.map((t, ti) => (
                            <li key={ti} className={`text-sm ${c.textSecondary} flex items-start gap-2 opacity-60`}>
                              <span className="flex-shrink-0">✕</span><span className="line-through">{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {week.self_care && (
                      <p className={`text-xs ${isDark ? 'text-purple-300' : 'text-purple-600'} mt-2`}>💜 {week.self_care}</p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Sustainability check (few_weeks) */}
          {results.sustainability_check && (
            <div className={`p-5 rounded-xl ${c.info} border`}>
              <h3 className="text-sm font-bold mb-2">💛 Sustainability Check</h3>
              <p className="text-sm">{results.sustainability_check}</p>
            </div>
          )}

          {/* If everything is critical */}
          {results.overcommitment_warning && (
            <div className={`p-5 rounded-xl ${c.purple} border`}>
              <h3 className="text-sm font-bold mb-2">💜 Overcommitment Warning</h3>
              <p className="text-sm">{results.overcommitment_warning}</p>
            </div>
          )}

          {/* Disclaimer */}
          <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-zinc-800/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${c.textMuted}`}>
              🧠 This tool analyzes consequences and deadlines, not your emotions. If you're in genuine crisis, please reach out to someone you trust or a professional.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

CrisisPrioritizer.displayName = 'CrisisPrioritizer';
export default CrisisPrioritizer;
