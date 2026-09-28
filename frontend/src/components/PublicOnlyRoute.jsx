import { Navigate, Outlet } from 'react-router';
import { FullPageLoader } from '@/components/LoadingState';
import { useAuth } from '@/context/AuthContext';

// Login and register pages: a signed-in user is sent straight to the app.
export default function PublicOnlyRoute() {
  const { user, isRestoringSession } = useAuth();

  if (isRestoringSession) {
    return <FullPageLoader />;
  }

  if (user) {
    return <Navigate to="/products" replace />;
  }

  return <Outlet />;
}
