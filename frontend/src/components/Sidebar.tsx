import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  CalendarCheck,
  BookOpen,
  ShieldAlert,
  Sliders,
  BarChart3,
  TrendingUp,
  Globe,
  Newspaper,
  Brain,
  Cpu,
} from 'lucide-react';

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const navItems: SidebarItem[] = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { name: 'Challenge', path: '/challenge', icon: <Target className="w-4 h-4 text-amber-400" />, badge: '1.35L' },
    { name: 'Trading Plan', path: '/trading-plan', icon: <CalendarCheck className="w-4 h-4" /> },
    { name: 'Trade Journal', path: '/trades', icon: <BookOpen className="w-4 h-4" /> },
    { name: 'Risk & Firewall', path: '/risk', icon: <ShieldAlert className="w-4 h-4 text-rose-400" />, badge: '9 Rules' },
    { name: 'Setup Library', path: '/setups', icon: <Sliders className="w-4 h-4" /> },
    { name: 'Analytics', path: '/analytics', icon: <BarChart3 className="w-4 h-4 text-emerald-400" /> },
    { name: 'Scenarios & MC', path: '/scenarios', icon: <TrendingUp className="w-4 h-4 text-sky-400" /> },
    { name: 'Market Context', path: '/market', icon: <Globe className="w-4 h-4" /> },
    { name: 'News Terminal', path: '/news', icon: <Newspaper className="w-4 h-4" /> },
    { name: 'AI Coach', path: '/coach', icon: <Brain className="w-4 h-4 text-purple-400" /> },
    { name: 'Dhan Integration', path: '/dhan', icon: <Cpu className="w-4 h-4 text-cyan-400" /> },
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-[#0d121c] flex flex-col shrink-0 h-[calc(100vh-4rem)] sticky top-16 select-none">
      <div className="p-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider px-4">
        Trading Console
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span>{item.name}</span>
            </div>
            {item.badge && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono font-medium">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
        <span>CapitalPilot v1.0</span>
        <span className="flex items-center gap-1 text-emerald-400 font-mono text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ONLINE
        </span>
      </div>
    </aside>
  );
};
