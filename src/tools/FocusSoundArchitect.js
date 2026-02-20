import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Loader2, AlertCircle, Play, Volume2, VolumeX,
  Headphones, RefreshCw, ChevronDown, Lightbulb, Sparkles,
  Square
} from 'lucide-react';
import { useClaudeAPI } from '../hooks/useClaudeAPI';
import { useTheme } from '../hooks/useTheme';
import { getToolById } from '../data/tools';

// ════════════════════════════════════════════════════════════
// WEB AUDIO SYNTHESIS ENGINE
// ════════════════════════════════════════════════════════════

const BUFFER_SECONDS = 4;

// ── Noise buffer generators ──

function generateWhiteNoise(length) {
  const data = new Float32Array(length);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return data;
}

function generatePinkNoise(length) {
  const data = new Float32Array(length);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return data;
}

function generateBrownNoise(length) {
  const data = new Float32Array(length);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + (0.02 * white)) / 1.02;
    data[i] = last * 3.5;
  }
  return data;
}

// ── Layer creators ──
// Each returns { connect(destination), setVolume(0-1), stop() }

function createNoiseLayer(ctx, noiseGenerator, filterOptions, initialGain = 0) {
  const sr = ctx.sampleRate;
  const bufferSize = sr * BUFFER_SECONDS;
  const buffer = ctx.createBuffer(2, bufferSize, sr);
  const dataL = noiseGenerator(bufferSize);
  const dataR = noiseGenerator(bufferSize);
  buffer.copyToChannel(dataL, 0);
  buffer.copyToChannel(dataR, 1);

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const gain = ctx.createGain();
  gain.gain.value = initialGain;

  let lastNode = source;

  if (filterOptions) {
    const filter = ctx.createBiquadFilter();
    filter.type = filterOptions.type || 'lowpass';
    filter.frequency.value = filterOptions.frequency || 1000;
    if (filterOptions.Q) filter.Q.value = filterOptions.Q;
    lastNode.connect(filter);
    lastNode = filter;
  }

  lastNode.connect(gain);
  source.start(0);

  return {
    connect: (dest) => gain.connect(dest),
    setVolume: (v) => { gain.gain.value = v; },
    setVolumeSmooth: (v) => {
      gain.gain.cancelScheduledValues(ctx.currentTime);
      gain.gain.setTargetAtTime(v, ctx.currentTime, 0.08);
    },
    stop: () => { try { source.stop(); source.disconnect(); gain.disconnect(); } catch(e) {} },
  };
}

function createRainLayer(ctx) {
  const drops = createNoiseLayer(ctx, generateBrownNoise, { type: 'highpass', frequency: 800, Q: 0.5 }, 1);
  const patter = createNoiseLayer(ctx, generateWhiteNoise, { type: 'bandpass', frequency: 2500, Q: 1.5 }, 1);
  const rumble = createNoiseLayer(ctx, generateBrownNoise, { type: 'lowpass', frequency: 300 }, 1);

  // Mix node
  const gain = ctx.createGain();
  gain.gain.value = 0;

  const dropsGain = ctx.createGain(); dropsGain.gain.value = 0.5;
  const patterGain = ctx.createGain(); patterGain.gain.value = 0.3;
  const rumbleGain = ctx.createGain(); rumbleGain.gain.value = 0.2;

  drops.connect(dropsGain); dropsGain.connect(gain);
  patter.connect(patterGain); patterGain.connect(gain);
  rumble.connect(rumbleGain); rumbleGain.connect(gain);

  return {
    connect: (dest) => gain.connect(dest),
    setVolume: (v) => { gain.gain.value = v; },
    setVolumeSmooth: (v) => {
      gain.gain.cancelScheduledValues(0);
      gain.gain.setTargetAtTime(v, ctx.currentTime, 0.08);
    },
    stop: () => { drops.stop(); patter.stop(); rumble.stop(); try { gain.disconnect(); } catch(e) {} },
  };
}

