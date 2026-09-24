import React, { useState, useEffect } from 'react';
import { challengeApi } from '../services/api';
import { ChallengeSummary, CapitalCurvePoint } from '../types';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { CapitalCurveChart } from '../charts/CapitalCurveChart';
import { Target, Trophy, Award, Flame, TrendingDown, CheckCircle2, Circle } from 'lucide-react';

export const Challenge: React.FC = () => {
  const [summary, setSummary] = useState<ChallengeSummary | null>(null);
  const [curve, setCurve] = useState<CapitalCurvePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [configForm, setConfigForm] = useState({
    name: '',
    starting_capital: 15000,
    target_capital: 135000,
    target_profit: 120000,
  });

  const loadData = async () => {
    try {
      const [sumRes, curveRes] = await Promise.all([
        challengeApi.getSummary(),
        challengeApi.getCurve(),
      ]);
      setSummary(sumRes.data);
      setCurve(curveRes.data || []);
      setConfigForm({
        name: sumRes.data.name,
        starting_capital: sumRes.data.starting_capital,
        target_capital: sumRes.data.target_capital,
        target_profit: sumRes.data.target_profit,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await challengeApi.updateConfig(configForm);
      setIsEditing(false);
      loadData();
    } catch (err) {
      alert('Failed to update challenge configuration');
    }
  };

  const milestones = [
    { label: 'Phase 1: Capital Doubling', target: 30000, desc: 'Grow 15k into 30k base equity' },
    { label: 'Phase 2: Lot Expansion', target: 50000, desc: 'Scale position sizing to 2-3 lots' },
    { label: 'Phase 3: Century Mark', target: 100000, desc: 'Cross ₹1,00,000 portfolio milestone' },
    { label: 'Phase 4: Target Capital', target: 135000, desc: 'Final Challenge Target Complete' },
  ];

  const currentCap = summary?.current_capital || 15000;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-950/20 via-slate-900/60 to-slate-900/40 border border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white font-mono">
                {summary?.name || '15k to 1.35L Options Challenge'}
              </h1>
              <Badge variant="demo">TARGET: ₹1,35,000</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Disciplined options scalping challenge starting from ₹15,000 capital
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
        >
          {isEditing ? 'Cancel Edit' : 'Configure Challenge'}
        </button>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <form onSubmit={handleUpdateConfig} className="p-5 rounded-xl bg-[#111622] border border-slate-700 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase">Challenge Parameters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                Starting Capital (₹)
              </label>
              <input
                type="number"
                value={configForm.starting_capital}
                onChange={(e) => setConfigForm({ ...configForm, starting_capital: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                Target Capital (₹)
              </label>
              <input
                type="number"
                value={configForm.target_capital}
                onChange={(e) => setConfigForm({ ...configForm, target_capital: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                Target Profit (₹)
              </label>
              <input
                type="number"
                value={configForm.target_profit}
                onChange={(e) => setConfigForm({ ...configForm, target_profit: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white transition-colors"
          >
            Save Parameters
          </button>
        </form>
      )}

      {/* Challenge Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Current Capital"
          value={`₹${(summary?.current_capital || 15000).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
          })}`}
          subtitle={`Started at: ₹${(summary?.starting_capital || 15000).toLocaleString('en-IN')}`}
          variant="profit"
        />

        <StatCard
          title="Remaining to ₹1.35L"
          value={`₹${(summary?.remaining_profit || 120000).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
          })}`}
          subtitle={`${(100 - (summary?.progress_pct || 0)).toFixed(1)}% remaining`}
          variant="warning"
        />

        <StatCard
          title="Current Streak"
          value={`${summary?.current_streak && summary.current_streak > 0 ? '+' : ''}${
            summary?.current_streak || 0
          } Days`}
          subtitle={
            (summary?.current_streak || 0) > 0
              ? 'Winning streak active'
              : (summary?.current_streak || 0) < 0
              ? 'Cool off & review'
              : 'Neutral'
          }
          variant={(summary?.current_streak || 0) > 0 ? 'profit' : (summary?.current_streak || 0) < 0 ? 'loss' : 'default'}
        />

        <StatCard
          title="Max Drawdown"
          value={`${summary?.max_drawdown_pct || 0}%`}
          subtitle={`₹${(summary?.max_drawdown_amount || 0).toLocaleString('en-IN', {
            maximumFractionDigits: 0,
          })}`}
          variant={(summary?.max_drawdown_pct || 0) > 8 ? 'loss' : 'default'}
        />
      </div>

      {/* Main Curve Chart */}
      <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Capital Progression Curve
            </h2>
            <p className="text-xs text-slate-400">
              Interactive equity curve from starting capital to challenge target
            </p>
          </div>
          <div className="font-mono text-xs text-right">
            <span className="text-slate-400">Trading Days: </span>
            <span className="text-white font-bold">{summary?.trading_days || 0}</span>
            <span className="text-slate-500 mx-2">•</span>
            <span className="text-emerald-400 font-bold">{summary?.winning_days || 0}W</span>
            <span className="text-slate-500 mx-1">/</span>
            <span className="text-rose-400 font-bold">{summary?.losing_days || 0}L</span>
          </div>
        </div>

        <CapitalCurveChart
          data={curve}
          startingCapital={summary?.starting_capital || 15000}
          targetCapital={summary?.target_capital || 135000}
          height={320}
        />
      </div>

      {/* Milestones Road */}
      <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white uppercase tracking-wider">
          Challenge Road Milestones
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {milestones.map((m, idx) => {
            const isCompleted = currentCap >= m.target;
            const progressToMilestone = Math.min(
              100,
              Math.max(0, Math.round(((currentCap - 15000) / (m.target - 15000)) * 100))
            );

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  isCompleted
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-slate-900/40 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200">{m.label}</span>
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div className="text-lg font-bold font-mono text-white mb-1">
                  ₹{m.target.toLocaleString('en-IN')}
                </div>
                <p className="text-xs text-slate-400 mb-3">{m.desc}</p>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${isCompleted ? 'bg-emerald-400' : 'bg-sky-500'}`}
                    style={{ width: `${progressToMilestone}%` }}
                  />
                </div>
                <div className="text-[10px] text-right text-slate-500 font-mono mt-1">
                  {progressToMilestone}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
