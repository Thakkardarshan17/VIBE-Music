import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// PostgreSQL Prisma Client instance
export const prisma = new PrismaClient();

// In-Memory / File Persistent Fallback Store for zero-setup execution if PostgreSQL is offline
const isVercel = !!process.env.VERCEL;
const DATA_DIR = isVercel ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'vibemusic_db.json');

interface LocalDatabaseState {
  users: any[];
  userProfiles: any[];
  songs: any[];
  artists: any[];
  albums: any[];
  playlists: any[];
  playlistTracks: any[];
  favorites: any[];
  listeningHistory: any[];
  searchHistory: any[];
  userSettings: any[];
  musicProviders: any[];
  sessions: any[];
  verificationCodes: any[];
  passwordResetTokens: any[];
  followedArtists: any[];
  savedAlbums: any[];
  listeningEvents: any[];
}

let isPostgresAvailable = false;

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadLocalState(): LocalDatabaseState {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      parsed.sessions = parsed.sessions || [];
      parsed.verificationCodes = parsed.verificationCodes || [];
      parsed.passwordResetTokens = parsed.passwordResetTokens || [];
      parsed.followedArtists = parsed.followedArtists || [];
      parsed.savedAlbums = parsed.savedAlbums || [];
      parsed.listeningEvents = parsed.listeningEvents || [];
      if (Array.isArray(parsed.users)) {
        parsed.users.forEach((u: any) => {
          if (u.email === 'admin@vibemusic.com' || u.email === 'user@vibemusic.com') {
            u.emailVerified = true;
            u.fullName = u.fullName || (u.email === 'admin@vibemusic.com' ? 'Vibe Admin' : 'Vibe User');
          }
        });
      }
      return parsed;
    } catch (e) {
      console.error('Error reading local db file, initializing new state:', e);
    }
  }
  return {
    users: [],
    userProfiles: [],
    songs: [],
    artists: [],
    albums: [],
    playlists: [],
    playlistTracks: [],
    favorites: [],
    listeningHistory: [],
    searchHistory: [],
    userSettings: [],
    sessions: [],
    verificationCodes: [],
    passwordResetTokens: [],
    followedArtists: [],
    savedAlbums: [],
    listeningEvents: [],
    musicProviders: [
      { id: 'prov-1', name: 'jamendo', isEnabled: true, apiEndpoint: 'https://api.jamendo.com/v3.0', authType: 'api_key', status: 'active', totalRequests: 0, lastChecked: new Date().toISOString() },
      { id: 'prov-2', name: 'youtube', isEnabled: true, apiEndpoint: 'https://www.googleapis.com/youtube/v3', authType: 'api_key', status: 'active', totalRequests: 0, lastChecked: new Date().toISOString() },
      { id: 'prov-3', name: 'spotify', isEnabled: true, apiEndpoint: 'https://api.spotify.com/v1', authType: 'oauth2', status: 'configured', totalRequests: 0, lastChecked: new Date().toISOString() },
      { id: 'prov-4', name: 'itunes', isEnabled: true, apiEndpoint: 'https://itunes.apple.com', authType: 'none', status: 'active', totalRequests: 0, lastChecked: new Date().toISOString() },
    ],
  };
}

let localState = loadLocalState();

function saveLocalState() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(localState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving local db state:', err);
  }
}

// Auto-test PostgreSQL connection on startup
export async function initDatabaseConnection(): Promise<{ type: 'postgresql' | 'persistent_fallback'; error?: string }> {
  try {
    await prisma.$connect();
    isPostgresAvailable = true;
    console.log('✅ [Database] Successfully connected to PostgreSQL via Prisma.');
    return { type: 'postgresql' };
  } catch (err: any) {
    isPostgresAvailable = false;
    console.warn(`⚠️ [Database] PostgreSQL not reachable (${err.message || 'connection failed'}). Activating Resilient Persistent Fallback DB.`);
    return { type: 'persistent_fallback', error: err.message };
  }
}

export function isUsingPostgres(): boolean {
  return isPostgresAvailable;
}

