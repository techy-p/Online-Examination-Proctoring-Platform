import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, ClipboardList, Shield, BarChart3, LogOut,
  Settings, Menu, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './brand/Logo';

const navItems = {
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/exams', label: 'Exams', icon: ClipboardList },
    { to: '/question-banks', label: 'Question Banks', icon: BookOpen },
    { to: '/proctor', label: 'Proctor', icon: Shield },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  ],
  instructor: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/exams', label: 'Exams', icon: ClipboardList },
    { to: '/question-banks', label: 'Question Banks', icon: BookOpen },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  ],
  student: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/exams', label: 'My Exams', icon: ClipboardList },
    { to: '/results', label: 'My Results', icon: BarChart3 },
  ],
  proctor: [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/proctor', label: 'Live Proctoring', icon: Shield },
  ],
};

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const items = navItems[user?.role || 'student'] || navItems.student;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <div className="px-5 py-6 border-b border-white/10">
        <Logo size="sm" theme="light" />
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <p className="px-3 mb-3 text-[10px] uppercase tracking-[0.18em] text-white/40">Workspace</p>
        {items.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                active ? 'bg-white text-brand-950' : 'text-white/65 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <Icon className="w-[18px] h-[18px]" />
              {label}
            </Link>
          );
        })}
        <Link
          to="/settings"
          onClick={onNavigate}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
            location.pathname === '/settings' ? 'bg-white text-brand-950' : 'text-white/65 hover:bg-white/[0.06] hover:text-white'
          }`}
        >
          <Settings className="w-[18px] h-[18px]" />
          Settings
        </Link>
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
          <div className="w-8 h-8 rounded-full border border-[#b69358]/60 bg-white/5 flex items-center justify-center text-xs font-semibold text-[#e1c995]">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName}</p>
            <p className="text-[11px] text-white/45 capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-white/55 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Sign out
        </button>
      </div>
    </>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#f4f3ef]">
      <aside className="hidden lg:flex w-64 bg-brand-950 text-white flex-col fixed h-full z-30">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-brand-950 text-white flex flex-col h-full animate-slide-in-left">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 p-2 text-white/60">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 lg:ml-64">
        <header className="lg:hidden sticky top-0 z-20 bg-[#f4f3ef]/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <Logo size="sm" />
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-slate-100">
            <Menu className="w-5 h-5" />
          </button>
        </header>
        <main className="p-4 sm:p-8 xl:p-10 max-w-[1440px] mx-auto">{children}</main>
      </div>
    </div>
  );
}
