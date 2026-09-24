import React, { useState, useEffect } from 'react';
import { tradesApi } from '../services/api';
import { Trade } from '../types';
import { Badge } from '../components/Badge';
import { TradeModal } from '../components/TradeModal';
import { TradeDetailDrawer } from '../components/TradeDetailDrawer';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

export const Trades: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);

  // Filters
  const [indexFilter, setIndexFilter] = useState('ALL');
  const [sideFilter, setSideFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [emotionFilter, setEmotionFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  const fetchTrades = async () => {
    setLoading(true);
    try {
      const [listRes, sumRes] = await Promise.all([
        tradesApi.getTrades({
          index: indexFilter,
          side: sideFilter,
          status: statusFilter,
          emotion: emotionFilter,
          search: search || undefined,
        }),
        tradesApi.getSummary(),
      ]);
      const list = listRes.data.results || listRes.data;
      setTrades(Array.isArray(list) ? list : []);
      setSummary(sumRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, [indexFilter, sideFilter, statusFilter, emotionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrades();
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this trade record?')) {
      try {
        await tradesApi.deleteTrade(id);
        fetchTrades();
      } catch (err) {
        alert('Failed to delete trade');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-950/20 via-slate-900/60 to-slate-900/40 border border-emerald-500/20">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white font-mono">Trade Journal</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive log of executions, P&L, psychology, and risk management
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow-lg shadow-emerald-900/30"
        >
          <Plus className="w-4 h-4" />
          <span>Record Trade</span>
        </button>
      </div>

      {/* Summary Chips */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-[#111622] border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">Total Trades</div>
            <div className="text-base font-bold text-slate-100">{summary.total_trades}</div>
          </div>
          <div className="p-3 rounded-xl bg-[#111622] border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">Win Rate</div>
            <div className="text-base font-bold text-emerald-400">{summary.win_rate}%</div>
          </div>
          <div className="p-3 rounded-xl bg-[#111622] border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">Wins / Losses</div>
            <div className="text-base font-bold text-slate-200">
              <span className="text-emerald-400">{summary.wins}W</span> - <span className="text-rose-400">{summary.losses}L</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#111622] border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">Net Realized P&L</div>
            <div
              className={`text-base font-bold ${
                summary.total_net_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {summary.total_net_pnl >= 0 ? '+' : ''}₹{summary.total_net_pnl.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#111622] border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">Today Net P&L</div>
            <div
              className={`text-base font-bold ${
                summary.today_net_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {summary.today_net_pnl >= 0 ? '+' : ''}₹{summary.today_net_pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[#111622] border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">Open Positions</div>
            <div className="text-base font-bold text-sky-400">{summary.open_trades}</div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#111622] border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-slate-400 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={indexFilter}
            onChange={(e) => setIndexFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
          >
            <option value="ALL">All Indices</option>
            <option value="NIFTY">NIFTY</option>
            <option value="BANKNIFTY">BANKNIFTY</option>
            <option value="SENSEX">SENSEX</option>
          </select>

          <select
            value={sideFilter}
            onChange={(e) => setSideFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
          >
            <option value="ALL">All Sides</option>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
          >
            <option value="ALL">All Status</option>
            <option value="CLOSED">CLOSED</option>
            <option value="OPEN">OPEN</option>
          </select>

          <select
            value={emotionFilter}
            onChange={(e) => setEmotionFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
          >
            <option value="ALL">All Emotions</option>
            <option value="CALM">Calm</option>
            <option value="CONFIDENT">Confident</option>
            <option value="FEAR">Fear</option>
            <option value="GREED">Greed</option>
            <option value="FOMO">FOMO</option>
            <option value="REVENGE">Revenge</option>
          </select>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symbol, notes..."
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
        </form>
      </div>

      {/* Main Trades Table */}
      <div className="p-5 rounded-2xl bg-[#111622] border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-mono">
                <th className="pb-3">Trade ID</th>
                <th className="pb-3">Date / Time</th>
                <th className="pb-3">Symbol</th>
                <th className="pb-3">Side</th>
                <th className="pb-3">Qty</th>
                <th className="pb-3">Entry</th>
                <th className="pb-3">Exit</th>
                <th className="pb-3 text-right">Net P&L</th>
                <th className="pb-3 text-center">R:R</th>
                <th className="pb-3">Setup</th>
                <th className="pb-3 text-center">Rule</th>
                <th className="pb-3 text-center">Mistake</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-500">
                    No trades match the selected criteria.
                  </td>
                </tr>
              ) : (
                trades.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedTrade(t)}
                  >
                    <td className="py-3 text-slate-400 text-[11px] font-semibold">{t.trade_id}</td>
                    <td className="py-3 text-slate-400">
                      {t.date} <span className="text-[10px] text-slate-500">{t.time?.slice(0, 5)}</span>
                    </td>
                    <td className="py-3 font-bold text-slate-100">{t.symbol}</td>
                    <td className="py-3">
                      <Badge variant={t.side === 'BUY' ? 'profit' : 'loss'}>
                        {t.side}
                      </Badge>
                    </td>
                    <td className="py-3 text-slate-300">{t.quantity}</td>
                    <td className="py-3 text-slate-300">₹{t.entry_price}</td>
                    <td className="py-3 text-slate-300">
                      {t.exit_price ? `₹${t.exit_price}` : <span className="text-sky-400">OPEN</span>}
                    </td>
                    <td
                      className={`py-3 text-right font-bold ${
                        t.net_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {t.net_pnl >= 0 ? '+' : ''}₹{t.net_pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-center text-slate-400">{t.rr_ratio}:1</td>
                    <td className="py-3 text-slate-300 text-[11px]">{t.setup_name || 'Discretionary'}</td>
                    <td className="py-3 text-center">
                      {t.rule_followed ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 mx-auto" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <Badge variant={t.mistake === 'NONE' ? 'profit' : 'warning'}>
                        {t.mistake.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedTrade(t)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete Trade"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onTradeSaved={fetchTrades}
      />

      <TradeDetailDrawer
        trade={selectedTrade}
        onClose={() => setSelectedTrade(null)}
      />
    </div>
  );
};
