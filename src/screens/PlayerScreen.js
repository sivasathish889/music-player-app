import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Image,
    Animated,
    PanResponder,
    Easing,
    ActivityIndicator,
    StatusBar,
    Modal,
    Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { songAPI } from '../services/api';
import { COLORS } from '../constants';
import Ionicons from '@expo/vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

// ─── Abstract liquid background blobs ─────────────────────────
const AbstractBg = ({ color1 = '#1A2A4A', color2 = '#0D1A30' }) => {
    const pulse1 = useRef(new Animated.Value(0)).current;
    const pulse2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse1, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(pulse1, { toValue: 0, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        ).start();
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse2, { toValue: 1, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(pulse2, { toValue: 0, duration: 6000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const scale1 = pulse1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
    const scale2 = pulse2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.24] });

    return (
        <View style={StyleSheet.absoluteFill}>
            <LinearGradient colors={['#080616', '#0D1020', '#060E1A']} style={StyleSheet.absoluteFill} />
            {/* Blob 1 - main color glow */}
            <Animated.View style={[bg.blob, { top: -80, left: -60, width: 340, height: 340, borderRadius: 170, backgroundColor: color1, transform: [{ scale: scale1 }] }]} />
            {/* Blob 2 - secondary */}
            <Animated.View style={[bg.blob, { top: 120, right: -80, width: 280, height: 280, borderRadius: 140, backgroundColor: color2, transform: [{ scale: scale2 }] }]} />
            {/* Blob 3 - bottom */}
            <Animated.View style={[bg.blob, { bottom: -60, left: 40, width: 220, height: 220, borderRadius: 110, backgroundColor: color1, opacity: 0.3, transform: [{ scale: scale1 }] }]} />
            {/* Overlay to deepen */}
            <LinearGradient colors={['rgba(8,6,22,0.3)', 'rgba(8,6,22,0.6)', 'rgba(8,6,22,0.85)']} style={StyleSheet.absoluteFill} />
        </View>
    );
};

const bg = StyleSheet.create({
    blob: { position: 'absolute', opacity: 0.35, blurRadius: 40 },
});

// ─── Rotating Artwork ──────────────────────────────────────────
const RotatingArtwork = ({ image, playing }) => {
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (playing) {
            Animated.loop(
                Animated.timing(rotateAnim, {
                    toValue: 1,
                    duration: 12000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        } else {
            rotateAnim.stopAnimation();
        }
    }, [playing]);

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={artStyles.container}>
            <Animated.View style={[artStyles.artWrapper, { transform: [{ rotate: rotate }] }]}>
                {image ? (
                    <Image source={{ uri: image }} style={artStyles.image} />
                ) : (
                    <LinearGradient colors={['#7C3AED', '#3B82F6']} style={artStyles.imageFallback}>
                        <Ionicons name="musical-notes" size={60} color="#fff" />
                    </LinearGradient>
                )}
                {/* Center Hole for Vinyl Effect */}
                <View style={artStyles.centerHole} />
            </Animated.View>
            <View style={artStyles.ring} />
        </View>
    );
};

const artStyles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: height * 0.05,
    },
    artWrapper: {
        width: width * 0.82,
        height: width * 0.82,
        borderRadius: (width * 0.82) / 2,
        overflow: 'hidden',
        borderWidth: 8,
        borderColor: 'rgba(255,255,255,0.05)',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
    },
    image: { width: '100%', height: '100%' },
    imageFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    centerHole: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#080616',
        top: '50%',
        left: '50%',
        marginLeft: -20,
        marginTop: -20,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    ring: {
        position: 'absolute',
        width: width * 0.86,
        height: width * 0.86,
        borderRadius: (width * 0.86) / 2,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    }
});

// ─── Dropdown pill ─────────────────────────────────────────────
const ModeDropdown = ({ title }) => (
    <TouchableOpacity style={dd.pill}>
        <Text style={dd.text}>{title}</Text>
        <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.6)" />
    </TouchableOpacity>
);

