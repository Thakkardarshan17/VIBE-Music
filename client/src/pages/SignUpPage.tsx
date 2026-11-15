import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * VIBE operates on a strict Google-only authentication system.
 * Any legacy signup route automatically redirects to /login.
 */
export const SignUpPage: React.FC = () => {
  return <Navigate to="/login" replace />;
};

export default SignUpPage;
