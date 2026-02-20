import React, { useState, useEffect } from 'react';
import { Users, Heart, Clock, MessageCircle, Bell, Loader2, Plus, Edit, X, Check, AlertCircle, Moon, Calendar } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

const FriendshipFadeAlerter = () => {
  const { isDark } = useTheme();
  const { callToolEndpoint, loading, error: apiError } = useClaudeAPI();

  // State
  const [view, setView] = useState('dashboard'); // dashboard | add | edit | starters
  const [relationships, setRelationships] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [conversationStarters, setConversationStarters] = useState(null);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    relationshipType: '',
    frequency: '',
    lastContact: '',
    contextNotes: ''
  });

  // Theme colors
  const c = {
    gradient: isDark ? 'from-blue-900/20 to-purple-900/20' : 'from-blue-50 to-purple-50',
    card: isDark ? 'bg-gray-800' : 'bg-white',
    cardAlt: isDark ? 'bg-gray-700/50' : 'bg-blue-50/50',
    text: isDark ? 'text-gray-100' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-300' : 'text-gray-700',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    input: isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900',
    btnPrimary: isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white',
    btnSecondary: isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  };

  // Load relationships from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('friendship_relationships');
    if (saved) {
      setRelationships(JSON.parse(saved));
    }
  }, []);

  // Save relationships to localStorage
  useEffect(() => {
    if (relationships.length > 0) {
      localStorage.setItem('friendship_relationships', JSON.stringify(relationships));
    }
  }, [relationships]);

  // Calculate days since last contact
  const daysSinceContact = (lastContact) => {
    const last = new Date(lastContact);
    const now = new Date();
    const diff = Math.floor((now - last) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Get frequency in days
  const getFrequencyDays = (frequency) => {
    const map = {
      'weekly': 7,
      'biweekly': 14,
      'monthly': 30,
      'quarterly': 90,
      'semiannually': 180
    };
    return map[frequency] || 30;
  };

  // Get status color and urgency
  const getStatus = (person) => {
    const days = daysSinceContact(person.lastContact);
    const targetDays = getFrequencyDays(person.frequency);
    const daysOverdue = days - targetDays;
    
    if (daysOverdue > 0) {
      return { color: 'red', urgency: 'overdue', daysOverdue, days };
    } else if (daysOverdue > -3) {
      return { color: 'yellow', urgency: 'soon', daysUntil: Math.abs(daysOverdue), days };
    } else {
      return { color: 'green', urgency: 'good', daysUntil: Math.abs(daysOverdue), days };
    }
  };

  // Add or update relationship
  const saveRelationship = () => {
    if (!formData.name || !formData.relationshipType || !formData.frequency || !formData.lastContact) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.id) {
      // Update existing
      setRelationships(prev => prev.map(p => p.id === formData.id ? formData : p));
    } else {
      // Add new
      const newPerson = {
        ...formData,
        id: Date.now(),
        snoozedUntil: null
      };
      setRelationships(prev => [...prev, newPerson]);
    }

    resetForm();
    setView('dashboard');
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      id: null,
      name: '',
      relationshipType: '',
      frequency: '',
      lastContact: '',
      contextNotes: ''
    });
    setError('');
  };

  // Edit relationship
  const editRelationship = (person) => {
    setFormData(person);
    setView('add');
  };

  // Delete relationship
  const deleteRelationship = (id) => {
    if (window.confirm('Remove this person from tracking?')) {
      setRelationships(prev => prev.filter(p => p.id !== id));
    }
  };

  // Mark as contacted
  const markAsContacted = (id) => {
    const today = new Date().toISOString().split('T')[0];
    setRelationships(prev => prev.map(p => 
      p.id === id ? { ...p, lastContact: today, snoozedUntil: null } : p
    ));
  };

  // Snooze relationship
  const snoozeRelationship = (id, weeks) => {
    const snoozeDate = new Date();
    snoozeDate.setDate(snoozeDate.getDate() + (weeks * 7));
    setRelationships(prev => prev.map(p =>
      p.id === id ? { ...p, snoozedUntil: snoozeDate.toISOString().split('T')[0] } : p
    ));
  };

  // Generate conversation starters
  const generateStarters = async (person) => {
    setError('');
    setSelectedPerson(person);
    setConversationStarters(null);
    setView('starters');

    const status = getStatus(person);
 console.log('🔍 Generating starters for:', person.name);
  console.log('📊 Request data:', {
    name: person.name,
    relationshipType: person.relationshipType,
    daysSinceContact: status.days,
    contextNotes: person.contextNotes
  });

    try {
      const data = await callToolEndpoint('friendship-fade-alerter', {
        name: person.name,
        relationshipType: person.relationshipType,
        daysSinceContact: status.days,
        contextNotes: person.contextNotes || null
      });
    console.log('✅ Received data:', data);
       setConversationStarters(data);
    } catch (err) {
      setError(err.message || 'Failed to generate conversation starters');
    }
  };

  // Filter and sort relationships
  const activeRelationships = relationships.filter(p => {
    if (!p.snoozedUntil) return true;
    return new Date(p.snoozedUntil) < new Date();
  }).sort((a, b) => {
    const statusA = getStatus(a);
    const statusB = getStatus(b);
    // Sort by urgency: overdue > soon > good
    const urgencyOrder = { overdue: 0, soon: 1, good: 2 };
    return urgencyOrder[statusA.urgency] - urgencyOrder[statusB.urgency];
  });

  const snoozedRelationships = relationships.filter(p => 
    p.snoozedUntil && new Date(p.snoozedUntil) >= new Date()
  );

  return (
    <div className={`min-h-screen bg-gradient-to-br ${c.gradient} p-6`}>
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="w-12 h-12 text-blue-600 dark:text-blue-400" />
            <h1 className={`text-4xl font-bold ${c.text}`}>Friendship Fade Alerter</h1>
          </div>
          <p className={`text-lg ${c.textSecondary}`}>
            Never lose touch with people you care about
          </p>
        </div>

        {/* View Toggle */}
        {view !== 'starters' && (
          <div className="flex gap-2 mb-6 justify-center">
            <button
              onClick={() => setView('dashboard')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                view === 'dashboard' ? 'bg-blue-600 text-white' : c.btnSecondary
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => { resetForm(); setView('add'); }}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                view === 'add' ? 'bg-blue-600 text-white' : c.btnSecondary
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Add Person
            </button>
          </div>
        )}

        {/* Dashboard View */}
        {view === 'dashboard' && (
          <div>
            {activeRelationships.length === 0 ? (
              <div className={`${c.card} rounded-xl shadow-lg p-12 text-center`}>
                <Users className={`w-16 h-16 mx-auto mb-4 ${c.textMuted}`} />
                <p className={`text-lg ${c.text} mb-2`}>No relationships tracked yet</p>
                <p className={`${c.textSecondary} mb-6`}>
                  Add people you want to stay connected with
                </p>
                <button
                  onClick={() => setView('add')}
                  className={`${c.btnPrimary} px-6 py-3 rounded-lg font-semibold`}
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add Your First Person
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {activeRelationships.map(person => {
                  const status = getStatus(person);
                  const bgColor = status.color === 'red' ? 'bg-red-100 dark:bg-red-900/30 border-red-500' :
                                  status.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-500' :
                                  'bg-green-100 dark:bg-green-900/30 border-green-500';
                  const textColor = status.color === 'red' ? 'text-red-700 dark:text-red-300' :
                                    status.color === 'yellow' ? 'text-yellow-700 dark:text-yellow-300' :
                                    'text-green-700 dark:text-green-300';

                  return (
                    <div key={person.id} className={`${c.card} rounded-xl shadow-lg p-6 border-l-4 ${bgColor.split(' ').pop()}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className={`text-xl font-bold ${c.text} mb-1`}>{person.name}</h3>
                          <p className={`text-sm ${c.textSecondary}`}>
                            {person.relationshipType.charAt(0).toUpperCase() + person.relationshipType.slice(1)} • 
                            Contact {person.frequency}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => editRelationship(person)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteRelationship(person.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className={`p-3 rounded-lg ${bgColor}`}>
                          <p className={`text-xs ${c.textMuted} mb-1`}>Last Contact</p>
                          <p className={`font-bold ${textColor}`}>{status.days} days ago</p>
                        </div>
                        <div className={`p-3 rounded-lg ${bgColor}`}>
                          <p className={`text-xs ${c.textMuted} mb-1`}>Status</p>
                          <p className={`font-bold ${textColor}`}>
                            {status.urgency === 'overdue' && `${status.daysOverdue} days overdue`}
                            {status.urgency === 'soon' && `Due in ${status.daysUntil} days`}
                            {status.urgency === 'good' && `${status.daysUntil} days buffer`}
                          </p>
                        </div>
                      </div>

                      {person.contextNotes && (
                        <p className={`text-sm ${c.textSecondary} italic mb-4`}>
                          "{person.contextNotes}"
                        </p>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => generateStarters(person)}
                          className={`flex-1 ${c.btnPrimary} py-2 px-4 rounded-lg font-semibold text-sm`}
                        >
                          <MessageCircle className="w-4 h-4 inline mr-2" />
                          Reach Out Now
                        </button>
                        <button
                          onClick={() => markAsContacted(person.id)}
                          className={`${c.btnSecondary} py-2 px-4 rounded-lg font-semibold text-sm`}
                        >
                          <Check className="w-4 h-4 inline mr-2" />
                          Mark Contacted
                        </button>
                        <div className="relative group">
                          <button
                            className={`${c.btnSecondary} py-2 px-4 rounded-lg font-semibold text-sm`}
                          >
                            <Moon className="w-4 h-4 inline mr-2" />
                            Snooze
                          </button>
                          <div className="absolute right-0 mt-2 hidden group-hover:block bg-white dark:bg-gray-800 shadow-lg rounded-lg p-2 z-10 whitespace-nowrap">
                            {[1, 2, 3, 4].map(weeks => (
                              <button
                                key={weeks}
                                onClick={() => snoozeRelationship(person.id, weeks)}
                                className={`block w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${c.text} text-sm`}
                              >
                                {weeks} week{weeks > 1 ? 's' : ''}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Snoozed Section */}
            {snoozedRelationships.length > 0 && (
              <div className="mt-8">
                <h2 className={`text-xl font-bold ${c.text} mb-4 flex items-center gap-2`}>
                  <Moon className="w-5 h-5" />
                  Snoozed ({snoozedRelationships.length})
                </h2>
                <div className="space-y-2">
                  {snoozedRelationships.map(person => (
                    <div key={person.id} className={`${c.cardAlt} rounded-lg p-4 flex items-center justify-between`}>
                      <div>
                        <p className={`font-semibold ${c.text}`}>{person.name}</p>
                        <p className={`text-xs ${c.textMuted}`}>
                          Snoozed until {new Date(person.snoozedUntil).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => setRelationships(prev => prev.map(p =>
                          p.id === person.id ? { ...p, snoozedUntil: null } : p
                        ))}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 text-sm font-medium"
                      >
                        Unsnooze
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add/Edit View */}
        {view === 'add' && (
          <div className={`${c.card} rounded-xl shadow-lg p-6`}>
            <h2 className={`text-2xl font-bold ${c.text} mb-6`}>
              {formData.id ? 'Edit Person' : 'Add Person'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold ${c.text} mb-2`}>
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Friend's name"
                  className={`w-full px-4 py-3 rounded-lg border ${c.input} focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold ${c.text} mb-2`}>
                  Relationship Type *
                </label>
                <select
                  value={formData.relationshipType}
                  onChange={(e) => setFormData({...formData, relationshipType: e.target.value})}
                  className={`w-full px-4 py-3 rounded-lg border ${c.input} focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">Select type...</option>
                  <option value="close_friend">Close Friend</option>
                  <option value="family">Family</option>
                  <option value="acquaintance">Acquaintance</option>
                  <option value="mentor">Mentor</option>
                  <option value="colleague">Colleague</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-semibold ${c.text} mb-2`}>
                  Ideal Contact Frequency *
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                  className={`w-full px-4 py-3 rounded-lg border ${c.input} focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">Select frequency...</option>
                  <option value="weekly">Weekly (every 7 days)</option>
                  <option value="biweekly">Bi-weekly (every 14 days)</option>
                  <option value="monthly">Monthly (every 30 days)</option>
                  <option value="quarterly">Quarterly (every 90 days)</option>
                  <option value="semiannually">Semi-annually (every 180 days)</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-semibold ${c.text} mb-2`}>
                  Last Contact Date *
                </label>
                <input
                  type="date"
                  value={formData.lastContact}
                  onChange={(e) => setFormData({...formData, lastContact: e.target.value})}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 rounded-lg border ${c.input} focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold ${c.text} mb-2`}>
                  Context Notes (Optional)
                  <span className={`ml-2 text-xs font-normal ${c.textMuted}`}>
                    Shared interests, ongoing topics, things to ask about
                  </span>
                </label>
                <textarea
                  value={formData.contextNotes}
                  onChange={(e) => setFormData({...formData, contextNotes: e.target.value})}
                  placeholder="e.g., loves hiking, ask about new trail; planning wedding; talks about sci-fi books"
                  className={`w-full px-4 py-3 rounded-lg border ${c.input} focus:ring-2 focus:ring-blue-500`}
                  rows={3}
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={saveRelationship}
                  className={`flex-1 ${c.btnPrimary} py-3 rounded-lg font-semibold`}
                >
                  <Check className="w-4 h-4 inline mr-2" />
                  {formData.id ? 'Update Person' : 'Add Person'}
                </button>
                <button
                  onClick={() => { resetForm(); setView('dashboard'); }}
                  className={`${c.btnSecondary} py-3 px-6 rounded-lg font-semibold`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Conversation Starters View */}
        {view === 'starters' && selectedPerson && (
          <div className="space-y-6">
<button
  onClick={() => setView('dashboard')}
  className={`${c.btnSecondary} px-4 py-2 rounded-lg font-medium text-sm`}
>
  ← Back to Friends List
</button>
            {loading && (
              <div className={`${c.card} rounded-xl shadow-lg p-12 text-center`}>
                <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
                <p className={`${c.text}`}>Generating conversation starters...</p>
              </div>
            )}

            {error && !apiError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {conversationStarters && (
              <div className="space-y-6">
                {/* Context */}
                <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                  <h2 className={`text-2xl font-bold ${c.text} mb-4`}>
                    Conversation Starters for {conversationStarters.relationship_context.name}
                  </h2>
                  <p className={`${c.textSecondary} text-sm`}>
                    It's been {conversationStarters.relationship_context.days_since_contact} days • 
                    {conversationStarters.relationship_context.relationship_type}
                  </p>
                </div>

                {/* Guilt Relief */}
                {conversationStarters.guilt_relief && (
                  <div className={`${c.card} rounded-xl shadow-lg p-6 border-2 border-green-400`}>
                    <h3 className={`font-bold ${c.text} mb-3 flex items-center gap-2`}>
                      <Heart className="w-5 h-5 text-green-600" />
                      First: Release the Guilt
                    </h3>
                    <p className={`${c.textSecondary} mb-2`}>
                      <strong>Reframe:</strong> {conversationStarters.guilt_relief.reframe}
                    </p>
                    <p className={`${c.textSecondary}`}>
                      <strong>Permission:</strong> {conversationStarters.guilt_relief.permission}
                    </p>
                  </div>
                )}

                {/* Conversation Starters */}
                {conversationStarters.conversation_starters && conversationStarters.conversation_starters.length > 0 && (
                  <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                    <h3 className={`font-bold ${c.text} mb-4 text-lg`}>Ready-to-Send Messages</h3>
                    <div className="space-y-4">
                      {conversationStarters.conversation_starters.map((starter, idx) => (
                        <div key={idx} className={`${c.cardAlt} rounded-lg p-4 border-l-4 border-blue-500`}>
                          <p className={`${c.text} mb-3 text-lg`}>
                            "{starter.opener}"
                          </p>
                          <div className="text-sm space-y-2">
                            <p className={c.textSecondary}>
                              <strong>Tone:</strong> {starter.tone}
                            </p>
                            <p className={c.textSecondary}>
                              <strong>Why this works:</strong> {starter.why_this_works}
                            </p>
                            {starter.follow_up_ideas && starter.follow_up_ideas.length > 0 && (
                              <div>
                                <p className={`${c.textSecondary} font-semibold mb-1`}>Follow-up ideas:</p>
                                <ul className="list-disc list-inside space-y-1">
                                  {starter.follow_up_ideas.map((idea, iidx) => (
                                    <li key={iidx} className={c.textMuted}>{idea}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(starter.opener);
                              alert('Copied to clipboard!');
                            }}
                            className={`mt-3 ${c.btnSecondary} px-4 py-2 rounded-lg text-sm font-medium`}
                          >
                            Copy Message
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reconnection Approaches */}
                {conversationStarters.reconnection_approaches && conversationStarters.reconnection_approaches.length > 0 && (
                  <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                    <h3 className={`font-bold ${c.text} mb-4 text-lg`}>Different Approaches</h3>
                    <div className="space-y-3">
                      {conversationStarters.reconnection_approaches.map((approach, idx) => (
                        <div key={idx} className={`${c.cardAlt} rounded-lg p-4`}>
                          <p className={`font-bold ${c.text} mb-2`}>{approach.approach}</p>
                          <p className={`${c.textSecondary} mb-2 italic`}>
                            "{approach.message}"
                          </p>
                          <p className={`text-xs ${c.textMuted}`}>
                            When to use: {approach.when_to_use}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shared Interest Hooks */}
                {conversationStarters.shared_interest_hooks && conversationStarters.shared_interest_hooks.length > 0 && (
                  <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                    <h3 className={`font-bold ${c.text} mb-4 text-lg`}>Shared Interest Hooks</h3>
                    <div className="space-y-3">
                      {conversationStarters.shared_interest_hooks.map((hook, idx) => (
                        <div key={idx} className={`${c.cardAlt} rounded-lg p-4`}>
                          <p className={`font-bold ${c.text} mb-1`}>{hook.topic}</p>
                          <p className={`text-sm ${c.textSecondary}`}>{hook.conversation_angle}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className={`${c.card} rounded-xl shadow-lg p-6 border-2 border-blue-500`}>
                  <p className={`${c.text} mb-4`}>
                    Ready to send? Mark {selectedPerson.name} as contacted to reset the timer.
                  </p>
                  <button
                    onClick={() => {
                      markAsContacted(selectedPerson.id);
                      alert(`✓ ${selectedPerson.name} marked as contacted! Timer reset.`);
                      setView('dashboard');
                    }}
                    className={`w-full ${c.btnPrimary} py-3 rounded-lg font-semibold text-lg`}
                  >
                    <Check className="w-5 h-5 inline mr-2" />
                    Mark as Contacted & Return to Friends List
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default FriendshipFadeAlerter;