function createOceanLayer(ctx) {
  const base = createNoiseLayer(ctx, generateBrownNoise, { type: 'lowpass', frequency: 600 }, 1);
  const wash = createNoiseLayer(ctx, generatePinkNoise, { type: 'bandpass', frequency: 1200, Q: 0.8 }, 1);

  const gain = ctx.createGain();
  gain.gain.value = 0;

  // LFO for wave rhythm
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.08; // ~every 12 seconds
  lfo.type = 'sine';
  lfoGain.gain.value = 0.3;
  lfo.connect(lfoGain);

  const baseGain = ctx.createGain();
  baseGain.gain.value = 0.6;
  lfoGain.connect(baseGain.gain); // modulate base amplitude
  base.connect(baseGain);
  baseGain.connect(gain);

  const washGain = ctx.createGain();
  washGain.gain.value = 0.15;
  wash.connect(washGain);
  washGain.connect(gain);

  lfo.start(0);

  return {
    connect: (dest) => gain.connect(dest),
    setVolume: (v) => { gain.gain.value = v; },
    setVolumeSmooth: (v) => {
      gain.gain.cancelScheduledValues(0);
      gain.gain.setTargetAtTime(v, ctx.currentTime, 0.08);
    },
    stop: () => { base.stop(); wash.stop(); try { lfo.stop(); gain.disconnect(); } catch(e) {} },
  };
}

function createWindLayer(ctx) {
  const noise = createNoiseLayer(ctx, generatePinkNoise, { type: 'bandpass', frequency: 500, Q: 1.2 }, 1);

  const gain = ctx.createGain();
  gain.gain.value = 0;

  // Slow modulation
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.12;
  lfo.type = 'sine';
  lfoGain.gain.value = 0.25;
  lfo.connect(lfoGain);

  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.5;
  lfoGain.connect(noiseGain.gain);
  noise.connect(noiseGain);
  noiseGain.connect(gain);

  lfo.start(0);

  return {
    connect: (dest) => gain.connect(dest),
    setVolume: (v) => { gain.gain.value = v; },
    setVolumeSmooth: (v) => {
      gain.gain.cancelScheduledValues(0);
      gain.gain.setTargetAtTime(v, ctx.currentTime, 0.08);
    },
    stop: () => { noise.stop(); try { lfo.stop(); gain.disconnect(); } catch(e) {} },
  };
}

function createForestLayer(ctx) {
  const wind = createNoiseLayer(ctx, generatePinkNoise, { type: 'bandpass', frequency: 600, Q: 1.5 }, 1);
  const chirps = createNoiseLayer(ctx, generateWhiteNoise, { type: 'highpass', frequency: 3500 }, 1);

  const gain = ctx.createGain();
  gain.gain.value = 0;

  const windGain = ctx.createGain(); windGain.gain.value = 0.4;
  const chirpGain = ctx.createGain(); chirpGain.gain.value = 0.08;

  // Modulate chirps for organic feel
  const chirpLfo = ctx.createOscillator();
  const chirpLfoGain = ctx.createGain();
  chirpLfo.frequency.value = 0.3;
  chirpLfo.type = 'sine';
  chirpLfoGain.gain.value = 0.06;
  chirpLfo.connect(chirpLfoGain);
  chirpLfoGain.connect(chirpGain.gain);
  chirpLfo.start(0);

  wind.connect(windGain); windGain.connect(gain);
  chirps.connect(chirpGain); chirpGain.connect(gain);

  return {
    connect: (dest) => gain.connect(dest),
    setVolume: (v) => { gain.gain.value = v; },
    setVolumeSmooth: (v) => {
      gain.gain.cancelScheduledValues(0);
      gain.gain.setTargetAtTime(v, ctx.currentTime, 0.08);
    },
    stop: () => { wind.stop(); chirps.stop(); try { chirpLfo.stop(); gain.disconnect(); } catch(e) {} },
  };
}

