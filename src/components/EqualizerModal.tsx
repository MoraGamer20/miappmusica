import React, { useState, useEffect } from 'react';
import {
  Sliders,
  X,
  RotateCcw,
  Volume2,
  Sparkles,
  Check,
  Play,
  Square,
  Radio,
  Headphones,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { equalizer, EQ_FREQUENCIES, EQ_PRESETS, EQSettings } from '../utils/equalizerService';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  playbackSource?: 'full' | 'preview';
  onTogglePlaybackSource?: () => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  playbackSource = 'preview',
  onTogglePlaybackSource,
}) => {
  const [settings, setSettings] = useState<EQSettings>(() => equalizer.getSettings());
  const [isDemoActive, setIsDemoActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(equalizer.getSettings());
      equalizer.resume();
    } else {
      equalizer.stopDemoTone();
      setIsDemoActive(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGainChange = (index: number, val: number) => {
    equalizer.resume();
    equalizer.setGain(index, val);
    setSettings(equalizer.getSettings());
  };

  const handleSelectPreset = (presetId: string) => {
    equalizer.resume();
    equalizer.setPreset(presetId);
    setSettings(equalizer.getSettings());
  };

  const handleToggle = (enabled: boolean) => {
    equalizer.resume();
    equalizer.toggleEnabled(enabled);
    setSettings(equalizer.getSettings());
  };

  const handleReset = () => {
    equalizer.resume();
    equalizer.setPreset('flat');
    setSettings(equalizer.getSettings());
  };

  const handleToggleDemo = async () => {
    if (isDemoActive) {
      equalizer.stopDemoTone();
      setIsDemoActive(false);
    } else {
      const started = await equalizer.startDemoTone();
      setIsDemoActive(started);
    }
  };

  const handleClose = () => {
    equalizer.stopDemoTone();
    setIsDemoActive(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 p-0 sm:p-4">
      <div
        className="w-full max-w-2xl bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-800 flex items-center justify-between gap-2 bg-gradient-to-r from-slate-900 via-purple-950/20 to-slate-900">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30 shadow-inner shrink-0">
              <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white truncate">
                  Ecualizador Pro
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium shrink-0">
                  5 Bandas HD
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Ajusta frecuencias y perfiles acústicos en tiempo real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Master Toggle */}
            <label className="flex items-center gap-2 cursor-pointer bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
              <span className="text-xs font-semibold text-slate-200">
                {settings.enabled ? 'ON' : 'OFF'}
              </span>
              <input
                type="checkbox"
                checked={settings.enabled}
                onChange={(e) => handleToggle(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-9 h-5 rounded-full transition-colors relative ${
                  settings.enabled ? 'bg-purple-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    settings.enabled ? 'left-5' : 'left-0.5'
                  }`}
                />
              </div>
            </label>

            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Cerrar ecualizador"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto pb-safe">
          {/* Live Sound Demo Tester Bar */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-slate-800/80 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 border border-purple-500/30">
                <Headphones className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Prueba de Sonido en Tiempo Real</span>
                  {isDemoActive && (
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </p>
                <p className="text-[11px] text-slate-300">
                  {isDemoActive
                    ? '¡Sonido de prueba sonando! Mueve los deslizadores para escuchar el cambio'
                    : 'Prueba la pegada de graves y agudos sin pausar tu música'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleDemo}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md active:scale-95 transition-all w-full sm:w-auto justify-center shrink-0 ${
                isDemoActive
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-purple-600 hover:bg-purple-500 text-white'
              }`}
            >
              {isDemoActive ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Detener Prueba</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Probar Sonido Live</span>
                </>
              )}
            </button>
          </div>

          {/* YouTube vs Direct Audio Source Helper */}
          {playbackSource === 'full' && onTogglePlaybackSource && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-amber-300">
                  Fuente actual: Reproductor Full Audio
                </p>
                <p className="text-[11px] text-amber-200/90 mt-0.5">
                  Para aplicar la ecualización Web Audio a canciones individuales, puedes alternar a Audio Directo HD.
                </p>
                <button
                  type="button"
                  onClick={onTogglePlaybackSource}
                  className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-200 border border-amber-500/40 text-[11px] font-semibold hover:bg-amber-500/30 transition-colors"
                >
                  <Radio className="w-3 h-3 text-amber-300" />
                  <span>Alternar a Audio Directo HD</span>
                </button>
              </div>
            </div>
          )}

          {/* Presets Grid */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Perfiles de Sonido (Presets)
              </label>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-purple-400 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Restablecer
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EQ_PRESETS.map((preset) => {
                const isSelected = settings.presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500 text-white shadow-sm ring-1 ring-purple-500/40'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs truncate">{preset.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5-Band Vertical Sliders */}
          <div className="bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800/90 shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-purple-400" />
                Bandas de Frecuencia (-12 dB a +12 dB)
              </span>
              <span className="text-[11px] text-slate-400">
                {settings.enabled ? 'Filtros Web Audio Activos' : 'Bypass (Desactivado)'}
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2 sm:gap-6 pt-3 pb-2">
              {EQ_FREQUENCIES.map((band, idx) => {
                const gain = settings.gains[idx] || 0;
                return (
                  <div key={band.freq} className="flex flex-col items-center">
                    {/* Gain value badge */}
                    <span
                      className={`text-[11px] font-bold mb-2.5 px-1.5 sm:px-2 py-0.5 rounded-md min-w-[36px] text-center ${
                        gain > 0
                          ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30'
                          : gain < 0
                          ? 'text-rose-400 bg-rose-500/15 border border-rose-500/30'
                          : 'text-slate-400 bg-slate-800 border border-slate-700'
                      }`}
                    >
                      {gain > 0 ? `+${gain}` : gain} dB
                    </span>

                    {/* Vertical Slider Wrapper */}
                    <div className="h-40 flex items-center justify-center relative py-2">
                      {/* Zero center guideline */}
                      <div className="absolute w-full h-[1px] bg-slate-700/80 pointer-events-none top-1/2 -translate-y-1/2" />

                      <input
                        type="range"
                        min="-12"
                        max="12"
                        step="1"
                        value={gain}
                        disabled={!settings.enabled}
                        onChange={(e) => handleGainChange(idx, parseInt(e.target.value, 10))}
                        className={`accent-purple-500 -rotate-90 w-32 sm:w-36 h-2 rounded-lg cursor-pointer transition-opacity ${
                          settings.enabled ? 'opacity-100' : 'opacity-30 cursor-not-allowed'
                        }`}
                        style={{ margin: '0 -36px' }}
                        aria-label={`Banda ${band.label}`}
                      />
                    </div>

                    {/* Label */}
                    <div className="mt-2.5 text-center">
                      <p className="text-[11px] font-bold text-slate-200">
                        {band.label.split(' ')[0]} {band.label.split(' ')[1]}
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium">
                        {band.label.includes('(') ? band.label.split('(')[1].replace(')', '') : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px] flex items-center gap-1.5 text-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Cambios guardados automáticamente
          </span>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors shadow-md shadow-purple-600/30"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
