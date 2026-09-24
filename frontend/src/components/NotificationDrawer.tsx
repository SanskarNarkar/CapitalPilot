import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { X, CheckCheck, Bell, AlertTriangle, RefreshCw, Trophy, BookOpen } from 'lucide-react';
import { Badge } from './Badge';

export const NotificationDrawer: React.FC = () => {
  const { notifications, isOpen, setIsOpen, markAsRead, markAllAsRead } = useNotifications();

  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'RISK':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'SYNC':
        return <RefreshCw className="w-4 h-4 text-sky-400" />;
      case 'MILESTONE':
        return <Trophy className="w-4 h-4 text-amber-400" />;
      case 'REVIEW':
        return <BookOpen className="w-4 h-4 text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#0f1420] border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-sky-400" />
              <h2 className="text-base font-bold text-slate-100">System Notifications</h2>
            </div>
            <div className="flex items-center gap-2">
              {notifications.some((n) => !n.is_read) && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-slate-400 hover:text-sky-400 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-slate-800"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-sm">
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && markAsRead(n.id)}
                  className={`p-3.5 rounded-xl border transition-all ${
                    n.is_read
                      ? 'bg-slate-900/40 border-slate-800/60 opacity-75'
                      : 'bg-[#141b2b] border-slate-700/80 cursor-pointer hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-2 rounded-lg bg-slate-800/80">
                      {getIcon(n.notification_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-200 line-clamp-1">
                          {n.title}
                        </span>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-2">
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <Badge variant="neutral" className="text-[10px]">
                          {n.notification_type}
                        </Badge>
                        <span>
                          {new Date(n.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
