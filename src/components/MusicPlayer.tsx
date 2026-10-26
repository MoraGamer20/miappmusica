import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  Maximize2,
  Download,
  ListOrdered,
  Heart,
  Disc,
  Music,
  Mic2,
  Sliders,
  Moon,
} from 'lucide-react';
import { Track } from '../types/music';
import { AudioVisualizer } from './AudioVisualizer';

interface MusicPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPreviousTrack: () => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: 'off' | 'all' | 'one';
  onCycleRepeat: () => void;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onToggleFavorite: (id: string) => void;
  onOpenQueue: () => void;
  onOpenFullPlayer: () => void;
  queueLength: number;
  playbackSource: 'full' | 'preview';
  onTogglePlaybackSource: () => void;
  onOpenDownloadModal: (track: Track) => void;
  onOpenLyrics?: () => void;
  onOpenEqualizer?: () => void;
  onOpenSleepTimer?: () => void;
  sleepTimerRemaining?: number | null;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  currentTrack,
  isPlaying,
  onTogglePlay,
  onNextTrack,
  onPreviousTrack,
  isShuffle,
  onToggleShuffle,
  repeatMode,
  onCycleRepeat,
  currentTime,
  duration,
  onSeek,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
  onToggleFavorite,
  onOpenQueue,
  onOpenFullPlayer,
  queueLength,
  playbackSource,
  onTogglePlaybackSource,
  onOpenDownloadModal,
  onOpenLyrics,
  onOpenEqualizer,
  onOpenSleepTimer,
  sleepTimerRemaining,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const mobileProgressRef = useRef<HTMLDivElement | null>(null);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>, ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current || duration <= 0) return;
    const rect = ref.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(percentage * duration);
  };

  const handleDownload = () => {
    if (!currentTrack) return;
    onOpenDownloadModal(currentTrack);
  };

  if (!currentTrack) {
    return (
      <footer className="hidden sm:flex fixed bottom-0 left-0 right-0 h-16 sm:h-20 bg-slate-900/95 border-t border-slate-800 text-slate-500 items-center justify-between px-4 sm:px-6 z-30 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
            <Music className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-400 truncate">Selecciona una canción para reproducir</p>
            <p className="text-[10px] text-slate-600 truncate">Buscador y reproductor listos</p>
          </div>
        </div>
      </footer>
    );
  }

  const progressPercent =
    duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <>
      {/* =========================================
          1. MOBILE MINI-PLAYER (< sm)
          Thumb-friendly Spotify-style sticky dock above Bottom Navigation Bar
         ========================================= */}
      <footer className="sm:hidden fixed bottom-16 left-0 right-0 z-30 bg-slate-900/95 border-t border-slate-800/80 backdrop-blur-xl shadow-2xl flex flex-col">
        {/* Slim top progress line */}
        <div
          ref={mobileProgressRef}
          onClick={(e) => handleProgressBarClick(e, mobileProgressRef)}
          className="w-full h-1 bg-slate-800 cursor-pointer relative"
        >
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Mini-player content bar */}
        <div className="flex items-center justify-between px-3 py-2 gap-2">
          {/* Left: Album cover thumbnail */}
          <div
            onClick={onOpenFullPlayer}
            className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-slate-800 shadow cursor-pointer active:scale-95 transition-transform"
          >
            {currentTrack.coverUrl ? (
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.album}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white">
                <Disc className={`w-5 h-5 ${isPlaying ? 'animate-spin' : ''}`} />
              </div>
            )}
          </div>

          {/* Middle: Title & Artist (tapping expands full player) */}
          <div
            onClick={onOpenFullPlayer}
            className="flex-1 min-w-0 cursor-pointer pr-1"
          >
            <h4 className="text-xs font-semibold text-white truncate">
              {currentTrack.title}
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate">
              <span className="truncate">{currentTrack.artist}</span>
              <span className="text-slate-600">·</span>
              <span className="text-purple-400 font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Right: Quick Touch Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Heart toggle */}
            <button
              type="button"
              onClick={() => onToggleFavorite(currentTrack.id)}
              aria-label={currentTrack.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              className="w-10 h-10 flex items-center justify-center text-slate-400 active:scale-90 transition-transform"
            >
              <Heart
                className={`w-4 h-4 ${currentTrack.isFavorite ? 'text-rose-500 fill-rose-500' : ''}`}
              />
            </button>

            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={onTogglePlay}
              aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-purple-600/30 active:scale-95 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            {/* Expand / Fullscreen */}
            <button
              type="button"
              onClick={onOpenFullPlayer}
              aria-label="Expandir reproductor"
              className="w-10 h-10 flex items-center justify-center text-slate-400 active:text-white"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>

      {/* =========================================
          2. DESKTOP FULL-FEATURED PLAYER (sm and up)
          Three-zone high-fidelity audio dashboard
         ========================================= */}
      <footer className="hidden sm:flex fixed bottom-0 left-0 right-0 h-22 bg-slate-900/95 border-t border-slate-800 text-white flex-col justify-between px-6 py-2.5 z-30 backdrop-blur-xl shadow-2xl">
        {/* Top Timeline Slider */}
        <div
          ref={progressBarRef}
          onClick={(e) => handleProgressBarClick(e, progressBarRef)}
          className="w-full h-2.5 -mt-3.5 pt-1.5 cursor-pointer group flex items-center"
        >
          <div className="w-full h-1 bg-slate-800 group-hover:h-2 rounded-full overflow-hidden transition-all relative">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 relative transition-all duration-100"
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Left: Track Information & Album Art */}
          <div className="flex items-center gap-3 min-w-0 max-w-[28%]">
            <div
              onClick={onOpenFullPlayer}
              className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 cursor-pointer shadow-md group/art bg-slate-800"
              title="Expandir reproductor"
            >
              {currentTrack.coverUrl ? (
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.album}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white">
                  <Disc className={`w-6 h-6 ${isPlaying ? 'animate-spin' : ''}`} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/art:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="min-w-0">
              <h4
                onClick={onOpenFullPlayer}
                className="text-xs sm:text-sm font-semibold truncate hover:text-purple-400 cursor-pointer transition-colors"
                title={currentTrack.title}
              >
                {currentTrack.title}
              </h4>
              <p className="text-[11px] text-slate-400 truncate" title={currentTrack.artist}>
                {currentTrack.artist}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onToggleFavorite(currentTrack.id)}
              aria-label={currentTrack.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
              className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
            >
              <Heart
                className={`w-4 h-4 ${currentTrack.isFavorite ? 'text-rose-500 fill-rose-500' : ''}`}
              />
            </button>
          </div>

          {/* Center: Controls & Audio Wave */}
          <div className="flex flex-col items-center gap-1.5 max-w-md w-full">
            <div className="flex items-center gap-3 sm:gap-5">
              {/* Shuffle */}
              <button
                type="button"
                onClick={onToggleShuffle}
                aria-label="Aleatorio"
                className={`p-1.5 rounded-md transition-colors ${
                  isShuffle ? 'text-purple-400' : 'text-slate-400 hover:text-slate-200'
                }`}
                title={isShuffle ? 'Aleatorio activado' : 'Aleatorio desactivado'}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              {/* Skip Back */}
              <button
                type="button"
                onClick={onPreviousTrack}
                aria-label="Canción anterior"
                className="p-1.5 text-slate-300 hover:text-white transition-colors"
              >
                <SkipBack className="w-4 h-4 fill-current" />
              </button>

              {/* Play/Pause Button */}
              <button
                type="button"
                onClick={onTogglePlay}
                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 hover:from-purple-500 hover:to-indigo-400 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 transition-transform active:scale-95"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              {/* Skip Next */}
              <button
                type="button"
                onClick={onNextTrack}
                aria-label="Canción siguiente"
                className="p-1.5 text-slate-300 hover:text-white transition-colors"
              >
                <SkipForward className="w-4 h-4 fill-current" />
              </button>

              {/* Repeat */}
              <button
                type="button"
                onClick={onCycleRepeat}
                aria-label="Repetir"
                className={`p-1.5 rounded-md transition-colors ${
                  repeatMode !== 'off' ? 'text-purple-400' : 'text-slate-400 hover:text-slate-200'
                }`}
                title={
                  repeatMode === 'one'
                    ? 'Repetir una pista'
                    : repeatMode === 'all'
                    ? 'Repetir lista completa'
                    : 'Repetición desactivada'
                }
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-4 h-4" />
                ) : (
                  <Repeat className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Time indicator, Mode Toggle and Visualizer */}
            <div className="flex items-center gap-2.5 text-[11px] text-slate-400 font-mono">
              <span>{formatTime(currentTime)}</span>
              <div className="hidden sm:block">
                <AudioVisualizer isPlaying={isPlaying} barCount={16} height={15} color="#a855f7" />
              </div>
              <span>{formatTime(duration)}</span>

              {/* Full Audio vs 30s Preview Mode Toggle */}
              <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700/80 text-[10px] ml-1">
                <button
                  type="button"
                  onClick={() => playbackSource !== 'full' && onTogglePlaybackSource()}
                  className={`px-2 py-0.5 rounded-md font-semibold transition-colors ${
                    playbackSource === 'full'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Modo Canción Completa (reproduce la canción completa de 3-5 minutos)"
                >
                  🎵 Completa
                </button>
                <button
                  type="button"
                  onClick={() => playbackSource !== 'preview' && onTogglePlaybackSource()}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    playbackSource === 'preview'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Vista previa rápida de Deezer (30 segundos)"
                >
                  ⏱️ 30s
                </button>
              </div>
            </div>
          </div>

          {/* Right: Actions, Volume & Tools */}
          <div className="flex items-center justify-end gap-2 sm:gap-3 min-w-0 max-w-[28%]">
            {/* Lyrics / Karaoke button */}
            {onOpenLyrics && (
              <button
                type="button"
                onClick={onOpenLyrics}
                aria-label="Ver letra sincronizada (Karaoke)"
                className="p-2 text-slate-300 hover:text-pink-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Letras en vivo / Modo Karaoke (L)"
              >
                <Mic2 className="w-4 h-4" />
              </button>
            )}

            {/* Equalizer button */}
            {onOpenEqualizer && (
              <button
                type="button"
                onClick={onOpenEqualizer}
                aria-label="Ecualizador de sonido"
                className="p-2 text-slate-300 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Ecualizador de audio y perfiles (E)"
              >
                <Sliders className="w-4 h-4" />
              </button>
            )}

            {/* Sleep Timer button */}
            {onOpenSleepTimer && (
              <button
                type="button"
                onClick={onOpenSleepTimer}
                aria-label="Temporizador de apagado"
                className={`p-2 rounded-lg transition-colors relative ${
                  sleepTimerRemaining !== null && sleepTimerRemaining !== undefined
                    ? 'text-indigo-400 bg-indigo-950/60 border border-indigo-500/40'
                    : 'text-slate-300 hover:text-indigo-300 hover:bg-slate-800'
                }`}
                title="Temporizador de apagado (T)"
              >
                <Moon className="w-4 h-4" />
                {sleepTimerRemaining !== null && sleepTimerRemaining !== undefined && (
                  <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-indigo-500 text-white px-1 rounded-full">
                    {Math.ceil(sleepTimerRemaining / 60)}m
                  </span>
                )}
              </button>
            )}

            {/* Direct Download MP3 */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              aria-label="Descargar canción actual en MP3"
              className="p-2 text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Descargar archivo MP3 de esta canción"
            >
              <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce text-emerald-400' : ''}`} />
            </button>

            {/* Queue Drawer toggle */}
            <button
              type="button"
              onClick={onOpenQueue}
              aria-label={`Ver cola (${queueLength})`}
              className="p-2 text-slate-300 hover:text-purple-400 hover:bg-slate-800 rounded-lg transition-colors relative"
              title="Cola de reproducción e historial"
            >
              <ListOrdered className="w-4 h-4" />
              {queueLength > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-500" />
              )}
            </button>

            {/* Volume Control */}
            <div className="hidden md:flex items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleMute}
                aria-label={isMuted ? 'Desactivar silencio' : 'Silenciar'}
                className="p-1.5 text-slate-400 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                aria-label="Volumen"
                className="w-18 accent-purple-500 h-1 bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Expand to Full Player Modal */}
            <button
              type="button"
              onClick={onOpenFullPlayer}
              aria-label="Pantalla completa del reproductor"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Modo pantalla completa / visualizador"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>
    </>
  );
};
