import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  authApi,
  refreshSession,
  setAccessToken,
  setSessionExpiredHandler,
} from '@/services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  useEffect(() => {
    // Called by the API layer when a refresh fails mid-session. The toast id
    // prevents duplicates when several requests fail at the same time.
    setSessionExpiredHandler(() => {
      setUser(null);
      toast.error('Your session has expired. Please sign in again.', {
        id: 'session-expired',
      });
    });

    // On page load, try to restore the session from the refresh token cookie.
    refreshSession()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setIsRestoringSession(false));
  }, []);

  async function login(credentials) {
    const response = await authApi.login(credentials);
    setAccessToken(response.data.accessToken);
    setUser(response.data.user);
  }

  async function register(details) {
    await authApi.register(details);
  }

  // Clearing `user` makes ProtectedRoute redirect to /login, so callers don't
  // need to navigate. Local state is cleared even if the request fails.
  async function logout() {
    try {
      await authApi.logout();
      toast.success('You have been logged out');
    } catch {
      toast.error('Could not reach the server, but you have been signed out on this device.');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }

  const value = { user, isRestoringSession, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
