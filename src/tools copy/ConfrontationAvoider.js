import React, { useState } from 'react';
import { Shield, Loader2, AlertCircle } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const ConfrontationAvoider = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [issue, setIssue] = useState('');
  const [person, setPerson] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!issue.trim()) {
      setError('Please describe the issue');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('confrontation-avoider', {
        issue: issue.trim(),
        person: person.trim(),
        relationshipType: relationshipType.trim()
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to generate alternatives. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-cyan-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Shield className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl font-bold text-slate-900">Confrontation Avoider</h1>
          </div>
          <p className="text-slate-600">Address issues without direct confrontation</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              What's the issue?
            </label>
            <textarea
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Describe the problem you want to address..."
              className="w-full h-32 p-4 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Person involved (Optional)
              </label>
              <input
                type="text"
                value={person}
                onChange={(e) => setPerson(e.target.value)}
                placeholder="e.g., 'Roommate', 'Coworker'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Relationship type (Optional)
              </label>
              <input
                type="text"
                value={relationshipType}
                onChange={(e) => setRelationshipType(e.target.value)}
                placeholder="e.g., 'Work', 'Family', 'Friend'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !issue.trim()}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating alternatives...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Find Non-Confrontational Solutions
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
            {results.issue_analysis && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6">
                <h2 className="text-xl font-bold text-emerald-900 mb-3">Issue Analysis</h2>
                <div className="space-y-2 text-emerald-800">
                  <p><strong>The problem:</strong> {results.issue_analysis.the_problem}</p>
                  {results.issue_analysis.why_avoiding_confrontation && (
                    <p><strong>Why avoiding confrontation makes sense:</strong> {results.issue_analysis.why_avoiding_confrontation}</p>
                  )}
                  {results.issue_analysis.relationship_context && (
                    <p><strong>Context:</strong> {results.issue_analysis.relationship_context}</p>
                  )}
                </div>
              </div>
            )}

            {results.non_confrontational_approaches && results.non_confrontational_approaches.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-900">Non-Confrontational Approaches</h3>
                {results.non_confrontational_approaches.map((approach, idx) => (
                  <div key={idx} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-xl font-bold text-emerald-900">{approach.strategy}</h4>
                      {approach.best_for && (
                        <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                          {approach.best_for}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-slate-800 mb-3">{approach.how_it_works}</p>
                    
                    {approach.script_or_action && (
                      <div className="bg-emerald-50 rounded-lg p-4 mb-3">
                        <div className="text-sm font-semibold text-emerald-900 mb-1">What to say/do:</div>
                        <p className="text-emerald-800 italic">"{approach.script_or_action}"</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {approach.pros && approach.pros.length > 0 && (
                        <div>
                          <strong className="text-emerald-700">Pros:</strong>
                          <ul className="list-disc list-inside text-emerald-700">
                            {approach.pros.map((pro, proIdx) => (
                              <li key={proIdx}>{pro}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {approach.cons && approach.cons.length > 0 && (
                        <div>
                          <strong className="text-orange-700">Cons:</strong>
                          <ul className="list-disc list-inside text-orange-700">
                            {approach.cons.map((con, conIdx) => (
                              <li key={conIdx}>{con}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {results.boundary_setting_without_confrontation && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Boundary Setting (Non-Confrontational)</h3>
                {results.boundary_setting_without_confrontation.soft_boundaries && results.boundary_setting_without_confrontation.soft_boundaries.length > 0 && (
                  <div className="mb-3">
                    <strong className="text-slate-900">Soft boundaries:</strong>
                    <ul className="list-disc list-inside mt-1 text-slate-700">
                      {results.boundary_setting_without_confrontation.soft_boundaries.map((boundary, idx) => (
                        <li key={idx}>{boundary}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {results.boundary_setting_without_confrontation.scripts && results.boundary_setting_without_confrontation.scripts.length > 0 && (
                  <div>
                    <strong className="text-slate-900">Scripts:</strong>
                    {results.boundary_setting_without_confrontation.scripts.map((script, idx) => (
                      <div key={idx} className="bg-slate-50 rounded p-3 mt-2">
                        <p className="text-slate-800">"{script}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {results.if_issue_persists && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
                <h3 className="text-lg font-bold text-yellow-900 mb-3">If Issue Persists</h3>
                {results.if_issue_persists.escalation_options && results.if_issue_persists.escalation_options.length > 0 && (
                  <div className="mb-3">
                    <strong className="text-yellow-900">Escalation options:</strong>
                    <ul className="list-disc list-inside mt-1 text-yellow-800">
                      {results.if_issue_persists.escalation_options.map((option, idx) => (
                        <li key={idx}>{option}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {results.if_issue_persists.when_confrontation_necessary && (
                  <p className="text-yellow-800">
                    <strong>When confrontation is necessary:</strong> {results.if_issue_persists.when_confrontation_necessary}
                  </p>
                )}
              </div>
            )}

            {results.validation && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
                <p className="text-blue-900 text-lg">{results.validation}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfrontationAvoider;