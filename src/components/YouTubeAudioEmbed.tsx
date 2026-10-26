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
  const localCurrentTimeRef = useRef(0);
  const lastPostMessageTimeRef = useRef(Date.now());

  // Send command to YouTube iframe via postMessage
  const sendCommand = (func: string, args: any[] = []) => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args }),
          '*'
        );
      }
    } catch {}
  };

  const sendListening = () => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'listening' }),
          '*'
        );
      }
    } catch {}
  };

  // Reset local clock when videoId changes
  useEffect(() => {
    localCurrentTimeRef.current = 0;
    lastPostMessageTimeRef.current = Date.now();
  }, [videoId]);

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
      localCurrentTimeRef.current = seekTime;
      sendCommand('seekTo', [seekTime, true]);
    }
  }, [seekTime, videoId]);

  // Polling loop: request current time from YouTube & provide fallback progression if blocked
  useEffect(() => {
    if (!videoId || !isPlaying) return;

    const interval = setInterval(() => {
      // 1. Send active polling commands to YouTube
      sendCommand('getCurrentTime');
      sendCommand('getDuration');
      sendListening();

      // 2. If YouTube postMessage is delayed or blocked by cross-origin security,
      // tick local progress forward so the UI progress bar advances smoothly
      const now = Date.now();
      if (now - lastPostMessageTimeRef.current > 1200) {
        localCurrentTimeRef.current += 0.5;
        onTimeUpdate(localCurrentTimeRef.current, 0);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [videoId, isPlaying, onTimeUpdate]);

  // Message listener from YouTube iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!data) return;

        lastPostMessageTimeRef.current = Date.now();

        // 1. YouTube standard infoDelivery payload
        if (data.event === 'infoDelivery' && data.info) {
          const info = data.info;
          let curr: number | null = null;
          let dur = 0;

          if (typeof info.currentTime === 'number') {
            curr = info.currentTime;
          }
          if (typeof info.duration === 'number' && info.duration > 0) {
            dur = info.duration;
          }

          if (curr !== null) {
            localCurrentTimeRef.current = curr;
            onTimeUpdate(curr, dur);
          }

          if (info.playerState === 0) {
            // Video has finished
            onEnded();
          }
        }

        // 2. Response to getCurrentTime command
        if (typeof data.info === 'number') {
          localCurrentTimeRef.current = data.info;
          onTimeUpdate(data.info, 0);
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
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&origin=${encodeURIComponent(
          window.location.origin
        )}&controls=0&disablekb=1&fs=0&playsinline=1`}
        title="Full Audio Player"
        allow="autoplay; encrypted-media"
        onLoad={() => {
          isReadyRef.current = true;
          sendListening();
          setTimeout(() => {
            sendListening();
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
