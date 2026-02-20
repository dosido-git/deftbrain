import React, { useState, useEffect, useRef } from 'react';
import twemoji from 'twemoji';

// Emoji Component for Twemoji rendering
const Emoji = ({ emoji, size = 24, className = '' }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = twemoji.parse(emoji, {
        folder: 'svg',
        ext: '.svg'
      });
    }
  }, [emoji]);

  return (
    <span
      ref={ref}
      className={className}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        lineHeight: 1
      }}
    />
  );
};

const RamenRatio = () => {
  // Currency data
  const CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
    { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
    { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
    { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
    { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar' },
    { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
    { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
    { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
    { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
    { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
    { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
    { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
    { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
    { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
    { code: 'ILS', symbol: '₪', name: 'Israeli Shekel' },
    { code: 'ARS', symbol: '$', name: 'Argentine Peso' },
    { code: 'CLP', symbol: '$', name: 'Chilean Peso' },
    { code: 'COP', symbol: '$', name: 'Colombian Peso' },
    { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' }
  ];

  // Baseline units with emojis
  const BASELINE_UNITS = [
    { id: 'meals', name: 'Meals', emoji: '🍜', baseValue: 3.5, color: '#ff6b6b', category: 'Food' },
    { id: 'coffee', name: 'Coffees', emoji: '☕', baseValue: 5, color: '#8b4513', category: 'Beverages' },
    { id: 'rent', name: 'Days of Rent', emoji: '🏠', baseValue: 50, color: '#4ecdc4', category: 'Housing' },
    { id: 'gas', name: 'Tanks of Gas', emoji: '⛽', baseValue: 45, color: '#95e1d3', category: 'Transportation' },
    { id: 'uber', name: 'Uber Rides', emoji: '🚗', baseValue: 20, color: '#000000', category: 'Transportation' },
    { id: 'spotify', name: 'Months of Spotify', emoji: '🎵', baseValue: 10.99, color: '#1db954', category: 'Entertainment' },
    { id: 'netflix', name: 'Months of Netflix', emoji: '📺', baseValue: 15.49, color: '#e50914', category: 'Entertainment' },
    { id: 'gym', name: 'Gym Memberships', emoji: '💪', baseValue: 40, color: '#ff9f43', category: 'Health' },
    { id: 'book', name: 'Books', emoji: '📚', baseValue: 15, color: '#786fa6', category: 'Education' },
    { id: 'movie', name: 'Movie Tickets', emoji: '🎬', baseValue: 12, color: '#f8b500', category: 'Entertainment' },
    { id: 'beer', name: 'Beers', emoji: '🍺', baseValue: 6, color: '#f39c12', category: 'Beverages' },
    { id: 'pizza', name: 'Pizzas', emoji: '🍕', baseValue: 12, color: '#e74c3c', category: 'Food' },
    { id: 'haircut', name: 'Haircuts', emoji: '💇', baseValue: 30, color: '#9b59b6', category: 'Personal Care' }
  ];

  // State
  const [selectedCurrency, setSelectedCurrency] = useState(CURRENCIES[0]);
  const [currentUnit, setCurrentUnit] = useState(BASELINE_UNITS[0]);
  const [customValue, setCustomValue] = useState(currentUnit.baseValue);
  const [purchaseDescription, setPurchaseDescription] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [purchaseResult, setPurchaseResult] = useState(null);
  const [showUnitSelector, setShowUnitSelector] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [isEditingValue, setIsEditingValue] = useState(false);

  // Calculate total units
  const totalUnits = customValue > 0 ? (1000 / customValue).toFixed(1) : 0;

  // Handle purchase calculation
  const handlePurchaseCheck = () => {
    if (!purchaseAmount || parseFloat(purchaseAmount) <= 0) return;

    const amount = parseFloat(purchaseAmount);
    const units = customValue > 0 ? (amount / customValue).toFixed(1) : 0;
    const percentOfSecurity = customValue > 0 ? ((amount / 1000) * 100).toFixed(1) : 0;

    const result = {
      description: purchaseDescription || 'Purchase',
      amount: amount,
      units: units,
      unitName: currentUnit.name,
      emoji: currentUnit.emoji,
      percent: percentOfSecurity,
      timestamp: new Date().toISOString()
    };

    setPurchaseResult(result);

    // Add to history
    setPurchaseHistory(prev => [result, ...prev.slice(0, 9)]);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ESC key - clear current focused field
      if (e.key === 'Escape') {
        const activeElement = document.activeElement;
        if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'SELECT') {
          if (activeElement.name === 'currency') {
            setSelectedCurrency(CURRENCIES[0]);
          } else if (activeElement.name === 'description') {
            setPurchaseDescription('');
          } else if (activeElement.name === 'amount') {
            setPurchaseAmount('');
            setPurchaseResult(null);
          }
          activeElement.blur();
        }
      }
      // ENTER key - submit if in description or amount field
      if (e.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement.name === 'description' || activeElement.name === 'amount') {
          handlePurchaseCheck();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [purchaseDescription, purchaseAmount, customValue, selectedCurrency]);

  // Update custom value when unit changes
  useEffect(() => {
    setCustomValue(currentUnit.baseValue);
    setIsEditingValue(false);
  }, [currentUnit.id]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '1rem'
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        input:focus, select:focus, button:focus {
          outline: none;
        }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* ========================================= */}
      {/* PURCHASE REALITY CHECK                     */}
      {/* ========================================= */}
      <div style={{
        background: `linear-gradient(135deg, ${currentUnit.color}15 0%, ${currentUnit.color}05 100%)`,
        borderRadius: '1rem',
        padding: '0.75rem',
        marginBottom: '1.5rem',
        border: `2px solid ${currentUnit.color}40`
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '0.75rem'
        }}>
          <Emoji emoji="💰" size={36} />
          <div style={{ flex: 1 }}>
            <h2 style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: '700',
              color: 'white'
            }}>Purchase Reality Check</h2>
            <p style={{
              margin: 0,
              fontSize: '0.75rem',
              color: '#94a3b8',
              marginTop: '0.125rem'
            }}>See the true cost in units that matter to you</p>
          </div>
        </div>

        {/* Input Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '120px 200px 1fr',
          gap: '0.75rem',
          marginBottom: '0.75rem'
        }}>
          {/* Currency Selector */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.7rem',
              color: '#94a3b8',
              marginBottom: '0.25rem',
              fontWeight: '500'
            }}>Currency</label>
            <div style={{ position: 'relative' }}>
              <Emoji 
                emoji="🌐" 
                size={14}
                className="currency-icon"
                style={{
                  position: 'absolute',
                  left: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  zIndex: 1
                }}
              />
              <select
                name="currency"
                value={selectedCurrency.code}
                onChange={(e) => {
                  const currency = CURRENCIES.find(c => c.code === e.target.code);
                  if (currency) setSelectedCurrency(currency);
                }}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0.625rem 0.5rem 0.625rem 2rem',
                  fontSize: '0.8rem',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '0.5rem',
                  color: 'white',
                  cursor: 'pointer',
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.5rem center'
                }}
              >
                {CURRENCIES.map(curr => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} {curr.symbol}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.7rem',
              color: '#94a3b8',
              marginBottom: '0.25rem',
              fontWeight: '500'
            }}>What?</label>
            <input
              name="description"
              type="text"
              value={purchaseDescription}
              onChange={(e) => setPurchaseDescription(e.target.value)}
              placeholder="New shoes..."
              style={{
                width: '100%',
                height: '40px',
                padding: '0.625rem',
                fontSize: '0.875rem',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '0.5rem',
                color: 'white'
              }}
            />
          </div>

          {/* Amount & Calculate */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              color: 'white',
              marginBottom: '0.25rem',
              fontWeight: '600'
            }}>How Much?</label>
            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1.25rem',
                  color: currentUnit.color,
                  fontWeight: '700',
                  pointerEvents: 'none',
                  zIndex: 1
                }}>{selectedCurrency.symbol}</span>
                <input
                  name="amount"
                  type="number"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  placeholder="0"
                  style={{
                    width: '100%',
                    height: '40px',
                    padding: '1rem 1rem 1rem 2.5rem',
                    fontSize: '1.5rem',
                    fontWeight: '700',
                    backgroundColor: '#1e293b',
                    border: `3px solid ${currentUnit.color}60`,
                    borderRadius: '0.5rem',
                    color: 'white',
                    boxShadow: `0 4px 6px -1px ${currentUnit.color}20, 0 2px 4px -1px ${currentUnit.color}10`,
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = currentUnit.color;
                    e.target.style.boxShadow = `0 0 0 3px ${currentUnit.color}30, 0 4px 6px -1px ${currentUnit.color}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = `${currentUnit.color}60`;
                    e.target.style.boxShadow = `0 4px 6px -1px ${currentUnit.color}20, 0 2px 4px -1px ${currentUnit.color}10`;
                  }}
                />
              </div>
              <button
                onClick={handlePurchaseCheck}
                style={{
                  height: '40px',
                  padding: '0 1.5rem',
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  background: `linear-gradient(135deg, ${currentUnit.color} 0%, ${currentUnit.color}dd 100%)`,
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: 'white',
                  cursor: 'pointer',
                  boxShadow: `0 4px 6px -1px ${currentUnit.color}40, 0 2px 4px -1px ${currentUnit.color}20`,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = `0 8px 12px -2px ${currentUnit.color}60, 0 4px 8px -2px ${currentUnit.color}30`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = `0 4px 6px -1px ${currentUnit.color}40, 0 2px 4px -1px ${currentUnit.color}20`;
                }}
              >
                Calculate
              </button>
            </div>
          </div>
        </div>

        {/* Result */}
        {purchaseResult && (
          <div style={{
            background: `linear-gradient(135deg, ${currentUnit.color}20 0%, ${currentUnit.color}10 100%)`,
            borderRadius: '0.75rem',
            padding: '0.875rem',
            border: `2px solid ${currentUnit.color}60`
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Emoji emoji={purchaseResult.emoji} size={32} />
                <div>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: '800',
                    color: currentUnit.color,
                    lineHeight: 1
                  }}>
                    {purchaseResult.units}
                  </div>
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#94a3b8',
                    marginTop: '0.25rem'
                  }}>
                    {purchaseResult.unitName.toLowerCase()}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#94a3b8',
                  marginBottom: '0.25rem'
                }}>
                  That's {purchaseResult.percent}% of your
                </div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'white'
                }}>
                  Financial Security
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '1.5rem'
      }}>
        {/* Left Column */}
        <div>
          {/* Unit Selector */}
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: '600',
                color: 'white'
              }}>
                Change Unit
              </h3>
              <button
                onClick={() => setShowUnitSelector(!showUnitSelector)}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  backgroundColor: currentUnit.color,
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                }}
              >
                {showUnitSelector ? 'Close' : 'Select Unit'}
              </button>
            </div>

            {showUnitSelector && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '0.75rem',
                marginTop: '1rem'
              }}>
                {BASELINE_UNITS.map(unit => (
                  <button
                    key={unit.id}
                    onClick={() => {
                      setCurrentUnit(unit);
                      setShowUnitSelector(false);
                    }}
                    style={{
                      padding: '1rem',
                      backgroundColor: currentUnit.id === unit.id ? `${unit.color}30` : '#0f172a',
                      border: `2px solid ${currentUnit.id === unit.id ? unit.color : '#334155'}`,
                      borderRadius: '0.75rem',
                      color: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                    onMouseEnter={(e) => {
                      if (currentUnit.id !== unit.id) {
                        e.target.style.borderColor = unit.color;
                        e.target.style.backgroundColor = `${unit.color}15`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentUnit.id !== unit.id) {
                        e.target.style.borderColor = '#334155';
                        e.target.style.backgroundColor = '#0f172a';
                      }
                    }}
                  >
                    <Emoji emoji={unit.emoji} size={32} />
                    <div style={{
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginTop: '0.5rem'
                    }}>
                      {unit.name}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#94a3b8',
                      marginTop: '0.25rem'
                    }}>
                      {selectedCurrency.symbol}{unit.baseValue}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Current Unit Display */}
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '1rem'
            }}>
              <Emoji emoji={currentUnit.emoji} size={48} />
              <div style={{ flex: 1 }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: 'white',
                  marginBottom: '0.5rem'
                }}>
                  {currentUnit.name}
                </h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.75rem'
                }}>
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#94a3b8'
                  }}>
                    {selectedCurrency.symbol}
                  </span>
                  {isEditingValue ? (
                    <input
                      type="number"
                      value={customValue}
                      onChange={(e) => setCustomValue(parseFloat(e.target.value) || 0)}
                      onBlur={() => setIsEditingValue(false)}
                      autoFocus
                      style={{
                        width: '100px',
                        padding: '0.25rem 0.5rem',
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        backgroundColor: '#0f172a',
                        border: `2px solid ${currentUnit.color}`,
                        borderRadius: '0.375rem',
                        color: 'white'
                      }}
                    />
                  ) : (
                    <span
                      onClick={() => setIsEditingValue(true)}
                      style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: currentUnit.color,
                        cursor: 'pointer',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = `${currentUnit.color}20`;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      {customValue.toFixed(2)}
                    </span>
                  )}
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#94a3b8'
                  }}>
                    per {currentUnit.name.toLowerCase().slice(0, -1)}
                  </span>
                  <button
                    onClick={() => setIsEditingValue(true)}
                    style={{
                      padding: '0.25rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = `${currentUnit.color}20`;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                    }}
                    title="Edit value"
                  >
                    <Emoji emoji="✏️" size={14} />
                  </button>
                </div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '800',
                  color: currentUnit.color
                }}>
                  You have: {totalUnits}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  marginTop: '0.25rem'
                }}>
                  {currentUnit.name.toLowerCase()} in your financial security
                </div>
              </div>
            </div>
          </div>

          {/* Financial Security Counter */}
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <Emoji emoji="🎯" size={40} />
              <div>
                <h3 style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'white'
                }}>
                  Financial Security
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  color: '#94a3b8',
                  marginTop: '0.25rem'
                }}>
                  Your baseline monthly budget
                </p>
              </div>
            </div>
            <div style={{
              fontSize: '3rem',
              fontWeight: '800',
              color: '#10b981',
              marginBottom: '0.5rem'
            }}>
              {selectedCurrency.symbol}1,000
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: '#94a3b8'
            }}>
              This is your foundation — rent, food, utilities, transportation
            </div>
          </div>

          {/* Why This Matters */}
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '1rem',
            padding: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '1rem'
            }}>
              <Emoji emoji="💡" size={32} />
              <h3 style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: '600',
                color: 'white'
              }}>
                Why This Matters
              </h3>
            </div>
            <p style={{
              margin: 0,
              fontSize: '0.875rem',
              color: '#cbd5e1',
              lineHeight: 1.6
            }}>
              When you see a {selectedCurrency.symbol}{(customValue * 10).toFixed(2)} purchase, 
              your brain might say "that's not much." But when you realize it's {(10).toFixed(1)} {currentUnit.name.toLowerCase()} — 
              {currentUnit.id === 'meals' && ' over a week of food'}
              {currentUnit.id === 'coffee' && ' two weeks of coffee'}
              {currentUnit.id === 'rent' && ' almost two weeks of housing'}
              {currentUnit.id === 'gas' && ' enough to keep you mobile for weeks'}
              {currentUnit.id === 'uber' && ' ten trips across town'}
              {currentUnit.id === 'spotify' && ' almost a year of music'}
              {currentUnit.id === 'netflix' && ' almost a year of entertainment'}
              {currentUnit.id === 'gym' && ' almost a year of fitness'}
              {currentUnit.id === 'book' && ' a small library'}
              {currentUnit.id === 'movie' && ' ten nights out'}
              {currentUnit.id === 'beer' && ' plenty of social time'}
              {currentUnit.id === 'pizza' && ' feeding yourself or friends for days'}
              {currentUnit.id === 'haircut' && ' almost a year of grooming'}
              {' — '}suddenly the decision becomes clearer.
            </p>
          </div>
        </div>

        {/* Middle Column - Settings Panel */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '1rem',
          padding: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <Emoji emoji="⚙️" size={32} />
            <h3 style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: '700',
              color: 'white'
            }}>
              Settings
            </h3>
          </div>

            <div style={{
              fontSize: '0.875rem',
              color: '#94a3b8',
              marginBottom: '1rem'
            }}>
              Customize your unit values and preferences
            </div>

            {/* Custom Unit Values */}
            <div>
              <h4 style={{
                margin: '0 0 1rem 0',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'white',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Custom Unit Values
              </h4>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {BASELINE_UNITS.map(unit => (
                  <div
                    key={unit.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      backgroundColor: '#0f172a',
                      borderRadius: '0.5rem',
                      border: currentUnit.id === unit.id ? `2px solid ${unit.color}` : '1px solid #334155'
                    }}
                  >
                    <Emoji emoji={unit.emoji} size={24} />
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: 'white'
                      }}>
                        {unit.name}
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{
                        fontSize: '0.875rem',
                        color: '#94a3b8'
                      }}>
                        {selectedCurrency.symbol}
                      </span>
                      <input
                        type="number"
                        defaultValue={unit.baseValue}
                        style={{
                          width: '80px',
                          padding: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '0.375rem',
                          color: 'white'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        {/* Right Column - Purchase History */}
        <div>
          {purchaseHistory.length > 0 ? (
            <div style={{
              backgroundColor: '#1e293b',
              borderRadius: '1rem',
              padding: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginBottom: '1rem'
              }}>
                <Emoji emoji="📊" size={32} />
                <h3 style={{
                  margin: 0,
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'white'
                }}>
                  Recent Purchases
                </h3>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {purchaseHistory.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      backgroundColor: '#0f172a',
                      borderRadius: '0.5rem',
                      border: '1px solid #334155'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem'
                    }}>
                      <Emoji emoji={item.emoji} size={24} />
                      <div>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: 'white'
                        }}>
                          {item.description}
                        </div>
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#94a3b8',
                          marginTop: '0.125rem'
                        }}>
                          {selectedCurrency.symbol}{item.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div style={{
                      textAlign: 'right'
                    }}>
                      <div style={{
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        color: currentUnit.color
                      }}>
                        {item.units}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#94a3b8'
                      }}>
                        {item.unitName.toLowerCase()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              backgroundColor: '#1e293b',
              borderRadius: '1rem',
              padding: '1.5rem',
              textAlign: 'center'
            }}>
              <Emoji emoji="📊" size={48} />
              <h3 style={{
                margin: '1rem 0 0.5rem 0',
                fontSize: '1rem',
                fontWeight: '600',
                color: 'white'
              }}>
                No Purchases Yet
              </h3>
              <p style={{
                margin: 0,
                fontSize: '0.875rem',
                color: '#94a3b8'
              }}>
                Check a purchase above to see it appear here
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RamenRatio;
