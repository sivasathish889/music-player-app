import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { PlayerProvider } from './src/context/PlayerContext';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';

/**
 * Session & Onboarding Gate
 * Logic:
 * 1. While Auth is checking (loading=true), show a clean branding screen.
 * 2. Once loading is false:
 *    - If user is logged in -> Go straight to App.
 *    - If user is NOT logged in:
 *      - Check if they've seen the onboarding (SplashScreen).
 *      - If not seen -> Show SplashScreen.
 *      - If seen -> Go to AppNavigator (which will show Login).
 */
const AppContent = () => {
  const { user, loading } = useAuth();
  const [onboardingSeen, setOnboardingSeen] = useState(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    const seen = await AsyncStorage.getItem('@onboarding_seen');
    setOnboardingSeen(seen === 'true');
  };

  const handleFinishOnboarding = async () => {
    await AsyncStorage.setItem('@onboarding_seen', 'true');
    setOnboardingSeen(true);
  };

  // ── 1. Still checking session or onboarding status ──
  if (loading || onboardingSeen === null) {
    return (
      <View style={styles.loader}>
        {/* You can add a logo here for a branding-only splash */}
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  // ── 2. User is logged in — skip everything and go to music ──
  if (user) {
    return <AppNavigator />;
  }

  // ── 3. User is NOT logged in — show onboarding only if not yet seen ──
  if (!onboardingSeen) {
    return <SplashScreen onFinish={handleFinishOnboarding} />;
  }

  // ── 4. Onboarding complete, user logged out -> show Login ──
  return <AppNavigator />;
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <PlayerProvider>
            <StatusBar style="light" backgroundColor="transparent" translucent />
            <AppContent />
          </PlayerProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    backgroundColor: '#080613',  // Deep dark theme
    justifyContent: 'center',
    alignItems: 'center',
  },
});
