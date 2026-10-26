import React, { useState, useEffect, useRef } from 'react';
import { Mic2, X, Copy, Check, Type, Sparkles, ExternalLink, RefreshCw, Music } from 'lucide-react';
import { Track } from '../types/music';
import { getTrackLyrics, LyricsData } from '../utils/lyricsService';

interface LyricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  currentTime: number;
  onSeek: (seconds: number) => void;
}

export const LyricsModal: React.FC<LyricsModalProps> = ({
  isOpen,
  onClose,
  track,
  currentTime,
  onSeek,
}) => {
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [viewMode, setViewMode] = useState<'synced' | 'plain'>('synced');
  const activeLineRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [userIsScrolling, setUserIsScrolling] = useState(false);
  const userScrollTimeout = useRef<number | null>(null);

  // Load lyrics when track changes
  useEffect(() => {
    if (!isOpen || !track) return;
    let isCancelled = false;

    setLoading(true);
    getTrackLyrics(track)
      .then((data) => {
        if (!isCancelled) {
          setLyricsData(data);
          if (data?.isSynced) {
            setViewMode('synced');
          } else {
            setViewMode('plain');
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setLyricsData(null);
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [track?.id, isOpen]);

  // Determine active line index based on currentTime
  const activeIndex = React.useMemo(() => {
    if (!lyricsData?.syncedLyrics || lyricsData.syncedLyrics.length === 0) return -1;
    const lines = lyricsData.syncedLyrics;
    let idx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (currentTime >= lines[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [lyricsData?.syncedLyrics, currentTime]);

  // Auto-scroll to active line if user is not manually scrolling
  useEffect(() => {
    if (viewMode === 'synced' && !userIsScrolling && activeLineRef.current && scrollContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, viewMode, userIsScrolling]);

  const handleContainerScroll = () => {
    setUserIsScrolling(true);
    if (userScrollTimeout.current) {
      window.clearTimeout(userScrollTimeout.current);
    }
    userScrollTimeout.current = window.setTimeout(() => {
      setUserIsScrolling(false);
    }, 2500);
  };

  const handleCopy = () => {
    const textToCopy = lyricsData?.plainLyrics || 
      lyricsData?.syncedLyrics?.map((l) => l.text).join('\n') || '';
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen || !track) return null;

  const fontSizes = {
    sm: 'text-base sm:text-lg',
    md: 'text-lg sm:text-2xl',
    lg: 'text-2xl sm:text-3xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl h-[88vh] max-h-[780px] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/90 backdrop-blur">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={track.coverUrl || track.albumCover || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&h=100&fit=crop'}
              alt={track.title}
              className="w-12 h-12 rounded-xl object-cover shadow border border-neutral-700/60 shrink-0"
            />
            <div className="min-w-0">
              <h3 className="font-bold text-white text-base truncate flex items-center gap-2">
                {track.title}
                {lyricsData?.isSynced && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-medium">
                    Karaoke Sincronizado
                  </span>
                )}
              </h3>
              <p className="text-xs text-neutral-400 truncate">{track.artist} • {track.album}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Font size picker */}
            <div className="flex items-center bg-neutral-800/80 rounded-lg p-0.5 border border-neutral-700/60">
              <button
                onClick={() => setFontSize('sm')}
                className={`px-2 py-1 text-xs rounded font-medium transition-colors ${fontSize === 'sm' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'}`}
                title="Texto Pequeño"
              >
                A
              </button>
              <button
                onClick={() => setFontSize('md')}
                className={`px-2 py-1 text-sm rounded font-medium transition-colors ${fontSize === 'md' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'}`}
                title="Texto Mediano"
              >
                A
              </button>
              <button
                onClick={() => setFontSize('lg')}
                className={`px-2 py-1 text-base rounded font-bold transition-colors ${fontSize === 'lg' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'}`}
                title="Texto Grande"
              >
                A
              </button>
            </div>

            {/* View Mode Toggle */}
            {lyricsData?.syncedLyrics && (
              <button
                onClick={() => setViewMode(viewMode === 'synced' ? 'plain' : 'synced')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
                  viewMode === 'synced'
                    ? 'bg-pink-600/20 border-pink-500/50 text-pink-300'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-750'
                }`}
                title="Alternar entre modo sincronizado y texto plano"
              >
                <Mic2 className="w-3.5 h-3.5" />
                {viewMode === 'synced' ? 'En Vivo' : 'Texto'}
              </button>
            )}

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Copiar letra al portapapeles"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleContainerScroll}
          className="flex-1 overflow-y-auto p-6 sm:p-10 relative scroll-smooth bg-gradient-to-b from-neutral-900 via-neutral-900/95 to-neutral-950"
        >
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-neutral-400">
              <RefreshCw className="w-8 h-8 animate-spin text-pink-500" />
              <p className="text-sm">Buscando letra oficial en el catálogo musical...</p>
            </div>
          ) : lyricsData?.isInstrumental ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center text-neutral-400">
                <Music className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-bold text-white">Pista Instrumental</h4>
              <p className="text-sm text-neutral-400 max-w-sm">
                Esta canción está registrada como una composición instrumental sin letra vocal.
              </p>
            </div>
          ) : lyricsData?.syncedLyrics && viewMode === 'synced' ? (
            <div className="space-y-6 max-w-2xl mx-auto py-8">
              {lyricsData.syncedLyrics.map((line, idx) => {
                const isActive = idx === activeIndex;
                const isPast = activeIndex !== -1 && idx < activeIndex;

                return (
                  <div
                    key={idx}
                    ref={isActive ? activeLineRef : null}
                    onClick={() => onSeek(line.time)}
                    className={`cursor-pointer transition-all duration-300 font-semibold rounded-xl px-4 py-2 select-none ${
                      fontSizes[fontSize]
                    } ${
                      isActive
                        ? 'text-white bg-pink-600/20 shadow-lg scale-102 border-l-4 border-pink-500 pl-4 py-3'
                        : isPast
                        ? 'text-neutral-500 hover:text-neutral-300'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {line.text || '•••'}
                  </div>
                );
              })}
            </div>
          ) : lyricsData?.plainLyrics ? (
            <div className="max-w-2xl mx-auto py-6 whitespace-pre-line text-neutral-200 leading-relaxed font-medium">
              <p className={fontSizes[fontSize]}>{lyricsData.plainLyrics}</p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-neutral-800/80 flex items-center justify-center text-neutral-400">
                <Mic2 className="w-8 h-8 opacity-50" />
              </div>
              <h4 className="text-lg font-bold text-white">Letra no disponible aún</h4>
              <p className="text-sm text-neutral-400 max-w-sm">
                No pudimos encontrar la letra sincronizada automática para "{track.title}" de {track.artist}.
              </p>
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(track.title + ' ' + track.artist + ' letra')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-750 text-white text-xs font-semibold rounded-xl border border-neutral-700 transition-colors"
              >
                Buscar Letra en Google <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-900/90 flex items-center justify-between text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            Haz clic sobre cualquier verso para saltar a ese momento de la canción
          </span>
          <span>LRCLIB Community Database</span>
        </div>
      </div>
    </div>
  );
};
