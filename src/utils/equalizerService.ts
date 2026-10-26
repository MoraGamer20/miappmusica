// Equalizer service using Web Audio API BiquadFilterNodes
// Manages 5-band EQ, presets, live audio demo test, and localStorage persistence

export interface EQBand {
  frequency: number;
  label: string;
  type: BiquadFilterType;
  gain: number; // in dB (-12 to +12)
}

export interface EQPreset {
  id: string;
  name: string;
  description: string;
  gains: number[]; // 5 values in dB
}

export const EQ_FREQUENCIES: { freq: number; label: string; type: BiquadFilterType; q?: number }[] = [
  { freq: 60, label: '60 Hz (Sub/Bajos)', type: 'lowshelf' },
  { freq: 250, label: '250 Hz (Graves)', type: 'peaking', q: 1.4 },
  { freq: 1000, label: '1 kHz (Medios/Voz)', type: 'peaking', q: 1.2 },
  { freq: 4000, label: '4 kHz (Presencia)', type: 'peaking', q: 1.2 },
  { freq: 12000, label: '12 kHz (Agudos/Aire)', type: 'highshelf' },
];

export const EQ_PRESETS: EQPreset[] = [
  {
    id: 'flat',
    name: 'Plano (Neutral)',
    description: 'Respuesta acústica pura y equilibrada sin alteraciones',
    gains: [0, 0, 0, 0, 0],
  },
  {
    id: 'bass-boost',
    name: 'Bajos Potentes (Bass Boost)',
    description: 'Realce profundo de subgraves para ritmos potentes y pegada',
    gains: [8, 6, 0, 1, 2],
  },
  {
    id: 'vocal',
    name: 'Voces & Acústico',
    description: 'Resalta claridad de letras, voces principales e instrumentos acústicos',
    gains: [-2, 1, 7, 5, 2],
  },
  {
    id: 'rock',
    name: 'Rock & Alternativo',
    description: 'Graves sólidos, medios definidos y platillos brillantes',
    gains: [5, 4, -1, 3, 5],
  },
  {
    id: 'pop',
    name: 'Pop / Electrónica',
    description: 'Pegada enérgica y brillo moderno para hits comerciales',
    gains: [4, 3, 2, 4, 4],
  },
  {
    id: 'night',
    name: 'Modo Nocturno / Suave',
    description: 'Atenúa frecuencias extremas para descanso auditivo relajado',
    gains: [-5, -2, 2, 0, -4],
  },
  {
    id: 'custom',
    name: 'Personalizado',
    description: 'Configuración manual a medida por el usuario',
    gains: [0, 0, 0, 0, 0],
  },
];

const STORAGE_KEY = 'deezer_hub_eq_settings';

export interface EQSettings {
  enabled: boolean;
  presetId: string;
  gains: number[];
}

export function loadEQSettings(): EQSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.gains) && parsed.gains.length === 5) {
        return parsed;
      }
    }
  } catch {}
  return {
    enabled: true,
    presetId: 'flat',
    gains: [0, 0, 0, 0, 0],
  };
}

