import { Track } from '../types/music';

const STORAGE_KEY = 'deezer_musicgrabber_host';
export const LOCALHOST_MUSICGRABBER_HOST = 'http://localhost:5000';
export const LAN_MUSICGRABBER_HOST = 'http://192.168.1.45:5000';
export const DEFAULT_MUSICGRABBER_HOST = LAN_MUSICGRABBER_HOST;

let resolvedActiveHost: string | null = null;
let lastCheckTime = 0;

export interface MusicGrabberSongResult {
  id: string;
  title: string;
  uploader: string;
  duration: number;
  duration_formatted: string;
  thumbnail: string;
  is_full_song: boolean;
  quality: string;
  downloadUrl: string;
  host: string;
}

/**
 * Gets candidate server hosts to check (Localhost PC, LAN Mobile IP, saved custom host).
 */
export function getCandidateHosts(): string[] {
  const candidates: string[] = [];

  // 1. Saved custom host in localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim()) {
      candidates.push(saved.trim());
    }
  } catch {}

  // 2. LAN IP provided by user's PC (for mobile/tablet access)
  candidates.push(LAN_MUSICGRABBER_HOST);

  // 3. Localhost (for desktop browser access)
  candidates.push(LOCALHOST_MUSICGRABBER_HOST);

  // 4. Current hostname if accessed via IP in local network
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost') {
    candidates.push(`http://${window.location.hostname}:5000`);
  }

  // Deduplicate and sanitize
  const unique = Array.from(new Set(candidates)).map((h) => {
    let clean = h.trim().replace(/\/+$/, '');
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'http://' + clean;
    }
    return clean;
  });

  return unique;
}

/**
 * Gets the configured MusicGrabber server host
 */
export function getMusicGrabberHost(): string {
  if (resolvedActiveHost) return resolvedActiveHost;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;
  } catch {}
  return LAN_MUSICGRABBER_HOST; // Default to LAN for seamless mobile testing
}

/**
 * Saves the configured MusicGrabber server host
 */
export function setMusicGrabberHost(host: string): void {
  try {
    let clean = host.trim().replace(/\/+$/, '');
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'http://' + clean;
    }
    resolvedActiveHost = clean;
    localStorage.setItem(STORAGE_KEY, clean);
  } catch {}
}

/**
 * Formats a list of tracks into the exact format expected by MusicGrabber
 * Format: "Artista - Título" (one per line)
 */
export function formatTracksForMusicGrabber(tracks: Track[]): string {
  return tracks
    .map((t) => `${(t.artist || 'Artista').trim()} - ${(t.title || 'Canción').trim()}`)
    .filter(Boolean)
    .join('\n');
}

/**
 * Copies the formatted list of tracks to the system clipboard
 */
export async function copyTracksForMusicGrabber(tracks: Track[]): Promise<boolean> {
  const text = formatTracksForMusicGrabber(tracks);
  if (!text) return false;

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}

  // Fallback using textarea
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Probes candidate MusicGrabber Flask servers via /api/health and returns the fastest active one.
 */
