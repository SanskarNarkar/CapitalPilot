import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'profit' | 'loss' | 'warning' | 'info' | 'neutral' | 'demo';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
}) => {
  const variantStyles = {
    profit: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    loss: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    info: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    neutral: 'bg-slate-800 text-slate-300 border border-slate-700',
    demo: 'bg-amber-950/40 text-amber-300 border border-amber-500/40 font-semibold tracking-wider',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
