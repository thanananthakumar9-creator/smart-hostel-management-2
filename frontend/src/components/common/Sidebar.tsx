import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileCheck2,
  MapPin,
  AlertTriangle,
  Users,
  ShieldCheck,
  Building,
  FileSpreadsheet,
  History,
  Settings2,
  Bell,
  X,
  Building2,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();
  if (!user) return null;

  interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }

  const getNavItems = (): NavItem[] => {
    switch (user.role) {
      case 'student':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'attendance', label: 'Attendance', icon: MapPin },
          { id: 'outpasses', label: 'Out-Pass', icon: FileCheck2 },
          { id: 'issues', label: 'My Issues', icon: AlertTriangle },
          { id: 'notifications', label: 'Notifications', icon: Bell },
        ];
      case 'parent':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'outpasses', label: 'Out-Pass Requests', icon: FileCheck2 },
          { id: 'attendance', label: 'Student Attendance', icon: MapPin },
        ];
      case 'tutor':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'outpasses', label: 'Out-Pass Requests', icon: FileCheck2 },
          { id: 'attendance', label: 'Attendance', icon: MapPin },
        ];
      case 'warden':
        return [
          { id: 'dashboard', label: 'Hostel Dashboard', icon: LayoutDashboard },
          { id: 'students', label: 'Hostel Students', icon: Users },
          { id: 'outpasses', label: 'Out-Pass Approvals', icon: FileCheck2 },
          { id: 'attendance', label: 'Attendance Monitor', icon: MapPin },
          { id: 'issues', label: 'Complaints / Issues', icon: AlertTriangle },
          { id: 'geofence', label: 'Geofence Settings', icon: Settings2 },
        ];
      case 'security':
        return [
          { id: 'scanner', label: 'QR Scanner & Verify', icon: ShieldCheck },
        ];
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'users', label: 'Users', icon: Users },
          { id: 'hostels', label: 'Hostels & Rooms', icon: Building },
          { id: 'outpasses', label: 'Out-Pass', icon: FileCheck2 },
          { id: 'attendance', label: 'Attendance', icon: MapPin },
          { id: 'issues', label: 'Issues', icon: AlertTriangle },
          { id: 'audit-logs', label: 'Audit Logs', icon: History },
          { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const initials = user.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'U';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-[280px] bg-white border-r border-ink-border z-40 md:z-20 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 box-border ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo Area */}
          <div className="flex items-center space-x-3 px-6 py-5 shrink-0 border-b border-ink-border">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-primary-500/20 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-ink text-base leading-tight tracking-tight truncate">
                Smart Hostel
              </h1>
              <span className="text-[10px] text-ink-muted font-medium block truncate">
                Management System
              </span>
            </div>
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-ink-muted hover:text-ink md:hidden ml-auto shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full relative flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-ink-muted hover:bg-slate-50 hover:text-ink'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1 bottom-1 w-1 bg-primary-600 rounded-r-full" />
                  )}
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-primary-600' : 'text-ink-muted'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom Profile */}
          <div className="p-4 border-t border-ink-border bg-white shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm shrink-0">
                {initials}
              </div>
              <div className="flex flex-col flex-1 min-w-0 text-left">
                <span className="text-sm font-bold text-ink truncate">
                  {user.name}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-ink-muted truncate">
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                title="Sign Out"
                className="p-2 text-ink-muted hover:text-rose-600 hover:bg-rose-50 rounded-xl transition duration-150 shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
