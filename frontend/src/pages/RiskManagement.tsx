import React, { useState, useEffect } from 'react';
import { riskApi } from '../services/api';
import { GlobalRiskSettings, IndexRiskProfile, PositionSizeResult, FirewallResponse } from '../types';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { FirewallModal } from '../components/FirewallModal';
import {
  ShieldAlert,
  Sliders,
  Calculator,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
} from 'lucide-react';

export const RiskManagement: React.FC = () => {
  const [settings, setSettings] = useState<GlobalRiskSettings | null>(null);
  const [profiles, setProfiles] = useState<IndexRiskProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Position Sizing Calculator state
  const [calcForm, setCalcForm] = useState({
    index: 'NIFTY',
    entry_price: 120.0,
    stop_loss: 105.0,
    capital: 15000,
  });
  const [calcResult, setCalcResult] = useState<PositionSizeResult | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Firewall Test state
  const [firewallTest, setFirewallTest] = useState({
    index: 'NIFTY',
    quantity: 65,
    entry_price: 120.0,
    stop_loss: 105.0,
    target: 155.0,
    setup_id: 1,
  });
  const [firewallResult, setFirewallResult] = useState<FirewallResponse | null>(null);
  const [isFirewallModalOpen, setIsFirewallModalOpen] = useState(false);
  const [firewallChecking, setFirewallChecking] = useState(false);

  const loadRiskData = async () => {
    try {
      const [settRes, profRes] = await Promise.all([
        riskApi.getSettings(),
        riskApi.getProfiles(),
      ]);
      setSettings(settRes.data);
      const pList = profRes.data.results || profRes.data;
      setProfiles(Array.isArray(pList) ? pList : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRiskData();
  }, []);

  const handleCalculateSize = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalcLoading(true);
    try {
      const res = await riskApi.calculateSize({
        index: calcForm.index,
        entry_price: Number(calcForm.entry_price),
        stop_loss: Number(calcForm.stop_loss),
        capital: Number(calcForm.capital),
      });
      setCalcResult(res.data);
    } catch (err) {
      alert('Error calculating position size');
    } finally {
      setCalcLoading(false);
    }
  };

  const handleRunFirewallTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFirewallChecking(true);
    try {
      const res = await riskApi.validateFirewall({
        index: firewallTest.index,
        quantity: Number(firewallTest.quantity),
        entry_price: Number(firewallTest.entry_price),
        stop_loss: Number(firewallTest.stop_loss),
        target: Number(firewallTest.target),
        setup_id: Number(firewallTest.setup_id),
      });
      setFirewallResult(res.data);
      setIsFirewallModalOpen(true);
    } catch (err) {
      alert('Firewall evaluation failed');
    } finally {
      setFirewallChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-rose-950/20 via-slate-900/60 to-slate-900/40 border border-rose-500/20">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white font-mono">
                Risk Management Engine
              </h1>
              <Badge variant="profit">9-RULE FIREWALL ACTIVE</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict mathematical guardrails preventing account drawdowns and revenge trading
            </p>
          </div>
        </div>
      </div>

      {/* Global Risk Rules Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 font-mono">
        <StatCard
          title="Risk Per Trade"
          value={`${settings?.risk_per_trade_pct || 1.0}%`}
          subtitle="Max equity risked per idea"
          variant="warning"
        />
        <StatCard
          title="Max Daily Loss"
          value={`${settings?.max_daily_loss_pct || 2.0}%`}
          subtitle="Hard stop daily threshold"
          variant="loss"
        />
        <StatCard
          title="Consecutive Losses"
          value={`${settings?.max_consecutive_losses || 2}`}
          subtitle="Mandatory cool-off trigger"
          variant="default"
        />
        <StatCard
          title="Max Trades / Day"
          value={`${settings?.max_trades_per_day || 3}`}
          subtitle="Overtrading limiter"
          variant="accent"
        />
        <StatCard
          title="Minimum R:R"
          value={`${settings?.min_rr_ratio || 2.0}:1`}
          subtitle="Minimum reward/risk"
          variant="profit"
        />
      </div>

      {/* 2-Column: Position Sizer & Firewall Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interactive Position Sizing Calculator */}
        <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Dynamic Position Sizing Calculator
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Calculates permissible lot quantity based on stop loss distance, capital, and active contract lot size.
          </p>

          <form onSubmit={handleCalculateSize} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Index
                </label>
                <select
                  value={calcForm.index}
                  onChange={(e) => setCalcForm({ ...calcForm, index: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100"
                >
                  <option value="NIFTY">NIFTY 50</option>
                  <option value="BANKNIFTY">BANKNIFTY</option>
                  <option value="SENSEX">SENSEX</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Active Capital (₹)
                </label>
                <input
                  type="number"
                  value={calcForm.capital}
                  onChange={(e) => setCalcForm({ ...calcForm, capital: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Entry Price (₹)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={calcForm.entry_price}
                  onChange={(e) => setCalcForm({ ...calcForm, entry_price: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono"
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
                  value={calcForm.stop_loss}
                  onChange={(e) => setCalcForm({ ...calcForm, stop_loss: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={calcLoading}
              className="w-full py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white transition-colors"
            >
              {calcLoading ? 'Calculating...' : 'Compute Allowed Sizing'}
            </button>
          </form>

          {calcResult && (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-sky-500/30 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Contract Lot Size:</span>
                <span className="text-white font-bold">{calcResult.lot_size} units</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Points at Risk / unit:</span>
                <span className="text-rose-400 font-bold">₹{calcResult.risk_per_unit}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Maximum Allowed Risk (1%):</span>
                <span className="text-sky-400 font-bold">₹{calcResult.allowed_risk_amount}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-sm">
                <span className="text-white font-bold">Recommended Sizing:</span>
                <span className="text-emerald-400 font-bold">
                  {calcResult.recommended_lots} lot(s) ({calcResult.recommended_quantity} qty)
                </span>
              </div>
              <div className="text-right text-[11px] text-slate-500">
                Actual Risk: ₹{calcResult.actual_risk_amount}
              </div>
            </div>
          )}
        </div>

        {/* Trade Firewall Pre-Flight Simulator */}
        <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Trade Firewall Pre-Flight Test
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Test a trade against all 9 risk rules before entry. Verify ALLOWED or BLOCKED verdict.
          </p>

          <form onSubmit={handleRunFirewallTest} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Index
                </label>
                <select
                  value={firewallTest.index}
                  onChange={(e) => setFirewallTest({ ...firewallTest, index: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100"
                >
                  <option value="NIFTY">NIFTY</option>
                  <option value="BANKNIFTY">BANKNIFTY</option>
                  <option value="SENSEX">SENSEX</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Proposed Quantity
                </label>
                <input
                  type="number"
                  value={firewallTest.quantity}
                  onChange={(e) => setFirewallTest({ ...firewallTest, quantity: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  Entry (₹)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={firewallTest.entry_price}
                  onChange={(e) => setFirewallTest({ ...firewallTest, entry_price: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">
                  SL (₹)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={firewallTest.stop_loss}
                  onChange={(e) => setFirewallTest({ ...firewallTest, stop_loss: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono"
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
                  value={firewallTest.target}
                  onChange={(e) => setFirewallTest({ ...firewallTest, target: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={firewallChecking}
              className="w-full py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-colors shadow-lg shadow-rose-900/30"
            >
              {firewallChecking ? 'Evaluating Firewall Rules...' : 'Execute Pre-Flight Inspection'}
            </button>
          </form>
        </div>
      </div>

      {/* Index-Specific Risk Profiles */}
      <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white uppercase tracking-wider">
          Index-Specific Risk Specifications
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {profiles.map((prof) => (
            <div
              key={prof.id}
              className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3 font-mono text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-white text-sm">{prof.index}</span>
                <Badge variant="profit">{prof.lot_size} Qty/Lot</Badge>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Risk / Trade:</span>
                <span className="text-slate-200">{prof.risk_per_trade_pct}%</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Max Position Cap:</span>
                <span className="text-sky-400 font-semibold">{prof.max_position_lots} lots</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Min R:R:</span>
                <span className="text-emerald-400">{prof.min_rr}:1</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Session:</span>
                <span className="text-slate-300">
                  {prof.trading_session_start.slice(0, 5)} - {prof.trading_session_end.slice(0, 5)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <FirewallModal
        isOpen={isFirewallModalOpen}
        onClose={() => setIsFirewallModalOpen(false)}
        result={firewallResult}
      />
    </div>
  );
};
