import { Platform, NativeModules } from 'react-native';

/**
 * This service handles OS-level media controls (notification/lockscreen)
 * using dynamic require to prevent crashes in the Expo Go environment.
 */
export const playbackService = async () => {
    if (Platform.OS === 'web' || !NativeModules.TrackPlayerModule) return;

    try {
        // Track player removed
    } catch (e) {
        console.warn('[PlaybackService] Not available in this environment');
    }
};
