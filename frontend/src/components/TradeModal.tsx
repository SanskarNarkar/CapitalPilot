import React, { useState, useEffect } from 'react';
import { setupsApi, riskApi, tradesApi } from '../services/api';
import { Setup, FirewallResponse } from '../types';
import { X, ShieldAlert, Check } from 'lucide-react';
import { FirewallModal } from './FirewallModal';

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTradeSaved: () => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  isOpen,
  onClose,
  onTradeSaved,
}) => {
  const [setups, setSetups] = useState<Setup[]>([]);
  const [loading, setLoading] = useState(false);
  const [firewallChecking, setFirewallChecking] = useState(false);
  const [firewallResult, setFirewallResult] = useState<FirewallResponse | null>(null);
  const [showFirewallModal, setShowFirewallModal] = useState(false);

  const [formData, setFormData] = useState({
    index: 'NIFTY',
    symbol: 'NIFTY 24650 CE',
    side: 'BUY',
    instrument: 'OPTION',
    option_type: 'CE',
    quantity: 65,
    entry_price: 120.0,
    exit_price: 148.0,
    stop_loss: 105.0,
    target: 150.0,
    setup: '',
    psychology: 'CALM',
    emotion: 'Disciplined',
    rule_followed: true,
    mistake: 'NONE',
    notes: '',
    status: 'CLOSED',
  });

  useEffect(() => {
    if (isOpen) {
      setupsApi.getSetups().then((res) => {
        const list = res.data.results || res.data;
        setSetups(Array.isArray(list) ? list : []);
        if (list.length > 0 && !formData.setup) {
          setFormData((prev) => ({ ...prev, setup: String(list[0].id) }));
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFirewallPreflight = async () => {
    setFirewallChecking(true);
    try {
      const res = await riskApi.validateFirewall({
        index: formData.index,
        entry_price: formData.entry_price,
        stop_loss: formData.stop_loss,
        target: formData.target,
        quantity: Number(formData.quantity),
        setup_id: formData.setup ? Number(formData.setup) : undefined,
      });
      setFirewallResult(res.data);
      setShowFirewallModal(true);
    } catch (err: any) {
      alert('Firewall check error: ' + (err.response?.data?.error || err.message));
    } finally {
      setFirewallChecking(false);
    }
  };

  const handleSaveTrade = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await tradesApi.createTrade({
        ...formData,
        quantity: Number(formData.quantity),
        entry_price: Number(formData.entry_price),
        exit_price: formData.status === 'CLOSED' ? Number(formData.exit_price) : null,
        stop_loss: Number(formData.stop_loss),
        target: Number(formData.target),
        setup: formData.setup ? Number(formData.setup) : null,
      });
      onTradeSaved();
      onClose();
    } catch (err: any) {
      alert('Failed to save trade: ' + (err.response?.data?.error || JSON.stringify(err.response?.data)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-[#111622] border border-slate-700/80 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Record Execution / Journal Trade
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveTrade} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Row 1: Index, Side, Symbol */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Index
                </label>
                <select
                  value={formData.index}
                  onChange={(e) => {
                    const idx = e.target.value;
                    const defaultLots: any = { NIFTY: 65, BANKNIFTY: 30, SENSEX: 20 };
                    setFormData({
                      ...formData,
                      index: idx,
                      quantity: defaultLots[idx] || 65,
                      symbol: `${idx} Option`,
                    });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="NIFTY">NIFTY 50 (Lot: 65)</option>
                  <option value="BANKNIFTY">BANKNIFTY (Lot: 30)</option>
                  <option value="SENSEX">SENSEX (Lot: 20)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Side
                </label>
                <select
                  value={formData.side}
                  onChange={(e) => setFormData({ ...formData, side: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Trading Symbol
                </label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  placeholder="e.g. NIFTY 24650 CE"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>
            </div>

            {/* Row 2: Quantity, Entry, SL, Target */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Entry Price (₹)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={formData.entry_price}
                  onChange={(e) => setFormData({ ...formData, entry_price: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Stop Loss (₹)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={formData.stop_loss}
                  onChange={(e) => setFormData({ ...formData, stop_loss: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Target (₹)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={formData.target}
                  onChange={(e) => setFormData({ ...formData, target: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>
            </div>

            {/* Row 3: Status & Exit Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="CLOSED">CLOSED (Completed Trade)</option>
                  <option value="OPEN">OPEN (Currently Active)</option>
                </select>
              </div>

              {formData.status === 'CLOSED' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                    Exit Price (₹)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={formData.exit_price}
                    onChange={(e) => setFormData({ ...formData, exit_price: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                    required
                  />
                </div>
              )}
            </div>

            {/* Row 4: Setup, Psychology, Mistake */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Trading Setup
                </label>
                <select
                  value={formData.setup}
                  onChange={(e) => setFormData({ ...formData, setup: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  required
                >
                  <option value="">Select a Setup...</option>
                  {setups.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Psychology / State
                </label>
                <select
                  value={formData.psychology}
                  onChange={(e) => setFormData({ ...formData, psychology: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="CALM">Calm</option>
                  <option value="CONFIDENT">Confident</option>
                  <option value="FEAR">Fear</option>
                  <option value="GREED">Greed</option>
                  <option value="FOMO">FOMO</option>
                  <option value="REVENGE">Revenge</option>
                  <option value="UNCERTAIN">Uncertain</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Mistake Tag
                </label>
                <select
                  value={formData.mistake}
                  onChange={(e) => setFormData({ ...formData, mistake: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                >
                  <option value="NONE">None (Clean Execution)</option>
                  <option value="EARLY_ENTRY">Early entry</option>
                  <option value="LATE_ENTRY">Late entry</option>
                  <option value="EARLY_EXIT">Early exit</option>
                  <option value="LATE_EXIT">Late exit</option>
                  <option value="REVENGE_TRADE">Revenge trade</option>
                  <option value="OVERTRADING">Overtrading</option>
                  <option value="INCREASED_QUANTITY">Increased quantity after loss</option>
                  <option value="IGNORED_SL">Ignored SL</option>
                  <option value="IGNORED_PLAN">Ignored plan</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                Execution Notes & Confluence
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Market context, reasons for entry/exit, price action observation..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleFirewallPreflight}
                disabled={firewallChecking}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-950/60 hover:bg-sky-900/60 border border-sky-600/40 text-xs font-bold text-sky-300 transition-colors"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Test Trade Firewall Pre-Flight</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors shadow-lg shadow-emerald-900/30"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'Recording...' : 'Record Trade'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <FirewallModal
        isOpen={showFirewallModal}
        onClose={() => setShowFirewallModal(false)}
        result={firewallResult}
        isRecordingMode={true}
        onConfirm={() => {
          setShowFirewallModal(false);
          handleSaveTrade();
        }}
      />
    </>
  );
};
