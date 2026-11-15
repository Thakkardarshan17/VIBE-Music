import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { VibeLogo } from '../common/VibeLogo.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#090510] text-white">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <VibeLogo size="lg" glow={true} />
          <div className="flex items-center gap-2 mt-4 text-[#B7A6C8] text-sm font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A020F0] animate-ping" />
            Verifying your VIBE session...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated user to /login, preserving target URL for post-login redirection
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

