import React, { useState } from 'react';
import { DollarSign, Loader2, AlertCircle } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const MoneyShameRemover = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [moneyShame, setMoneyShame] = useState('');
  const [situation, setSituation] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleRemove = async () => {
    if (!moneyShame.trim()) {
      setError('Please describe your money shame');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('money-shame-remover', {
        moneyShame: moneyShame.trim(),
        situation: situation.trim()
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to process. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <DollarSign className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl font-bold text-slate-900">Money Shame Remover</h1>
          </div>
          <p className="text-slate-600">Reframe financial situations without judgment</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              What money shame are you experiencing?
            </label>
            <textarea
              value={moneyShame}
              onChange={(e) => setMoneyShame(e.target.value)}
              placeholder="e.g., 'Can't afford to go out with friends', 'Living paycheck to paycheck', 'Have credit card debt'"
              className="w-full h-32 p-4 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Additional context (Optional)
            </label>
            <input
              type="text"
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="Any additional details about your situation"
              className="w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
            />
          </div>

          <button
            onClick={handleRemove}
            disabled={loading || !moneyShame.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Removing shame...
              </>
            ) : (
              <>
                <DollarSign className="w-5 h-5" />
                Remove Money Shame
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {results && (
          <div className="space-y-6">
            {results.shame_removal_reframe && (
              <div className="bg-emerald-50 border-4 border-emerald-400 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-emerald-900 mb-3">💚 The Truth</h2>
                <p className="text-emerald-900 text-lg mb-3">{results.shame_removal_reframe.the_truth}</p>
                <p className="text-emerald-800 mb-3">{results.shame_removal_reframe.why_this_isnt_failure}</p>
                {results.shame_removal_reframe.others_in_same_boat && (
                  <p className="text-emerald-700 italic">{results.shame_removal_reframe.others_in_same_boat}</p>
                )}
              </div>
            )}

            {results.shame_analysis && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Shame Analysis</h3>
                <div className="space-y-3">
                  {results.shame_analysis.systemic_factors && results.shame_analysis.systemic_factors.length > 0 && (
                    <div>
                      <strong className="text-slate-900">Systemic factors (not your fault):</strong>
                      <ul className="list-disc list-inside mt-1 text-slate-700">
                        {results.shame_analysis.systemic_factors.map((factor, idx) => (
                          <li key={idx}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {results.shame_analysis.personal_factors && results.shame_analysis.personal_factors.length > 0 && (
                    <div>
                      <strong className="text-slate-900">Within your control:</strong>
                      <ul className="list-disc list-inside mt-1 text-slate-700">
                        {results.shame_analysis.personal_factors.map((factor, idx) => (
                          <li key={idx}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {results.shame_analysis.shame_vs_reality && (
                    <p className="text-slate-800 mt-3">
                      <strong>Reality check:</strong> {results.shame_analysis.shame_vs_reality}
                    </p>
                  )}
                </div>
              </div>
            )}

            {results.practical_solutions && results.practical_solutions.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Practical Solutions</h3>
                <div className="space-y-4">
                  {results.practical_solutions.map((solution, idx) => (
                    <div key={idx} className="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg p-4">
                      <div className="font-bold text-emerald-900 mb-2">{solution.approach}</div>
                      <p className="text-emerald-800 mb-2">{solution.how}</p>
                      {solution.resources && solution.resources.length > 0 && (
                        <div className="text-sm text-emerald-700">
                          <strong>Resources:</strong> {solution.resources.join(', ')}
                        </div>
                      )}
                      {solution.no_shame_script && (
                        <div className="mt-2 bg-white rounded p-2 text-sm">
                          <strong>Script:</strong> "{solution.no_shame_script}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.social_situations && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-3">Social Situations</h3>
                <div className="space-y-2 text-blue-800">
                  {results.social_situations.declining_expensive_invites && (
                    <p><strong>Declining invites:</strong> {results.social_situations.declining_expensive_invites}</p>
                  )}
                  {results.social_situations.suggesting_free_alternatives && (
                    <p><strong>Suggesting alternatives:</strong> {results.social_situations.suggesting_free_alternatives}</p>
                  )}
                  {results.social_situations.being_honest_about_budget && (
                    <p><strong>Being honest:</strong> {results.social_situations.being_honest_about_budget}</p>
                  )}
                </div>
              </div>
            )}

            {results.permission_statements && results.permission_statements.length > 0 && (
              <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-6">
                <h3 className="text-lg font-bold text-purple-900 mb-3">💜 Permissions</h3>
                <ul className="space-y-2">
                  {results.permission_statements.map((statement, idx) => (
                    <li key={idx} className="text-purple-800 text-lg">{statement}</li>
                  ))}
                </ul>
              </div>
            )}

            {results.when_to_seek_help && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
                <h3 className="text-lg font-bold text-yellow-900 mb-3">When to Seek Help</h3>
                <div className="space-y-2 text-yellow-800 text-sm">
                  {results.when_to_seek_help.financial_counseling && (
                    <p><strong>Financial counseling:</strong> {results.when_to_seek_help.financial_counseling}</p>
                  )}
                  {results.when_to_seek_help.assistance_programs && results.when_to_seek_help.assistance_programs.length > 0 && (
                    <div>
                      <strong>Assistance programs:</strong>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        {results.when_to_seek_help.assistance_programs.map((program, idx) => (
                          <li key={idx}>{program}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MoneyShameRemover;