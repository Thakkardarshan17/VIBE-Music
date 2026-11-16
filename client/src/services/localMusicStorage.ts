import { Track } from '../types/music.js';
import { favoriteApi, historyApi } from './api.js';

const RECENT_TRACKS_KEY = 'vibe_recent_tracks';
const LIKED_SONGS_KEY = 'vibe_liked_songs';

export const localMusicStorage = {
  // ==========================================
  // RECENTLY PLAYED TRACKS
  // ==========================================
  getRecentTracks(): Track[] {
    try {
      const data = localStorage.getItem(RECENT_TRACKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addRecentTrack(track: Track): void {
    if (!track || !track.id) return;
    try {
      const current = this.getRecentTracks();
      // Remove if already exists, then put at the front
      const filtered = current.filter((t) => t.id !== track.id);
      const updated = [track, ...filtered].slice(0, 50); // keep up to 50
      localStorage.setItem(RECENT_TRACKS_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('vibe_recent_updated', { detail: updated }));
    } catch (e) {
      console.warn('Failed to save recent track locally:', e);
    }
  },

  clearRecentTracks(): void {
    try {
      localStorage.removeItem(RECENT_TRACKS_KEY);
      window.dispatchEvent(new CustomEvent('vibe_recent_updated', { detail: [] }));
    } catch (e) {
      console.warn(e);
    }
  },

  // ==========================================
  // LIKED / FAVORITE SONGS
  // ==========================================
  getLikedSongs(): Track[] {
    try {
      const data = localStorage.getItem(LIKED_SONGS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  isSongLiked(songId: string): boolean {
    if (!songId) return false;
    const liked = this.getLikedSongs();
    return liked.some((t) => t.id === songId);
  },

  async toggleLikeSong(track: Track, isAuthenticated: boolean = false): Promise<boolean> {
    if (!track || !track.id) return false;

    const currentLiked = this.getLikedSongs();
    const alreadyLiked = currentLiked.some((t) => t.id === track.id);
    let updated: Track[];

    if (alreadyLiked) {
      updated = currentLiked.filter((t) => t.id !== track.id);
    } else {
      updated = [track, ...currentLiked];
    }

    try {
      localStorage.setItem(LIKED_SONGS_KEY, JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent('vibe_favorites_updated', {
          detail: { trackId: track.id, isLiked: !alreadyLiked, favorites: updated },
        })
      );
    } catch (e) {
      console.warn('Failed to save liked song locally:', e);
    }

    // If user is authenticated, sync with backend database as well
    if (isAuthenticated) {
      try {
        await favoriteApi.toggle(track.id, track);
      } catch (err) {
        console.warn('Server favorite sync error (kept local):', err);
      }
    }

    return !alreadyLiked;
  },

  setLikedSongs(tracks: Track[]): void {
    try {
      localStorage.setItem(LIKED_SONGS_KEY, JSON.stringify(tracks));
      window.dispatchEvent(new CustomEvent('vibe_favorites_updated', { detail: { favorites: tracks } }));
    } catch (e) {
      console.warn(e);
    }
  },
};

