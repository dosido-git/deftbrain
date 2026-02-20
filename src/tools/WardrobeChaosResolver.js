import React, { useState, useEffect, useRef } from 'react';
import { Shirt, Cloud, Heart, Battery, Loader2, AlertCircle, Plus, X, Check, Sparkles, Sun, Droplets, Wind, Snowflake, Camera, Save, Trash2, Eye, Star, TrendingUp, Zap, ShoppingBag, Upload } from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';

const WardrobeChaosHelper = () => {
  const { callToolEndpoint, loading } = useClaudeAPI();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Multi-step flow
  const [step, setStep] = useState('wardrobe'); // 'wardrobe', 'needs', 'results'
  
  // Wardrobe state (persisted to localStorage)
  const [wardrobe, setWardrobe] = useState({
    tops: [],
    bottoms: [],
    dresses: [],
    outerwear: [],
    shoes: []
  });
  const [selectedCategory, setSelectedCategory] = useState('tops');
  const [showAddItem, setShowAddItem] = useState(false);
  
  // New item form
  const [newItem, setNewItem] = useState({
    name: '',
    color: '',
    style: '',
    comfortLevel: 5,
    imagePreview: null,
    sensoryNotes: '',
    laundryStatus: 'clean', // clean, dirty, at-cleaners
    hexColor: '', // for color matching
    lastWorn: null,
    wearCount: 0
  });
  
  // Daily needs inputs
  const [weather, setWeather] = useState('');
  const [activities, setActivities] = useState({
    work: false,
    meeting: false,
    exercise: false,
    casual: false,
    event: false,
    home: false
  });
  const [mood, setMood] = useState('');
  const [comfortPriority, setComfortPriority] = useState(5); // 1=style, 10=comfort
  const [sensoryNeeds, setSensoryNeeds] = useState({
    softFabrics: false,
    looseFit: false,
    noTags: false,
    avoidTextures: ''
  });

  // Results state
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState([]);
  
  // Privacy and analytics
  const [showPrivacyPanel, setShowPrivacyPanel] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [onlyCleanItems, setOnlyCleanItems] = useState(true); // Filter dirty items
  const [showColorPalette, setShowColorPalette] = useState(false);

  const fileInputRef = useRef(null);

  // Theme-aware colors
  const c = {
    bg: isDark ? 'bg-zinc-900' : 'bg-gradient-to-br from-emerald-50 to-purple-50',
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-emerald-200',
    cardAlt: isDark ? 'bg-zinc-700 border-zinc-600' : 'bg-emerald-50 border-emerald-200',
    
    input: isDark 
      ? 'bg-zinc-900 border-zinc-700 text-zinc-50 placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500/20'
      : 'bg-white border-emerald-300 text-emerald-900 placeholder:text-emerald-400 focus:border-emerald-600 focus:ring-emerald-100',
    
    text: isDark ? 'text-zinc-50' : 'text-emerald-900',
    textSecondary: isDark ? 'text-zinc-300' : 'text-emerald-700',
    textMuted: isDark ? 'text-zinc-400' : 'text-emerald-600',
    label: isDark ? 'text-zinc-200' : 'text-emerald-800',
    
    accent: isDark ? 'text-emerald-400' : 'text-emerald-600',
    
    btnPrimary: isDark
      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
      : 'bg-emerald-600 hover:bg-emerald-700 text-white',
    btnSecondary: isDark
      ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-50'
      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900',
    btnDanger: isDark
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-red-500 hover:bg-red-600 text-white',
    
    success: isDark
      ? 'bg-emerald-900/20 border-emerald-700 text-emerald-200'
      : 'bg-emerald-50 border-emerald-300 text-emerald-800',
    warning: isDark
      ? 'bg-amber-900/20 border-amber-700 text-amber-200'
      : 'bg-amber-50 border-amber-300 text-amber-800',
  };

  // Load wardrobe and favorites from localStorage
  useEffect(() => {
    const savedWardrobe = localStorage.getItem('wardrobe-chaos-wardrobe');
    const savedFavorites = localStorage.getItem('wardrobe-chaos-favorites');
    
    if (savedWardrobe) {
      setWardrobe(JSON.parse(savedWardrobe));
    }
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Save wardrobe to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('wardrobe-chaos-wardrobe', JSON.stringify(wardrobe));
    } catch (err) {
      if (err.name === 'QuotaExceededError' || err.code === 22) {
        // localStorage quota exceeded
        console.error('localStorage quota exceeded!');
        setError('Storage limit reached! Photos take up a lot of space. Consider: (1) Removing some photos, (2) Exporting your data as backup, or (3) Using the tool without photos.');
        
        // Try to show how much space is being used
        const totalSize = new Blob([JSON.stringify(wardrobe)]).size;
        console.log(`Wardrobe size: ${(totalSize / 1024).toFixed(1)}KB`);
      } else {
        console.error('Error saving wardrobe:', err);
      }
    }
  }, [wardrobe]);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('wardrobe-chaos-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (warn if > 1MB original)
    if (file.size > 1024 * 1024) {
      console.warn('Large image detected, will compress...');
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Compress image to max 400x400px, JPEG quality 0.7
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Resize if larger than 400px
        const maxSize = 400;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG with 0.7 quality (smaller file size)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        
        // Check estimated size
        const estimatedSize = compressedDataUrl.length * 0.75; // base64 overhead
        console.log(`Image compressed: ${(estimatedSize / 1024).toFixed(1)}KB`);
        
        if (estimatedSize > 500 * 1024) {
          setError('Image still too large after compression. Try a smaller photo or skip the image.');
          return;
        }
        
        setNewItem(prev => ({ ...prev, imagePreview: compressedDataUrl }));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleAddItem = () => {
    if (!newItem.name.trim()) {
      setError('Please enter an item name');
      return;
    }

    const item = {
      id: Date.now(),
      ...newItem
    };

    setWardrobe(prev => ({
      ...prev,
      [selectedCategory]: [...prev[selectedCategory], item]
    }));

    // Reset form
    setNewItem({
      name: '',
      color: '',
      style: '',
      comfortLevel: 5,
      imagePreview: null,
      sensoryNotes: ''
    });
    setShowAddItem(false);
    setError('');
  };

  const handleDeleteItem = (category, itemId) => {
    setWardrobe(prev => ({
      ...prev,
      [category]: prev[category].filter(item => item.id !== itemId)
    }));
  };

  // Privacy functions
  const handleExportData = () => {
    const dataToExport = {
      wardrobe,
      favorites,
      exportDate: new Date().toISOString(),
      version: '2.0'
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wardrobe-wardrobe-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported.wardrobe) {
          setWardrobe(imported.wardrobe);
        }
        if (imported.favorites) {
          setFavorites(imported.favorites);
        }
        alert('Wardrobe data imported successfully!');
      } catch (err) {
        setError('Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to delete ALL wardrobe data? This cannot be undone.')) {
      localStorage.removeItem('wardrobe-chaos-wardrobe');
      localStorage.removeItem('wardrobe-chaos-favorites');
      setWardrobe({ tops: [], bottoms: [], dresses: [], outerwear: [], shoes: [] });
      setFavorites([]);
      alert('All data cleared.');
    }
  };

  // Laundry tracking
  const handleToggleLaundryStatus = (category, itemId) => {
    setWardrobe(prev => ({
      ...prev,
      [category]: prev[category].map(item => {
        if (item.id === itemId) {
          const statuses = ['clean', 'dirty', 'at-cleaners'];
          const currentIndex = statuses.indexOf(item.laundryStatus || 'clean');
          const nextIndex = (currentIndex + 1) % statuses.length;
          return { ...item, laundryStatus: statuses[nextIndex] };
        }
        return item;
      })
    }));
  };

  const getLaundryStatusIcon = (status) => {
    switch (status) {
      case 'clean': return '✨';
      case 'dirty': return '🧺';
      case 'at-cleaners': return '🏪';
      default: return '✨';
    }
  };

  const getLaundryStats = () => {
    let clean = 0, dirty = 0, atCleaners = 0;
    Object.values(wardrobe).forEach(items => {
      items.forEach(item => {
        const status = item.laundryStatus || 'clean';
        if (status === 'clean') clean++;
        else if (status === 'dirty') dirty++;
        else if (status === 'at-cleaners') atCleaners++;
      });
    });
    return { clean, dirty, atCleaners };
  };

  // Wardrobe analytics
  const getWardrobeAnalytics = () => {
    const allItems = Object.values(wardrobe).flat();
    
    // Most/least worn
    const sorted = [...allItems].sort((a, b) => (b.wearCount || 0) - (a.wearCount || 0));
    const mostWorn = sorted.slice(0, 3);
    const neverWorn = allItems.filter(item => !item.wearCount || item.wearCount === 0);
    
    // Color analysis
    const colors = {};
    allItems.forEach(item => {
      if (item.color) {
        colors[item.color.toLowerCase()] = (colors[item.color.toLowerCase()] || 0) + 1;
      }
    });
    
    const topColors = Object.entries(colors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color, count]) => ({ color, count }));
    
    // Gap analysis
    const gaps = [];
    if (wardrobe.tops.length < 5) gaps.push('Need more tops (especially basics)');
    if (wardrobe.bottoms.length < 3) gaps.push('Need more bottoms for variety');
    if (wardrobe.outerwear.length === 0) gaps.push('Consider adding a jacket or coat');
    if (wardrobe.shoes.length < 2) gaps.push('Need at least 2 pairs of shoes (casual + formal)');
    
    // Versatility score
    const versatilePieces = allItems.filter(item => 
      item.style?.toLowerCase().includes('casual') || 
      item.style?.toLowerCase().includes('basic') ||
      item.color?.toLowerCase().includes('black') ||
      item.color?.toLowerCase().includes('white') ||
      item.color?.toLowerCase().includes('navy')
    );
    
    return {
      totalItems: allItems.length,
      mostWorn,
      neverWorn,
      topColors,
      gaps,
      versatilePieces: versatilePieces.length,
      versatilityScore: Math.round((versatilePieces.length / allItems.length) * 100) || 0
    };
  };

  // Color matching helper
  const getColorMatches = (hexColor) => {
    // Simplified color matching - returns complementary colors
    // In a real implementation, you'd use proper color theory
    const colorPalettes = {
      black: ['white', 'gray', 'red', 'blue', 'any color'],
      white: ['black', 'navy', 'gray', 'any color'],
      navy: ['white', 'gray', 'beige', 'red'],
      gray: ['white', 'black', 'navy', 'pink', 'yellow'],
      beige: ['white', 'brown', 'navy', 'olive'],
      brown: ['beige', 'white', 'cream', 'green'],
      red: ['black', 'white', 'navy', 'gray'],
      blue: ['white', 'gray', 'brown', 'beige'],
      green: ['beige', 'brown', 'white', 'navy'],
      yellow: ['gray', 'white', 'navy', 'brown'],
      pink: ['gray', 'white', 'navy', 'beige'],
      purple: ['gray', 'white', 'black', 'yellow']
    };
    
    return colorPalettes[hexColor?.toLowerCase()] || ['neutral colors'];
  };

  // Storage utilities
  const getStorageUsage = () => {
    try {
      const wardrobeData = JSON.stringify(wardrobe);
      const wardrobeSize = new Blob([wardrobeData]).size;
      const maxSize = 5 * 1024 * 1024; // Assume 5MB limit
      const percentUsed = Math.round((wardrobeSize / maxSize) * 100);
      
      // Count items with photos
      const itemsWithPhotos = Object.values(wardrobe)
        .flat()
        .filter(item => item.imagePreview).length;
      
      return {
        sizeKB: Math.round(wardrobeSize / 1024),
        percentUsed,
        itemsWithPhotos,
        isNearLimit: percentUsed > 80
      };
    } catch (err) {
      return { sizeKB: 0, percentUsed: 0, itemsWithPhotos: 0, isNearLimit: false };
    }
  };

  const handleRemoveAllPhotos = () => {
    if (!window.confirm('Remove ALL photos from your wardrobe? This will free up storage space but you\'ll lose all images. Item details will remain.')) {
      return;
    }
    
    setWardrobe(prev => {
      const updated = {};
      Object.keys(prev).forEach(category => {
        updated[category] = prev[category].map(item => ({
          ...item,
          imagePreview: null
        }));
      });
      return updated;
    });
    
    setError('');
    alert('All photos removed. Your wardrobe items are still saved, just without images.');
  };

  const getTotalItems = () => {
    return Object.values(wardrobe).reduce((sum, items) => sum + items.length, 0);
  };

  const handleGenerateOutfits = async () => {
    const totalItems = getTotalItems();
    
    if (totalItems < 5) {
      setError('Please add at least 5 items to your wardrobe to get outfit suggestions');
      return;
    }

    if (!weather) {
      setError('Please select the weather conditions');
      return;
    }

    if (!mood) {
      setError('Please select your mood for today');
      return;
    }

    const selectedActivities = Object.entries(activities)
      .filter(([_, checked]) => checked)
      .map(([activity]) => activity);

    if (selectedActivities.length === 0) {
      setError('Please select at least one activity');
      return;
    }

    // Filter wardrobe based on laundry status
    const availableWardrobe = {};
    Object.entries(wardrobe).forEach(([category, items]) => {
      if (onlyCleanItems) {
        availableWardrobe[category] = items.filter(item => 
          item.laundryStatus === 'clean' || !item.laundryStatus
        );
      } else {
        availableWardrobe[category] = items;
      }
    });

    const availableItems = Object.values(availableWardrobe).reduce((sum, items) => sum + items.length, 0);
    
    if (availableItems < 5) {
      setError(`Not enough clean items! You have ${availableItems} clean items. Either do laundry or uncheck "Only suggest clean items"`);
      return;
    }

    setError('');
    setResults(null);

    try {
      const data = await callToolEndpoint('wardrobe-chaos-resolver', {
        wardrobeInventory: availableWardrobe,
        weather,
        activities: selectedActivities,
        mood,
        comfortPriority,
        sensoryNeeds
      });
      
      // Update wear counts for suggested items
      if (data.outfit_combinations) {
        const suggestedItems = new Set();
        data.outfit_combinations.forEach(outfit => {
          Object.values(outfit.items).forEach(itemName => {
            if (itemName) suggestedItems.add(itemName.toLowerCase());
          });
        });
        
        // Increment wear count for suggested items
        setWardrobe(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(category => {
            updated[category] = updated[category].map(item => {
              if (suggestedItems.has(item.name.toLowerCase())) {
                return { 
                  ...item, 
                  wearCount: (item.wearCount || 0) + 1,
                  lastWorn: new Date().toISOString()
                };
              }
              return item;
            });
          });
          return updated;
        });
      }
      
      setResults(data);
      setStep('results');
    } catch (err) {
      setError(err.message || 'Failed to generate outfits. Please try again.');
    }
  };

  const handleToggleFavorite = (outfitId) => {
    setFavorites(prev => {
      if (prev.includes(outfitId)) {
        return prev.filter(id => id !== outfitId);
      } else {
        return [...prev, outfitId];
      }
    });
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'tops': return <Shirt className="w-5 h-5" />;
      case 'bottoms': return <Shirt className="w-5 h-5 rotate-180" />;
      case 'dresses': return <Shirt className="w-5 h-5" />;
      case 'outerwear': return <Wind className="w-5 h-5" />;
      case 'shoes': return <Shirt className="w-5 h-5" />;
      default: return <Shirt className="w-5 h-5" />;
    }
  };

  const getWeatherIcon = (weatherType) => {
    switch (weatherType?.toLowerCase()) {
      case 'hot': return <Sun className="w-5 h-5 text-orange-500" />;
      case 'warm': return <Sun className="w-5 h-5 text-yellow-500" />;
      case 'cool': return <Cloud className="w-5 h-5 text-blue-400" />;
      case 'cold': return <Snowflake className="w-5 h-5 text-blue-600" />;
      case 'rainy': return <Droplets className="w-5 h-5 text-blue-500" />;
      default: return <Cloud className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className={`${c.card} border rounded-xl shadow-lg p-6 transition-colors duration-200`}>
        <div className="flex items-center gap-3 mb-4">
          <div>
            <h2 className={`text-2xl font-bold ${c.text}`}>Wardrobe Chaos Resolver 👗👔</h2>
            <p className={`text-sm ${c.textMuted}`}>No more decision fatigue - let AI pick your outfit</p>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-2">
          <div className={`flex-1 h-2 rounded ${step === 'wardrobe' ? 'bg-emerald-600' : isDark ? 'bg-zinc-700' : 'bg-emerald-200'}`}></div>
          <div className={`flex-1 h-2 rounded ${step === 'needs' ? 'bg-emerald-600' : isDark ? 'bg-zinc-700' : 'bg-emerald-200'}`}></div>
          <div className={`flex-1 h-2 rounded ${step === 'results' ? 'bg-emerald-600' : isDark ? 'bg-zinc-700' : 'bg-emerald-200'}`}></div>
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs">Wardrobe</span>
          <span className="text-xs">Today's Needs</span>
          <span className="text-xs">Outfits</span>
        </div>
      </div>

      {/* Step 1: Wardrobe Builder */}
      {step === 'wardrobe' && (
        <div className="space-y-6">
          
          {/* Wardrobe stats */}
          <div className={`${c.cardAlt} border rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-sm ${c.label}`}>Total Items in Wardrobe</p>
                <p className={`text-3xl font-bold ${c.text}`}>{getTotalItems()}</p>
              </div>
              {getTotalItems() < 5 && (
                <div className={`${c.warning} border px-3 py-2 rounded text-sm`}>
                  Add {5 - getTotalItems()} more items to get started
                </div>
              )}
            </div>

            {/* Laundry stats */}
            {getTotalItems() > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(() => {
                  const stats = getLaundryStats();
                  return (
                    <>
                      <div className={`${c.success} border rounded p-2 text-center`}>
                        <div className="text-2xl">✨</div>
                        <div className={`text-xs font-semibold ${c.text}`}>{stats.clean} Clean</div>
                      </div>
                      <div className={`${c.warning} border rounded p-2 text-center`}>
                        <div className="text-2xl">🧺</div>
                        <div className={`text-xs font-semibold ${c.text}`}>{stats.dirty} Dirty</div>
                      </div>
                      <div className={`${isDark ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-300'} border rounded p-2 text-center`}>
                        <div className="text-2xl">🏪</div>
                        <div className={`text-xs font-semibold ${c.text}`}>{stats.atCleaners} At Cleaner's</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`${c.btnSecondary} px-3 py-2 rounded text-sm flex items-center gap-2`}
              >
                <TrendingUp className="w-4 h-4" />
                {showAnalytics ? 'Hide' : 'Show'} Analytics
              </button>
              
              <button
                onClick={() => setShowPrivacyPanel(!showPrivacyPanel)}
                className={`${c.btnSecondary} px-3 py-2 rounded text-sm flex items-center gap-2`}
              >
                <Save className="w-4 h-4" />
                Privacy & Data
              </button>
            </div>
          </div>

          {/* Analytics Panel */}
          {showAnalytics && getTotalItems() > 0 && (
            <div className={`${c.card} border rounded-xl p-6`}>
              <h3 className={`text-lg font-bold ${c.text} mb-4 flex items-center gap-2`}>
                <TrendingUp className="w-5 h-5" />
                Wardrobe Analytics
              </h3>
              
              {(() => {
                const analytics = getWardrobeAnalytics();
                return (
                  <div className="space-y-4">
                    {/* Versatility score */}
                    <div className={`${c.cardAlt} border rounded-lg p-4`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-semibold ${c.text}`}>Versatility Score</span>
                        <span className={`text-2xl font-bold ${c.text}`}>{analytics.versatilityScore}%</span>
                      </div>
                      <p className={`text-xs ${c.textMuted}`}>
                        {analytics.versatilePieces} out of {analytics.totalItems} items are versatile basics
                      </p>
                    </div>

                    {/* Most worn */}
                    {analytics.mostWorn.length > 0 && (
                      <div>
                        <h4 className={`font-semibold ${c.text} mb-2`}>Most Worn Items</h4>
                        <div className="space-y-2">
                          {analytics.mostWorn.map(item => (
                            <div key={item.id} className={`${c.cardAlt} border rounded p-2 flex items-center justify-between`}>
                              <span className={`text-sm ${c.text}`}>{item.name}</span>
                              <span className={`text-xs ${c.textMuted}`}>Worn {item.wearCount || 0} times</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Never worn */}
                    {analytics.neverWorn.length > 0 && (
                      <div>
                        <h4 className={`font-semibold ${c.text} mb-2`}>Never Worn ({analytics.neverWorn.length} items)</h4>
                        <p className={`text-sm ${c.textMuted} mb-2`}>
                          Consider donating these if you haven't worn them in 6+ months
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {analytics.neverWorn.slice(0, 5).map(item => (
                            <span key={item.id} className={`text-xs ${c.btnSecondary} px-2 py-1 rounded`}>
                              {item.name}
                            </span>
                          ))}
                          {analytics.neverWorn.length > 5 && (
                            <span className={`text-xs ${c.textMuted}`}>
                              +{analytics.neverWorn.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Top colors */}
                    {analytics.topColors.length > 0 && (
                      <div>
                        <h4 className={`font-semibold ${c.text} mb-2`}>Your Color Palette</h4>
                        <div className="flex flex-wrap gap-2">
                          {analytics.topColors.map(({ color, count }) => (
                            <div key={color} className={`${c.cardAlt} border rounded px-3 py-2`}>
                              <span className={`text-sm ${c.text} capitalize`}>{color}</span>
                              <span className={`text-xs ${c.textMuted} ml-2`}>({count})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Wardrobe gaps */}
                    {analytics.gaps.length > 0 && (
                      <div className={`${c.warning} border-l-4 rounded-r-lg p-4`}>
                        <h4 className={`font-semibold mb-2 ${c.text}`}>Wardrobe Gaps - What to Add</h4>
                        <ul className={`text-sm ${c.text} space-y-1`}>
                          {analytics.gaps.map((gap, idx) => (
                            <li key={idx}>• {gap}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Privacy Panel */}
          {showPrivacyPanel && (
            <div className={`${c.card} border-2 ${isDark ? 'border-emerald-500' : 'border-emerald-600'} rounded-xl p-6`}>
              <h3 className={`text-lg font-bold ${c.text} mb-2 flex items-center gap-2`}>
                <Save className="w-5 h-5" />
                Privacy & Data Management
              </h3>
              
              <div className={`${isDark ? 'bg-emerald-900/20 border-emerald-700' : 'bg-emerald-50 border-emerald-300'} border-l-4 rounded-r-lg p-4 mb-4`}>
                <p className={`text-sm ${c.text} font-semibold mb-2`}>🔒 Your Data is Private</p>
                <ul className={`text-sm ${c.textSecondary} space-y-1`}>
                  <li>• All wardrobe data stored locally on your device only</li>
                  <li>• Photos never uploaded to cloud servers</li>
                  <li>• No account required, no tracking</li>
                  <li>• You have full control to export or delete anytime</li>
                </ul>
              </div>

              {/* Storage usage */}
              {(() => {
                const storage = getStorageUsage();
                return (
                  <>
                    {storage.sizeKB > 0 && (
                      <div className={`${storage.isNearLimit ? c.warning : c.cardAlt} border rounded-lg p-4 mb-4`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-semibold ${c.text}`}>Storage Used</span>
                          <span className={`text-sm ${c.textMuted}`}>{storage.sizeKB} KB</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className={`h-2 rounded-full ${storage.isNearLimit ? 'bg-amber-500' : 'bg-emerald-600'}`}
                            style={{ width: `${Math.min(storage.percentUsed, 100)}%` }}
                          ></div>
                        </div>
                        <p className={`text-xs ${c.textMuted}`}>
                          {storage.itemsWithPhotos} items with photos
                        </p>
                        {storage.isNearLimit && (
                          <div className="mt-2">
                            <p className={`text-sm ${c.text} font-semibold mb-2`}>⚠️ Storage almost full!</p>
                            <button
                              onClick={handleRemoveAllPhotos}
                              className={`text-sm ${c.btnSecondary} px-3 py-2 rounded`}
                            >
                              Remove All Photos to Free Space
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}

              <div className="space-y-3">
                <button
                  onClick={handleExportData}
                  className={`w-full ${c.btnPrimary} py-3 rounded font-semibold flex items-center justify-center gap-2`}
                >
                  <Save className="w-5 h-5" />
                  Export Wardrobe Data (Backup)
                </button>

                <div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                    id="import-wardrobe"
                  />
                  <label
                    htmlFor="import-wardrobe"
                    className={`block w-full ${c.btnSecondary} py-3 rounded font-semibold flex items-center justify-center gap-2 cursor-pointer`}
                  >
                    <Upload className="w-5 h-5" />
                    Import Wardrobe Data
                  </label>
                </div>

                <button
                  onClick={handleClearAllData}
                  className={`w-full ${c.btnDanger} py-3 rounded font-semibold flex items-center justify-center gap-2`}
                >
                  <Trash2 className="w-5 h-5" />
                  Delete All Data
                </button>
              </div>
            </div>
          )}

          {/* Category tabs */}
          <div className={`${c.card} border rounded-xl p-6`}>
            <div className="flex gap-2 mb-6 flex-wrap">
              {Object.keys(wardrobe).map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    selectedCategory === category
                      ? c.btnPrimary
                      : c.btnSecondary
                  }`}
                >
                  {getCategoryIcon(category)}
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                  <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                    selectedCategory === category
                      ? 'bg-white/20'
                      : isDark ? 'bg-zinc-600' : 'bg-emerald-200'
                  }`}>
                    {wardrobe[category].length}
                  </span>
                </button>
              ))}
            </div>

            {/* Items in category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {wardrobe[selectedCategory].map(item => (
                <div key={item.id} className={`${c.cardAlt} border rounded-lg p-4 ${item.laundryStatus === 'dirty' ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-semibold ${c.text}`}>{item.name}</h4>
                        {item.color && (
                          <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-zinc-700' : 'bg-emerald-100'}`}>
                            {item.color}
                          </span>
                        )}
                      </div>
                      {item.style && (
                        <p className={`text-sm ${c.textMuted}`}>Style: {item.style}</p>
                      )}
                      {item.wearCount > 0 && (
                        <p className={`text-xs ${c.textMuted}`}>Worn {item.wearCount} times</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleToggleLaundryStatus(selectedCategory, item.id)}
                        className={`p-2 rounded hover:bg-opacity-80 transition-colors text-xl ${
                          item.laundryStatus === 'dirty' 
                            ? isDark ? 'bg-amber-900/30' : 'bg-amber-100'
                            : item.laundryStatus === 'at-cleaners'
                            ? isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                            : isDark ? 'bg-emerald-900/30' : 'bg-emerald-100'
                        }`}
                        title={`Status: ${item.laundryStatus || 'clean'}`}
                      >
                        {getLaundryStatusIcon(item.laundryStatus || 'clean')}
                      </button>
                      <button
                        onClick={() => handleDeleteItem(selectedCategory, item.id)}
                        className={`p-2 rounded hover:bg-red-500 hover:text-white transition-colors`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {item.imagePreview && (
                    <img
                      src={item.imagePreview}
                      alt={item.name}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  )}
                  
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">Comfort: {item.comfortLevel}/10</span>
                  </div>
                  
                  {item.sensoryNotes && (
                    <p className={`text-xs ${c.textMuted} mt-2`}>
                      Note: {item.sensoryNotes}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Add item button */}
            {!showAddItem && (
              <button
                onClick={() => setShowAddItem(true)}
                className={`w-full ${c.btnSecondary} py-3 rounded-lg font-medium flex items-center justify-center gap-2`}
              >
                <Plus className="w-5 h-5" />
                Add Item to {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
              </button>
            )}

            {/* Add item form */}
            {showAddItem && (
              <div className={`${isDark ? 'bg-zinc-900' : 'bg-emerald-50'} border-2 ${isDark ? 'border-zinc-700' : 'border-emerald-300'} rounded-lg p-6`}>
                <h4 className={`font-bold ${c.text} mb-4`}>Add New Item</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${c.label} mb-2`}>
                      Item Name *
                    </label>
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Navy blue t-shirt"
                      className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${c.label} mb-2`}>
                        Color
                      </label>
                      <input
                        type="text"
                        value={newItem.color}
                        onChange={(e) => setNewItem(prev => ({ ...prev, color: e.target.value }))}
                        placeholder="e.g., Navy blue"
                        className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2`}
                      />
                    </div>

                    <div>
                      <label className={`block text-sm font-medium ${c.label} mb-2`}>
                        Style
                      </label>
                      <input
                        type="text"
                        value={newItem.style}
                        onChange={(e) => setNewItem(prev => ({ ...prev, style: e.target.value }))}
                        placeholder="e.g., Casual, Formal"
                        className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${c.label} mb-2`}>
                      Comfort Level: {newItem.comfortLevel}/10
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={newItem.comfortLevel}
                      onChange={(e) => setNewItem(prev => ({ ...prev, comfortLevel: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs mt-1">
                      <span>Uncomfortable</span>
                      <span>Very Comfortable</span>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${c.label} mb-2`}>
                      Sensory Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={newItem.sensoryNotes}
                      onChange={(e) => setNewItem(prev => ({ ...prev, sensoryNotes: e.target.value }))}
                      placeholder="e.g., Soft fabric, no tags, loose fit"
                      className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium ${c.label} mb-2`}>
                      Photo (Optional)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className={`${c.btnSecondary} px-4 py-2 rounded flex items-center gap-2`}
                    >
                      <Camera className="w-4 h-4" />
                      Upload Photo
                    </button>
                    {newItem.imagePreview && (
                      <div className="mt-2 relative">
                        <img
                          src={newItem.imagePreview}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded"
                        />
                        <button
                          onClick={() => setNewItem(prev => ({ ...prev, imagePreview: null }))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <p className={`text-xs ${c.textMuted} mt-1`}>
                      ⚠️ Photos use storage space. Skip photos if experiencing storage issues.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleAddItem}
                      className={`flex-1 ${c.btnPrimary} py-3 rounded font-semibold flex items-center justify-center gap-2`}
                    >
                      <Check className="w-5 h-5" />
                      Add Item
                    </button>
                    <button
                      onClick={() => {
                        setShowAddItem(false);
                        setNewItem({
                          name: '',
                          color: '',
                          style: '',
                          comfortLevel: 5,
                          imagePreview: null,
                          sensoryNotes: ''
                        });
                      }}
                      className={`${c.btnSecondary} px-6 py-3 rounded font-semibold`}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Continue button */}
          <button
            onClick={() => setStep('needs')}
            disabled={getTotalItems() < 5}
            className={`w-full ${c.btnPrimary} py-4 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            Continue to Today's Needs
            <Sparkles className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Step 2: Daily Needs */}
      {step === 'needs' && (
        <div className={`${c.card} border rounded-xl shadow-lg p-6 space-y-6`}>
          
          <button
            onClick={() => setStep('wardrobe')}
            className={`${c.btnSecondary} px-4 py-2 rounded text-sm`}
          >
            ← Back to Wardrobe
          </button>

          <h3 className={`text-xl font-bold ${c.text}`}>What's Your Day Like?</h3>

          {/* Weather */}
          <div>
            <label className={`block text-sm font-medium ${c.label} mb-2`}>
              🌤️ Weather Today *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {['Hot', 'Warm', 'Cool', 'Cold', 'Rainy'].map(w => (
                <button
                  key={w}
                  onClick={() => setWeather(w)}
                  className={`p-3 rounded-lg border-2 font-medium transition-colors flex items-center justify-center gap-2 ${
                    weather === w
                      ? isDark ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-emerald-600 border-emerald-600 text-white'
                      : isDark ? 'border-zinc-700 hover:border-emerald-500' : 'border-emerald-200 hover:border-emerald-400'
                  }`}
                >
                  {getWeatherIcon(w)}
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Activities */}
          <div>
            <label className={`block text-sm font-medium ${c.label} mb-2`}>
              📅 Activities Today * (Select all that apply)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.keys(activities).map(activity => (
                <label
                  key={activity}
                  className={`p-3 rounded-lg border-2 font-medium cursor-pointer transition-colors ${
                    activities[activity]
                      ? isDark ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-emerald-600 border-emerald-600 text-white'
                      : isDark ? 'border-zinc-700 hover:border-emerald-500' : 'border-emerald-200 hover:border-emerald-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={activities[activity]}
                    onChange={(e) => setActivities(prev => ({ ...prev, [activity]: e.target.checked }))}
                    className="sr-only"
                  />
                  {activity.charAt(0).toUpperCase() + activity.slice(1)}
                </label>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div>
            <label className={`block text-sm font-medium ${c.label} mb-2`}>
              💭 How do you want to feel today? *
            </label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2`}
            >
              <option value="">Select mood...</option>
              <option value="confident">Confident & Powerful</option>
              <option value="comfortable">Comfortable & Relaxed</option>
              <option value="creative">Creative & Expressive</option>
              <option value="professional">Professional & Put-Together</option>
              <option value="cozy">Cozy & Safe</option>
            </select>
          </div>

          {/* Comfort vs Style slider */}
          <div>
            <label className={`block text-sm font-medium ${c.label} mb-2`}>
              ⚖️ Priority Today: {comfortPriority <= 3 ? 'Style First' : comfortPriority <= 7 ? 'Balanced' : 'Comfort First'}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={comfortPriority}
              onChange={(e) => setComfortPriority(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs mt-1">
              <span>👗 Style Priority</span>
              <span>😌 Comfort Priority</span>
            </div>
          </div>

          {/* Sensory needs */}
          <div>
            <label className={`block text-sm font-medium ${c.label} mb-3`}>
              🧠 Sensory Preferences (Optional)
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sensoryNeeds.softFabrics}
                  onChange={(e) => setSensoryNeeds(prev => ({ ...prev, softFabrics: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <span className={c.text}>Only soft, non-scratchy fabrics</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sensoryNeeds.looseFit}
                  onChange={(e) => setSensoryNeeds(prev => ({ ...prev, looseFit: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <span className={c.text}>Loose, non-restrictive fit</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sensoryNeeds.noTags}
                  onChange={(e) => setSensoryNeeds(prev => ({ ...prev, noTags: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <span className={c.text}>No tags or seams</span>
              </label>
              
              <input
                type="text"
                value={sensoryNeeds.avoidTextures}
                onChange={(e) => setSensoryNeeds(prev => ({ ...prev, avoidTextures: e.target.value }))}
                placeholder="Textures to avoid (e.g., wool, denim)"
                className={`w-full p-3 border rounded-lg ${c.input} outline-none focus:ring-2 mt-2`}
              />
            </div>
          </div>

          {/* Laundry filter */}
          <div className={`${c.cardAlt} border-l-4 ${isDark ? 'border-emerald-500' : 'border-emerald-600'} rounded-r-lg p-4`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyCleanItems}
                onChange={(e) => setOnlyCleanItems(e.target.checked)}
                className="w-5 h-5 rounded mt-0.5"
              />
              <div>
                <span className={`font-semibold ${c.text}`}>Only suggest clean items ✨</span>
                <p className={`text-xs ${c.textMuted} mt-1`}>
                  {(() => {
                    const stats = getLaundryStats();
                    return `You have ${stats.clean} clean items available. Uncheck to include dirty items.`;
                  })()}
                </p>
              </div>
            </label>
          </div>

          {error && (
            <div className={`${isDark ? 'bg-red-900/20 border-red-700 text-red-200' : 'bg-red-50 border-red-300 text-red-800'} border rounded-lg p-4 flex items-start gap-3`}>
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Generate button */}
          <button
            onClick={handleGenerateOutfits}
            disabled={loading}
            className={`w-full ${c.btnPrimary} py-4 rounded-lg font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating Your Outfits...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Outfit Suggestions
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 'results' && results && (
        <div className="space-y-6">
          
          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('needs')}
              className={`${c.btnSecondary} px-4 py-2 rounded text-sm`}
            >
              ← Adjust Settings
            </button>
            
            <button
              onClick={() => {
                setStep('wardrobe');
                setResults(null);
              }}
              className={`${c.btnSecondary} px-4 py-2 rounded text-sm`}
            >
              Start Over
            </button>
          </div>

          {/* Outfit combinations */}
          {results.outfit_combinations && results.outfit_combinations.length > 0 && (
            <div className="space-y-4">
              <h3 className={`text-xl font-bold ${c.text}`}>Your Perfect Outfits for Today</h3>
              
              {results.outfit_combinations.map((outfit, idx) => (
                <div
                  key={outfit.outfit_id || idx}
                  className={`${c.card} border-2 rounded-xl p-6 ${
                    favorites.includes(outfit.outfit_id) ? 'border-yellow-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h4 className={`text-lg font-bold ${c.text}`}>
                      Outfit #{idx + 1}
                    </h4>
                    <button
                      onClick={() => handleToggleFavorite(outfit.outfit_id)}
                      className={`p-2 rounded transition-colors ${
                        favorites.includes(outfit.outfit_id)
                          ? 'text-yellow-500'
                          : isDark ? 'text-zinc-400 hover:text-yellow-500' : 'text-emerald-400 hover:text-yellow-500'
                      }`}
                    >
                      <Star className={`w-6 h-6 ${favorites.includes(outfit.outfit_id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Outfit items */}
                  <div className={`${c.cardAlt} border rounded-lg p-4 mb-4`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(outfit.items).map(([piece, item]) => (
                        item && (
                          <div key={piece} className="flex items-center gap-2">
                            <span className="font-semibold capitalize">{piece}:</span>
                            <span className={c.textSecondary}>{item}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>

                  {/* Why this works */}
                  <p className={`text-sm ${c.text} mb-4`}>
                    <strong>Why this works:</strong> {outfit.why_this_works}
                  </p>

                  {/* Ratings */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className={`${c.cardAlt} border rounded p-3`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Heart className="w-4 h-4" />
                        <span className="text-xs font-semibold">Comfort</span>
                      </div>
                      <div className={`text-2xl font-bold ${c.text}`}>{outfit.comfort_rating}/10</div>
                    </div>
                    
                    <div className={`${c.cardAlt} border rounded p-3`}>
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-semibold">Style</span>
                      </div>
                      <div className={`text-2xl font-bold ${c.text}`}>{outfit.style_rating}/10</div>
                    </div>
                    
                    {outfit.sensory_friendly && (
                      <div className={`${c.success} border rounded p-3`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Check className="w-4 h-4" />
                          <span className="text-xs font-semibold">Sensory-Friendly</span>
                        </div>
                        <div className="text-lg font-bold">Yes!</div>
                      </div>
                    )}
                    
                    {outfit.weather_appropriate && (
                      <div className={`${c.success} border rounded p-3`}>
                        <div className="flex items-center gap-2 mb-1">
                          {getWeatherIcon(weather)}
                          <span className="text-xs font-semibold">Weather OK</span>
                        </div>
                        <div className="text-lg font-bold">Perfect</div>
                      </div>
                    )}
                  </div>

                  {/* Confidence boost */}
                  {outfit.confidence_boost && (
                    <div className={`${isDark ? 'bg-purple-900/20 border-purple-700' : 'bg-purple-50 border-purple-300'} border-l-4 rounded-r-lg p-4 mb-3`}>
                      <p className={`text-sm ${isDark ? 'text-purple-200' : 'text-purple-900'} flex items-center gap-2`}>
                        <Zap className="w-4 h-4" />
                        <strong>Confidence Boost:</strong> {outfit.confidence_boost}
                      </p>
                    </div>
                  )}

                  {/* Color coordination */}
                  {outfit.color_coordination && (
                    <div className={`${isDark ? 'bg-emerald-900/20 border-emerald-700' : 'bg-emerald-50 border-emerald-300'} border-l-4 rounded-r-lg p-4`}>
                      <p className={`text-sm ${isDark ? 'text-emerald-200' : 'text-emerald-900'} flex items-center gap-2`}>
                        <Sparkles className="w-4 h-4" />
                        <strong>Color Match:</strong> {outfit.color_coordination}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Getting dressed tips */}
          {results.getting_dressed_tips && results.getting_dressed_tips.length > 0 && (
            <div className={`${c.cardAlt} border-l-4 ${isDark ? 'border-emerald-500' : 'border-emerald-600'} rounded-r-lg p-5`}>
              <h4 className={`font-bold ${c.text} mb-3 flex items-center gap-2`}>
                <Sparkles className="w-5 h-5" />
                Tips for Low-Energy Days
              </h4>
              <ul className={`text-sm ${c.text} space-y-2`}>
                {results.getting_dressed_tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span>•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Backup option */}
          {results.backup_option && (
            <div className={`${c.warning} border rounded-lg p-5`}>
              <h4 className={`font-bold mb-2 flex items-center gap-2 ${c.text}`}>
                <Battery className="w-5 h-5" />
                Feeling Overwhelmed? Try This Simple Option:
              </h4>
              <p className={`text-sm ${c.text}`}>{results.backup_option}</p>
            </div>
          )}

          {/* Capsule wardrobe suggestions */}
          {results.capsule_wardrobe_suggestions && results.capsule_wardrobe_suggestions.length > 0 && (
            <div className={`${isDark ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-300'} border-l-4 rounded-r-lg p-5`}>
              <h4 className={`font-bold mb-3 flex items-center gap-2 ${c.text}`}>
                <ShoppingBag className="w-5 h-5" />
                Wardrobe Gap Analysis - Consider Adding:
              </h4>
              <ul className={`text-sm ${c.text} space-y-2`}>
                {results.capsule_wardrobe_suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span>•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
              <p className={`text-xs ${c.textMuted} mt-3`}>
                These versatile pieces would multiply your outfit options and fill gaps in your current wardrobe.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WardrobeChaosHelper;