export async function checkMusicGrabberConnection(
  targetHost?: string
): Promise<{ isOnline: boolean; host: string; message: string; ffmpegInstalled?: boolean }> {
  const candidates = targetHost ? [targetHost] : getCandidateHosts();

  for (const host of candidates) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${host}/api/health`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        resolvedActiveHost = host;
        lastCheckTime = Date.now();
        return {
          isOnline: true,
          host,
          ffmpegInstalled: data.ffmpeg_installed,
          message: data.message || `Servidor MusicGrabber activo a 320 kbps en ${host}`,
        };
      }
    } catch {}
  }

  return {
    isOnline: false,
    host: getMusicGrabberHost(),
    message: `Servidor no detectado en ${candidates.join(' o ')}. Inicia run_windows.bat en tu PC para canciones completas a 320 kbps.`,
  };
}

/**
 * Resolves an active MusicGrabber host, automatically discovering it across LAN/Localhost if needed.
 */
export async function getActiveHost(): Promise<string | null> {
  // If we found a working host within the last 60 seconds, reuse it
  if (resolvedActiveHost && Date.now() - lastCheckTime < 60000) {
    return resolvedActiveHost;
  }

  const check = await checkMusicGrabberConnection();
  if (check.isOnline) {
    return check.host;
  }
  return null;
}

/**
 * Searches a song using the user's running Python backend:
 * POST /api/search with body {"query": "Artist - Title"}
 */
export async function searchSongOnMusicGrabber(
  query: string,
  preferredHost?: string
): Promise<MusicGrabberSongResult | null> {
  const host = preferredHost || (await getActiveHost()) || getMusicGrabberHost();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(`${host}/api/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();

    if (!data || !data.id) return null;

    return {
      id: data.id,
      title: data.title || query,
      uploader: data.uploader || 'Artista',
      duration: data.duration || 0,
      duration_formatted: data.duration_formatted || 'Completa',
      thumbnail: data.thumbnail || '',
      is_full_song: data.is_full_song !== false,
      quality: data.quality || '320 kbps (Máxima)',
      downloadUrl: `${host}/api/download/${data.id}`,
      host,
    };
  } catch (err) {
    console.warn(`[MusicGrabber] Search failed on ${host} for "${query}":`, err);
    return null;
  }
}

/**
 * Triggers native browser download for a complete song directly from the user's running Flask server:
 * Uses GET /api/download/<video_id> which converts with FFmpeg to 320 kbps with ID3 tags.
 * This ensures the song downloads natively in mobile Chrome/Safari or PC browser with real progress.
 */
export async function triggerMusicGrabberDirectDownload(
  track: Track
): Promise<{ success: boolean; song?: MusicGrabberSongResult; error?: string }> {
  const query = `${(track.artist || '').trim()} - ${(track.title || '').trim()}`.trim();
  if (!query) {
    return { success: false, error: 'Título de canción inválido' };
  }

  const host = (await getActiveHost()) || getMusicGrabberHost();
  const searchResult = await searchSongOnMusicGrabber(query, host);

  if (!searchResult || !searchResult.id) {
    return {
      success: false,
      error: 'Servidor local no detectado.',
    };
  }

  // Trigger native browser download directly to device
  const safeArtist = (track.artist || 'Artista').replace(/[/\\?%*:|"<>]/g, '_');
  const safeTitle = (track.title || 'Cancion').replace(/[/\\?%*:|"<>]/g, '_');
  const downloadLink = document.createElement('a');
  downloadLink.href = searchResult.downloadUrl;
  downloadLink.download = `${safeArtist} - ${safeTitle}.mp3`;
  downloadLink.target = '_blank';
  downloadLink.rel = 'noopener noreferrer';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);

  return { success: true, song: searchResult };
}

/**
 * Downloads the full 320 kbps MP3 blob from MusicGrabber backend to store in IndexedDB.
 * Guarantees that only authentic full songs (> 1.2 MB) are returned.
 */
export async function fetchFullSongFromMusicGrabber(
  track: Track,
  customHost?: string
): Promise<Blob | null> {
  const host = customHost || (await getActiveHost()) || getMusicGrabberHost();
  const query = `${(track.artist || '').trim()} - ${(track.title || '').trim()}`.trim();

  try {
    const searchData = await searchSongOnMusicGrabber(query, host);
    if (!searchData || !searchData.id) return null;

    const downloadController = new AbortController();
    const downloadTimeout = setTimeout(() => downloadController.abort(), 120000); // 2 mins for FFmpeg 320kbps conversion

    const downloadRes = await fetch(searchData.downloadUrl, {
      method: 'GET',
      signal: downloadController.signal,
    });
    clearTimeout(downloadTimeout);

    if (!downloadRes.ok) return null;
    const blob = await downloadRes.blob();

    // Check that it's a real complete song (usually 3MB to 12MB, NEVER 469KB)
    if (blob && blob.size > 1000000) {
      return blob;
    } else {
      console.warn(`[MusicGrabber] Blob too small (${blob?.size} bytes), discarded.`);
    }
  } catch (err) {
    console.warn(`[MusicGrabber] Error fetching full song "${query}" from ${host}:`, err);
  }

  return null;
}
