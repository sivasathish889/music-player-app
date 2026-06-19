import { registerRootComponent } from 'expo';
import { Platform, NativeModules } from 'react-native';
import App from './App';

registerRootComponent(App);

/**
 * Register TrackPlayer background service only if the native module is present.
 */
const hasNativePlayer = !!NativeModules.TrackPlayerModule;

if (false /* Platform.OS !== 'web' && hasNativePlayer */) {
    try {
        const TrackPlayer = require('react-native-track-player').default || require('react-native-track-player');

        if (TrackPlayer && typeof TrackPlayer.registerPlaybackService === 'function') {
            TrackPlayer.registerPlaybackService(() => require('./src/services/playbackService').playbackService);
        }
    } catch (e) {
        console.log('TrackPlayer registration failed:', e.message);
    }
}
