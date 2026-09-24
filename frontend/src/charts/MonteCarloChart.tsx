import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface MonteCarloChartProps {
  samplePaths: number[][];
  targetCapital?: number;
  height?: number;
}

export const MonteCarloChart: React.FC<MonteCarloChartProps> = ({
  samplePaths,
  targetCapital = 135000,
  height = 320,
}) => {
  if (!samplePaths || samplePaths.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-xs">
        No simulation runs available
      </div>
    );
  }

  // Transform matrix into array of objects for Recharts: [{ trade: 0, path0: ..., path1: ... }, ...]
  const numTrades = samplePaths[0].length;
  const chartData = [];

  for (let i = 0; i < numTrades; i++) {
    const point: any = { trade: i };
    samplePaths.forEach((path, idx) => {
      point[`path_${idx}`] = path[i];
    });
    chartData.push(point);
  }

  const pathColors = [
    '#38bdf8', '#34d399', '#f472b6', '#fbbf24', '#a78bfa',
    '#60a5fa', '#4ade80', '#f87171', '#fb923c', '#c084fc'
  ];

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <XAxis
            dataKey="trade"
            stroke="#475569"
            fontSize={11}
            tickLine={false}
            tickFormatter={(t) => `T${t}`}
          />
          <YAxis
            stroke="#475569"
            fontSize={11}
            tickLine={false}
            tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`}
            labelFormatter={(label) => `Trade #${label}`}
            contentStyle={{ backgroundColor: '#111622', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }}
          />
          <ReferenceLine
            y={targetCapital}
            stroke="#10b981"
            strokeDasharray="4 4"
            label={{ value: 'Target (₹1.35L)', fill: '#34d399', fontSize: 10, position: 'insideTopLeft' }}
          />
          {samplePaths.map((_, idx) => (
            <Line
              key={`path-${idx}`}
              type="monotone"
              dataKey={`path_${idx}`}
              stroke={pathColors[idx % pathColors.length]}
              strokeWidth={1.5}
              strokeOpacity={0.65}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
