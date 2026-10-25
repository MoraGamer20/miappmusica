import React, { useEffect, useRef } from 'react';

interface YouTubeAudioEmbedProps {
  videoId: string | null;
  isPlaying: boolean;
  volume: number; // 0 to 1
  isMuted: boolean;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onEnded: () => void;
  seekTime: number | null;
}

export const YouTubeAudioEmbed: React.FC<YouTubeAudioEmbedProps> = ({
  videoId,
  isPlaying,
  volume,
  isMuted,
  onTimeUpdate,
  onEnded,
  seekTime,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const isReadyRef = useRef(false);

  // Send command to YouTube iframe via postMessage
  const sendCommand = (func: string, args: any[] = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    }
  };

  // Play / Pause sync
  useEffect(() => {
    if (!videoId) return;
    if (isPlaying) {
      sendCommand('playVideo');
    } else {
      sendCommand('pauseVideo');
    }
  }, [isPlaying, videoId]);

  // Volume & Mute sync
  useEffect(() => {
    if (!videoId) return;
    if (isMuted) {
      sendCommand('mute');
    } else {
      sendCommand('unMute');
      sendCommand('setVolume', [Math.round(volume * 100)]);
    }
  }, [volume, isMuted, videoId]);

  // Seek sync
  useEffect(() => {
    if (seekTime !== null && videoId) {
      sendCommand('seekTo', [seekTime, true]);
    }
  }, [seekTime, videoId]);

  // Message listener from YouTube iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && data.event === 'infoDelivery' && data.info) {
          const info = data.info;
          if (typeof info.currentTime === 'number') {
            const dur = typeof info.duration === 'number' && info.duration > 0 ? info.duration : 180;
            onTimeUpdate(info.currentTime, dur);
          }
          if (info.playerState === 0) {
            // ENDED
            onEnded();
          }
        }
      } catch {}
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onTimeUpdate, onEnded]);

  if (!videoId) return null;

  return (
    <div className="fixed bottom-0 right-0 w-1 h-1 opacity-0 pointer-events-none overflow-hidden z-[-1]">
      <iframe
        ref={iframeRef}
        key={videoId}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(
          window.location.origin
        )}&controls=0&disablekb=1&fs=0&playsinline=1`}
        title="Full Audio Player"
        allow="autoplay; encrypted-media"
        onLoad={() => {
          isReadyRef.current = true;
          // Prompt video to play & set volume
          setTimeout(() => {
            if (isMuted) {
              sendCommand('mute');
            } else {
              sendCommand('unMute');
              sendCommand('setVolume', [Math.round(volume * 100)]);
            }
            if (isPlaying) {
              sendCommand('playVideo');
            }
          }, 300);
        }}
      />
    </div>
  );
};
