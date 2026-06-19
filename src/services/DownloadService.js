import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DOWNLOADS_KEY = '@rhythm_downloads_v2';
const DOWNLOAD_DIR = FileSystem.documentDirectory + 'rhythm_downloads/';

// ── Ensure the downloads directory exists ───────────────────────
const ensureDir = async () => {
    console.log(DOWNLOAD_DIR);
    const info = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
    if (!info.exists) {
        await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
    }
};

// ── Load all download records from storage ──────────────────────
export const loadDownloads = async () => {
    try {
        const raw = await AsyncStorage.getItem(DOWNLOADS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.warn('[DownloadService] loadDownloads error:', e.message);
        return [];
    }
};

// ── Save download records to storage ────────────────────────────
const saveDownloads = async (downloads) => {
    await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloads));
};

// ── Check if a song is downloaded ───────────────────────────────
export const isDownloaded = async (songId) => {
    const downloads = await loadDownloads();
    return downloads.some((d) => d.id === songId);
};

// ── Get local file URI for a song ───────────────────────────────
export const getLocalUri = async (songId) => {
    const downloads = await loadDownloads();
    const record = downloads.find((d) => d.id === songId);
    if (!record) return null;
    const info = await FileSystem.getInfoAsync(record.localUri);
    return info.exists ? record.localUri : null;
};

// ── Download a song ─────────────────────────────────────────────
/**
 * @param {object} song - Full song object from API
 * @param {function} onProgress - Called with { songId, progress: 0-1 }
 * @returns {object} download record
 */
export const downloadSong = async (song, onProgress) => {
    await ensureDir();

    // Sanitize filename
    const safeTitle = (song.title || 'song').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${song._id}_${safeTitle}.mp3`;
    const localUri = DOWNLOAD_DIR + fileName;

    // Check if already present
    const existing = await FileSystem.getInfoAsync(localUri);
    if (existing.exists) {
        return await _upsertRecord(song, localUri);
    }

    // Start download with progress tracking
    const downloadResumable = FileSystem.createDownloadResumable(
        song.audioUrl,
        localUri,
        {},
        (downloadProgress) => {
            const progress =
                downloadProgress.totalBytesWritten /
                downloadProgress.totalBytesExpectedToWrite;
            if (onProgress) onProgress({ songId: song._id, progress: isNaN(progress) ? 0 : progress });
        }
    );

    const result = await downloadResumable.downloadAsync();
    if (!result || result.status !== 200) {
        throw new Error('Download failed: server returned ' + (result?.status || 'unknown'));
    }

    return await _upsertRecord(song, localUri);
};

// ── Delete a downloaded song ─────────────────────────────────────
export const deleteDownload = async (songId) => {
    const downloads = await loadDownloads();
    const record = downloads.find((d) => d.id === songId);

    if (record) {
        try {
            const info = await FileSystem.getInfoAsync(record.localUri);
            if (info.exists) await FileSystem.deleteAsync(record.localUri, { idempotent: true });
        } catch (e) {
            console.warn('[DownloadService] deleteDownload file error:', e.message);
        }
    }

    const updated = downloads.filter((d) => d.id !== songId);
    await saveDownloads(updated);
    return updated;
};

// ── Delete all downloads ─────────────────────────────────────────
export const deleteAllDownloads = async () => {
    try {
        const info = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
        if (info.exists) {
            await FileSystem.deleteAsync(DOWNLOAD_DIR, { idempotent: true });
        }
    } catch (e) {
        console.warn('[DownloadService] deleteAll error:', e.message);
    }
    await saveDownloads([]);
    return [];
};

// ── Get total size used by downloads ────────────────────────────
export const getDownloadStorageSize = async () => {
    const downloads = await loadDownloads();
    let total = 0;
    for (const d of downloads) {
        try {
            const info = await FileSystem.getInfoAsync(d.localUri, { size: true });
            if (info.exists && info.size) total += info.size;
        } catch (_) { }
    }
    return total;
};

// ── Format bytes human-readable ─────────────────────────────────
export const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// ── Internal: upsert a download record ──────────────────────────
const _upsertRecord = async (song, localUri) => {
    const downloads = await loadDownloads();
    const record = {
        id: song._id,
        title: song.title,
        artist: song.artist,
        album: song.album || '',
        genre: song.genre || '',
        duration: song.duration || 0,
        coverImage: song.coverImage || null,
        audioUrl: song.audioUrl,
        localUri,
        downloadedAt: new Date().toISOString(),
    };

    const existing = downloads.findIndex((d) => d.id === song._id);
    if (existing >= 0) {
        downloads[existing] = record;
    } else {
        downloads.push(record);
    }

    await saveDownloads(downloads);
    return record;
};
