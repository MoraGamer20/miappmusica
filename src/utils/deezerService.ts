import { Track } from '../types/music';

interface DeezerTrackResponse {
  id: number;
  title: string;
  duration?: number;
  preview?: string;
  artist?: {
    id: number;
    name: string;
    picture_medium?: string;
    picture_big?: string;
  };
  album?: {
    id: number;
    title: string;
    cover_medium?: string;
    cover_big?: string;
    cover_xl?: string;
  };
  link?: string;
}

// In-memory cache for track metadata & preview URLs
const trackCache = new Map<string, { previewUrl?: string; coverUrl?: string; duration?: number }>();

/**
 * Loads cached values from localStorage if available
 */
export function initTrackCache() {
  try {
    const saved = localStorage.getItem('deezer_track_cache_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      for (const [k, v] of Object.entries(parsed)) {
        trackCache.set(k, v as { previewUrl?: string; coverUrl?: string; duration?: number });
      }
    }
  } catch (err) {
    console.warn('Could not read track cache', err);
  }
}

function persistTrackCache() {
  try {
    const obj: Record<string, unknown> = {};
    // Store only up to 500 recent items to conserve quota
    let count = 0;
    for (const [k, v] of trackCache.entries()) {
      if (count++ > 500) break;
      obj[k] = v;
    }
    localStorage.setItem('deezer_track_cache_v1', JSON.stringify(obj));
  } catch {}
}

/**
 * Fetches real Deezer track details (audio preview mp3, cover art, duration).
 * Tries Vite proxy first, then iTunes Search API as fallback.
 */
export async function getTrackDetails(track: Track): Promise<{
  previewUrl?: string;
  coverUrl?: string;
  duration?: number;
}> {
  const cacheKey = track.deezerId || `${track.title}:${track.artist}`;

  if (trackCache.has(cacheKey)) {
    return trackCache.get(cacheKey)!;
  }

  // If track already has previewUrl and coverUrl populated, save and return
  if (track.previewUrl && track.coverUrl) {
    const res = { previewUrl: track.previewUrl, coverUrl: track.coverUrl, duration: track.duration };
    trackCache.set(cacheKey, res);
    return res;
  }

  // 1. Try Deezer track endpoint by ID
  if (track.deezerId && !isNaN(Number(track.deezerId))) {
    try {
      const response = await fetch(`/api/deezer/track/${track.deezerId}`, { signal: AbortSignal.timeout(4000) });
      if (response.ok) {
        const data: DeezerTrackResponse = await response.json();
        if (data && !('error' in data)) {
          const result = {
            previewUrl: data.preview,
            coverUrl: data.album?.cover_big || data.album?.cover_medium,
            duration: data.duration || track.duration,
          };
          trackCache.set(cacheKey, result);
          persistTrackCache();
          return result;
        }
      }
    } catch {}
  }

  // 2. Try Deezer search endpoint
  try {
    const query = encodeURIComponent(`${track.title} ${track.artist}`);
    const searchRes = await fetch(`/api/deezer/search?q=${query}&limit=1`, { signal: AbortSignal.timeout(4000) });
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData?.data?.length > 0) {
        const item = searchData.data[0];
        const result = {
          previewUrl: item.preview,
          coverUrl: item.album?.cover_big || item.album?.cover_medium,
          duration: item.duration || track.duration,
        };
        trackCache.set(cacheKey, result);
        persistTrackCache();
        return result;
      }
    }
  } catch {}

  // 3. Fallback to iTunes Search API (CORS enabled publicly worldwide)
  try {
    const itunesQuery = encodeURIComponent(`${track.title} ${track.artist}`);
    const itunesRes = await fetch(`https://itunes.apple.com/search?term=${itunesQuery}&entity=song&limit=1`, {
      signal: AbortSignal.timeout(3500),
    });
    if (itunesRes.ok) {
      const itunesData = await itunesRes.json();
      if (itunesData.resultCount > 0) {
        const song = itunesData.results[0];
        const result = {
          previewUrl: song.previewUrl,
          coverUrl: song.artworkUrl100 ? song.artworkUrl100.replace('100x100bb', '600x600bb') : undefined,
          duration: Math.round(song.trackTimeMillis / 1000),
        };
        trackCache.set(cacheKey, result);
        persistTrackCache();
        return result;
      }
    }
  } catch {}

  // Default fallback if not found
  const emptyResult = { previewUrl: undefined, coverUrl: undefined, duration: undefined };
  trackCache.set(cacheKey, emptyResult);
  return emptyResult;
}

