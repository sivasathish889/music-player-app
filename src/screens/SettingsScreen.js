import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    Modal,
    FlatList,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSettings, QUALITY_OPTIONS } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, GRADIENTS } from '../constants';

// ─── Reusable Row Components ────────────────────────────────────

const SectionHeader = ({ title, subtitle }) => (
    <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
);

const SettingRow = ({ icon, iconColor = COLORS.primary, label, subtitle, onPress, right, danger = false }) => (
    <TouchableOpacity
        style={styles.settingRow}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress}
    >
        <LinearGradient
            colors={[iconColor + '33', iconColor + '11']}
            style={styles.settingIcon}
        >
            <Ionicons name={icon} size={18} color={iconColor} />
        </LinearGradient>
        <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, danger && { color: COLORS.error }]}>{label}</Text>
            {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
        </View>
        {right}
        {onPress && !right && (
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        )}
    </TouchableOpacity>
);

const ToggleRow = ({ icon, iconColor, label, subtitle, value, onToggle }) => (
    <SettingRow
        icon={icon}
        iconColor={iconColor}
        label={label}
        subtitle={subtitle}
        right={
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: COLORS.border, true: COLORS.primary + '88' }}
                thumbColor={value ? COLORS.primary : COLORS.textMuted}
                ios_backgroundColor={COLORS.border}
            />
        }
    />
);

const QualityBadge = ({ quality }) => {
    const q = QUALITY_OPTIONS.find(o => o.id === quality);
    return (
        <View style={styles.badge}>
            <Text style={styles.badgeText}>{q?.label || quality}</Text>
        </View>
    );
};

// ─── Quality Picker Modal ────────────────────────────────────────
const QualityModal = ({ visible, title, selected, onSelect, onClose }) => (
    <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
            <LinearGradient colors={['#1E1E2E', '#252538']} style={styles.modal}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={24} color={COLORS.textMuted} />
                    </TouchableOpacity>
                </View>
                {QUALITY_OPTIONS.map(opt => (
                    <TouchableOpacity
                        key={opt.id}
                        style={[styles.qualityOption, selected === opt.id && styles.qualityOptionSelected]}
                        onPress={() => { onSelect(opt.id); onClose(); }}
                    >
                        <View style={styles.qualityOptionLeft}>
                            <Text style={[styles.qualityLabel, selected === opt.id && { color: COLORS.primary }]}>
                                {opt.label}
                            </Text>
                            <Text style={styles.qualityDesc}>{opt.description}</Text>
                        </View>
                        {selected === opt.id && (
                            <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                        )}
                    </TouchableOpacity>
                ))}
            </LinearGradient>
        </View>
    </Modal>
);

