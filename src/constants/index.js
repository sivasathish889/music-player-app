// API Base URL - change this to your server URL
// For Android emulator use: http://10.0.2.2:5000
// For iOS simulator use: http://localhost:5000
// For physical device use your machine's local IP: http://192.168.x.x:5000
// export const API_BASE_URL = 'http://localhost:5000/api';
export const API_BASE_URL = 'http://10.107.78.1:5000/api'
export const COLORS = {
    primary: '#7C3AED',      // Purple
    primaryDark: '#5B21B6',
    primaryLight: '#A78BFA',
    accent: '#06B6D4',       // Neon Cyan
    accentDark: '#0891B2',
    neonBlue: '#3B82F6',
    background: '#0A0A0F',
    surface: '#12121A',
    surfaceLight: '#1A1A28',
    card: '#1E1E2E',
    cardLight: '#252538',
    text: '#F8F8FF',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    border: '#2D2D44',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    white: '#FFFFFF',
    black: '#000000',
};

export const GRADIENTS = {
    primary: ['#7C3AED', '#3B82F6'],
    accent: ['#06B6D4', '#3B82F6'],
    dark: ['#0A0A0F', '#12121A'],
    card: ['#1E1E2E', '#252538'],
    player: ['#0A0A0F', '#1A0A2E', '#0A0A1A'],
    purple: ['#7C3AED', '#5B21B6'],
    neon: ['#06B6D4', '#7C3AED'],
};

export const FONTS = {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    sizes: {
        xs: 10,
        sm: 12,
        md: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
    },
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
};

export const RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
};
