import { Track } from '../types/music';

export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface LyricsData {
  plainLyrics?: string;
  syncedLyrics?: LyricLine[];
  isSynced: boolean;
  isInstrumental?: boolean;
}

const lyricsCache = new Map<string, LyricsData | null>();

/**
 * Parses LRC format strings:
 * [00:12.34] Lyrics text here
 */
export function parseLRC(lrcText: string): LyricLine[] {
  if (!lrcText) return [];
  const lines = lrcText.split('\n');
  const result: LyricLine[] = [];

  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const matches = Array.from(trimmed.matchAll(timeRegex));
    if (matches.length > 0) {
      const text = trimmed.replace(timeRegex, '').trim();
      for (const match of matches) {
        const min = parseInt(match[1], 10);
        const sec = parseInt(match[2], 10);
        const ms = parseFloat(`0.${match[3]}`);
        const totalSec = min * 60 + sec + ms;
        result.push({ time: totalSec, text });
      }
    }
  }

  // Sort chronologically
  return result.sort((a, b) => a.time - b.time);
}

/**
 * Cleans track titles from extra metadata (e.g. "(Remastered)", "- Radio Edit")
 */
function cleanSongTitle(title: string): string {
  return title
    .replace(/\s*[\(\[](feat|ft|with|remix|remaster|radio edit|version|en vivo|live)[\.\s\)].*?[\)\]]/gi, '')
    .replace(/\s*-\s*(feat|ft|remaster|version|en vivo).*$/gi, '')
    .trim();
}

/**
 * Fetches synced or plain lyrics from LRCLIB (open, free, public API without auth)
 */
export async function getTrackLyrics(track: Track): Promise<LyricsData | null> {
  const cacheKey = `${track.artist.toLowerCase()}::${track.title.toLowerCase()}`;
  if (lyricsCache.has(cacheKey)) {
    return lyricsCache.get(cacheKey)!;
  }

  const cleanTitle = cleanSongTitle(track.title);
  const artist = encodeURIComponent(track.artist.trim());
  const title = encodeURIComponent(cleanTitle);

  // 1. Try exact match on lrclib.net
  try {
    const durParam = track.duration ? `&duration=${Math.round(track.duration)}` : '';
    const res = await fetch(`https://lrclib.net/api/get?artist_name=${artist}&track_name=${title}${durParam}`, {
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = await res.json();
      if (data && !data.error) {
        const synced = data.syncedLyrics ? parseLRC(data.syncedLyrics) : undefined;
        const result: LyricsData = {
          plainLyrics: data.plainLyrics || (synced ? synced.map((l) => l.text).join('\n') : undefined),
          syncedLyrics: synced && synced.length > 0 ? synced : undefined,
          isSynced: Boolean(synced && synced.length > 0),
          isInstrumental: Boolean(data.instrumental),
        };
        lyricsCache.set(cacheKey, result);
        return result;
      }
    }
  } catch {}

  // 2. Try general search on lrclib.net
  try {
    const q = encodeURIComponent(`${track.artist} ${cleanTitle}`);
    const searchRes = await fetch(`https://lrclib.net/api/search?q=${q}`, {
      signal: AbortSignal.timeout(4000),
    });

    if (searchRes.ok) {
      const list = await searchRes.json();
      if (Array.isArray(list) && list.length > 0) {
        const match = list.find((item) => item.syncedLyrics || item.plainLyrics) || list[0];
        if (match && (match.syncedLyrics || match.plainLyrics)) {
          const synced = match.syncedLyrics ? parseLRC(match.syncedLyrics) : undefined;
          const result: LyricsData = {
            plainLyrics: match.plainLyrics || (synced ? synced.map((l) => l.text).join('\n') : undefined),
            syncedLyrics: synced && synced.length > 0 ? synced : undefined,
            isSynced: Boolean(synced && synced.length > 0),
            isInstrumental: Boolean(match.instrumental),
          };
          lyricsCache.set(cacheKey, result);
          return result;
        }
      }
    }
  } catch {}

  lyricsCache.set(cacheKey, null);
  return null;
}
