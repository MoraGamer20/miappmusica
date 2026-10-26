// Equalizer service using Web Audio API BiquadFilterNodes
// Manages 5-band EQ and presets with localStorage persistence

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

export const EQ_FREQUENCIES: { freq: number; label: string; type: BiquadFilterType }[] = [
  { freq: 60, label: '60 Hz (Sub)', type: 'lowshelf' },
  { freq: 250, label: '250 Hz (Bajos)', type: 'peaking' },
  { freq: 1000, label: '1 kHz (Medios/Voz)', type: 'peaking' },
  { freq: 4000, label: '4 kHz (Presencia)', type: 'peaking' },
  { freq: 12000, label: '12 kHz (Agudos)', type: 'highshelf' },
];

export const EQ_PRESETS: EQPreset[] = [
  {
    id: 'flat',
    name: 'Plano (Por Defecto)',
    description: 'Respuesta acústica neutral y fidedigna al audio original',
    gains: [0, 0, 0, 0, 0],
  },
  {
    id: 'bass-boost',
    name: 'Bajos Potentes (Bass Boost)',
    description: 'Realza graves profundos ideal para Reggaeton, Trap y EDM',
    gains: [7, 5, 0, 1, 2],
  },
  {
    id: 'vocal',
    name: 'Voces & Acústico',
    description: 'Claridad en letras, voces cristalinas y guitarras acústicas',
    gains: [-2, 1, 6, 4, 2],
  },
  {
    id: 'rock',
    name: 'Rock & Alternativo',
    description: 'Graves marcados, medios balanceados y agudos brillantes',
    gains: [5, 3, -1, 3, 5],
  },
  {
    id: 'pop',
    name: 'Pop / Electrónica',
    description: 'Balance dinámico para ritmos energéticos y melodías modernas',
    gains: [4, 2, 2, 4, 3],
  },
  {
    id: 'night',
    name: 'Modo Nocturno / Suave',
    description: 'Atenúa frecuencias extremas para no fatigar los oídos',
    gains: [-4, -2, 2, 1, -3],
  },
  {
    id: 'custom',
    name: 'Personalizado',
    description: 'Configuración manual ajustada por el usuario',
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
  private settings: EQSettings = loadEQSettings();

  getSettings(): EQSettings {
    return { ...this.settings, gains: [...this.settings.gains] };
  }

  private initContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
  }

  attachAudioElement(audioEl: HTMLAudioElement) {
    if (this.currentAudioElement === audioEl && this.mediaSource) {
      return;
    }

    try {
      this.initContext();
      if (!this.audioCtx) return;

      if (this.audioCtx.state === 'suspended') {
        const resumeOnInteraction = () => {
          this.audioCtx?.resume();
          window.removeEventListener('click', resumeOnInteraction);
        };
        window.addEventListener('click', resumeOnInteraction);
      }

      // Create filter chain if not yet created
      if (this.filters.length === 0) {
        this.filters = EQ_FREQUENCIES.map((band, idx) => {
          const filter = this.audioCtx!.createBiquadFilter();
          filter.type = band.type;
          filter.frequency.value = band.freq;
          filter.gain.value = this.settings.enabled ? (this.settings.gains[idx] || 0) : 0;
          return filter;
        });

        // Link filters together: 0 -> 1 -> 2 -> 3 -> 4
        for (let i = 0; i < this.filters.length - 1; i++) {
          this.filters[i].connect(this.filters[i + 1]);
        }
      }

      // Connect source to first filter, and last filter to destination
      try {
        this.mediaSource = this.audioCtx.createMediaElementSource(audioEl);
        this.mediaSource.connect(this.filters[0]);
        this.filters[this.filters.length - 1].connect(this.audioCtx.destination);
        this.currentAudioElement = audioEl;
      } catch (err) {
        // If already connected or CORS cross-origin restriction, gracefully handle
        console.warn('Audio element source setup warning:', err);
      }
    } catch (e) {
      console.warn('Equalizer initialization notice:', e);
    }
  }

  setGain(bandIndex: number, gainVal: number) {
    if (bandIndex < 0 || bandIndex >= 5) return;
    const clamped = Math.max(-12, Math.min(12, gainVal));
    this.settings.gains[bandIndex] = clamped;
    this.settings.presetId = 'custom';
    saveEQSettings(this.settings);

    if (this.filters[bandIndex] && this.settings.enabled) {
      this.filters[bandIndex].gain.value = clamped;
    }
  }

  setPreset(presetId: string) {
    const preset = EQ_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    this.settings.presetId = preset.id;
    this.settings.gains = [...preset.gains];
    saveEQSettings(this.settings);

    this.filters.forEach((filter, idx) => {
      if (filter) {
        filter.gain.value = this.settings.enabled ? preset.gains[idx] : 0;
      }
    });
  }

  toggleEnabled(enabled: boolean) {
    this.settings.enabled = enabled;
    saveEQSettings(this.settings);

    this.filters.forEach((filter, idx) => {
      if (filter) {
        filter.gain.value = enabled ? this.settings.gains[idx] : 0;
      }
    });
  }
}

export const equalizer = new EqualizerEngine();
