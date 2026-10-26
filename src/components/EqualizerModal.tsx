import React, { useState } from 'react';
import { Sliders, X, RotateCcw, Volume2, Sparkles, Check } from 'lucide-react';
import { equalizer, EQ_FREQUENCIES, EQ_PRESETS, EQSettings } from '../utils/equalizerService';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState<EQSettings>(() => equalizer.getSettings());

  if (!isOpen) return null;

  const handleGainChange = (index: number, val: number) => {
    equalizer.setGain(index, val);
    setSettings(equalizer.getSettings());
  };

  const handleSelectPreset = (presetId: string) => {
    equalizer.setPreset(presetId);
    setSettings(equalizer.getSettings());
  };

  const handleToggle = (enabled: boolean) => {
    equalizer.toggleEnabled(enabled);
    setSettings(equalizer.getSettings());
  };

  const handleReset = () => {
    equalizer.setPreset('flat');
    setSettings(equalizer.getSettings());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-neutral-800 flex items-center justify-between gap-2 bg-gradient-to-r from-neutral-900 via-neutral-900 to-indigo-950/40">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shadow-inner shrink-0">
              <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-bold text-white flex items-center gap-2 truncate">
                <span>Ecualizador</span>
                <span className="hidden sm:inline-block text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Web Audio
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-neutral-400 truncate">
                Ajusta las 5 bandas de frecuencia
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Master Toggle */}
            <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer bg-neutral-800/80 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-neutral-700/60 hover:border-neutral-600 transition-colors">
              <span className="text-[11px] sm:text-xs font-medium text-neutral-300">
                {settings.enabled ? 'On' : 'Off'}
              </span>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => handleToggle(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-8 h-4 rounded-full transition-colors relative ${settings.enabled ? 'bg-indigo-600' : 'bg-neutral-700'}`}>
                <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${settings.enabled ? 'left-4.5' : 'left-0.5'}`} />
              </div>
            </label>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Presets Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Perfiles de Sonido (Presets)
              </label>
              <button
                onClick={handleReset}
                className="text-xs text-neutral-400 hover:text-indigo-400 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Restablecer Plano
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EQ_PRESETS.map((preset) => {
                const isSelected = settings.presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/30'
                        : 'bg-neutral-800/40 border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs truncate">{preset.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1 line-clamp-1">{preset.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sliders Container */}
          <div className="bg-neutral-950/60 p-5 rounded-2xl border border-neutral-800/80">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-neutral-400 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-indigo-400" />
                Respuesta en Decibeles (-12 dB a +12 dB)
              </span>
              <span className="text-xs text-neutral-500">
                {settings.enabled ? 'Filtros Web Audio Activos' : 'Audio Bypass (Ecualizador Apagado)'}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-3 sm:gap-6 pt-2 pb-2">
              {EQ_FREQUENCIES.map((band, idx) => {
                const gain = settings.gains[idx] || 0;
                return (
                  <div key={band.freq} className="flex flex-col items-center">
                    {/* Gain value badge */}
                    <span className={`text-xs font-bold mb-3 px-2 py-0.5 rounded-md ${
                      gain > 0 
                        ? 'text-emerald-400 bg-emerald-500/10' 
                        : gain < 0 
                          ? 'text-rose-400 bg-rose-500/10' 
                          : 'text-neutral-400 bg-neutral-800'
                    }`}>
                      {gain > 0 ? `+${gain}` : gain} dB
                    </span>

                    {/* Vertical Slider Wrapper */}
                    <div className="h-44 flex items-center justify-center relative py-2">
                      {/* Zero center guide line */}
                      <div className="absolute w-full h-[1px] bg-neutral-700/60 pointer-events-none top-1/2 -translate-y-1/2" />

                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="1"
                        value={gain}
                        disabled={!settings.enabled}
                        onChange={(e) => handleGainChange(idx, parseInt(e.target.value, 10))}
                        className={`accent-indigo-500 -rotate-90 w-36 h-2 rounded-lg cursor-pointer transition-opacity ${
                          settings.enabled ? 'opacity-100' : 'opacity-40 cursor-not-allowed'
                        }`}
                        style={{ margin: '0 -40px' }}
                      />
                    </div>

                    {/* Label */}
                    <div className="mt-3 text-center">
                      <p className="text-xs font-semibold text-neutral-200">{band.label.split(' ')[0]} {band.label.split(' ')[1]}</p>
                      <p className="text-[10px] text-neutral-500">{band.label.includes('(') ? band.label.split('(')[1].replace(')', '') : ''}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/90 flex items-center justify-between text-xs text-neutral-400">
          <span>Los cambios se guardan y aplican automáticamente a la reproducción activa.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
