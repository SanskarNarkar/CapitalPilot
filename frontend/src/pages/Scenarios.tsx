import React, { useState, useEffect } from 'react';
import { scenarioApi, challengeApi } from '../services/api';
import { ScenarioResponse, MonteCarloResponse } from '../types';
import { ScenarioChart } from '../charts/ScenarioChart';
import { MonteCarloChart } from '../charts/MonteCarloChart';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { TrendingUp, Dices, AlertTriangle, Play, Sliders } from 'lucide-react';

export const Scenarios: React.FC = () => {
  const [startingCap, setStartingCap] = useState(15000);
  const [winRate, setWinRate] = useState(58.0);
  const [avgWin, setAvgWin] = useState(1250);
  const [avgLoss, setAvgLoss] = useState(580);
  const [tradesPerDay, setTradesPerDay] = useState(2);
  const [tradingDays, setTradingDays] = useState(45);

  const [scenarioData, setScenarioData] = useState<ScenarioResponse | null>(null);
  const [scenarioLoading, setScenarioLoading] = useState(false);

  const [mcTrades, setMcTrades] = useState(60);
  const [mcSimulations, setMcSimulations] = useState(200);
  const [monteCarloData, setMonteCarloData] = useState<MonteCarloResponse | null>(null);
  const [mcLoading, setMcLoading] = useState(false);

  const loadInitialScenarios = async () => {
    setScenarioLoading(true);
    try {
      const res = await scenarioApi.calculateScenarios({
        starting_capital: startingCap,
        win_rate: winRate,
        avg_win: avgWin,
        avg_loss: avgLoss,
        trades_per_day: tradesPerDay,
        trading_days: tradingDays,
      });
      setScenarioData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setScenarioLoading(false);
    }
  };

  const handleRunMonteCarlo = async () => {
    setMcLoading(true);
    try {
      const res = await scenarioApi.runMonteCarlo({
        starting_capital: startingCap,
        win_rate: winRate,
        avg_win: avgWin,
        avg_loss: avgLoss,
        num_trades: mcTrades,
        num_simulations: mcSimulations,
      });
      setMonteCarloData(res.data);
    } catch (err) {
      alert('Monte Carlo simulation failed');
    } finally {
      setMcLoading(false);
    }
  };

  useEffect(() => {
    loadInitialScenarios();
    handleRunMonteCarlo();
  }, []);

  return (
    <div className="space-y-8">
      {/* Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-amber-950/25 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold uppercase tracking-wider block text-amber-300 mb-0.5">
            Statistical Modeling & Probability Disclaimer
          </span>
          The Scenario Engine and Monte Carlo simulator provide mathematical modeling based on statistical assumptions. They do not predict market direction, do not guarantee returns, and are purely intended for risk tolerance stress-testing.
        </div>
      </div>

      {/* Section 1: Scenario Engine */}
      <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-sky-500/20 text-sky-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Hypothetical Scenario Engine
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluates Conservative, Base Case, and Aggressive capital curves over {tradingDays} trading days
              </p>
            </div>
          </div>

          <button
            onClick={loadInitialScenarios}
            disabled={scenarioLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white transition-all shadow-lg shadow-sky-900/30"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{scenarioLoading ? 'Calculating...' : 'Recalculate Scenarios'}</span>
          </button>
        </div>

        {/* Input Parameters Row */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 grid grid-cols-2 md:grid-cols-6 gap-3 text-xs font-mono">
          <div>
            <label className="text-[10px] text-slate-500 uppercase block mb-1">Capital (₹)</label>
            <input
              type="number"
              value={startingCap}
              onChange={(e) => setStartingCap(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase block mb-1">Win Rate (%)</label>
            <input
              type="number"
              value={winRate}
              onChange={(e) => setWinRate(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase block mb-1">Avg Win (₹)</label>
            <input
              type="number"
              value={avgWin}
              onChange={(e) => setAvgWin(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase block mb-1">Avg Loss (₹)</label>
            <input
              type="number"
              value={avgLoss}
              onChange={(e) => setAvgLoss(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase block mb-1">Trades / Day</label>
            <input
              type="number"
              value={tradesPerDay}
              onChange={(e) => setTradesPerDay(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase block mb-1">Trading Days</label>
            <input
              type="number"
              value={tradingDays}
              onChange={(e) => setTradingDays(Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
            />
          </div>
        </div>

        {/* Outcome Cards */}
        {scenarioData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30">
              <div className="text-amber-400 text-xs uppercase font-bold">Conservative Trajectory</div>
              <div className="text-xl font-black text-amber-300 mt-1">
                ₹{scenarioData.summary.conservative_ending.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Lower win rate (-10%), larger slippage</div>
            </div>

            <div className="p-4 rounded-xl bg-sky-950/20 border border-sky-500/30">
              <div className="text-sky-400 text-xs uppercase font-bold">Base Case Trajectory</div>
              <div className="text-xl font-black text-sky-300 mt-1">
                ₹{scenarioData.summary.base_ending.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Statistical median based on edge parameters</div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
              <div className="text-emerald-400 text-xs uppercase font-bold">Aggressive Trajectory</div>
              <div className="text-xl font-black text-emerald-300 mt-1">
                ₹{scenarioData.summary.aggressive_ending.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Optimal conditions (+7% win rate, wider runners)</div>
            </div>
          </div>
        )}

        <ScenarioChart data={scenarioData?.trajectories || []} height={300} />
      </div>

      {/* Section 2: Monte Carlo Simulator */}
      <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
              <Dices className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Monte Carlo Multi-Path Simulator
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulates {mcSimulations} randomized trade sequences to quantify tail risk and target probability
              </p>
            </div>
          </div>

          <button
            onClick={handleRunMonteCarlo}
            disabled={mcLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-all shadow-lg shadow-purple-900/30"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{mcLoading ? 'Simulating...' : 'Run 250 Simulations'}</span>
          </button>
        </div>

        {/* Percentile Stats */}
        {monteCarloData && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-slate-500 uppercase text-[10px]">5th Percentile (Tail Risk)</div>
              <div className="text-lg font-bold text-rose-400 mt-0.5">
                ₹{monteCarloData.percentiles.p5_worst_case.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[10px] text-slate-500">Worst 5% luck scenario</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-slate-500 uppercase text-[10px]">50th Percentile (Median)</div>
              <div className="text-lg font-bold text-sky-400 mt-0.5">
                ₹{monteCarloData.percentiles.p50_median.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[10px] text-slate-500">Expected path midpoint</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-slate-500 uppercase text-[10px]">95th Percentile (Best Case)</div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">
                ₹{monteCarloData.percentiles.p95_best_case.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
              <div className="text-[10px] text-slate-500">Top 5% distribution run</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-slate-500 uppercase text-[10px]">Target Success Rate</div>
              <div className="text-lg font-bold text-amber-400 mt-0.5">
                {monteCarloData.probability_reaching_target}%
              </div>
              <div className="text-[10px] text-slate-500">Chance of reaching ₹1,35,000</div>
            </div>
          </div>
        )}

        <MonteCarloChart samplePaths={monteCarloData?.sample_paths || []} height={300} />
      </div>
    </div>
  );
};
