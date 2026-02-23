import { registerRootComponent } from 'expo';
import { Platform, NativeModules } from 'react-native';
import App from './App';

registerRootComponent(App);

/**
 * Register TrackPlayer background service only if the native module is present.
 */
const hasNativePlayer = !!NativeModules.TrackPlayerModule;

if (Platform.OS !== 'web' && hasNativePlayer) {
    try {
        const TP = require('react-native-track-player');
        const TrackPlayer = TP.default || TP;

        if (TrackPlayer && typeof TrackPlayer.registerPlaybackService === 'function') {
            const { playbackService } = require('./src/services/playbackService');
            TrackPlayer.registerPlaybackService(() => playbackService);
        }
    } catch (e) {
        console.log('TrackPlayer registration failed:', e.message);
    }
}
