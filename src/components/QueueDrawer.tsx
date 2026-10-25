import React from 'react';
import { X, Play, Trash2, ListOrdered, Music, Disc } from 'lucide-react';
import { Track } from '../types/music';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  queue: Track[];
  queueIndex: number;
  onPlayQueueIndex: (index: number) => void;
  onClearQueue: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  isOpen,
  onClose,
  queue,
  queueIndex,
  onPlayQueueIndex,
  onClearQueue,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-slate-900/95 border-l border-slate-800 text-slate-100 shadow-2xl z-40 flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white">Cola de Reproducción ({queue.length})</h3>
        </div>
        <div className="flex items-center gap-1">
          {queue.length > 0 && (
            <button
              type="button"
              onClick={onClearQueue}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
              title="Vaciar cola"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Queue items list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center text-slate-500">
            <Music className="w-8 h-8 mb-2" />
            <p className="text-xs">La cola de reproducción está vacía</p>
          </div>
        ) : (
          queue.map((track, idx) => {
            const isCurrent = idx === queueIndex;
            return (
              <div
                key={`${track.id}-${idx}`}
                onClick={() => onPlayQueueIndex(idx)}
                className={`group flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${
                  isCurrent
                    ? 'bg-purple-950/40 border border-purple-500/40 text-purple-300 font-semibold'
                    : 'hover:bg-slate-800/80 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 text-center text-[10px] text-slate-500 font-mono">
                    {idx + 1}
                  </span>
                  <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                    {track.coverUrl ? (
                      <img src={track.coverUrl} alt={track.album} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white bg-slate-700">
                        <Disc className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs truncate">{track.title}</p>
                    <p className="text-[10px] text-slate-400 truncate">{track.artist}</p>
                  </div>
                </div>

                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white transition-opacity"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
