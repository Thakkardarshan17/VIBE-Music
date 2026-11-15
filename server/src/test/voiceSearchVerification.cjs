const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- STARTING VOICE SEARCH & UI VERIFICATION ---');

// 1. Verify VoiceSearchModal source
const voiceModalPath = path.resolve(__dirname, '../../../client/src/components/search/VoiceSearchModal.tsx');
assert(fs.existsSync(voiceModalPath), 'VoiceSearchModal.tsx must exist');
const voiceModalCode = fs.readFileSync(voiceModalPath, 'utf8');

// Check Web Speech API integration
assert(voiceModalCode.includes('SpeechRecognition'), 'Must integrate SpeechRecognition');
assert(voiceModalCode.includes('webkitSpeechRecognition'), 'Must integrate webkitSpeechRecognition fallback');
assert(voiceModalCode.includes('interimResults = true'), 'Must enable interim results for real-time speech conversion');
assert(voiceModalCode.includes('continuous = false'), 'Must disable continuous listening for normal search');

// Check languages: English, Hindi, Gujarati
assert(voiceModalCode.includes('en-IN'), 'Must support English (India)');
assert(voiceModalCode.includes('hi-IN'), 'Must support Hindi');
assert(voiceModalCode.includes('gu-IN'), 'Must support Gujarati');
assert(voiceModalCode.includes('ગુજરાતી'), 'Must have Gujarati native text');
assert(voiceModalCode.includes('हिंदी'), 'Must have Hindi native text');

// Check Voice commands support
assert(voiceModalCode.includes('nextTrack'), 'Must support next track command');
assert(voiceModalCode.includes('prevTrack'), 'Must support previous track command');
assert(voiceModalCode.includes('pause'), 'Must support pause command');
assert(voiceModalCode.includes('resume'), 'Must support resume command');
assert(voiceModalCode.includes('/playlists'), 'Must support playlists navigation command');
assert(voiceModalCode.includes('cleanVoiceQuery'), 'Must have voice query normalizer');

// Check UI statuses
assert(voiceModalCode.includes('Listening...'), 'Must have Listening status');
assert(voiceModalCode.includes('Recognizing your voice...'), 'Must have Recognizing status');
assert(voiceModalCode.includes('Searching music...'), 'Must have Searching status');
assert(voiceModalCode.includes('Microphone permission denied'), 'Must handle permission denied');
assert(voiceModalCode.includes('No voice detected'), 'Must handle no voice detected');
assert(voiceModalCode.includes('voice-wave-ring'), 'Must have soundwave ring animations');

console.log('✓ 1. VoiceSearchModal Web Speech API & commands verified.');

// 2. Verify LiveSearchAutocomplete integration
const liveSearchPath = path.resolve(__dirname, '../../../client/src/components/search/LiveSearchAutocomplete.tsx');
const liveSearchCode = fs.readFileSync(liveSearchPath, 'utf8');

assert(liveSearchCode.includes('VoiceSearchModal'), 'LiveSearchAutocomplete must import and render VoiceSearchModal');
assert(liveSearchCode.includes('isVoiceOpen'), 'Must track isVoiceOpen state');
assert(liveSearchCode.includes('Mic'), 'Must render Mic icon');
assert(liveSearchCode.includes('bg-gradient-to-tr from-[#A020F0] to-[#E51D87]'), 'Mic button must have neon purple-pink gradient styling');
assert(liveSearchCode.includes('pr-20 sm:pr-24'), 'Search input must have generous right padding to prevent button overlap');

console.log('✓ 2. LiveSearchAutocomplete search bar integration verified.');

// 3. Verify CSS Animations
const cssPath = path.resolve(__dirname, '../../../client/src/index.css');
const cssCode = fs.readFileSync(cssPath, 'utf8');
assert(cssCode.includes('voice-wave-ring'), 'index.css must include .voice-wave-ring');
assert(cssCode.includes('voicePulseRing'), 'index.css must include @keyframes voicePulseRing');

console.log('✓ 3. Voice search wave animation styles verified.');

// 4. Verify Settings Page language selector
const settingsPath = path.resolve(__dirname, '../../../client/src/pages/SettingsPage.tsx');
const settingsCode = fs.readFileSync(settingsPath, 'utf8');
assert(settingsCode.includes('vibe_voice_lang'), 'Settings page must persist voice search language preference');
assert(settingsCode.includes('Voice Search Recognition'), 'Settings page must have voice search selector');

console.log('✓ 4. Settings Page voice search language preference verified.');

// 5. Verify Footer badge row alignment (User request: "propper ek line me aana chahiye line text break nahi hona chahiye")
const footerPath = path.resolve(__dirname, '../../../client/src/components/layout/Footer.tsx');
const footerCode = fs.readFileSync(footerPath, 'utf8');
assert(footerCode.includes('whitespace-nowrap'), 'Footer badges must have whitespace-nowrap to prevent text wrapping');
assert(footerCode.includes('High&#8209;Fidelity'), 'Footer must use non-breaking hyphen to avoid line splitting');
assert(footerCode.includes('Full Song Playback'), 'Must render Full Song Playback');
assert(footerCode.includes('Authorized Streaming'), 'Must render Authorized Streaming');

console.log('✓ 5. Footer single-line alignment without text breaking verified.');

console.log('\n--- ALL VOICE SEARCH & ALIGNMENT VERIFICATIONS PASSED SUCCESSFULLY (5/5) ---');

