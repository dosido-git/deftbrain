import React, { useState } from 'react';
import { Users, Clock, Target, Shield, Loader2, Download, Copy, CheckCircle, AlertCircle, Play, MessageSquare, BookOpen, TrendingUp, ChevronDown, ChevronUp, Video, Mic, MicOff, MonitorPlay, Mail, FileText, Calendar, Vote, Users2, Zap } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

const MeetingHijackPreventer = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Theme-aware colors
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-gradient-to-br from-sky-50 to-blue-50',
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-sky-200',
    cardAlt: isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-sky-50 border-sky-200',
    
    input: isDark
      ? 'bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:border-sky-500 focus:ring-sky-500/20'
      : 'bg-white border-sky-300 text-sky-900 placeholder:text-sky-400 focus:border-sky-600 focus:ring-sky-100',
    
    text: isDark ? 'text-zinc-50' : 'text-sky-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-sky-700',
    textMuted: isDark ? 'text-zinc-400' : 'text-sky-600',
    label: isDark ? 'text-zinc-200' : 'text-sky-800',
    
    btnPrimary: isDark
      ? 'bg-sky-600 hover:bg-sky-700 text-white'
      : 'bg-sky-600 hover:bg-sky-700 text-white',
    btnSecondary: isDark
      ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-50'
      : 'bg-sky-100 hover:bg-sky-200 text-sky-900',
    
    success: isDark
      ? 'bg-green-900/20 border-green-700 text-green-200'
      : 'bg-green-50 border-green-300 text-green-800',
    warning: isDark
      ? 'bg-amber-900/20 border-amber-700 text-amber-200'
      : 'bg-amber-50 border-amber-300 text-amber-800',
    error: isDark
      ? 'bg-red-900/20 border-red-700 text-red-200'
      : 'bg-red-50 border-red-200 text-red-800',
    info: isDark
      ? 'bg-blue-900/20 border-blue-700 text-blue-200'
      : 'bg-blue-50 border-blue-200 text-blue-900',
    purple: isDark
      ? 'bg-purple-900/20 border-purple-700 text-purple-200'
      : 'bg-purple-50 border-purple-300 text-purple-800',
  };

  // Form state
  const [meetingGoal, setMeetingGoal] = useState('');
  const [duration, setDuration] = useState(60);
  const [participantCount, setParticipantCount] = useState(5);
  const [meetingType, setMeetingType] = useState('Decision-making');
  const [isVirtual, setIsVirtual] = useState(true);
  const [virtualPlatform, setVirtualPlatform] = useState('Zoom');
  const [decisionFramework, setDecisionFramework] = useState('Consensus');
  const [useTemplate, setUseTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  const [challenges, setChallenges] = useState({
    dominates: false,
    offTopic: false,
    talkOver: false,
    schedule: false,
    quietVoices: false,
  });

  // Results state
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copiedScript, setCopiedScript] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    scripts: true,
    strategies: false,
    checklist: false,
    virtual: false,
    artifacts: false,
  });

  const meetingTypes = [
    'Planning',
    'Decision-making',
    'Update/Status',
    'Brainstorm',
    'Problem-solving',
    'Retrospective',
    'One-on-one',
  ];

  const meetingTemplates = [
    { id: 'sprint-planning', name: 'Sprint Planning', type: 'Planning' },
    { id: 'retrospective', name: 'Retrospective/Postmortem', type: 'Retrospective' },
    { id: 'brainstorm', name: 'Brainstorming Session', type: 'Brainstorm' },
    { id: 'decision', name: 'Decision-making Meeting', type: 'Decision-making' },
    { id: 'standup', name: 'Daily Standup', type: 'Update/Status' },
    { id: 'one-on-one', name: 'One-on-One Check-in', type: 'One-on-one' },
  ];

  const virtualPlatforms = ['Zoom', 'Microsoft Teams', 'Google Meet', 'Other'];
  const decisionFrameworks = ['Consensus', 'Majority Vote', 'Disagree & Commit', 'Leader Decides'];
  const durationOptions = [15, 30, 45, 60, 90, 120];

  const handleChallengeToggle = (challenge) => {
    setChallenges(prev => ({
      ...prev,
      [challenge]: !prev[challenge]
    }));
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    const template = meetingTemplates.find(t => t.id === templateId);
    if (template) {
      setMeetingType(template.type);
      setUseTemplate(true);
      // Auto-populate common settings based on template
      switch (templateId) {
        case 'standup':
          setDuration(15);
          break;
        case 'sprint-planning':
          setDuration(120);
          break;
        case 'one-on-one':
          setDuration(30);
          setParticipantCount(2);
          break;
        case 'retrospective':
          setDuration(60);
          break;
        default:
          break;
      }
    }
  };

  const handleGenerate = async () => {
    if (!meetingGoal.trim() && !useTemplate) {
      setError('Please enter a meeting goal or select a template');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('meeting-hijack-preventer', {
        meetingGoal: meetingGoal.trim(),
        duration,
        participantCount,
        meetingType,
        challenges,
        isVirtual,
        virtualPlatform: isVirtual ? virtualPlatform : null,
        decisionFramework,
        useTemplate,
        selectedTemplate: useTemplate ? selectedTemplate : null,
      });
      
      setResults(data);
      // Auto-expand relevant sections
      setExpandedSections(prev => ({ 
        ...prev, 
        scripts: true,
        virtual: isVirtual,
        artifacts: true,
      }));
    } catch (err) {
      setError(err.message || 'Failed to generate meeting structure. Please try again.');
    }
  };

  const copyScript = (scriptName, scriptText) => {
    navigator.clipboard.writeText(scriptText);
    setCopiedScript(scriptName);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  const copyAllScripts = () => {
    if (!results?.facilitator_scripts) return;
    
    const allScripts = Object.entries(results.facilitator_scripts)
      .map(([name, script]) => `${name.toUpperCase().replace(/_/g, ' ')}:\n${script}\n`)
      .join('\n');
    
    navigator.clipboard.writeText(allScripts);
    setCopiedScript('all');
    setTimeout(() => setCopiedScript(null), 2000);
  };

  const copyArtifact = (artifactName, content) => {
    navigator.clipboard.writeText(content);
    setCopiedScript(artifactName);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  const downloadAgenda = () => {
    if (!results) return;
    
    let content = `MEETING AGENDA\n`;
    content += `${'='.repeat(60)}\n\n`;
    content += `Duration: ${results.meeting_structure.total_duration} minutes\n`;
    content += `Type: ${meetingType}\n`;
    content += `Platform: ${isVirtual ? virtualPlatform : 'In-person'}\n`;
    content += `Decision Framework: ${decisionFramework}\n\n`;
    
    content += `AGENDA ITEMS:\n${'-'.repeat(60)}\n`;
    results.meeting_structure.agenda_items.forEach((item, idx) => {
      content += `\n${idx + 1}. ${item.topic} (${item.time_allocated} min)\n`;
      content += `   Objective: ${item.objective}\n`;
      content += `   Facilitator: ${item.facilitator_role}\n`;
    });
    
    if (results.virtual_meeting_protocols && isVirtual) {
      content += `\n\nVIRTUAL MEETING PROTOCOLS:\n${'-'.repeat(60)}\n`;
      Object.entries(results.virtual_meeting_protocols).forEach(([key, value]) => {
        content += `\n${key.toUpperCase().replace(/_/g, ' ')}:\n${value}\n`;
      });
    }
    
    content += `\n\nFACILITATOR SCRIPTS:\n${'-'.repeat(60)}\n`;
    Object.entries(results.facilitator_scripts).forEach(([name, script]) => {
      content += `\n${name.toUpperCase().replace(/_/g, ' ')}:\n${script}\n`;
    });
    
    if (results.meeting_artifacts?.action_items_template) {
      content += `\n\nACTION ITEMS TEMPLATE:\n${'-'.repeat(60)}\n`;
      content += results.meeting_artifacts.action_items_template;
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-agenda-${meetingType.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
  };

  const downloadMinutes = () => {
    if (!results?.meeting_artifacts?.meeting_minutes_template) return;
    
    const blob = new Blob([results.meeting_artifacts.meeting_minutes_template], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meeting-minutes-template.txt';
    a.click();
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getTotalAllocatedTime = () => {
    if (!results?.meeting_structure?.agenda_items) return 0;
    return results.meeting_structure.agenda_items.reduce((sum, item) => sum + item.time_allocated, 0);
  };

  const handleReset = () => {
    setMeetingGoal('');
    setDuration(60);
    setParticipantCount(5);
    setMeetingType('Decision-making');
    setIsVirtual(true);
    setVirtualPlatform('Zoom');
    setDecisionFramework('Consensus');
    setUseTemplate(false);
    setSelectedTemplate('');
    setChallenges({
      dominates: false,
      offTopic: false,
      talkOver: false,
      schedule: false,
      quietVoices: false,
    });
    setResults(null);
    setError('');
  };

  return (
    <div className={`min-h-screen ${c.bg} py-8 px-4`}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200`}>
          <div className="flex items-center gap-3 mb-4">
            <div>
              <h2 className={`text-2xl font-bold ${c.text}`}>Meeting Hijack Preventer 🛡️</h2>
              <p className={`text-sm ${c.textMuted}`}>Create structured agendas that keep meetings focused and inclusive</p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200`}>
          
          {/* Neurodivergent-friendly notice */}
          <div className={`${c.info} border-l-4 rounded-r-lg p-4 mb-6`}>
            <div className="flex items-start gap-2">
              <Target className={`w-4 h-4 flex-shrink-0 mt-0.5`} />
              <div>
                <h3 className={`font-bold text-sm mb-1`}>Built for Everyone</h3>
                <p className={`text-xs ${c.textSecondary}`}>
                  Designed with neurodivergent users in mind. Clear time boxes, explicit roles, and redirect scripts help everyone participate effectively.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            
            {/* Template Selection */}
            <div>
              <label className={`block text-sm font-medium ${c.label} mb-3`}>
                Quick Start: Use a Template (Optional)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {meetingTemplates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`p-3 border-2 rounded-lg text-left transition-all ${
                      selectedTemplate === template.id
                        ? isDark
                          ? 'border-sky-500 bg-sky-900/30'
                          : 'border-sky-500 bg-sky-50'
                        : isDark
                          ? 'border-zinc-700 hover:border-zinc-600'
                          : 'border-sky-200 hover:border-sky-300'
                    }`}
                  >
                    <div className={`text-sm font-semibold ${c.text}`}>{template.name}</div>
                    <div className={`text-xs ${c.textMuted} mt-1`}>{template.type}</div>
                  </button>
                ))}
              </div>
              {selectedTemplate && (
                <p className={`text-xs ${c.textMuted} mt-2`}>
                  ✓ Template selected. You can still customize the goal below.
                </p>
              )}
            </div>

            {/* Meeting Goal */}
            <div>
              <label htmlFor="goal" className={`block text-sm font-medium ${c.label} mb-2`}>
                What's the goal of this meeting? {!useTemplate && '*'}
              </label>
              <textarea
                id="goal"
                value={meetingGoal}
                onChange={(e) => setMeetingGoal(e.target.value)}
                placeholder={useTemplate 
                  ? "Optional: Add specifics to the template..." 
                  : "e.g., Decide on Q1 marketing strategy, align on project timeline, brainstorm product features..."}
                className={`w-full h-24 p-4 border-2 rounded-lg ${c.input} outline-none focus:ring-2 resize-none`}
              />
            </div>

            {/* Meeting Format */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Virtual/In-person */}
              <div>
                <label className={`block text-sm font-medium ${c.label} mb-2`}>
                  Meeting Format
                </label>
                <div className="flex gap-3">
                  <label className={`flex-1 flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    isVirtual
                      ? isDark ? 'border-sky-500 bg-sky-900/20' : 'border-sky-500 bg-sky-50'
                      : isDark ? 'border-zinc-700' : 'border-sky-200'
                  }`}>
                    <input
                      type="radio"
                      checked={isVirtual}
                      onChange={() => setIsVirtual(true)}
                      className="w-4 h-4"
                    />
                    <Video className="w-4 h-4" />
                    <span className="text-sm">Virtual</span>
                  </label>
                  <label className={`flex-1 flex items-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                    !isVirtual
                      ? isDark ? 'border-sky-500 bg-sky-900/20' : 'border-sky-500 bg-sky-50'
                      : isDark ? 'border-zinc-700' : 'border-sky-200'
                  }`}>
                    <input
                      type="radio"
                      checked={!isVirtual}
                      onChange={() => setIsVirtual(false)}
                      className="w-4 h-4"
                    />
                    <Users className="w-4 h-4" />
                    <span className="text-sm">In-person</span>
                  </label>
                </div>
              </div>

              {/* Platform (if virtual) */}
              {isVirtual && (
                <div>
                  <label htmlFor="platform" className={`block text-sm font-medium ${c.label} mb-2`}>
                    Platform
                  </label>
                  <select
                    id="platform"
                    value={virtualPlatform}
                    onChange={(e) => setVirtualPlatform(e.target.value)}
                    className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2`}
                  >
                    {virtualPlatforms.map(platform => (
                      <option key={platform} value={platform}>{platform}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Meeting Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Duration */}
              <div>
                <label htmlFor="duration" className={`block text-sm font-medium ${c.label} mb-2`}>
                  Duration (minutes)
                </label>
                <select
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2`}
                >
                  {durationOptions.map(min => (
                    <option key={min} value={min}>{min} min</option>
                  ))}
                </select>
              </div>

              {/* Participants */}
              <div>
                <label htmlFor="participants" className={`block text-sm font-medium ${c.label} mb-2`}>
                  Participants
                </label>
                <input
                  id="participants"
                  type="number"
                  min="2"
                  max="20"
                  value={participantCount}
                  onChange={(e) => setParticipantCount(Number(e.target.value))}
                  className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2`}
                />
              </div>

              {/* Meeting Type */}
              <div>
                <label htmlFor="type" className={`block text-sm font-medium ${c.label} mb-2`}>
                  Meeting Type
                </label>
                <select
                  id="type"
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value)}
                  className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2`}
                >
                  {meetingTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Decision Framework */}
            <div>
              <label htmlFor="framework" className={`block text-sm font-medium ${c.label} mb-2`}>
                <Vote className="w-4 h-4 inline mr-1" />
                Decision-Making Framework
              </label>
              <select
                id="framework"
                value={decisionFramework}
                onChange={(e) => setDecisionFramework(e.target.value)}
                className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2`}
              >
                {decisionFrameworks.map(framework => (
                  <option key={framework} value={framework}>{framework}</option>
                ))}
              </select>
              <p className={`text-xs ${c.textMuted} mt-1`}>
                {decisionFramework === 'Consensus' && 'Everyone must agree before moving forward'}
                {decisionFramework === 'Majority Vote' && 'Decision made by voting, majority wins'}
                {decisionFramework === 'Disagree & Commit' && 'Voice concerns, then commit to decision'}
                {decisionFramework === 'Leader Decides' && 'Leader decides after hearing input'}
              </p>
            </div>

            {/* Known Challenges */}
            <div>
              <label className={`block text-sm font-medium ${c.label} mb-3`}>
                Known challenges (check all that apply)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'dominates', label: 'One person dominates' },
                  { key: 'offTopic', label: 'Gets off-topic easily' },
                  { key: 'talkOver', label: 'People talk over each other' },
                  { key: 'schedule', label: 'Hard to keep on schedule' },
                  { key: 'quietVoices', label: 'Quiet people don\'t speak up' },
                ].map(({ key, label }) => (
                  <label
                    key={key}
                    className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      challenges[key]
                        ? isDark
                          ? 'border-sky-500 bg-sky-900/20'
                          : 'border-sky-500 bg-sky-50'
                        : isDark
                          ? 'border-zinc-700 hover:border-zinc-600'
                          : 'border-sky-200 hover:border-sky-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={challenges[key]}
                      onChange={() => handleChallengeToggle(key)}
                      className="w-4 h-4 text-sky-600 rounded focus:ring-2 focus:ring-sky-500"
                    />
                    <span className={`text-sm ${c.text}`}>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading || (!meetingGoal.trim() && !useTemplate)}
                className={`flex-1 ${c.btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating structure...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Generate Meeting Structure
                  </>
                )}
              </button>
              
              {results && (
                <button
                  onClick={handleReset}
                  className={`${c.btnSecondary} py-3 px-6 rounded-lg font-semibold transition-colors`}
                >
                  New Meeting
                </button>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className={`${c.error} border rounded-lg p-4 flex items-start gap-3`}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            
            {/* Meeting Structure Overview */}
            <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${c.text} flex items-center gap-2`}>
                  <Clock className="w-5 h-5" />
                  Meeting Structure
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={downloadAgenda}
                    className={`${c.btnSecondary} py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-colors`}
                  >
                    <Download className="w-4 h-4" />
                    Download Agenda
                  </button>
                </div>
              </div>

              {/* Time Summary */}
              <div className={`${c.cardAlt} border rounded-lg p-4 mb-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${c.textMuted}`}>Total Duration</p>
                    <p className={`text-2xl font-bold ${c.text}`}>{results.meeting_structure.total_duration} min</p>
                  </div>
                  <div>
                    <p className={`text-sm ${c.textMuted}`}>Content Time</p>
                    <p className={`text-2xl font-bold ${c.text}`}>{getTotalAllocatedTime()} min</p>
                  </div>
                  <div>
                    <p className={`text-sm ${c.textMuted}`}>Buffer</p>
                    <p className={`text-2xl font-bold ${c.text}`}>{results.meeting_structure.buffer_time} min</p>
                  </div>
                </div>
              </div>

              {/* Timeline Visualization */}
              <div className="space-y-3">
                {results.meeting_structure.agenda_items.map((item, idx) => (
                  <div key={idx} className={`${c.cardAlt} border rounded-lg p-4`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${isDark ? 'bg-sky-600 text-white' : 'bg-sky-600 text-white'}`}>
                            {idx + 1}
                          </span>
                          <h4 className={`font-bold ${c.text}`}>{item.topic}</h4>
                        </div>
                        <p className={`text-sm ${c.textSecondary} ml-8`}>{item.objective}</p>
                      </div>
                      <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${isDark ? 'bg-sky-900/30 text-sky-300' : 'bg-sky-100 text-sky-700'}`}>
                        <Clock className="w-3 h-3" />
                        <span className="text-sm font-semibold">{item.time_allocated} min</span>
                      </div>
                    </div>
                    
                    {/* Facilitator role */}
                    <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-white'} border ${isDark ? 'border-zinc-700' : 'border-sky-200'}`}>
                      <p className={`text-xs font-semibold ${c.textMuted} mb-1`}>FACILITATOR ROLE:</p>
                      <p className={`text-sm ${c.textSecondary}`}>{item.facilitator_role}</p>
                    </div>

                    {/* Speaker order */}
                    {item.speaker_order && item.speaker_order.length > 0 && (
                      <div className="mt-2">
                        <p className={`text-xs font-semibold ${c.textMuted} mb-1`}>SPEAKING ORDER:</p>
                        <div className="flex flex-wrap gap-2">
                          {item.speaker_order.map((speaker, sidx) => (
                            <span key={sidx} className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-sky-50 text-sky-700'}`}>
                              {sidx + 1}. {speaker}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Time warning */}
                    {item.time_warning && (
                      <div className={`mt-3 p-2 rounded ${isDark ? 'bg-amber-900/20 border border-amber-700' : 'bg-amber-50 border border-amber-300'}`}>
                        <p className={`text-xs ${isDark ? 'text-amber-200' : 'text-amber-800'}`}>
                          <strong>Time warning:</strong> "{item.time_warning}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Parking Lot Instructions */}
              {results.meeting_structure.parking_lot_instructions && (
                <div className={`mt-4 p-4 rounded-lg border-2 ${isDark ? 'border-purple-700 bg-purple-900/20' : 'border-purple-300 bg-purple-50'}`}>
                  <p className={`text-sm font-semibold ${isDark ? 'text-purple-200' : 'text-purple-900'} mb-2`}>
                    🅿️ Parking Lot Strategy:
                  </p>
                  <p className={`text-sm ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>
                    {results.meeting_structure.parking_lot_instructions}
                  </p>
                </div>
              )}

              {/* Decision Framework Info */}
              {results.decision_making_structure && (
                <div className={`mt-4 p-4 rounded-lg border-2 ${isDark ? 'border-blue-700 bg-blue-900/20' : 'border-blue-300 bg-blue-50'}`}>
                  <div className="flex items-start gap-2">
                    <Vote className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className={`text-sm font-semibold ${isDark ? 'text-blue-200' : 'text-blue-900'} mb-2`}>
                        Decision Framework: {decisionFramework}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-800'} mb-2`}>
                        {results.decision_making_structure.when_to_use}
                      </p>
                      {results.decision_making_structure.process && (
                        <div className="mt-2">
                          <p className={`text-xs font-semibold ${isDark ? 'text-blue-300' : 'text-blue-800'} mb-1`}>PROCESS:</p>
                          <p className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                            {results.decision_making_structure.process}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Virtual Meeting Protocols */}
            {results.virtual_meeting_protocols && isVirtual && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('virtual')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <Video className={`w-5 h-5 ${c.accent}`} />
                  <h3 className={`text-xl font-bold ${c.text}`}>{virtualPlatform} Specific Protocols</h3>
                  {expandedSections.virtual ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.virtual && (
                  <div className="space-y-4">
                    {Object.entries(results.virtual_meeting_protocols).map(([protocolName, protocol]) => (
                      <div key={protocolName} className={`${c.cardAlt} border rounded-lg p-4`}>
                        <div className="flex items-center gap-2 mb-2">
                          {protocolName.includes('mute') && <MicOff className="w-4 h-4" />}
                          {protocolName.includes('screen') && <MonitorPlay className="w-4 h-4" />}
                          {protocolName.includes('chat') && <MessageSquare className="w-4 h-4" />}
                          {protocolName.includes('hand') && <Users2 className="w-4 h-4" />}
                          <h4 className={`font-semibold ${c.text} capitalize`}>
                            {protocolName.replace(/_/g, ' ')}
                          </h4>
                        </div>
                        <p className={`text-sm ${c.textSecondary}`}>{protocol}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Facilitator Scripts */}
            <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => toggleSection('scripts')}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className={`w-5 h-5 ${c.accent}`} />
                  <h3 className={`text-xl font-bold ${c.text}`}>Facilitator Scripts</h3>
                  {expandedSections.scripts ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={copyAllScripts}
                  className={`${c.btnSecondary} py-2 px-4 rounded-lg text-sm flex items-center gap-2 transition-colors`}
                >
                  {copiedScript === 'all' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy All
                    </>
                  )}
                </button>
              </div>

              {expandedSections.scripts && (
                <div className="space-y-4">
                  {Object.entries(results.facilitator_scripts).map(([scriptName, scriptText]) => (
                    <div key={scriptName} className={`${c.cardAlt} border rounded-lg p-4`}>
                      <div className="flex items-start justify-between mb-2">
                        <h4 className={`font-semibold ${c.text} capitalize`}>
                          {scriptName.replace(/_/g, ' ')}
                        </h4>
                        <button
                          onClick={() => copyScript(scriptName, scriptText)}
                          className={`${c.btnSecondary} py-1 px-3 rounded text-xs flex items-center gap-1 transition-colors`}
                        >
                          {copiedScript === scriptName ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <p className={`text-sm ${c.textSecondary} italic`}>"{scriptText}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Speaking Roles */}
            {results.speaking_roles && results.speaking_roles.length > 0 && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <h3 className={`text-xl font-bold ${c.text} mb-4 flex items-center gap-2`}>
                  <Users className="w-5 h-5" />
                  Assigned Roles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.speaking_roles.map((role, idx) => (
                    <div key={idx} className={`${c.cardAlt} border rounded-lg p-4`}>
                      <h4 className={`font-bold ${c.text} mb-2`}>{role.role}</h4>
                      <p className={`text-sm ${c.textSecondary}`}>{role.responsibility}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meeting Artifacts */}
            {results.meeting_artifacts && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('artifacts')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <FileText className={`w-5 h-5 ${c.accent}`} />
                  <h3 className={`text-xl font-bold ${c.text}`}>Meeting Artifacts & Follow-up</h3>
                  {expandedSections.artifacts ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.artifacts && (
                  <div className="space-y-4">
                    
                    {/* Action Items Template */}
                    {results.meeting_artifacts.action_items_template && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className={`font-semibold ${c.text} flex items-center gap-2`}>
                            <CheckCircle className="w-4 h-4" />
                            Action Items Tracker
                          </h4>
                          <button
                            onClick={() => copyArtifact('action-items', results.meeting_artifacts.action_items_template)}
                            className={`${c.btnSecondary} py-1 px-3 rounded text-xs flex items-center gap-1`}
                          >
                            {copiedScript === 'action-items' ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <pre className={`text-xs ${c.textSecondary} whitespace-pre-wrap font-mono ${isDark ? 'bg-zinc-900' : 'bg-white'} p-3 rounded`}>
                          {results.meeting_artifacts.action_items_template}
                        </pre>
                      </div>
                    )}

                    {/* Meeting Minutes Template */}
                    {results.meeting_artifacts.meeting_minutes_template && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className={`font-semibold ${c.text} flex items-center gap-2`}>
                            <BookOpen className="w-4 h-4" />
                            Meeting Minutes Template
                          </h4>
                          <div className="flex gap-2">
                            <button
                              onClick={downloadMinutes}
                              className={`${c.btnSecondary} py-1 px-3 rounded text-xs flex items-center gap-1`}
                            >
                              <Download className="w-3 h-3" />
                              Download
                            </button>
                            <button
                              onClick={() => copyArtifact('minutes', results.meeting_artifacts.meeting_minutes_template)}
                              className={`${c.btnSecondary} py-1 px-3 rounded text-xs flex items-center gap-1`}
                            >
                              {copiedScript === 'minutes' ? (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  Copy
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        <p className={`text-xs ${c.textMuted}`}>Fill out during or immediately after the meeting</p>
                      </div>
                    )}

                    {/* Follow-up Email */}
                    {results.meeting_artifacts.follow_up_email && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className={`font-semibold ${c.text} flex items-center gap-2`}>
                            <Mail className="w-4 h-4" />
                            Follow-up Email Draft
                          </h4>
                          <button
                            onClick={() => copyArtifact('email', results.meeting_artifacts.follow_up_email)}
                            className={`${c.btnSecondary} py-1 px-3 rounded text-xs flex items-center gap-1`}
                          >
                            {copiedScript === 'email' ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <pre className={`text-sm ${c.textSecondary} whitespace-pre-wrap ${isDark ? 'bg-zinc-900' : 'bg-white'} p-3 rounded border ${isDark ? 'border-zinc-700' : 'border-sky-200'}`}>
                          {results.meeting_artifacts.follow_up_email}
                        </pre>
                      </div>
                    )}

                    {/* Decision Log */}
                    {results.meeting_artifacts.decision_log && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className={`font-semibold ${c.text} flex items-center gap-2`}>
                            <Vote className="w-4 h-4" />
                            Decision Log Template
                          </h4>
                          <button
                            onClick={() => copyArtifact('decisions', results.meeting_artifacts.decision_log)}
                            className={`${c.btnSecondary} py-1 px-3 rounded text-xs flex items-center gap-1`}
                          >
                            {copiedScript === 'decisions' ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                Copy
                              </>
                            )}
                          </button>
                        </div>
                        <p className={`text-xs ${c.textSecondary}`}>{results.meeting_artifacts.decision_log}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Anti-Hijack Strategies */}
            {results.anti_hijack_strategies && results.anti_hijack_strategies.length > 0 && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('strategies')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <Target className={`w-5 h-5 ${c.accent}`} />
                  <h3 className={`text-xl font-bold ${c.text}`}>Anti-Hijack Strategies</h3>
                  {expandedSections.strategies ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.strategies && (
                  <div className="space-y-4">
                    {results.anti_hijack_strategies.map((strategy, idx) => (
                      <div key={idx} className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-bold ${c.text} mb-3`}>Scenario: {strategy.scenario}</h4>
                        <div className="space-y-2">
                          <div>
                            <p className={`text-xs font-semibold ${c.textMuted} mb-1`}>PREVENTION:</p>
                            <p className={`text-sm ${c.textSecondary}`}>{strategy.prevention}</p>
                          </div>
                          <div>
                            <p className={`text-xs font-semibold ${c.textMuted} mb-1`}>IF IT HAPPENS:</p>
                            <p className={`text-sm ${c.textSecondary}`}>{strategy.response}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Preparation Checklist */}
            {results.preparation_checklist && results.preparation_checklist.length > 0 && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('checklist')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <BookOpen className={`w-5 h-5 ${c.accent}`} />
                  <h3 className={`text-xl font-bold ${c.text}`}>Preparation Checklist</h3>
                  {expandedSections.checklist ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.checklist && (
                  <ul className="space-y-2">
                    {results.preparation_checklist.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'} flex-shrink-0 mt-0.5`} />
                        <span className={`text-sm ${c.textSecondary}`}>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Success Metrics */}
            {results.success_metrics && (
              <div className={`${c.success} border-l-4 rounded-r-lg p-6`}>
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Success Metrics
                </h3>
                <p className="text-sm">{results.success_metrics}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingHijackPreventer;
