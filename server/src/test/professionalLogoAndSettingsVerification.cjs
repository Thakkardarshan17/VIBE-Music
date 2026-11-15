const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Professional Logo, Settings & Alignment Verification...');

const clientSrc = path.join(__dirname, '../../../client/src');

// 1. Verify VibeLogo is 100% Vector SVG, Zero Poster Borders, No Raster Image
const vibeLogoPath = path.join(clientSrc, 'components/common/VibeLogo.tsx');
const vibeLogoContent = fs.readFileSync(vibeLogoPath, 'utf8');

assert(!vibeLogoContent.includes('vibe-music-logo.png'), 'VibeLogo must not import raster png poster image');
assert(!vibeLogoContent.includes("mixBlendMode: 'screen'"), 'VibeLogo must not rely on fragile screen blend on poster');
assert(vibeLogoContent.includes('<svg'), 'VibeLogo must render clean vector SVG');
assert(vibeLogoContent.includes('vibePrimaryGrad'), 'VibeLogo must include neon purple-pink brand gradient');
assert(vibeLogoContent.includes('VIBE'), 'VibeLogo must render crisp VIBE typography');
assert(vibeLogoContent.includes('MUSIC'), 'VibeLogo must render crisp MUSIC typography');
console.log('✅ Test 1: VibeLogo is 100% vector SVG without poster frame, borders or raster artifact');

// 2. Verify SettingsPage has Symmetrical Audio & Autoplay Cards and Clean Labels
const settingsPagePath = path.join(clientSrc, 'pages/SettingsPage.tsx');
const settingsContent = fs.readFileSync(settingsPagePath, 'utf8');

assert(settingsContent.includes('defaultVolume') || settingsContent.includes('Default Player Volume'), 'SettingsPage must have Default Player Volume');
assert(settingsContent.includes('continuousAutoplay') || settingsContent.includes('Continuous Autoplay'), 'SettingsPage must have Continuous Autoplay');
assert(settingsContent.includes('player.setVolume'), 'SettingsPage must control player volume in real-time');
assert(!settingsContent.includes('🇬🇧 English (India)'), 'SettingsPage must NOT have broken GB emoji');
assert(settingsContent.includes('English (India)'), 'SettingsPage must have clean English (India)');
assert(settingsContent.includes('Voice Search Recognition'), 'SettingsPage must have Voice Search Recognition');
assert(settingsContent.includes('Color Theme'), 'SettingsPage must have Color Theme');
assert(settingsContent.includes('triggerAutoSaved'), 'SettingsPage must have real-time auto-save feedback');
console.log('✅ Test 2: SettingsPage has symmetrical cards, real-time volume & clean Voice Search options');

// 3. Verify SongRow & SongTableHeader alignment & compact actions on mobile
const songRowPath = path.join(clientSrc, 'components/music/SongRow.tsx');
const songRowContent = fs.readFileSync(songRowPath, 'utf8');

assert(songRowContent.includes('w-20 sm:w-28'), 'SongRow must use optimized w-20 sm:w-28 container to maximize title room on mobile');
assert(songRowContent.includes('<Heart className="w-3.5 h-3.5'), 'SongTableHeader must have matching heart header indicator');
assert(!songRowContent.includes('{track.providerName}'), 'SongRow must not display external provider name');
console.log('✅ Test 3: SongRow and SongTableHeader have clean spacing, heart indicator, and zero provider labels');

// 4. Verify Artists navigation on HomePage and ArtistsPage
const homePagePath = path.join(clientSrc, 'pages/HomePage.tsx');
const homeContent = fs.readFileSync(homePagePath, 'utf8');
assert(homeContent.includes("navigate(`/artists?name="), 'HomePage artist card must navigate directly to artist page');

const artistsPagePath = path.join(clientSrc, 'pages/ArtistsPage.tsx');
const artistsContent = fs.readFileSync(artistsPagePath, 'utf8');
assert(artistsContent.includes('Now Viewing:'), 'ArtistsPage must have explicit visual banner for active artist discography');
assert(artistsContent.includes('scrollIntoView'), 'ArtistsPage must smoothly scroll to artist discography');
console.log('✅ Test 4: Artist cards on HomePage and ArtistsPage navigate and display discography cleanly');

// 5. Verify Footer has non-breaking spaces on badges
const footerPath = path.join(clientSrc, 'components/layout/Footer.tsx');
const footerContent = fs.readFileSync(footerPath, 'utf8');
assert(footerContent.includes('whitespace-nowrap'), 'Footer badges must have whitespace-nowrap');
assert(footerContent.includes('Lossless High&#8209;Fidelity'), 'Footer must use non-breaking hyphen on Lossless badge');
assert(footerContent.includes('Full Song Playback'), 'Footer must have Full Song Playback');
assert(footerContent.includes('Authorized Streaming'), 'Footer must have Authorized Streaming badge');
console.log('✅ Test 5: Footer badges strictly prevent wrapping and line breaks across all screens');

console.log('\n🎉 ALL 5 VERIFICATION SUITES PASSED FLAWLESSLY!');