function createFireLayer(ctx) {
  const warmth = createNoiseLayer(ctx, generateBrownNoise, { type: 'lowpass', frequency: 400 }, 1);
  const crackle = createNoiseLayer(ctx, generateWhiteNoise, { type: 'highpass', frequency: 4000 }, 1);

  const gain = ctx.createGain();
  gain.gain.value = 0;

  const warmGain = ctx.createGain(); warmGain.gain.value = 0.4;
  const crackleGain = ctx.createGain(); crackleGain.gain.value = 0.05;

  // Random crackle modulation
  const crackleLfo = ctx.createOscillator();
  const crackleLfoGain = ctx.createGain();
  crackleLfo.frequency.value = 2.5;
  crackleLfo.type = 'sawtooth';
  crackleLfoGain.gain.value = 0.04;
  crackleLfo.connect(crackleLfoGain);
  crackleLfoGain.connect(crackleGain.gain);
  crackleLfo.start(0);

  warmth.connect(warmGain); warmGain.connect(gain);
  crackle.connect(crackleGain); crackleGain.connect(gain);

  return {
    connect: (dest) => gain.connect(dest),
    setVolume: (v) => { gain.gain.value = v; },
    setVolumeSmooth: (v) => {
      gain.gain.cancelScheduledValues(0);
      gain.gain.setTargetAtTime(v, ctx.currentTime, 0.08);
    },
    stop: () => { warmth.stop(); crackle.stop(); try { crackleLfo.stop(); gain.disconnect(); } catch(e) {} },
  };
}

function createCafeLayer(ctx) {
  const murmur = createNoiseLayer(ctx, generatePinkNoise, { type: 'bandpass', frequency: 800, Q: 0.6 }, 1);
  const clinks = createNoiseLayer(ctx, generateWhiteNoise, { type: 'bandpass', frequency: 3000, Q: 3 }, 1);

  const gain = ctx.createGain();
  gain.gain.value = 0;

  const murmurGain = ctx.createGain(); murmurGain.gain.value = 0.5;
  const clinkGain = ctx.createGain(); clinkGain.gain.value = 0.03;

  const clinkLfo = ctx.createOscillator();
  const clinkLfoGain = ctx.createGain();
  clinkLfo.frequency.value = 0.4;
  clinkLfo.type = 'sine';
  clinkLfoGain.gain.value = 0.02;
  clinkLfo.connect(clinkLfoGain);
  clinkLfoGain.connect(clinkGain.gain);
  clinkLfo.start(0);

  murmur.connect(murmurGain); murmurGain.connect(gain);
  clinks.connect(clinkGain); clinkGain.connect(gain);

  return {
    connect: (dest) => gain.connect(dest),
    setVolume: (v) => { gain.gain.value = v; },
    setVolumeSmooth: (v) => {
      gain.gain.cancelScheduledValues(0);
      gain.gain.setTargetAtTime(v, ctx.currentTime, 0.08);
    },
    stop: () => { murmur.stop(); clinks.stop(); try { clinkLfo.stop(); gain.disconnect(); } catch(e) {} },
  };
}

function createBinauralLayer(ctx, hz = 10, baseHz = 200) {
  const gain = ctx.createGain();
  gain.gain.value = 0;

  // Left ear
  const oscL = ctx.createOscillator();
  oscL.type = 'sine';
  oscL.frequency.value = baseHz;
  const panL = ctx.createStereoPanner();
  panL.pan.value = -1;
  oscL.connect(panL);
  panL.connect(gain);

  // Right ear
  const oscR = ctx.createOscillator();
  oscR.type = 'sine';
  oscR.frequency.value = baseHz + hz;
  const panR = ctx.createStereoPanner();
  panR.pan.value = 1;
  oscR.connect(panR);
  panR.connect(gain);

  oscL.start(0);
  oscR.start(0);

  return {
    connect: (dest) => gain.connect(dest),
    setVolume: (v) => { gain.gain.value = v; },
    setVolumeSmooth: (v) => {
      gain.gain.cancelScheduledValues(0);
      gain.gain.setTargetAtTime(v, ctx.currentTime, 0.08);
    },
    stop: () => { try { oscL.stop(); oscR.stop(); gain.disconnect(); } catch(e) {} },
  };
}

// ── Layer factory ──

