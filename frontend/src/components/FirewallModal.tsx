import React from 'react';
import { FirewallResponse } from '../types';
import { X, ShieldCheck, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from './Badge';

interface FirewallModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: FirewallResponse | null;
  onConfirm?: () => void;
  isRecordingMode?: boolean;
}

export const FirewallModal: React.FC<FirewallModalProps> = ({
  isOpen,
  onClose,
  result,
  onConfirm,
  isRecordingMode = false,
}) => {
  if (!isOpen || !result) return null;

  const isAllowed = result.is_allowed;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111622] border border-slate-700/80 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Status Header */}
        <div
          className={`p-6 border-b flex items-center justify-between ${
            isAllowed
              ? 'bg-emerald-950/20 border-emerald-500/20'
              : 'bg-rose-950/25 border-rose-500/20'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                isAllowed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {isAllowed ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-white">
                  Trade Firewall: {result.status}
                </h3>
                <Badge variant={isAllowed ? 'profit' : 'loss'}>
                  {result.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                {isAllowed
                  ? 'All 9 mathematical & psychological rules passed.'
                  : `${result.failed_rules_count} rule(s) failed. Order execution restricted.`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Risk Metrics Breakdown */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-900/40 grid grid-cols-3 gap-3 text-center font-mono">
          <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="text-[10px] text-slate-400 uppercase">Required Risk</div>
            <div className="text-sm font-bold text-slate-100 mt-0.5">
              ₹{result.required_risk.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="text-[10px] text-slate-400 uppercase">Daily Risk Left</div>
            <div className="text-sm font-bold text-sky-400 mt-0.5">
              ₹{result.remaining_daily_risk.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/50">
            <div className="text-[10px] text-slate-400 uppercase">Excess Risk</div>
            <div className={`text-sm font-bold mt-0.5 ${result.excess_risk > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              ₹{result.excess_risk.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Rules Checklist */}
        <div className="p-5 max-h-72 overflow-y-auto space-y-2.5">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            9-Rule Safety Firewall Evaluation
          </div>
          {result.rules.map((r, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                r.status === 'PASS'
                  ? 'bg-emerald-950/10 border-emerald-500/20 text-slate-300'
                  : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
              }`}
            >
              {r.status === 'PASS' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-semibold capitalize text-slate-200">
                  {r.rule.replace(/_/g, ' ')}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">{r.message}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 bg-[#0d121c] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            Close
          </button>
          {isRecordingMode && isAllowed && onConfirm && (
            <button
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors shadow-lg shadow-emerald-900/30"
            >
              Execute Trade
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
