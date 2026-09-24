import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { dhanApi, challengeApi } from '../services/api';
import { RefreshCw, Bell, Shield, LogOut, User as UserIcon, Activity } from 'lucide-react';
import { Badge } from './Badge';

export const Navbar: React.FC<{ onToggleSidebar?: () => void }> = () => {
  const { user, logout } = useAuth();
  const { unreadCount, setIsOpen } = useNotifications();
  const [isSyncing, setIsSyncing] = useState(false);
  const [dhanMode, setDhanMode] = useState<string>('DEMO');
  const [capital, setCapital] = useState<number>(15000);
  const [todayPnl, setTodayPnl] = useState<number>(0);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const fetchStatusAndSummary = async () => {
    try {
      const [statusRes, summaryRes] = await Promise.all([
        dhanApi.getStatus(),
        challengeApi.getSummary(),
      ]);
      setDhanMode(statusRes.data.mode || 'DEMO');
      setCapital(summaryRes.data.current_capital || 15000);
      setTodayPnl(summaryRes.data.today_pnl || 0);
    } catch (err) {
      // fallback
    }
  };

  useEffect(() => {
    fetchStatusAndSummary();
    const interval = setInterval(fetchStatusAndSummary, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await dhanApi.syncTrades();
      setSyncMessage(`Synced ${res.data.synced_count} trades (${res.data.mode})`);
      await fetchStatusAndSummary();
      setTimeout(() => setSyncMessage(null), 4000);
    } catch (err: any) {
      setSyncMessage('Sync failed');
      setTimeout(() => setSyncMessage(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0d121c]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Brand & Mode */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-sky-900/30">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white font-mono">
                CAPITAL<span className="text-sky-400">PILOT</span>
              </span>
              <Badge variant={dhanMode === 'LIVE' ? 'profit' : 'demo'}>
                {dhanMode === 'LIVE' ? 'LIVE DHAN' : 'DEMO MODE'}
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Personal Trading Operating System
            </p>
          </div>
        </div>
      </div>

      {/* Middle: Live Terminal Metrics */}
      <div className="hidden lg:flex items-center gap-4 bg-slate-900/60 border border-slate-800/80 rounded-lg px-4 py-1.5 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Capital:</span>
          <span className="font-bold text-slate-100">
            ₹{capital.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="w-px h-3.5 bg-slate-700" />
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Today P&L:</span>
          <span
            className={`font-bold ${
              todayPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {todayPnl >= 0 ? '+' : ''}₹{todayPnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="w-px h-3.5 bg-slate-700" />
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400">Firewall:</span>
          <span className="text-emerald-400 font-semibold">ACTIVE</span>
        </div>
      </div>

      {/* Right: Quick actions & profile */}
      <div className="flex items-center gap-2.5">
        {syncMessage && (
          <span className="text-xs text-sky-400 font-mono hidden md:inline-block animate-pulse">
            {syncMessage}
          </span>
        )}

        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-all disabled:opacity-50"
          title="Synchronize trades with DhanHQ"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Sync Dhan</span>
        </button>

        <button
          onClick={() => setIsOpen(true)}
          className="relative p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <div className="h-6 w-px bg-slate-800 mx-1" />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">
            {user?.username?.[0]?.toUpperCase() || 'T'}
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
