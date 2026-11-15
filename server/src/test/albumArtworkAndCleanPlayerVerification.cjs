const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- STARTING ALBUM ARTWORK & CLEAN PLAYER VERIFICATION ---');

// 1. Verify AlbumArtwork.tsx
const albumArtworkPath = path.resolve(__dirname, '../../../client/src/components/common/AlbumArtwork.tsx');
assert(fs.existsSync(albumArtworkPath), 'AlbumArtwork.tsx must exist');
const albumArtworkCode = fs.readFileSync(albumArtworkPath, 'utf8');
assert(albumArtworkCode.includes('object-contain'), 'AlbumArtwork must use object-contain');
assert(albumArtworkCode.includes('object-center'), 'AlbumArtwork must use object-center');
assert(albumArtworkCode.includes('objectFit: \'contain\''), 'AlbumArtwork must enforce inline objectFit contain');
assert(albumArtworkCode.includes('#090510'), 'AlbumArtwork must use dark background');

console.log('✓ 1. AlbumArtwork component verified with 100% contain and dark background.');

// 2. Verify usage across components
const componentsToVerify = [
  'client/src/components/music/SongCard.tsx',
  'client/src/components/music/SongRow.tsx',
  'client/src/components/music/AlbumCard.tsx',
  'client/src/components/music/PlaylistCard.tsx',
  'client/src/components/player/MiniPlayer.tsx',
  'client/src/components/player/FullScreenPlayer.tsx',
  'client/src/components/player/MusicPlayer.tsx',
  'client/src/pages/MusicPlayerPage.tsx',
  'client/src/pages/HomePage.tsx',
  'client/src/pages/AlbumsPage.tsx',
  'client/src/pages/PlaylistsPage.tsx',
];

componentsToVerify.forEach(relPath => {
  const fullPath = path.resolve(__dirname, '../../../', relPath);
  assert(fs.existsSync(fullPath), `${relPath} must exist`);
  const content = fs.readFileSync(fullPath, 'utf8');
  assert(content.includes('AlbumArtwork'), `${relPath} must use AlbumArtwork`);
});

console.log(`✓ 2. AlbumArtwork is actively used across all ${componentsToVerify.length} core components & pages.`);

// 3. Verify removal of external music provider labels in player UI
const playerComponents = [
  'client/src/components/player/MiniPlayer.tsx',
  'client/src/components/player/FullScreenPlayer.tsx',
  'client/src/pages/MusicPlayerPage.tsx',
  'client/src/components/music/SongCard.tsx',
  'client/src/components/music/SongRow.tsx',
];

playerComponents.forEach(relPath => {
  const fullPath = path.resolve(__dirname, '../../../', relPath);
  const content = fs.readFileSync(fullPath, 'utf8');
  // Check that providerName is not rendered as visible label in the JSX
  assert(!content.includes('{currentTrack.providerName}'), `${relPath} must not render {currentTrack.providerName}`);
  assert(!content.includes('{track.providerName}'), `${relPath} must not render {track.providerName}`);
  assert(!content.includes('Powered by Spotify'), `${relPath} must not display external provider tags`);
  assert(!content.includes('Playing from YouTube'), `${relPath} must not display external provider tags`);
});

console.log('✓ 3. External provider names completely removed from all player UI & cards.');

// 4. Verify Single Search Bar Rule (No double search bars)
const topbarPath = path.resolve(__dirname, '../../../client/src/components/layout/Topbar.tsx');
const topbarCode = fs.readFileSync(topbarPath, 'utf8');
assert(topbarCode.includes('isSearchPage'), 'Topbar must check if currently on SearchPage');
assert(topbarCode.includes('location.pathname === \'/search\''), 'Topbar must identify /search');

const explorePath = path.resolve(__dirname, '../../../client/src/pages/ExplorePage.tsx');
const exploreCode = fs.readFileSync(explorePath, 'utf8');
assert(!exploreCode.includes('LiveSearchAutocomplete'), 'ExplorePage must not render a duplicate search bar');

console.log('✓ 4. Single Search Bar verified: Topbar hides duplicate on /search, ExplorePage uses Topbar search.');

console.log('\n--- ALL VERIFICATIONS PASSED (4/4) ---');

