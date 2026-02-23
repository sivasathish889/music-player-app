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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS } from '../constants';
import Ionicons from '@expo/vector-icons/Ionicons';

const RegisterScreen = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const buttonScale = useRef(new Animated.Value(1)).current;

    const handleRegister = async () => {
        if (!name.trim() || !email.trim() || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }
        if (password.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            await register(name.trim(), email.trim().toLowerCase(), password);
        } catch (error) {
            Alert.alert('Registration Failed', error.message || 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    const animateButton = (toValue) => {
        Animated.spring(buttonScale, { toValue, useNativeDriver: true, tension: 200, friction: 10 }).start();
    };

    const InputField = ({ label, icon, value, onChangeText, placeholder, keyboardType, secureTextEntry, rightIcon, onRightIconPress, autoCapitalize }) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.inputContainer}>
                <Ionicons name={icon} size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder={placeholder}
                    placeholderTextColor={COLORS.textMuted}
                    value={value}
                    onChangeText={onChangeText}
                    keyboardType={keyboardType || 'default'}
                    secureTextEntry={secureTextEntry}
                    autoCapitalize={autoCapitalize || 'none'}
                    autoCorrect={false}
                />
                {rightIcon && (
                    <TouchableOpacity onPress={onRightIconPress} style={{ padding: 4 }}>
                        <Ionicons name={rightIcon} size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <LinearGradient colors={['#0A0A0F', '#1A0A2E', '#0A0A0F']} style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.logoWrap}>
                            <LinearGradient colors={GRADIENTS.neon} style={styles.logo}>
                                <Text style={{ fontSize: 32 }}>🎵</Text>
                            </LinearGradient>
                        </View>
                        <Text style={styles.appName}>Join Rhythm Music</Text>
                        <Text style={styles.subtitle}>Create your free account</Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <InputField
                            label="Full Name"
                            icon="person-outline"
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your name"
                            autoCapitalize="words"
                        />
                        <InputField
                            label="Email"
                            icon="mail-outline"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter your email"
                            keyboardType="email-address"
                        />
                        <InputField
                            label="Password"
                            icon="lock-closed-outline"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Create a password"
                            secureTextEntry={!showPassword}
                            rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            onRightIconPress={() => setShowPassword(!showPassword)}
                        />
                        <InputField
                            label="Confirm Password"
                            icon="shield-checkmark-outline"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Confirm your password"
                            secureTextEntry={!showPassword}
                        />

                        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                            <TouchableOpacity
                                onPressIn={() => animateButton(0.97)}
                                onPressOut={() => animateButton(1)}
                                onPress={handleRegister}
                                disabled={loading}
                                activeOpacity={1}
                            >
                                <LinearGradient colors={GRADIENTS.neon} style={styles.registerBtn}>
                                    {loading ? (
                                        <Text style={styles.registerBtnText}>Creating Account...</Text>
                                    ) : (
                                        <>
                                            <Text style={styles.registerBtnText}>Create Account</Text>
                                            <Ionicons name="sparkles" size={18} color={COLORS.white} style={{ marginLeft: 8 }} />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>

                        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginLink}>
                            <Text style={styles.loginText}>
                                Already have an account?{' '}
                                <Text style={styles.loginHighlight}>Sign In</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: SPACING.xl },
    header: { alignItems: 'center', marginBottom: SPACING['2xl'] },
    logoWrap: {
        width: 80,
        height: 80,
        borderRadius: 40,
        overflow: 'hidden',
        marginBottom: SPACING.base,
        elevation: 10,
        shadowColor: COLORS.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
    },
    logo: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    appName: { color: COLORS.white, fontSize: FONTS.sizes['2xl'], fontWeight: '800', letterSpacing: 2, marginBottom: 4 },
    subtitle: { color: COLORS.textSecondary, fontSize: FONTS.sizes.base },
    form: {
        backgroundColor: 'rgba(30, 30, 46, 0.8)',
        borderRadius: RADIUS.xl,
        padding: SPACING.xl,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    inputGroup: { marginBottom: SPACING.base },
    label: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '600', marginBottom: SPACING.xs, letterSpacing: 0.5 },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surfaceLight,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: SPACING.md,
        height: 50,
    },
    inputIcon: { marginRight: SPACING.sm },
    input: { color: COLORS.text, fontSize: FONTS.sizes.base },
    registerBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: RADIUS.md,
        height: 52,
        marginTop: SPACING.sm,
    },
    registerBtnText: { color: COLORS.white, fontSize: FONTS.sizes.base, fontWeight: '700', letterSpacing: 0.5 },
    loginLink: { alignItems: 'center', marginTop: SPACING.lg },
    loginText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
    loginHighlight: { color: COLORS.accent, fontWeight: '700' },
});

export default RegisterScreen;
