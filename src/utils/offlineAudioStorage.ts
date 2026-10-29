import { Track } from '../types/music';
import { getTrackDetails } from './deezerService';

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
 * Retrieves the stored audio blob for a track
 */
export async function getOfflineAudioBlob(trackId: string): Promise<Blob | null> {
  try {
    const db = await getDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(trackId);

      req.onsuccess = () => {
        const record = req.result as OfflineTrackRecord | undefined;
        if (record && record.audioBlob) {
          resolve(record.audioBlob);
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
 * Checks if a track is cached offline in IndexedDB
 */
export async function isTrackOffline(trackId: string): Promise<boolean> {
  try {
    const db = await getDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getKey(trackId);

      req.onsuccess = () => {
        resolve(req.result !== undefined);
      };

      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Gets all track IDs that have offline audio stored
 */
export async function getAllOfflineTrackIds(): Promise<Set<string>> {
  try {
    const db = await getDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAllKeys();

      req.onsuccess = () => {
        const keys = req.result as string[];
        resolve(new Set(keys));
      };

      req.onerror = () => resolve(new Set());
    });
  } catch {
    return new Set();
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
 * Downloads and caches all tracks of a playlist into IndexedDB for 100% offline playback.
 * Supports concurrent batching for speed and cancellation checks without blocking the UI.
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
  const CONCURRENCY = 3;
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < tracks.length) {
      if (isCancelled?.()) break;
      const i = currentIndex++;
      const t = tracks[i];
      if (!t) break;

      onProgress?.(completedCount + 1, total, `${t.artist} - ${t.title}`, t.id);

      try {
        let blob = await getOfflineAudioBlob(t.id);
        if (!blob) {
          let previewUrl = t.previewUrl;
          if (!previewUrl) {
            const details = await getTrackDetails(t);
            previewUrl = details.previewUrl;
          }
          if (previewUrl && !isCancelled?.()) {
            const res = await fetch(previewUrl);
            if (res.ok) {
              blob = await res.blob();
              await saveOfflineAudio(t, blob);
            }
          }
        }

        if (blob) {
          savedIds.push(t.id);
          onTrackSaved?.(t.id);
        }
      } catch (e) {
        console.warn('Error saving offline track in playlist batch', t.id, e);
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
