import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * VIBE operates on a strict Google-only authentication system.
 * Password recovery is not applicable; redirect to /login.
 */
export const ForgotPasswordPage: React.FC = () => {
  return <Navigate to="/login" replace />;
};

export default ForgotPasswordPage;