const dd = StyleSheet.create({
    pill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    text: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

// ─── Main PlayerScreen ─────────────────────────────────────────
const PlayerScreen = ({ navigation }) => {
    const {
        currentSong,
        isPlaying, isLoading,
        duration, position,
        isRepeat, isShuffle,
        togglePlayPause, seek,
        playNext, playPrev,
        toggleRepeat, toggleShuffle, shareSong,
    } = usePlayer();

    const { user } = useAuth();
    const { isDownloaded, isDownloading, getProgress, startDownload } = useSettings();
    const insets = useSafeAreaInsets();

    const [isLiked, setIsLiked] = useState(false);
    const [sliderPos, setSliderPos] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [downloadMsg, setDownloadMsg] = useState('');

    const sliderWidth = width - 48;
    const fadeIn = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        if (user?.likedSongs && currentSong) {
            setIsLiked(user.likedSongs.includes(currentSong._id));
        }
    }, [currentSong]);

    useEffect(() => {
        if (!isDragging && duration > 0) {
            setSliderPos((position / duration) * sliderWidth);
        }
    }, [position, duration, isDragging]);

    const handleLike = async () => {
        if (!currentSong) return;
        try {
            const res = await songAPI.toggleLike(currentSong._id);
            setIsLiked(res.liked);
        } catch (e) { }
    };

    const handleDownload = async () => {
        if (!currentSong) return;
        const songId = currentSong._id;
        if (isDownloaded(songId)) {
            setDownloadMsg('Already saved offline ✓');
            setTimeout(() => setDownloadMsg(''), 2500);
            return;
        }
        if (isDownloading(songId)) return;
        setMenuVisible(false);
        const result = await startDownload(currentSong);
        if (result?.success) {
            setDownloadMsg('Downloaded!');
        } else {
            setDownloadMsg('Download failed — try again');
        }
        setTimeout(() => setDownloadMsg(''), 3000);
    };

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => setIsDragging(true),
        onPanResponderMove: (_, state) => {
            setSliderPos(Math.max(0, Math.min(sliderWidth, state.moveX - 24)));
        },
        onPanResponderRelease: async (_, state) => {
            setIsDragging(false);
            const newPos = Math.max(0, Math.min(sliderWidth, state.moveX - 24));
            await seek((newPos / sliderWidth) * duration);
        },
    });

    const formatTime = (sec) => {
        if (!sec || isNaN(sec)) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const formatFocusTime = (sec) => {
        if (!sec || isNaN(sec)) return '00:00';
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = Math.floor(sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    if (!currentSong) {
        return (
            <View style={styles.noSongContainer}>
                <AbstractBg />
                <Ionicons name="musical-notes-outline" size={64} color="rgba(255,255,255,0.2)" />
                <Text style={styles.noSongText}>Nothing's playing</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackBtn}>
                    <Text style={styles.goBackText}>← Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Determine blob color based on song genre
    const getGenreColors = () => {
        const g = (currentSong.genre || '').toLowerCase();
        if (g.includes('jazz') || g.includes('lo-fi')) return ['#1A3A2A', '#0D2018'];
        if (g.includes('classical') || g.includes('ambient')) return ['#1A2A4A', '#0D1830'];
        if (g.includes('pop') || g.includes('r&b')) return ['#3A1A3A', '#200D20'];
        return ['#1A1A3A', '#0D0D28'];
    };
    const [c1, c2] = getGenreColors();

    const remainingTime = Math.max(0, duration - position);
    const progressPercent = duration > 0 ? (position / duration) * 100 : 0;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Abstract animated background */}
            {currentSong.coverImage ? (
                <>
                    <Image source={{ uri: currentSong.coverImage }} style={styles.bgCover} blurRadius={60} />
                    <LinearGradient colors={['rgba(8,6,22,0.6)', 'rgba(8,6,22,0.85)', 'rgba(8,6,22,0.98)']} style={StyleSheet.absoluteFill} />
                </>
            ) : (
                <AbstractBg color1={c1} color2={c2} />
            )}

            <Animated.View style={[styles.content, { opacity: fadeIn, paddingTop: insets.top }]}>

                {/* ── Top bar ── */}
                <View style={styles.topBar}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topBtn}>
                        <Ionicons name="chevron-down" size={28} color="#fff" />
                    </TouchableOpacity>

                    <ModeDropdown title={currentSong.genre || 'Deep Work'} />

                    <TouchableOpacity style={styles.topBtn} onPress={() => setMenuVisible(true)}>
                        <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* ── Featured Artwork ── */}
                <RotatingArtwork image={currentSong.coverImage} playing={isPlaying} />

                {/* ── Focus timer (Subtle) ── */}
                <View style={styles.timerMini}>
                    <Ionicons name="timer-outline" size={14} color="rgba(255,255,255,0.5)" />
                    <Text style={styles.timerMiniText}>{formatFocusTime(remainingTime)} REMAINING</Text>
                </View>

                {/* ── Song Info ── */}
                <View style={styles.songHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.songTitle} numberOfLines={1}>{currentSong.title}</Text>
                        <Text style={styles.songArtist} numberOfLines={1}>{currentSong.artist}</Text>
                    </View>
                    <TouchableOpacity style={styles.mainLikeBtn} onPress={handleLike}>
                        <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={28} color={isLiked ? '#FF2D55' : '#fff'} />
                    </TouchableOpacity>
                </View>

                {/* ── Quick Tags ── */}
                <View style={styles.tagsContainer}>
                    {currentSong.genre && <View style={styles.glassTag}><Text style={styles.tagLabel}>{currentSong.genre}</Text></View>}
                    <View style={styles.glassTag}><Text style={styles.tagLabel}>Hi-Fi Lossless</Text></View>
                </View>

                {/* ── Spacer ── */}
                <View style={{ flex: 1 }} />

                {/* ── Progress slider ── */}
                <View style={styles.sliderSection} {...panResponder.panHandlers}>
                    <View style={styles.sliderTrack}>
                        <View style={[styles.sliderFill, { width: sliderPos }]} />
                        <View style={[styles.sliderThumb, { left: Math.max(0, sliderPos - 6) }]} />
                    </View>
                    <View style={styles.sliderLabels}>
                        <Text style={styles.sliderLabel}>{formatTime(position)}</Text>
                        <Text style={styles.sliderLabel}>{formatTime(duration)}</Text>
                    </View>
                </View>

                {/* ── Controls ── */}
                <View style={styles.controls}>
                    <TouchableOpacity onPress={playPrev} style={styles.skipBtn}>
                        <Ionicons name="play-skip-back" size={26} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={togglePlayPause} style={styles.playBtn}>
                        {isLoading
                            ? <ActivityIndicator color="#000" size="small" />
                            : <Ionicons name={isPlaying ? 'pause' : 'play'} size={30} color="#000" />
                        }
                    </TouchableOpacity>

                    <TouchableOpacity onPress={playNext} style={styles.skipBtn}>
                        <Ionicons name="play-skip-forward" size={26} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                </View>

                {/* ── Repeat / Shuffle / Download bottom bar ── */}
                <View style={styles.bottomBar}>
                    <TouchableOpacity onPress={toggleRepeat} style={styles.bottomBtn}>
                        <Ionicons name="repeat" size={20} color={isRepeat ? '#fff' : 'rgba(255,255,255,0.35)'} />
                    </TouchableOpacity>

                    {/* Download centre button */}
                    <TouchableOpacity onPress={handleDownload} style={styles.downloadFab}>
                        {isDownloading(currentSong._id) ? (
                            <View style={{ alignItems: 'center' }}>
                                <Ionicons name="arrow-down" size={18} color={COLORS.accent} />
                                <Text style={styles.dlPct}>{Math.round(getProgress(currentSong._id) * 100)}%</Text>
                            </View>
                        ) : (
                            <Ionicons
                                name={isDownloaded(currentSong._id) ? 'cloud-done' : 'cloud-download-outline'}
                                size={22}
                                color={isDownloaded(currentSong._id) ? COLORS.accent : 'rgba(255,255,255,0.6)'}
                            />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={toggleShuffle} style={styles.bottomBtn}>
                        <Ionicons name="shuffle" size={20} color={isShuffle ? '#fff' : 'rgba(255,255,255,0.35)'} />
                    </TouchableOpacity>
                </View>

                {/* Download toast */}
                {downloadMsg !== '' && (
                    <View style={styles.toast}>
                        <Ionicons name="cloud-done" size={14} color={COLORS.accent} />
                        <Text style={styles.toastText}>{downloadMsg}</Text>
                    </View>
                )}

                <View style={{ height: insets.bottom + 16 }} />
            </Animated.View>

            {/* ── Options Menu ── */}
            <Modal
                visible={menuVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setMenuVisible(false)}
                >
                    <View style={styles.menuContainer}>
                        <LinearGradient colors={['#1E1E2E', '#161625']} style={styles.menuContent}>
                            <View style={styles.menuIndicator} />

                            <View style={styles.menuHeader}>
                                <Image source={{ uri: currentSong.coverImage }} style={styles.menuCover} />
                                <View style={styles.menuHeaderInfo}>
                                    <Text style={styles.menuSongTitle} numberOfLines={1}>{currentSong.title}</Text>
                                    <Text style={styles.menuSongArtist}>{currentSong.artist}</Text>
                                </View>
                            </View>

                            <View style={styles.menuList}>
                                <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); shareSong(); }}>
                                    <View style={styles.menuItemIcon}>
                                        <Ionicons name="share-outline" size={20} color="#fff" />
                                    </View>
                                    <Text style={styles.menuItemText}>Share Song</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={() => { handleDownload(); }}>
                                    <View style={styles.menuItemIcon}>
                                        <Ionicons
                                            name={isDownloaded(currentSong._id) ? 'cloud-done' : 'cloud-download-outline'}
                                            size={20}
                                            color={isDownloaded(currentSong._id) ? COLORS.accent : '#fff'}
                                        />
                                    </View>
                                    <Text style={[styles.menuItemText, isDownloaded(currentSong._id) && { color: COLORS.accent }]}>
                                        {isDownloading(currentSong._id)
                                            ? `Downloading... ${Math.round(getProgress(currentSong._id) * 100)}%`
                                            : isDownloaded(currentSong._id)
                                                ? 'Downloaded ✓'
                                                : 'Download for Offline'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); toggleShuffle(); }}>
                                    <View style={styles.menuItemIcon}>
                                        <Ionicons name="shuffle" size={20} color={isShuffle ? COLORS.primary : "#fff"} />
                                    </View>
                                    <Text style={[styles.menuItemText, isShuffle && { color: COLORS.primary }]}>
                                        {isShuffle ? 'Turn Off Shuffle' : 'Shuffle On'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); toggleRepeat(); }}>
                                    <View style={styles.menuItemIcon}>
                                        <Ionicons name="repeat" size={20} color={isRepeat ? COLORS.primary : "#fff"} />
                                    </View>
                                    <Text style={[styles.menuItemText, isRepeat && { color: COLORS.primary }]}>
                                        {isRepeat ? 'Repeat One' : 'Repeat Off'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.menuItem, { opacity: 0.5 }]}>
                                    <View style={styles.menuItemIcon}>
                                        <Ionicons name="list-outline" size={20} color="#fff" />
                                    </View>
                                    <Text style={styles.menuItemText}>Add to Playlist (Coming Soon)</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.menuCloseBtn} onPress={() => setMenuVisible(false)}>
                                <Text style={styles.menuCloseText}>Close</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#080616' },
    bgCover: { position: 'absolute', width, height, resizeMode: 'cover' },
    noSongContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#080616' },
    noSongText: { color: 'rgba(255,255,255,0.4)', fontSize: 16, marginTop: 16 },
    goBackBtn: { marginTop: 20 },
    goBackText: { color: 'rgba(255,255,255,0.6)', fontSize: 15 },

    content: { flex: 1, position: 'relative' },

    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    topBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },

    timerMini: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 8,
    },
    timerMiniText: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', letterSpacing: 1 },

    songHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 30,
        marginBottom: 10,
    },
    songTitle: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
    songArtist: { color: 'rgba(255,255,255,0.6)', fontSize: 17, marginTop: 2 },
    mainLikeBtn: { padding: 8 },

    tagsContainer: { flexDirection: 'row', gap: 10, paddingHorizontal: 30, marginBottom: 30 },
    glassTag: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    tagLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700' },

    sliderSection: { paddingHorizontal: 30, marginBottom: 32 },
    sliderTrack: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        marginBottom: 10,
        position: 'relative',
    },
    sliderFill: { height: '100%', backgroundColor: '#fff', borderRadius: 2 },
    sliderThumb: {
        position: 'absolute',
        top: -6,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    sliderLabels: { flexDirection: 'row', justifyContent: 'space-between' },
    sliderLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '600' },

    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 40,
        marginBottom: 40,
    },
    skipBtn: { padding: 10 },
    playBtn: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#fff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },

    bottomBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 40,
        alignItems: 'center',
        marginBottom: 8,
    },
    bottomBtn: { padding: 10 },
    downloadFab: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dlPct: { color: COLORS.accent, fontSize: 9, fontWeight: '700', marginTop: 1 },
    toast: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'center',
        backgroundColor: 'rgba(6,182,212,0.15)',
        borderWidth: 1,
        borderColor: 'rgba(6,182,212,0.35)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 7,
        marginBottom: 6,
    },
    toastText: { color: COLORS.accent, fontSize: 13, fontWeight: '600' },

    // Menu Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    menuContainer: {
        width: '100%',
    },
    menuContent: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 40,
    },
    menuIndicator: {
        width: 40,
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 24,
    },
    menuHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
        gap: 16,
    },
    menuCover: {
        width: 60,
        height: 60,
        borderRadius: 8,
    },
    menuHeaderInfo: {
        flex: 1,
    },
    menuSongTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    menuSongArtist: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        marginTop: 2,
    },
    menuList: {
        gap: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        gap: 16,
    },
    menuItemIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    menuCloseBtn: {
        marginTop: 24,
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
    },
    menuCloseText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default PlayerScreen;
