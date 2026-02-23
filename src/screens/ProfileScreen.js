import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert,
    TextInput,
    Modal,
    RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';
import { userAPI } from '../services/api';
import SongCard from '../components/SongCard';
import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS } from '../constants';
import Ionicons from '@expo/vector-icons/Ionicons';

const ProfileScreen = ({ navigation }) => {
    const { user, logout, updateUser } = useAuth();
    const { currentSong, playSong } = usePlayer();
    const insets = useSafeAreaInsets();
    const [likedSongs, setLikedSongs] = useState([]);
    const [recentlyPlayed, setRecentlyPlayed] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [tasteProfile, setTasteProfile] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [editModal, setEditModal] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const [editBio, setEditBio] = useState(user?.bio || '');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const [liked, recent, recs] = await Promise.allSettled([
                userAPI.getLikedSongs(user._id),
                userAPI.getRecentlyPlayed(user._id),
                userAPI.getRecommendations(user._id, 20),
            ]);
            if (liked.status === 'fulfilled') setLikedSongs(liked.value.songs || []);
            if (recent.status === 'fulfilled') setRecentlyPlayed(recent.value.songs || []);
            if (recs.status === 'fulfilled') {
                setRecommendations(recs.value.songs || []);
                setTasteProfile(recs.value.meta?.tasteProfile || null);
            }
        } catch (e) { } finally {
            setRefreshing(false);
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchUserData();
    }, [user._id]);

    const handleUpdateProfile = async () => {
        try {
            const formData = new FormData();
            formData.append('name', editName.trim());
            formData.append('bio', editBio.trim());
            const res = await userAPI.updateProfile(formData);
            if (res.success) {
                await updateUser({ ...user, name: res.user.name, bio: res.user.bio });
                setEditModal(false);
            }
        } catch (e) {
            Alert.alert('Error', e.message || 'Failed to update profile.');
        }
    };

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
        ]);
    };

    const TABS = ['overview', 'liked', 'recent', 'for you'];

    return (
        <LinearGradient colors={['#0A0A0F', '#12121A']} style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                    />
                }
            >
                {/* Header/Avatar */}
                <LinearGradient colors={['#1A0A2E', '#0A0A1A']} style={[styles.profileHeader, { paddingTop: insets.top + SPACING.sm }]}>
                    {/* Edit & Logout */}
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={() => { setEditName(user?.name || ''); setEditBio(user?.bio || ''); setEditModal(true); }}>
                            <Ionicons name="create-outline" size={24} color={COLORS.white} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleLogout}>
                            <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
                        </TouchableOpacity>
                    </View>

                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        {user?.avatar ? (
                            <Image source={{ uri: user.avatar }} style={styles.avatar} />
                        ) : (
                            <LinearGradient colors={GRADIENTS.primary} style={styles.avatarFallback}>
                                <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
                            </LinearGradient>
                        )}
                        <View style={styles.onlineDot} />
                    </View>

                    <Text style={styles.name}>{user?.name}</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                    {user?.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

                    {user?.role === 'admin' && (
                        <View style={styles.adminBadge}>
                            <Ionicons name="shield-checkmark" size={12} color={COLORS.warning} />
                            <Text style={styles.adminText}>Admin</Text>
                        </View>
                    )}

                    {/* Stats */}
                    <View style={styles.stats}>
                        {[
                            { label: 'Liked', value: likedSongs.length },
                            { label: 'Recent', value: recentlyPlayed.length },
                            { label: 'Recs', value: recommendations.length },
                        ].map((stat, i) => (
                            <View key={i} style={styles.statItem}>
                                <Text style={styles.statValue}>{stat.value}</Text>
                                <Text style={styles.statLabel}>{stat.label}</Text>
                            </View>
                        ))}
                    </View>
                </LinearGradient>

                {/* Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={{ paddingHorizontal: SPACING.base }}>
                    {TABS.map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={[styles.tab, activeTab === tab && styles.tabActive]}
                        >
                            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Tab Content */}
                <View style={styles.tabContent}>
                    {activeTab === 'overview' && (
                        <>
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>🎵 Now Playing</Text>
                                {currentSong ? (
                                    <View style={styles.nowPlayingCard}>
                                        <LinearGradient colors={GRADIENTS.card} style={styles.nowPlayingInner}>
                                            <Ionicons name="musical-notes" size={20} color={COLORS.primary} />
                                            <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                                                <Text style={styles.nowPlayingTitle}>{currentSong.title}</Text>
                                                <Text style={styles.nowPlayingArtist}>{currentSong.artist}</Text>
                                            </View>
                                            <TouchableOpacity onPress={() => navigation.navigate('Player')}>
                                                <Ionicons name="open-outline" size={18} color={COLORS.primary} />
                                            </TouchableOpacity>
                                        </LinearGradient>
                                    </View>
                                ) : (
                                    <Text style={styles.emptySubtitle}>Nothing playing right now</Text>
                                )}
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>⚡ Settings</Text>
                                {[
                                    { icon: 'notifications-outline', label: 'Notifications', color: COLORS.warning },
                                    { icon: 'download-outline', label: 'Downloads', color: COLORS.accent },
                                    { icon: 'information-circle-outline', label: 'About', color: COLORS.primary },
                                ].map((item, i) => (
                                    <View key={i} style={styles.settingRow}>
                                        <LinearGradient colors={[item.color + '33', item.color + '11']} style={styles.settingIcon}>
                                            <Ionicons name={item.icon} size={18} color={item.color} />
                                        </LinearGradient>
                                        <Text style={styles.settingLabel}>{item.label}</Text>
                                        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {activeTab === 'liked' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>❤️ Liked Songs ({likedSongs.length})</Text>
                            {likedSongs.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyIcon}>💔</Text>
                                    <Text style={styles.emptyTitle}>No liked songs</Text>
                                </View>
                            ) : (
                                likedSongs.map((song) => (
                                    <SongCard
                                        key={song._id}
                                        song={song}
                                        onPress={() => { playSong(song, likedSongs); navigation.navigate('Player'); }}
                                    />
                                ))
                            )}
                        </View>
                    )}

                    {activeTab === 'recent' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>🕐 Recently Played ({recentlyPlayed.length})</Text>
                            {recentlyPlayed.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyIcon}>🎵</Text>
                                    <Text style={styles.emptyTitle}>No recent history</Text>
                                </View>
                            ) : (
                                recentlyPlayed.map((song) => (
                                    <SongCard
                                        key={song._id}
                                        song={song}
                                        onPress={() => { playSong(song, recentlyPlayed); navigation.navigate('Player'); }}
                                    />
                                ))
                            )}
                        </View>
                    )}

                    {activeTab === 'for you' && (
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>✨ Made For You</Text>

                            {/* ── Taste Profile Card ── */}
                            {tasteProfile && (
                                <View style={styles.tasteCard}>
                                    <LinearGradient colors={['rgba(124,58,237,0.18)', 'rgba(6,182,212,0.08)']} style={styles.tasteCardInner}>
                                        <View style={styles.tasteHeader}>
                                            <Text style={styles.tasteTitle}>🎧 Your Taste Profile</Text>
                                            <View style={styles.algoChip}>
                                                <Text style={styles.algoChipText}>AI · Hybrid</Text>
                                            </View>
                                        </View>

                                        {/* Genre pills */}
                                        {tasteProfile.topGenres?.length > 0 && (
                                            <View style={styles.tasteRow}>
                                                <Text style={styles.tasteLabel}>Genres</Text>
                                                <View style={styles.pills}>
                                                    {tasteProfile.topGenres.map((g, i) => (
                                                        <View key={i} style={[styles.pill, { backgroundColor: COLORS.primary + '28' }]}>
                                                            <Text style={[styles.pillText, { color: COLORS.primary }]}>{g}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        )}

                                        {/* Artist pills */}
                                        {tasteProfile.topArtists?.length > 0 && (
                                            <View style={styles.tasteRow}>
                                                <Text style={styles.tasteLabel}>Artists</Text>
                                                <View style={styles.pills}>
                                                    {tasteProfile.topArtists.map((a, i) => (
                                                        <View key={i} style={[styles.pill, { backgroundColor: '#06b6d4' + '22' }]}>
                                                            <Text style={[styles.pillText, { color: '#06b6d4' }]}>{a}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            </View>
                                        )}

                                        {/* Signals */}
                                        {tasteProfile.signals && (
                                            <View style={styles.signalsRow}>
                                                <View style={styles.signalItem}>
                                                    <Ionicons name="heart" size={12} color={COLORS.error} />
                                                    <Text style={styles.signalText}>{tasteProfile.signals.likedSongs} liked</Text>
                                                </View>
                                                <View style={styles.signalItem}>
                                                    <Ionicons name="time" size={12} color={COLORS.accent} />
                                                    <Text style={styles.signalText}>{tasteProfile.signals.recentlyPlayed} played</Text>
                                                </View>
                                                <View style={styles.signalItem}>
                                                    <Ionicons name="people" size={12} color={COLORS.success} />
                                                    <Text style={styles.signalText}>collab {tasteProfile.signals.similarUsers}</Text>
                                                </View>
                                                <View style={styles.signalItem}>
                                                    <Ionicons name="sparkles" size={12} color={COLORS.warning} />
                                                    <Text style={styles.signalText}>{tasteProfile.signals.discoveryRatio} new</Text>
                                                </View>
                                            </View>
                                        )}
                                    </LinearGradient>
                                </View>
                            )}

                            {/* ── Song list ── */}
                            {recommendations.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyIcon}>🎯</Text>
                                    <Text style={styles.emptyTitle}>No recommendations yet</Text>
                                    <Text style={styles.emptySubtitle}>Like some songs to get personalized picks</Text>
                                </View>
                            ) : (
                                recommendations.map((song, idx) => (
                                    <View key={song._id} style={{ position: 'relative' }}>
                                        <SongCard
                                            song={song}
                                            onPress={() => { playSong(song, recommendations, idx); navigation.navigate('Player'); }}
                                        />
                                        {/* Discovery badge — every 5th song is a discovery */}
                                        {(idx + 1) % 5 === 0 && (
                                            <View style={styles.discoveryBadge}>
                                                <Ionicons name="sparkles" size={10} color={COLORS.warning} />
                                                <Text style={styles.discoveryText}>Discovery</Text>
                                            </View>
                                        )}
                                    </View>
                                ))
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal visible={editModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <LinearGradient colors={['#1E1E2E', '#252538']} style={styles.modal}>
                        <Text style={styles.modalTitle}>Edit Profile</Text>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Name</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={editName}
                                onChangeText={setEditName}
                                placeholderTextColor={COLORS.textMuted}
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Bio</Text>
                            <TextInput
                                style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
                                value={editBio}
                                onChangeText={setEditBio}
                                placeholder="Tell us about yourself..."
                                placeholderTextColor={COLORS.textMuted}
                                multiline
                            />
                        </View>
                        <View style={styles.modalActions}>
                            <TouchableOpacity onPress={() => setEditModal(false)} style={styles.cancelBtn}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleUpdateProfile}>
                                <LinearGradient colors={GRADIENTS.primary} style={styles.saveBtn}>
                                    <Text style={styles.saveBtnText}>Save</Text>
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
    profileHeader: { padding: SPACING.xl, alignItems: 'center', paddingBottom: SPACING.xl },
    headerActions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: SPACING.lg },
    avatarContainer: { position: 'relative', marginBottom: SPACING.base },
    avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: COLORS.primary },
    avatarFallback: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: COLORS.primary },
    avatarText: { color: COLORS.white, fontSize: FONTS.sizes['3xl'], fontWeight: '800' },
    onlineDot: { position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: 7, backgroundColor: COLORS.success, borderWidth: 2, borderColor: COLORS.background },
    name: { color: COLORS.white, fontSize: FONTS.sizes['2xl'], fontWeight: '800', marginBottom: 4 },
    email: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginBottom: 8 },
    bio: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, textAlign: 'center', marginBottom: 8 },
    adminBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.warning + '22', paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full, marginBottom: SPACING.sm },
    adminText: { color: COLORS.warning, fontSize: FONTS.sizes.xs, fontWeight: '700' },
    stats: { flexDirection: 'row', marginTop: SPACING.lg, gap: SPACING.xl },
    statItem: { alignItems: 'center' },
    statValue: { color: COLORS.white, fontSize: FONTS.sizes['2xl'], fontWeight: '800' },
    statLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
    tabsScroll: { marginVertical: SPACING.sm },
    tab: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, marginRight: SPACING.sm, backgroundColor: COLORS.card },
    tabActive: { backgroundColor: COLORS.primary },
    tabText: { color: COLORS.textMuted, fontWeight: '600', fontSize: FONTS.sizes.sm },
    tabTextActive: { color: COLORS.white },
    tabContent: { paddingHorizontal: SPACING.base },
    section: { marginBottom: SPACING.lg },
    sectionTitle: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: '700', marginBottom: SPACING.sm },
    nowPlayingCard: { borderRadius: RADIUS.md, overflow: 'hidden' },
    nowPlayingInner: { flexDirection: 'row', alignItems: 'center', padding: SPACING.md },
    nowPlayingTitle: { color: COLORS.text, fontWeight: '600', fontSize: FONTS.sizes.sm },
    nowPlayingArtist: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
    emptySubtitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
    settingRow: { flexDirection: 'row', alignItems: 'center', padding: SPACING.sm, borderRadius: RADIUS.md, backgroundColor: COLORS.card, marginBottom: SPACING.sm },
    settingIcon: { width: 36, height: 36, borderRadius: RADIUS.sm, justifyContent: 'center', alignItems: 'center', marginRight: SPACING.sm },
    settingLabel: { flex: 1, color: COLORS.text, fontSize: FONTS.sizes.base },
    emptyState: { alignItems: 'center', paddingVertical: SPACING['2xl'] },
    emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
    emptyTitle: { color: COLORS.text, fontSize: FONTS.sizes.lg, fontWeight: '600' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modal: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.xl },
    modalTitle: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: '800', marginBottom: SPACING.lg },
    inputGroup: { marginBottom: SPACING.md },
    inputLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '600', marginBottom: SPACING.xs },
    modalInput: { backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, color: COLORS.text, fontSize: FONTS.sizes.base },
    modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.md },
    cancelBtn: { padding: SPACING.sm },
    cancelBtnText: { color: COLORS.textMuted, fontSize: FONTS.sizes.base },
    saveBtn: { borderRadius: RADIUS.sm, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm },
    saveBtnText: { color: COLORS.white, fontWeight: '700' },
    // Taste profile card
    tasteCard: { marginBottom: SPACING.md, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(124,58,237,0.25)' },
    tasteCardInner: { padding: SPACING.md },
    tasteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
    tasteTitle: { color: COLORS.white, fontSize: FONTS.sizes.base, fontWeight: '700' },
    algoChip: { backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: RADIUS.full, paddingHorizontal: 8, paddingVertical: 3 },
    algoChipText: { color: COLORS.primary, fontSize: 10, fontWeight: '700' },
    tasteRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs, gap: SPACING.sm },
    tasteLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '600', width: 48 },
    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.full },
    pillText: { fontSize: 11, fontWeight: '600' },
    signalsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.07)' },
    signalItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    signalText: { color: COLORS.textMuted, fontSize: 11 },
    // Discovery badge
    discoveryBadge: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.warning + '22', borderRadius: RADIUS.full, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: COLORS.warning + '44' },
    discoveryText: { color: COLORS.warning, fontSize: 9, fontWeight: '700' },
});

export default ProfileScreen;
