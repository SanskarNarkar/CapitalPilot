import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../services/api';
import { AnalyticsData } from '../types';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { CapitalCurveChart } from '../charts/CapitalCurveChart';
import { DailyPnLChart } from '../charts/DailyPnLChart';
import { TimeOfDayChart } from '../charts/TimeOfDayChart';
import { BarChart3, TrendingUp, Brain, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi
      .getDashboard()
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const summary = data?.summary;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-950/20 via-slate-900/60 to-slate-900/40 border border-emerald-500/20">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white font-mono">
              Quantitative Analytics & Psychology Diagnostics
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Empirical mathematical metrics, session time-of-day heatmaps, and psychological costs
            </p>
          </div>
        </div>
      </div>

      {/* Row 1: Core Mathematical Formulas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5 font-mono">
        <StatCard
          title="Win Rate"
          value={`${summary?.win_rate || 0}%`}
          subtitle={`${summary?.winning_trades || 0}W / ${summary?.losing_trades || 0}L`}
          variant="profit"
        />
        <StatCard
          title="Profit Factor"
          value={`${summary?.profit_factor || 0}`}
          subtitle="Gross profit / Gross loss"
          variant="accent"
        />
        <StatCard
          title="Expectancy"
          value={`₹${summary?.expectancy || 0}`}
          subtitle="Per trade expected value"
          variant={(summary?.expectancy || 0) >= 0 ? 'profit' : 'loss'}
        />
        <StatCard
          title="Average Winner"
          value={`₹${summary?.avg_win || 0}`}
          subtitle="Mean profit on wins"
          variant="profit"
        />
        <StatCard
          title="Average Loser"
          value={`₹${summary?.avg_loss || 0}`}
          subtitle="Mean loss on failures"
          variant="loss"
        />
        <StatCard
          title="Average R:R"
          value={`${summary?.avg_rr_ratio || 0}:1`}
          subtitle="Realized risk / reward"
          variant="default"
        />
      </div>

      {/* Row 2: Charts Grid (Capital Curve & Cumulative P&L) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Equity Curve (₹15,000 → Target)
            </h2>
            <Badge variant="profit">CAPITAL TRAJECTORY</Badge>
          </div>
          <CapitalCurveChart data={data?.capital_curve || []} height={240} />
        </div>

        <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Cumulative Net P&L Trajectory
            </h2>
            <Badge variant="info">NET AFTER BROKERAGE</Badge>
          </div>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={data?.cumulative_pnl || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="date" stroke="#475569" fontSize={11} tickLine={false} tickFormatter={(d) => d.slice(5)} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(val: any) => `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
                  contentStyle={{ backgroundColor: '#111622', borderColor: '#334155', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Line type="monotone" dataKey="cumulative_pnl" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Daily P&L and Time of Day Session Heat */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Daily Session P&L Distribution
          </h2>
          <DailyPnLChart data={data?.daily_pnl || []} height={240} />
        </div>

        <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Session Time-Of-Day Performance
          </h2>
          <p className="text-xs text-slate-400">
            Identifies peak edge vs mid-day chop across Indian market intervals
          </p>
          <TimeOfDayChart data={data?.time_of_day_performance || []} height={220} />
        </div>
      </div>

      {/* Row 4: Index Performance & Psychology Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Index Breakdown */}
        <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Index Breakdown (NIFTY vs BANKNIFTY vs SENSEX)
          </h2>
          <div className="space-y-3 font-mono text-xs">
            {data?.index_performance?.map((idx) => (
              <div key={idx.index} className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-200 text-sm">{idx.index}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {idx.trades} trades • {idx.wins}W / {idx.losses}L (Win Rate: {idx.win_rate}%)
                  </div>
                </div>
                <div className={`text-base font-bold ${idx.total_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {idx.total_pnl >= 0 ? '+' : ''}₹{idx.total_pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Psychology & Rule Adherence Impact */}
        <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Psychology & Discipline P&L Impact
          </h2>
          
          <div className="grid grid-cols-2 gap-3 font-mono text-xs mb-3">
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
              <div className="text-slate-400 text-[10px] uppercase">Plan Followed ({data?.psychology_performance?.rule_followed?.count || 0} trades)</div>
              <div className="text-lg font-bold text-emerald-400 mt-1">
                +₹{(data?.psychology_performance?.rule_followed?.net_pnl || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30">
              <div className="text-slate-400 text-[10px] uppercase">Rule Violations ({data?.psychology_performance?.rule_violated?.count || 0} trades)</div>
              <div className="text-lg font-bold text-rose-400 mt-1">
                ₹{(data?.psychology_performance?.rule_violated?.net_pnl || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Cost of Recurring Execution Mistakes
            </div>
            <div className="space-y-2 font-mono text-xs">
              {data?.mistakes_breakdown?.map((m) => (
                <div key={m.code} className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300 font-semibold">{m.mistake} ({m.count}x)</span>
                  <span className={`font-bold ${m.total_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ₹{m.total_pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
