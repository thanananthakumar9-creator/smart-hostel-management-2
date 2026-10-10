import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { RouterProvider, useRouter } from './context/RouterContext';
import { Sidebar } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { RoleSelectionPage } from './pages/RoleSelectionPage';
import { RoleLoginPage } from './pages/RoleLoginPage';

// Role dashboards — all preserved
import { StudentDashboard } from './pages/student/StudentDashboard';
import { StudentOutpasses } from './pages/student/StudentOutpasses';
import { StudentAttendance } from './pages/student/StudentAttendance';
import { StudentIssues } from './pages/student/StudentIssues';
import { ParentDashboard } from './pages/parent/ParentDashboard';
import { TutorDashboard } from './pages/tutor/TutorDashboard';
import { WardenDashboard } from './pages/warden/WardenDashboard';
import { SecurityDashboard } from './pages/security/SecurityDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';

// ─── Loading Spinner ─────────────────────────────────────────────────────────
const LoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-app flex flex-col items-center justify-center gap-4">
    <div className="w-10 h-10 border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    <span className="text-xs font-bold text-ink-muted uppercase tracking-widest">
      Loading Smart Hostel...
    </span>
  </div>
);

// ─── Authenticated Shell Layout ──────────────────────────────────────────────
const AppShell: React.FC<{ children: React.ReactNode; currentTab: string; onSelectTab: (t: string) => void }> = ({
  children,
  currentTab,
  onSelectTab,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-app flex flex-col md:grid md:grid-cols-[280px_minmax(0,1fr)] w-full box-border">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => { onSelectTab(tab); setSidebarOpen(false); }}
        isOpenMobile={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      {/* MainLayout */}
      <div className="flex flex-col min-w-0 w-full min-h-screen box-border">
        {/* Top Header */}
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        {/* Dashboard Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 w-full box-border">
          <div className="w-full min-w-0 page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// ─── Main Router Component ───────────────────────────────────────────────────
const MainApp: React.FC = () => {
  const { user, loading } = useAuth();
  const { currentPath, navigate } = useRouter();
  const [currentTab, setCurrentTab] = useState('dashboard');

  // Reset tab to dashboard on role-based path change
  useEffect(() => {
    setCurrentTab('dashboard');
  }, [user?.role]);

  if (loading) return <LoadingScreen />;

  // ── Public routes ──────────────────────────────────────────────────────
  if (currentPath === '/select-role' || currentPath === '/') {
    if (user) {
      navigate(user.role === 'student' ? '/student/dashboard' : user.role === 'admin' ? '/admin/dashboard' : '/teacher/dashboard');
      return null;
    }
    return <RoleSelectionPage />;
  }

  if (currentPath === '/login/student') {
    if (user) { navigate('/student/dashboard'); return null; }
    return <RoleLoginPage role="student" />;
  }
  if (currentPath === '/login/admin') {
    if (user) { navigate('/admin/dashboard'); return null; }
    return <RoleLoginPage role="admin" />;
  }
  if (currentPath === '/login/teacher') {
    if (user) { navigate('/teacher/dashboard'); return null; }
    return <RoleLoginPage role="teacher" />;
  }

  // ── Protected routes ───────────────────────────────────────────────────
  if (!user) {
    navigate('/select-role');
    return null;
  }

  const renderContent = () => {
    switch (user.role) {
      case 'student':
        if (currentTab === 'outpasses')   return <StudentOutpasses />;
        if (currentTab === 'attendance')  return <StudentAttendance />;
        if (currentTab === 'issues')      return <StudentIssues />;
        return <StudentDashboard onNavigate={setCurrentTab} />;

      case 'parent':
        return <ParentDashboard currentTab={currentTab} />;

      case 'tutor':
        return <TutorDashboard currentTab={currentTab} />;

      case 'warden':
        return <WardenDashboard currentTab={currentTab} />;

      case 'security':
        return <SecurityDashboard />;

      case 'admin':
        return <AdminDashboard currentTab={currentTab} />;

      default:
        return <div className="p-8 text-ink-muted">Unknown role</div>;
    }
  };

  return (
    <AppShell currentTab={currentTab} onSelectTab={setCurrentTab}>
      {renderContent()}
    </AppShell>
  );
};

// ─── Root App (Providers) ────────────────────────────────────────────────────
export const App: React.FC = () => (
  <RouterProvider>
    <AuthProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </AuthProvider>
  </RouterProvider>
);

export default App;
