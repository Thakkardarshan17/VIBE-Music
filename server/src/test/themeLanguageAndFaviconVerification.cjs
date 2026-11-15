const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Theme, Language & Favicon Verification...');

const clientSrc = path.join(__dirname, '../../../client/src');
const clientPublic = path.join(__dirname, '../../../client/public');
const clientRoot = path.join(__dirname, '../../../client');

// 1. Verify Favicon in index.html and public assets
const indexHtmlPath = path.join(clientRoot, 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
assert(indexHtml.includes('rel="icon" type="image/svg+xml" href="/favicon.svg"'), 'index.html must reference /favicon.svg for crisp vector tab icon');
assert(indexHtml.includes('href="/favicon.png"'), 'index.html must reference /favicon.png');

const faviconSvgPath = path.join(clientPublic, 'favicon.svg');
assert(fs.existsSync(faviconSvgPath), 'favicon.svg must exist in public folder');
const faviconSvg = fs.readFileSync(faviconSvgPath, 'utf8');
assert(faviconSvg.includes('favGrad'), 'favicon.svg must have neon brand gradient');
assert(!faviconSvg.includes('vibe-music-logo.png'), 'favicon.svg must not reference raster poster');

const faviconPngPath = path.join(clientPublic, 'favicon.png');
assert(fs.existsSync(faviconPngPath), 'favicon.png must exist');
const pngStats = fs.statSync(faviconPngPath);
assert(pngStats.size < 200000, `favicon.png must be a clean icon, not 627KB poster (actual size: ${pngStats.size} bytes)`);
console.log('✅ Test 1: High-res vector favicon.svg and clean favicon.png configured in index.html (no poster box in browser tab)');

// 2. Verify Theme System
const themeContextPath = path.join(clientSrc, 'context/ThemeContext.tsx');
assert(fs.existsSync(themeContextPath), 'ThemeContext.tsx must exist');
const themeContextCode = fs.readFileSync(themeContextPath, 'utf8');
assert(themeContextCode.includes('document.documentElement.setAttribute(\'data-theme\''), 'ThemeContext must set data-theme attribute on root element');
assert(themeContextCode.includes('localStorage.setItem(\'vibe_theme\''), 'ThemeContext must persist theme in localStorage');

const indexCssPath = path.join(clientSrc, 'index.css');
const indexCss = fs.readFileSync(indexCssPath, 'utf8');
assert(indexCss.includes('[data-theme="midnight"]'), 'index.css must have Midnight theme overrides');
assert(indexCss.includes('[data-theme="cyber"]'), 'index.css must have Cyberpunk theme overrides');
assert(indexCss.includes('[data-theme="emerald"]'), 'index.css must have Emerald theme overrides');
console.log('✅ Test 2: Multi-theme engine (Purple Dark, Midnight Obsidian, Cyberpunk Neon, Emerald Sonic) with live CSS overrides');

// 3. Verify Language & I18N System
const langContextPath = path.join(clientSrc, 'context/LanguageContext.tsx');
assert(fs.existsSync(langContextPath), 'LanguageContext.tsx must exist');
const langContextCode = fs.readFileSync(langContextPath, 'utf8');
assert(langContextCode.includes('home:'), 'translations must include home');
assert(langContextCode.includes('hi: \'होम\'') || langContextCode.includes("hi: 'होम'"), 'Hindi translation for home must exist');
assert(langContextCode.includes('gu: \'ઘર\'') || langContextCode.includes("gu: 'ઘર'"), 'Gujarati translation for home must exist');

const sidebarPath = path.join(clientSrc, 'components/layout/Sidebar.tsx');
const sidebarCode = fs.readFileSync(sidebarPath, 'utf8');
assert(sidebarCode.includes("t('home')"), 'Sidebar must use t("home")');
assert(sidebarCode.includes("t('explore')"), 'Sidebar must use t("explore")');
assert(sidebarCode.includes("t('search')"), 'Sidebar must use t("search")');
assert(sidebarCode.includes("t('library')"), 'Sidebar must use t("library")');
assert(sidebarCode.includes("t('settings')"), 'Sidebar must use t("settings")');

const mobileNavPath = path.join(clientSrc, 'components/layout/MobileNav.tsx');
const mobileNavCode = fs.readFileSync(mobileNavPath, 'utf8');
assert(mobileNavCode.includes("t('home')"), 'MobileNav must use t("home")');
assert(mobileNavCode.includes("t('search')"), 'MobileNav must use t("search")');

const settingsPath = path.join(clientSrc, 'pages/SettingsPage.tsx');
const settingsCode = fs.readFileSync(settingsPath, 'utf8');
assert(settingsCode.includes('useTheme()'), 'SettingsPage must use useTheme()');
assert(settingsCode.includes('useTranslation()'), 'SettingsPage must use useTranslation()');
assert(settingsCode.includes('setTheme(val as ThemeName)'), 'SettingsPage must apply theme in real time');
assert(settingsCode.includes('setLanguage(val as SupportedLanguage)'), 'SettingsPage must apply language in real time');
console.log('✅ Test 3: Real-time Language & Translation engine wired to Sidebar, MobileNav & Settings');

console.log('\n🎉 ALL THEME, LANGUAGE & FAVICON VERIFICATIONS PASSED (3/3)!');

