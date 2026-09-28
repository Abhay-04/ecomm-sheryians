import { LogOut, Menu, Package, UserRound } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router';
import BrandMark from '@/components/BrandMark';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

function navLinkClassName({ isActive }) {
  return cn(
    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
    isActive ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link to="/products" aria-label="Store home">
            <BrandMark />
          </Link>
          <nav className="hidden sm:block" aria-label="Main">
            <NavLink to="/products" className={navLinkClassName}>
              Products
            </NavLink>
          </nav>
        </div>

        <div className="hidden items-center gap-1 sm:flex">
          <NavLink to="/profile" className={navLinkClassName}>
            <span className="flex items-center gap-2">
              <UserRound className="size-4" />
              Profile
            </span>
          </NavLink>
          <Button variant="ghost" size="lg" onClick={logout} className="text-muted-foreground">
            <LogOut />
            Logout
          </Button>
        </div>

        <div className="sm:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-lg" aria-label="Open menu">
                <Menu />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm font-medium text-foreground">{user?.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="py-2" onSelect={() => navigate('/products')}>
                <Package />
                Products
              </DropdownMenuItem>
              <DropdownMenuItem className="py-2" onSelect={() => navigate('/profile')}>
                <UserRound />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="py-2" onSelect={logout}>
                <LogOut />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
