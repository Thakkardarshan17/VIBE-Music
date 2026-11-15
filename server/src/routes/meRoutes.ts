import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getDashboard,
  getActivity,
  getStatistics,
  getRecentlyPlayed,
  deleteRecentHistoryItem,
  clearListeningHistory,
  getLikedSongs,
  addLikedSong,
  removeLikedSong,
  getMyPlaylists,
  createMyPlaylist,
  updateMyPlaylist,
  deleteMyPlaylist,
  addSongToMyPlaylist,
  removeSongFromMyPlaylist,
  getFollowedArtists,
  followArtist,
  unfollowArtist,
  getSavedAlbums,
  saveAlbum,
  removeSavedAlbum,
  getMySearchHistory,
  clearMySearchHistory,
  deleteSearchHistoryItem,
  logListeningEvent,
} from '../controllers/meController.js';

const router = Router();

// All /api/me routes are strictly protected by session authentication
router.use(requireAuth);

// 1. Dashboard & Overall Stats
router.get('/dashboard', getDashboard);
router.get('/activity', getActivity);
router.get('/statistics', getStatistics);

// 2. Recently Played
router.get('/recently-played', getRecentlyPlayed);
router.delete('/recently-played/:id', deleteRecentHistoryItem);
router.delete('/recently-played', clearListeningHistory);

// 3. Liked Songs
router.get('/liked-songs', getLikedSongs);
router.post('/liked-songs/:songId', addLikedSong);
router.delete('/liked-songs/:songId', removeLikedSong);

// 4. Playlists
router.get('/playlists', getMyPlaylists);
router.post('/playlists', createMyPlaylist);
router.patch('/playlists/:playlistId', updateMyPlaylist);
router.delete('/playlists/:playlistId', deleteMyPlaylist);
router.post('/playlists/:playlistId/songs', addSongToMyPlaylist);
router.delete('/playlists/:playlistId/songs/:songId', removeSongFromMyPlaylist);

// 5. Followed Artists
router.get('/followed-artists', getFollowedArtists);
router.post('/followed-artists/:artistId', followArtist);
router.delete('/followed-artists/:artistId', unfollowArtist);

// 6. Saved Albums
router.get('/saved-albums', getSavedAlbums);
router.post('/saved-albums/:albumId', saveAlbum);
router.delete('/saved-albums/:albumId', removeSavedAlbum);

// 7. Search History
router.get('/search-history', getMySearchHistory);
router.delete('/search-history', clearMySearchHistory);
router.delete('/search-history/:id', deleteSearchHistoryItem);

// 8. Listening Events (Threshold-verified)
router.post('/listening-events', logListeningEvent);

export default router;

