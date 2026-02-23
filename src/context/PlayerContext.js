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
            const hasNativePlayer = !!NativeModules.TrackPlayerModule;

            // NEVER load Native Track Player on Web or if native modules are missing (Expo Go)
            if (Platform.OS === 'web' || !hasNativePlayer) {
                throw new Error('TrackPlayer native module not available');
            }

            // Attempt to load Native Track Player
            const TP = require('react-native-track-player');
            const TrackPlayer = TP.default || TP;

            // Robust check for TrackPlayer and Capability object
            if (TrackPlayer && TrackPlayer.setupPlayer && TP.Capability) {
                await TrackPlayer.setupPlayer();

                // Super defensive capability mapping
                const caps = [];
                const C = TP.Capability;
                if (C) {
                    if (C.Play || C.CAPABILITY_PLAY) caps.push(C.Play || C.CAPABILITY_PLAY);
                    if (C.Pause || C.CAPABILITY_PAUSE) caps.push(C.Pause || C.CAPABILITY_PAUSE);
                    if (C.SkipToNext || C.CAPABILITY_SKIP_TO_NEXT) caps.push(C.SkipToNext || C.CAPABILITY_SKIP_TO_NEXT);
                    if (C.SkipToPrevious || C.CAPABILITY_SKIP_TO_PREVIOUS) caps.push(C.SkipToPrevious || C.CAPABILITY_SKIP_TO_PREVIOUS);
                    if (C.SeekTo || C.CAPABILITY_SEEK_TO) caps.push(C.SeekTo || C.CAPABILITY_SEEK_TO);
                }

                await TrackPlayer.updateOptions({
                    capabilities: caps,
                });
                trackPlayerRef.current = TrackPlayer;
                isNativeMode.current = true;
                console.log('🚀 Player Engine: Native (Notification Bar Enabled)');
            } else {
                throw new Error('Native module incomplete or not linked');
            }
        } catch (e) {
            console.log('📦 Player Engine: Expo Go (Foreground Only)');
            isNativeMode.current = false;
            // Setup Expo Audio mode
            const { InterruptionModeIOS, InterruptionModeAndroid } = require('expo-av');
            await Audio.setAudioModeAsync({
                staysActiveInBackground: true,
                playsInSilentModeIOS: true,
                interruptionModeIOS: InterruptionModeIOS.DoNotMix,
                shouldDuckAndroid: false,
                interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
                playThroughEarpieceAndroid: false,
            });
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
                const tracks = (isShuffle ? shuffleArray(q) : q).map(t => ({
                    id: String(t._id),
                    url: t.audioUrl,
                    title: t.title,
                    artist: t.artist,
                    artwork: t.coverImage,
                }));
                await TP.reset();
                await TP.add(tracks);

                // Jump to the correct song in the shuffled/original queue
                const finalIdx = isShuffle ? tracks.findIndex(t => t.id === String(song._id)) : index;
                if (finalIdx > 0) await TP.skip(finalIdx);

                await TP.play();
                // Sync notification mode for repeat
                const { RepeatMode } = require('react-native-track-player');
                await TP.setRepeatMode(isRepeat ? RepeatMode.Track : RepeatMode.Off);
            } else {
                // EXPO FALLBACK
                if (expoSoundRef.current) await expoSoundRef.current.unloadAsync();
                const { sound } = await Audio.Sound.createAsync(
                    { uri: song.audioUrl },
                    { shouldPlay: true, volume, isLooping: isRepeat },
                    (status) => {
                        setIsPlaying(status.isPlaying);
                        if (status.didJustFinish && !status.isLooping) {
                            playNext();
                        }
                    }
                );
                expoSoundRef.current = sound;
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
        if (isNativeMode.current && trackPlayerRef.current) {
            const { RepeatMode } = require('react-native-track-player');
            await trackPlayerRef.current.setRepeatMode(newVal ? RepeatMode.Track : RepeatMode.Off);
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
