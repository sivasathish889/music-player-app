import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, Text } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useAuth } from '../context/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import PlayerScreen from '../screens/PlayerScreen';
import PlaylistScreen from '../screens/PlaylistScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MiniPlayer from '../components/MiniPlayer';
import { usePlayer } from '../context/PlayerContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Custom Tab Bar Label + Icon ──────────────────────────────
const TAB_CONFIG = {
    Home: { icon: 'home', label: 'Start' },
    Search: { icon: 'compass', label: 'Explore' },
    Playlists: { icon: 'library', label: 'Library' },
    Profile: { icon: 'person', label: 'Profile' },
};

// ─── Bottom Tab Navigator ─────────────────────────────────────
const TabNavigator = ({ navigation }) => {
    const { currentSong } = usePlayer();

    return (
        <View style={{ flex: 1 }}>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarStyle: styles.tabBar,
                    tabBarActiveTintColor: '#FFFFFF',
                    tabBarInactiveTintColor: 'rgba(255,255,255,0.3)',
                    tabBarShowLabel: true,
                    tabBarLabelStyle: styles.tabLabel,
                    tabBarIcon: ({ focused, color }) => {
                        const cfg = TAB_CONFIG[route.name];
                        return (
                            <View style={[styles.tabIconWrap, focused && styles.tabIconActive]}>
                                <Ionicons
                                    name={focused ? cfg.icon : `${cfg.icon}-outline`}
                                    size={20}
                                    color={color}
                                />
                            </View>
                        );
                    },
                    tabBarLabel: ({ focused, color }) => {
                        const cfg = TAB_CONFIG[route.name];
                        return (
                            <Text style={[styles.tabLabel, { color }]}>
                                {cfg.label}
                            </Text>
                        );
                    },
                })}
            >
                <Tab.Screen name="Home" component={HomeScreen} />
                <Tab.Screen name="Search" component={SearchScreen} />
                <Tab.Screen name="Playlists" component={PlaylistScreen} />
                <Tab.Screen name="Profile" component={ProfileScreen} />
            </Tab.Navigator>

            <MiniPlayer onPress={() => navigation.navigate('Player')} />
        </View>
    );
};

// ─── Auth Stack ───────────────────────────────────────────────
const AuthStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
);

// ─── App Stack ────────────────────────────────────────────────
const AppStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen
            name="Player"
            component={PlayerScreen}
            options={{
                animation: 'slide_from_bottom',
                gestureEnabled: true,
                gestureDirection: 'vertical',
            }}
        />
    </Stack.Navigator>
);

// ─── Root Navigator ───────────────────────────────────────────
const AppNavigator = () => {
    const { user } = useAuth();   // loading handled by App.js — no null flash here
    return (
        <NavigationContainer>
            {user ? <AppStack /> : <AuthStack />}
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        backgroundColor: 'rgba(13,8,25,0.96)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.06)',
        height: 64,
        paddingBottom: 10,
        paddingTop: 6,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },
    tabIconWrap: {
        width: 32,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    tabIconActive: {
        backgroundColor: 'rgba(255,255,255,0.08)',
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 0.3,
        marginTop: 1,
    },
});

export default AppNavigator;
