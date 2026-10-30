import { Track } from '../types/music';
import { getTrackDetails } from './deezerService';
import { fetchFullSongFromMusicGrabber } from './musicGrabberBridge';

const DB_NAME = 'deezer_offline_audio_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_tracks';

interface OfflineTrackRecord {
  id: string;
  track: Track;
  audioBlob: Blob;
  savedAt: number;
  fileSize: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });

  return dbPromise;
}

/**
 * Saves an audio blob into IndexedDB for offline in-app playback
 */
export async function saveOfflineAudio(track: Track, audioBlob: Blob): Promise<void> {
  try {
    const db = await getDB();
    const record: OfflineTrackRecord = {
      id: track.id,
      track: { ...track, isOfflineAvailable: true },
      audioBlob,
      savedAt: Date.now(),
      fileSize: audioBlob.size,
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(record);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to save offline audio to IndexedDB', err);
    throw err;
  }
}

/**
 * Retrieves the stored audio blob for a track.
 * Enforces that only authentic full songs (>= 1MB) or local audio files are returned.
 * Automatically deletes corrupted or 30-second preview clips on the fly.
 */
export async function getOfflineAudioBlob(trackId: string): Promise<Blob | null> {
  try {
    const db = await getDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(trackId);

      req.onsuccess = () => {
        const record = req.result as OfflineTrackRecord | undefined;
        if (record && record.audioBlob) {
          const isLocal = record.track?.type === 'Local' || record.id.startsWith('local-');
          const minSize = isLocal ? 400000 : 1000000;
          if (record.audioBlob.size >= minSize) {
            resolve(record.audioBlob);
          } else {
            // Automatically purge stale 30s preview snippet
            store.delete(trackId);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Retrieves the stored audio blob for a track and returns an Object URL
 */
export async function getOfflineAudioUrl(trackId: string): Promise<string | null> {
  try {
    const blob = await getOfflineAudioBlob(trackId);
    if (blob) {
      return URL.createObjectURL(blob);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Checks if a track is cached offline in IndexedDB with full-length audio
 */
export async function isTrackOffline(trackId: string): Promise<boolean> {
  try {
    const blob = await getOfflineAudioBlob(trackId);
    return blob !== null;
  } catch {
    return false;
  }
}

/**
 * Gets all track IDs that have legitimate full-song offline audio stored.
 * Filters out any 30s preview clips (< 1MB).
 */
export async function getAllOfflineTrackIds(): Promise<Set<string>> {
  try {
    const db = await getDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.openCursor();
      const validIds = new Set<string>();

      req.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
        if (cursor) {
          const record = cursor.value as OfflineTrackRecord;
          const isLocal = record.track?.type === 'Local' || record.id?.startsWith('local-');
          const minSize = isLocal ? 400000 : 1000000;
          const size = record.audioBlob?.size || record.fileSize || 0;
          if (size >= minSize) {
            validIds.add(record.id);
          }
          cursor.continue();
        } else {
          resolve(validIds);
        }
      };

      req.onerror = () => resolve(new Set());
    });
  } catch {
    return new Set();
  }
}

/**
 * Thoroughly scans IndexedDB and purges all 30-second clips or files < 1MB.
 * Leaves only authentic full songs or user-uploaded tracks.
 */
export async function purgeShortAudioCache(): Promise<{ purgedCount: number; remainingCount: number }> {
  try {
    const db = await getDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.openCursor();
      let purgedCount = 0;
      let remainingCount = 0;

      req.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
        if (cursor) {
          const record = cursor.value as OfflineTrackRecord;
          const isLocal = record.track?.type === 'Local' || record.id?.startsWith('local-');
          const minSize = isLocal ? 400000 : 1000000;
          const size = record.audioBlob?.size || record.fileSize || 0;

          if (!record.audioBlob || size < minSize) {
            cursor.delete();
            purgedCount++;
          } else {
            remainingCount++;
          }
          cursor.continue();
        } else {
          resolve({ purgedCount, remainingCount });
        }
      };

      req.onerror = () => resolve({ purgedCount: 0, remainingCount: 0 });
    });
  } catch (err) {
    console.error('Failed to purge short audio cache', err);
    return { purgedCount: 0, remainingCount: 0 };
  }
}

/**
 * Deletes a track's audio from IndexedDB
 */
export async function deleteOfflineAudio(trackId: string): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(trackId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to delete offline audio', err);
  }
}

/**
 * Imports user's local audio files (.mp3, .m4a, .wav, .flac) directly into the app
 */
export async function importLocalAudioFiles(
  files: FileList | File[],
  targetPlaylist = 'Descargas Locales'
): Promise<Track[]> {
  const importedTracks: Track[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.type.startsWith('audio/') && !/\.(mp3|m4a|wav|flac|ogg|aac)$/i.test(file.name)) {
      continue;
    }

    const cleanBaseName = file.name.replace(/\.[^/.]+$/, '');
    let artist = 'Artista Local';
    let title = cleanBaseName;

    // Detect "Artist - Title" format
    if (cleanBaseName.includes(' - ')) {
      const parts = cleanBaseName.split(' - ');
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }

    const trackId = `local-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`;
    const objectUrl = URL.createObjectURL(file);

    // Get duration via Audio element
    const duration = await new Promise<number>((resolve) => {
      const audio = new Audio();
      audio.src = objectUrl;
      audio.onloadedmetadata = () => {
        resolve(Math.round(audio.duration) || 180);
      };
      audio.onerror = () => resolve(180);
    });

    const newTrack: Track = {
      id: trackId,
      title,
      artist,
      album: 'Descargas Locales',
      playlist: targetPlaylist,
      type: 'Local',
      isrc: '',
      deezerId: '',
      previewUrl: objectUrl,
      duration,
      isFavorite: false,
      isOfflineAvailable: true,
      addedAt: Date.now(),
    };

    // Save into IndexedDB so it persists across reloads!
    try {
      await saveOfflineAudio(newTrack, file);
    } catch {}

    importedTracks.push(newTrack);
  }

  return importedTracks;
}

/**
 * Converts an AudioBuffer into a standard 16-bit PCM WAV audio Blob
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sample = 0;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // "RIFF"
  setUint32(0x46464952);
  setUint32(length - 8);
  // "WAVE"
  setUint32(0x45564157);
  // "fmt "
  setUint32(0x20746d66);
  setUint32(16); // subchunk 1 size
  setUint16(1); // PCM format
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // bits per sample
  // "data"
  setUint32(0x61746164);
  setUint32(length - pos - 4);

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/mpeg' });
}

/**
 * Retrieves the genuine full audio Blob (320 kbps) for a track:
 * 1. Returns cached full MP3 (> 1MB) or local user-uploaded file.
 * 2. Fetches complete 320 kbps audio from user's running MusicGrabber server.
 * NEVER returns cut 469 KB previews or synthetic tones.
 */
export async function fetchFullTrackAudioBlob(track: Track): Promise<Blob | null> {
  const cached = await getOfflineAudioBlob(track.id);
  // Verify it is a real song (> 1MB), not a 469KB preview
  if (cached && cached.size > 1000000) {
    return cached;
  }

  // If local user-uploaded MP3 file:
  if (track.type === 'Local' && cached && cached.size > 500000) {
    return cached;
  }

  // Try fetching full 320 kbps audio from user's running MusicGrabber server
  try {
    const fullBlob = await fetchFullSongFromMusicGrabber(track);
    if (fullBlob && fullBlob.size > 1000000) {
      await saveOfflineAudio(track, fullBlob);
      return fullBlob;
    }
  } catch {}

  return null;
}

/**
 * Legacy wrapper: calls fetchFullTrackAudioBlob strictly for full songs.
 * Never provides 30s preview clips for offline storage.
 */
export async function fetchOrGenerateTrackAudioBlob(
  track: Track,
  _allowPreview = false
): Promise<Blob | null> {
  const full = await fetchFullTrackAudioBlob(track);
  if (full && full.size >= 1000000) return full;
  return null;
}

/**
 * Completely purges all cached offline audio tracks from IndexedDB
 */
export async function clearAllOfflineAudio(): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Error clearing IndexedDB store, attempting full database reset', err);
    if (typeof window !== 'undefined' && window.indexedDB) {
      dbPromise = null;
      await new Promise<void>((resolve) => {
        const req = window.indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
      });
    }
  }
}