/**
 * JSONP fetch helper for Deezer API in browsers without proxy
 */
function fetchDeezerJsonp(url: string, timeout = 4000): Promise<any> {
  return new Promise((resolve, reject) => {
    const callbackName = `deezer_cb_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const script = document.createElement('script');
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('JSONP timeout'));
    }, timeout);

    const cleanup = () => {
      clearTimeout(timer);
      if (script.parentNode) script.parentNode.removeChild(script);
      delete (window as any)[callbackName];
    };

    (window as any)[callbackName] = (data: any) => {
      cleanup();
      resolve(data);
    };

    const separator = url.includes('?') ? '&' : '?';
    script.src = `${url}${separator}output=jsonp&callback=${callbackName}`;
    script.onerror = () => {
      cleanup();
      reject(new Error('JSONP error'));
    };

    document.head.appendChild(script);
  });
}

/**
 * Search the online music catalog (Deezer API via proxy/JSONP and iTunes API fallback).
 * Works reliably in any environment including Vercel, static hosting, and localhost.
 */
export async function searchOnlineMusicCatalog(query: string): Promise<Track[]> {
  if (!query || query.trim().length < 2) return [];
  const cleanQuery = query.trim();
  const encoded = encodeURIComponent(cleanQuery);

  // 1. Try local proxy / Vercel proxy rewrite to Deezer API
  try {
    const res = await fetch(`/api/deezer/search?q=${encoded}&limit=25`, {
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.data) && data.data.length > 0) {
        return data.data.map((item: any, idx: number) => ({
          id: `deezer-${item.id || idx}-${Date.now()}`,
          title: item.title,
          artist: item.artist?.name || 'Artista desconocido',
          album: item.album?.title || 'Single',
          playlist: 'Biblioteca',
          type: 'Track',
          isrc: '',
          deezerId: String(item.id || ''),
          previewUrl: item.preview,
          coverUrl: item.album?.cover_big || item.album?.cover_medium,
          duration: item.duration,
          isFavorite: false,
        }));
      }
    }
  } catch {
    // Proceed to fallbacks
  }

  // 2. Try Deezer JSONP (direct client-side without CORS restrictions)
  try {
    const jsonpData = await fetchDeezerJsonp(`https://api.deezer.com/search?q=${encoded}&limit=25`, 3500);
    if (Array.isArray(jsonpData?.data) && jsonpData.data.length > 0) {
      return jsonpData.data.map((item: any, idx: number) => ({
        id: `deezer-jsonp-${item.id || idx}-${Date.now()}`,
        title: item.title,
        artist: item.artist?.name || 'Artista desconocido',
        album: item.album?.title || 'Single',
        playlist: 'Biblioteca',
        type: 'Track',
        isrc: '',
        deezerId: String(item.id || ''),
        previewUrl: item.preview,
        coverUrl: item.album?.cover_big || item.album?.cover_medium,
        duration: item.duration,
        isFavorite: false,
      }));
    }
  } catch {
    // Proceed to iTunes fallback
  }

  // 3. Fallback: iTunes Search API (Universal CORS enabled, fast worldwide CDN, 600x600 covers)
  try {
    const itunesRes = await fetch(
      `https://itunes.apple.com/search?term=${encoded}&entity=song&limit=30`,
      { signal: AbortSignal.timeout(4000) }
    );
    if (itunesRes.ok) {
      const itunesData = await itunesRes.json();
      if (Array.isArray(itunesData?.results) && itunesData.results.length > 0) {
        return itunesData.results.map((item: any, idx: number) => ({
          id: `itunes-${item.trackId || idx}-${Date.now()}`,
          title: item.trackName || cleanQuery,
          artist: item.artistName || 'Artista desconocido',
          album: item.collectionName || 'Single',
          playlist: 'Biblioteca',
          type: 'Track',
          isrc: item.isrc || '',
          deezerId: String(item.trackId || ''),
          previewUrl: item.previewUrl,
          coverUrl: item.artworkUrl100
            ? item.artworkUrl100.replace('100x100bb', '600x600bb')
            : undefined,
          duration: Math.round((item.trackTimeMillis || 180000) / 1000),
          isFavorite: false,
        }));
      }
    }
  } catch (err) {
    console.error('All online music search methods failed', err);
  }

  return [];
}

/**
 * Alias for backward compatibility
 */
export const searchDeezerCatalog = searchOnlineMusicCatalog;

