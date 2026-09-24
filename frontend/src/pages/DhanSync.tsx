import React, { useState, useEffect } from 'react';
import { dhanApi } from '../services/api';
import { Badge } from '../components/Badge';
import { StatCard } from '../components/StatCard';
import { Cpu, RefreshCw, CheckCircle2, AlertTriangle, Key, ShieldCheck, Database, Layers } from 'lucide-react';

export const DhanSync: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [reconcileData, setReconcileData] = useState<any>(null);
  const [optionChain, setOptionChain] = useState<any>(null);
  const [selectedUnderlying, setSelectedUnderlying] = useState('NIFTY');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [statRes, recRes, optRes] = await Promise.all([
        dhanApi.getStatus(),
        dhanApi.reconcileTrades(),
        dhanApi.getOptionChain(selectedUnderlying),
      ]);
      setStatus(statRes.data);
      setReconcileData(recRes.data);
      setOptionChain(optRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedUnderlying]);

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await dhanApi.syncTrades();
      setSyncResult(res.data);
      await loadData();
    } catch (err: any) {
      alert('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const isDemo = status?.mode === 'DEMO';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-cyan-950/20 via-slate-900/60 to-slate-900/40 border border-cyan-500/20">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white font-mono">
                DhanHQ Integration & Sync Engine
              </h1>
              <Badge variant={isDemo ? 'demo' : 'profit'}>
                {status?.mode || 'DEMO MODE'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated trade synchronization, duplicate prevention, and broker reconciliation audit
            </p>
          </div>
        </div>

        <button
          onClick={handleManualSync}
          disabled={syncing}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white transition-all shadow-lg shadow-sky-900/30 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Synchronizing...' : 'Run Dhan Sync'}</span>
        </button>
      </div>

      {syncResult && (
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs font-mono text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              Sync Complete: {syncResult.synced_count} new trade(s) ingested. {syncResult.skipped_duplicates} existing trades skipped ({syncResult.mode} MODE).
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Idempotent</span>
        </div>
      )}

      {/* Row 1: Status & Reconciliation Audit */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
        <div className="p-4 rounded-xl bg-[#111622] border border-slate-800">
          <div className="text-slate-500 uppercase text-[10px]">Broker Environment</div>
          <div className="text-lg font-bold text-white mt-1">
            {isDemo ? 'Dhan Demo Adapter' : 'DhanHQ Live API v2'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {isDemo ? 'Simulated Indian option trades' : 'Connected to Dhan API'}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111622] border border-slate-800">
          <div className="text-slate-500 uppercase text-[10px]">Local DB Records</div>
          <div className="text-lg font-bold text-slate-200 mt-1">
            {reconcileData?.local_database_trades || 0} trades
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Ingested in CapitalPilot</div>
        </div>

        <div className="p-4 rounded-xl bg-[#111622] border border-slate-800">
          <div className="text-slate-500 uppercase text-[10px]">Dhan Completed Orders</div>
          <div className="text-lg font-bold text-slate-200 mt-1">
            {reconcileData?.dhan_completed_trades || 0} trades
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {reconcileData?.executed_remote_orders || 0} executed orders
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#111622] border border-slate-800">
          <div className="text-slate-500 uppercase text-[10px]">Reconciliation Audit</div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-lg font-bold ${
                reconcileData?.status === 'SYNCHRONIZED' ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {reconcileData?.status || 'SYNCHRONIZED'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Discrepancy: {reconcileData?.difference || 0} trade(s)
          </div>
        </div>
      </div>

      {/* Row 2: Live Credentials Setup Guide */}
      <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-white">
          <Key className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider">
            Switching Between Demo Mode and Live DhanHQ
          </h2>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          CapitalPilot is architected with a dedicated <span className="font-mono text-sky-400">DhanProviderBase</span> abstraction. To connect your live Dhan trading account, configure your credentials in the backend environment file:
        </p>

        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
          <div className="text-slate-500"># backend/.env</div>
          <div><span className="text-sky-400">DHAN_DEMO_MODE</span>=false</div>
          <div><span className="text-sky-400">DHAN_CLIENT_ID</span>=your_client_id</div>
          <div><span className="text-sky-400">DHAN_PIN</span>=your_pin</div>
          <div><span className="text-sky-400">DHAN_TOTP_SECRET</span>=your_totp_secret</div>
        </div>

        <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-900/40 p-3 rounded-lg border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-slate-200">Security Guarantee:</strong> Live tokens are strictly isolated in the Django backend and are never sent to or exposed in the frontend browser environment.
          </span>
        </div>
      </div>

      {/* Row 3: Option Chain Feed from Provider */}
      <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Broker Option Chain Feed
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Spot Price: ₹{optionChain?.spot || 0}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedUnderlying('NIFTY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold ${
                selectedUnderlying === 'NIFTY' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              NIFTY
            </button>
            <button
              onClick={() => setSelectedUnderlying('BANKNIFTY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold ${
                selectedUnderlying === 'BANKNIFTY' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              BANKNIFTY
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500">
                <th className="pb-2 text-right">Call OI</th>
                <th className="pb-2 text-right">Call LTP</th>
                <th className="pb-2 bg-slate-900/60 font-bold text-white">Strike</th>
                <th className="pb-2 text-left">Put LTP</th>
                <th className="pb-2 text-left">Put OI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {optionChain?.strikes?.map((s: any) => (
                <tr key={s.strike} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 text-right text-slate-400">{s.callOi?.toLocaleString()}</td>
                  <td className="py-2.5 text-right text-emerald-400 font-semibold">₹{s.callLtp}</td>
                  <td className="py-2.5 bg-slate-900/80 font-bold text-white">
                    {s.strike}
                  </td>
                  <td className="py-2.5 text-left text-rose-400 font-semibold">₹{s.putLtp}</td>
                  <td className="py-2.5 text-left text-slate-400">{s.putOi?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
