import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayer } from '../context/PlayerContext';
import { searchAPI, songAPI } from '../services/api';
import SongCard from '../components/SongCard';
import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS } from '../constants';
import Ionicons from '@expo/vector-icons/Ionicons';

const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Jazz', 'Classical', 'R&B', 'Country', 'Lo-Fi', 'Indie'];

const SearchScreen = ({ navigation }) => {
    const { playSong } = usePlayer();
    const insets = useSafeAreaInsets();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [likedIds, setLikedIds] = useState([]);
    let searchTimeout = null;

    const handleSearch = useCallback(async (text) => {
        if (!text.trim()) {
            setResults([]);
            setSearched(false);
            return;
        }

        setLoading(true);
        setSearched(true);
        try {
            const res = await searchAPI.search(text);
            setResults(res.songs || []);
        } catch (e) {
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const onChangeText = (text) => {
        setQuery(text);
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => handleSearch(text), 400);
    };

    const handleLike = async (song) => {
        try {
            const res = await songAPI.toggleLike(song._id);
            if (res.liked) setLikedIds(prev => [...prev, song._id]);
            else setLikedIds(prev => prev.filter(id => id !== song._id));
        } catch (e) { }
    };

    const handleGenreSearch = (genre) => {
        setQuery(genre);
        handleSearch(genre);
    };

    return (
        <LinearGradient colors={['#0A0A0F', '#12121A']} style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
                <Text style={styles.title}>🔍 Search</Text>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search songs, artists, albums..."
                    placeholderTextColor={COLORS.textMuted}
                    value={query}
                    onChangeText={onChangeText}
                    returnKeyType="search"
                    autoFocus={false}
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
                        <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Browse by genre */}
                {!searched && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Browse by Genre</Text>
                        <View style={styles.genreGrid}>
                            {GENRES.map((genre, i) => (
                                <TouchableOpacity key={genre} onPress={() => handleGenreSearch(genre)} style={styles.genreCard}>
                                    <LinearGradient
                                        colors={[GENRE_COLORS[i % GENRE_COLORS.length] + 'CC', GENRE_COLORS[(i + 1) % GENRE_COLORS.length] + '88']}
                                        style={styles.genreCardGradient}
                                    >
                                        <Text style={styles.genreText}>{GENRE_ICONS[i % GENRE_ICONS.length]}</Text>
                                        <Text style={styles.genreLabel}>{genre}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Results */}
                {loading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>Searching...</Text>
                    </View>
                )}

                {searched && !loading && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {results.length > 0 ? `${results.length} results for "${query}"` : `No results for "${query}"`}
                        </Text>
                        {results.map((song) => (
                            <SongCard
                                key={song._id}
                                song={song}
                                onPress={() => { playSong(song, results); navigation.navigate('Player'); }}
                                onLike={() => handleLike(song)}
                                isLiked={likedIds.includes(song._id)}
                            />
                        ))}
                        {results.length === 0 && (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyIcon}>🎵</Text>
                                <Text style={styles.emptyTitle}>No songs found</Text>
                                <Text style={styles.emptySubtitle}>Try different keywords</Text>
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </LinearGradient>
    );
};

const GENRE_COLORS = ['#7C3AED', '#06B6D4', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
const GENRE_ICONS = ['🎸', '🥁', '🎤', '🎹', '🎺', '🎻', '🎷', '🎵'];

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: SPACING.base, paddingBottom: SPACING.sm },
    title: { color: COLORS.white, fontSize: FONTS.sizes['2xl'], fontWeight: '800' },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: RADIUS.full,
        marginHorizontal: SPACING.base,
        paddingHorizontal: SPACING.md,
        height: 50,
        marginBottom: SPACING.base,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchIcon: { marginRight: SPACING.sm },
    searchInput: { flex: 1, color: COLORS.text, fontSize: FONTS.sizes.base },
    content: { flex: 1 },
    section: { paddingHorizontal: SPACING.base, marginBottom: SPACING.lg },
    sectionTitle: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700', marginBottom: SPACING.md },
    genreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
    genreCard: {
        width: '47%',
        height: 80,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
    },
    genreCardGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    genreText: { fontSize: 24 },
    genreLabel: { color: COLORS.white, fontWeight: '700', fontSize: FONTS.sizes.sm },
    loadingContainer: { alignItems: 'center', paddingVertical: SPACING['2xl'] },
    loadingText: { color: COLORS.textSecondary, marginTop: SPACING.sm },
    emptyState: { alignItems: 'center', paddingVertical: SPACING['2xl'] },
    emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
    emptyTitle: { color: COLORS.text, fontSize: FONTS.sizes.lg, fontWeight: '600', marginBottom: SPACING.xs },
    emptySubtitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
});

export default SearchScreen;
