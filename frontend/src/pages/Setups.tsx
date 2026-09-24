import React, { useState, useEffect } from 'react';
import { setupsApi } from '../services/api';
import { Setup } from '../types';
import { Badge } from '../components/Badge';
import { Sliders, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';

export const Setups: React.FC = () => {
  const [setups, setSetups] = useState<Setup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    entry_conditions: '',
    stop_loss_rules: '',
    target_rules: '',
    min_rr: 2.0,
    applicable_index: 'ALL',
    is_active: true,
  });

  const loadSetups = async () => {
    try {
      const res = await setupsApi.getSetups();
      const list = res.data.results || res.data;
      setSetups(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSetups();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      entry_conditions: '',
      stop_loss_rules: '',
      target_rules: '',
      min_rr: 2.0,
      applicable_index: 'ALL',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (setup: Setup) => {
    setEditingId(setup.id);
    setFormData({
      name: setup.name,
      description: setup.description,
      entry_conditions: setup.entry_conditions,
      stop_loss_rules: setup.stop_loss_rules,
      target_rules: setup.target_rules,
      min_rr: setup.min_rr,
      applicable_index: setup.applicable_index,
      is_active: setup.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await setupsApi.updateSetup(editingId, formData);
      } else {
        await setupsApi.createSetup(formData);
      }
      setIsModalOpen(false);
      loadSetups();
    } catch (err) {
      alert('Failed to save setup');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-950/20 via-slate-900/60 to-slate-900/40 border border-purple-500/20">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white font-mono">Setup Library & Edge Analytics</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Empirical edge validation: measure win rate, profit factor, and expectancy per strategy
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-all shadow-lg shadow-purple-900/30"
        >
          <Plus className="w-4 h-4" />
          <span>New Setup</span>
        </button>
      </div>

      {/* Setups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {setups.map((s) => {
          const stats = s.stats;
          return (
            <div
              key={s.id}
              className="p-5 rounded-xl bg-[#111622] border border-slate-800 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">{s.name}</h3>
                  <Badge variant="info">{s.applicable_index}</Badge>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  {s.description || 'Predefined edge setup.'}
                </p>

                {/* Metrics */}
                {stats && (
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2 font-mono text-xs mb-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Trades / Win Rate:</span>
                      <span className="text-slate-100 font-bold">
                        {stats.total_trades} trades ({stats.win_rate}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Net P&L:</span>
                      <span
                        className={`font-bold ${
                          stats.total_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {stats.total_pnl >= 0 ? '+' : ''}₹{stats.total_pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Profit Factor:</span>
                      <span className="text-sky-400 font-bold">{stats.profit_factor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Expectancy / Trade:</span>
                      <span
                        className={`font-bold ${
                          stats.expectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        ₹{stats.expectancy}
                      </span>
                    </div>
                  </div>
                )}

                {/* Rules details */}
                <div className="space-y-1.5 text-xs text-slate-300">
                  {s.entry_conditions && (
                    <div>
                      <span className="text-slate-500 font-semibold">Entry:</span> {s.entry_conditions}
                    </div>
                  )}
                  {s.stop_loss_rules && (
                    <div>
                      <span className="text-slate-500 font-semibold">SL:</span> {s.stop_loss_rules}
                    </div>
                  )}
                  {s.target_rules && (
                    <div>
                      <span className="text-slate-500 font-semibold">Target:</span> {s.target_rules}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono">Min R:R: {s.min_rr}:1</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(s)}
                    className="p-1 rounded text-slate-400 hover:text-sky-400 hover:bg-slate-800"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Setup Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111622] border border-slate-700/80 rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white uppercase">
              {editingId ? 'Edit Trading Setup' : 'Define New Strategy Setup'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Setup Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. 5-EMA Pullback Rejection"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Applicable Index
                  </label>
                  <select
                    value={formData.applicable_index}
                    onChange={(e) => setFormData({ ...formData, applicable_index: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100"
                  >
                    <option value="ALL">All Indices</option>
                    <option value="NIFTY">NIFTY</option>
                    <option value="BANKNIFTY">BANKNIFTY</option>
                    <option value="SENSEX">SENSEX</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Minimum R:R
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.min_rr}
                    onChange={(e) => setFormData({ ...formData, min_rr: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Entry Trigger Conditions
                </label>
                <textarea
                  value={formData.entry_conditions}
                  onChange={(e) => setFormData({ ...formData, entry_conditions: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Stop Loss Rules
                  </label>
                  <input
                    type="text"
                    value={formData.stop_loss_rules}
                    onChange={(e) => setFormData({ ...formData, stop_loss_rules: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Target Rules
                  </label>
                  <input
                    type="text"
                    value={formData.target_rules}
                    onChange={(e) => setFormData({ ...formData, target_rules: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white"
                >
                  Save Setup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
