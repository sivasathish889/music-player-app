import { Platform, NativeModules } from 'react-native';

/**
 * This service handles OS-level media controls (notification/lockscreen)
 * using dynamic require to prevent crashes in the Expo Go environment.
 */
export const playbackService = async () => {
    if (Platform.OS === 'web' || !NativeModules.TrackPlayerModule) return;

    try {
        const TP = require('react-native-track-player');
        const TrackPlayer = TP.default || TP;

        if (!TrackPlayer || !TP.Event) return;

        TrackPlayer.addEventListener(TP.Event.RemotePlay, () => TrackPlayer.play());
        TrackPlayer.addEventListener(TP.Event.RemotePause, () => TrackPlayer.pause());
        TrackPlayer.addEventListener(TP.Event.RemoteNext, () => TrackPlayer.skipToNext());
        TrackPlayer.addEventListener(TP.Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
        TrackPlayer.addEventListener(TP.Event.RemoteSeek, ({ position }) => TrackPlayer.seekTo(position));
    } catch (e) {
        console.warn('[PlaybackService] Not available in this environment');
    }
};
