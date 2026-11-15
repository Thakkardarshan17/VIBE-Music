import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ListMusic, Plus, Play, Trash2, Edit2, Music, Check, X } from 'lucide-react';
import { playlistApi } from '../services/api.js';
import { Playlist, Track } from '../types/music.js';
import { SongRow, SongTableHeader } from '../components/music/SongRow.js';
import { AlbumArtwork } from '../components/common/AlbumArtwork.js';
import { usePlayer } from '../context/PlayerContext.js';
import { useAuth } from '../context/AuthContext.js';

export const PlaylistsPage: React.FC = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');

  const [searchParams] = useSearchParams();
  const requestedId = searchParams.get('id');

  const { isAuthenticated } = useAuth();
  const { playTrack } = usePlayer();

  const fetchPlaylists = async () => {
    try {
      const list = await playlistApi.list();
      setPlaylists(list);
      if (requestedId) {
        const found = list.find((p) => p.id === requestedId);
        if (found) setSelectedPlaylist(found);
      } else if (list.length > 0 && !selectedPlaylist) {
        setSelectedPlaylist(list[0]);
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlaylists();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, requestedId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const created = await playlistApi.create({
        title: newTitle.trim(),
        description: newDescription.trim(),
      });
      setNewTitle('');
      setNewDescription('');
      setIsCreating(false);
      await fetchPlaylists();
      setSelectedPlaylist(created);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    try {
      await playlistApi.delete(id);
      if (selectedPlaylist?.id === id) {
        setSelectedPlaylist(null);
      }
      await fetchPlaylists();
    } catch (e) {
      console.warn(e);
    }
  };

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      const updated = await playlistApi.update(id, { title: editTitle.trim() });
      setEditingId(null);
      await fetchPlaylists();
      if (selectedPlaylist?.id === id) {
        setSelectedPlaylist({ ...selectedPlaylist, title: updated.title });
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleRemoveTrack = async (playlistId: string, songId: string) => {
    try {
      await playlistApi.removeTrack(playlistId, songId);
      // Refresh selected playlist
      const updated = await playlistApi.get(playlistId);
      setSelectedPlaylist(updated);
      fetchPlaylists();
    } catch (e) {
      console.warn(e);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="glass-panel rounded-3xl p-12 text-center max-w-lg mx-auto my-12 border border-purple-500/25">
        <ListMusic className="w-16 h-16 text-purple-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">My Playlists</h3>
        <p className="text-sm text-purple-200/70 mb-4">Please log in to create and manage personal playlists.</p>
      </div>
    );
  }

  const currentTracks: Track[] = selectedPlaylist?.tracks?.map((pt) => pt.song).filter(Boolean) as Track[] || [];

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      {/* Header with Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/60 border border-purple-500/30 text-purple-200 text-xs font-semibold mb-2">
            <ListMusic className="w-3.5 h-3.5 text-pink-400" /> Custom Collections
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Playlists</h2>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Playlist
        </button>
      </div>

      {/* Creation Modal / Inline Drawer */}
      {isCreating && (
        <form onSubmit={handleCreate} className="glass-panel p-6 rounded-3xl border border-purple-500/30 max-w-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Create New Playlist</h3>
            <button type="button" onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Playlist Title (e.g. Late Night Vibe, Bollywood Hits)"
              className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400"
              required
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description (optional)..."
              rows={2}
              className="w-full glass-input rounded-xl px-4 py-2 text-sm text-white placeholder-slate-400"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-purple-950/40"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold hover:bg-purple-500"
              >
                Save Playlist
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Playlists Horizontal Bar or Selector */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {playlists.map((pl) => (
          <button
            key={pl.id}
            onClick={() => setSelectedPlaylist(pl)}
            className={`px-4 py-2 rounded-2xl flex items-center gap-2 text-sm font-semibold transition-all whitespace-nowrap ${
              selectedPlaylist?.id === pl.id
                ? 'bg-purple-600 text-white shadow-lg'
                : 'glass-card text-purple-200 hover:text-white'
            }`}
          >
            <Music className="w-4 h-4" />
            {pl.title}
          </button>
        ))}
      </div>

      {/* Selected Playlist Detailed View */}
      {selectedPlaylist ? (
        <div className="glass-panel rounded-3xl p-6 md:p-8 border border-purple-500/25 shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-8 pb-6 border-b border-purple-500/20">
            <div className="w-36 h-36 sm:w-40 sm:h-40 flex-shrink-0 shadow-xl">
              <AlbumArtwork
                src={selectedPlaylist.coverUrl}
                alt={selectedPlaylist.title}
                aspectRatio="square"
                rounded="rounded-2xl"
                className="w-full h-full"
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <span className="text-xs uppercase font-bold tracking-widest text-purple-400">PLAYLIST</span>
              {editingId === selectedPlaylist.id ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="glass-input rounded-lg px-3 py-1 text-lg font-bold text-white"
                  />
                  <button onClick={() => handleRename(selectedPlaylist.id)} className="p-1.5 text-emerald-400 hover:text-white">
                    <Check className="w-5 h-5" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-1.5 text-slate-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-1">
                  <h3 className="text-3xl font-black text-white">{selectedPlaylist.title}</h3>
                  <button
                    onClick={() => {
                      setEditingId(selectedPlaylist.id);
                      setEditTitle(selectedPlaylist.title);
                    }}
                    className="p-1.5 text-slate-400 hover:text-purple-300"
                    title="Rename Playlist"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              <p className="text-sm text-purple-300/80 mt-1">{selectedPlaylist.description || 'Custom playlist'}</p>
              <p className="text-xs text-slate-400 font-mono mt-2">{currentTracks.length} tracks</p>
            </div>

            <div className="flex items-center gap-3">
              {currentTracks.length > 0 && (
                <button
                  onClick={() => playTrack(currentTracks[0], currentTracks)}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" /> Play Playlist
                </button>
              )}

              <button
                onClick={() => handleDelete(selectedPlaylist.id)}
                className="p-3 rounded-full bg-red-950/40 text-red-400 hover:bg-red-900/60 transition-colors border border-red-500/20"
                title="Delete Playlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tracks List */}
          {currentTracks.length === 0 ? (
            <div className="text-center py-10">
              <Music className="w-12 h-12 text-purple-400/50 mx-auto mb-2" />
              <p className="text-sm text-slate-400">This playlist has no songs yet.</p>
              <p className="text-xs text-purple-300/70 mt-1">Use the Search page to find songs and click "+" to add them here!</p>
            </div>
          ) : (
            <div>
              <SongTableHeader />
              <div className="divide-y divide-purple-500/10">
                {currentTracks.map((track, idx) => (
                  <SongRow
                    key={`${track.id}-${idx}`}
                    track={track}
                    index={idx}
                    queueContext={currentTracks}
                    onRemove={() => handleRemoveTrack(selectedPlaylist.id, track.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-400">No playlists available. Click "Create Playlist" above.</p>
      )}
    </div>
  );
};