const LAYER_TYPES = {
  white_noise: { label: 'White Noise', emoji: '📻', create: (ctx) => createNoiseLayer(ctx, generateWhiteNoise) },
  pink_noise:  { label: 'Pink Noise',  emoji: '🌸', create: (ctx) => createNoiseLayer(ctx, generatePinkNoise) },
  brown_noise: { label: 'Brown Noise', emoji: '🟤', create: (ctx) => createNoiseLayer(ctx, generateBrownNoise) },
  rain:        { label: 'Rain',        emoji: '🌧️', create: (ctx) => createRainLayer(ctx) },
  ocean:       { label: 'Ocean Waves', emoji: '🌊', create: (ctx) => createOceanLayer(ctx) },
  wind:        { label: 'Wind',        emoji: '💨', create: (ctx) => createWindLayer(ctx) },
  forest:      { label: 'Forest',      emoji: '🌲', create: (ctx) => createForestLayer(ctx) },
  fire:        { label: 'Fire',        emoji: '🔥', create: (ctx) => createFireLayer(ctx) },
  cafe:        { label: 'Café Murmur', emoji: '☕', create: (ctx) => createCafeLayer(ctx) },
  binaural:    { label: 'Binaural Beats', emoji: '🎧', create: (ctx, p) => createBinauralLayer(ctx, p.hz || 10, p.base_hz || 200) },
};

// ════════════════════════════════════════════════════════════
// PREFERENCE OPTIONS
// ════════════════════════════════════════════════════════════

const TASKS = [
  { id: 'deep_work',  label: 'Deep Work',     emoji: '🧠' },
  { id: 'creative',   label: 'Creative',       emoji: '🎨' },
  { id: 'reading',    label: 'Reading',         emoji: '📖' },
  { id: 'studying',   label: 'Studying',        emoji: '📚' },
  { id: 'tedious',    label: 'Tedious Tasks',   emoji: '📋' },
  { id: 'relaxing',   label: 'Relaxing',        emoji: '🧘' },
  { id: 'sleeping',   label: 'Falling Asleep',  emoji: '😴' },
];

const ENVIRONMENTS = [
  { id: 'noisyOffice', label: 'Noisy Office',  emoji: '🏢' },
  { id: 'quietHome',   label: 'Quiet Home',    emoji: '🏠' },
  { id: 'coffeeShop',  label: 'Coffee Shop',   emoji: '☕' },
  { id: 'openPlan',    label: 'Open Plan',     emoji: '🪑' },
  { id: 'bedroom',     label: 'Bedroom',       emoji: '🛏️' },
  { id: 'library',     label: 'Library',       emoji: '📚' },
  { id: 'commute',     label: 'Commuting',     emoji: '🚇' },
];

const SOUND_PREFS = [
  { id: 'whiteNoise',    label: 'White Noise' },
  { id: 'pinkNoise',     label: 'Pink Noise' },
  { id: 'brownNoise',    label: 'Brown Noise' },
  { id: 'rain',          label: 'Rain' },
  { id: 'ocean',         label: 'Ocean' },
  { id: 'forest',        label: 'Nature / Forest' },
  { id: 'fire',          label: 'Crackling Fire' },
  { id: 'cafe',          label: 'Café Ambience' },
  { id: 'binauralBeats', label: 'Binaural Beats' },
  { id: 'wind',          label: 'Wind' },
];

const SENSITIVITIES = [
  { id: 'suddenSounds',         label: 'Sensitive to sudden sounds' },
  { id: 'highFrequencySensitive', label: 'Sensitive to high frequencies' },
  { id: 'preferConsistency',    label: 'Prefer consistent texture' },
  { id: 'needVariety',          label: 'Need some variation to stay engaged' },
  { id: 'needLowBass',          label: 'Need deep/low bass' },
];

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════

