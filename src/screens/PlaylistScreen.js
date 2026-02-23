import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
    Image,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { playlistAPI, userAPI, songAPI } from '../services/api';
import SongCard from '../components/SongCard';
import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS } from '../constants';
import Ionicons from '@expo/vector-icons/Ionicons';

const PlaylistScreen = ({ navigation }) => {
    const { user } = useAuth();
    const { playSong } = usePlayer();
    const insets = useSafeAreaInsets();

    const [playlists, setPlaylists] = useState([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState(null);
    const [likedSongs, setLikedSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [createModal, setCreateModal] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [creating, setCreating] = useState(false);
    const [view, setView] = useState('playlists'); // 'playlists' | 'liked' | 'songs'
    const [likedIds, setLikedIds] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [addingSongId, setAddingSongId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async (isRefresh = false) => {
        if (!isRefresh) setLoading(true);
        try {
            const [playlistsRes, likedRes, recsRes] = await Promise.allSettled([
                playlistAPI.getUserPlaylists(user._id),
                userAPI.getLikedSongs(user._id),
                userAPI.getRecommendations(user._id, 10),
            ]);
            if (playlistsRes.status === 'fulfilled') setPlaylists(playlistsRes.value.playlists || []);
            if (likedRes.status === 'fulfilled') {
                setLikedSongs(likedRes.value.songs || []);
                setLikedIds((likedRes.value.songs || []).map(s => s._id));
            }
            if (recsRes.status === 'fulfilled') setRecommendations(recsRes.value.songs || []);
        } catch (e) { } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchData(true);
    }, [user._id]);

    const createPlaylist = async () => {
        if (!newPlaylistName.trim()) {
            Alert.alert('Error', 'Playlist name is required.');
            return;
        }
        setCreating(true);
        try {
            const res = await playlistAPI.create({ name: newPlaylistName.trim() });
            setPlaylists(prev => [res.playlist, ...prev]);
            setNewPlaylistName('');
            setCreateModal(false);
        } catch (e) {
            Alert.alert('Error', e.message || 'Failed to create playlist.');
        } finally { setCreating(false); }
    };

    const deletePlaylist = async (playlistId) => {
        Alert.alert('Delete Playlist', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await playlistAPI.delete(playlistId);
                        setPlaylists(prev => prev.filter(p => p._id !== playlistId));
                        if (selectedPlaylist?._id === playlistId) setSelectedPlaylist(null);
                    } catch (e) { Alert.alert('Error', e.message); }
                },
            },
        ]);
    };

    const handleLike = async (song) => {
        try {
            const res = await songAPI.toggleLike(song._id);
            if (res.liked) {
                setLikedIds(prev => [...prev, song._id]);
                setLikedSongs(prev => [...prev, song]);
            } else {
                setLikedIds(prev => prev.filter(id => id !== song._id));
                setLikedSongs(prev => prev.filter(s => s._id !== song._id));
            }
        } catch (e) { }
    };

    const handleAddToPlaylist = async (songId) => {
        if (!selectedPlaylist) return;
        setAddingSongId(songId);
        try {
            await playlistAPI.addSong(selectedPlaylist._id, songId);
            // Update local state to show the song in the playlist immediately
            const addedSong = recommendations.find(s => s._id === songId);
            if (addedSong) {
                const updatedPlaylist = {
                    ...selectedPlaylist,
                    songs: [...(selectedPlaylist.songs || []), addedSong]
                };
                setSelectedPlaylist(updatedPlaylist);
                setPlaylists(prev => prev.map(p => p._id === selectedPlaylist._id ? updatedPlaylist : p));
            }
            Alert.alert('Success', 'Song added to playlist!');
        } catch (e) {
            Alert.alert('Error', e.message || 'Failed to add song.');
        } finally {
            setAddingSongId(null);
        }
    };

    const PlaylistCard = ({ item }) => (
        <TouchableOpacity onPress={() => { setSelectedPlaylist(item); setView('songs'); }}>
            <LinearGradient colors={GRADIENTS.card} style={styles.playlistCard}>
                <View style={styles.playlistImageContainer}>
                    {item.songs?.[0]?.coverImage ? (
                        <Image source={{ uri: item.songs[0].coverImage }} style={styles.playlistImage} />
                    ) : (
                        <LinearGradient colors={GRADIENTS.primary} style={styles.playlistImageFallback}>
                            <Ionicons name="musical-notes" size={24} color={COLORS.white} />
                        </LinearGradient>
                    )}
                </View>
                <View style={styles.playlistInfo}>
                    <Text style={styles.playlistName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.playlistSongCount}>{item.songs?.length || 0} songs</Text>
                </View>
                <TouchableOpacity onPress={() => deletePlaylist(item._id)} style={styles.deleteBtnSmall}>
                    <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                </TouchableOpacity>
                <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </LinearGradient>
        </TouchableOpacity>
    );

    return (
        <LinearGradient colors={['#0A0A0F', '#12121A']} style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
                {view !== 'playlists' && (
                    <TouchableOpacity onPress={() => { setView('playlists'); setSelectedPlaylist(null); }} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.white} />
                    </TouchableOpacity>
                )}
                <Text style={styles.headerTitle}>
                    {view === 'playlists' ? 'My Library' : view === 'liked' ? '❤️ Liked Songs' : selectedPlaylist?.name}
                </Text>
                {view === 'playlists' && (
                    <TouchableOpacity onPress={() => setCreateModal(true)} style={styles.addBtn}>
                        <LinearGradient colors={GRADIENTS.primary} style={styles.addBtnGradient}>
                            <Ionicons name="add" size={22} color={COLORS.white} />
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </View>

            {/* Tab Switcher */}
            {view === 'playlists' && (
                <View style={styles.tabContainer}>
                    {[
                        { key: 'playlists', label: 'Playlists', icon: 'list' },
                        { key: 'liked', label: 'Liked', icon: 'heart' },
                    ].map((tab) => (
                        <TouchableOpacity
                            key={tab.key}
                            onPress={() => setView(tab.key)}
                            style={[styles.tab, view === tab.key && styles.tabActive]}
                        >
                            <Ionicons name={tab.icon} size={16} color={view === tab.key ? COLORS.primary : COLORS.textMuted} />
                            <Text style={[styles.tabText, view === tab.key && styles.tabTextActive]}>{tab.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <ScrollView
                    style={styles.list}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ padding: SPACING.base, paddingBottom: 120 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={COLORS.primary}
                            colors={[COLORS.primary]}
                        />
                    }
                >
                    {view === 'playlists' && (
                        <>
                            {playlists.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyIcon}>🎵</Text>
                                    <Text style={styles.emptyTitle}>No playlists yet</Text>
                                    <TouchableOpacity onPress={() => setCreateModal(true)} style={styles.createBtn}>
                                        <LinearGradient colors={GRADIENTS.primary} style={styles.createBtnGradient}>
                                            <Text style={styles.createBtnText}>Create Playlist</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                playlists.map((item) => <PlaylistCard key={item._id} item={item} />)
                            )}
                        </>
                    )}

                    {view === 'liked' && (
                        <>
                            {likedSongs.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyIcon}>💔</Text>
                                    <Text style={styles.emptyTitle}>No liked songs yet</Text>
                                    <Text style={styles.emptySubtitle}>Like songs to see them here</Text>
                                </View>
                            ) : (
                                likedSongs.map((song) => (
                                    <SongCard
                                        key={song._id}
                                        song={song}
                                        onPress={() => { playSong(song, likedSongs); navigation.navigate('Player'); }}
                                        onLike={() => handleLike(song)}
                                        isLiked={likedIds.includes(song._id)}
                                    />
                                ))
                            )}
                        </>
                    )}

                    {view === 'songs' && selectedPlaylist && (
                        <>
                            {selectedPlaylist.songs?.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyIcon}>🎵</Text>
                                    <Text style={styles.emptyTitle}>No songs in this playlist</Text>
                                    <Text style={styles.emptySubtitle}>Explore the suggestions below!</Text>
                                </View>
                            ) : (
                                (selectedPlaylist.songs || []).map((song) => (
                                    <SongCard
                                        key={song._id}
                                        song={song}
                                        onPress={() => { playSong(song, selectedPlaylist.songs); navigation.navigate('Player'); }}
                                        onLike={() => handleLike(song)}
                                        isLiked={likedIds.includes(song._id)}
                                    />
                                ))
                            )}

                            {/* Recommendations at bottom of playlist */}
                            {recommendations.length > 0 && (
                                <View style={styles.suggestionSection}>
                                    <View style={styles.suggestionHeader}>
                                        <View>
                                            <Text style={styles.suggestionTitle}>Recommended for you</Text>
                                            <Text style={styles.suggestionSubtitle}>Based on your taste profile</Text>
                                        </View>
                                        <TouchableOpacity onPress={onRefresh}>
                                            <Ionicons name="refresh" size={20} color={COLORS.primary} />
                                        </TouchableOpacity>
                                    </View>

                                    {recommendations.map((song) => {
                                        const isInPlaylist = selectedPlaylist.songs?.some(s => s._id === song._id);
                                        return (
                                            <View key={song._id} style={styles.suggestionRow}>
                                                <View style={{ flex: 1 }}>
                                                    <SongCard
                                                        song={song}
                                                        onPress={() => { playSong(song, recommendations); navigation.navigate('Player'); }}
                                                        onLike={() => handleLike(song)}
                                                        isLiked={likedIds.includes(song._id)}
                                                    />
                                                </View>
                                                {!isInPlaylist && (
                                                    <TouchableOpacity
                                                        style={styles.addSongPill}
                                                        onPress={() => handleAddToPlaylist(song._id)}
                                                        disabled={addingSongId === song._id}
                                                    >
                                                        {addingSongId === song._id ? (
                                                            <ActivityIndicator size="small" color={COLORS.primary} />
                                                        ) : (
                                                            <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                                                        )}
                                                    </TouchableOpacity>
                                                )}
                                                {isInPlaylist && (
                                                    <View style={styles.addSongPill}>
                                                        <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
                                                    </View>
                                                )}
                                            </View>
                                        );
                                    })}
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>
            )}

            {/* Create Playlist Modal */}
            <Modal visible={createModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <LinearGradient colors={['#1E1E2E', '#252538']} style={styles.modal}>
                        <Text style={styles.modalTitle}>New Playlist</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Playlist name..."
                            placeholderTextColor={COLORS.textMuted}
                            value={newPlaylistName}
                            onChangeText={setNewPlaylistName}
                            autoFocus
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => { setCreateModal(false); setNewPlaylistName(''); }} style={styles.cancelBtn}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={createPlaylist} disabled={creating}>
                                <LinearGradient colors={GRADIENTS.primary} style={styles.confirmBtn}>
                                    <Text style={styles.confirmBtnText}>{creating ? 'Creating...' : 'Create'}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </LinearGradient>
                </View>
            </Modal>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.base,
        paddingBottom: SPACING.sm,
    },
    backBtn: { marginRight: SPACING.sm },
    headerTitle: { flex: 1, color: COLORS.white, fontSize: FONTS.sizes['2xl'], fontWeight: '800' },
    addBtn: { borderRadius: RADIUS.full, overflow: 'hidden' },
    addBtnGradient: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: SPACING.base,
        marginBottom: SPACING.sm,
        backgroundColor: COLORS.card,
        borderRadius: RADIUS.lg,
        padding: 4,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.md,
        gap: 6,
    },
    tabActive: { backgroundColor: COLORS.surfaceLight },
    tabText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, fontWeight: '600' },
    tabTextActive: { color: COLORS.primary },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { flex: 1 },
    playlistCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: RADIUS.md,
        padding: SPACING.sm,
        marginBottom: SPACING.sm,
    },
    playlistImageContainer: { width: 56, height: 56, borderRadius: RADIUS.sm, overflow: 'hidden' },
    playlistImage: { width: '100%', height: '100%' },
    playlistImageFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    playlistInfo: { flex: 1, marginHorizontal: SPACING.sm },
    playlistName: { color: COLORS.text, fontSize: FONTS.sizes.base, fontWeight: '600' },
    playlistSongCount: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
    deleteBtnSmall: { padding: SPACING.xs, marginRight: SPACING.xs },
    emptyState: { alignItems: 'center', paddingVertical: SPACING['3xl'] },
    emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
    emptyTitle: { color: COLORS.text, fontSize: FONTS.sizes.lg, fontWeight: '600', marginBottom: SPACING.xs },
    emptySubtitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
    createBtn: { marginTop: SPACING.lg, borderRadius: RADIUS.md, overflow: 'hidden' },
    createBtnGradient: { paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm },
    createBtnText: { color: COLORS.white, fontWeight: '700' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modal: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.xl },
    modalTitle: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '800', marginBottom: SPACING.lg },
    modalInput: {
        backgroundColor: COLORS.surfaceLight,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: SPACING.md,
        color: COLORS.text,
        fontSize: FONTS.sizes.base,
        marginBottom: SPACING.lg,
    },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm },
    cancelBtn: { padding: SPACING.sm, marginRight: SPACING.sm },
    cancelBtnText: { color: COLORS.textMuted, fontSize: FONTS.sizes.base },
    confirmBtn: { borderRadius: RADIUS.sm, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm },
    confirmBtnText: { color: COLORS.white, fontWeight: '700' },
    suggestionSection: { marginTop: SPACING.xl, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.xl },
    suggestionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
    suggestionTitle: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '800' },
    suggestionSubtitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
    suggestionRow: { flexDirection: 'row', alignItems: 'center' },
    addSongPill: { padding: SPACING.sm, marginLeft: SPACING.xs },
});

export default PlaylistScreen;
