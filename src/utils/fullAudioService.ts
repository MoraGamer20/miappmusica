import { Track } from '../types/music';

// Cache for resolved YouTube video IDs
const videoIdCache = new Map<string, string>();

/**
 * Initializes video cache from localStorage
 */
export function initVideoIdCache() {
  try {
    const saved = localStorage.getItem('deezer_yt_videoid_cache_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      for (const [k, v] of Object.entries(parsed)) {
        videoIdCache.set(k, v as string);
      }
    }
  } catch {}
}

function persistVideoIdCache() {
  try {
    const obj: Record<string, string> = {};
    let count = 0;
    for (const [k, v] of videoIdCache.entries()) {
      if (count++ > 600) break;
      obj[k] = v;
    }
    localStorage.setItem('deezer_yt_videoid_cache_v1', JSON.stringify(obj));
  } catch {}
}

/**
 * Finds the official YouTube full-length audio/video ID for a track.
 */
export async function getFullTrackVideoId(track: Track): Promise<string | null> {
  const cacheKey = `${track.title.toLowerCase().trim()}::${track.artist.toLowerCase().trim()}`;

  if (videoIdCache.has(cacheKey)) {
    return videoIdCache.get(cacheKey)!;
  }

  try {
    const query = encodeURIComponent(`${track.artist} ${track.title} audio official`);
    const res = await fetch(`/api/full-audio/search?q=${query}`, {
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.videoId) {
        videoIdCache.set(cacheKey, data.videoId);
        persistVideoIdCache();
        return data.videoId;
      }
    }
  } catch (err) {
    // Proceed to fallback
  }

  // Fallback: Query public Invidious instance (CORS friendly)
  const invidiousInstances = [
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://vid.puffyan.us',
  ];

  for (const instance of invidiousInstances) {
    try {
      const query = encodeURIComponent(`${track.artist} ${track.title}`);
      const invRes = await fetch(`${instance}/api/v1/search?q=${query}&type=video`, {
        signal: AbortSignal.timeout(3000),
      });
      if (invRes.ok) {
        const invData = await invRes.json();
        if (Array.isArray(invData) && invData.length > 0 && invData[0].videoId) {
          const vid = invData[0].videoId;
          videoIdCache.set(cacheKey, vid);
          persistVideoIdCache();
          return vid;
        }
      }
    } catch {
      // Try next instance
    }
  }

  return null;
}

export interface FullTrackDetails {
  videoId: string | null;
  title: string;
  duration?: string;
  channel?: string;
  youtubeUrl: string;
  directDownloadUrl: string;
  backupDownloadUrl: string;
}

/**
 * Resolves full-length track details (videoId, verified duration, clean title)
 */
export async function getFullTrackDetails(track: Track): Promise<FullTrackDetails> {
  const videoId = await getFullTrackVideoId(track);
  const cacheKey = `${track.title.toLowerCase().trim()}::${track.artist.toLowerCase().trim()}`;
  
  // Try retrieving cached metadata or query endpoint
  let resolvedTitle = `${track.artist} - ${track.title}`;
  let duration: string | undefined = undefined;
  let channel: string | undefined = track.artist;

  try {
    const query = encodeURIComponent(`${track.artist} ${track.title} audio official`);
    const res = await fetch(`/api/full-audio/search?q=${query}`, {
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.title) resolvedTitle = data.title;
      if (data.duration) duration = data.duration;
      if (data.channel) channel = data.channel;
    }
  } catch {}

  const ytUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(`${track.artist} ${track.title}`)}`;
  
  return {
    videoId,
    title: resolvedTitle,
    duration,
    channel,
    youtubeUrl: ytUrl,
    directDownloadUrl: videoId ? `https://yout.com/video/${videoId}` : `https://yout.com/`,
    backupDownloadUrl: `https://dirpy.com/studio?url=${encodeURIComponent(ytUrl)}`,
  };
}

/**
 * Generates direct full-song download portals and 1-click links for mobile.
 */
export function getFullDownloadLinks(track: Track, videoId: string | null) {
  const query = encodeURIComponent(`${track.artist} ${track.title}`);
  const ytUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : `https://www.youtube.com/results?search_query=${query}`;

  return {
    youtubeUrl: ytUrl,
    cobaltUrl: `https://cobalt.tools/`,
    youtUrl: videoId ? `https://yout.com/video/${videoId}` : `https://yout.com/`,
    dirpyUrl: `https://dirpy.com/studio?url=${encodeURIComponent(ytUrl)}`,
    ezmp3Url: videoId ? `https://ezmp3.cc/` : `https://ezmp3.cc/`,
  };
}