const FocusSoundArchitect = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { callToolEndpoint, loading } = useClaudeAPI();
  const toolData = getToolById('FocusSoundArchitect');

  // ── Form state ──
  const [task, setTask] = useState('deep_work');
  const [environments, setEnvironments] = useState([]);
  const [soundPrefs, setSoundPrefs] = useState(['brownNoise']);
  const [sensitivities, setSensitivities] = useState([]);
  const [energyGoal, setEnergyGoal] = useState(50);

  // ── Results ──
  const [recipe, setRecipe] = useState(null);
  const [error, setError] = useState('');
  const [showTips, setShowTips] = useState(false);

  // ── Audio state ──
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(70);
  const [layerVolumes, setLayerVolumes] = useState({});
  const [isMuted, setIsMuted] = useState(false);

  // ── Audio refs ──
  const ctxRef = useRef(null);
  const masterGainRef = useRef(null);
  const layersRef = useRef([]);  // [{ type, layer, gain }]

  // ── Theme ──
  const c = {
    card: isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-stone-200',
    text: isDark ? 'text-zinc-50' : 'text-gray-900',
    textSec: isDark ? 'text-zinc-300' : 'text-gray-600',
    textMuted: isDark ? 'text-zinc-500' : 'text-gray-500',
    input: isDark
      ? 'bg-zinc-700 border-zinc-600 text-zinc-100 placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500/20'
      : 'bg-white border-stone-300 text-gray-900 placeholder:text-stone-400 focus:border-violet-500 focus:ring-violet-500/20',
  };

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      layersRef.current.forEach(l => { try { l.layer.stop(); } catch(e) {} });
      layersRef.current = [];
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        try { ctxRef.current.close(); } catch(e) {}
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ═══════════════════════════════════════
  // AUDIO CONTROLS
  // ═══════════════════════════════════════

  const stopLayers = useCallback(() => {
    layersRef.current.forEach(l => { try { l.layer.stop(); } catch(e) {} });
    layersRef.current = [];
    if (masterGainRef.current) {
      try { masterGainRef.current.disconnect(); } catch(e) {}
      masterGainRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const startAudio = useCallback(async (recipeData) => {
    // Stop any previous layers
    stopLayers();

    // Create or resume AudioContext
    let ctx = ctxRef.current;
    if (!ctx || ctx.state === 'closed') {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
    }
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    // Master gain
    const master = ctx.createGain();
    master.gain.value = masterVolume / 100;
    master.connect(ctx.destination);
    masterGainRef.current = master;

    const layers = [];
    const vols = {};

    (recipeData.layers || []).forEach((layerDef, idx) => {
      const typeDef = LAYER_TYPES[layerDef.type];
      if (!typeDef) return;

      const layer = typeDef.create(ctx, layerDef);
      layer.connect(master);

      const vol = layerDef.volume || 50;
      layer.setVolume(vol / 100);  // Direct value assignment — immediate
      vols[idx] = vol;

      layers.push({ type: layerDef.type, layer, def: layerDef });
    });

    layersRef.current = layers;
    setLayerVolumes(vols);
    setIsPlaying(true);
  }, [masterVolume, stopLayers]);

  const togglePlayPause = useCallback(async () => {
    if (!recipe) return;
    if (isPlaying) {
      stopLayers();
    } else {
      await startAudio(recipe);
    }
  }, [recipe, isPlaying, startAudio, stopLayers]);

  // Master volume change
  useEffect(() => {
    if (masterGainRef.current && ctxRef.current && ctxRef.current.state === 'running') {
      masterGainRef.current.gain.value = (masterVolume / 100) * (isMuted ? 0 : 1);
    }
  }, [masterVolume, isMuted]);

  const handleLayerVolume = (idx, vol) => {
    setLayerVolumes(prev => ({ ...prev, [idx]: vol }));
    const layer = layersRef.current[idx];
    if (layer && layer.layer.setVolumeSmooth) {
      layer.layer.setVolumeSmooth(vol / 100);
    } else if (layer) {
      layer.layer.setVolume(vol / 100);
    }
  };

  // ═══════════════════════════════════════
  // FORM HANDLERS
  // ═══════════════════════════════════════

  const toggleMulti = (arr, setArr, id) => {
    setArr(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleGenerate = async () => {
    setError('');
    stopLayers();

    if (soundPrefs.length === 0) {
      setError('Select at least one sound preference');
      return;
    }

    try {
      const data = await callToolEndpoint('focus-sound-architect', {
        task: TASKS.find(t => t.id === task)?.label || task,
        environment: environments.map(e => ENVIRONMENTS.find(x => x.id === e)?.label || e),
        soundPreferences: soundPrefs.map(s => SOUND_PREFS.find(x => x.id === s)?.label || s),
        sensitivities: sensitivities.map(s => SENSITIVITIES.find(x => x.id === s)?.label || s),
        energyGoal,
      });

      setRecipe(data);
      // Don't auto-play — user must click Play (fresh user gesture required by browser)
    } catch (err) {
      setError(err.message || 'Failed to generate soundscape.');
    }
  };

  const handleReset = () => {
    stopLayers();
    setRecipe(null);
    setTask('deep_work');
    setEnvironments([]);
    setSoundPrefs(['brownNoise']);
    setSensitivities([]);
    setEnergyGoal(50);
    setError('');
    setShowTips(false);
  };

  const energyLabel = energyGoal < 25 ? 'Very Calm' : energyGoal < 50 ? 'Calm' : energyGoal < 75 ? 'Balanced' : 'Energized';

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-5">
        <div>
          <h2 className={`text-2xl font-bold ${c.text}`}>{toolData?.title || 'Focus Sound Architect'} {toolData?.icon || '🎵'}</h2>
          <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>{toolData?.tagline || 'AI-designed soundscapes that actually play'}</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* SETUP (no recipe yet)                               */}
      {/* ═══════════════════════════════════════════════════ */}
      {!recipe && (
        <div className="space-y-4">
          {/* Task (single select) */}
          <div className={`${c.card} border rounded-2xl shadow-lg p-5`}>
            <label className={`block text-sm font-bold ${c.text} mb-1`}>What are you doing?</label>
            <p className={`text-xs ${c.textMuted} mb-3`}>Pick one</p>
            <div className="flex flex-wrap gap-2">
              {TASKS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTask(t.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    task === t.id
                      ? isDark ? 'border-violet-500 bg-violet-900/40 text-violet-300' : 'border-violet-400 bg-violet-50 text-violet-700'
                      : isDark ? 'border-zinc-600 text-zinc-400 hover:border-zinc-500' : 'border-stone-200 text-stone-500 hover:border-stone-400'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    task === t.id
                      ? isDark ? 'border-violet-400' : 'border-violet-500'
                      : isDark ? 'border-zinc-500' : 'border-stone-300'
                  }`}>
                    {task === t.id && <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-violet-400' : 'bg-violet-500'}`} />}
                  </span>
                  <span>{t.emoji}</span> {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Environment */}
          <div className={`${c.card} border rounded-2xl shadow-lg p-5`}>
            <label className={`block text-sm font-bold ${c.text} mb-1`}>Where are you?</label>
            <p className={`text-xs ${c.textMuted} mb-3`}>Helps calibrate masking intensity</p>
            <div className="flex flex-wrap gap-2">
              {ENVIRONMENTS.map(e => (
                <button
                  key={e.id}
                  onClick={() => toggleMulti(environments, setEnvironments, e.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    environments.includes(e.id)
                      ? isDark ? 'border-violet-500 bg-violet-900/40 text-violet-300' : 'border-violet-400 bg-violet-50 text-violet-700'
                      : isDark ? 'border-zinc-600 text-zinc-400 hover:border-zinc-500' : 'border-stone-200 text-stone-500 hover:border-stone-400'
                  }`}
                >
                  <span>{e.emoji}</span> {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sound preferences */}
          <div className={`${c.card} border rounded-2xl shadow-lg p-5`}>
            <label className={`block text-sm font-bold ${c.text} mb-1`}>Sound preferences</label>
            <p className={`text-xs ${c.textMuted} mb-3`}>Select sounds you like — AI will pick the best combination</p>
            <div className="flex flex-wrap gap-2">
              {SOUND_PREFS.map(s => (
                <button
                  key={s.id}
                  onClick={() => toggleMulti(soundPrefs, setSoundPrefs, s.id)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    soundPrefs.includes(s.id)
                      ? isDark ? 'border-violet-500 bg-violet-900/40 text-violet-300' : 'border-violet-400 bg-violet-50 text-violet-700'
                      : isDark ? 'border-zinc-600 text-zinc-400 hover:border-zinc-500' : 'border-stone-200 text-stone-500 hover:border-stone-400'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Energy + Sensitivities */}
          <div className={`${c.card} border rounded-2xl shadow-lg p-5`}>
            <div className="mb-5">
              <label className={`block text-sm font-bold ${c.text} mb-2`}>
                Energy goal: <span className={isDark ? 'text-violet-400' : 'text-violet-600'}>{energyLabel}</span>
              </label>
              <input
                type="range" min="0" max="100" value={energyGoal}
                onChange={e => setEnergyGoal(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-violet-600"
              />
              <div className={`flex justify-between text-[10px] ${c.textMuted} mt-1`}>
                <span>🧘 Very Calm</span><span>⚡ Energized</span>
              </div>
            </div>

            <button
              onClick={() => document.getElementById('fsa-sens').classList.toggle('hidden')}
              className={`flex items-center gap-1.5 text-xs font-bold ${c.textSec}`}
            >
              <ChevronDown className="w-3.5 h-3.5" /> Sensitivities (optional)
            </button>
            <div id="fsa-sens" className="hidden mt-3 flex flex-wrap gap-2">
              {SENSITIVITIES.map(s => (
                <button
                  key={s.id}
                  onClick={() => toggleMulti(sensitivities, setSensitivities, s.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    sensitivities.includes(s.id)
                      ? isDark ? 'border-amber-500 bg-amber-900/30 text-amber-300' : 'border-amber-400 bg-amber-50 text-amber-700'
                      : isDark ? 'border-zinc-600 text-zinc-400 hover:border-zinc-500' : 'border-stone-200 text-stone-500 hover:border-stone-400'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate */}
          <button
            onClick={handleGenerate}
            disabled={loading || soundPrefs.length === 0}
            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-lg transition-all shadow-lg ${
              soundPrefs.length > 0
                ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-200 dark:shadow-violet-900/40'
                : isDark ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Designing your soundscape…</>
            ) : (
              <><Sparkles className="w-5 h-5" /> Design My Soundscape</>
            )}
          </button>

          {error && (
            <div className={`p-4 rounded-xl flex items-start gap-3 ${isDark ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════ */}
      {/* PLAYER + RECIPE                                     */}
      {/* ═══════════════════════════════════════════════════ */}
      {recipe && (
        <div className="space-y-4">

          {/* ── Transport bar ── */}
          <div className={`${c.card} border rounded-2xl shadow-lg p-5 ${!isPlaying ? (isDark ? 'ring-2 ring-violet-500/40' : 'ring-2 ring-violet-300') : ''}`}>
            <div className="flex items-center gap-4 mb-4">
              {/* Play / Stop */}
              <button
                onClick={togglePlayPause}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-all ${
                  isPlaying
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-200 dark:shadow-red-900/40'
                    : 'bg-violet-600 hover:bg-violet-700 shadow-violet-200 dark:shadow-violet-900/40 animate-pulse'
                }`}
              >
                {isPlaying ? <Square className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
              </button>

              <div className="flex-1">
                <h3 className={`text-lg font-bold ${c.text}`}>{recipe.soundscape_name || 'Your Soundscape'}</h3>
                <p className={`text-xs ${c.textSec}`}>
                  {isPlaying ? recipe.description : '▶ Tap play to start your soundscape'}
                </p>
              </div>

              {/* Mute */}
              {isPlaying && (
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-700 text-zinc-400' : 'hover:bg-stone-100 text-stone-500'}`}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              )}
            </div>

            {/* Master volume */}
            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold w-16 ${c.textMuted}`}>Master</span>
              <input
                type="range" min="0" max="100" value={masterVolume}
                onChange={e => setMasterVolume(Number(e.target.value))}
                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer accent-violet-600"
              />
              <span className={`text-xs font-mono w-8 text-right ${c.textMuted}`}>{masterVolume}</span>
            </div>
          </div>

          {/* ── Layer mixer ── */}
          <div className={`${c.card} border rounded-2xl shadow-lg p-5`}>
            <h4 className={`text-sm font-bold ${c.text} mb-4 flex items-center gap-2`}>
              <Headphones className={`w-4 h-4 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
              Layer Mixer
              {recipe.layers?.some(l => l.type === 'binaural') && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-amber-900/30 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>
                  🎧 Use headphones for binaural
                </span>
              )}
            </h4>

            <div className="space-y-4">
              {(recipe.layers || []).map((layerDef, idx) => {
                const typeDef = LAYER_TYPES[layerDef.type];
                if (!typeDef) return null;
                const vol = layerVolumes[idx] ?? layerDef.volume ?? 50;

                return (
                  <div key={idx} className={`p-3 rounded-xl border ${isDark ? 'bg-zinc-700/50 border-zinc-600' : 'bg-stone-50 border-stone-200'}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg">{typeDef.emoji}</span>
                      <div className="flex-1">
                        <span className={`text-sm font-bold ${c.text}`}>{layerDef.label || typeDef.label}</span>
                        {layerDef.type === 'binaural' && layerDef.hz && (
                          <span className={`text-xs ml-2 ${c.textMuted}`}>{layerDef.hz}Hz beat · {layerDef.base_hz || 200}Hz carrier</span>
                        )}
                      </div>
                      <span className={`text-xs font-mono w-8 text-right ${c.textMuted}`}>{vol}</span>
                    </div>

                    <input
                      type="range" min="0" max="100" value={vol}
                      onChange={e => handleLayerVolume(idx, Number(e.target.value))}
                      className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-violet-600"
                    />

                    {layerDef.why && (
                      <p className={`text-xs ${c.textMuted} mt-2 leading-relaxed`}>{layerDef.why}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Tips + Adjustments ── */}
          {(recipe.usage_tips || recipe.adjustment_guide) && (
            <div className={`${c.card} border rounded-2xl shadow-lg p-5`}>
              <button
                onClick={() => setShowTips(!showTips)}
                className={`flex items-center gap-2 w-full text-sm font-bold ${c.text}`}
              >
                <Lightbulb className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                Tips & Adjustments
                <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showTips ? 'rotate-180' : ''}`} />
              </button>

              {showTips && (
                <div className="mt-4 space-y-3">
                  {recipe.usage_tips && recipe.usage_tips.map((tip, i) => (
                    <div key={i} className={`flex items-start gap-2 text-sm ${c.textSec}`}>
                      <span className={isDark ? 'text-violet-400' : 'text-violet-600'}>•</span>
                      <span>{tip}</span>
                    </div>
                  ))}

                  {recipe.adjustment_guide && (
                    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3`}>
                      {recipe.adjustment_guide.if_too_distracting && (
                        <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-zinc-700/50 border-zinc-600' : 'bg-stone-50 border-stone-200'}`}>
                          <span className={`font-bold block mb-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Too distracting?</span>
                          <span className={c.textSec}>{recipe.adjustment_guide.if_too_distracting}</span>
                        </div>
                      )}
                      {recipe.adjustment_guide.if_not_enough && (
                        <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-zinc-700/50 border-zinc-600' : 'bg-stone-50 border-stone-200'}`}>
                          <span className={`font-bold block mb-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Not enough?</span>
                          <span className={c.textSec}>{recipe.adjustment_guide.if_not_enough}</span>
                        </div>
                      )}
                      {recipe.adjustment_guide.after_30_minutes && (
                        <div className={`p-3 rounded-xl border text-xs ${isDark ? 'bg-zinc-700/50 border-zinc-600' : 'bg-stone-50 border-stone-200'}`}>
                          <span className={`font-bold block mb-1 ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>After 30 min</span>
                          <span className={c.textSec}>{recipe.adjustment_guide.after_30_minutes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                isDark ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600' : 'bg-stone-100 text-gray-600 hover:bg-stone-200'
              }`}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Regenerate
            </button>
            <button
              onClick={handleReset}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700' : 'text-gray-500 hover:text-gray-700 hover:bg-stone-100'
              }`}
            >
              Start Over
            </button>
          </div>

          {error && (
            <div className={`p-4 rounded-xl flex items-start gap-3 ${isDark ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

FocusSoundArchitect.displayName = 'FocusSoundArchitect';
export default FocusSoundArchitect;
