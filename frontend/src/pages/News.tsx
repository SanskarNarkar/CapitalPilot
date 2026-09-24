import React, { useState, useEffect } from 'react';
import { newsApi } from '../services/api';
import { NewsItem } from '../types';
import { Badge } from '../components/Badge';
import { Newspaper, ExternalLink, Filter, Clock, AlertCircle } from 'lucide-react';

export const News: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const categories = [
    'ALL',
    'NIFTY',
    'BANKNIFTY',
    'SENSEX',
    'RBI',
    'SEBI',
    'Federal Reserve',
    'Inflation',
    'Major economic events',
  ];

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await newsApi.getNews(selectedCategory);
      setNews(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-sky-950/20 via-slate-900/60 to-slate-900/40 border border-sky-500/20">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-sky-500/20 text-sky-400">
            <Newspaper className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white font-mono">Market News & Macro Radar</h1>
              <Badge variant="demo">LIVE RSS / DEMO ADAPTER</Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Curated market catalysts, central bank developments, regulatory circulars, and macro announcements
            </p>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 text-xs">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all font-semibold ${
              selectedCategory === cat
                ? 'bg-sky-500 text-white shadow-md shadow-sky-900/30'
                : 'bg-[#111622] border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* News Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {news.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-2xl bg-[#111622] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-slate-400 font-mono flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {item.published_at} • {item.source}
                </span>
                <Badge
                  variant={
                    item.impact === 'HIGH'
                      ? 'loss'
                      : item.impact === 'MEDIUM'
                      ? 'warning'
                      : 'neutral'
                  }
                >
                  {item.impact} IMPACT
                </Badge>
              </div>

              <h3 className="text-sm font-bold text-white leading-snug mb-2 hover:text-sky-300 transition-colors">
                <a href={item.url} target="_blank" rel="noopener noreferrer">
                  {item.headline}
                </a>
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed">
                {item.summary}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <Badge variant="info">{item.category}</Badge>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 text-[11px]"
              >
                <span>Read Full Coverage</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
