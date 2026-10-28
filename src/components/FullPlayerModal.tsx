import React, { useState } from 'react';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  Download,
  ExternalLink,
  Disc,
  Radio,
  Share2,
  Mic2,
  Sliders,
  Moon,
} from 'lucide-react';
import { Track } from '../types/music';
import { AudioVisualizer } from './AudioVisualizer';
import { downloadTrackAudio, getStreamingLinks } from '../utils/downloadHelper';

interface FullPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPreviousTrack: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: 'off' | 'all' | 'one';
  onCycleRepeat: () => void;
  onToggleFavorite: (id: string) => void;
  playbackSource: 'full' | 'preview';
  onTogglePlaybackSource: () => void;
  onOpenDownloadModal: (track: Track) => void;
  onOpenLyrics?: () => void;
  onOpenEqualizer?: () => void;
  onOpenSleepTimer?: () => void;
  sleepTimerRemaining?: number | null;
}

export const FullPlayerModal: React.FC<FullPlayerModalProps> = ({
  isOpen,
  onClose,
  track,
  isPlaying,
  onTogglePlay,
  onNextTrack,
  onPreviousTrack,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
  isShuffle,
  onToggleShuffle,
  repeatMode,
  onCycleRepeat,
  onToggleFavorite,
  playbackSource,
  onTogglePlaybackSource,
  onOpenDownloadModal,
  onOpenLyrics,
  onOpenEqualizer,
  onOpenSleepTimer,
  sleepTimerRemaining,
}) => {
  if (!isOpen || !track) return null;

  const links = getStreamingLinks(track);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  const handleDownload = () => {
    onOpenDownloadModal(track);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-2xl animate-in fade-in duration-200">
      {/* Background ambient glow matching purple/indigo tones */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-white z-10 max-h-[95vh] overflow-y-auto">
        {/* Top Header Bar */}
        <div className="w-full flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-1.5 text-xs text-purple-400 font-semibold tracking-wide uppercase shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="hidden sm:inline">Reproduciendo Ahora</span>
          </div>

          {/* Mode Switch Pill in Modal */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs shrink-0">
            <button
              type="button"
              onClick={() => playbackSource !== 'full' && onTogglePlaybackSource()}
              className={`px-2.5 sm:px-3 py-1 rounded-lg font-semibold transition-colors ${
                playbackSource === 'full'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🎵 Completa
            </button>
            <button
              type="button"
              onClick={() => playbackSource !== 'preview' && onTogglePlaybackSource()}
              className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium transition-colors ${
                playbackSource === 'preview'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Escuchar vista previa rápida de la canción"
            >
              ⚡ Escucha Rápida
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar reproductor ampliado"
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Vinyl Disc Artwork with Rotation */}
        <div className="relative my-4 flex items-center justify-center">
          <div
            className={`w-48 h-48 sm:w-64 sm:h-64 rounded-full p-2 bg-gradient-to-tr from-slate-950 via-slate-800 to-slate-900 shadow-2xl border-4 border-slate-700/50 flex items-center justify-center relative overflow-hidden ${
              isPlaying ? 'animate-[spin_12s_linear_infinite]' : ''
            }`}
          >
            {/* Grooves simulation rings */}
            <div className="absolute inset-3 rounded-full border border-slate-700/30 pointer-events-none" />
            <div className="absolute inset-6 rounded-full border border-slate-700/20 pointer-events-none" />
            <div className="absolute inset-10 rounded-full border border-slate-700/30 pointer-events-none" />

            {/* Inner Center Label / Cover Art */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-inner border-2 border-slate-600 relative z-10">
              {track.coverUrl ? (
                <img
                  src={track.coverUrl}
                  alt={track.album}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 flex items-center justify-center text-white">
                  <Disc className="w-10 h-10" />
                </div>
              )}
            </div>

            {/* Center spindle hole */}
            <div className="absolute w-5 h-5 rounded-full bg-slate-950 border-2 border-slate-600 z-20" />
          </div>
        </div>

        {/* Live Audio Visualizer Spectrum */}
        <div className="my-3">
          <AudioVisualizer isPlaying={isPlaying} barCount={36} height={32} color="#c084fc" />
        </div>

        {/* Track Title & Artist */}
        <div className="text-center my-2 max-w-lg">
          <h2 className="text-lg sm:text-2xl font-bold truncate text-white">{track.title}</h2>
          <p className="text-sm text-slate-300 font-medium truncate mt-0.5">{track.artist}</p>
          <p className="text-xs text-slate-500 truncate mt-0.5">
            {track.album} {track.playlist ? `• ${track.playlist}` : ''}
          </p>
        </div>

        {/* Progress Bar & Seek */}
        <div className="w-full max-w-md my-4">
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              onSeek(Math.max(0, Math.min(1, clickX / rect.width)) * duration);
            }}
            className="w-full h-2 bg-slate-800 hover:h-3 rounded-full overflow-hidden cursor-pointer transition-all"
          >
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400 font-mono mt-1.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex items-center justify-center gap-6 my-2">
          {/* Shuffle */}
          <button
            type="button"
            onClick={onToggleShuffle}
            aria-label="Modo aleatorio"
            className={`p-2 rounded-full transition-colors ${
              isShuffle ? 'text-purple-400 bg-purple-950/50' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Previous */}
          <button
            type="button"
            onClick={onPreviousTrack}
            aria-label="Pista anterior"
            className="p-2 text-slate-300 hover:text-white transition-colors"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </button>

          {/* Play/Pause */}
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-xl shadow-purple-600/40 transition-transform active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-1" />
            )}
          </button>

          {/* Next */}
          <button
            type="button"
            onClick={onNextTrack}
            aria-label="Pista siguiente"
            className="p-2 text-slate-300 hover:text-white transition-colors"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </button>

          {/* Repeat */}
          <button
            type="button"
            onClick={onCycleRepeat}
            aria-label="Modo repetición"
            className={`p-2 rounded-full transition-colors ${
              repeatMode !== 'off' ? 'text-purple-400 bg-purple-950/50' : 'text-slate-400 hover:text-white'
            }`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>

        {/* Volume bar */}
        <div className="flex items-center justify-center gap-3 w-64 my-3">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label="Alternar silencio"
            className="text-slate-400 hover:text-white"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            aria-label="Control de volumen"
            className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Primary Action Buttons: Favorite, Lyrics, EQ, Sleep Timer, Download */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4 pt-4 border-t border-slate-800 w-full">
          <button
            type="button"
            onClick={() => onToggleFavorite(track.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              track.isFavorite
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-current' : ''}`} />
            <span>{track.isFavorite ? 'Favorita' : 'Favoritos'}</span>
          </button>

          {onOpenLyrics && (
            <button
              type="button"
              onClick={onOpenLyrics}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/40 transition-colors shadow-sm"
              title="Ver letra sincronizada (Karaoke)"
            >
              <Mic2 className="w-4 h-4 text-pink-400" />
              <span>Letras / Karaoke</span>
            </button>
          )}

          {onOpenEqualizer && (
            <button
              type="button"
              onClick={onOpenEqualizer}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 transition-colors shadow-sm"
              title="Ajustar bandas de frecuencia"
            >
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Ecualizador</span>
            </button>
          )}

          {onOpenSleepTimer && (
            <button
              type="button"
              onClick={onOpenSleepTimer}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                sleepTimerRemaining !== null && sleepTimerRemaining !== undefined
                  ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-200'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>
                {sleepTimerRemaining !== null && sleepTimerRemaining !== undefined
                  ? `Apagado en ${Math.ceil(sleepTimerRemaining / 60)}m`
                  : 'Temporizador'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-md shadow-emerald-600/20"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Canción Completa</span>
          </button>

          {track.deezerId && (
            <a
              href={links.deezer}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <span>Deezer</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <a
            href={links.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <span>Spotify</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <a
            href={links.youtubeMusic}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <span>YouTube</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
