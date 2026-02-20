import React, { useState } from 'react';
import { Zap, Move, Loader2, CheckCircle, X } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

const FreezeStateUnblocker = () => {
  const { isDark } = useTheme();
  const { callToolEndpoint, loading, error: apiError } = useClaudeAPI();

  // State
  const [view, setView] = useState('start'); // start | actions | complete
  const [taskDescription, setTaskDescription] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [results, setResults] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [error, setError] = useState('');

  // Theme colors - calming, minimal
  const c = {
    gradient: isDark ? 'from-slate-900 to-gray-900' : 'from-slate-50 to-gray-100',
    card: isDark ? 'bg-gray-800' : 'bg-white',
    text: isDark ? 'text-gray-100' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-300' : 'text-gray-700',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
    btnPrimary: isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white',
    btnSecondary: isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' : 'bg-gray-200 hover:bg-gray-300 text-gray-700',
  };

  // Get unstuck - call API
  const getUnstuck = async () => {
    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('freeze-state-unblocker', {
        taskDescription: taskDescription || null,
        stillStuck: false
      });

      setResults(data);
      setView('actions');
      setCurrentStep(0);
      setCompletedSteps([]);
    } catch (err) {
      setError(err.message || 'Failed to generate actions');
    }
  };

  // Get even smaller steps
  const getSmallerSteps = async () => {
    setError('');

    try {
      const data = await callToolEndpoint('freeze-state-unblocker', {
        taskDescription: taskDescription || null,
        stillStuck: true,
        currentAction: results?.sequential_micro_actions[currentStep]?.action
      });

      setResults(data);
      setCurrentStep(0);
      setCompletedSteps([]);
    } catch (err) {
      setError(err.message || 'Failed to generate smaller steps');
    }
  };

  // Mark current step complete
  const completeStep = () => {
    setCompletedSteps([...completedSteps, currentStep]);
    
    // Check if this was the last step
    if (currentStep >= results.sequential_micro_actions.length - 1) {
      setView('complete');
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  // Reset tool
  const reset = () => {
    setView('start');
    setTaskDescription('');
    setShowTaskInput(false);
    setResults(null);
    setCurrentStep(0);
    setCompletedSteps([]);
    setError('');
  };

  // Get current action
  const currentAction = results?.sequential_micro_actions[currentStep];

  return (
    <div className={`min-h-screen bg-gradient-to-br ${c.gradient} p-6 flex items-center justify-center`}>
      <div className="max-w-2xl w-full">
        
        {/* START VIEW - Minimal single button */}
        {view === 'start' && (
          <div className="text-center space-y-8">
            
            {/* Title */}
            <div>
              <Zap className="w-16 h-16 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
              <h1 className={`text-4xl font-bold ${c.text} mb-3`}>
                Freeze State Unblocker
              </h1>
              <p className={`text-xl ${c.textSecondary}`}>
                Completely stuck? Let's just do one tiny thing.
              </p>
            </div>

            {/* Main action button */}
            <div className={`${c.card} rounded-3xl shadow-2xl p-12`}>
              <button
                onClick={getUnstuck}
                disabled={loading}
                className={`w-full ${c.btnPrimary} py-8 rounded-2xl font-bold text-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-transform hover:scale-105`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-8 h-8 inline mr-3 animate-spin" />
                    Getting first step...
                  </>
                ) : (
                  <>
                    <Zap className="w-8 h-8 inline mr-3" />
                    I'm Stuck
                  </>
                )}
              </button>

              {/* Optional task input - hidden by default */}
              <div className="mt-6">
                {!showTaskInput ? (
                  <button
                    onClick={() => setShowTaskInput(true)}
                    className={`text-sm ${c.textMuted} hover:${c.textSecondary} underline`}
                  >
                    Optional: Tell me what you're stuck on
                  </button>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      placeholder="e.g., 'laundry' or 'email' (optional - you can leave blank)"
                      className={`w-full px-4 py-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                    <button
                      onClick={() => {
                        setShowTaskInput(false);
                        setTaskDescription('');
                      }}
                      className={`text-xs ${c.textMuted} hover:${c.textSecondary}`}
                    >
                      ✕ Clear (it's okay to leave blank)
                    </button>
                  </div>
                )}
              </div>

              {/* Error display */}
              {error && (
                <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}
            </div>

            {/* Reassurance */}
            <div className={`${c.textMuted} text-sm max-w-md mx-auto`}>
              <p className="mb-2">You don't have to explain why you're stuck.</p>
              <p className="mb-2">You don't have to do the whole thing.</p>
              <p>Just click the button.</p>
            </div>
          </div>
        )}

        {/* ACTIONS VIEW - One step at a time */}
        {view === 'actions' && results && currentAction && (
          <div className="space-y-6">
            
            {/* Progress indicator */}
            <div className="text-center">
              <p className={`text-sm ${c.textMuted} mb-2`}>
                Step {currentStep + 1} of {results.sequential_micro_actions.length}
              </p>
              <div className="flex gap-1 justify-center">
                {results.sequential_micro_actions.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 w-8 rounded-full ${
                      completedSteps.includes(idx)
                        ? 'bg-green-500'
                        : idx === currentStep
                        ? 'bg-blue-500'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Acknowledgment (show on first step) */}
            {currentStep === 0 && results.acknowledgment && (
              <div className={`${c.card} rounded-2xl shadow-lg p-6 border-l-4 border-blue-500`}>
                <p className={`text-lg ${c.text} text-center`}>
                  {results.acknowledgment}
                </p>
              </div>
            )}

            {/* Current action - BIG and clear */}
            <div className={`${c.card} rounded-3xl shadow-2xl p-10 text-center space-y-6`}>
              
              {/* Action number */}
              <div className="inline-block px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold">
                Step {currentStep + 1}
              </div>

              {/* Main action - LARGE text */}
              <div>
                <Move className="w-12 h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
                <p className={`text-3xl font-bold ${c.text} leading-tight`}>
                  {currentAction.action}
                </p>
              </div>

              {/* Completion signal */}
              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                <p className={`text-sm ${c.textMuted} mb-1`}>You'll know you're done when:</p>
                <p className={`text-base ${c.textSecondary} font-semibold`}>
                  {currentAction.completion_signal}
                </p>
              </div>

              {/* Just this one thing */}
              {currentStep === 0 && results.first_micro_action && (
                <div className={`p-4 rounded-lg border-2 border-blue-500`}>
                  <p className={`text-sm ${c.text}`}>
                    <strong>Just this one thing.</strong> {results.first_micro_action.just_this_one_thing}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-3">
                <button
                  onClick={completeStep}
                  className={`w-full ${c.btnPrimary} py-6 rounded-xl font-bold text-xl shadow-lg transition-transform hover:scale-105`}
                >
                  <CheckCircle className="w-6 h-6 inline mr-2" />
                  I Did It
                </button>

                <button
                  onClick={getSmallerSteps}
                  disabled={loading}
                  className={`w-full ${c.btnSecondary} py-4 rounded-xl font-semibold text-sm`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                      Getting smaller steps...
                    </>
                  ) : (
                    "This step is too big - give me something smaller"
                  )}
                </button>

                <button
                  onClick={reset}
                  className={`w-full ${c.btnSecondary} py-3 rounded-xl text-sm`}
                >
                  I need to stop (that's okay)
                </button>
              </div>

              {/* Permission messaging */}
              {results.what_we_are_NOT_doing && (
                <div className={`pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <p className={`text-xs ${c.textMuted} text-center`}>
                    {results.what_we_are_NOT_doing.not_forcing}
                  </p>
                </div>
              )}
            </div>

            {/* Why this helps (small text) */}
            {currentStep === 0 && results.first_micro_action?.why_this_helps && (
              <div className={`text-center text-sm ${c.textMuted} max-w-md mx-auto`}>
                <p>Why this helps: {results.first_micro_action.why_this_helps}</p>
              </div>
            )}
          </div>
        )}

        {/* COMPLETE VIEW - Check-in and next steps */}
        {view === 'complete' && results && (
          <div className="space-y-6">
            
            {/* Celebration */}
            <div className={`${c.card} rounded-3xl shadow-2xl p-10 text-center space-y-6`}>
              <CheckCircle className="w-20 h-20 mx-auto text-green-600 dark:text-green-400" />
              
              <div>
                <h2 className={`text-3xl font-bold ${c.text} mb-3`}>
                  You Moved
                </h2>
                <p className={`text-xl ${c.textSecondary}`}>
                  You completed {completedSteps.length + 1} steps
                </p>
              </div>

              {/* Check-in */}
              {results.after_sequence && (
                <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-blue-50'}`}>
                  <p className={`text-lg ${c.text} mb-4 font-semibold`}>
                    {results.after_sequence.check_in}
                  </p>
                  
                  <div className="flex gap-3 justify-center">
                    <button className={`px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold`}>
                      Better
                    </button>
                    <button className={`px-6 py-3 rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white font-semibold`}>
                      Same
                    </button>
                    <button className={`px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold`}>
                      Worse
                    </button>
                  </div>
                </div>
              )}

              {/* Task-specific next step (if task was identified) */}
              {results.if_freeze_is_about_specific_task && (
                <div className={`p-6 rounded-xl border-2 border-blue-500`}>
                  <p className={`text-sm ${c.textMuted} mb-2`}>
                    If you want to keep going with: {results.if_freeze_is_about_specific_task.task_identified}
                  </p>
                  <p className={`text-lg ${c.text} font-semibold mb-2`}>
                    Smallest next thing:
                  </p>
                  <p className={`text-base ${c.textSecondary} mb-3`}>
                    {results.if_freeze_is_about_specific_task.smallest_possible_step}
                  </p>
                  <p className={`text-xs ${c.textMuted} italic`}>
                    {results.if_freeze_is_about_specific_task.permission}
                  </p>
                </div>
              )}

              {/* Permissions */}
              {results.after_sequence && (
                <div className="space-y-3">
                  <p className={`text-base ${c.text}`}>
                    {results.after_sequence.permission_to_stop}
                  </p>
                  
                  {results.what_we_are_NOT_doing && (
                    <p className={`text-sm ${c.textMuted}`}>
                      {results.what_we_are_NOT_doing.not_judging}
                    </p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={reset}
                  className={`w-full ${c.btnPrimary} py-4 rounded-xl font-bold text-lg`}
                >
                  Start Over (if stuck again)
                </button>
                
                <button
                  onClick={reset}
                  className={`w-full ${c.btnSecondary} py-3 rounded-xl text-sm`}
                >
                  I'm done for now
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className={`${c.card} rounded-xl p-6 text-center`}>
              <p className={`text-sm ${c.textMuted} mb-2`}>What you did:</p>
              <div className="flex justify-center gap-8">
                <div>
                  <p className={`text-2xl font-bold ${c.text}`}>{completedSteps.length + 1}</p>
                  <p className={`text-xs ${c.textMuted}`}>Steps completed</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold text-green-600 dark:text-green-400`}>✓</p>
                  <p className={`text-xs ${c.textMuted}`}>Freeze broken</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default FreezeStateUnblocker;
