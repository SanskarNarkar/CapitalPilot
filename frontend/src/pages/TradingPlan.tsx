import React, { useState, useEffect } from 'react';
import { journalApi } from '../services/api';
import { DailyTradingPlan } from '../types';
import { Badge } from '../components/Badge';
import { CalendarCheck, Plus, Trash2, Edit2, CheckCircle, AlertTriangle } from 'lucide-react';

export const TradingPlan: React.FC = () => {
  const [plans, setPlans] = useState<DailyTradingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<DailyTradingPlan>({
    date: new Date().toISOString().split('T')[0],
    starting_capital: 15000,
    daily_profit_target: 1500,
    max_daily_loss: 600,
    max_trades: 3,
    risk_per_trade_pct: 1.0,
    max_risk_amount: 200,
    primary_index: 'NIFTY',
    secondary_index: 'BANKNIFTY',
    preferred_setups: 'VWAP Rejection, Opening Range Breakout',
    avoid_conditions: 'First 15m choppy opening, major central bank rate announcements',
    market_bias: 'BULLISH',
    important_events: 'Weekly Expiry, US Macro CPI data',
    notes: 'Stick strictly to 1:2 R:R. If first trade hits SL, reduce size on second.',
    plan_followed: true,
  });

  const loadPlans = async () => {
    try {
      const res = await journalApi.getPlans();
      const list = res.data.results || res.data;
      setPlans(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      starting_capital: 15000,
      daily_profit_target: 1500,
      max_daily_loss: 600,
      max_trades: 3,
      risk_per_trade_pct: 1.0,
      max_risk_amount: 200,
      primary_index: 'NIFTY',
      secondary_index: 'BANKNIFTY',
      preferred_setups: 'VWAP Rejection, Opening Range Breakout',
      avoid_conditions: 'First 15m choppy opening',
      market_bias: 'NEUTRAL',
      important_events: '',
      notes: '',
      plan_followed: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: DailyTradingPlan) => {
    setEditingId(plan.id || null);
    setFormData(plan);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this daily trading plan?')) {
      try {
        await journalApi.deletePlan(id);
        loadPlans();
      } catch (err) {
        alert('Failed to delete plan');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await journalApi.updatePlan(editingId, formData);
      } else {
        await journalApi.createPlan(formData);
      }
      setIsModalOpen(false);
      loadPlans();
    } catch (err: any) {
      alert('Failed to save plan: ' + (err.response?.data?.detail || JSON.stringify(err.response?.data)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-sky-950/20 via-slate-900/60 to-slate-900/40 border border-sky-500/20">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-sky-500/20 text-sky-400">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white font-mono">Daily Trading Plans</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Plan your trades before the market opens to protect against emotional bias
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white transition-all shadow-lg shadow-sky-900/30"
        >
          <Plus className="w-4 h-4" />
          <span>Create Trading Plan</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map((p) => (
          <div
            key={p.id}
            className="p-5 rounded-xl bg-[#111622] border border-slate-800 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold font-mono text-white">{p.date}</span>
                <Badge
                  variant={
                    p.market_bias === 'BULLISH'
                      ? 'profit'
                      : p.market_bias === 'BEARISH'
                      ? 'loss'
                      : 'warning'
                  }
                >
                  {p.market_bias}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-500 text-[10px]">Profit Target</span>
                  <div className="text-emerald-400 font-bold">₹{p.daily_profit_target}</div>
                </div>
                <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-500 text-[10px]">Max Loss Limit</span>
                  <div className="text-rose-400 font-bold">₹{p.max_daily_loss}</div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div>
                  <span className="text-slate-500">Indices:</span> {p.primary_index}
                  {p.secondary_index && ` / ${p.secondary_index}`}
                </div>
                <div>
                  <span className="text-slate-500">Max Trades:</span> {p.max_trades} trades
                </div>
                <div>
                  <span className="text-slate-500">Setups:</span> {p.preferred_setups}
                </div>
                {p.avoid_conditions && (
                  <div>
                    <span className="text-slate-500">Avoid:</span> {p.avoid_conditions}
                  </div>
                )}
                {p.notes && (
                  <div className="p-2 rounded bg-slate-900/40 text-[11px] text-slate-400 italic mt-2">
                    "{p.notes}"
                  </div>
                )}
              </div>
            </div>

            {/* Performance Footer */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <div className="font-mono">
                <span className="text-slate-500">Actual P&L: </span>
                <span
                  className={`font-bold ${
                    (p.actual_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {(p.actual_pnl || 0) >= 0 ? '+' : ''}₹{p.actual_pnl || 0}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(p)}
                  className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => p.id && handleDelete(p.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Plan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-slate-700/80 rounded-2xl max-w-xl w-full shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white uppercase">
              {editingId ? 'Edit Daily Trading Plan' : 'Create Daily Trading Plan'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Market Bias
                  </label>
                  <select
                    value={formData.market_bias}
                    onChange={(e) => setFormData({ ...formData, market_bias: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100"
                  >
                    <option value="BULLISH">Bullish</option>
                    <option value="BEARISH">Bearish</option>
                    <option value="NEUTRAL">Neutral / Rangebound</option>
                    <option value="VOLATILE">Volatile / Both Sides</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Daily Target (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.daily_profit_target}
                    onChange={(e) => setFormData({ ...formData, daily_profit_target: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Max Loss (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.max_daily_loss}
                    onChange={(e) => setFormData({ ...formData, max_daily_loss: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Max Trades
                  </label>
                  <input
                    type="number"
                    value={formData.max_trades}
                    onChange={(e) => setFormData({ ...formData, max_trades: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Primary Index
                  </label>
                  <input
                    type="text"
                    value={formData.primary_index}
                    onChange={(e) => setFormData({ ...formData, primary_index: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Secondary Index
                  </label>
                  <input
                    type="text"
                    value={formData.secondary_index}
                    onChange={(e) => setFormData({ ...formData, secondary_index: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Preferred Setups
                </label>
                <input
                  type="text"
                  value={formData.preferred_setups}
                  onChange={(e) => setFormData({ ...formData, preferred_setups: e.target.value })}
                  placeholder="e.g. VWAP Rejection, ORB"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Conditions to Avoid
                </label>
                <input
                  type="text"
                  value={formData.avoid_conditions}
                  onChange={(e) => setFormData({ ...formData, avoid_conditions: e.target.value })}
                  placeholder="e.g. Choppy mid-day, RBI speech"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Discipline Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white"
                >
                  Save Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