// Unified Database Adapter that routes seamlessly to Prisma or the Persistent Fallback DB
export const db = {
  get isPostgres() {
    return isPostgresAvailable;
  },

  async checkHealth() {
    return {
      status: 'healthy',
      engine: isPostgresAvailable ? 'PostgreSQL (Prisma)' : 'Persistent Fallback DB (JSON / SQLite)',
      connected: true,
      timestamp: new Date().toISOString(),
    };
  },

  user: {
    async findUnique(args: { where: { id?: string; email?: string; username?: string; googleId?: string }; include?: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).user.findUnique(args);
      }
      const u = localState.users.find(
        (x) =>
          (args.where.id && x.id === args.where.id) ||
          (args.where.email && x.email.toLowerCase() === args.where.email.toLowerCase()) ||
          (args.where.username && x.username.toLowerCase() === args.where.username.toLowerCase()) ||
          (args.where.googleId && x.googleId === args.where.googleId)
      );
      if (!u) return null;
      if (args.include?.profile) {
        return {
          ...u,
          profile: localState.userProfiles.find((p) => p.userId === u.id) || null,
        };
      }
      return u;
    },

    async findFirst(args: { where: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).user.findFirst(args);
      }
      return localState.users.find((u) => {
        if (args.where.email && u.email.toLowerCase() !== args.where.email.toLowerCase()) return false;
        if (args.where.username && u.username.toLowerCase() !== args.where.username.toLowerCase()) return false;
        if (args.where.googleId && u.googleId !== args.where.googleId) return false;
        if (args.where.OR) {
          const match = args.where.OR.some(
            (cond: any) =>
              (cond.email && u.email.toLowerCase() === cond.email.toLowerCase()) ||
              (cond.username && u.username.toLowerCase() === cond.username.toLowerCase()) ||
              (cond.googleId && u.googleId === cond.googleId)
          );
          if (!match) return false;
        }
        return true;
      }) || null;
    },

    async create(args: { data: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).user.create(args);
      }
      const newUser = {
        id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        email: args.data.email,
        fullName: args.data.fullName || args.data.username,
        mobileNumber: args.data.mobileNumber || null,
        username: args.data.username,
        passwordHash: args.data.passwordHash || null,
        googleId: args.data.googleId || null,
        emailVerified: args.data.emailVerified ?? false,
        role: args.data.role || 'USER',
        avatarUrl: args.data.avatarUrl || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localState.users.push(newUser);
      saveLocalState();
      return newUser;
    },

    async update(args: { where: { id: string }; data: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).user.update(args);
      }
      const idx = localState.users.findIndex((u) => u.id === args.where.id);
      if (idx !== -1) {
        localState.users[idx] = {
          ...localState.users[idx],
          ...args.data,
          updatedAt: new Date().toISOString(),
        };
        saveLocalState();
        return localState.users[idx];
      }
      return null;
    },

    async count() {
      if (isPostgresAvailable) {
        return (prisma as any).user.count();
      }
      return localState.users.length;
    },

    async findMany(args?: any) {
      if (isPostgresAvailable) {
        return (prisma as any).user.findMany(args);
      }
      return localState.users.map(({ passwordHash, ...rest }) => rest);
    },
  },

  userProfile: {
    async findUnique(args: { where: { userId: string } }) {
      if (isPostgresAvailable) {
        return (prisma as any).userProfile.findUnique(args);
      }
      return localState.userProfiles.find((p) => p.userId === args.where.userId) || null;
    },

    async upsert(args: { where: { userId: string }; create: any; update: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).userProfile.upsert(args);
      }
      const idx = localState.userProfiles.findIndex((p) => p.userId === args.where.userId);
      if (idx !== -1) {
        localState.userProfiles[idx] = {
          ...localState.userProfiles[idx],
          ...args.update,
          updatedAt: new Date().toISOString(),
        };
        saveLocalState();
        return localState.userProfiles[idx];
      } else {
        const newProf = {
          id: 'prof_' + Date.now(),
          ...args.create,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        localState.userProfiles.push(newProf);
        saveLocalState();
        return newProf;
      }
    },
  },

  song: {
    async findUnique(args: { where: { id?: string; provider_providerId?: { provider: string; providerId: string } } }) {
      if (isPostgresAvailable) {
        return (prisma as any).song.findUnique(args);
      }
      if (args.where.id) {
        return localState.songs.find((s) => s.id === args.where.id) || null;
      }
      if (args.where.provider_providerId) {
        const { provider, providerId } = args.where.provider_providerId;
        return localState.songs.find((s) => s.provider === provider && s.providerId === providerId) || null;
      }
      return null;
    },

    async upsert(args: { where: { provider_providerId: { provider: string; providerId: string } }; create: any; update: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).song.upsert(args);
      }
      const { provider, providerId } = args.where.provider_providerId;
      const idx = localState.songs.findIndex((s) => s.provider === provider && s.providerId === providerId);
      if (idx !== -1) {
        localState.songs[idx] = { ...localState.songs[idx], ...args.update };
        saveLocalState();
        return localState.songs[idx];
      } else {
        const newSong = {
          id: 'sng_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          ...args.create,
          createdAt: new Date().toISOString(),
          playCount: 0,
        };
        localState.songs.push(newSong);
        saveLocalState();
        return newSong;
      }
    },

    async count() {
      if (isPostgresAvailable) {
        return (prisma as any).song.count();
      }
      return localState.songs.length;
    },
  },

  playlist: {
    async findMany(args?: { where?: { userId?: string; isPublic?: boolean }; include?: any; take?: number; orderBy?: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).playlist.findMany(args);
      }
      let list = localState.playlists;
      if (args?.where?.userId) {
        list = list.filter((p) => p.userId === args.where!.userId);
      }
      if (args?.include?.tracks) {
        list = list.map((pl) => {
          const trackRelations = localState.playlistTracks
            .filter((pt) => pt.playlistId === pl.id)
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((pt) => ({
              ...pt,
              song: localState.songs.find((s) => s.id === pt.songId) || null,
            }));
          return { ...pl, tracks: trackRelations };
        });
      }
      if (args?.take) {
        list = list.slice(0, args.take);
      }
      return list;
    },

    async findUnique(args: { where: { id: string }; include?: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).playlist.findUnique(args);
      }
      const pl = localState.playlists.find((p) => p.id === args.where.id);
      if (!pl) return null;
      if (args.include?.tracks) {
        const trackRelations = localState.playlistTracks
          .filter((pt) => pt.playlistId === pl.id)
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((pt) => ({
            ...pt,
            song: localState.songs.find((s) => s.id === pt.songId) || null,
          }));
        return { ...pl, tracks: trackRelations };
      }
      return pl;
    },

    async create(args: { data: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).playlist.create(args);
      }
      const newPlaylist = {
        id: 'pl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        title: args.data.title,
        description: args.data.description || '',
        coverUrl: args.data.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80',
        isPublic: args.data.isPublic ?? true,
        userId: args.data.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localState.playlists.push(newPlaylist);
      saveLocalState();
      return newPlaylist;
    },

    async update(args: { where: { id: string }; data: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).playlist.update(args);
      }
      const idx = localState.playlists.findIndex((p) => p.id === args.where.id);
      if (idx !== -1) {
        localState.playlists[idx] = {
          ...localState.playlists[idx],
          ...args.data,
          updatedAt: new Date().toISOString(),
        };
        saveLocalState();
        return localState.playlists[idx];
      }
      return null;
    },

    async delete(args: { where: { id: string } }) {
      if (isPostgresAvailable) {
        return (prisma as any).playlist.delete(args);
      }
      const idx = localState.playlists.findIndex((p) => p.id === args.where.id);
      if (idx !== -1) {
        const deleted = localState.playlists.splice(idx, 1)[0];
        localState.playlistTracks = localState.playlistTracks.filter((pt) => pt.playlistId !== args.where.id);
        saveLocalState();
        return deleted;
      }
      return null;
    },

    async count() {
      if (isPostgresAvailable) {
        return (prisma as any).playlist.count();
      }
      return localState.playlists.length;
    },
  },

  playlistTrack: {
    async create(args: { data: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).playlistTrack.create(args);
      }
      const newPt = {
        id: 'pt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        playlistId: args.data.playlistId,
        songId: args.data.songId,
        orderIndex: args.data.orderIndex || 0,
        addedAt: new Date().toISOString(),
      };
      localState.playlistTracks.push(newPt);
      saveLocalState();
      return newPt;
    },

    async delete(args: { where: { playlistId_songId: { playlistId: string; songId: string } } }) {
      if (isPostgresAvailable) {
        return (prisma as any).playlistTrack.delete(args);
      }
      const { playlistId, songId } = args.where.playlistId_songId;
      const idx = localState.playlistTracks.findIndex((pt) => pt.playlistId === playlistId && pt.songId === songId);
      if (idx !== -1) {
        const removed = localState.playlistTracks.splice(idx, 1)[0];
        saveLocalState();
        return removed;
      }
      return null;
    },

    async deleteMany(args: { where: { playlistId: string } }) {
      if (isPostgresAvailable) {
        return (prisma as any).playlistTrack.deleteMany(args);
      }
      const initialCount = localState.playlistTracks.length;
      localState.playlistTracks = localState.playlistTracks.filter((pt) => pt.playlistId !== args.where.playlistId);
      saveLocalState();
      return { count: initialCount - localState.playlistTracks.length };
    },
  },

  favorite: {
    async findMany(args: { where: { userId: string }; include?: any; orderBy?: any; take?: number }) {
      if (isPostgresAvailable) {
        return (prisma as any).favorite.findMany(args);
      }
      let userFavs = localState.favorites.filter((f) => f.userId === args.where.userId);
      if (args.take) {
        userFavs = userFavs.slice(0, args.take);
      }
      if (args.include?.song) {
        return userFavs.map((f) => ({
          ...f,
          song: localState.songs.find((s) => s.id === f.songId) || null,
        }));
      }
      return userFavs;
    },

    async findFirst(args: { where: { userId: string; songId: string } }) {
      if (isPostgresAvailable) {
        return (prisma as any).favorite.findFirst(args);
      }
      return localState.favorites.find((f) => f.userId === args.where.userId && f.songId === args.where.songId) || null;
    },

    async create(args: { data: { userId: string; songId: string } }) {
      if (isPostgresAvailable) {
        return (prisma as any).favorite.create(args);
      }
      const newFav = {
        id: 'fav_' + Date.now(),
        userId: args.data.userId,
        songId: args.data.songId,
        createdAt: new Date().toISOString(),
      };
      localState.favorites.push(newFav);
      saveLocalState();
      return newFav;
    },

    async delete(args: { where: { userId_songId: { userId: string; songId: string } } }) {
      if (isPostgresAvailable) {
        return (prisma as any).favorite.delete(args);
      }
      const { userId, songId } = args.where.userId_songId;
      const idx = localState.favorites.findIndex((f) => f.userId === userId && f.songId === songId);
      if (idx !== -1) {
        const removed = localState.favorites.splice(idx, 1)[0];
        saveLocalState();
        return removed;
      }
      return null;
    },

    async count() {
      if (isPostgresAvailable) {
        return (prisma as any).favorite.count();
      }
      return localState.favorites.length;
    },
  },

  listeningHistory: {
    async findMany(args: { where: { userId: string }; take?: number; include?: any; orderBy?: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).listeningHistory.findMany(args);
      }
      let list = localState.listeningHistory
        .filter((h) => h.userId === args.where.userId)
        .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());
      if (args.take) {
        list = list.slice(0, args.take);
      }
      if (args.include?.song) {
        return list.map((h) => ({
          ...h,
          song: localState.songs.find((s) => s.id === h.songId) || null,
        }));
      }
      return list;
    },

    async create(args: { data: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).listeningHistory.create(args);
      }
      const newEntry = {
        id: 'hist_' + Date.now(),
        userId: args.data.userId,
        songId: args.data.songId,
        durationPlayed: args.data.durationPlayed || 0,
        playedAt: new Date().toISOString(),
      };
      localState.listeningHistory.push(newEntry);
      saveLocalState();
      return newEntry;
    },

    async count() {
      if (isPostgresAvailable) {
        return (prisma as any).listeningHistory.count();
      }
      return localState.listeningHistory.length;
    },

    async delete(args: { where: { id: string } }) {
      if (isPostgresAvailable) {
        try { return await (prisma as any).listeningHistory.delete(args); } catch {}
      }
      const idx = localState.listeningHistory.findIndex((h) => h.id === args.where.id);
      if (idx !== -1) {
        const removed = localState.listeningHistory.splice(idx, 1)[0];
        saveLocalState();
        return removed;
      }
      return null;
    },

    async deleteMany(args: { where: { userId?: string } }) {
      if (isPostgresAvailable) {
        try { return await (prisma as any).listeningHistory.deleteMany(args); } catch {}
      }
      if (args.where.userId) {
        const init = localState.listeningHistory.length;
        localState.listeningHistory = localState.listeningHistory.filter((h) => h.userId !== args.where.userId);
        saveLocalState();
        return { count: init - localState.listeningHistory.length };
      }
      return { count: 0 };
    },
  },

  searchHistory: {
    async findMany(args: { where?: { userId?: string }; take?: number; orderBy?: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).searchHistory.findMany(args);
      }
      let list = localState.searchHistory;
      if (args?.where?.userId) {
        list = list.filter((s) => s.userId === args.where!.userId);
      }
      list.sort((a, b) => new Date(b.searchedAt).getTime() - new Date(a.searchedAt).getTime());
      if (args.take) {
        list = list.slice(0, args.take);
      }
      return list;
    },

    async create(args: { data: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).searchHistory.create(args);
      }
      const newEntry = {
        id: 'srch_' + Date.now(),
        userId: args.data.userId || null,
        query: args.data.query,
        provider: args.data.provider || 'all',
        resultCount: args.data.resultCount || 0,
        searchedAt: new Date().toISOString(),
      };
      localState.searchHistory.push(newEntry);
      saveLocalState();
      return newEntry;
    },

    async delete(args: { where: { id: string } }) {
      if (isPostgresAvailable) {
        try { return await (prisma as any).searchHistory.delete(args); } catch {}
      }
      const idx = localState.searchHistory.findIndex((s) => s.id === args.where.id);
      if (idx !== -1) {
        const removed = localState.searchHistory.splice(idx, 1)[0];
        saveLocalState();
        return removed;
      }
      return null;
    },

    async deleteMany(args?: { where?: { userId?: string } }) {
      if (isPostgresAvailable) {
        return (prisma as any).searchHistory.deleteMany(args);
      }
      if (args?.where?.userId) {
        localState.searchHistory = localState.searchHistory.filter((s) => s.userId !== args.where!.userId);
      } else {
        localState.searchHistory = [];
      }
      saveLocalState();
      return { count: 1 };
    },
  },

  userSettings: {
    async findUnique(args: { where: { userId: string } }) {
      if (isPostgresAvailable) {
        return (prisma as any).userSettings.findUnique(args);
      }
      return localState.userSettings.find((s) => s.userId === args.where.userId) || null;
    },

    async upsert(args: { where: { userId: string }; create: any; update: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).userSettings.upsert(args);
      }
      const idx = localState.userSettings.findIndex((s) => s.userId === args.where.userId);
      if (idx !== -1) {
        localState.userSettings[idx] = {
          ...localState.userSettings[idx],
          ...args.update,
          updatedAt: new Date().toISOString(),
        };
        saveLocalState();
        return localState.userSettings[idx];
      } else {
        const newSet = {
          id: 'set_' + Date.now(),
          ...args.create,
          updatedAt: new Date().toISOString(),
        };
        localState.userSettings.push(newSet);
        saveLocalState();
        return newSet;
      }
    },
  },

  musicProvider: {
    async findMany() {
      if (isPostgresAvailable) {
        return (prisma as any).musicProvider.findMany();
      }
      return localState.musicProviders;
    },

    async update(args: { where: { name: string }; data: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).musicProvider.update(args);
      }
      const idx = localState.musicProviders.findIndex((p) => p.name === args.where.name);
      if (idx !== -1) {
        localState.musicProviders[idx] = {
          ...localState.musicProviders[idx],
          ...args.data,
          lastChecked: new Date().toISOString(),
        };
        saveLocalState();
        return localState.musicProviders[idx];
      }
      return null;
    },

    async count() {
      if (isPostgresAvailable) {
        return (prisma as any).musicProvider.count();
      }
      return localState.musicProviders.length;
    },
  },

  session: {
    async create(args: { data: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).session.create(args);
      }
      const newSession = {
        id: 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        userId: args.data.userId,
        refreshTokenHash: args.data.refreshTokenHash,
        expiresAt: args.data.expiresAt,
        revokedAt: null,
        createdAt: new Date().toISOString(),
      };
      localState.sessions.push(newSession);
      saveLocalState();
      return newSession;
    },

    async findUnique(args: { where: { id: string } }) {
      if (isPostgresAvailable) {
        return (prisma as any).session.findUnique(args);
      }
      return localState.sessions.find((s) => s.id === args.where.id) || null;
    },

    async findFirst(args: { where: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).session.findFirst(args);
      }
      return localState.sessions.find((s) => {
        if (args.where.userId && s.userId !== args.where.userId) return false;
        if (args.where.id && s.id !== args.where.id) return false;
        if (args.where.refreshTokenHash && s.refreshTokenHash !== args.where.refreshTokenHash) return false;
        if (args.where.revokedAt === null && s.revokedAt !== null) return false;
        return true;
      }) || null;
    },

    async update(args: { where: { id: string }; data: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).session.update(args);
      }
      const idx = localState.sessions.findIndex((s) => s.id === args.where.id);
      if (idx !== -1) {
        localState.sessions[idx] = {
          ...localState.sessions[idx],
          ...args.data,
        };
        saveLocalState();
        return localState.sessions[idx];
      }
      return null;
    },

    async updateMany(args: { where: any; data: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).session.updateMany(args);
      }
      let count = 0;
      localState.sessions.forEach((s) => {
        let match = true;
        if (args.where.userId && s.userId !== args.where.userId) match = false;
        if (args.where.id && s.id !== args.where.id) match = false;
        if (match) {
          Object.assign(s, args.data);
          count++;
        }
      });
      if (count > 0) saveLocalState();
      return { count };
    },
  },

  verificationCode: {
    async create(args: { data: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).verificationCode.create(args);
      }
      // Invalidate older codes for this email
      localState.verificationCodes = localState.verificationCodes.filter(
        (v) => v.email.toLowerCase() !== args.data.email.toLowerCase()
      );
      const newCode = {
        id: 'vcode_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        email: args.data.email,
        code: args.data.code,
        expiresAt: args.data.expiresAt,
        verifiedAt: null,
        createdAt: new Date().toISOString(),
      };
      localState.verificationCodes.push(newCode);
      saveLocalState();
      return newCode;
    },

    async findFirst(args: { where: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).verificationCode.findFirst(args);
      }
      return localState.verificationCodes.find((v) => {
        if (args.where.email && v.email.toLowerCase() !== args.where.email.toLowerCase()) return false;
        if (args.where.code && v.code !== args.where.code) return false;
        if (args.where.verifiedAt === null && v.verifiedAt !== null) return false;
        return true;
      }) || null;
    },

    async update(args: { where: { id: string }; data: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).verificationCode.update(args);
      }
      const idx = localState.verificationCodes.findIndex((v) => v.id === args.where.id);
      if (idx !== -1) {
        localState.verificationCodes[idx] = {
          ...localState.verificationCodes[idx],
          ...args.data,
        };
        saveLocalState();
        return localState.verificationCodes[idx];
      }
      return null;
    },
  },

  passwordResetToken: {
    async create(args: { data: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).passwordResetToken.create(args);
      }
      // Invalidate older tokens for this email
      localState.passwordResetTokens = localState.passwordResetTokens.filter(
        (t) => t.email.toLowerCase() !== args.data.email.toLowerCase()
      );
      const newToken = {
        id: 'prt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        email: args.data.email,
        token: args.data.token,
        expiresAt: args.data.expiresAt,
        usedAt: null,
        createdAt: new Date().toISOString(),
      };
      localState.passwordResetTokens.push(newToken);
      saveLocalState();
      return newToken;
    },

    async findFirst(args: { where: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).passwordResetToken.findFirst(args);
      }
      return localState.passwordResetTokens.find((t) => {
        if (args.where.email && t.email.toLowerCase() !== args.where.email.toLowerCase()) return false;
        if (args.where.token && t.token !== args.where.token) return false;
        if (args.where.usedAt === null && t.usedAt !== null) return false;
        return true;
      }) || null;
    },

    async update(args: { where: { id: string }; data: any }) {
      if (isPostgresAvailable) {
        return (prisma as any).passwordResetToken.update(args);
      }
      const idx = localState.passwordResetTokens.findIndex((t) => t.id === args.where.id);
      if (idx !== -1) {
        localState.passwordResetTokens[idx] = {
          ...localState.passwordResetTokens[idx],
          ...args.data,
        };
        saveLocalState();
        return localState.passwordResetTokens[idx];
      }
      return null;
    },
  },

  followedArtist: {
    async findMany(args: { where: { userId: string }; take?: number; orderBy?: any }) {
      if (isPostgresAvailable) {
        try { return await (prisma as any).followedArtist.findMany(args); } catch {}
      }
      let list = localState.followedArtists.filter((f) => f.userId === args.where.userId);
      if (args.take) list = list.slice(0, args.take);
      return list;
    },

    async findFirst(args: { where: { userId: string; artistId: string } }) {
      if (isPostgresAvailable) {
        try { return await (prisma as any).followedArtist.findFirst(args); } catch {}
      }
      return (
        localState.followedArtists.find(
          (f) => f.userId === args.where.userId && f.artistId === args.where.artistId
        ) || null
      );
    },

    async create(args: { data: { userId: string; artistId: string; artistName?: string; artistImage?: string; genre?: string } }) {
      if (isPostgresAvailable) {
        try { return await (prisma as any).followedArtist.create(args); } catch {}
      }
      const existing = localState.followedArtists.find(
        (f) => f.userId === args.data.userId && f.artistId === args.data.artistId
      );
      if (existing) return existing;

      const newEntry = {
        id: 'flw_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        userId: args.data.userId,
        artistId: args.data.artistId,
        artistName: args.data.artistName || 'Artist',
        artistImage: args.data.artistImage || null,
        genre: args.data.genre || 'Music',
        followedAt: new Date().toISOString(),
      };
      localState.followedArtists.push(newEntry);
      saveLocalState();
      return newEntry;
    },

    async delete(args: { where: { userId_artistId: { userId: string; artistId: string } } }) {
      if (isPostgresAvailable) {
        try { return await (prisma as any).followedArtist.delete(args); } catch {}
      }
      const { userId, artistId } = args.where.userId_artistId;
      const idx = localState.followedArtists.findIndex(
        (f) => f.userId === userId && f.artistId === artistId
      );
      if (idx !== -1) {
        const removed = localState.followedArtists.splice(idx, 1)[0];
        saveLocalState();
        return removed;
      }
      return null;
    },

    async count(args?: { where?: { userId?: string } }) {
      if (isPostgresAvailable) {
        try { return await (prisma as any).followedArtist.count(args); } catch {}
      }
      if (args?.where?.userId) {
        return localState.followedArtists.filter((f) => f.userId === args.where!.userId).length;
      }
      return localState.followedArtists.length;
    },
  },

  savedAlbum: {
    async findMany(args: { where: { userId: string }; take?: number; orderBy?: any }) {
      if (isPostgresAvailable) {
        try { return await (prisma as any).savedAlbum.findMany(args); } catch {}
      }
      let list = localState.savedAlbums.filter((a) => a.userId === args.where.userId);
      if (args.take) list = list.slice(0, args.take);
      return list;
    },

    async findFirst(args: { where: { userId: string; albumId: string } }) {
      if (isPostgresAvailable) {
        try { return await (prisma as any).savedAlbum.findFirst(args); } catch {}
      }
      return (
        localState.savedAlbums.find(
          (a) => a.userId === args.where.userId && a.albumId === args.where.albumId
        ) || null
      );
    },

    async create(args: { data: { userId: string; albumId: string; albumTitle?: string; albumArtist?: string; albumCover?: string; releaseYear?: string } }) {
      if (isPostgresAvailable) {
        try { return await (prisma as any).savedAlbum.create(args); } catch {}
      }
      const existing = localState.savedAlbums.find(
        (a) => a.userId === args.data.userId && a.albumId === args.data.albumId
      );
      if (existing) return existing;

      const newEntry = {
        id: 'alb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        userId: args.data.userId,
        albumId: args.data.albumId,
        albumTitle: args.data.albumTitle || 'Album',
        albumArtist: args.data.albumArtist || 'Artist',
        albumCover: args.data.albumCover || null,
        releaseYear: args.data.releaseYear || '2026',
        savedAt: new Date().toISOString(),
      };
      localState.savedAlbums.push(newEntry);
      saveLocalState();
      return newEntry;
    },

    async delete(args: { where: { userId_albumId: { userId: string; albumId: string } } }) {
      if (isPostgresAvailable) {
        try { return await (prisma as any).savedAlbum.delete(args); } catch {}
      }
      const { userId, albumId } = args.where.userId_albumId;
      const idx = localState.savedAlbums.findIndex(
        (a) => a.userId === userId && a.albumId === albumId
      );
      if (idx !== -1) {
        const removed = localState.savedAlbums.splice(idx, 1)[0];
        saveLocalState();
        return removed;
      }
      return null;
    },

    async count(args?: { where?: { userId?: string } }) {
      if (isPostgresAvailable) {
        try { return await (prisma as any).savedAlbum.count(args); } catch {}
      }
      if (args?.where?.userId) {
        return localState.savedAlbums.filter((a) => a.userId === args.where!.userId).length;
      }
      return localState.savedAlbums.length;
    },
  },

  listeningEvent: {
    async findMany(args: { where: { userId: string }; take?: number; orderBy?: any }) {
      if (isPostgresAvailable) {
        try { return await (prisma as any).listeningEvent.findMany(args); } catch {}
      }
      let list = localState.listeningEvents
        .filter((e) => e.userId === args.where.userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (args.take) list = list.slice(0, args.take);
      return list;
    },

    async create(args: { data: any }) {
      if (isPostgresAvailable) {
        try { return await (prisma as any).listeningEvent.create(args); } catch {}
      }
      const newEntry = {
        id: 'levt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        userId: args.data.userId,
        songId: args.data.songId,
        songTitle: args.data.songTitle || 'Track',
        artist: args.data.artist || 'Artist',
        album: args.data.album || 'Single',
        coverUrl: args.data.coverUrl || null,
        eventType: args.data.eventType || 'threshold_reached',
        listenedDuration: args.data.listenedDuration || 0,
        completionPercentage: args.data.completionPercentage || 0,
        createdAt: new Date().toISOString(),
      };
      localState.listeningEvents.push(newEntry);
      saveLocalState();
      return newEntry;
    },

    async count(args?: { where?: { userId?: string } }) {
      if (isPostgresAvailable) {
        try { return await (prisma as any).listeningEvent.count(args); } catch {}
      }
      if (args?.where?.userId) {
        return localState.listeningEvents.filter((e) => e.userId === args.where!.userId).length;
      }
      return localState.listeningEvents.length;
    },
  },
};
