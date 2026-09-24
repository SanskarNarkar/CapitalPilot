import React from 'react';
import { Trade } from '../types';
import { X, Calendar, Clock, DollarSign, Shield, Brain, AlertTriangle } from 'lucide-react';
import { Badge } from './Badge';

interface TradeDetailDrawerProps {
  trade: Trade | null;
  onClose: () => void;
}

export const TradeDetailDrawer: React.FC<TradeDetailDrawerProps> = ({ trade, onClose }) => {
  if (!trade) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-[#0f1420] border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base font-bold font-mono text-white">
                  {trade.symbol}
                </span>
                <Badge variant={trade.side === 'BUY' ? 'profit' : 'loss'}>
                  {trade.side}
                </Badge>
                <Badge variant="neutral">
                  {trade.status}
                </Badge>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                ID: {trade.trade_id} {trade.dhan_order_id && `• Dhan: ${trade.dhan_order_id}`}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Financial Overview Card */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 uppercase font-semibold">
                <span>Net Realized P&L</span>
                <span>Gross vs Charges</span>
              </div>
              <div className="flex items-baseline justify-between font-mono">
                <span
                  className={`text-2xl font-bold ${
                    trade.net_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {trade.net_pnl >= 0 ? '+' : ''}₹{trade.net_pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-slate-400">
                  Gross: ₹{trade.gross_pnl} | Chg: ₹{trade.charges}
                </span>
              </div>
            </div>

            {/* Execution Details */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Execution Parameters
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                  <div className="text-slate-500 mb-0.5">Quantity / Lots</div>
                  <div className="font-semibold text-slate-200">{trade.quantity} units</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                  <div className="text-slate-500 mb-0.5">Entry Price</div>
                  <div className="font-semibold text-slate-200">₹{trade.entry_price}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                  <div className="text-slate-500 mb-0.5">Exit Price</div>
                  <div className="font-semibold text-slate-200">
                    {trade.exit_price ? `₹${trade.exit_price}` : 'OPEN'}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                  <div className="text-slate-500 mb-0.5">Stop Loss / Target</div>
                  <div className="font-semibold text-slate-200">
                    ₹{trade.stop_loss} / ₹{trade.target}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                  <div className="text-slate-500 mb-0.5">Risk Incurred</div>
                  <div className="font-semibold text-rose-400">₹{trade.risk_amount}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800">
                  <div className="text-slate-500 mb-0.5">Risk/Reward (R:R)</div>
                  <div className="font-semibold text-sky-400">{trade.rr_ratio}:1</div>
                </div>
              </div>
            </div>

            {/* Strategy & Psychology */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Strategy & Psychology Context
              </div>

              <div className="p-3.5 rounded-lg bg-slate-900/40 border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Setup:</span>
                  <span className="font-semibold text-slate-200">
                    {trade.setup_name || 'Discretionary'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Psychology:</span>
                  <Badge variant="info">{trade.psychology}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Rule Followed:</span>
                  <Badge variant={trade.rule_followed ? 'profit' : 'loss'}>
                    {trade.rule_followed ? 'YES' : 'NO - VIOLATION'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Mistake:</span>
                  <Badge variant={trade.mistake === 'NONE' ? 'profit' : 'warning'}>
                    {trade.mistake.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>

              {trade.entry_reason && (
                <div className="p-3 rounded-lg bg-slate-900/30 border border-slate-800 text-xs">
                  <div className="text-slate-500 mb-1 font-semibold">Entry Rationale:</div>
                  <div className="text-slate-300 leading-relaxed">{trade.entry_reason}</div>
                </div>
              )}

              {trade.notes && (
                <div className="p-3 rounded-lg bg-slate-900/30 border border-slate-800 text-xs">
                  <div className="text-slate-500 mb-1 font-semibold">Trader Notes:</div>
                  <div className="text-slate-300 leading-relaxed">{trade.notes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
