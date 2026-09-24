export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile?: {
    phone: string;
    dhan_client_id: string;
    default_index: string;
    experience_level: string;
  };
}

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
  message?: string;
}

export interface ChallengeSummary {
  challenge_id: number;
  name: string;
  starting_capital: number;
  current_capital: number;
  target_capital: number;
  target_profit: number;
  remaining_profit: number;
  progress_pct: number;
  total_net_pnl: number;
  total_gross_pnl: number;
  total_charges: number;
  today_pnl: number;
  trading_days: number;
  winning_days: number;
  losing_days: number;
  break_even_days: number;
  best_day: number;
  worst_day: number;
  current_streak: number;
  max_drawdown_amount: number;
  max_drawdown_pct: number;
  is_active: boolean;
  start_date: string;
}

export interface CapitalCurvePoint {
  date: string;
  capital: number;
  daily_pnl: number;
  cumulative_pnl: number;
  drawdown: number;
  trades_count: number;
}

export interface Trade {
  id: number;
  trade_id: string;
  dhan_order_id?: string;
  dhan_trade_id?: string;
  date: string;
  time: string;
  exit_time?: string;
  index: 'NIFTY' | 'BANKNIFTY' | 'SENSEX' | 'FINNIFTY' | 'MIDCPNIFTY';
  symbol: string;
  security_id: string;
  instrument: string;
  option_type: 'CE' | 'PE' | 'NONE';
  strike?: number;
  expiry?: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  entry_price: number;
  exit_price?: number;
  stop_loss: number;
  target: number;
  gross_pnl: number;
  charges: number;
  net_pnl: number;
  broker_reported_pnl?: number;
  risk_amount: number;
  rr_ratio: number;
  setup?: number;
  setup_name?: string;
  entry_reason: string;
  exit_reason: string;
  psychology: 'CALM' | 'CONFIDENT' | 'FEAR' | 'GREED' | 'FOMO' | 'REVENGE' | 'UNCERTAIN';
  emotion: string;
  rule_followed: boolean;
  mistake: string;
  notes: string;
  screenshot_url?: string;
  status: 'OPEN' | 'CLOSED';
}

export interface Setup {
  id: number;
  name: string;
  description: string;
  entry_conditions: string;
  stop_loss_rules: string;
  target_rules: string;
  min_rr: number;
  applicable_index: string;
  is_active: boolean;
  stats?: {
    total_trades: number;
    wins: number;
    losses: number;
    win_rate: number;
    avg_win: number;
    avg_loss: number;
    total_pnl: number;
    profit_factor: number;
    expectancy: number;
  };
}

export interface DailyTradingPlan {
  id?: number;
  date: string;
  starting_capital: number;
  daily_profit_target: number;
  max_daily_loss: number;
  max_trades: number;
  risk_per_trade_pct: number;
  max_risk_amount: number;
  primary_index: string;
  secondary_index: string;
  preferred_setups: string;
  avoid_conditions: string;
  market_bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'VOLATILE';
  important_events: string;
  notes: string;
  plan_followed: boolean;
  trades_count?: number;
  actual_pnl?: number;
}

export interface GlobalRiskSettings {
  id?: number;
  risk_per_trade_pct: number;
  max_daily_loss_pct: number;
  max_consecutive_losses: number;
  max_trades_per_day: number;
  min_rr_ratio: number;
  max_drawdown_pct: number;
  is_firewall_enabled: boolean;
}

export interface IndexRiskProfile {
  id?: number;
  index: string;
  risk_per_trade_pct: number;
  max_daily_loss_pct: number;
  max_trades: number;
  min_rr: number;
  preferred_setups: string;
  trading_session_start: string;
  trading_session_end: string;
  max_position_lots: number;
  lot_size: number;
  is_active: boolean;
}

export interface InstrumentLotSize {
  id: number;
  index: string;
  lot_size: number;
  effective_date: string;
  is_active: boolean;
  notes: string;
}

export interface FirewallRuleResult {
  rule: string;
  status: 'PASS' | 'FAIL';
  message: string;
}

export interface FirewallResponse {
  status: 'ALLOWED' | 'BLOCKED';
  is_allowed: boolean;
  required_risk: number;
  remaining_daily_risk: number;
  excess_risk: number;
  rules: FirewallRuleResult[];
  failed_rules_count: number;
}

export interface PositionSizeResult {
  index: string;
  lot_size: number;
  risk_per_unit: number;
  allowed_risk_amount: number;
  capital_considered: number;
  risk_pct_used: number;
  recommended_lots: number;
  recommended_quantity: number;
  actual_risk_amount: number;
  risk_per_lot: number;
  error?: string;
}

