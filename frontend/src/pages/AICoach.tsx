import React, { useState, useEffect } from 'react';
import { coachApi } from '../services/api';
import { AICoachInsights, AICoachReviews } from '../types';
import { Badge } from '../components/Badge';
import { StatCard } from '../components/StatCard';
import {
  Brain,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Flame,
  Award,
  Clock,
  Shield,
  HelpCircle,
} from 'lucide-react';

export const AICoach: React.FC = () => {
  const [insights, setInsights] = useState<AICoachInsights | null>(null);
  const [reviews, setReviews] = useState<AICoachReviews | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([coachApi.getInsights(), coachApi.getReviews()])
      .then(([insRes, revRes]) => {
        setInsights(insRes.data);
        setReviews(revRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-purple-950/20 via-slate-900/60 to-slate-900/40 border border-purple-500/20">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white font-mono">
                AI Trading Coach & Performance Auditor
              </h1>
              <Badge variant="profit">EMPIRICAL DATA ENGINE</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic behavioral auditing based on your actual execution records and psychology mistakes
            </p>
          </div>
        </div>
      </div>

      {/* Today's Discipline Directive */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-950/40 via-purple-950/30 to-slate-900/60 border border-sky-500/30 flex items-start gap-4">
        <div className="p-3 rounded-xl bg-sky-500/20 text-sky-400 shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="text-xs font-bold uppercase tracking-wider text-sky-400">
            Today's Core Discipline Directive
          </div>
          <h2 className="text-lg font-bold text-white">
            {insights?.todays_discipline?.headline || 'Patience and Capital Preservation'}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            "{insights?.todays_discipline?.directive || 'Trade strictly according to your defined edge and accept normal variance without revenge trading.'}"
          </p>
        </div>
      </div>

      {/* Row 1: Key Behavioral Diagnostics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
        <StatCard
          title="Plan Adherence"
          value={`${insights?.rule_adherence_pct || 0}%`}
          subtitle="Trades executed per rules"
          variant={(insights?.rule_adherence_pct || 0) >= 80 ? 'profit' : 'warning'}
        />

        <StatCard
          title="Trades / Day"
          value={`${insights?.avg_trades_per_day || 0}`}
          subtitle={`${insights?.overtrading_days_count || 0} overtrading sessions`}
          variant={(insights?.overtrading_days_count || 0) > 2 ? 'loss' : 'default'}
        />

        <StatCard
          title="Risk Escalation"
          value={`${insights?.risk_escalation_incidents || 0}x`}
          subtitle="Sizing up after a loss"
          variant={(insights?.risk_escalation_incidents || 0) > 0 ? 'loss' : 'profit'}
        />

        <StatCard
          title="Analyzed Sample"
          value={`${insights?.total_trades_analyzed || 0} trades`}
          subtitle="Empirical database sample"
          variant="accent"
        />
      </div>

      {/* Row 2: Diagnostics Q&A Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Setup Edge Diagnostic */}
        <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Which setups perform best & worst for me?</span>
          </h2>

          <div className="space-y-3 font-mono text-xs">
            {insights?.best_setup ? (
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-emerald-400 uppercase font-bold">Top Performing Setup</div>
                  <div className="text-sm font-bold text-white mt-0.5">{insights.best_setup.setup}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    {insights.best_setup.trades} trades • {insights.best_setup.win_rate}% Win Rate
                  </div>
                </div>
                <div className="text-emerald-400 font-bold text-base">
                  +₹{insights.best_setup.pnl.toLocaleString('en-IN')}
                </div>
              </div>
            ) : (
              <div className="text-slate-500 text-xs p-3">Building setup sample size...</div>
            )}

            {insights?.worst_setup && (
              <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-rose-400 uppercase font-bold">Underperforming Setup</div>
                  <div className="text-sm font-bold text-white mt-0.5">{insights.worst_setup.setup}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    {insights.worst_setup.trades} trades • {insights.worst_setup.win_rate}% Win Rate
                  </div>
                </div>
                <div className="text-rose-400 font-bold text-base">
                  ₹{insights.worst_setup.pnl.toLocaleString('en-IN')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Time of Day Diagnostic */}
        <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <span>What time of day works best?</span>
          </h2>

          <div className="space-y-3 font-mono text-xs">
            {insights?.best_time_slot && (
              <div className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-500/30 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-sky-400 uppercase font-bold">Optimal Execution Window</div>
                  <div className="text-sm font-bold text-white mt-0.5">{insights.best_time_slot.slot}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    {insights.best_time_slot.trades} trades executed in this interval
                  </div>
                </div>
                <div className="text-emerald-400 font-bold text-base">
                  +₹{insights.best_time_slot.pnl.toLocaleString('en-IN')}
                </div>
              </div>
            )}

            {insights?.worst_time_slot && (
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">Chop / Loss Interval</div>
                  <div className="text-sm font-bold text-slate-200 mt-0.5">{insights.worst_time_slot.slot}</div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    Consider avoiding entries during this window
                  </div>
                </div>
                <div className="text-rose-400 font-bold text-base">
                  ₹{insights.worst_time_slot.pnl.toLocaleString('en-IN')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Periodic Reviews (Daily, Weekly, Monthly) */}
      <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800 space-y-5">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">
          Audited Periodic Reviews
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          {/* Daily Review */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white text-sm">Today's Session</span>
              <Badge variant="info">DAILY AUDIT</Badge>
            </div>
            <div className="font-mono space-y-1">
              <div>Trades Taken: {reviews?.daily?.trades_count || 0}</div>
              <div>
                Net P&L:{' '}
                <span className={(reviews?.daily?.net_pnl || 0) >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {(reviews?.daily?.net_pnl || 0) >= 0 ? '+' : ''}₹{reviews?.daily?.net_pnl || 0}
                </span>
              </div>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {reviews?.daily?.assessment || 'No trades executed today.'}
            </p>
          </div>

          {/* Weekly Review */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white text-sm">Weekly Audit</span>
              <Badge variant="profit">LAST 7 DAYS</Badge>
            </div>
            <div className="font-mono space-y-1">
              <div>Trades: {reviews?.weekly?.trades_count || 0} (Win: {reviews?.weekly?.win_rate || 0}%)</div>
              <div>
                Net P&L:{' '}
                <span className={(reviews?.weekly?.net_pnl || 0) >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {(reviews?.weekly?.net_pnl || 0) >= 0 ? '+' : ''}₹{reviews?.weekly?.net_pnl || 0}
                </span>
              </div>
              <div>Violations: {reviews?.weekly?.rule_violations || 0}</div>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {reviews?.weekly?.key_takeaway || 'Maintain trade selectivity.'}
            </p>
          </div>

          {/* Monthly Review */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-white text-sm">Monthly Audit</span>
              <Badge variant="warning">LAST 30 DAYS</Badge>
            </div>
            <div className="font-mono space-y-1">
              <div>Total Trades: {reviews?.monthly?.trades_count || 0}</div>
              <div>Win Rate: {reviews?.monthly?.win_rate || 0}%</div>
              <div>
                Challenge Contribution:{' '}
                <span className="text-emerald-400 font-bold">
                  +₹{reviews?.monthly?.challenge_contribution || 0}
                </span>
              </div>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Steady progression toward ₹1,35,000 target capital.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