/**
 * Downloads and caches all tracks of a playlist into IndexedDB for 100% offline playback.
 * Operates in background with progress and persists actual audio blobs.
 * NEVER stores 30-second previews. Only complete songs (>= 1MB).
 */
export async function downloadAndSavePlaylistOffline(
  tracks: Track[],
  onProgress?: (current: number, total: number, trackTitle: string, currentTrackId?: string) => void,
  onTrackSaved?: (trackId: string) => void,
  isCancelled?: () => boolean
): Promise<string[]> {
  const savedIds: string[] = [];
  const total = tracks.length;
  if (total === 0) return savedIds;

  let completedCount = 0;
  const CONCURRENCY = 2;
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < tracks.length) {
      if (isCancelled?.()) break;
      const i = currentIndex++;
      const t = tracks[i];
      if (!t) break;

      onProgress?.(completedCount, total, `${t.artist} - ${t.title}`, t.id);

      try {
        let blob = await getOfflineAudioBlob(t.id);
        if (!blob || blob.size < 1000000) {
          blob = await fetchFullTrackAudioBlob(t);
        }
        if (blob && blob.size >= 1000000) {
          savedIds.push(t.id);
          onTrackSaved?.(t.id);
        }
      } catch (e) {
        console.warn('Error downloading track offline in batch', t.id, e);
      } finally {
        completedCount++;
        onProgress?.(completedCount, total, `${t.artist} - ${t.title}`, t.id);
      }
    }
  }

  const workers = Array.from({ length: Math.min(CONCURRENCY, tracks.length) }, () => worker());
  await Promise.all(workers);

  return savedIds;
}

/**
 * Removes all tracks in a playlist from offline storage
 */
export async function removePlaylistOffline(tracks: Track[]): Promise<void> {
  for (const t of tracks) {
    try {
      await deleteOfflineAudio(t.id);
    } catch {}
  }
}

