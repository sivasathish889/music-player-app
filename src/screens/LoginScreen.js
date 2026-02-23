import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Alert,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(null);
    const { login } = useAuth();
    const btnScale = useRef(new Animated.Value(1)).current;

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }
        setLoading(true);
        try {
            await login(email.trim().toLowerCase(), password);
        } catch (error) {
            Alert.alert('Login Failed', error.message || 'Invalid credentials.');
        } finally {
            setLoading(false);
        }
    };

    const animBtn = (toValue) => Animated.spring(btnScale, { toValue, useNativeDriver: true, tension: 200, friction: 10 }).start();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient colors={['#0D0819', '#150D2A', '#1A0A2E']} style={StyleSheet.absoluteFill} />

            {/* Decorative glows */}
            <View style={[styles.blob, { top: -60, left: -40, backgroundColor: '#5B2C6F' }]} />
            <View style={[styles.blob, { top: 80, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: '#1A5276' }]} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                    {/* App logo/brand */}
                    <View style={styles.brand}>
                        <View style={styles.logoIcon}>
                            <LinearGradient colors={['#8E44AD', '#5B2C6F']} style={styles.logoGrad}>
                                <Text style={{ fontSize: 28 }}>🎵</Text>
                            </LinearGradient>
                        </View>
                        <Text style={styles.appName}>Lumina</Text>
                        <Text style={styles.appSub}>Music</Text>
                    </View>

                    {/* Form card */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Welcome back</Text>
                        <Text style={styles.cardSub}>Sign in to continue listening</Text>

                        {/* Email */}
                        <View style={[styles.field, focusedField === 'email' && styles.fieldFocused]}>
                            <Ionicons name="mail-outline" size={17} color={focusedField === 'email' ? '#fff' : 'rgba(255,255,255,0.35)'} />
                            <TextInput
                                style={styles.fieldInput}
                                placeholder="Email address"
                                placeholderTextColor="rgba(255,255,255,0.25)"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </View>

                        {/* Password */}
                        <View style={[styles.field, focusedField === 'pass' && styles.fieldFocused]}>
                            <Ionicons name="lock-closed-outline" size={17} color={focusedField === 'pass' ? '#fff' : 'rgba(255,255,255,0.35)'} />
                            <TextInput
                                style={[styles.fieldInput, { flex: 1 }]}
                                placeholder="Password"
                                placeholderTextColor="rgba(255,255,255,0.25)"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                onFocus={() => setFocusedField('pass')}
                                onBlur={() => setFocusedField(null)}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(p => !p)}>
                                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={17} color="rgba(255,255,255,0.35)" />
                            </TouchableOpacity>
                        </View>

                        {/* Sign In button */}
                        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
                            <TouchableOpacity
                                onPressIn={() => animBtn(0.97)}
                                onPressOut={() => animBtn(1)}
                                onPress={handleLogin}
                                disabled={loading}
                                activeOpacity={1}
                                style={styles.signInBtn}
                            >
                                <LinearGradient colors={['#FFFFFF', '#E8E8F0']} style={styles.signInBtnGrad}>
                                    {loading
                                        ? <Text style={styles.signInBtnText}>Signing in...</Text>
                                        : <>
                                            <Ionicons name="log-in-outline" size={18} color="#000" style={{ marginRight: 8 }} />
                                            <Text style={styles.signInBtnText}>Sign In</Text>
                                        </>
                                    }
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.divLine} />
                            <Text style={styles.divText}>or</Text>
                            <View style={styles.divLine} />
                        </View>

                        {/* Social buttons */}
                        <View style={styles.socialRow}>
                            <TouchableOpacity style={styles.socialBtn}>
                                <Ionicons name="logo-google" size={20} color="rgba(255,255,255,0.7)" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialBtn}>
                                <Ionicons name="logo-facebook" size={20} color="rgba(255,255,255,0.7)" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialBtn}>
                                <Ionicons name="logo-apple" size={20} color="rgba(255,255,255,0.7)" />
                            </TouchableOpacity>
                        </View>

                        {/* Register link */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.footerLink}>Create one</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0D0819' },
    blob: { position: 'absolute', width: 260, height: 260, borderRadius: 130, opacity: 0.18 },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },

    brand: { alignItems: 'center', marginBottom: 40 },
    logoIcon: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', marginBottom: 14, elevation: 10, shadowColor: '#8E44AD', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 14 },
    logoGrad: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    appName: { color: 'rgba(255,255,255,0.55)', fontSize: 16, letterSpacing: 4, textTransform: 'uppercase', fontWeight: '300' },
    appSub: { color: '#fff', fontSize: 30, fontWeight: '800', letterSpacing: 5, textTransform: 'uppercase', marginTop: -4 },

    card: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
    },
    cardTitle: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 4, letterSpacing: -0.5 },
    cardSub: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 24 },

    field: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 52,
        marginBottom: 12,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    fieldFocused: {
        borderColor: 'rgba(255,255,255,0.25)',
        backgroundColor: 'rgba(255,255,255,0.09)',
    },
    fieldInput: { flex: 1, color: '#fff', fontSize: 15 },

    signInBtn: { borderRadius: 50, overflow: 'hidden', marginTop: 4 },
    signInBtnGrad: { height: 54, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderRadius: 50 },
    signInBtnText: { color: '#000', fontSize: 16, fontWeight: '700' },

    divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
    divLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
    divText: { color: 'rgba(255,255,255,0.3)', fontSize: 13 },

    socialRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    socialBtn: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.06)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.07)',
    },

    footer: { flexDirection: 'row', justifyContent: 'center' },
    footerText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
    footerLink: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

export default LoginScreen;
