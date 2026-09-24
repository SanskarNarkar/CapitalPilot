import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'profit' | 'loss' | 'warning' | 'accent';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = 'default',
  onClick,
}) => {
  const borderVariants = {
    default: 'border-slate-800/80 bg-[#111622]/90 hover:border-slate-700',
    profit: 'border-emerald-500/20 bg-emerald-950/10 hover:border-emerald-500/40',
    loss: 'border-rose-500/20 bg-rose-950/10 hover:border-rose-500/40',
    warning: 'border-amber-500/20 bg-amber-950/10 hover:border-amber-500/40',
    accent: 'border-sky-500/20 bg-sky-950/10 hover:border-sky-500/40',
  };

  const valueVariants = {
    default: 'text-slate-100',
    profit: 'text-emerald-400',
    loss: 'text-rose-400',
    warning: 'text-amber-400',
    accent: 'text-sky-400',
  };

  return (
    <div
      onClick={onClick}
      className={`relative p-5 rounded-xl border transition-all duration-200 backdrop-blur-sm ${
        borderVariants[variant]
      } ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>

      <div className="flex items-baseline gap-2">
        <div className={`text-2xl font-bold font-mono tracking-tight ${valueVariants[variant]}`}>
          {value}
        </div>
        {trendValue && (
          <span
            className={`text-xs font-semibold font-mono ${
              trend === 'up'
                ? 'text-emerald-400'
                : trend === 'down'
                ? 'text-rose-400'
                : 'text-slate-400'
            }`}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '•'} {trendValue}
          </span>
        )}
      </div>

      {subtitle && (
        <div className="mt-1.5 text-xs text-slate-400 font-medium">
          {subtitle}
        </div>
      )}
    </div>
  );
};
