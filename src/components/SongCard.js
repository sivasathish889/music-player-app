import React, { useRef } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS } from '../constants';
import Ionicons from '@expo/vector-icons/Ionicons';

const SongCard = ({ song, onPress, onLike, isLiked, showArtist = true, style }) => {
    const scale = useRef(new Animated.Value(1)).current;

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
            </TouchableOpacity>
        </Animated.View>
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
});

export default SongCard;
