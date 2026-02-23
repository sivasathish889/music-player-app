import React, { useRef } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS } from '../constants';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSettings } from '../context/SettingsContext';

const SongCard = ({ song, onPress, onLike, isLiked, showArtist = true, style }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const { isDownloaded, isDownloading, getProgress, startDownload } = useSettings();

    const downloaded = isDownloaded(song._id);
    const inProgress = isDownloading(song._id);
    const progress = getProgress(song._id);

    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handlePressIn = () => {
        Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 200, friction: 10 }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();
    };

    const handleDownload = async () => {
        if (downloaded) {
            Alert.alert('Already Downloaded', `"${song.title}" is saved for offline listening.`);
            return;
        }
        if (inProgress) return;
        const result = await startDownload(song);
        if (result && !result.success) {
            Alert.alert('Download Failed', result.error || 'Could not download song. Please try again.');
        }
    };

    return (
        <Animated.View style={[{ transform: [{ scale }] }, style]}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                activeOpacity={1}
            >
                <View style={styles.container}>
                    {/* Cover Image */}
                    <View style={styles.imageContainer}>
                        {song.coverImage ? (
                            <Image source={{ uri: song.coverImage }} style={styles.cover} />
                        ) : (
                            <LinearGradient colors={GRADIENTS.primary} style={styles.coverFallback}>
                                <Ionicons name="musical-notes" size={22} color={COLORS.white} />
                            </LinearGradient>
                        )}
                        {/* Downloaded badge */}
                        {downloaded && (
                            <View style={styles.downloadedBadge}>
                                <Ionicons name="checkmark" size={10} color="#fff" />
                            </View>
                        )}
                    </View>

                    {/* Info */}
                    <View style={styles.info}>
                        <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
                        {showArtist && (
                            <Text style={styles.artist} numberOfLines={1}>{song.artist}</Text>
                        )}
                        {song.album && (
                            <Text style={styles.album} numberOfLines={1}>{song.album}</Text>
                        )}
                    </View>

                    {/* Right section */}
                    <View style={styles.rightSection}>
                        <Text style={styles.duration}>{formatDuration(song.duration)}</Text>
                        <View style={styles.actions}>
                            {/* Download button */}
                            <TouchableOpacity
                                onPress={handleDownload}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                style={styles.downloadBtn}
                            >
                                {inProgress ? (
                                    <ProgressRing progress={progress} />
                                ) : (
                                    <Ionicons
                                        name={downloaded ? 'cloud-done' : 'cloud-download-outline'}
                                        size={19}
                                        color={downloaded ? COLORS.accent : COLORS.textMuted}
                                    />
                                )}
                            </TouchableOpacity>
                            {/* Like button */}
                            {onLike && (
                                <TouchableOpacity onPress={onLike} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                    <Ionicons
                                        name={isLiked ? 'heart' : 'heart-outline'}
                                        size={20}
                                        color={isLiked ? COLORS.error : COLORS.textMuted}
                                    />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ── Tiny circular progress ring for ongoing downloads ────────────
const ProgressRing = ({ progress = 0 }) => {
    const size = 20;
    const strokeWidth = 2;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const filled = circumference * (1 - progress);

    return (
        <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
            {/* Background track */}
            <View style={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
                borderColor: 'rgba(255,255,255,0.1)',
            }} />
            {/* Progress arc (approximated with opacity + border) */}
            <View style={{
                position: 'absolute',
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: strokeWidth,
                borderColor: COLORS.accent,
                borderTopColor: progress > 0.25 ? COLORS.accent : 'transparent',
                borderRightColor: progress > 0.5 ? COLORS.accent : 'transparent',
                borderBottomColor: progress > 0.75 ? COLORS.accent : 'transparent',
                borderLeftColor: COLORS.accent,
                transform: [{ rotate: `${progress * 360}deg` }],
            }} />
            <Ionicons name="arrow-down" size={8} color={COLORS.accent} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.base,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.card,
        marginBottom: SPACING.sm,
    },
    imageContainer: {
        width: 54,
        height: 54,
        borderRadius: RADIUS.sm,
        overflow: 'hidden',
        position: 'relative',
    },
    cover: {
        width: '100%',
        height: '100%',
    },
    coverFallback: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    downloadedBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: COLORS.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
        marginHorizontal: SPACING.sm,
    },
    title: {
        color: COLORS.text,
        fontSize: FONTS.sizes.md,
        fontWeight: '600',
        marginBottom: 2,
    },
    artist: {
        color: COLORS.textSecondary,
        fontSize: FONTS.sizes.sm,
        marginBottom: 2,
    },
    album: {
        color: COLORS.textMuted,
        fontSize: FONTS.sizes.xs,
    },
    rightSection: {
        alignItems: 'flex-end',
        gap: 4,
    },
    duration: {
        color: COLORS.textMuted,
        fontSize: FONTS.sizes.xs,
        marginBottom: 4,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    downloadBtn: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default SongCard;
