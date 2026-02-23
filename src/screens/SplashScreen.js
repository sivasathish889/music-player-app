import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Animated,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');

// ─── Slide Illustrations (pure RN) ────────────────────────────
const FocusIllustration = () => (
    <View style={ill.wrapper}>
        {/* Radial glow */}
        <View style={[ill.glow, { backgroundColor: '#C0392B', opacity: 0.55, width: 180, height: 180, borderRadius: 90 }]} />
        <View style={[ill.glow, { backgroundColor: '#E74C3C', opacity: 0.25, width: 260, height: 260, borderRadius: 130 }]} />
        {/* Platform */}
        <View style={ill.platform}>
            <LinearGradient colors={['#3D2260', '#1E0E3A']} style={ill.platformGrad} />
        </View>
        {/* Laptop */}
        <View style={ill.laptopBase}>
            <LinearGradient colors={['#2C1654', '#1A0B33']} style={ill.laptopGrad} />
        </View>
        <View style={ill.laptopScreen}>
            <LinearGradient colors={['#9B59B6', '#6C3483']} style={{ flex: 1 }} />
        </View>
        {/* Person body */}
        <View style={ill.personBody}>
            <LinearGradient colors={['#8E44AD', '#6C3483']} style={{ flex: 1, borderRadius: 12 }} />
        </View>
        {/* Head */}
        <View style={ill.head}>
            <LinearGradient colors={['#9B6FCB', '#7D5BA6']} style={{ flex: 1, borderRadius: 20 }} />
        </View>
        {/* Headphones arc */}
        <View style={ill.headphonesArc} />
        <View style={[ill.headphonesEar, { left: '24%' }]} />
        <View style={[ill.headphonesEar, { right: '24%' }]} />
        {/* Sound waves */}
        {[-40, -15, 10, 35].map((offset, i) => (
            <View key={i} style={[ill.wave, { left: width * 0.5 + offset - 20, opacity: 0.35 - i * 0.04 }]} />
        ))}
    </View>
);

const RelaxIllustration = () => (
    <View style={ill.wrapper}>
        <View style={[ill.glow, { backgroundColor: '#7D3C98', opacity: 0.5, width: 160, height: 160, borderRadius: 80 }]} />
        <View style={[ill.glow, { backgroundColor: '#6C3483', opacity: 0.22, width: 240, height: 240, borderRadius: 120 }]} />
        {/* Floating platform trail */}
        <View style={[ill.platform, { width: 220, height: 28, bottom: '28%', borderRadius: 40 }]}>
            <LinearGradient colors={['#5B2C6F', '#2E1053']} style={{ flex: 1, borderRadius: 40 }} />
        </View>
        <View style={[ill.platform, { width: 100, height: 14, bottom: '22%', left: '35%', opacity: 0.4 }]}>
            <LinearGradient colors={['#7D3C98', '#4A235A']} style={{ flex: 1, borderRadius: 20 }} />
        </View>
        {/* Person body - walking pose */}
        <View style={[ill.personBody, { bottom: '33%', width: 38, height: 64 }]}>
            <LinearGradient colors={['#5DADE2', '#2E86C1']} style={{ flex: 1, borderRadius: 12 }} />
        </View>
        <View style={[ill.head, { bottom: '52%', width: 36, height: 36 }]}>
            <LinearGradient colors={['#85C1E9', '#5DADE2']} style={{ flex: 1, borderRadius: 18 }} />
        </View>
        <View style={[ill.headphonesArc, { bottom: '56%' }]} />
        <View style={[ill.headphonesEar, { left: '26%', bottom: '53%' }]} />
        <View style={[ill.headphonesEar, { right: '26%', bottom: '53%' }]} />
    </View>
);

