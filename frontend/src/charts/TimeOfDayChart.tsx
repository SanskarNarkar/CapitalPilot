import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine,
} from 'recharts';

interface TimeOfDayChartProps {
  data: Array<{ slot: string; trades: number; wins: number; win_rate?: number; total_pnl: number }>;
  height?: number;
}

export const TimeOfDayChart: React.FC<TimeOfDayChartProps> = ({
  data,
  height = 250,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-xs">
        No time-of-day data available
      </div>
    );
  }

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-[#111622] border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs font-mono">
          <div className="text-slate-400 mb-1">{item.slot}</div>
          <div className={`font-bold ${item.total_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            Total P&L: {item.total_pnl >= 0 ? '+' : ''}₹{item.total_pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-slate-300 mt-1">
            Trades: {item.trades} | Win Rate: {item.win_rate || 0}%
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <XAxis
            dataKey="slot"
            stroke="#475569"
            fontSize={10}
            tickLine={false}
          />
          <YAxis
            stroke="#475569"
            fontSize={11}
            tickLine={false}
            tickFormatter={(val) => `₹${val}`}
          />
          <Tooltip content={customTooltip} />
          <ReferenceLine y={0} stroke="#334155" />
          <Bar dataKey="total_pnl" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`slot-cell-${index}`}
                fill={entry.total_pnl >= 0 ? '#10b981' : '#f43f5e'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
