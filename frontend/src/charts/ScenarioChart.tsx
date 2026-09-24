import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';

interface ScenarioChartProps {
  data: Array<{ day: number; conservative: number; base: number; aggressive: number }>;
  targetCapital?: number;
  height?: number;
}

export const ScenarioChart: React.FC<ScenarioChartProps> = ({
  data,
  targetCapital = 135000,
  height = 320,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-xs">
        No scenario projections calculated
      </div>
    );
  }

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111622] border border-slate-700 p-3 rounded-lg shadow-xl text-xs font-mono space-y-1">
          <div className="text-slate-400 mb-1">Trading Day: {label}</div>
          <div className="text-emerald-400">
            Aggressive: ₹{payload.find((p: any) => p.dataKey === 'aggressive')?.value?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-sky-400">
            Base Case: ₹{payload.find((p: any) => p.dataKey === 'base')?.value?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-amber-400">
            Conservative: ₹{payload.find((p: any) => p.dataKey === 'conservative')?.value?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <XAxis
            dataKey="day"
            stroke="#475569"
            fontSize={11}
            tickLine={false}
            tickFormatter={(d) => `D${d}`}
          />
          <YAxis
            stroke="#475569"
            fontSize={11}
            tickLine={false}
            tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
          />
          <Tooltip content={customTooltip} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
          <ReferenceLine
            y={targetCapital}
            stroke="#10b981"
            strokeDasharray="4 4"
            label={{ value: 'Target (₹1.35L)', fill: '#34d399', fontSize: 10, position: 'insideTopLeft' }}
          />
          <Line
            type="monotone"
            dataKey="conservative"
            name="Conservative"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="base"
            name="Base Case"
            stroke="#38bdf8"
            strokeWidth={2.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="aggressive"
            name="Aggressive"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
