import React, { useState, useEffect } from 'react';
import { marketApi } from '../services/api';
import { MarketOverview } from '../types';
import { Badge } from '../components/Badge';
import { Globe, TrendingUp, TrendingDown, RefreshCw, BarChart2, Shield } from 'lucide-react';

export const MarketContext: React.FC = () => {
  const [market, setMarket] = useState<MarketOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMarket = async () => {
    setLoading(true);
    try {
      const res = await marketApi.getOverview();
      setMarket(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarket();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-sky-950/20 via-slate-900/60 to-slate-900/40 border border-sky-500/20">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-sky-500/20 text-sky-400">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white font-mono">Market Context Terminal</h1>
              <Badge variant="demo">{market?.mode || 'DEMO DATA'}</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Multi-asset macro context, index technicals, global cues, and institutional FII/DII positioning
            </p>
          </div>
        </div>

        <button
          onClick={fetchMarket}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          <span>Refresh Ticker</span>
        </button>
      </div>

      {/* Primary Indices Grid */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Domestic Indian Benchmarks & Sentiment Gauges
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {market?.indices?.map((idx) => {
            const isPos = idx.change >= 0;
            return (
              <div
                key={idx.symbol}
                className="p-5 rounded-xl bg-[#111622] border border-slate-800 hover:border-slate-700 transition-all font-mono space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-sm">{idx.symbol}</span>
                  <Badge variant={isPos ? 'profit' : 'loss'}>
                    {idx.sentiment || (isPos ? 'BULLISH' : 'BEARISH')}
                  </Badge>
                </div>
                <div className="text-2xl font-black text-white">
                  ₹{idx.ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
                  <span className={isPos ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {isPos ? '+' : ''}{idx.change} ({idx.change_pct}%)
                  </span>
                  <span className="text-[11px] text-slate-500">{idx.trend || 'Intraday'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Row: Global Markets & FII / DII Flows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global Markets Snapshot */}
        <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Global Market Cues
            </h2>
            <Badge variant="neutral">OVERNIGHT / SESSIONS</Badge>
          </div>

          <div className="divide-y divide-slate-800 font-mono text-xs">
            {market?.global_markets?.map((g) => (
              <div key={g.name} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200">{g.name}</span>
                  <span className="ml-2 text-slate-500 text-[11px]">{g.status}</span>
                </div>
                <div className="text-right">
                  <div className="text-slate-200">{g.ltp.toLocaleString()}</div>
                  <div className={g.change_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {g.change_pct >= 0 ? '+' : ''}{g.change_pct}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FII / DII Net Flow Intelligence */}
        <div className="p-6 rounded-2xl bg-[#111622] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Institutional Participant Activity (FII / DII)
            </h2>
            <Badge variant="profit">{market?.fii_dii?.date || 'Latest Session'}</Badge>
          </div>

          {market?.fii_dii && (
            <div className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-slate-500 text-[10px] uppercase">FII Net Cash</div>
                  <div
                    className={`text-lg font-bold mt-1 ${
                      market.fii_dii.fii_net >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {market.fii_dii.fii_net >= 0 ? '+' : ''}₹{market.fii_dii.fii_net} Cr
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Buy: ₹{market.fii_dii.fii_cash_buy} | Sell: ₹{market.fii_dii.fii_cash_sell}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="text-slate-500 text-[10px] uppercase">DII Net Cash</div>
                  <div
                    className={`text-lg font-bold mt-1 ${
                      market.fii_dii.dii_net >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {market.fii_dii.dii_net >= 0 ? '+' : ''}₹{market.fii_dii.dii_net} Cr
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Buy: ₹{market.fii_dii.dii_cash_buy} | Sell: ₹{market.fii_dii.dii_cash_sell}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">FII Index Futures OI Ratio:</span>
                <span className="font-bold text-sky-400">{market.fii_dii.fii_index_futures_oi_ratio}</span>
              </div>

              <div className="p-3 rounded-lg bg-sky-950/20 border border-sky-500/20 text-sky-300 text-xs">
                {market.fii_dii.summary}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
