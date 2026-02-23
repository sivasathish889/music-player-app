import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

const STORAGE_KEYS = {
    TOKEN: '@auth_token',
    USER: '@auth_user',
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // true while restoring session

    // ── Restore session on app launch ────────────────────────
    useEffect(() => {
        restoreSession();
    }, []);

    const restoreSession = async () => {
        try {
            const [token, userJson] = await AsyncStorage.multiGet([
                STORAGE_KEYS.TOKEN,
                STORAGE_KEYS.USER,
            ]);

            const storedToken = token[1];
            const storedUser = userJson[1];

            if (storedToken && storedUser) {
                // Optimistically restore user from cache so UI appears instantly
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
            }
        } catch (e) {
            console.error('[Auth] Failed to restore session:', e.message);
            await _clearStorage();
            setUser(null);
        } finally {
            // Unblock the UI as soon as we've checked the local storage
            setLoading(false);
        }

        // Silent background validation if token exists
        try {
            const tokenFromStorage = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
            if (tokenFromStorage) {
                const res = await authAPI.getMe();
                if (res?.user) {
                    setUser(res.user);
                    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.user));
                }
            }
        } catch (serverErr) {
            console.warn('[Auth] Background validation failed:', serverErr.message);
            // Only force logout if the error is explicitly an authentication failure
            const errMsg = serverErr.message?.toLowerCase() || '';
            if (errMsg.includes('401') || errMsg.includes('unauthorized')) {
                await _clearStorage();
                setUser(null);
            }
        }
    };

    // ── Login ─────────────────────────────────────────────────
    const login = async (email, password) => {
        const res = await authAPI.login({ email, password });
        if (!res.success) throw new Error(res.message || 'Login failed');

        // Persist token + user together atomically
        await AsyncStorage.multiSet([
            [STORAGE_KEYS.TOKEN, res.token],
            [STORAGE_KEYS.USER, JSON.stringify(res.user)],
        ]);

        setUser(res.user);
        return res.user;
    };

    // ── Register ──────────────────────────────────────────────
    const register = async (name, email, password) => {
        const res = await authAPI.register({ name, email, password });
        if (!res.success) throw new Error(res.message || 'Registration failed');

        await AsyncStorage.multiSet([
            [STORAGE_KEYS.TOKEN, res.token],
            [STORAGE_KEYS.USER, JSON.stringify(res.user)],
        ]);

        setUser(res.user);
        return res.user;
    };

    // ── Logout ────────────────────────────────────────────────
    const logout = async () => {
        await _clearStorage();
        setUser(null);
    };

    // ── Update locally cached user (e.g. after profile edit) ─
    const updateUser = async (updatedUser) => {
        setUser(updatedUser);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    };

    // ── Internal helper ───────────────────────────────────────
    const _clearStorage = async () => {
        await AsyncStorage.multiRemove([STORAGE_KEYS.TOKEN, STORAGE_KEYS.USER]);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
