import React, { useState } from 'react';
import { Stethoscope, FileText, CheckSquare, HelpCircle, Loader2, Clipboard, AlertCircle, Copy, CheckCircle, ChevronDown, ChevronUp, BookOpen, Calendar, AlertTriangle } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

const DoctorVisitTranslator = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Theme-aware colors
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-gradient-to-br from-blue-50 to-cyan-50',
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-blue-200',
    cardAlt: isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-blue-50 border-blue-200',
    
    input: isDark
      ? 'bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:border-blue-500 focus:ring-blue-500/20'
      : 'bg-white border-blue-300 text-blue-900 placeholder:text-blue-400 focus:border-blue-600 focus:ring-blue-100',
    
    text: isDark ? 'text-zinc-50' : 'text-blue-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-blue-700',
    textMuted: isDark ? 'text-zinc-400' : 'text-blue-600',
    label: isDark ? 'text-zinc-200' : 'text-blue-800',
    
    btnPrimary: isDark
      ? 'bg-blue-600 hover:bg-blue-700 text-white'
      : 'bg-blue-600 hover:bg-blue-700 text-white',
    btnSecondary: isDark
      ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-50'
      : 'bg-blue-100 hover:bg-blue-200 text-blue-900',
    
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
  };

  // Form state
  const [doctorNotes, setDoctorNotes] = useState('');
  const [visitType, setVisitType] = useState('Follow-up');
  const [concerns, setConcerns] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');

  // Results state
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copiedItem, setCopiedItem] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    summary: true,
    terms: true,
    visualAids: false,
    actions: true,
    medications: false,
    medSafety: false,
    tests: false,
    followUp: true,
    questions: false,
    secondOpinion: false,
    advocacy: false,
    insurance: false,
    tips: false,
  });

  const visitTypes = [
    'Diagnosis',
    'Follow-up',
    'Treatment plan',
    'Test results',
    'Preventive care',
    'Urgent care',
    'Specialist consultation'
  ];

  const handleTranslate = async () => {
    if (!doctorNotes.trim()) {
      setError('Please enter what the doctor said or upload visit notes');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('doctor-visit-translator', {
        doctorNotes: doctorNotes.trim(),
        visitType,
        concerns: concerns.trim() || null,
        currentMedications: currentMedications.trim() || null,
      });
      
      setResults(data);
      // Auto-expand key sections
      setExpandedSections(prev => ({
        ...prev,
        summary: true,
        actions: true,
        followUp: true,
        medSafety: currentMedications.trim() ? true : false,
      }));
    } catch (err) {
      setError(err.message || 'Failed to translate medical information. Please try again.');
    }
  };

  const copyText = (text, itemName) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(itemName);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleReset = () => {
    setDoctorNotes('');
    setVisitType('Follow-up');
    setConcerns('');
    setCurrentMedications('');
    setResults(null);
    setError('');
  };

  const getPriorityColor = (priority) => {
    if (priority === 'high') return isDark ? 'text-red-400 bg-red-900/20' : 'text-red-700 bg-red-100';
    if (priority === 'medium') return isDark ? 'text-amber-400 bg-amber-900/20' : 'text-amber-700 bg-amber-100';
    return isDark ? 'text-blue-400 bg-blue-900/20' : 'text-blue-700 bg-blue-100';
  };

  return (
    <div className={`min-h-screen ${c.bg} py-8 px-4`}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200`}>
          <div className="flex items-center gap-3 mb-4">
            <div>
              <h2 className={`text-2xl font-bold ${c.text}`}>Doctor Visit Translator 🩺</h2>
              <p className={`text-sm ${c.textMuted}`}>Understand your doctor's visit in plain English</p>
            </div>
          </div>

          {/* Medical Disclaimer */}
          <div className={`${c.warning} border-l-4 rounded-r-lg p-4`}>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm mb-1">Important Medical Disclaimer</h3>
                <p className="text-xs">
                  This tool helps you understand medical information but does NOT replace medical advice. 
                  Always follow your doctor's instructions. If anything is unclear, call your doctor's office. 
                  If you have urgent symptoms, seek immediate medical care.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200`}>
          
          <div className="space-y-6">
            
            {/* Doctor's Notes/What Doctor Said */}
            <div>
              <label htmlFor="doctorNotes" className={`block text-sm font-medium ${c.label} mb-2`}>
                What did the doctor say? *
              </label>
              <p className={`text-xs ${c.textMuted} mb-2`}>
                Paste your visit notes, test results, or write what you remember the doctor saying
              </p>
              <textarea
                id="doctorNotes"
                value={doctorNotes}
                onChange={(e) => setDoctorNotes(e.target.value)}
                placeholder="Example: Doctor said I have 'hypertension' and need to start taking 'lisinopril 10mg once daily.' Blood pressure was 145/92. Need to come back in 3 months. Should reduce sodium intake and exercise 30 minutes daily..."
                className={`w-full h-48 p-4 border-2 rounded-lg ${c.input} outline-none focus:ring-2 resize-none`}
              />
            </div>

            {/* Visit Type */}
            <div>
              <label htmlFor="visitType" className={`block text-sm font-medium ${c.label} mb-2`}>
                Type of visit
              </label>
              <select
                id="visitType"
                value={visitType}
                onChange={(e) => setVisitType(e.target.value)}
                className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2`}
              >
                {visitTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Main Concerns (Optional) */}
            <div>
              <label htmlFor="concerns" className={`block text-sm font-medium ${c.label} mb-2`}>
                Your main concerns (optional)
              </label>
              <p className={`text-xs ${c.textMuted} mb-2`}>
                What are you most worried or confused about?
              </p>
              <textarea
                id="concerns"
                value={concerns}
                onChange={(e) => setConcerns(e.target.value)}
                placeholder="Example: I'm worried about the side effects of the medication. I don't understand what the blood pressure numbers mean. I'm scared about having to take medication forever..."
                className={`w-full h-24 p-4 border-2 rounded-lg ${c.input} outline-none focus:ring-2 resize-none`}
              />
            </div>

            {/* Current Medications (Optional) */}
            <div>
              <label htmlFor="currentMedications" className={`block text-sm font-medium ${c.label} mb-2`}>
                Current medications (optional but important for safety)
              </label>
              <p className={`text-xs ${c.textMuted} mb-2`}>
                List all medications, vitamins, and supplements you're currently taking
              </p>
              <textarea
                id="currentMedications"
                value={currentMedications}
                onChange={(e) => setCurrentMedications(e.target.value)}
                placeholder="Example: Metformin 500mg twice daily, Vitamin D 2000 IU, Fish oil supplement, Aspirin 81mg daily..."
                className={`w-full h-24 p-4 border-2 rounded-lg ${c.input} outline-none focus:ring-2 resize-none`}
              />
              <p className={`text-xs ${c.textMuted} mt-2`}>
                ⚠️ Important: This helps check for drug interactions with new medications
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleTranslate}
                disabled={loading || !doctorNotes.trim()}
                className={`flex-1 ${c.btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Translating...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    Translate to Plain English
                  </>
                )}
              </button>
              
              {results && (
                <button
                  onClick={handleReset}
                  className={`${c.btnSecondary} py-3 px-6 rounded-lg font-semibold transition-colors`}
                >
                  New Visit
                </button>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className={`${c.error} border rounded-lg p-4 flex items-start gap-3`}>
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {results && (
          <div className="space-y-6">
            
            {/* Plain English Summary */}
            {results.plain_english_summary && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('summary')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <BookOpen className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Plain English Summary</h3>
                  {expandedSections.summary ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.summary && (
                  <div className="space-y-4">
                    {results.plain_english_summary.diagnosis && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-semibold ${c.text} mb-2`}>What You Have:</h4>
                        <p className={`text-sm ${c.textSecondary}`}>{results.plain_english_summary.diagnosis}</p>
                      </div>
                    )}

                    {results.plain_english_summary.treatment_plan && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-semibold ${c.text} mb-2`}>What You Need to Do:</h4>
                        <p className={`text-sm ${c.textSecondary}`}>{results.plain_english_summary.treatment_plan}</p>
                      </div>
                    )}

                    {results.plain_english_summary.prognosis && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-semibold ${c.text} mb-2`}>What to Expect:</h4>
                        <p className={`text-sm ${c.textSecondary}`}>{results.plain_english_summary.prognosis}</p>
                      </div>
                    )}

                    {results.plain_english_summary.timeline && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-semibold ${c.text} mb-2`}>When Things Should Improve:</h4>
                        <p className={`text-sm ${c.textSecondary}`}>{results.plain_english_summary.timeline}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Medical Terms Explained */}
            {results.medical_terms_explained && results.medical_terms_explained.length > 0 && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('terms')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <HelpCircle className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Medical Terms Explained</h3>
                  {expandedSections.terms ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.terms && (
                  <div className="space-y-3">
                    {results.medical_terms_explained.map((term, idx) => (
                      <div key={idx} className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-bold ${c.text} mb-1`}>{term.term}</h4>
                        <p className={`text-sm ${c.textSecondary} mb-2`}>{term.definition}</p>
                        <div className={`${c.info} border rounded p-3 mt-2`}>
                          <p className="text-xs font-semibold mb-1">What this means for you:</p>
                          <p className="text-xs">{term.what_it_means_for_you}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Action Checklist */}
            {results.action_checklist && results.action_checklist.length > 0 && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('actions')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <CheckSquare className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Your Action Checklist</h3>
                  {expandedSections.actions ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.actions && (
                  <div className="space-y-3">
                    {results.action_checklist.map((action, idx) => (
                      <div key={idx} className={`${c.cardAlt} border rounded-lg p-4`}>
                        <div className="flex items-start gap-3">
                          <CheckSquare className={`w-5 h-5 flex-shrink-0 mt-0.5 ${c.textMuted}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className={`font-bold ${c.text}`}>{action.action}</h4>
                              <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(action.priority)}`}>
                                {action.priority}
                              </span>
                            </div>
                            <p className={`text-xs ${c.textMuted} mb-2`}>Why: {action.why}</p>
                            <p className={`text-xs ${c.textMuted} mb-2`}>When: {action.when}</p>
                            <p className={`text-sm ${c.textSecondary}`}>How: {action.how}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Medications */}
            {results.medications && results.medications.length > 0 && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('medications')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <Clipboard className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Medications Explained</h3>
                  {expandedSections.medications ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.medications && (
                  <div className="space-y-4">
                    {results.medications.map((med, idx) => (
                      <div key={idx} className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-bold ${c.text} mb-3`}>{med.name}</h4>
                        
                        <div className="space-y-2">
                          <div>
                            <p className={`text-xs font-semibold ${c.textMuted}`}>What it does:</p>
                            <p className={`text-sm ${c.textSecondary}`}>{med.purpose}</p>
                          </div>

                          <div>
                            <p className={`text-xs font-semibold ${c.textMuted}`}>How to take it:</p>
                            <p className={`text-sm ${c.textSecondary}`}>{med.how_to_take}</p>
                          </div>

                          {med.side_effects_to_watch && med.side_effects_to_watch.length > 0 && (
                            <div className={`${c.warning} border rounded p-3 mt-2`}>
                              <p className="text-xs font-semibold mb-1">⚠️ Side effects to watch for:</p>
                              <ul className="text-xs space-y-1">
                                {med.side_effects_to_watch.map((effect, eidx) => (
                                  <li key={eidx}>• {effect}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {med.questions_to_ask_pharmacist && med.questions_to_ask_pharmacist.length > 0 && (
                            <div className={`${c.info} border rounded p-3 mt-2`}>
                              <p className="text-xs font-semibold mb-1">Questions to ask your pharmacist:</p>
                              <ul className="text-xs space-y-1">
                                {med.questions_to_ask_pharmacist.map((q, qidx) => (
                                  <li key={qidx}>• {q}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Test Results */}
            {results.test_results_explained && results.test_results_explained.length > 0 && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('tests')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <FileText className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Test Results Explained</h3>
                  {expandedSections.tests ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.tests && (
                  <div className="space-y-3">
                    {results.test_results_explained.map((test, idx) => (
                      <div key={idx} className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-bold ${c.text} mb-2`}>{test.test}</h4>
                        <div className="grid grid-cols-2 gap-3 mb-2">
                          <div>
                            <p className={`text-xs ${c.textMuted}`}>Your result:</p>
                            <p className={`text-sm font-semibold ${c.text}`}>{test.your_result}</p>
                          </div>
                          <div>
                            <p className={`text-xs ${c.textMuted}`}>Normal range:</p>
                            <p className={`text-sm ${c.textSecondary}`}>{test.normal_range}</p>
                          </div>
                        </div>
                        <div className={`${c.info} border rounded p-3 mt-2`}>
                          <p className="text-xs font-semibold mb-1">What this means:</p>
                          <p className="text-xs">{test.what_it_means}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Follow-up Requirements */}
            {results.follow_up_requirements && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('followUp')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <Calendar className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Follow-up & Monitoring</h3>
                  {expandedSections.followUp ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.followUp && (
                  <div className="space-y-4">
                    {results.follow_up_requirements.next_appointment && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-semibold ${c.text} mb-2`}>Next Appointment:</h4>
                        <p className={`text-sm ${c.textSecondary}`}>{results.follow_up_requirements.next_appointment}</p>
                      </div>
                    )}

                    {results.follow_up_requirements.what_to_monitor && results.follow_up_requirements.what_to_monitor.length > 0 && (
                      <div className={`${c.cardAlt} border rounded-lg p-4`}>
                        <h4 className={`font-semibold ${c.text} mb-2`}>What to Monitor:</h4>
                        <ul className="space-y-1">
                          {results.follow_up_requirements.what_to_monitor.map((item, idx) => (
                            <li key={idx} className={`text-sm ${c.textSecondary}`}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {results.follow_up_requirements.when_to_call_doctor && results.follow_up_requirements.when_to_call_doctor.length > 0 && (
                      <div className={`${c.error} border rounded-lg p-4`}>
                        <h4 className="font-semibold mb-2">🚨 Call Your Doctor If:</h4>
                        <ul className="space-y-1">
                          {results.follow_up_requirements.when_to_call_doctor.map((item, idx) => (
                            <li key={idx} className="text-sm">• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Questions for Next Visit */}
            {results.questions_for_next_visit && results.questions_for_next_visit.length > 0 && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('questions')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <HelpCircle className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Questions to Ask Next Time</h3>
                  {expandedSections.questions ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.questions && (
                  <div className={`${c.cardAlt} border rounded-lg p-4`}>
                    <p className={`text-sm ${c.textMuted} mb-3`}>
                      Write these down to bring to your next appointment:
                    </p>
                    <ul className="space-y-2">
                      {results.questions_for_next_visit.map((question, idx) => (
                        <li key={idx} className={`text-sm ${c.textSecondary} flex items-start gap-2`}>
                          <span className="text-blue-500 mt-0.5">?</span>
                          <span>{question}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => copyText(results.questions_for_next_visit.join('\n'), 'questions')}
                      className={`${c.btnSecondary} py-2 px-4 rounded text-xs mt-3 flex items-center gap-2`}
                    >
                      {copiedItem === 'questions' ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy All Questions
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Health Literacy Tips */}
            {results.health_literacy_tips && results.health_literacy_tips.length > 0 && (
              <div className={`${c.card} border rounded-xl shadow-lg p-6`}>
                <button
                  onClick={() => toggleSection('tips')}
                  className="flex items-center gap-2 mb-4 w-full"
                >
                  <BookOpen className="w-5 h-5" />
                  <h3 className={`text-xl font-bold ${c.text}`}>Tips for Advocating for Yourself</h3>
                  {expandedSections.tips ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>

                {expandedSections.tips && (
                  <div className={`${c.success} border rounded-lg p-4`}>
                    <ul className="space-y-2">
                      {results.health_literacy_tips.map((tip, idx) => (
                        <li key={idx} className="text-sm">• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Final Reminder */}
            <div className={`${c.warning} border-l-4 rounded-r-lg p-4`}>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs">
                  <strong>Remember:</strong> This translation is meant to help you understand, not replace your doctor's advice. 
                  If anything is still unclear or worries you, call your doctor's office. They want you to understand your care!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorVisitTranslator;
