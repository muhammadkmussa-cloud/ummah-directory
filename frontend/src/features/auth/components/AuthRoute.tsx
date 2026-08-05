import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface JwtPayload {
  exp: number;
  sub: string;
  [key: string]: any;
}

/**
 * Wrap a component to enforce authentication.
 * Validates token presence and expiration in localStorage.
 * If no valid token is present, redirects to /login.
 */
export default function AuthRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const currentTime = Date.now() / 1000;
    
    // Check if token is expired
    if (decoded.exp < currentTime) {
      // Token expired - clear storage and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      return <Navigate to="/login" replace />;
    }
  } catch (error) {
    console.error('Invalid token:', error);
    // Invalid token - clear storage and redirect to login
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}