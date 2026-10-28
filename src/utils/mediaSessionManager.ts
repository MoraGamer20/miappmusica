import { Track } from '../types/music';

let wakeLock: any = null;

/**
 * Initializes and updates the browser's native MediaSession API.
 * This enables:
 * - Lock screen music playback controls on iOS & Android
 * - Desktop Notification Center / macOS Control Center media widget
 * - Continuous playback when switching tabs, apps, or locking the device (like Deezer & Spotify)
 */
export function updateMediaSession(
  track: Track | null,
  isPlaying: boolean,
  handlers: {
    onPlay: () => void;
    onPause: () => void;
    onNext: () => void;
    onPrevious: () => void;
    onSeek: (time: number) => void;
  }
) {
  if (typeof window === 'undefined' || !('mediaSession' in navigator)) {
    return;
  }

  if (!track) {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = 'none';
    releaseWakeLock();
    return;
  }

  // Update Media Metadata for OS Lock Screen
  const artworkUrl = track.coverUrl || '/pwa-512x512.png';
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist,
    album: track.album || track.playlist || 'Deezer Library',
    artwork: [
      { src: artworkUrl, sizes: '96x96', type: 'image/png' },
      { src: artworkUrl, sizes: '192x192', type: 'image/png' },
      { src: artworkUrl, sizes: '512x512', type: 'image/png' },
    ],
  });

  navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

  // Acquire or release screen/audio wake lock
  if (isPlaying) {
    requestWakeLock();
  } else {
    releaseWakeLock();
  }

  // Set action handlers
  try {
    navigator.mediaSession.setActionHandler('play', () => {
      handlers.onPlay();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      handlers.onPause();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      handlers.onPrevious();
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      handlers.onNext();
    });
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        handlers.onSeek(details.seekTime);
      }
    });
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const skipTime = details.seekOffset || 10;
      handlers.onSeek(Math.max(0, -skipTime));
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const skipTime = details.seekOffset || 10;
      handlers.onSeek(skipTime);
    });
  } catch (err) {
    console.warn('Some mediaSession action handlers not supported', err);
  }
}

/**
 * Updates playback position in OS lock screen scrubber
 */
export function updateMediaSessionPosition(currentTime: number, duration: number) {
  if (
    typeof window !== 'undefined' &&
    'mediaSession' in navigator &&
    navigator.mediaSession.setPositionState &&
    duration > 0 &&
    !isNaN(currentTime)
  ) {
    try {
      navigator.mediaSession.setPositionState({
        duration: Math.max(1, duration),
        playbackRate: 1,
        position: Math.min(currentTime, duration),
      });
    } catch {}
  }
}

/**
 * Screen WakeLock to prevent device from sleeping while playing
 */
async function requestWakeLock() {
  if (typeof window !== 'undefined' && 'wakeLock' in navigator && !wakeLock) {
    try {
      wakeLock = await (navigator as any).wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
      });
    } catch {}
  }
}

function releaseWakeLock() {
  if (wakeLock) {
    try {
      wakeLock.release();
    } catch {}
    wakeLock = null;
  }
}
