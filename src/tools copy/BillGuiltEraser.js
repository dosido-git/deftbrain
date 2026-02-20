import React, { useState } from 'react';
import { DollarSign, Loader2, AlertCircle, Copy } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';

const BillGuiltEraser = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [billType, setBillType] = useState('');
  const [amount, setAmount] = useState('');
  const [situation, setSituation] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);

  const billTypes = [
    { id: 'medical', name: 'Medical Bill', icon: '🏥' },
    { id: 'credit_card', name: 'Credit Card', icon: '💳' },
    { id: 'utilities', name: 'Utilities', icon: '⚡' },
    { id: 'student_loans', name: 'Student Loans', icon: '🎓' },
    { id: 'rent', name: 'Rent', icon: '🏠' },
    { id: 'other', name: 'Other', icon: '📄' }
  ];

  const handleAnalyze = async () => {
    if (!billType) {
      setError('Please select a bill type');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('bill-guilt-eraser', {
        billType,
        amount: amount.trim(),
        situation: situation.trim()
      });
      
      setResults(data);
    } catch (err) {
      setError(err.message || 'Failed to analyze bill. Please try again.');
    }
  };

  const copyScript = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <DollarSign className="w-8 h-8 text-emerald-600" />
            <h1 className="text-4xl font-bold text-slate-900">Bill Guilt Eraser</h1>
          </div>
          <p className="text-slate-600">Address overdue bills without shame</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-6">
            <label className="block text-lg font-semibold text-slate-900 mb-3">
              What type of bill?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {billTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => setBillType(type.id)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${
                    billType === type.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-emerald-300 bg-white'
                  }`}
                >
                  <div className="text-3xl mb-1">{type.icon}</div>
                  <div className="text-sm font-medium text-slate-700">{type.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Amount (Optional)
              </label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g., '$500'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Current situation (Optional)
              </label>
              <input
                type="text"
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="e.g., '3 months overdue'"
                className="w-full p-3 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !billType}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <DollarSign className="w-5 h-5" />
                Get Help With This Bill
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
            {results.guilt_free_reality_check && (
              <div className="bg-blue-50 border-4 border-blue-400 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-blue-900 mb-3">💙 Reality Check</h2>
                <p className="text-blue-900 text-lg">{results.guilt_free_reality_check}</p>
              </div>
            )}

            {results.bill_analysis && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Bill Analysis</h3>
                <div className="space-y-2 text-slate-800">
                  <p><strong>Type:</strong> {results.bill_analysis.type}</p>
                  {results.bill_analysis.amount && (
                    <p><strong>Amount:</strong> {results.bill_analysis.amount}</p>
                  )}
                  <p><strong>Urgency:</strong> {results.bill_analysis.urgency}</p>
                  <p><strong>If ignored:</strong> {results.bill_analysis.consequences_if_ignored}</p>
                </div>
              </div>
            )}

            {results.immediate_action_steps && results.immediate_action_steps.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Immediate Action Steps</h3>
                <div className="space-y-4">
                  {results.immediate_action_steps.map((step, idx) => (
                    <div key={idx} className="bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg p-4">
                      <div className="font-bold text-emerald-900 mb-2">
                        Step {idx + 1}: {step.step}
                      </div>
                      <p className="text-emerald-800 mb-2">{step.specific_action}</p>
                      {step.script_template && (
                        <div className="bg-white rounded p-3 mt-2">
                          <div className="text-sm font-semibold text-emerald-900 mb-1">Script to use:</div>
                          <p className="text-slate-800 text-sm italic">"{step.script_template}"</p>
                        </div>
                      )}
                      <p className="text-sm text-emerald-700 mt-2"><strong>When:</strong> {step.when}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.phone_call_script && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-yellow-900">📞 Phone Call Script</h3>
                  <button
                    onClick={() => copyScript(JSON.stringify(results.phone_call_script, null, 2))}
                    className="flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    {copiedScript ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="space-y-3 text-yellow-900">
                  {results.phone_call_script.opening && (
                    <div>
                      <strong>Opening:</strong>
                      <p className="mt-1">{results.phone_call_script.opening}</p>
                    </div>
                  )}
                  {results.phone_call_script.key_phrases && results.phone_call_script.key_phrases.length > 0 && (
                    <div>
                      <strong>Key phrases:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {results.phone_call_script.key_phrases.map((phrase, idx) => (
                          <li key={idx}>{phrase}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {results.phone_call_script.what_to_ask_for && (
                    <div>
                      <strong>What to ask for:</strong>
                      <p className="mt-1">{results.phone_call_script.what_to_ask_for}</p>
                    </div>
                  )}
                  {results.phone_call_script.if_they_say_no && (
                    <div>
                      <strong>If they say no:</strong>
                      <p className="mt-1">{results.phone_call_script.if_they_say_no}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {results.assistance_programs && results.assistance_programs.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Assistance Programs</h3>
                <div className="space-y-3">
                  {results.assistance_programs.map((program, idx) => (
                    <div key={idx} className="bg-blue-50 rounded-lg p-4">
                      <div className="font-bold text-blue-900">{program.program}</div>
                      <p className="text-blue-800 text-sm mt-1">
                        <strong>Who qualifies:</strong> {program.who_qualifies}
                      </p>
                      <p className="text-blue-800 text-sm mt-1">
                        <strong>How to apply:</strong> {program.how_to_apply}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.permission_statement && (
              <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-6 text-center">
                <p className="text-purple-900 text-lg">{results.permission_statement}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BillGuiltEraser;