export interface MarketIndexItem {
  symbol: string;
  ltp: number;
  change: number;
  change_pct: number;
  high?: number;
  low?: number;
  sentiment?: string;
  trend?: string;
}

export interface MarketOverview {
  is_demo: boolean;
  mode: string;
  indices: MarketIndexItem[];
  global_markets: Array<{ name: string; ltp: number; change_pct: number; status: string }>;
  fii_dii: {
    date: string;
    fii_cash_buy: number;
    fii_cash_sell: number;
    fii_net: number;
    dii_cash_buy: number;
    dii_cash_sell: number;
    dii_net: number;
    fii_index_futures_oi_ratio: string;
    summary: string;
  };
}

export interface NewsItem {
  id: number;
  headline: string;
  source: string;
  published_at: string;
  category: string;
  url: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  summary: string;
}

export interface AnalyticsSummary {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  total_net_pnl: number;
  gross_profit: number;
  gross_loss: number;
  total_charges: number;
  avg_win: number;
  avg_loss: number;
  profit_factor: number;
  expectancy: number;
  max_drawdown: number;
  max_drawdown_pct: number;
  avg_rr_ratio: number;
  avg_risk: number;
  max_risk: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  capital_curve: Array<{ date: string; capital: number; pnl: number }>;
  daily_pnl: Array<{ date: string; pnl: number; trades: number }>;
  cumulative_pnl: Array<{ date: string; cumulative_pnl: number }>;
  index_performance: Array<{ index: string; trades: number; wins: number; losses: number; win_rate: number; total_pnl: number }>;
  setup_performance: Array<{ setup: string; trades: number; wins: number; losses: number; win_rate: number; total_pnl: number }>;
  time_of_day_performance: Array<{ slot: string; trades: number; wins: number; win_rate: number; total_pnl: number }>;
  psychology_performance: {
    emotions: Array<{ emotion: string; trades: number; wins: number; win_rate: number; total_pnl: number }>;
    rule_followed: { count: number; net_pnl: number };
    rule_violated: { count: number; net_pnl: number };
  };
  mistakes_breakdown: Array<{ mistake: string; code: string; count: number; total_pnl: number }>;
}

export interface ScenarioResponse {
  disclaimer: string;
  parameters: any;
  summary: {
    conservative_ending: number;
    base_ending: number;
    aggressive_ending: number;
    base_daily_expectancy: number;
  };
  trajectories: Array<{
    day: number;
    conservative: number;
    base: number;
    aggressive: number;
  }>;
}

export interface MonteCarloResponse {
  disclaimer: string;
  num_simulations: number;
  num_trades: number;
  percentiles: {
    p5_worst_case: number;
    p25_lower_quartile: number;
    p50_median: number;
    p75_upper_quartile: number;
    p95_best_case: number;
  };
  drawdown_stats: {
    median_drawdown: number;
    worst_case_drawdown: number;
  };
  probability_reaching_target: number;
  sample_paths: number[][];
}

export interface AICoachInsights {
  has_enough_data: boolean;
  message?: string;
  total_trades_analyzed?: number;
  rule_adherence_pct?: number;
  avg_trades_per_day?: number;
  overtrading_days_count?: number;
  risk_escalation_incidents?: number;
  top_mistakes?: Array<{ mistake: string; count: number; cost: number }>;
  best_setup?: { setup: string; trades: number; win_rate: number; pnl: number };
  worst_setup?: { setup: string; trades: number; win_rate: number; pnl: number };
  best_time_slot?: { slot: string; trades: number; pnl: number };
  worst_time_slot?: { slot: string; trades: number; pnl: number };
  todays_discipline: {
    headline: string;
    directive: string;
  };
}

export interface AICoachReviews {
  daily: {
    period: string;
    trades_count: number;
    net_pnl: number;
    win_rate: number;
    plan_recorded: boolean;
    plan_adherence: boolean;
    assessment: string;
  };
  weekly: {
    period: string;
    trades_count: number;
    net_pnl: number;
    win_rate: number;
    rule_violations: number;
    key_takeaway: string;
  };
  monthly: {
    period: string;
    trades_count: number;
    net_pnl: number;
    win_rate: number;
    challenge_contribution: number;
  };
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  notification_type: 'RISK' | 'SYNC' | 'RECONCILE' | 'MILESTONE' | 'REVIEW' | 'SYSTEM';
  is_read: boolean;
  created_at: string;
}
