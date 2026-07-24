import { Navigate } from 'react-router-dom';

/**
 * Wrap a component to enforce authentication.
 * If no access_token is present in localStorage, redirects cleanly to /login.
 */
export default function AuthRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}