export function saveEQSettings(settings: EQSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

class EqualizerEngine {
  private audioCtx: AudioContext | null = null;
  private filters: BiquadFilterNode[] = [];
  private mediaSource: MediaElementAudioSourceNode | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private masterGain: GainNode | null = null;
  private settings: EQSettings = loadEQSettings();

  // Live test demo state
  private demoOscillators: OscillatorNode[] = [];
  private demoGainNodes: GainNode[] = [];
  private isDemoRunning = false;
  private demoTimer: number | null = null;

  constructor() {
    // Lazy context initialization
  }

  getSettings(): EQSettings {
    return { ...this.settings, gains: [...this.settings.gains] };
  }

  private initContext(): AudioContext | null {
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    return this.audioCtx;
  }

  async resume(): Promise<void> {
    const ctx = this.initContext();
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        console.warn('[Equalizer] AudioContext resume warning:', e);
      }
    }
  }

  private buildFilterChain() {
    const ctx = this.initContext();
    if (!ctx) return;

    if (this.filters.length > 0) return;

    // Master gain node
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 1.0;

    // Create 5 biquad filter nodes
    this.filters = EQ_FREQUENCIES.map((band, idx) => {
      const filter = ctx.createBiquadFilter();
      filter.type = band.type;
      filter.frequency.value = band.freq;
      if (band.q) filter.Q.value = band.q;
      filter.gain.value = this.settings.enabled ? (this.settings.gains[idx] || 0) : 0;
      return filter;
    });

    // Chain filters: filter[0] -> filter[1] -> ... -> filter[4] -> masterGain -> destination
    for (let i = 0; i < this.filters.length - 1; i++) {
      this.filters[i].connect(this.filters[i + 1]);
    }
    this.filters[this.filters.length - 1].connect(this.masterGain);
    this.masterGain.connect(ctx.destination);
  }

  attachAudioElement(audioEl: HTMLAudioElement) {
    if (this.currentAudioElement === audioEl && this.mediaSource) {
      return;
    }

    try {
      // Ensure crossOrigin is configured for Web Audio API
      if (!audioEl.crossOrigin) {
        audioEl.crossOrigin = 'anonymous';
      }

      const ctx = this.initContext();
      if (!ctx) return;

      this.buildFilterChain();

      // Connect source to first filter
      if (!this.mediaSource) {
        try {
          this.mediaSource = ctx.createMediaElementSource(audioEl);
          this.mediaSource.connect(this.filters[0]);
          this.currentAudioElement = audioEl;
        } catch (err: any) {
          // If already connected, reuse
          if (err?.name === 'InvalidStateError') {
            this.currentAudioElement = audioEl;
          } else {
            console.warn('[Equalizer] createMediaElementSource notice:', err);
          }
        }
      }
    } catch (e) {
      console.warn('[Equalizer] attachAudioElement notice:', e);
    }
  }

  setGain(bandIndex: number, gainVal: number) {
    if (bandIndex < 0 || bandIndex >= 5) return;
    const clamped = Math.max(-12, Math.min(12, gainVal));
    this.settings.gains[bandIndex] = clamped;
    this.settings.presetId = 'custom';
    saveEQSettings(this.settings);

    this.resume();

    if (this.filters[bandIndex]) {
      const target = this.settings.enabled ? clamped : 0;
      if (this.audioCtx && this.audioCtx.state === 'running') {
        this.filters[bandIndex].gain.setTargetAtTime(target, this.audioCtx.currentTime, 0.05);
      } else {
        this.filters[bandIndex].gain.value = target;
      }
    }
  }

  setPreset(presetId: string) {
    const preset = EQ_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    this.settings.presetId = preset.id;
    this.settings.gains = [...preset.gains];
    saveEQSettings(this.settings);

    this.resume();

    this.filters.forEach((filter, idx) => {
      if (filter) {
        const target = this.settings.enabled ? preset.gains[idx] : 0;
        if (this.audioCtx && this.audioCtx.state === 'running') {
          filter.gain.setTargetAtTime(target, this.audioCtx.currentTime, 0.05);
        } else {
          filter.gain.value = target;
        }
      }
    });
  }

  toggleEnabled(enabled: boolean) {
    this.settings.enabled = enabled;
    saveEQSettings(this.settings);

    this.resume();

    this.filters.forEach((filter, idx) => {
      if (filter) {
        const target = enabled ? (this.settings.gains[idx] || 0) : 0;
        if (this.audioCtx && this.audioCtx.state === 'running') {
          filter.gain.setTargetAtTime(target, this.audioCtx.currentTime, 0.05);
        } else {
          filter.gain.value = target;
        }
      }
    });
  }

  /**
   * Generates a live synthesized audio groove routed directly through the 5 EQ filters,
   * allowing users to immediately test the real-time difference of bass, mids, and treble.
   */
  async startDemoTone(): Promise<boolean> {
    try {
      await this.resume();
      const ctx = this.initContext();
      if (!ctx) return false;

      this.stopDemoTone();
      this.buildFilterChain();

      this.isDemoRunning = true;

      // Play a looping groove: Bass pulse (60-120Hz), chord pad (440-880Hz), and hi-hat shimmer (6-12kHz)
      let step = 0;
      const playStep = () => {
        if (!this.isDemoRunning || !this.audioCtx || this.audioCtx.state !== 'running') return;

        const now = this.audioCtx.currentTime;

        // 1. Kick/Sub bass note (affected by 60Hz and 250Hz)
        if (step % 2 === 0) {
          const oscBass = ctx.createOscillator();
          const gainBass = ctx.createGain();
          oscBass.type = 'sine';
          oscBass.frequency.setValueAtTime(step % 4 === 0 ? 65 : 82, now);
          oscBass.frequency.exponentialRampToValueAtTime(35, now + 0.25);

          gainBass.gain.setValueAtTime(0.4, now);
          gainBass.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

          oscBass.connect(gainBass);
          gainBass.connect(this.filters[0]);
          oscBass.start(now);
          oscBass.stop(now + 0.32);
        }

        // 2. Harmonic chord/voice pulse (affected by 1kHz and 4kHz)
        const chordFreqs = [261.63, 329.63, 392.0, 523.25]; // C major
        const oscMid = ctx.createOscillator();
        const gainMid = ctx.createGain();
        oscMid.type = 'triangle';
        oscMid.frequency.setValueAtTime(chordFreqs[step % chordFreqs.length], now);

        gainMid.gain.setValueAtTime(0.12, now);
        gainMid.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        oscMid.connect(gainMid);
        gainMid.connect(this.filters[0]);
        oscMid.start(now);
        oscMid.stop(now + 0.24);

        // 3. Crisp Hi-hat shimmer (affected by 4kHz and 12kHz)
        if (step % 2 === 1 || step % 4 === 2) {
          const oscHi = ctx.createOscillator();
          const gainHi = ctx.createGain();
          oscHi.type = 'square';
          oscHi.frequency.setValueAtTime(8000 + (step % 3) * 1500, now);

          gainHi.gain.setValueAtTime(0.03, now);
          gainHi.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

          oscHi.connect(gainHi);
          gainHi.connect(this.filters[0]);
          oscHi.start(now);
          oscHi.stop(now + 0.1);
        }

        step = (step + 1) % 8;
      };

      playStep();
      this.demoTimer = window.setInterval(playStep, 240);
      return true;
    } catch (e) {
      console.warn('[Equalizer] startDemoTone error:', e);
      return false;
    }
  }

  stopDemoTone() {
    this.isDemoRunning = false;
    if (this.demoTimer) {
      clearInterval(this.demoTimer);
      this.demoTimer = null;
    }
    this.demoOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    this.demoOscillators = [];
    this.demoGainNodes.forEach((g) => {
      try {
        g.disconnect();
      } catch {}
    });
    this.demoGainNodes = [];
  }

  isDemoActive(): boolean {
    return this.isDemoRunning;
  }
}

export const equalizer = new EqualizerEngine();
