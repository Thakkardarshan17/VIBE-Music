# 🎵 VIBE MUSIC – Full-Stack Music Streaming Web Application

A studio-grade, responsive, full-stack music streaming platform built with **React**, **TypeScript**, **Tailwind CSS**, **Node.js**, **Express**, **Prisma ORM**, and **PostgreSQL**.

---

## ⚡ Quick Start (One Command)

The application is completely configured to run both frontend and backend concurrently with a single command:

```bash
# 1. Install all dependencies (if not already installed)
npm run install:all

# 2. Start both Frontend and Backend concurrently
npm run dev
```

* **Frontend Web App:** [http://localhost:5173](http://localhost:5173)
* **Backend REST API:** [http://localhost:5000/api](http://localhost:5000/api)
* **Health Check Endpoint:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🔑 Pre-Seeded Demo Accounts

The database is seeded on startup with two accounts:

| Role | Email / Login | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@vibemusic.com` | `Admin@123456` | Full Admin Dashboard, Metrics, Provider Toggles, User Management |
| **Standard User** | `user@vibemusic.com` | `User@123456` | Personal Playlists, Favorites, Profile, Listening History |

*(You can also register a new account on `/signup` or use the 1-Click Demo Login buttons on `/login`.)*

---

## 🗄️ Database Architecture & PostgreSQL Setup

VIBE MUSIC utilizes **Prisma ORM** with a PostgreSQL schema (`server/prisma/schema.prisma`).

### Zero-Setup Resilient Engine
The backend database layer features auto-detection:
1. **PostgreSQL Mode:** If PostgreSQL is running on `DATABASE_URL` (default: `localhost:5432`), Prisma connects and persists to PostgreSQL.
2. **Resilient Local Persistence Fallback:** If a local PostgreSQL instance is not yet started, the server activates a local database engine that persists users, profiles, songs, playlists, tracks, favorites, settings, and history to `server/data/vibemusic_db.json`.

### Connecting your PostgreSQL Database:
1. Ensure your PostgreSQL server is running.
2. Update `server/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/vibemusic?schema=public"
   ```
3. Push schema migrations:
   ```bash
   npm run prisma:push
   ```

---

## 🌐 Music API Integrations

The Universal Search feature queries multiple music providers in parallel, normalizes results, removes duplicates, and enables official authorized streaming:

1. **Jamendo Music API:** Full-length legal tracks streamed directly via HTML5 Audio.
2. **Apple Music / iTunes API:** Millions of tracks across Hindi, Gujarati, Punjabi, Bollywood, Pop, and Rock with high-resolution artwork and 30-second official audio preview streams.
3. **YouTube Data API & Official IFrame Embed:** Official embedded player supporting full video/audio playback with synchronized controls.
4. **Spotify Web API:** OAuth2 Client Credentials integration for Spotify catalog metadata and 30s audio previews.

### Optional External API Keys (in `server/.env`):
```env
# Optional: YouTube Data API v3 key
YOUTUBE_API_KEY=""

# Optional: Spotify Developer App Credentials
SPOTIFY_CLIENT_ID=""
SPOTIFY_CLIENT_SECRET=""

# Jamendo Client ID
JAMENDO_CLIENT_ID="5663f747"
```

---

## 📑 Complete Page Directory (All 22 Views Implemented)

1. **Splash Screen** (`/splash`) – Animated brand splash with equalizer waves and start button.
2. **Home Dashboard** (`/`) – Hero spotlight, trending mix, featured artists, fresh releases, and iconic albums.
3. **Explore Music** (`/explore`) – Genre cards: Bollywood, Gujarati Folk, Punjabi, EDM, Lo-Fi, Hip Hop, Pop, Rock, Sufi, Romance.
4. **Universal Search** (`/search`) – Real-time multi-provider search with provider filter pills and instant results.
5. **Search Results** (`/search?q=...`) – Grid and list views with direct playback, like, and add-to-playlist options.
6. **Trending Music** (`/trending`) – Ranked viral and chart-topping songs with "Play All".
7. **Top Charts** (`/charts`) – Categorized charts (Global Top 50, Bollywood & Hindi, Punjabi Vibes, EDM & Electronic).
8. **New Releases** (`/new-releases`) – Freshly dropped singles and studio recordings.
9. **Artists** (`/artists`) – Artist catalog with verified badges, follower counts, and artist radio.
10. **Albums** (`/albums`) – Studio album covers, release years, and track listings.
11. **Music Library** (`/library`) – User music hub for playlists, favorites, and history.
12. **My Playlists** (`/playlists`) – Create, rename, delete, and manage custom playlists and tracks.
13. **Liked Songs** (`/liked`) – Personal favorites with quick "Play All Liked" button.
14. **Recently Played** (`/history`) – Timeline of played songs and recent search queries.
15. **Music Player (Mini Player)** – Bottom fixed player with seek bar, audio visualizer, volume slider, shuffle, and repeat.
16. **Full-Screen Player** – Immersive visualizer, spinning vinyl art, large controls, waveform, and live queue.
17. **Login** (`/login`) – Form with password verification and 1-Click Demo login buttons.
18. **Sign Up** (`/signup`) – Account creation with password validation.
19. **Forgot Password** (`/forgot-password`) – Password recovery flow.
20. **User Profile** (`/profile`) – Edit bio, location, favorite genres, avatar, and social links.
21. **Settings** (`/settings`) – Select audio bitrate quality (Normal, High, Lossless 320kbps), autoplay, and notifications.
22. **Admin Dashboard** (`/admin`) – Live platform metrics (users, playlists, tracks, plays), provider status toggles, user table.

---

## 🧪 Automated Testing

Run the full-stack automated test suite verifying database connectivity, user auth, music search APIs, playlist CRUD, and favorites:

```bash
npm test
```

Result: **15 PASSED, 0 FAILED** (100% test pass rate).

---

## 🛠️ Project Structure

```
d:\VIBE MUSIC\
├── package.json               # Root scripts (dev, build, test, prisma)
├── .env.example               # Root environment template
├── README.md                  # Complete documentation
├── server/
│   ├── package.json           # Backend dependencies
│   ├── tsconfig.json          # TypeScript config
│   ├── .env                   # Server environment
│   ├── prisma/
│   │   └── schema.prisma      # PostgreSQL Prisma Schema
│   └── src/
│       ├── index.ts           # Express server entry point
│       ├── config/env.ts      # Validated environment loader
│       ├── db/
│       │   ├── prisma.ts      # Dual-mode PostgreSQL/Resilient DB
│       │   └── seed.ts        # Database seeder (Admin & Demo users)
│       ├── services/          # Jamendo, iTunes, YouTube, Spotify APIs
│       ├── controllers/       # Auth, Music, Playlist, Favorite, Admin
│       ├── routes/            # REST API Routes
│       └── test/              # Integration Test Suite
└── client/
    ├── package.json           # Frontend dependencies
    ├── vite.config.ts         # Vite server proxy config
    ├── tailwind.config.js     # Tailwind CSS purple/violet palette
    └── src/
        ├── App.tsx            # Main routes & providers
        ├── context/           # AuthContext & PlayerContext
        ├── components/        # Player, Music, Layout components
        └── pages/             # All 22 required pages
```

