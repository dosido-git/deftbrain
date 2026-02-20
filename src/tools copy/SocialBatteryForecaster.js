import React, { useState, useEffect } from 'react';
import { Battery, Users, Calendar, AlertTriangle, Loader2, BatteryCharging, Plus, X, ChevronRight } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

const SocialBatteryForecaster = () => {
  const { isDark } = useTheme();
  const { callToolEndpoint, loading, error: apiError } = useClaudeAPI();

  // State
  const [view, setView] = useState('setup'); // setup | input | forecast | calendar
  const [settings, setSettings] = useState({
    energyType: 50, // 0 = extreme introvert, 100 = extrovert
    rechargeActivities: [],
    minimumRechargeHours: 3
  });
  const [events, setEvents] = useState([]);
  const [currentBattery, setCurrentBattery] = useState(90);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    date: '',
    time: '',
    duration: 1,
    eventType: '',
    numPeople: 1,
    role: '',
    canLeaveEarly: true,
    recoveryHours: 0
  });
  const [forecast, setForecast] = useState(null);
  const [error, setError] = useState('');

  // Theme colors
  const c = {
    gradient: isDark ? 'from-purple-900/20 to-blue-900/20' : 'from-purple-50 to-blue-50',
    card: isDark ? 'bg-gray-800' : 'bg-white',
    cardAlt: isDark ? 'bg-gray-700/50' : 'bg-purple-50/50',
    text: isDark ? 'text-gray-100' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-300' : 'text-gray-700',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
    input: isDark ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900',
    btnPrimary: isDark ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white',
    btnSecondary: isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-100' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  };

  // Load saved settings
  useEffect(() => {
    const saved = localStorage.getItem('social-battery-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
      setView('input');
    }
  }, []);

  // Save settings
  const saveSettings = () => {
    localStorage.setItem('social-battery-settings', JSON.stringify(settings));
    setView('input');
  };

  // Add event
  const addEvent = () => {
    if (!newEvent.name || !newEvent.date || !newEvent.eventType || !newEvent.role) {
      setError('Please fill in all required fields');
      return;
    }
    
    setEvents([...events, { ...newEvent, id: Date.now() }]);
    setNewEvent({
      name: '',
      date: '',
      time: '',
      duration: 1,
      eventType: '',
      numPeople: 1,
      role: '',
      canLeaveEarly: true,
      recoveryHours: 0
    });
    setShowAddEvent(false);
    setError('');
  };

  // Remove event
  const removeEvent = (id) => {
    setEvents(events.filter(e => e.id !== id));
  };

  // Generate forecast
  const generateForecast = async () => {
    if (events.length === 0) {
      setError('Please add at least one event');
      return;
    }

    setError('');
    
    try {
      const data = await callToolEndpoint('social-battery-forecaster', {
        settings,
        events,
        currentBattery
      });

      setForecast(data);
      setView('forecast');
    } catch (err) {
      setError(err.message || 'Failed to generate forecast');
    }
  };

  // Battery color
  const getBatteryColor = (level) => {
    if (level >= 60) return 'text-green-600 dark:text-green-400';
    if (level >= 30) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Battery fill
  const getBatteryFill = (level) => {
    if (level >= 60) return 'bg-green-500';
    if (level >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${c.gradient} p-6`}>
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Battery className="w-12 h-12 text-purple-600 dark:text-purple-400" />
            <h1 className={`text-4xl font-bold ${c.text}`}>Social Battery Forecaster</h1>
          </div>
          <p className={`text-lg ${c.textSecondary}`}>
            Predict when you'll need alone time based on social obligations
          </p>
        </div>

        {/* SETUP VIEW */}
        {view === 'setup' && (
          <div className={`${c.card} rounded-xl shadow-lg p-8 max-w-2xl mx-auto`}>
            <h2 className={`text-2xl font-bold ${c.text} mb-6`}>Initial Setup</h2>
            
            {/* Energy Type */}
            <div className="mb-8">
              <label className={`block text-sm font-semibold ${c.text} mb-3`}>
                Your Social Energy Type
              </label>
              <div className="flex items-center gap-4">
                <span className={`text-xs ${c.textMuted}`}>Extreme Introvert</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.energyType}
                  onChange={(e) => setSettings({...settings, energyType: parseInt(e.target.value)})}
                  className="flex-1"
                />
                <span className={`text-xs ${c.textMuted}`}>Extrovert</span>
              </div>
              <p className={`text-sm ${c.textMuted} mt-2 text-center`}>
                {settings.energyType < 25 ? 'Extreme Introvert' : 
                 settings.energyType < 50 ? 'Introvert' :
                 settings.energyType < 75 ? 'Ambivert' : 'Extrovert'}
              </p>
            </div>

            {/* Recharge Activities */}
            <div className="mb-8">
              <label className={`block text-sm font-semibold ${c.text} mb-3`}>
                What Recharges You? (select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['Alone time', 'Nature/outdoors', 'Reading', 'Sleep', 'Exercise', 'Music', 'Creative hobbies', 'Meditation'].map((activity) => (
                  <label key={activity} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.rechargeActivities.includes(activity)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSettings({...settings, rechargeActivities: [...settings.rechargeActivities, activity]});
                        } else {
                          setSettings({...settings, rechargeActivities: settings.rechargeActivities.filter(a => a !== activity)});
                        }
                      }}
                      className="rounded"
                    />
                    <span className={`text-sm ${c.textSecondary}`}>{activity}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Minimum Recharge Time */}
            <div className="mb-8">
              <label className={`block text-sm font-semibold ${c.text} mb-3`}>
                Minimum Recharge Time Needed (hours)
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={settings.minimumRechargeHours}
                onChange={(e) => setSettings({...settings, minimumRechargeHours: parseInt(e.target.value)})}
                className={`w-full px-4 py-3 rounded-lg border ${c.input}`}
              />
              <p className={`text-xs ${c.textMuted} mt-2`}>
                How many hours of alone time do you typically need to feel recharged?
              </p>
            </div>

            <button
              onClick={saveSettings}
              className={`w-full ${c.btnPrimary} py-4 rounded-lg font-bold text-lg`}
            >
              Save Settings & Continue
            </button>
          </div>
        )}

        {/* INPUT VIEW */}
        {view === 'input' && (
          <div className="space-y-6">
            
            {/* Current Battery */}
            <div className={`${c.card} rounded-xl shadow-lg p-6`}>
              <h3 className={`font-bold ${c.text} mb-4`}>Current Energy Level</h3>
              <div className="flex items-center gap-4">
                <Battery className={`w-8 h-8 ${getBatteryColor(currentBattery)}`} />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={currentBattery}
                  onChange={(e) => setCurrentBattery(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className={`text-2xl font-bold ${c.text}`}>{currentBattery}%</span>
              </div>
            </div>

            {/* Events List */}
            <div className={`${c.card} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-bold ${c.text}`}>Upcoming Events ({events.length})</h3>
                <button
                  onClick={() => setShowAddEvent(true)}
                  className={`${c.btnPrimary} px-4 py-2 rounded-lg font-semibold flex items-center gap-2`}
                >
                  <Plus className="w-4 h-4" />
                  Add Event
                </button>
              </div>

              {events.length === 0 ? (
                <p className={`text-center ${c.textMuted} py-8`}>
                  No events added yet. Click "Add Event" to start.
                </p>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className={`${c.cardAlt} rounded-lg p-4 flex items-center justify-between`}>
                      <div>
                        <p className={`font-semibold ${c.text}`}>{event.name}</p>
                        <p className={`text-sm ${c.textMuted}`}>
                          {event.date} {event.time && `at ${event.time}`} • {event.duration}h • {event.numPeople} people
                        </p>
                        <p className={`text-xs ${c.textMuted}`}>
                          {event.eventType} • {event.role}
                        </p>
                      </div>
                      <button
                        onClick={() => removeEvent(event.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {events.length > 0 && (
                <button
                  onClick={generateForecast}
                  disabled={loading}
                  className={`w-full mt-6 ${c.btnPrimary} py-4 rounded-lg font-bold text-lg disabled:opacity-50`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                      Generating Forecast...
                    </>
                  ) : (
                    <>
                      <BatteryCharging className="w-5 h-5 inline mr-2" />
                      Generate Energy Forecast
                    </>
                  )}
                </button>
              )}

              {error && (
                <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}
            </div>

            {/* Add Event Modal */}
            {showAddEvent && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className={`${c.card} rounded-2xl p-6 max-w-2xl w-full my-8`}>
                  <h3 className={`text-2xl font-bold ${c.text} mb-6`}>Add Event</h3>
                  
                  <div className="space-y-4">
                    {/* Event Name */}
                    <div>
                      <label className={`block text-sm font-semibold ${c.text} mb-2`}>Event Name *</label>
                      <input
                        type="text"
                        value={newEvent.name}
                        onChange={(e) => setNewEvent({...newEvent, name: e.target.value})}
                        placeholder="e.g., Team meeting, Sarah's birthday party"
                        className={`w-full px-4 py-2 rounded-lg border ${c.input}`}
                      />
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-semibold ${c.text} mb-2`}>Date *</label>
                        <input
                          type="date"
                          value={newEvent.date}
                          onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                          className={`w-full px-4 py-2 rounded-lg border ${c.input}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-semibold ${c.text} mb-2`}>Time</label>
                        <input
                          type="time"
                          value={newEvent.time}
                          onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                          className={`w-full px-4 py-2 rounded-lg border ${c.input}`}
                        />
                      </div>
                    </div>

                    {/* Duration and Num People */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-semibold ${c.text} mb-2`}>Duration (hours)</label>
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={newEvent.duration}
                          onChange={(e) => setNewEvent({...newEvent, duration: parseFloat(e.target.value)})}
                          className={`w-full px-4 py-2 rounded-lg border ${c.input}`}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-semibold ${c.text} mb-2`}>Number of People</label>
                        <input
                          type="number"
                          min="1"
                          value={newEvent.numPeople}
                          onChange={(e) => setNewEvent({...newEvent, numPeople: parseInt(e.target.value)})}
                          className={`w-full px-4 py-2 rounded-lg border ${c.input}`}
                        />
                      </div>
                    </div>

                    {/* Event Type */}
                    <div>
                      <label className={`block text-sm font-semibold ${c.text} mb-2`}>Event Type *</label>
                      <select
                        value={newEvent.eventType}
                        onChange={(e) => setNewEvent({...newEvent, eventType: e.target.value})}
                        className={`w-full px-4 py-2 rounded-lg border ${c.input}`}
                      >
                        <option value="">Select type...</option>
                        <option value="Work meeting">Work meeting</option>
                        <option value="Social gathering">Social gathering</option>
                        <option value="Family event">Family event</option>
                        <option value="1-on-1 friend">1-on-1 friend</option>
                        <option value="Group activity">Group activity</option>
                        <option value="Party">Party</option>
                        <option value="Networking">Networking</option>
                      </select>
                    </div>

                    {/* Role */}
                    <div>
                      <label className={`block text-sm font-semibold ${c.text} mb-2`}>Your Role *</label>
                      <select
                        value={newEvent.role}
                        onChange={(e) => setNewEvent({...newEvent, role: e.target.value})}
                        className={`w-full px-4 py-2 rounded-lg border ${c.input}`}
                      >
                        <option value="">Select role...</option>
                        <option value="Hosting">Hosting</option>
                        <option value="Attending">Attending</option>
                        <option value="Presenting">Presenting</option>
                        <option value="Observing">Observing</option>
                      </select>
                    </div>

                    {/* Can Leave Early */}
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={newEvent.canLeaveEarly}
                        onChange={(e) => setNewEvent({...newEvent, canLeaveEarly: e.target.checked})}
                        className="rounded"
                      />
                      <label className={`text-sm font-semibold ${c.text}`}>
                        Can you leave early if needed?
                      </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={addEvent}
                        className={`flex-1 ${c.btnPrimary} py-3 rounded-lg font-semibold`}
                      >
                        Add Event
                      </button>
                      <button
                        onClick={() => {
                          setShowAddEvent(false);
                          setError('');
                        }}
                        className={`flex-1 ${c.btnSecondary} py-3 rounded-lg font-semibold`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FORECAST VIEW */}
        {view === 'forecast' && forecast && (
          <div className="space-y-6">
            
            {/* Back Button */}
            <button
              onClick={() => setView('input')}
              className={`${c.btnSecondary} px-4 py-2 rounded-lg font-medium text-sm`}
            >
              ← Back to Events
            </button>

            {/* Energy Forecast Overview */}
            <div className={`${c.card} rounded-xl shadow-lg p-6`}>
              <h2 className={`text-2xl font-bold ${c.text} mb-6`}>7-Day Energy Forecast</h2>
              
              {forecast.energy_forecast?.next_7_days.map((day, idx) => (
                <div key={idx} className={`mb-6 pb-6 ${idx < forecast.energy_forecast.next_7_days.length - 1 ? 'border-b border-gray-200 dark:border-gray-700' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-lg font-bold ${c.text}`}>{day.date}</h3>
                    <div className="flex items-center gap-2">
                      <Battery className={`w-5 h-5 ${getBatteryColor(day.end_of_day_battery)}`} />
                      <span className={`font-bold ${getBatteryColor(day.end_of_day_battery)}`}>
                        {day.end_of_day_battery}%
                      </span>
                    </div>
                  </div>

                  {day.events && day.events.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {day.events.map((event, eidx) => (
                        <div key={eidx} className={`${c.cardAlt} rounded-lg p-3`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`font-semibold ${c.text}`}>{event.event}</p>
                              <p className={`text-sm ${c.textMuted}`}>{event.time}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-bold ${c.text}`}>-{event.energy_cost}%</p>
                              <p className={`text-xs ${c.textMuted}`}>→ {event.battery_after}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {day.warning && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 dark:text-red-300 font-semibold">
                        {day.warning}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Warnings */}
            {forecast.warnings && forecast.warnings.length > 0 && (
              <div className={`${c.card} rounded-xl shadow-lg p-6 border-2 border-red-500`}>
                <h2 className={`text-2xl font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2`}>
                  <AlertTriangle className="w-6 h-6" />
                  Burnout Warnings
                </h2>
                <div className="space-y-4">
                  {forecast.warnings.map((warning, idx) => (
                    <div key={idx} className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                      <p className={`font-bold ${c.text} mb-2`}>
                        {warning.type} - {warning.when}
                      </p>
                      <p className={`text-sm ${c.textSecondary} mb-2`}>
                        {warning.why}
                      </p>
                      <p className={`text-sm ${c.textMuted} mb-3`}>
                        Predicted battery: <span className="font-bold text-red-600 dark:text-red-400">{warning.battery_prediction}%</span>
                      </p>
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                        <p className={`text-sm font-semibold ${c.text}`}>
                          Recommendation: {warning.recommendation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recovery Plan */}
            {forecast.recovery_plan && (
              <div className={`${c.card} rounded-xl shadow-lg p-6 border-l-4 border-green-500`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4`}>Recovery Plan</h2>
                <div className="space-y-4">
                  <div>
                    <p className={`text-sm ${c.textMuted} mb-1`}>Recharge Needed By:</p>
                    <p className={`text-lg font-bold ${c.text}`}>{forecast.recovery_plan.recharge_needed_by}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${c.textMuted} mb-1`}>Minimum Hours Alone:</p>
                    <p className={`text-lg font-bold ${c.text}`}>{forecast.recovery_plan.minimum_hours_alone} hours</p>
                  </div>
                  <div>
                    <p className={`text-sm ${c.textMuted} mb-2`}>Recommended Activities:</p>
                    <ul className="space-y-1">
                      {forecast.recovery_plan.recommended_activities.map((activity, idx) => (
                        <li key={idx} className={`text-sm ${c.textSecondary}`}>• {activity}</li>
                      ))}
                    </ul>
                  </div>
                  {forecast.recovery_plan.what_to_decline && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                      <p className={`text-sm font-semibold ${c.text}`}>
                        {forecast.recovery_plan.what_to_decline}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Permission Statements */}
            {forecast.permission_statements && (
              <div className={`${c.card} rounded-xl shadow-lg p-6 border-l-4 border-blue-500`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4`}>Permission to Rest</h2>
                <div className="space-y-4">
                  <div>
                    <p className={`text-sm font-bold ${c.text} mb-2`}>It's okay to:</p>
                    <ul className="space-y-2">
                      {forecast.permission_statements.its_okay_to.map((permission, idx) => (
                        <li key={idx} className={`text-sm ${c.textSecondary} flex items-start gap-2`}>
                          <span className="text-blue-600 dark:text-blue-400">✓</span>
                          {permission}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {forecast.permission_statements.reframe && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <p className={`text-sm font-semibold ${c.text} italic`}>
                        "{forecast.permission_statements.reframe}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Energy Budgeting */}
            {forecast.energy_budgeting && (
              <div className={`${c.card} rounded-xl shadow-lg p-6`}>
                <h2 className={`text-2xl font-bold ${c.text} mb-4`}>Weekly Energy Budget</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${c.textMuted}`}>Already Committed</span>
                      <span className={`font-bold ${c.text}`}>{forecast.energy_budgeting.already_committed}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6">
                      <div
                        className={`h-6 rounded-full ${
                          forecast.energy_budgeting.already_committed >= 85 ? 'bg-red-500' :
                          forecast.energy_budgeting.already_committed >= 60 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(100, forecast.energy_budgeting.already_committed)}%` }}
                      />
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg ${
                    forecast.energy_budgeting.already_committed >= 85 ? 'bg-red-50 dark:bg-red-900/20' :
                    forecast.energy_budgeting.already_committed >= 60 ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                    'bg-green-50 dark:bg-green-900/20'
                  }`}>
                    <p className={`text-sm font-semibold ${c.text}`}>
                      {forecast.energy_budgeting.reality_check}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default SocialBatteryForecaster;