const MeditateIllustration = () => (
    <View style={ill.wrapper}>
        <View style={[ill.glow, { backgroundColor: '#1A5276', opacity: 0.55, width: 170, height: 170, borderRadius: 85 }]} />
        <View style={[ill.glow, { backgroundColor: '#154360', opacity: 0.25, width: 250, height: 250, borderRadius: 125 }]} />
        {/* Floating desk - isometric */}
        <View style={[ill.platform, { width: 200, height: 80, bottom: '27%', borderRadius: 12 }]}>
            <LinearGradient colors={['#1A3A5C', '#0D1F33']} style={{ flex: 1, borderRadius: 12 }} />
        </View>
        {/* Desk item - monitor */}
        <View style={[ill.laptopScreen, { width: 70, height: 50, bottom: '42%' }]}>
            <LinearGradient colors={['#2980B9', '#1A5276']} style={{ flex: 1 }} />
        </View>
        {/* Person */}
        <View style={[ill.personBody, { bottom: '38%', height: 58 }]}>
            <LinearGradient colors={['#2980B9', '#1ABC9C']} style={{ flex: 1, borderRadius: 10 }} />
        </View>
        <View style={[ill.head, { bottom: '54%', width: 34, height: 34 }]}>
            <LinearGradient colors={['#5DADE2', '#48C9B0']} style={{ flex: 1, borderRadius: 17 }} />
        </View>
        <View style={[ill.headphonesArc, { bottom: '59%' }]} />
        <View style={[ill.headphonesEar, { left: '26%', bottom: '56%' }]} />
        <View style={[ill.headphonesEar, { right: '26%', bottom: '56%' }]} />
    </View>
);

const SLIDES = [
    {
        Illustration: FocusIllustration,
        bg: ['#0D0819', '#1A0A2E', '#2C0E3F', '#1A0A2E'],
        title: 'Increase focus',
        subtitle: 'Science-based music designed to sustain flow state',
    },
    {
        Illustration: RelaxIllustration,
        bg: ['#0D0819', '#12092A', '#2A1050', '#12092A'],
        title: 'Reduce distraction',
        subtitle: 'Eliminate interruptions and stay centered on your goals',
    },
    {
        Illustration: MeditateIllustration,
        bg: ['#050D1A', '#0A1628', '#0D2240', '#0A1628'],
        title: 'Get more done',
        subtitle: 'Boost your productivity and efficiency',
    },
];