// ─── Downloads Modal ─────────────────────────────────────────────
const DownloadsModal = ({ visible, onClose }) => {
    const { downloads, storageUsed, removeDownload, clearAllDownloads } = useSettings();

    const formatDuration = (sec) => {
        if (!sec) return '';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleRemove = (item) => {
        Alert.alert(
            'Remove Download',
            `Remove "${item.title}" from downloads?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => removeDownload(item.id) },
            ]
        );
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <LinearGradient colors={['#1E1E2E', '#252538']} style={[styles.modal, { maxHeight: '85%' }]}>
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={styles.modalTitle}>Downloaded Songs</Text>
                            <Text style={styles.modalSub}>{downloads.length} song{downloads.length !== 1 ? 's' : ''} · {storageUsed} used</Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color={COLORS.textMuted} />
                        </TouchableOpacity>
                    </View>

                    {downloads.length === 0 ? (
                        <View style={styles.emptyDownloads}>
                            <Text style={{ fontSize: 48, marginBottom: 12 }}>📭</Text>
                            <Text style={styles.emptyTitle}>No Downloads Yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Tap the cloud icon on any song or in the player to save it for offline.
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={downloads}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <View style={styles.downloadItem}>
                                    {/* Cover art */}
                                    {item.coverImage ? (
                                        <Image source={{ uri: item.coverImage }} style={styles.downloadArt} />
                                    ) : (
                                        <LinearGradient
                                            colors={['#4A1A7A', '#1E0A3C']}
                                            style={styles.downloadArt}
                                        >
                                            <Ionicons name="musical-notes" size={16} color="rgba(255,255,255,0.5)" />
                                        </LinearGradient>
                                    )}
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.downloadTitle} numberOfLines={1}>{item.title}</Text>
                                        <Text style={styles.downloadSub} numberOfLines={1}>
                                            {item.artist}{item.duration ? ` · ${formatDuration(item.duration)}` : ''}
                                        </Text>
                                    </View>
                                    <View style={styles.downloadBadge}>
                                        <Ionicons name="cloud-done" size={12} color={COLORS.accent} />
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleRemove(item)}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        style={{ marginLeft: 8 }}
                                    >
                                        <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                                    </TouchableOpacity>
                                </View>
                            )}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    )}
                </LinearGradient>
            </View>
        </Modal>
    );
};

// ─── Main Settings Screen ────────────────────────────────────────
const SettingsScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { settings, updateSetting, resetSettings, downloads, storageUsed, clearAllDownloads } = useSettings();
    const { logout } = useAuth();

    const [streamQualityModal, setStreamQualityModal] = useState(false);
    const [downloadQualityModal, setDownloadQualityModal] = useState(false);
    const [downloadsModal, setDownloadsModal] = useState(false);

    const handleReset = () => {
        Alert.alert(
            'Reset Settings',
            'This will restore all settings to their defaults. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        await resetSettings();
                        Alert.alert('Done', 'Settings have been reset.');
                    },
                },
            ]
        );
    };

    const handleClearDownloads = () => {
        Alert.alert(
            'Clear All Downloads',
            'This will remove all downloaded songs and free up storage. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear All',
                    style: 'destructive',
                    onPress: clearAllDownloads,
                },
            ]
        );
    };

    const downloadCount = downloads.length;

    return (
        <View style={styles.container}>
            {/* Background */}
            <LinearGradient colors={['#0D0819', '#0A0612']} style={StyleSheet.absoluteFill} />

            {/* Header */}
            <LinearGradient
                colors={['rgba(124,58,237,0.15)', 'transparent']}
                style={[styles.header, { paddingTop: insets.top + 8 }]}
            >
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="chevron-back" size={24} color={COLORS.white} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
            >
                {/* ── AUDIO QUALITY ────────────────── */}
                <SectionHeader
                    title="🎵 Audio Quality"
                    subtitle="Adjust streaming and download quality"
                />
                <View style={styles.card}>
                    <SettingRow
                        icon="radio-outline"
                        iconColor={COLORS.primary}
                        label="Streaming Quality"
                        subtitle={QUALITY_OPTIONS.find(o => o.id === settings.streamingQuality)?.description}
                        onPress={() => setStreamQualityModal(true)}
                        right={<QualityBadge quality={settings.streamingQuality} />}
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon="download-outline"
                        iconColor={COLORS.accent}
                        label="Download Quality"
                        subtitle={QUALITY_OPTIONS.find(o => o.id === settings.downloadQuality)?.description}
                        onPress={() => setDownloadQualityModal(true)}
                        right={<QualityBadge quality={settings.downloadQuality} />}
                    />
                    <View style={styles.divider} />
                    <ToggleRow
                        icon="volume-medium-outline"
                        iconColor="#10B981"
                        label="Normalize Volume"
                        subtitle="Keep all songs at a consistent volume level"
                        value={settings.normalizeVolume}
                        onToggle={(v) => updateSetting('normalizeVolume', v)}
                    />
                    <View style={styles.divider} />
                    <ToggleRow
                        icon="layers-outline"
                        iconColor={COLORS.warning}
                        label="Crossfade"
                        subtitle="Smoothly transition between songs"
                        value={settings.crossfade}
                        onToggle={(v) => updateSetting('crossfade', v)}
                    />
                </View>

                {/* ── DOWNLOADS ─────────────────────── */}
                <SectionHeader
                    title="📥 Downloads"
                    subtitle="Manage offline listening"
                />
                <View style={styles.card}>
                    <SettingRow
                        icon="folder-open-outline"
                        iconColor={COLORS.accent}
                        label="Downloaded Songs"
                        subtitle={`${downloadCount} song${downloadCount !== 1 ? 's' : ''} · ${storageUsed} used`}
                        onPress={() => setDownloadsModal(true)}
                    />
                    <View style={styles.divider} />
                    <ToggleRow
                        icon="wifi-outline"
                        iconColor="#3B82F6"
                        label="Download over Wi-Fi only"
                        subtitle="Avoid using mobile data for downloads"
                        value={settings.downloadOverWifiOnly}
                        onToggle={(v) => updateSetting('downloadOverWifiOnly', v)}
                    />
                    <View style={styles.divider} />
                    <ToggleRow
                        icon="heart-outline"
                        iconColor={COLORS.error}
                        label="Auto-download liked songs"
                        subtitle="Automatically save liked songs for offline"
                        value={settings.autoDownloadLiked}
                        onToggle={(v) => updateSetting('autoDownloadLiked', v)}
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon="trash-outline"
                        iconColor={COLORS.error}
                        label="Clear All Downloads"
                        subtitle="Free up your device storage"
                        onPress={handleClearDownloads}
                        danger
                    />
                </View>

                {/* ── PLAYBACK ──────────────────────── */}
                <SectionHeader title="▶️ Playback" />
                <View style={styles.card}>
                    <ToggleRow
                        icon="text-outline"
                        iconColor={COLORS.primary}
                        label="Show Lyrics"
                        subtitle="Display lyrics in the player screen"
                        value={settings.showLyrics}
                        onToggle={(v) => updateSetting('showLyrics', v)}
                    />
                </View>

                {/* ── NOTIFICATIONS ─────────────────── */}
                <SectionHeader title="🔔 Notifications" />
                <View style={styles.card}>
                    <ToggleRow
                        icon="notifications-outline"
                        iconColor={COLORS.warning}
                        label="Push Notifications"
                        subtitle="New releases, recommendations, & more"
                        value={settings.notifications}
                        onToggle={(v) => updateSetting('notifications', v)}
                    />
                </View>

                {/* ── APP ───────────────────────────── */}
                <SectionHeader title="⚙️ App" />
                <View style={styles.card}>
                    <SettingRow
                        icon="person-outline"
                        iconColor={COLORS.primary}
                        label="Edit Profile"
                        onPress={() => navigation.navigate('Profile')}
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon="information-circle-outline"
                        iconColor="#3B82F6"
                        label="About Rhythm"
                        subtitle="Version 1.0.0"
                        onPress={() =>
                            Alert.alert(
                                'Rhythm Music',
                                'Version 1.0.0\n\nYour premium music streaming experience.\n\nBuilt with Shiva❤️',
                                [{ text: 'OK' }]
                            )
                        }
                    />
                    <View style={styles.divider} />
                    <SettingRow
                        icon="refresh-outline"
                        iconColor={COLORS.warning}
                        label="Reset to Defaults"
                        onPress={handleReset}
                    />
                </View>

                {/* ── DANGER ZONE ───────────────────── */}
                <SectionHeader title="⚠️ Account" />
                <View style={styles.card}>
                    <SettingRow
                        icon="log-out-outline"
                        iconColor={COLORS.error}
                        label="Logout"
                        danger
                        onPress={() =>
                            Alert.alert('Logout', 'Are you sure you want to logout?', [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Logout', style: 'destructive', onPress: logout },
                            ])
                        }
                    />
                </View>

                <Text style={styles.footerText}>Rhythm Music · v1.0.0</Text>
            </ScrollView>

            {/* Modals */}
            <QualityModal
                visible={streamQualityModal}
                title="Streaming Quality"
                selected={settings.streamingQuality}
                onSelect={(v) => updateSetting('streamingQuality', v)}
                onClose={() => setStreamQualityModal(false)}
            />
            <QualityModal
                visible={downloadQualityModal}
                title="Download Quality"
                selected={settings.downloadQuality}
                onSelect={(v) => updateSetting('downloadQuality', v)}
                onClose={() => setDownloadQualityModal(false)}
            />
            <DownloadsModal
                visible={downloadsModal}
                onClose={() => setDownloadsModal(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0819',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        color: COLORS.white,
        fontSize: FONTS.sizes['2xl'],
        fontWeight: '800',
        letterSpacing: -0.5,
    },

    // Sections
    sectionHeader: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 8,
    },
    sectionTitle: {
        color: COLORS.white,
        fontSize: FONTS.sizes.base,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    sectionSubtitle: {
        color: COLORS.textMuted,
        fontSize: FONTS.sizes.xs,
        marginTop: 2,
    },

    // Card container for rows
    card: {
        marginHorizontal: 16,
        borderRadius: RADIUS.lg,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
        overflow: 'hidden',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginLeft: 60,
    },

    // Setting row
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    settingIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    settingInfo: {
        flex: 1,
    },
    settingLabel: {
        color: COLORS.text,
        fontSize: FONTS.sizes.base,
        fontWeight: '500',
    },
    settingSubtitle: {
        color: COLORS.textMuted,
        fontSize: FONTS.sizes.xs,
        marginTop: 1,
    },

    // Badge
    badge: {
        backgroundColor: COLORS.primary + '22',
        borderRadius: RADIUS.full,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: COLORS.primary + '44',
        marginRight: 6,
    },
    badgeText: {
        color: COLORS.primary,
        fontSize: FONTS.sizes.xs,
        fontWeight: '700',
    },

    // Modals
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'flex-end',
    },
    modal: {
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        padding: SPACING.xl,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    modalTitle: {
        color: COLORS.white,
        fontSize: FONTS.sizes.xl,
        fontWeight: '800',
    },
    modalSub: {
        color: COLORS.textMuted,
        fontSize: FONTS.sizes.xs,
        marginTop: 2,
    },

    // Quality picker
    qualityOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: RADIUS.md,
        marginBottom: 8,
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
    },
    qualityOptionSelected: {
        backgroundColor: COLORS.primary + '18',
        borderColor: COLORS.primary + '55',
    },
    qualityOptionLeft: {
        flex: 1,
    },
    qualityLabel: {
        color: COLORS.white,
        fontSize: FONTS.sizes.base,
        fontWeight: '600',
    },
    qualityDesc: {
        color: COLORS.textMuted,
        fontSize: FONTS.sizes.xs,
        marginTop: 2,
    },

    // Downloads modal
    emptyDownloads: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyTitle: {
        color: COLORS.white,
        fontSize: FONTS.sizes.lg,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptySubtitle: {
        color: COLORS.textMuted,
        fontSize: FONTS.sizes.sm,
        textAlign: 'center',
        lineHeight: 20,
    },
    downloadItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    downloadArt: {
        width: 44,
        height: 44,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    downloadBadge: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: COLORS.accent + '22',
        borderWidth: 1,
        borderColor: COLORS.accent + '55',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
    downloadTitle: {
        color: COLORS.white,
        fontSize: FONTS.sizes.sm,
        fontWeight: '500',
    },
    downloadSub: {
        color: COLORS.textMuted,
        fontSize: FONTS.sizes.xs,
        marginTop: 2,
    },

    footerText: {
        color: COLORS.textMuted,
        fontSize: FONTS.sizes.xs,
        textAlign: 'center',
        marginTop: 32,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
});

export default SettingsScreen;
