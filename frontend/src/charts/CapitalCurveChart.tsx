import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface CapitalCurveChartProps {
  data: Array<{ date: string; capital: number; pnl?: number }>;
  targetCapital?: number;
  startingCapital?: number;
  height?: number;
}

export const CapitalCurveChart: React.FC<CapitalCurveChartProps> = ({
  data,
  targetCapital = 135000,
  startingCapital = 15000,
  height = 280,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-xs">
        No equity curve data available
      </div>
    );
  }

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const cap = payload[0].value;
      const profit = cap - startingCapital;
      return (
        <div className="bg-[#111622] border border-slate-700 p-2.5 rounded-lg shadow-xl text-xs font-mono">
          <div className="text-slate-400 mb-1">{label}</div>
          <div className="font-bold text-sky-400">
            Equity: ₹{cap.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className={profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
            Growth: {profit >= 0 ? '+' : ''}₹{profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="capitalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
            </linearGradient>
          </defs>
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
            domain={['auto', 'auto']}
            tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
          />
          <Tooltip content={customTooltip} />
          <ReferenceLine
            y={startingCapital}
            stroke="#64748b"
            strokeDasharray="3 3"
            label={{ value: 'Start (15k)', fill: '#94a3b8', fontSize: 10, position: 'insideBottomLeft' }}
          />
          <ReferenceLine
            y={targetCapital}
            stroke="#10b981"
            strokeDasharray="4 4"
            label={{ value: 'Target (1.35L)', fill: '#34d399', fontSize: 10, position: 'insideTopLeft' }}
          />
          <Area
            type="monotone"
            dataKey="capital"
            stroke="#38bdf8"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#capitalGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
