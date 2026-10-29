import { Track } from '../types/music';

const STORAGE_KEY = 'deezer_musicgrabber_host';
export const DEFAULT_MUSICGRABBER_HOST = 'http://192.168.1.45:5000';
export const LOCALHOST_MUSICGRABBER_HOST = 'http://localhost:5000';

/**
 * Gets the configured MusicGrabber server host
 */
export function getMusicGrabberHost(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_MUSICGRABBER_HOST;
  } catch {
    return DEFAULT_MUSICGRABBER_HOST;
  }
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
 * Tests connection to the local MusicGrabber Flask server
 */
export async function checkMusicGrabberConnection(
  host = getMusicGrabberHost()
): Promise<{ isOnline: boolean; message: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    // Using mode 'no-cors' allows checking if the server at that IP/port responds
    await fetch(host, {
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    return {
      isOnline: true,
      message: `Servidor activo en ${host}`,
    };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return {
        isOnline: false,
        message: `Tiempo de espera agotado al conectar a ${host}`,
      };
    }
    return {
      isOnline: false,
      message: `No se pudo conectar a ${host}. Verifica que run_windows.bat o run_mac_linux esté en ejecución.`,
    };
  }
}
