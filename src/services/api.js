import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
});

// Request interceptor - attach token
api.interceptors.request.use(
    async (config) => {
        const token = await AsyncStorage.getItem('@auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const message =
            error.response?.data?.message || error.message || 'Something went wrong';
        return Promise.reject(new Error(message));
    }
);

// Auth APIs
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
};

// Song APIs
export const songAPI = {
    getAll: (params) => api.get('/songs', { params }),
    getById: (id) => api.get(`/songs/${id}`),
    getTrending: () => api.get('/songs/trending'),
    upload: (formData) => api.post('/songs', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    update: (id, formData) => api.put(`/songs/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    delete: (id) => api.delete(`/songs/${id}`),
    toggleLike: (id) => api.post(`/songs/${id}/like`),
    trackPlay: (id) => api.post(`/songs/${id}/play`),
};

// Playlist APIs
export const playlistAPI = {
    create: (data) => api.post('/playlists', data),
    getUserPlaylists: (userId) => api.get(`/playlists/${userId}`),
    getById: (id) => api.get(`/playlists/single/${id}`),
    update: (id, data) => api.put(`/playlists/${id}`, data),
    delete: (id) => api.delete(`/playlists/${id}`),
    addSong: (playlistId, songId) => api.post(`/playlists/${playlistId}/songs/${songId}`),
    removeSong: (playlistId, songId) => api.delete(`/playlists/${playlistId}/songs/${songId}`),
};

// User APIs
export const userAPI = {
    getLikedSongs: (userId) => api.get(`/users/${userId}/liked`),
    getRecentlyPlayed: (userId) => api.get(`/users/${userId}/recently-played`),
    getRecommendations: (userId, limit = 20) => api.get(`/users/${userId}/recommendations`, { params: { limit } }),
    updateProfile: (formData) => api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Search API
export const searchAPI = {
    search: (q, params) => api.get('/search', { params: { q, ...params } }),
};

export default api;
