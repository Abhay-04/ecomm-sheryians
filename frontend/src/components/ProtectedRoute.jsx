import { Navigate, Outlet, useLocation } from 'react-router';
import { FullPageLoader } from '@/components/LoadingState';
import { useAuth } from '@/context/AuthContext';

// Wraps routes that need a signed-in user. Remembers where the user was going
// so the login page can send them back there afterwards.
export default function ProtectedRoute() {
  const { user, isRestoringSession } = useAuth();
  const location = useLocation();

  if (isRestoringSession) {
    return <FullPageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
