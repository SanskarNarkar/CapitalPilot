import numpy as np
from decimal import Decimal

class ScenarioEngineService:
    @staticmethod
    def calculate_scenarios(
        starting_capital: float,
        win_rate: float,
        avg_win: float,
        avg_loss: float,
        trades_per_day: int,
        trading_days: int
    ):
        """
        Calculates Conservative, Base, and Aggressive capital trajectories.
        Strictly labeled as hypothetical scenarios, NOT predictions.
        """
        def calc_daily_expectancy(wr, aw, al, tpd):
            w_prob = wr / 100.0
            l_prob = 1.0 - w_prob
            trade_exp = (w_prob * aw) - (l_prob * al)
            return trade_exp * tpd

        # 1. Base Scenario
        base_daily_exp = calc_daily_expectancy(win_rate, avg_win, avg_loss, trades_per_day)
        
        # 2. Conservative: Lower win rate (-10%), smaller wins (-15%), larger losses (+15%)
        cons_wr = max(20.0, win_rate - 10.0)
        cons_aw = avg_win * 0.85
        cons_al = avg_loss * 1.15
        cons_daily_exp = calc_daily_expectancy(cons_wr, cons_aw, cons_al, trades_per_day)

        # 3. Aggressive: Higher win rate (+7%), larger wins (+15%), smaller losses (-10%)
        agg_wr = min(85.0, win_rate + 7.0)
        agg_aw = avg_win * 1.15
        agg_al = avg_loss * 0.90
        agg_daily_exp = calc_daily_expectancy(agg_wr, agg_aw, agg_al, trades_per_day)

        trajectories = []
        c_cap = starting_capital
        b_cap = starting_capital
        a_cap = starting_capital

        for day in range(trading_days + 1):
            trajectories.append({
                'day': day,
                'conservative': round(max(0.0, c_cap), 2),
                'base': round(max(0.0, b_cap), 2),
                'aggressive': round(max(0.0, a_cap), 2)
            })
            c_cap += cons_daily_exp
            b_cap += base_daily_exp
            a_cap += agg_daily_exp

        return {
            'disclaimer': 'HYPOTHETICAL SCENARIOS ONLY. NOT A GUARANTEE OR PREDICTION OF FUTURE OUTCOMES.',
            'parameters': {
                'starting_capital': starting_capital,
                'win_rate': win_rate,
                'avg_win': avg_win,
                'avg_loss': avg_loss,
                'trades_per_day': trades_per_day,
                'trading_days': trading_days
            },
            'summary': {
                'conservative_ending': trajectories[-1]['conservative'],
                'base_ending': trajectories[-1]['base'],
                'aggressive_ending': trajectories[-1]['aggressive'],
                'base_daily_expectancy': round(base_daily_exp, 2)
            },
            'trajectories': trajectories
        }

    @staticmethod
    def run_monte_carlo(
        starting_capital: float,
        win_rate: float,
        avg_win: float,
        avg_loss: float,
        num_trades: int = 60,
        num_simulations: int = 250
    ):
        """
        Runs Monte Carlo trade path simulation based on user performance parameters.
        Returns percentile distributions and representative sample paths.
        """
        win_prob = win_rate / 100.0
        ending_capitals = []
        max_drawdowns = []
        sample_paths = []

        # Run simulations
        for sim_idx in range(num_simulations):
            # Generate random outcomes
            random_draws = np.random.random(num_trades)
            # P&L for each trade
            trade_pnls = np.where(random_draws < win_prob, avg_win, -avg_loss)
            
            equity_curve = np.zeros(num_trades + 1)
            equity_curve[0] = starting_capital
            
            peak = starting_capital
            max_dd = 0.0

            for i, pnl in enumerate(trade_pnls):
                current = max(0.0, equity_curve[i] + pnl)
                equity_curve[i + 1] = current
                if current > peak:
                    peak = current
                dd = peak - current
                if dd > max_dd:
                    max_dd = dd

            ending_capitals.append(equity_curve[-1])
            max_drawdowns.append(max_dd)

            # Keep 10 sample paths for charting
            if sim_idx < 10:
                sample_paths.append([round(val, 2) for val in equity_curve.tolist()])

        ending_capitals = np.array(ending_capitals)
        max_drawdowns = np.array(max_drawdowns)

        p5 = float(np.percentile(ending_capitals, 5))
        p25 = float(np.percentile(ending_capitals, 25))
        p50 = float(np.percentile(ending_capitals, 50)) # Median
        p75 = float(np.percentile(ending_capitals, 75))
        p95 = float(np.percentile(ending_capitals, 95))

        median_dd = float(np.median(max_drawdowns))
        worst_dd = float(np.max(max_drawdowns))

        # Target threshold success rate (₹135,000 challenge target)
        target_capital = 135000.0
        success_rate = round(float(np.mean(ending_capitals >= target_capital)) * 100, 1)

        return {
            'disclaimer': 'MONTE CARLO SIMULATION RESULTS ONLY. STRICTLY PROBABILISTIC MODELING, NOT PERFORMANCE PREDICTION.',
            'num_simulations': num_simulations,
            'num_trades': num_trades,
            'percentiles': {
                'p5_worst_case': round(p5, 2),
                'p25_lower_quartile': round(p25, 2),
                'p50_median': round(p50, 2),
                'p75_upper_quartile': round(p75, 2),
                'p95_best_case': round(p95, 2)
            },
            'drawdown_stats': {
                'median_drawdown': round(median_dd, 2),
                'worst_case_drawdown': round(worst_dd, 2)
            },
            'probability_reaching_target': success_rate,
            'sample_paths': sample_paths
        }