const SplashScreen = ({ onFinish }) => {
    const [slideIndex, setSlideIndex] = useState(0);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const glowPulse = useRef(new Animated.Value(0.7)).current;

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
        ]).start();

        // Glow pulse loop
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowPulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
                Animated.timing(glowPulse, { toValue: 0.7, duration: 2000, useNativeDriver: true }),
            ])
        ).start();
    }, [slideIndex]);

    const handleSlideChange = (nextIndex) => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: 20, duration: 200, useNativeDriver: true }),
        ]).start(() => {
            setSlideIndex(nextIndex);
            slideAnim.setValue(30);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
            ]).start();
        });
    };

    const slide = SLIDES[slideIndex];
    const { Illustration } = slide;
    const isLast = slideIndex === SLIDES.length - 1;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient colors={slide.bg} style={StyleSheet.absoluteFill} locations={[0, 0.3, 0.6, 1]} />

            {/* Illustration area */}
            <Animated.View style={[styles.illustrationArea, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                <Illustration />
            </Animated.View>

            {/* Bottom sheet */}
            <View style={styles.bottomSheet}>
                <LinearGradient colors={['rgba(13,8,25,0)', 'rgba(13,8,25,0.97)', '#0D0819']} style={styles.fadeOverlay} />

                <Animated.View style={[styles.textSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                    <Text style={styles.title}>{slide.title}</Text>
                    <Text style={styles.subtitle}>{slide.subtitle}</Text>
                </Animated.View>

                {/* Page dots */}
                <View style={styles.dots}>
                    {SLIDES.map((_, i) => (
                        <TouchableOpacity key={i} onPress={() => handleSlideChange(i)}>
                            <View style={[styles.dot, i === slideIndex && styles.dotActive]} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Auth buttons */}
                {isLast ? (
                    <View style={styles.authButtons}>
                        {/* Continue with Apple */}
                        <TouchableOpacity style={styles.appleBtn} onPress={onFinish}>
                            <Ionicons name="logo-apple" size={20} color="#000" />
                            <Text style={styles.appleBtnText}>Continue with Apple</Text>
                        </TouchableOpacity>

                        {/* Continue with Email */}
                        <TouchableOpacity style={styles.emailBtn} onPress={onFinish}>
                            <Ionicons name="mail" size={18} color="#fff" style={{ marginRight: 10 }} />
                            <Text style={styles.emailBtnText}>Continue with Email</Text>
                        </TouchableOpacity>

                        {/* Social row */}
                        <View style={styles.socialRow}>
                            <TouchableOpacity style={styles.socialBtn} onPress={onFinish}>
                                <Ionicons name="logo-google" size={22} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialBtn} onPress={onFinish}>
                                <Ionicons name="logo-facebook" size={22} color="#fff" />
                            </TouchableOpacity>
                        </View>

                        {/* Sign In */}
                        <View style={styles.signInRow}>
                            <Text style={styles.signInText}>Have an account? </Text>
                            <TouchableOpacity onPress={onFinish}>
                                <Text style={styles.signInLink}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.nextBtn}
                        onPress={() => handleSlideChange(slideIndex + 1)}
                    >
                        <Text style={styles.nextBtnText}>Next</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D0819' },
    illustrationArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: height * 0.48,
    },
    bottomSheet: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    fadeOverlay: {
        position: 'absolute',
        top: -80,
        left: 0,
        right: 0,
        height: 100,
    },
    textSection: {
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 28,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 10,
        letterSpacing: -0.5,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 21,
        maxWidth: 260,
    },
    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 28,
    },
    dot: {
        width: 20,
        height: 4,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    dotActive: {
        backgroundColor: '#fff',
        width: 28,
    },
    // Auth buttons
    appleBtn: {
        backgroundColor: '#FFFFFF',
        borderRadius: 50,
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 12,
    },
    appleBtnText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '600',
    },
    emailBtn: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 50,
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    emailBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    socialRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    socialBtn: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 50,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    signInRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signInText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
    },
    signInLink: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    // Next button (non-last slides)
    authButtons: {},
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 50,
        height: 54,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        marginBottom: 12,
    },
    nextBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

// ─── Illustration helper styles ────────────────────────────────
const ill = StyleSheet.create({
    wrapper: {
        width: width,
        height: height * 0.42,
        alignItems: 'center',
        justifyContent: 'flex-end',
        position: 'relative',
    },
    glow: {
        position: 'absolute',
        top: '12%',
        alignSelf: 'center',
    },
    platform: {
        position: 'absolute',
        width: 240,
        height: 22,
        bottom: '26%',
        alignSelf: 'center',
        borderRadius: 50,
        overflow: 'hidden',
    },
    platformGrad: { flex: 1, borderRadius: 50 },
    laptopBase: {
        position: 'absolute',
        width: 90,
        height: 14,
        bottom: '34%',
        alignSelf: 'center',
        borderRadius: 4,
        overflow: 'hidden',
    },
    laptopGrad: { flex: 1 },
    laptopScreen: {
        position: 'absolute',
        width: 80,
        height: 56,
        bottom: '40%',
        alignSelf: 'center',
        borderRadius: 6,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    personBody: {
        position: 'absolute',
        width: 42,
        height: 70,
        bottom: '35%',
        alignSelf: 'center',
        borderRadius: 14,
        overflow: 'hidden',
    },
    head: {
        position: 'absolute',
        width: 38,
        height: 38,
        bottom: '56%',
        alignSelf: 'center',
        borderRadius: 19,
        overflow: 'hidden',
    },
    headphonesArc: {
        position: 'absolute',
        bottom: '63%',
        alignSelf: 'center',
        width: 46,
        height: 22,
        borderTopLeftRadius: 23,
        borderTopRightRadius: 23,
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.8)',
        borderBottomWidth: 0,
    },
    headphonesEar: {
        position: 'absolute',
        bottom: '62%',
        width: 10,
        height: 14,
        borderRadius: 5,
        backgroundColor: 'rgba(255,255,255,0.85)',
    },
    wave: {
        position: 'absolute',
        top: '22%',
        width: 3,
        height: 28,
        borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
});

export default SplashScreen;
