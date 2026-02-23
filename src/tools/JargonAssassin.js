import React, { useState, useRef } from 'react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { CopyBtn } from '../components/ActionButtons';

const JargonAssassin = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  
  const [documentText, setDocumentText] = useState('');
  const [documentType, setDocumentType] = useState('general');
  const [fileName, setFileName] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('side-by-side');
  const [fontSize, setFontSize] = useState('base');
  
  const fileInputRef = useRef(null);

  const documentTypes = [
    { id: 'general', name: 'General Document', icon: '📄' },
    { id: 'legal', name: 'Legal Contract', icon: '⚖️' },
    { id: 'medical', name: 'Medical Form', icon: '🏥' },
    { id: 'technical', name: 'Technical Manual', icon: '🔧' },
    { id: 'financial', name: 'Financial Document', icon: '💰' },
    { id: 'academic', name: 'Academic Paper', icon: '🎓' },
    { id: 'government', name: 'Government Form', icon: '🏛️' }
  ];

  const sectionIcons = {
    important: <span className="text-lg">🚩</span>,
    decision: <span className="text-lg">⚠️</span>,
    red_flag: <span className="text-lg">🔴</span>,
    deadline: <span className="text-lg">⏰</span>
  };

  const sectionColors = {
    important: 'bg-blue-50 border-blue-200',
    decision: 'bg-orange-50 border-orange-200',
    red_flag: 'bg-red-50 border-red-200',
    deadline: 'bg-purple-50 border-purple-200'
  };

  const fontSizes = {
    small: 'text-sm',
    base: 'text-base',
    large: 'text-lg',
    xl: 'text-xl'
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setError('');

    try {
      const text = await file.text();
      setDocumentText(text);
    } catch (err) {
      setError('Failed to read file. Please try a .txt file or paste text directly.');
    }
  };

  const handleTranslate = async () => {
    if (!documentText.trim()) {
      setError('Please upload a document or paste text');
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('jargon-assassin', {
        documentText: documentText.trim(),
        documentType
      });
      
      setResults(data);
      setActiveTab('side-by-side');
    } catch (err) {
      setError(err.message || 'Failed to translate document. Please try again.');
    }
  };

  const handleReset = () => {
    setDocumentText('');
    setFileName('');
    setResults(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <span className="text-3xl">📖</span>
            <h1 className="text-4xl font-bold text-slate-900">Jargon Assassin</h1>
          </div>
          <p className="text-slate-600">Translate complex documents into plain English</p>
          <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-full shadow-sm">
            <span className="text-sm">✅</span>
            5th-grade reading level • All details preserved
          </div>
        </div>

        {/* Input Section */}
        {!results && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            {/* Document Type Selection */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-slate-900 mb-3">
                Document Type
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {documentTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setDocumentType(type.id)}
                    className={`p-3 rounded-lg border-2 transition-all text-center ${
                      documentType === type.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-emerald-300 bg-white'
                    }`}
                  >
                    <div className="text-2xl mb-1">{type.icon}</div>
                    <div className="text-xs font-medium text-slate-700">{type.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-slate-900 mb-3">
                Upload Document
              </label>
              
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-emerald-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                
                <div className="text-4xl mx-auto mb-4">📄</div>
                
                {fileName ? (
                  <div className="mb-3">
                    <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg">
                      <span className="text-sm">✅</span>
                      {fileName}
                    </div>
                  </div>
                ) : null}
                
                <label
                  htmlFor="file-upload"
                  className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg cursor-pointer transition-colors"
                >
                  {fileName ? 'Change File' : 'Upload Text File'}
                </label>
                
                <p className="text-sm text-slate-500 mt-4">
                  .txt files work best • or paste text below
                </p>
              </div>
            </div>

            {/* Text Input */}
            <div className="mb-6">
              <label className="block text-lg font-semibold text-slate-900 mb-3">
                Or Paste Document Text
              </label>
              <textarea
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                placeholder="Paste your complex document here... legal contracts, medical forms, technical manuals, etc."
                className="w-full h-64 p-4 border-2 border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none text-slate-900 placeholder-slate-400 font-mono text-sm"
              />
              <div className="text-right text-sm text-slate-500 mt-1">
                {documentText.length} characters
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleTranslate}
                disabled={loading || !documentText.trim()}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin inline-block">⏳</span>
                    Translating to plain English...
                  </>
                ) : (
                  <>
                    <span className="text-lg">📖</span>
                    Translate Document
                  </>
                )}
              </button>
              
              {documentText && (
                <button
                  onClick={handleReset}
                  className="px-6 py-3 border-2 border-slate-300 hover:border-slate-400 text-slate-700 font-semibold rounded-lg transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <span className="text-lg flex-shrink-0 mt-0.5">⚠️</span>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Results Section */}
        {results && (
          <div className="space-y-6">
            {/* Controls Bar */}
            <div className="bg-white rounded-xl shadow-lg p-4 flex items-center justify-between flex-wrap gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('side-by-side')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'side-by-side'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Side-by-Side
                </button>
                <button
                  onClick={() => setActiveTab('translation')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'translation'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Translation Only
                </button>
                <button
                  onClick={() => setActiveTab('highlights')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'highlights'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Key Sections
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Text size:</span>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="small">Small</option>
                    <option value="base">Medium</option>
                    <option value="large">Large</option>
                    <option value="xl">Extra Large</option>
                  </select>
                </div>

                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors text-sm font-medium"
                >
                  New Document
                </button>
              </div>
            </div>

            {/* Summary Box */}
            <div className="bg-gradient-to-r from-emerald-500 to-purple-500 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-xl flex-shrink-0 mt-1">📖</span>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2">What This Document Is About</h2>
                  <p className="text-emerald-50 leading-relaxed">{results.summary}</p>
                </div>
                {results.reading_level && (
                  <div className="bg-white/20 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
                    📖 {results.reading_level}
                  </div>
                )}
              </div>
            </div>

            {/* Side-by-Side View */}
            {activeTab === 'side-by-side' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900">Original Document</h3>
                    <span className="text-sm text-slate-500">Complex language</span>
                  </div>
                  <div className={`bg-slate-50 rounded-lg p-4 border border-slate-200 overflow-y-auto max-h-[600px] ${fontSizes[fontSize]}`}>
                    <pre className="whitespace-pre-wrap font-sans text-slate-700 leading-relaxed">
                      {documentText}
                    </pre>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900">Plain English Translation</h3>
                    <CopyBtn content={results.translation} label="Copy" />
                  </div>
                  <div className={`bg-emerald-50 rounded-lg p-4 border border-emerald-200 overflow-y-auto max-h-[600px] ${fontSizes[fontSize]}`}>
                    <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {results.translation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Translation Only View */}
            {activeTab === 'translation' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Plain English Translation</h3>
                  <CopyBtn content={results.translation} label="Copy Translation" />
                </div>
                <div className={`bg-emerald-50 rounded-lg p-6 border border-emerald-200 ${fontSizes[fontSize]}`}>
                  <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">
                    {results.translation}
                  </p>
                </div>
              </div>
            )}

            {/* Key Sections View */}
            {activeTab === 'highlights' && (
              <div className="space-y-4">
                {results.key_sections && results.key_sections.length > 0 ? (
                  results.key_sections.map((section, index) => (
                    <div key={index} className={`rounded-xl shadow-lg p-6 border-2 ${sectionColors[section.type]}`}>
                      <div className="flex items-start gap-3 mb-3">
                        {sectionIcons[section.type]}
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 mb-1">{section.title}</h4>
                          <p className="text-sm text-slate-600 italic mb-3">"{section.original_text}"</p>
                          <p className="text-slate-800 leading-relaxed mb-2">{section.simplified}</p>
                          <p className="text-sm text-slate-600">
                            <strong>Why this matters:</strong> {section.why_it_matters}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-xl shadow-lg p-8 text-center text-slate-500">
                    No critical sections flagged in this document
                  </div>
                )}
              </div>
            )}

            {/* Glossary */}
            {results.glossary && results.glossary.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span className="text-lg">📖</span>
                  Key Terms Glossary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.glossary.map((item, index) => (
                    <div key={index} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="font-bold text-slate-900 mb-1">{item.term}</div>
                      <div className="text-sm text-slate-700">{item.definition}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Checklist */}
            {results.checklist && results.checklist.length > 0 && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  Before You Sign or Agree
                </h3>
                <ul className="space-y-2">
                  {results.checklist.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <input type="checkbox" className="mt-1 w-5 h-5 rounded border-amber-300" />
                      <span className="text-slate-800">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JargonAssassin;