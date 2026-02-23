import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    ActivityIndicator,
    StatusBar,
    Animated,
    TextInput,
    RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { songAPI, userAPI } from '../services/api';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants';
import Ionicons from '@expo/vector-icons/Ionicons';

const { width } = Dimensions.get('window');

// ─── Mental State Card Illustrations ──────────────────────────
const FocusGlow = () => (
    <View style={cardIll.wrap}>
        <View style={[cardIll.glow, { backgroundColor: '#C0392B' }]} />
        <View style={cardIll.personSmall}>
            <LinearGradient colors={['#9B59B6', '#6C3483']} style={{ flex: 1, borderRadius: 8 }} />
        </View>
        <View style={cardIll.headSmall}>
            <LinearGradient colors={['#BB8FCE', '#8E44AD']} style={{ flex: 1, borderRadius: 12 }} />
        </View>
        <View style={cardIll.hpArc} />
    </View>
);

const RelaxGlow = () => (
    <View style={cardIll.wrap}>
        <View style={[cardIll.glow, { backgroundColor: '#7D3C98' }]} />
        <View style={[cardIll.personSmall, { backgroundColor: 'transparent' }]}>
            <LinearGradient colors={['#5DADE2', '#2E86C1']} style={{ flex: 1, borderRadius: 8 }} />
        </View>
        <View style={cardIll.headSmall}>
            <LinearGradient colors={['#85C1E9', '#5DADE2']} style={{ flex: 1, borderRadius: 12 }} />
        </View>
        <View style={[cardIll.hpArc, { borderColor: 'rgba(255,255,255,0.7)' }]} />
    </View>
);

const SleepGlow = () => (
    <View style={cardIll.wrap}>
        <View style={[cardIll.glow, { backgroundColor: '#154360', width: 100, height: 100, borderRadius: 50 }]} />
        <View style={[cardIll.personSmall, { transform: [{ rotate: '-20deg' }], bottom: '30%' }]}>
            <LinearGradient colors={['#2471A3', '#1A5276']} style={{ flex: 1, borderRadius: 8 }} />
        </View>
        <View style={[cardIll.headSmall, { bottom: '48%' }]}>
            <LinearGradient colors={['#5DADE2', '#2E86C1']} style={{ flex: 1, borderRadius: 12 }} />
        </View>
        <View style={[cardIll.hpArc, { bottom: '54%', borderColor: 'rgba(255,255,255,0.6)' }]} />
    </View>
);

const MeditateGlow = () => (
    <View style={cardIll.wrap}>
        <View style={[cardIll.glow, { backgroundColor: '#1E8449' }]} />
        <View style={cardIll.personSmall}>
            <LinearGradient colors={['#27AE60', '#1E8449']} style={{ flex: 1, borderRadius: 8 }} />
        </View>
        <View style={cardIll.headSmall}>
            <LinearGradient colors={['#52BE80', '#27AE60']} style={{ flex: 1, borderRadius: 12 }} />
        </View>
        <View style={[cardIll.hpArc, { borderColor: 'rgba(255,255,255,0.7)' }]} />
    </View>
);

const MENTAL_STATES = [
    { label: 'Focus', Glow: FocusGlow, bg: ['#2C0D14', '#1A0819'], accent: '#C0392B' },
    { label: 'Relax', Glow: RelaxGlow, bg: ['#1A0A2E', '#0D0619'], accent: '#7D3C98' },
    { label: 'Sleep', Glow: SleepGlow, bg: ['#0A1628', '#050D1A'], accent: '#1A5276' },
    { label: 'Meditate', Glow: MeditateGlow, bg: ['#0D2217', '#050F0A'], accent: '#1E8449' },
];

// ─── Mini Music Visualizer ─────────────────────────────────────
const Visualizer = ({ color = '#fff', playing = false }) => {
    const anims = useRef([
        new Animated.Value(0.3),
        new Animated.Value(0.3),
        new Animated.Value(0.3),
        new Animated.Value(0.3),
        new Animated.Value(0.3),
    ]).current;

    React.useEffect(() => {
        if (!playing) {
            anims.forEach(a => Animated.timing(a, { toValue: 0.3, duration: 300, useNativeDriver: false }).start());
            return;
        }
        const loops = anims.map((a, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.timing(a, { toValue: 0.3 + Math.random() * 0.7, duration: 200 + i * 80, useNativeDriver: false }),
                    Animated.timing(a, { toValue: 0.1 + Math.random() * 0.4, duration: 200 + i * 60, useNativeDriver: false }),
                ])
            )
        );
        loops.forEach(l => l.start());
        return () => loops.forEach(l => l.stop());
    }, [playing]);

    return (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 18 }}>
            {anims.map((a, i) => (
                <Animated.View key={i} style={{ width: 3, height: a.interpolate({ inputRange: [0, 1], outputRange: [4, 18] }), backgroundColor: color, borderRadius: 2 }} />
            ))}
        </View>
    );
};

const HomeScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { playSong, isPlaying, currentSong } = usePlayer();
    const insets = useSafeAreaInsets();

    const [songs, setSongs] = useState([]);
    const [recentlyPlayed, setRecentlyPlayed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [filteredSongs, setFilteredSongs] = useState([]);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        try {
            const [songsRes, recentRes] = await Promise.allSettled([
                songAPI.getAll({ limit: 30 }),
                userAPI.getRecentlyPlayed(user._id),
            ]);
            if (songsRes.status === 'fulfilled') setSongs(songsRes.value.songs || []);
            if (recentRes.status === 'fulfilled') setRecentlyPlayed(recentRes.value.songs || []);
        } catch (e) { } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [user._id]);

    const handleSearch = (text) => {
        setSearchQuery(text);
        if (!text.trim()) { setSearching(false); return; }
        setSearching(true);
        const results = songs.filter(s =>
            s.title.toLowerCase().includes(text.toLowerCase()) ||
            s.artist.toLowerCase().includes(text.toLowerCase())
        );
        setFilteredSongs(results);
    };

    const handlePlaySong = (song, list) => {
        const idx = list.findIndex(s => s._id === song._id);
        playSong(song, list, idx >= 0 ? idx : 0);
        navigation.navigate('Player');
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator color="#fff" size="large" />
                <Text style={{ color: 'rgba(255,255,255,0.4)', marginTop: 20, fontSize: 13, letterSpacing: 1 }}>PREPARING YOUR RHYTHM...</Text>
            </View>
        );
    }

    const recommendedSong = songs[0];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient colors={['#0D0819', '#0A0612']} style={StyleSheet.absoluteFill} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100, paddingTop: insets.top + 8 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor="#7C3AED"
                        colors={['#7C3AED']}
                    />
                }
            >
                {/* ── Header ── */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Start</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.profileBtn}>
                        {user?.avatar
                            ? <Image source={{ uri: user.avatar }} style={styles.profileAvatar} />
                            : (
                                <View style={styles.profileInitial}>
                                    <Text style={styles.profileInitialText}>{user?.name?.[0]?.toUpperCase()}</Text>
                                </View>
                            )}
                    </TouchableOpacity>
                </View>

                {/* ── Search bar ── */}
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.4)" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search songs, artists..."
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={searchQuery}
                        onChangeText={handleSearch}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => handleSearch('')}>
                            <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.4)" />
                        </TouchableOpacity>
                    )}
                </View>

                {searching ? (
                    /* ── Search Results ── */
                    <View style={{ paddingHorizontal: 20 }}>
                        <Text style={styles.sectionLabel}>{filteredSongs.length} results for "{searchQuery}"</Text>
                        {filteredSongs.map((song) => (
                            <TouchableOpacity key={song._id} style={styles.searchResult} onPress={() => handlePlaySong(song, filteredSongs)}>
                                <View style={styles.searchResultArt}>
                                    {song.coverImage
                                        ? <Image source={{ uri: song.coverImage }} style={{ flex: 1 }} />
                                        : <LinearGradient colors={['#5B2C6F', '#2E1053']} style={{ flex: 1 }} />
                                    }
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.searchResultTitle} numberOfLines={1}>{song.title}</Text>
                                    <Text style={styles.searchResultArtist} numberOfLines={1}>{song.artist}</Text>
                                </View>
                                <Text style={styles.searchResultDur}>{formatDuration(song.duration)}</Text>
                            </TouchableOpacity>
                        ))}
                        {filteredSongs.length === 0 && (
                            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                                <Text style={{ fontSize: 36 }}>🔍</Text>
                                <Text style={styles.emptyText}>No results found</Text>
                            </View>
                        )}
                    </View>
                ) : (
                    <>
                        {/* ── Choose a Mental State ── */}
                        <View style={styles.section}>
                            <Text style={styles.sectionLabel}>CHOOSE A MENTAL STATE</Text>
                            {MENTAL_STATES.map(({ label, Glow, bg, accent }, i) => (
                                <TouchableOpacity
                                    key={label}
                                    style={styles.stateCard}
                                    onPress={() => {
                                        const subset = songs.filter((_, idx) => idx % 4 === i);
                                        if (subset.length > 0) handlePlaySong(subset[0], subset.length > 0 ? subset : songs);
                                    }}
                                    activeOpacity={0.85}
                                >
                                    <LinearGradient colors={bg} style={styles.stateCardGradient}>
                                        {/* Left text */}
                                        <Text style={styles.stateLabel}>{label}</Text>

                                        {/* Right illustration */}
                                        <View style={styles.stateIllustration}>
                                            <Glow />
                                        </View>

                                        {/* Active dot indicator */}
                                        {i === 0 && (
                                            <View style={[styles.activeDot, { backgroundColor: accent }]} />
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* ── Jump Back In ── */}
                        {recentlyPlayed.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Jump Back In</Text>
                                <Text style={styles.sectionLabel}>RECENT SESSIONS</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentScroll}>
                                    {recentlyPlayed.slice(0, 5).map((song) => (
                                        <TouchableOpacity
                                            key={song._id}
                                            style={styles.recentCard}
                                            onPress={() => handlePlaySong(song, recentlyPlayed)}
                                        >
                                            <LinearGradient colors={['#1E1030', '#120820']} style={styles.recentCardInner}>
                                                <View style={styles.recentInfo}>
                                                    <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.4)" />
                                                    <Text style={styles.recentDuration}>{formatDuration(song.duration)}</Text>
                                                    <Text style={styles.recentTitle} numberOfLines={1}>{song.title}</Text>
                                                </View>
                                                <TouchableOpacity
                                                    onPress={() => handlePlaySong(song, recentlyPlayed)}
                                                    style={styles.recentPlayBtn}
                                                >
                                                    <LinearGradient colors={['#E74C3C', '#C0392B']} style={styles.recentPlayBtnGrad}>
                                                        <Ionicons name="play" size={16} color="#fff" />
                                                    </LinearGradient>
                                                </TouchableOpacity>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        {/* ── Recommended Track ── */}
                        {recommendedSong && (
                            <View style={styles.section}>
                                <Text style={styles.sectionLabel}>RECOMMENDED TRACK</Text>
                                <TouchableOpacity
                                    style={styles.recommendedCard}
                                    onPress={() => handlePlaySong(recommendedSong, songs)}
                                >
                                    <LinearGradient colors={['#1A1030', '#0D0819']} style={styles.recommendedInner}>
                                        {/* Art */}
                                        <View style={styles.recArtWrap}>
                                            {recommendedSong.coverImage
                                                ? <Image source={{ uri: recommendedSong.coverImage }} style={styles.recArt} />
                                                : (
                                                    <LinearGradient colors={['#5B2C6F', '#2E1053']} style={styles.recArt}>
                                                        <Ionicons name="musical-notes" size={18} color="rgba(255,255,255,0.6)" />
                                                    </LinearGradient>
                                                )
                                            }
                                        </View>

                                        {/* Info */}
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.recTitle} numberOfLines={1}>{recommendedSong.title}</Text>
                                            <Text style={styles.recArtist} numberOfLines={1}>{recommendedSong.artist}</Text>
                                        </View>

                                        {/* Visualizer */}
                                        <Visualizer color="rgba(255,255,255,0.5)" playing={isPlaying && currentSong?._id === recommendedSong._id} />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* ── All Songs ── */}
                        {songs.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>All Songs</Text>
                                <Text style={styles.sectionLabel}>{songs.length} TRACKS</Text>
                                {songs.map((song) => (
                                    <TouchableOpacity key={song._id} style={styles.trackRow} onPress={() => handlePlaySong(song, songs)}>
                                        <View style={styles.trackArtWrap}>
                                            {song.coverImage
                                                ? <Image source={{ uri: song.coverImage }} style={styles.trackArt} />
                                                : (
                                                    <LinearGradient colors={['#4A1A7A', '#1E0A3C']} style={styles.trackArt}>
                                                        <Ionicons name="musical-notes" size={14} color="rgba(255,255,255,0.5)" />
                                                    </LinearGradient>
                                                )
                                            }
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.trackTitle} numberOfLines={1}>{song.title}</Text>
                                            <Text style={styles.trackArtist} numberOfLines={1}>{song.artist}</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                                            <Text style={styles.trackDuration}>{formatDuration(song.duration)}</Text>
                                            {isPlaying && currentSong?._id === song._id && (
                                                <Visualizer color="#C0392B" playing />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
};

// ─── Card illustration styles ──────────────────────────────────
const CARD_H = 80;
const cardIll = StyleSheet.create({
    wrap: {
        width: CARD_H,
        height: CARD_H,
        alignItems: 'center',
        justifyContent: 'flex-end',
        position: 'relative',
    },
    glow: {
        position: 'absolute',
        width: 70,
        height: 70,
        borderRadius: 35,
        top: 5,
        left: 5,
        opacity: 0.55,
    },
    personSmall: {
        position: 'absolute',
        width: 22,
        height: 40,
        bottom: '22%',
        alignSelf: 'center',
        overflow: 'hidden',
        borderRadius: 8,
    },
    headSmall: {
        position: 'absolute',
        bottom: '54%',
        alignSelf: 'center',
        width: 20,
        height: 20,
        borderRadius: 10,
        overflow: 'hidden',
    },
    hpArc: {
        position: 'absolute',
        bottom: '62%',
        alignSelf: 'center',
        width: 26,
        height: 12,
        borderTopLeftRadius: 13,
        borderTopRightRadius: 13,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.8)',
        borderBottomWidth: 0,
    },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D0819' },
    loading: { flex: 1, backgroundColor: '#0D0819', justifyContent: 'center', alignItems: 'center' },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    headerTitle: { color: '#FFFFFF', fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
    profileBtn: { width: 36, height: 36, borderRadius: 18, overflow: 'hidden' },
    profileAvatar: { width: '100%', height: '100%' },
    profileInitial: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    profileInitialText: { color: '#fff', fontWeight: '700', fontSize: 16 },

    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 12,
        marginHorizontal: 20,
        paddingHorizontal: 12,
        height: 40,
        marginBottom: 20,
        gap: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    searchInput: { flex: 1, color: '#fff', fontSize: 14 },

    section: { paddingHorizontal: 20, marginBottom: 28 },

    sectionTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: -0.3,
    },
    sectionLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1.2,
        marginBottom: 12,
    },

    // Mental state cards
    stateCard: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 8,
        height: 72,
    },
    stateCardGradient: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
    },
    stateLabel: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
        letterSpacing: -0.3,
    },
    stateIllustration: {
        width: 80,
        height: 70,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginLeft: 8,
    },

    // Recent sessions
    recentScroll: { marginLeft: -4 },
    recentCard: {
        width: 160,
        borderRadius: 14,
        overflow: 'hidden',
        marginRight: 10,
    },
    recentCardInner: {
        padding: 14,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    recentInfo: { flex: 1 },
    recentDuration: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 11,
        marginBottom: 4,
    },
    recentTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
    recentPlayBtn: { width: 34, height: 34, borderRadius: 17, overflow: 'hidden', marginLeft: 8 },
    recentPlayBtnGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Recommended track
    recommendedCard: { borderRadius: 14, overflow: 'hidden' },
    recommendedInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        gap: 12,
    },
    recArtWrap: { width: 44, height: 44, borderRadius: 10, overflow: 'hidden' },
    recArt: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    recTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', marginBottom: 2 },
    recArtist: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },

    // All tracks
    trackRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        gap: 12,
    },
    trackArtWrap: { width: 44, height: 44, borderRadius: 10, overflow: 'hidden' },
    trackArt: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    trackTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '500', marginBottom: 2 },
    trackArtist: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
    trackDuration: { color: 'rgba(255,255,255,0.3)', fontSize: 11 },

    // Search results
    searchResult: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    searchResultArt: { width: 44, height: 44, borderRadius: 10, overflow: 'hidden', backgroundColor: '#1A0A2E' },
    searchResultTitle: { color: '#fff', fontSize: 14, fontWeight: '500', marginBottom: 2 },
    searchResultArtist: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
    searchResultDur: { color: 'rgba(255,255,255,0.3)', fontSize: 11 },

    emptyText: { color: 'rgba(255,255,255,0.4)', marginTop: 12, fontSize: 14 },
});

export default HomeScreen;
