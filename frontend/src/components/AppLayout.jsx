import { Outlet } from 'react-router';
import Navbar from '@/components/Navbar';

export default function AppLayout() {
  return (
    <div className="min-h-svh">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}
