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

interface DailyPnLChartProps {
  data: Array<{ date: string; pnl: number; trades?: number }>;
  height?: number;
}

export const DailyPnLChart: React.FC<DailyPnLChartProps> = ({
  data,
  height = 250,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-xs">
        No daily P&L records
      </div>
    );
  }

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const pnl = payload[0].value;
      const trades = payload[0].payload.trades;
      return (
        <div className="bg-[#111622] border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs font-mono">
          <div className="text-slate-400 mb-1">{label}</div>
          <div className={`font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            Net P&L: {pnl >= 0 ? '+' : ''}₹{pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          {trades !== undefined && (
            <div className="text-slate-400 mt-0.5">
              Trades Taken: {trades}
            </div>
          )}
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
            dataKey="date"
            stroke="#475569"
            fontSize={11}
            tickLine={false}
            tickFormatter={(d) => d.slice(5)}
          />
          <YAxis
            stroke="#475569"
            fontSize={11}
            tickLine={false}
            tickFormatter={(val) => `₹${val}`}
          />
          <Tooltip content={customTooltip} />
          <ReferenceLine y={0} stroke="#334155" />
          <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
