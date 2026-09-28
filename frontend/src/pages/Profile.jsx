import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import ErrorState from '@/components/ErrorState';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { authApi, getErrorMessage } from '@/services/api';

function InfoRow({ label, children }) {
  return (
    <div className="grid gap-1 px-5 py-4 sm:grid-cols-[160px_1fr] sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm font-medium break-words">{children}</dd>
    </div>
  );
}

export default function Profile() {
  const { logout } = useAuth();
  const [user, setUser] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [reloadCount, setReloadCount] = useState(0);

  // Fetches fresh details from GET /api/auth/me rather than reusing cached state.
  useEffect(() => {
    let isCurrent = true;

    authApi
      .getCurrentUser()
      .then((response) => {
        if (isCurrent) setUser(response.data.user);
      })
      .catch((error) => {
        if (isCurrent) setLoadError(getErrorMessage(error));
      });

    return () => {
      isCurrent = false;
    };
  }, [reloadCount]);

  function handleRetry() {
    setLoadError('');
    setReloadCount((count) => count + 1);
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Profile" description="Your account information." />

      {loadError ? (
        <ErrorState description={loadError} onRetry={handleRetry} />
      ) : (
        <Card className="gap-0 rounded-lg py-0 ring-border">
          <CardHeader className="border-b px-5 py-3.5">
            <CardTitle className="text-sm">
              <h2>Account details</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <dl className="divide-y">
              <InfoRow label="Name">
                {user ? user.name : <Skeleton className="h-4 w-32" />}
              </InfoRow>
              <InfoRow label="Email">
                {user ? user.email : <Skeleton className="h-4 w-48" />}
              </InfoRow>
            </dl>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6 flex-col gap-4 rounded-lg px-5 py-4 ring-border sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-medium">Sign out</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">End your session on this device.</p>
        </div>
        <Button variant="outline" size="lg" onClick={logout}>
          <LogOut />
          Logout
        </Button>
      </Card>
    </div>
  );
}
