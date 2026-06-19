import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Share, Platform, NativeModules } from 'react-native';
import { Audio } from 'expo-av'; // Fallback for Expo Go
import { songAPI } from '../services/api';

const PlayerContext = createContext(null);

export const PlayerProvider = ({ children }) => {
    // ── Engines ───────────────────────────────────────────────
    const trackPlayerRef = useRef(null);
    const expoSoundRef = useRef(null);
    const isNativeMode = useRef(false);

    // ── State ──────────────────────────────────────────────────
    const [currentSong, setCurrentSong] = useState(null);
    const [queue, setQueue] = useState([]);
    const [originalQueue, setOriginalQueue] = useState([]);
    const [queueIndex, setQueueIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [duration, setDuration] = useState(0);
    const [position, setPosition] = useState(0);
    const [isRepeat, setIsRepeat] = useState(false);
    const [isShuffle, setIsShuffle] = useState(false);
    const [volume, setVolume] = useState(1.0);

    const positionUpdateInterval = useRef(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        setupPlayer();
        return () => {
            clearInterval(positionUpdateInterval.current);
            if (expoSoundRef.current) expoSoundRef.current.unloadAsync();
        };
    }, []);

    const setupPlayer = async () => {
        try {
            // Check for native module presence safely
            const nativeModuleFound = NativeModules.TrackPlayerModule;

            // NEVER load Native Track Player on Web or if native modules are missing (Expo Go)
            if (Platform.OS === 'web' || !nativeModuleFound) {
                throw new Error('TrackPlayer native module not available');
            }

            if (false) {
                // Removed Track Player completely
            } else {
                throw new Error('Native module incomplete or not linked');
            }
        } catch (e) {
            console.log('📦 Player Engine: Expo Go (Foreground Only)', e.message);
            isNativeMode.current = false;
            // Setup Expo Audio mode safely
            try {
                const { InterruptionModeIOS, InterruptionModeAndroid } = require('expo-av');
                await Audio.setAudioModeAsync({
                    staysActiveInBackground: true,
                    playsInSilentModeIOS: true,
                    interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                    shouldDuckAndroid: false,
                    interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                    playThroughEarpieceAndroid: false,
                });
            } catch (avErr) {
                console.warn('Expo AV setup issue:', avErr.message);
            }
        }
        setIsReady(true);
    };

    // ── Position Sync ──────────────────────────────────────────
    const startTracking = () => {
        clearInterval(positionUpdateInterval.current);
        positionUpdateInterval.current = setInterval(async () => {
            if (isNativeMode.current && trackPlayerRef.current) {
                const pos = await trackPlayerRef.current.getProgress();
                setPosition(pos.position);
                setDuration(pos.duration || 0);
            } else if (expoSoundRef.current) {
                const status = await expoSoundRef.current.getStatusAsync();
                if (status.isLoaded) {
                    setPosition(status.positionMillis / 1000);
                    setDuration(status.durationMillis / 1000);

                    // Auto-advance in Expo Mode
                    if (status.didJustFinish && !status.isLooping) {
                        playNext();
                    }
                }
            }
        }, 1000);
    };

    // ── Helper: Shuffle ────────────────────────────────────────
    const shuffleArray = (array) => {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    };

    // ── Actions ───────────────────────────────────────────────
    const playSong = async (song, songQueue = [], index = 0) => {
        setCurrentSong(song);
        const q = songQueue.length > 0 ? songQueue : [song];
        setOriginalQueue(q);

        if (isShuffle) {
            const shuffled = shuffleArray(q);
            const newIdx = shuffled.findIndex(s => s._id === song._id);
            setQueue(shuffled);
            setQueueIndex(newIdx);
        } else {
            setQueue(q);
            setQueueIndex(index);
        }

        setIsLoading(true);

        try {
            if (isNativeMode.current && trackPlayerRef.current) {
                const TP = trackPlayerRef.current;

                // Track logic skipped because TrackPlayer is removed

            } else {
                // EXPO FALLBACK
                if (expoSoundRef.current) await expoSoundRef.current.unloadAsync();
                const sound = new Audio.Sound();
                expoSoundRef.current = sound;

                await sound.loadAsync(
                    { uri: song.audioUrl },
                    { shouldPlay: true, volume, isLooping: isRepeat }
                );

                sound.setOnPlaybackStatusUpdate((status) => {
                    if (status.isLoaded) {
                        setIsPlaying(status.isPlaying);
                        if (status.didJustFinish && !status.isLooping) {
                            playNext();
                        }
                    }
                });
            }
            setIsPlaying(true);
            startTracking();
            try { await songAPI.trackPlay(song._id); } catch (e) { }
        } catch (error) {
            console.error('Playback error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const togglePlayPause = async () => {
        if (isNativeMode.current && trackPlayerRef.current) {
            isPlaying ? await trackPlayerRef.current.pause() : await trackPlayerRef.current.play();
        } else if (expoSoundRef.current) {
            isPlaying ? await expoSoundRef.current.pauseAsync() : await expoSoundRef.current.playAsync();
        }
        setIsPlaying(!isPlaying);
    };

    const playNext = async () => {
        if (queue.length === 0) return;
        const nextIdx = (queueIndex + 1) % queue.length;
        await playSong(queue[nextIdx], queue, nextIdx);
    };

    const playPrev = async () => {
        if (queue.length === 0) return;
        const prevIdx = queueIndex === 0 ? queue.length - 1 : queueIndex - 1;
        await playSong(queue[prevIdx], queue, prevIdx);
    };

    const seek = async (sec) => {
        if (isNativeMode.current) await trackPlayerRef.current.seekTo(sec);
        else if (expoSoundRef.current) await expoSoundRef.current.setPositionAsync(sec * 1000);
        setPosition(sec);
    };

    const toggleRepeat = async () => {
        const newVal = !isRepeat;
        setIsRepeat(newVal);
        if (false) { // track player removed

        } else if (expoSoundRef.current) {
            await expoSoundRef.current.setIsLoopingAsync(newVal);
        }
    };

    const toggleShuffle = () => {
        const newVal = !isShuffle;
        setIsShuffle(newVal);
        if (newVal) {
            const shuffled = shuffleArray(queue);
            const activeIdx = shuffled.findIndex(s => s._id === currentSong._id);
            setQueue(shuffled);
            setQueueIndex(activeIdx);
        } else {
            const originalIdx = originalQueue.findIndex(s => s._id === currentSong._id);
            setQueue(originalQueue);
            setQueueIndex(originalIdx);
        }
    };

    const shareSong = async () => {
        if (!currentSong) return;
        try {
            await Share.share({
                message: `Check out this song: ${currentSong.title} by ${currentSong.artist} on Antigravityt Music!`,
                url: currentSong.audioUrl,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    return (
        <PlayerContext.Provider value={{
            currentSong, queue, queueIndex, isPlaying, isLoading, duration, position,
            isRepeat, isShuffle, volume,
            playSong, togglePlayPause, playNext, playPrev, seek,
            toggleRepeat, toggleShuffle, shareSong,
            setPlayerVolume: (v) => setVolume(v),
        }}>
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => useContext(PlayerContext);
export default PlayerContext;
