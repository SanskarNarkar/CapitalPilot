import React, { useState, useEffect } from 'react';
import {
  challengeApi,
  tradesApi,
  journalApi,
  marketApi,
  coachApi,
} from '../services/api';
import {
  ChallengeSummary,
  Trade,
  DailyTradingPlan,
  MarketOverview,
  AICoachInsights,
} from '../types';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { CapitalCurveChart } from '../charts/CapitalCurveChart';
import { DailyPnLChart } from '../charts/DailyPnLChart';
import { TradeModal } from '../components/TradeModal';
import { TradeDetailDrawer } from '../components/TradeDetailDrawer';
import {
  Wallet,
  TrendingUp,
  Percent,
  Shield,
  Plus,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<ChallengeSummary | null>(null);
  const [curve, setCurve] = useState<any[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [openPositions, setOpenPositions] = useState<Trade[]>([]);
  const [todayPlan, setTodayPlan] = useState<DailyTradingPlan | null>(null);
  const [market, setMarket] = useState<MarketOverview | null>(null);
  const [coachInsights, setCoachInsights] = useState<AICoachInsights | null>(null);

  const [loading, setLoading] = useState(true);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  const loadDashboardData = async () => {
    try {
      const [
        summaryRes,
        curveRes,
        tradesRes,
        positionsRes,
        marketRes,
        coachRes,
      ] = await Promise.all([
        challengeApi.getSummary(),
        challengeApi.getCurve(),
        tradesApi.getTrades({ page_size: 5 }),
        tradesApi.getOpenPositions(),
        marketApi.getOverview(),
        coachApi.getInsights(),
      ]);

      setSummary(summaryRes.data);
      setCurve(curveRes.data || []);
      const tList = tradesRes.data.results || tradesRes.data;
      setRecentTrades(Array.isArray(tList) ? tList : []);
      setOpenPositions(positionsRes.data || []);
      setMarket(marketRes.data);
      setCoachInsights(coachRes.data);

      try {
        const planRes = await journalApi.getTodayPlan();
        setTodayPlan(planRes.data);
      } catch (err) {
        setTodayPlan(null);
      }
    } catch (err) {
      console.error('Dashboard loading error:', err);
      setMarket(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const totalTrades = (summary?.winning_days || 0) + (summary?.losing_days || 0) + (summary?.break_even_days || 0);
  const winRate =
    summary && summary.trading_days > 0
      ? Math.round((summary.winning_days / summary.trading_days) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner: Discipline Directive & Action */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-sky-950/40 via-slate-900/60 to-slate-900/40 border border-sky-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-sky-500/20 text-sky-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-400">
                Today's Discipline Focus:
              </span>
              <span className="text-xs font-bold text-white">
                {coachInsights?.todays_discipline?.headline || 'Capital Preservation First'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
              "{coachInsights?.todays_discipline?.directive || 'Execute according to predefined rules and let your edge play out over a statistical series.'}"
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsTradeModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow-lg shadow-emerald-900/30 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Record Trade</span>
        </button>
      </div>

      {/* Row 1: Key Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Current Capital"
          value={`₹${(summary?.current_capital || 15000).toLocaleString('en-IN', {
            maximumFractionDigits: 0,
          })}`}
          subtitle={`Target: ₹${(summary?.target_capital || 135000).toLocaleString('en-IN')}`}
          variant="accent"
        />

        <StatCard
          title="Today's P&L"
          value={`${(summary?.today_pnl || 0) >= 0 ? '+' : ''}₹${(summary?.today_pnl || 0).toLocaleString(
            'en-IN',
            { minimumFractionDigits: 2 }
          )}`}
          subtitle="Net after charges"
          variant={(summary?.today_pnl || 0) >= 0 ? 'profit' : 'loss'}
        />

        <StatCard
          title="Total Net P&L"
          value={`${(summary?.total_net_pnl || 0) >= 0 ? '+' : ''}₹${(
            summary?.total_net_pnl || 0
          ).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
          subtitle={`Gross: ₹${(summary?.total_gross_pnl || 0).toLocaleString('en-IN', {
            maximumFractionDigits: 0,
          })}`}
          variant={(summary?.total_net_pnl || 0) >= 0 ? 'profit' : 'loss'}
        />

        <StatCard
          title="Challenge Progress"
          value={`${summary?.progress_pct || 0}%`}
          subtitle={`Remaining: ₹${(summary?.remaining_profit || 120000).toLocaleString('en-IN')}`}
          variant="warning"
        />

        <StatCard
          title="Max Drawdown"
          value={`${summary?.max_drawdown_pct || 0}%`}
          subtitle={`₹${(summary?.max_drawdown_amount || 0).toLocaleString('en-IN', {
            maximumFractionDigits: 0,
          })}`}
          variant={(summary?.max_drawdown_pct || 0) > 6 ? 'loss' : 'default'}
        />

        <StatCard
          title="Day Win Rate"
          value={`${winRate}%`}
          subtitle={`${summary?.winning_days || 0}W - ${summary?.losing_days || 0}L (${
            summary?.trading_days || 0
          } Days)`}
          variant="default"
        />
      </div>

      {/* Row 2: Challenge Progress Bar */}
      <div className="p-4 rounded-xl bg-[#111622] border border-slate-800">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white uppercase font-mono">15k to 1.35L Challenge</span>
            <Badge variant="demo">₹15,000 → ₹1,35,000</Badge>
          </div>
          <div className="font-mono text-slate-400">
            <span className="text-emerald-400 font-bold">{summary?.progress_pct || 0}%</span> achieved
            (₹{(summary?.current_capital || 15000).toLocaleString('en-IN', { minimumFractionDigits: 2 })} / ₹1,35,000)
          </div>
        </div>
        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(2, Math.min(100, summary?.progress_pct || 0))}%` }}
          />
        </div>
      </div>

      {/* Row 3: Capital Curve Chart & Daily P&L */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-xl bg-[#111622] border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Capital Growth Trajectory
              </h2>
              <p className="text-xs text-slate-400">
                Starting ₹15,000 equity curve progression toward ₹1,35,000 target
              </p>
            </div>
            <Link
              to="/challenge"
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
            >
              Challenge Details <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <CapitalCurveChart
            data={curve}
            startingCapital={summary?.starting_capital || 15000}
            targetCapital={summary?.target_capital || 135000}
            height={260}
          />
        </div>

        <div className="p-5 rounded-xl bg-[#111622] border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Daily P&L Distribution
              </h2>
              <Link
                to="/analytics"
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
              >
                Analytics <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Net profit/loss per session
            </p>
            <DailyPnLChart
              data={curve.filter((c) => c.daily_pnl !== 0).map((c) => ({ date: c.date, pnl: c.daily_pnl }))}
              height={200}
            />
          </div>

          <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2 rounded bg-slate-900/60">
              <div className="text-slate-500 text-[10px]">Best Day</div>
              <div className="text-emerald-400 font-bold">
                +₹{(summary?.best_day || 0).toLocaleString('en-IN')}
              </div>
            </div>
            <div className="p-2 rounded bg-slate-900/60">
              <div className="text-slate-500 text-[10px]">Worst Day</div>
              <div className="text-rose-400 font-bold">
                ₹{(summary?.worst_day || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Open Positions & Today's Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Positions & Recent Trades */}
        <div className="lg:col-span-2 space-y-6">
          {openPositions.length > 0 && (
            <div className="p-5 rounded-xl bg-sky-950/20 border border-sky-500/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Open Positions ({openPositions.length})
                </span>
                <span className="text-xs text-slate-400 font-mono">Real-time tracking</span>
              </div>
              <div className="divide-y divide-slate-800">
                {openPositions.map((pos) => (
                  <div
                    key={pos.id}
                    onClick={() => setSelectedTrade(pos)}
                    className="py-2.5 flex items-center justify-between text-xs cursor-pointer hover:bg-slate-900/40 px-2 rounded"
                  >
                    <div>
                      <span className="font-bold text-slate-200">{pos.symbol}</span>
                      <span className="ml-2 font-mono text-slate-400">{pos.quantity} units</span>
                    </div>
                    <div className="font-mono text-right">
                      <div>Entry: ₹{pos.entry_price}</div>
                      <div className="text-sky-400">SL: ₹{pos.stop_loss} | Tgt: ₹{pos.target}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Trades Table */}
          <div className="p-5 rounded-xl bg-[#111622] border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                  Recent Executions
                </h2>
                <p className="text-xs text-slate-400">
                  Last closed option trades with risk & psychology tags
                </p>
              </div>
              <Link
                to="/trades"
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
              >
                Full Trade Journal <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-mono">
                    <th className="pb-2.5">Date / Time</th>
                    <th className="pb-2.5">Symbol</th>
                    <th className="pb-2.5">Side</th>
                    <th className="pb-2.5">Qty</th>
                    <th className="pb-2.5">Entry/Exit</th>
                    <th className="pb-2.5 text-right">Net P&L</th>
                    <th className="pb-2.5 text-right">Psychology</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {recentTrades.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTrade(t)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 text-slate-400">
                        {t.date} <span className="text-[10px] text-slate-500">{t.time?.slice(0, 5)}</span>
                      </td>
                      <td className="py-2.5 font-bold text-slate-200">{t.symbol}</td>
                      <td className="py-2.5">
                        <Badge variant={t.side === 'BUY' ? 'profit' : 'loss'}>
                          {t.side}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-slate-300">{t.quantity}</td>
                      <td className="py-2.5 text-slate-300">
                        ₹{t.entry_price} → ₹{t.exit_price || '-'}
                      </td>
                      <td
                        className={`py-2.5 text-right font-bold ${
                          t.net_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {t.net_pnl >= 0 ? '+' : ''}₹{t.net_pnl.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 text-right">
                        <Badge variant={t.rule_followed ? 'info' : 'warning'}>
                          {t.psychology}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Today's Plan & Market Snapshot */}
        <div className="space-y-6">
          {/* Today's Trading Plan Card */}
          <div className="p-5 rounded-xl bg-[#111622] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Today's Plan
              </h2>
              <Link
                to="/trading-plan"
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold"
              >
                Edit Plan
              </Link>
            </div>

            {todayPlan ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-400">Market Bias:</span>
                  <Badge
                    variant={
                      todayPlan.market_bias === 'BULLISH'
                        ? 'profit'
                        : todayPlan.market_bias === 'BEARISH'
                        ? 'loss'
                        : 'warning'
                    }
                  >
                    {todayPlan.market_bias}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono">
                  <div className="p-2 rounded bg-slate-900/40 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Profit Target</span>
                    <div className="text-emerald-400 font-bold">
                      ₹{todayPlan.daily_profit_target}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-900/40 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Max Daily Loss</span>
                    <div className="text-rose-400 font-bold">
                      ₹{todayPlan.max_daily_loss}
                    </div>
                  </div>
                </div>

                <div className="text-slate-300 text-xs">
                  <span className="text-slate-500 font-semibold">Avoid:</span> {todayPlan.avoid_conditions}
                </div>

                <div className="p-2 rounded bg-slate-900/40 text-[11px] text-slate-400 italic">
                  "{todayPlan.notes || 'Stick to trade plans without emotional interference.'}"
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                <p>No plan filed for today yet.</p>
                <Link
                  to="/trading-plan"
                  className="mt-2 inline-block px-3 py-1.5 rounded bg-sky-600/30 text-sky-300 border border-sky-500/40 font-semibold text-xs"
                >
                  File Today's Plan
                </Link>
              </div>
            )}
          </div>

          {/* Market Snapshot Ticker */}
          <div className="p-5 rounded-xl bg-[#111622] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                Market Pulse
              </h2>
              <Badge variant="demo">{market?.mode || 'DEMO DATA'}</Badge>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {market?.indices?.slice(0, 4).map((idx) => (
                <div
                  key={idx.symbol}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-900/40 border border-slate-800/80"
                >
                  <span className="font-semibold text-slate-200">{idx.symbol}</span>
                  <div className="text-right">
                    <div>₹{idx.ltp.toLocaleString('en-IN')}</div>
                    <div
                      className={`text-[10px] ${
                        idx.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {idx.change >= 0 ? '+' : ''}
                      {idx.change} ({idx.change_pct}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Link
              to="/market"
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center justify-center gap-1 pt-1"
            >
              Full Market Context <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <TradeModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        onTradeSaved={loadDashboardData}
      />

      <TradeDetailDrawer
        trade={selectedTrade}
        onClose={() => setSelectedTrade(null)}
      />
    </div>
  );
};
