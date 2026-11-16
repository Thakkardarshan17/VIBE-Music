import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Disc, Search, Play, Shuffle, Calendar, Music, ArrowLeft, Disc3 } from 'lucide-react';
import { musicApi } from '../services/api.js';
import { Album, Track } from '../types/music.js';
import { AlbumCard } from '../components/music/AlbumCard.js';
import { SongRow, SongTableHeader } from '../components/music/SongRow.js';
import { AddToPlaylistModal } from '../components/music/AddToPlaylistModal.js';
import { AlbumArtwork } from '../components/common/AlbumArtwork.js';
import { usePlayer } from '../context/PlayerContext.js';

export const AlbumsPage: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumTracks, setAlbumTracks] = useState<Track[]>([]);
  const [loadingTracks, setLoadingTracks] = useState<boolean>(false);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [selectedTrackForModal, setSelectedTrackForModal] = useState<Track | null>(null);

  const [searchParams] = useSearchParams();
  const requestedTitle = searchParams.get('title');

  const { playTrack } = usePlayer();

  useEffect(() => {
    musicApi.getAlbums().then((list) => {
      const validList = Array.isArray(list) ? list : [];
      setAlbums(validList);
      if (requestedTitle) {
        const found = validList.find((a) => a.title.toLowerCase() === requestedTitle.toLowerCase());
        if (found) handleSelectAlbum(found);
      }
    }).catch(console.warn);
  }, [requestedTitle]);

  const handleSelectAlbum = async (album: Album) => {
    setSelectedAlbum(album);
    setLoadingTracks(true);
    try {
      const searchRes = await musicApi.search(album.title);
      setAlbumTracks(searchRes?.tracks && searchRes.tracks.length > 0 ? searchRes.tracks : []);
    } catch (e) {
      console.warn(e);
      setAlbumTracks([]);
    } finally {
      setLoadingTracks(false);
    }
  };

  const handlePlayAlbum = (shuffle: boolean = false) => {
    if (albumTracks.length === 0) return;
    const list = shuffle ? [...albumTracks].sort(() => Math.random() - 0.5) : albumTracks;
    playTrack(list[0], list);
  };

  const filtered = albums.filter(
    (a) =>
      a.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      a.artist.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      {/* Header */}
      {!selectedAlbum ? (
        <>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#170D24] border border-[#352044] text-[#B7A6C8] text-xs font-semibold mb-2">
              <Disc className="w-3.5 h-3.5 text-[#E51D87]" /> Full Records
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Studio Albums</h2>
            <p className="text-sm text-[#B7A6C8] mt-1">
              Explore complete studio albums, motion picture soundtracks, and concept records.
            </p>
          </div>

          {/* Filter input */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-[#B7A6C8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter albums by title or artist..."
              className="w-full glass-input rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400"
            />
          </div>

          {/* Album Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {filtered.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                onClick={() => handleSelectAlbum(album)}
              />
            ))}
          </div>
        </>
      ) : (
        /* Album Details Spotlight View */
        <div className="space-y-6">
          <button
            onClick={() => setSelectedAlbum(null)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#B7A6C8] hover:text-white transition-colors py-1"
          >
            <ArrowLeft className="w-4 h-4" /> All Albums
          </button>

          {/* Album Hero Header */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-[#352044] shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            <div
              className="absolute inset-0 opacity-20 pointer-events-none blur-3xl scale-125"
              style={{
                backgroundImage: `url(${selectedAlbum.coverUrl})`,
                backgroundPosition: 'center',
                backgroundSize: 'cover',
              }}
            />

            <div className="w-44 h-44 sm:w-56 sm:h-56 relative z-10 flex-shrink-0 shadow-2xl">
              <AlbumArtwork
                src={selectedAlbum.coverUrl}
                alt={selectedAlbum.title}
                aspectRatio="square"
                rounded="rounded-2xl"
                className="w-full h-full"
              />
            </div>

            <div className="relative z-10 flex-1 text-center md:text-left space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#E51D87] px-2.5 py-0.5 rounded-full bg-[#170D24] border border-[#352044]">
                Album Details
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">{selectedAlbum.title}</h1>
              <p className="text-lg text-[#B7A6C8] font-medium">{selectedAlbum.artist}</p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#A020F0]" /> Release Year: {selectedAlbum.releaseDate || '2026'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-[#E51D87]" /> {selectedAlbum.totalTracks || albumTracks.length} Songs
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <button
                  onClick={() => handlePlayAlbum(false)}
                  disabled={loadingTracks || albumTracks.length === 0}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#A020F0] to-[#E51D87] text-white font-bold text-xs sm:text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 min-h-[44px]"
                >
                  <Play className="w-4 h-4 fill-current" /> Play Album
                </button>
                <button
                  onClick={() => handlePlayAlbum(true)}
                  disabled={loadingTracks || albumTracks.length === 0}
                  className="px-5 py-2.5 rounded-full bg-[#090510]/80 border border-[#352044] text-white font-bold text-xs sm:text-sm hover:border-[#A020F0] active:scale-95 transition-all flex items-center gap-2 min-h-[44px]"
                >
                  <Shuffle className="w-4 h-4" /> Shuffle
                </button>
              </div>
            </div>
          </div>

          {/* Track Listing */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Disc3 className="w-4 h-4 text-[#A020F0]" /> Track Listing ({albumTracks.length})
            </h3>

            {loadingTracks ? (
              <div className="text-center py-12 text-[#B7A6C8] text-sm">Loading album tracks...</div>
            ) : albumTracks.length > 0 ? (
              <div className="space-y-1.5">
                <SongTableHeader />
                {albumTracks.map((track, idx) => (
                  <SongRow
                    key={track.id}
                    track={track}
                    index={idx + 1}
                    onAddToPlaylist={(t) => setSelectedTrackForModal(t)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-[#B7A6C8] text-sm glass-card rounded-2xl p-6">
                No tracks currently indexed for this record.
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTrackForModal && (
        <AddToPlaylistModal
          track={selectedTrackForModal}
          isOpen={!!selectedTrackForModal}
          onClose={() => setSelectedTrackForModal(null)}
        />
      )}
    </div>
  );
};
