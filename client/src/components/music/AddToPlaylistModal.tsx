import React, { useState, useEffect } from 'react';
import { X, Plus, Music, Check } from 'lucide-react';
import { Track, Playlist } from '../../types/music.js';
import { playlistApi } from '../../services/api.js';

interface AddToPlaylistModalProps {
  track: Track | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({ track, isOpen, onClose }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newTitle, setNewTitle] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      playlistApi.list().then(setPlaylists).catch(console.warn);
    }
  }, [isOpen]);

  if (!isOpen || !track) return null;

  const handleAddToPlaylist = async (playlistId: string) => {
    setLoading(true);
    try {
      await playlistApi.addTrack(playlistId, track);
      setAddedMap((prev) => ({ ...prev, [playlistId]: true }));
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setLoading(true);
    try {
      const created = await playlistApi.create({
        title: newTitle.trim(),
        description: 'Created from VIBE MUSIC',
      });
      await playlistApi.addTrack(created.id, track);
      setNewTitle('');
      onClose();
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-md rounded-2xl p-6 border border-purple-500/30 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-purple-900/40"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-2">Add to Playlist</h3>
        <p className="text-xs text-purple-300 mb-4 truncate">
          Song: <span className="text-white font-medium">{track.title}</span> – {track.artist}
        </p>

        {/* Existing Playlists */}
        <div className="max-h-56 overflow-y-auto space-y-2 mb-4 pr-1">
          {playlists.length === 0 ? (
            <p className="text-sm text-slate-400 py-3 text-center">No playlists created yet.</p>
          ) : (
            playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => handleAddToPlaylist(pl.id)}
                disabled={loading || addedMap[pl.id]}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-500/20 text-left transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-800/50 flex items-center justify-center">
                    <Music className="w-4 h-4 text-purple-300" />
                  </div>
                  <span className="font-medium text-sm text-white truncate max-w-[220px]">{pl.title}</span>
                </div>
                {addedMap[pl.id] ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Plus className="w-4 h-4 text-purple-400" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Create new playlist form */}
        <form onSubmit={handleCreateAndAdd} className="pt-3 border-t border-purple-500/20">
          <label className="block text-xs font-semibold text-purple-300 mb-1.5">Or create new playlist</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Playlist name..."
              className="flex-1 glass-input rounded-xl px-3 py-2 text-sm text-white placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={loading || !newTitle.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium text-sm disabled:opacity-50 hover:brightness-110 transition-all"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

