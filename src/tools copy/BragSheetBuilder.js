import React, { useState } from 'react';
import { Award, Loader2, AlertCircle, Copy } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const BragSheetBuilder = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [accomplishments, setAccomplishments] = useState('');
  const [context, setContext] = useState('');
  const [audience, setAudience] = useState('resume');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState({});

  const handleBuild = async () => {
    if (!accomplishments.trim()) {
      setError('Please describe your accomplishments');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('brag-sheet-builder', {
        accomplishments: accomplishments.trim(),
        context: context.trim(),
        audience
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to build brag sheet. Please try again.');
    }
  };

  const copyText = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [key]: true });
    setTimeout(() => setCopied({ ...copied, [key]: false }), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <Award className="w-8 h-8 text-amber-600" />
            <h1 className="text-4xl font-bold text-slate-900">Brag Sheet Builder</h1>
          </div>
          <p className="text-slate-600">Transform humble accomplishments into impressive achievements</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              Describe your accomplishments
            </label>
            <textarea
              value={accomplishments}
              onChange={(e) => setAccomplishments(e.target.value)}
              placeholder="e.g., 'I helped improve the process', 'Worked on a team project', 'Familiar with Python'"
              className="w-full h-40 p-4 border-2 border-slate-200 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Context (Optional)
              </label>
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g., 'Tech startup', 'Non-profit'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Audience
              </label>
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
              >
                <option value="resume">Resume</option>
                <option value="linkedin">LinkedIn</option>
                <option value="interview">Interview</option>
                <option value="cover_letter">Cover Letter</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleBuild}
            disabled={loading || !accomplishments.trim()}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Building brag sheet...
              </>
            ) : (
              <>
                <Award className="w-5 h-5" />
                Build My Brag Sheet
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
            {results.original_vs_improved && results.original_vs_improved.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Before & After Transformations</h3>
                <div className="space-y-4">
                  {results.original_vs_improved.map((item, idx) => (
                    <div key={idx} className="border-2 border-slate-200 rounded-lg p-4">
                      <div className="mb-3">
                        <div className="text-sm font-semibold text-slate-600 mb-1">Original (humble):</div>
                        <p className="text-slate-700 italic">"{item.original}"</p>
                      </div>
                      <div className="mb-3">
                        <div className="text-sm font-semibold text-emerald-600 mb-1">Improved (impressive):</div>
                        <p className="text-emerald-900 font-medium">"{item.improved}"</p>
                      </div>
                      <div className="text-sm text-slate-600">
                        <strong>What changed:</strong> {item.what_changed}
                      </div>
                      {item.metrics_added && item.metrics_added.length > 0 && (
                        <div className="text-sm text-amber-700 mt-1">
                          <strong>Metrics added:</strong> {item.metrics_added.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.full_brag_sheet && (
              <div className="space-y-4">
                {results.full_brag_sheet.resume_bullets && results.full_brag_sheet.resume_bullets.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-slate-900">Resume Bullets</h3>
                      <button
                        onClick={() => copyText('resume', results.full_brag_sheet.resume_bullets.join('\n'))}
                        className="flex items-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        {copied.resume ? 'Copied!' : 'Copy All'}
                      </button>
                    </div>
                    <ul className="space-y-2">
                      {results.full_brag_sheet.resume_bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-600 font-bold">•</span>
                          <span className="text-slate-800">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {results.full_brag_sheet.linkedin_about_section && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-slate-900">LinkedIn About Section</h3>
                      <button
                        onClick={() => copyText('linkedin', results.full_brag_sheet.linkedin_about_section)}
                        className="flex items-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        {copied.linkedin ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-slate-800 whitespace-pre-wrap">{results.full_brag_sheet.linkedin_about_section}</p>
                  </div>
                )}

                {results.full_brag_sheet.interview_talking_points && results.full_brag_sheet.interview_talking_points.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Interview Talking Points</h3>
                    <ul className="space-y-2">
                      {results.full_brag_sheet.interview_talking_points.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-600 font-bold">{idx + 1}.</span>
                          <span className="text-slate-800">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {results.confidence_coaching && (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-900 mb-3">💙 Confidence Coaching</h3>
                <div className="space-y-2 text-blue-800">
                  {results.confidence_coaching.reframe && (
                    <p><strong>Reframe:</strong> {results.confidence_coaching.reframe}</p>
                  )}
                  {results.confidence_coaching.imposter_syndrome_response && (
                    <p><strong>Imposter syndrome response:</strong> {results.confidence_coaching.imposter_syndrome_response}</p>
                  )}
                  {results.confidence_coaching.permission && (
                    <p className="text-blue-900 font-semibold mt-3">{results.confidence_coaching.permission}</p>
                  )}
                </div>
              </div>
            )}

            {results.power_verbs_used && results.power_verbs_used.length > 0 && (
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-emerald-900 mb-2">Power Verbs Used</h3>
                <div className="flex flex-wrap gap-2">
                  {results.power_verbs_used.map((verb, idx) => (
                    <span key={idx} className="px-3 py-1 bg-emerald-200 text-emerald-900 rounded-full text-sm font-semibold">
                      {verb}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BragSheetBuilder;