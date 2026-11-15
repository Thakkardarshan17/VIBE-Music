import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { PlayerProvider } from './context/PlayerContext.js';
import { ThemeProvider } from './context/ThemeContext.js';
import { LanguageProvider } from './context/LanguageContext.js';

// Layout & Splash
import { SplashScreen } from './components/splash/SplashScreen.js';
import { Sidebar } from './components/layout/Sidebar.js';
import { Topbar } from './components/layout/Topbar.js';
import { Footer } from './components/layout/Footer.js';
import { MobileNav } from './components/layout/MobileNav.js';
import { MiniPlayer } from './components/player/MiniPlayer.js';
import { FullScreenPlayer } from './components/player/FullScreenPlayer.js';
import { YouTubePlayerEmbed } from './components/player/YouTubePlayerEmbed.js';
import { ProtectedRoute } from './components/auth/ProtectedRoute.js';
import { LogoutConfirmModal } from './components/auth/LogoutConfirmModal.js';

// Pages
import { SplashPage } from './pages/SplashPage.js';
import { HomePage } from './pages/HomePage.js';
import { ExplorePage } from './pages/ExplorePage.js';
import { SearchPage } from './pages/SearchPage.js';
import { TrendingPage } from './pages/TrendingPage.js';
import { TopChartsPage } from './pages/TopChartsPage.js';
import { NewReleasesPage } from './pages/NewReleasesPage.js';
import { ArtistsPage } from './pages/ArtistsPage.js';
import { AlbumsPage } from './pages/AlbumsPage.js';
import { LibraryPage } from './pages/LibraryPage.js';
import { PlaylistsPage } from './pages/PlaylistsPage.js';
import { LikedSongsPage } from './pages/LikedSongsPage.js';
import { HistoryPage } from './pages/HistoryPage.js';
import { MusicPlayerPage } from './pages/MusicPlayerPage.js';
import { LoginPage } from './pages/LoginPage.js';
import { SignUpPage } from './pages/SignUpPage.js';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { AdminPage } from './pages/AdminPage.js';
import { DashboardPage } from './pages/DashboardPage.js';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/splash') return false;
    return sessionStorage.getItem('vibe_splash_shown') !== 'true';
  });

  const isAuthPage = ['/login', '/signup', '/forgot-password', '/splash'].includes(location.pathname);

  // If user is unauthenticated and viewing an auth page (Login, Signup, Forgot Password)
  if (!isAuthenticated && isAuthPage && !loading) {
    return (
      <>
        {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
        <div className="min-h-screen w-screen bg-[#090510] text-white overflow-y-auto selection:bg-[#A020F0] selection:text-white">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<Navigate to="/login" replace />} />
            <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
            <Route path="/splash" element={<SplashPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </>
    );
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* Global Logout Confirmation Modal */}
      <LogoutConfirmModal />

      <div className="flex h-screen w-screen overflow-hidden bg-[#090510] text-[#FFFFFF] font-sans antialiased">
        {/* Desktop Left Sidebar (Only for authenticated users) */}
        {isAuthenticated && <Sidebar />}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
          {/* Top Navigation Bar */}
          {isAuthenticated && <Topbar />}

          {/* Dynamic Scrollable Page Content */}
          <main className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 pt-3 sm:pt-5 pb-40 lg:pb-28">
            <div className="max-w-7xl mx-auto">
              <Routes>
                {/* Public Auth Routes (Redirect to / if already logged in) */}
                <Route
                  path="/login"
                  element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
                />
                <Route
                  path="/signup"
                  element={isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/login" replace />}
                />
                <Route
                  path="/forgot-password"
                  element={isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/login" replace />}
                />
                <Route path="/splash" element={<SplashPage />} />

                {/* Protected Music Application Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <HomePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/explore"
                  element={
                    <ProtectedRoute>
                      <ExplorePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/search"
                  element={
                    <ProtectedRoute>
                      <SearchPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/trending"
                  element={
                    <ProtectedRoute>
                      <TrendingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/charts"
                  element={
                    <ProtectedRoute>
                      <TopChartsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/new-releases"
                  element={
                    <ProtectedRoute>
                      <NewReleasesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/artists"
                  element={
                    <ProtectedRoute>
                      <ArtistsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/albums"
                  element={
                    <ProtectedRoute>
                      <AlbumsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/library"
                  element={
                    <ProtectedRoute>
                      <LibraryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/playlists"
                  element={
                    <ProtectedRoute>
                      <PlaylistsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/liked"
                  element={
                    <ProtectedRoute>
                      <LikedSongsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute>
                      <HistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/player"
                  element={
                    <ProtectedRoute>
                      <MusicPlayerPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly={true}>
                      <AdminPage />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              {/* Global Application Footer */}
              <Footer />
            </div>
          </main>

          {/* Authenticated Music Player Components */}
          {isAuthenticated && (
            <>
              {/* Mini Player Docked at Bottom */}
              <MiniPlayer />

              {/* Mobile Bottom Navigation Bar */}
              <MobileNav />

              {/* Full Screen Player Modal View */}
              <FullScreenPlayer />

              {/* Embedded Official YouTube Player Target */}
              <YouTubePlayerEmbed />
            </>
          )}
        </div>
      </div>
    </>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <PlayerProvider>
              <AppContent />
            </PlayerProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
