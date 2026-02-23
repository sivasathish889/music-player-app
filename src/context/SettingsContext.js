import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    loadDownloads,
    downloadSong,
    deleteDownload,
    deleteAllDownloads,
    getDownloadStorageSize,
    formatBytes,
} from '../services/DownloadService';

const SettingsContext = createContext(null);

export const QUALITY_OPTIONS = [
    { id: 'low', label: 'Low', description: '64 kbps · Saves data', bitrate: 64 },
    { id: 'normal', label: 'Normal', description: '128 kbps · Balanced', bitrate: 128 },
    { id: 'high', label: 'High', description: '256 kbps · Better sound', bitrate: 256 },
    { id: 'ultra', label: 'Ultra', description: '320 kbps · Best quality', bitrate: 320 },
];

const PREF_KEY = '@rhythm_settings_prefs';

const PREF_DEFAULTS = {
    streamingQuality: 'high',
    downloadQuality: 'high',
    downloadOverWifiOnly: true,
    autoDownloadLiked: false,
    crossfade: false,
    normalizeVolume: true,
    showLyrics: true,
    darkMode: true,
    notifications: true,
};

export const SettingsProvider = ({ children }) => {
    const [prefs, setPrefs] = useState(PREF_DEFAULTS);
    const [downloads, setDownloads] = useState([]);       // array of download record objects
    const [downloadProgress, setDownloadProgress] = useState({}); // { [songId]: 0-1 }
    const [downloading, setDownloading] = useState({});  // { [songId]: true }
    const [storageUsed, setStorageUsed] = useState('0 B');
    const [loaded, setLoaded] = useState(false);

    // ── Boot: load prefs + downloads ─────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const [rawPrefs, fetchedDownloads] = await Promise.all([
                    AsyncStorage.getItem(PREF_KEY),
                    loadDownloads(),
                ]);
                if (rawPrefs) setPrefs({ ...PREF_DEFAULTS, ...JSON.parse(rawPrefs) });
                setDownloads(fetchedDownloads);
                refreshStorage(fetchedDownloads);
            } catch (e) {
                console.warn('[SettingsContext] boot error:', e.message);
            } finally {
                setLoaded(true);
            }
        })();
    }, []);

    const refreshStorage = async (list) => {
        try {
            const bytes = await getDownloadStorageSize();
            setStorageUsed(formatBytes(bytes));
        } catch (_) { }
    };

    // ── Update a preference ───────────────────────────────────────
    const updateSetting = useCallback(async (key, value) => {
        setPrefs((prev) => {
            const updated = { ...prev, [key]: value };
            AsyncStorage.setItem(PREF_KEY, JSON.stringify(updated)).catch(() => { });
            return updated;
        });
    }, []);

    const resetSettings = useCallback(async () => {
        setPrefs(PREF_DEFAULTS);
        await AsyncStorage.removeItem(PREF_KEY);
    }, []);

    // ── Download a song ───────────────────────────────────────────
    const startDownload = useCallback(async (song) => {
        if (downloading[song._id]) return; // already in progress

        setDownloading((prev) => ({ ...prev, [song._id]: true }));
        setDownloadProgress((prev) => ({ ...prev, [song._id]: 0 }));

        try {
            const record = await downloadSong(song, ({ songId, progress }) => {
                setDownloadProgress((prev) => ({ ...prev, [songId]: progress }));
            });
            setDownloads((prev) => {
                const existing = prev.findIndex((d) => d.id === record.id);
                const updated = existing >= 0
                    ? prev.map((d, i) => i === existing ? record : d)
                    : [...prev, record];
                refreshStorage(updated);
                return updated;
            });
            return { success: true, record };
        } catch (e) {
            return { success: false, error: e.message };
        } finally {
            setDownloading((prev) => {
                const next = { ...prev };
                delete next[song._id];
                return next;
            });
            setDownloadProgress((prev) => {
                const next = { ...prev };
                delete next[song._id];
                return next;
            });
        }
    }, [downloading]);

    // ── Remove a download ─────────────────────────────────────────
    const removeDownload = useCallback(async (songId) => {
        const updated = await deleteDownload(songId);
        setDownloads(updated);
        refreshStorage(updated);
    }, []);

    // ── Clear all downloads ───────────────────────────────────────
    const clearAllDownloads = useCallback(async () => {
        const updated = await deleteAllDownloads();
        setDownloads(updated);
        setStorageUsed('0 B');
    }, []);

    // ── Helpers ───────────────────────────────────────────────────
    const isDownloaded = useCallback((songId) =>
        downloads.some((d) => d.id === songId),
        [downloads]
    );

    const getDownloadRecord = useCallback((songId) =>
        downloads.find((d) => d.id === songId) || null,
        [downloads]
    );

    const isDownloading = useCallback((songId) => !!downloading[songId], [downloading]);

    const getProgress = useCallback((songId) => downloadProgress[songId] || 0, [downloadProgress]);

    // Expose the combined settings object shape that SettingsScreen reads
    const settings = { ...prefs };

    return (
        <SettingsContext.Provider value={{
            settings,
            loaded,
            updateSetting,
            resetSettings,
            // Downloads
            downloads,
            storageUsed,
            startDownload,
            removeDownload,
            clearAllDownloads,
            isDownloaded,
            getDownloadRecord,
            isDownloading,
            getProgress,
            QUALITY_OPTIONS,
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => useContext(SettingsContext);
