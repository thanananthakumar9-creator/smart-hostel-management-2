import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from '../../context/RouterContext';
import { NotificationDropdown } from './NotificationDropdown';
import { Menu, Bell, LogOut, Search } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  // Ensure useRouter is imported to comply with specs (unused but requested)
  const _router = useRouter();

  if (!user) return null;

  const initials = user.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

  return (
    <header className="sticky top-0 z-30 bg-app px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 w-full min-w-0 box-border border-b border-ink-border/50">
      <div className="flex items-center gap-3 min-w-0 shrink-0">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-2 text-ink-muted hover:text-ink md:hidden rounded-lg hover:bg-slate-200 transition-colors shrink-0"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        
        <div className="flex flex-col justify-center min-w-0">
          <span className="text-xs text-ink-muted font-medium truncate">
            Hi, {user.name}
          </span>
          <h2 className="text-base sm:text-lg font-bold text-ink leading-tight truncate">
            Welcome back
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0 justify-end flex-1">
        {/* Search Bar */}
        <div className="hidden md:flex items-center relative flex-1 min-w-0 max-w-[280px]">
          <Search className="w-4 h-4 text-ink-muted absolute left-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-white border border-ink-border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent text-ink placeholder:text-ink-muted transition-all box-border"
          />
        </div>

        {/* Notifications */}
        <div className="shrink-0">
          <NotificationDropdown />
        </div>

        {/* User Info */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:border-l border-ink-border shrink-0">
          <div className="hidden sm:flex flex-col text-right max-w-[130px]">
            <span className="text-xs font-bold text-ink leading-tight truncate">
              {user.name}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border bg-primary-50 text-primary-600 border-primary-100 self-end mt-0.5">
              {user.role}
            </span>
          </div>

          <div className="w-8 h-8 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs shrink-0">
            {initials}
          </div>

          <button
            onClick={logout}
            title="Sign Out"
            className="p-1.5 sm:p-2 text-ink-muted hover:text-rose-600 hover:bg-rose-50 rounded-xl transition duration-150 shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
