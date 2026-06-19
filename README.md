# Rhythm Mobile App

React Native (Expo) music streaming app for Android and iOS.

---

## Tech Stack

- React Native 0.81 / Expo SDK 54
- React Navigation (Stack + Bottom Tabs)
- Axios
- AsyncStorage (token persistence)
- Google Sign-In / Apple Authentication
- Expo AV / React Native Track Player (audio playback)
- Expo File System (downloads)
- Expo Image Picker (avatar upload)

---

## Setup

```bash
cd music-player-app
npm install
```

Create a `.env` file:

```env
EXPO_PUBLIC_API_URL=https://music-player-backends.onrender.com/api
```

Or update `src/constants/index.js` with your backend URL.

```bash
npm start           # Expo dev server
npm run android     # Run on Android
npm run ios         # Run on iOS
```

---

## Screens

| Screen | Description |
|---|---|
| SplashScreen | App loading screen |
| LoginScreen | Email/password + Google/Apple login |
| RegisterScreen | New account registration |
| HomeScreen | Featured songs, trending, recommendations |
| SearchScreen | Search songs by title, artist, album, genre |
| PlayerScreen | Full-screen music player with controls |
| PlaylistScreen | View and manage playlists |
| ProfileScreen | User profile, liked songs, settings |
| SettingsScreen | App preferences |

---

## API Integration

Token stored in `AsyncStorage` under `@auth_token` and auto-attached to every request.

### Auth API
| Function | Endpoint |
|---|---|
| `authAPI.register(data)` | POST `/auth/register` |
| `authAPI.login(data)` | POST `/auth/login` |
| `authAPI.getMe()` | GET `/auth/me` |
| `authAPI.googleLogin(idToken)` | POST `/auth/google` |
| `authAPI.appleLogin(token, email, fullName)` | POST `/auth/apple` |

### Song API
| Function | Endpoint |
|---|---|
| `songAPI.getAll(params)` | GET `/songs` |
| `songAPI.getById(id)` | GET `/songs/:id` |
| `songAPI.getTrending()` | GET `/songs/trending` |
| `songAPI.toggleLike(id)` | POST `/songs/:id/like` |
| `songAPI.trackPlay(id)` | POST `/songs/:id/play` |

### Playlist API
| Function | Endpoint |
|---|---|
| `playlistAPI.create(data)` | POST `/playlists` |
| `playlistAPI.getUserPlaylists(userId)` | GET `/playlists/:userId` |
| `playlistAPI.getById(id)` | GET `/playlists/single/:id` |
| `playlistAPI.update(id, data)` | PUT `/playlists/:id` |
| `playlistAPI.delete(id)` | DELETE `/playlists/:id` |
| `playlistAPI.addSong(playlistId, songId)` | POST `/playlists/:id/songs/:songId` |
| `playlistAPI.removeSong(playlistId, songId)` | DELETE `/playlists/:id/songs/:songId` |

### User API
| Function | Endpoint |
|---|---|
| `userAPI.getLikedSongs(userId)` | GET `/users/:id/liked` |
| `userAPI.getRecentlyPlayed(userId)` | GET `/users/:id/recently-played` |
| `userAPI.getRecommendations(userId, limit)` | GET `/users/:id/recommendations` |
| `userAPI.updateProfile(formData)` | PUT `/users/profile` (multipart) |
| `userAPI.updateProfileJSON(data)` | PUT `/users/profile` (JSON) |

### Search API
| Function | Endpoint |
|---|---|
| `searchAPI.search(q, params)` | GET `/search?q=...` |

---

## Project Structure

```
src/
├── components/
│   ├── MiniPlayer.js       # Mini player bar
│   └── SongCard.js         # Song list item
├── constants/
│   └── index.js            # API_BASE_URL and app constants
├── context/
│   ├── AuthContext.js       # Auth state management
│   ├── PlayerContext.js     # Playback state
│   └── SettingsContext.js   # App settings
├── navigation/
│   └── AppNavigator.js      # Navigation configuration
├── screens/                 # All app screens
└── services/
    ├── api.js               # Axios instance + API functions
    ├── playbackService.js   # Background audio service
    └── DownloadService.js   # Offline download logic
```

---

## Building for Production

```bash
# EAS Build
eas build --platform android
eas build --platform ios
```

Configure `eas.json` and `app.json` with your app credentials before building.
