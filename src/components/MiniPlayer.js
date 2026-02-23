import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlayer } from '../context/PlayerContext';
import Ionicons from '@expo/vector-icons/Ionicons';

const { width } = Dimensions.get('window');

// ─── Mini Visualizer ──────────────────────────────────────────
const MiniViz = ({ playing }) => {
    const anims = Array.from({ length: 4 }, () => useRef(new Animated.Value(0.3)).current);
    useEffect(() => {
        if (!playing) {
            anims.forEach(a => Animated.timing(a, { toValue: 0.3, duration: 300, useNativeDriver: false }).start());
            return;
        }
        const loops = anims.map((a, i) =>
            Animated.loop(Animated.sequence([
                Animated.timing(a, { toValue: 0.2 + Math.random() * 0.8, duration: 180 + i * 60, useNativeDriver: false }),
                Animated.timing(a, { toValue: 0.2 + Math.random() * 0.4, duration: 180 + i * 40, useNativeDriver: false }),
            ]))
        );
        loops.forEach(l => l.start());
        return () => loops.forEach(l => l.stop());
    }, [playing]);

    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 14 }}>
            {anims.map((a, i) => (
                <Animated.View key={i} style={{ width: 2.5, height: a.interpolate({ inputRange: [0, 1], outputRange: [3, 14] }), backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 1.5 }} />
            ))}
        </View>
    );
};

const MiniPlayer = ({ onPress }) => {
    const { currentSong, isPlaying, togglePlayPause, playNext, position, duration } = usePlayer();
    const translateY = useRef(new Animated.Value(80)).current;

    useEffect(() => {
        if (currentSong) {
            Animated.spring(translateY, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }).start();
        }
    }, [currentSong]);

    if (!currentSong) return null;

    const progress = duration > 0 ? (position / duration) * (width - 32) : 0;

    return (
        <Animated.View style={[styles.wrapper, { transform: [{ translateY }] }]}>
            {/* Progress line */}
            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: progress }]} />
            </View>

            <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.92}>
                {/* Album art */}
                <View style={styles.artWrap}>
                    {currentSong.coverImage
                        ? <Image source={{ uri: currentSong.coverImage }} style={styles.art} />
                        : (
                            <LinearGradient colors={['#5B2C6F', '#2E1053']} style={styles.art}>
                                <Ionicons name="musical-notes" size={16} color="rgba(255,255,255,0.6)" />
                            </LinearGradient>
                        )
                    }
                </View>

                {/* Song info */}
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>{currentSong.title}</Text>
                    <Text style={styles.artist} numberOfLines={1}>{currentSong.artist}</Text>
                </View>

                {/* Visualizer when playing */}
                {isPlaying && <View style={{ marginRight: 12 }}><MiniViz playing={isPlaying} /></View>}

                {/* Controls */}
                <TouchableOpacity onPress={togglePlayPause} style={styles.playBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 8 }}>
                    <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={playNext} style={styles.nextBtn} hitSlop={{ top: 12, bottom: 12, left: 8, right: 12 }}>
                    <Ionicons name="play-skip-forward" size={18} color="rgba(255,255,255,0.55)" />
                </TouchableOpacity>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: 62,
        left: 12,
        right: 12,
        backgroundColor: '#1C1830',
        borderRadius: 18,
        overflow: 'hidden',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
    },
    progressTrack: { height: 2, backgroundColor: 'rgba(255,255,255,0.08)' },
    progressFill: { height: 2, backgroundColor: 'rgba(255,255,255,0.5)' },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        paddingHorizontal: 12,
    },
    artWrap: { width: 40, height: 40, borderRadius: 10, overflow: 'hidden', marginRight: 12 },
    art: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    info: { flex: 1 },
    title: { color: '#fff', fontSize: 13, fontWeight: '600', marginBottom: 2 },
    artist: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
    playBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center', marginLeft: 4 },
    nextBtn: { width: 32, height: 36, justifyContent: 'center', alignItems: 'center' },
});

export default MiniPlayer;
