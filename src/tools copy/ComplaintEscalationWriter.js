import React, { useState } from 'react';
import { FileText, Loader2, AlertCircle, Copy } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const ComplaintEscalationWriter = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [company, setCompany] = useState('');
  const [issue, setIssue] = useState('');
  const [previousAttempts, setPreviousAttempts] = useState('');
  const [desiredOutcome, setDesiredOutcome] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleWrite = async () => {
    if (!company.trim() || !issue.trim()) {
      setError('Please provide company name and issue description');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('complaint-escalation-writer', {
        company: company.trim(),
        issue: issue.trim(),
        previousAttempts: previousAttempts.trim(),
        desiredOutcome: desiredOutcome.trim()
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to write complaint. Please try again.');
    }
  };

  const copyLetter = () => {
    if (results?.escalation_letter?.letter_body) {
      const fullLetter = `Subject: ${results.escalation_letter.subject_line}\n\n${results.escalation_letter.letter_body}`;
      navigator.clipboard.writeText(fullLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <FileText className="w-8 h-8 text-red-600" />
            <h1 className="text-4xl font-bold text-slate-900">Complaint Escalation Writer</h1>
          </div>
          <p className="text-slate-600">Professional, firm complaints that get results</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              Company name
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g., 'Delta Airlines', 'Verizon'"
              className="w-full p-3 border-2 border-slate-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
            />
          </div>

          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              Describe your issue
            </label>
            <textarea
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Be specific: What happened? When? What was promised vs what was delivered? What have you tried?"
              className="w-full h-40 p-4 border-2 border-slate-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Previous attempts (Optional)
              </label>
              <input
                type="text"
                value={previousAttempts}
                onChange={(e) => setPreviousAttempts(e.target.value)}
                placeholder="e.g., 'Called 3 times, sent email'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Desired outcome (Optional)
              </label>
              <input
                type="text"
                value={desiredOutcome}
                onChange={(e) => setDesiredOutcome(e.target.value)}
                placeholder="e.g., 'Full refund', 'Service fix'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleWrite}
            disabled={loading || !company.trim() || !issue.trim()}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Writing complaint...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" />
                Write Escalation Letter
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

        {results && results.escalation_letter && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-2xl font-bold text-slate-900">Your Escalation Letter</h3>
                <button
                  onClick={copyLetter}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy Letter'}
                </button>
              </div>

              <div className="bg-slate-50 rounded-lg p-6 border-2 border-slate-200">
                <div className="mb-4">
                  <div className="text-sm font-semibold text-slate-600 mb-1">Subject:</div>
                  <div className="font-semibold text-slate-900">{results.escalation_letter.subject_line}</div>
                </div>
                <div className="whitespace-pre-wrap text-slate-800 leading-relaxed">
                  {results.escalation_letter.letter_body}
                </div>
              </div>

              {results.escalation_letter.key_leverage_points_used && results.escalation_letter.key_leverage_points_used.length > 0 && (
                <div className="mt-4 text-sm text-slate-600">
                  <strong>Leverage points used:</strong> {results.escalation_letter.key_leverage_points_used.join(', ')}
                </div>
              )}
            </div>

            {results.who_to_send_to && results.who_to_send_to.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Who to Send To</h3>
                <div className="space-y-3">
                  {results.who_to_send_to.map((recipient, idx) => (
                    <div key={idx} className="bg-blue-50 rounded-lg p-4">
                      <div className="font-bold text-blue-900">{recipient.role}</div>
                      <p className="text-blue-800 text-sm mt-1">{recipient.why}</p>
                      <p className="text-blue-700 text-sm mt-1">
                        <strong>How to find:</strong> {recipient.how_to_find}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.timeline && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
                <h3 className="text-lg font-bold text-yellow-900 mb-3">Timeline</h3>
                <div className="space-y-2 text-yellow-800">
                  {results.timeline.send_letter && (
                    <p><strong>Send letter:</strong> {results.timeline.send_letter}</p>
                  )}
                  {results.timeline.follow_up && (
                    <p><strong>Follow up:</strong> {results.timeline.follow_up}</p>
                  )}
                  {results.timeline.escalate_further && (
                    <p><strong>Escalate further:</strong> {results.timeline.escalate_further}</p>
                  )}
                </div>
              </div>
            )}

            {results.next_steps_if_ignored && results.next_steps_if_ignored.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Next Steps If Ignored</h3>
                <div className="space-y-3">
                  {results.next_steps_if_ignored.map((step, idx) => (
                    <div key={idx} className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4">
                      <div className="font-bold text-red-900">{step.step}</div>
                      <p className="text-red-800 text-sm mt-1">{step.how}</p>
                      <p className="text-red-700 text-sm mt-1"><strong>Impact:</strong> {step.impact}</p>
                    </div>
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

export default ComplaintEscalationWriter;