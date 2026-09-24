from decimal import Decimal
from django.db.models import Sum, Avg, Max, Count, Q
from apps.trades.models import Trade
from apps.challenge.models import ChallengeConfig

class AnalyticsService:
    @staticmethod
    def get_full_analytics(user):
        closed_trades = Trade.objects.filter(user=user, status='CLOSED').order_by('date', 'time', 'id')
        total_trades = closed_trades.count()

        challenge = ChallengeConfig.objects.filter(user=user, is_active=True).first()
        starting_capital = challenge.starting_capital if challenge else Decimal('15000.00')

        if total_trades == 0:
            return {
                'summary': {
                    'total_trades': 0,
                    'winning_trades': 0,
                    'losing_trades': 0,
                    'win_rate': 0.0,
                    'total_net_pnl': 0.0,
                    'gross_profit': 0.0,
                    'gross_loss': 0.0,
                    'total_charges': 0.0,
                    'avg_win': 0.0,
                    'avg_loss': 0.0,
                    'profit_factor': 0.0,
                    'expectancy': 0.0,
                    'max_drawdown': 0.0,
                    'max_drawdown_pct': 0.0,
                    'avg_rr_ratio': 0.0,
                    'avg_risk': 0.0,
                    'max_risk': 0.0
                },
                'capital_curve': [],
                'daily_pnl': [],
                'cumulative_pnl': [],
                'index_performance': [],
                'setup_performance': [],
                'time_of_day_performance': [],
                'psychology_performance': {},
                'mistakes_breakdown': []
            }

        winning_trades = closed_trades.filter(net_pnl__gt=0)
        losing_trades = closed_trades.filter(net_pnl__lt=0)
        
        win_count = winning_trades.count()
        loss_count = losing_trades.count()
        win_rate = round((win_count / total_trades) * 100, 2)
        loss_rate = round((loss_count / total_trades) * 100, 2)

        gross_profit = winning_trades.aggregate(s=Sum('net_pnl'))['s'] or Decimal('0.00')
        gross_loss = abs(losing_trades.aggregate(s=Sum('net_pnl'))['s'] or Decimal('0.00'))
        total_net_pnl = closed_trades.aggregate(s=Sum('net_pnl'))['s'] or Decimal('0.00')
        total_charges = closed_trades.aggregate(s=Sum('charges'))['s'] or Decimal('0.00')

        avg_win = round(gross_profit / Decimal(win_count), 2) if win_count > 0 else Decimal('0.00')
        avg_loss = round(gross_loss / Decimal(loss_count), 2) if loss_count > 0 else Decimal('0.00')

        profit_factor = round(gross_profit / gross_loss, 2) if gross_loss > 0 else (Decimal('99.00') if gross_profit > 0 else Decimal('0.00'))

        win_prob = Decimal(win_count) / Decimal(total_trades)
        loss_prob = Decimal(loss_count) / Decimal(total_trades)
        expectancy = round((win_prob * avg_win) - (loss_prob * avg_loss), 2)

        # Risk metrics
        avg_rr = closed_trades.aggregate(a=Avg('rr_ratio'))['a'] or Decimal('0.00')
        avg_risk = closed_trades.aggregate(a=Avg('risk_amount'))['a'] or Decimal('0.00')
        max_risk = closed_trades.aggregate(m=Max('risk_amount'))['m'] or Decimal('0.00')

        # Capital Curve & Drawdown calculation
        trades_by_date = {}
        for t in closed_trades:
            d_str = t.date.isoformat()
            if d_str not in trades_by_date:
                trades_by_date[d_str] = {'net_pnl': Decimal('0.00'), 'trades': 0}
            trades_by_date[d_str]['net_pnl'] += t.net_pnl
            trades_by_date[d_str]['trades'] += 1

        capital_curve = []
        daily_pnl = []
        cumulative_pnl = []

        running_cap = starting_capital
        peak_cap = starting_capital
        running_cum_pnl = Decimal('0.00')
        max_drawdown = Decimal('0.00')
        max_drawdown_pct = Decimal('0.00')

        for d_str in sorted(trades_by_date.keys()):
            day_pnl = trades_by_date[d_str]['net_pnl']
            running_cap += day_pnl
            running_cum_pnl += day_pnl
            
            if running_cap > peak_cap:
                peak_cap = running_cap
            dd = peak_cap - running_cap
            if dd > max_drawdown:
                max_drawdown = dd
                if peak_cap > 0:
                    max_drawdown_pct = round((dd / peak_cap) * Decimal('100.00'), 2)

            capital_curve.append({
                'date': d_str,
                'capital': float(running_cap),
                'pnl': float(day_pnl)
            })

            daily_pnl.append({
                'date': d_str,
                'pnl': float(day_pnl),
                'trades': trades_by_date[d_str]['trades']
            })

            cumulative_pnl.append({
                'date': d_str,
                'cumulative_pnl': float(running_cum_pnl)
            })

        # Index performance
        index_perf = []
        for idx in ['NIFTY', 'BANKNIFTY', 'SENSEX']:
            idx_trades = closed_trades.filter(index=idx)
            idx_count = idx_trades.count()
            if idx_count > 0:
                idx_wins = idx_trades.filter(net_pnl__gt=0).count()
                idx_pnl = idx_trades.aggregate(s=Sum('net_pnl'))['s'] or Decimal('0.00')
                index_perf.append({
                    'index': idx,
                    'trades': idx_count,
                    'wins': idx_wins,
                    'losses': idx_count - idx_wins,
                    'win_rate': round((idx_wins / idx_count) * 100, 1),
                    'total_pnl': float(idx_pnl)
                })

        # Setup performance
        setup_perf = []
        setups_seen = {}
        for t in closed_trades:
            s_name = t.setup.name if t.setup else 'Discretionary / Unassigned'
            if s_name not in setups_seen:
                setups_seen[s_name] = {'trades': 0, 'wins': 0, 'losses': 0, 'pnl': Decimal('0.00')}
            setups_seen[s_name]['trades'] += 1
            if t.net_pnl > 0:
                setups_seen[s_name]['wins'] += 1
            elif t.net_pnl < 0:
                setups_seen[s_name]['losses'] += 1
            setups_seen[s_name]['pnl'] += t.net_pnl

        for s_name, data in setups_seen.items():
            wr = round((data['wins'] / data['trades']) * 100, 1) if data['trades'] > 0 else 0.0
            setup_perf.append({
                'setup': s_name,
                'trades': data['trades'],
                'wins': data['wins'],
                'losses': data['losses'],
                'win_rate': wr,
                'total_pnl': float(data['pnl'])
            })
        setup_perf.sort(key=lambda x: x['total_pnl'], reverse=True)

        # Time of day performance buckets:
        # 09:15-10:00, 10:00-11:00, 11:00-12:00, 12:00-13:00, 13:00-14:00, 14:00-15:30
        buckets = [
            ('09:15-10:00', '09:15:00', '09:59:59'),
            ('10:00-11:00', '10:00:00', '10:59:59'),
            ('11:00-12:00', '11:00:00', '11:59:59'),
            ('12:00-13:00', '12:00:00', '12:59:59'),
            ('13:00-14:00', '13:00:00', '13:59:59'),
            ('14:00-15:30', '14:00:00', '15:30:00'),
        ]
        time_perf = []
        for label, start_t, end_t in buckets:
            b_trades = closed_trades.filter(time__gte=start_t, time__lte=end_t)
            b_count = b_trades.count()
            b_wins = b_trades.filter(net_pnl__gt=0).count()
            b_pnl = b_trades.aggregate(s=Sum('net_pnl'))['s'] or Decimal('0.00')
            time_perf.append({
                'slot': label,
                'trades': b_count,
                'wins': b_wins,
                'win_rate': round((b_wins / b_count) * 100, 1) if b_count > 0 else 0.0,
                'total_pnl': float(b_pnl)
            })

        # Psychology Performance:
        # Compare Normal/Calm vs FOMO vs Revenge vs Fear vs Greed
        psych_breakdown = []
        for em in ['CALM', 'CONFIDENT', 'FEAR', 'GREED', 'FOMO', 'REVENGE', 'UNCERTAIN']:
            e_trades = closed_trades.filter(psychology=em)
            e_count = e_trades.count()
            if e_count > 0:
                e_wins = e_trades.filter(net_pnl__gt=0).count()
                e_pnl = e_trades.aggregate(s=Sum('net_pnl'))['s'] or Decimal('0.00')
                psych_breakdown.append({
                    'emotion': em,
                    'trades': e_count,
                    'wins': e_wins,
                    'win_rate': round((e_wins / e_count) * 100, 1),
                    'total_pnl': float(e_pnl)
                })

        # Rule Adherence Impact
        rule_followed_trades = closed_trades.filter(rule_followed=True)
        rule_violated_trades = closed_trades.filter(rule_followed=False)
        followed_pnl = rule_followed_trades.aggregate(s=Sum('net_pnl'))['s'] or Decimal('0.00')
        violated_pnl = rule_violated_trades.aggregate(s=Sum('net_pnl'))['s'] or Decimal('0.00')

        # Mistakes Breakdown
        mistakes_data = []
        for m_choice, m_label in Trade.MISTAKE_CHOICES:
            if m_choice == 'NONE':
                continue
            m_trades = closed_trades.filter(mistake=m_choice)
            m_count = m_trades.count()
            if m_count > 0:
                m_loss = m_trades.aggregate(s=Sum('net_pnl'))['s'] or Decimal('0.00')
                mistakes_data.append({
                    'mistake': m_label,
                    'code': m_choice,
                    'count': m_count,
                    'total_pnl': float(m_loss)
                })
        mistakes_data.sort(key=lambda x: x['count'], reverse=True)

        return {
            'summary': {
                'total_trades': total_trades,
                'winning_trades': win_count,
                'losing_trades': loss_count,
                'win_rate': float(win_rate),
                'total_net_pnl': float(total_net_pnl),
                'gross_profit': float(gross_profit),
                'gross_loss': float(gross_loss),
                'total_charges': float(total_charges),
                'avg_win': float(avg_win),
                'avg_loss': float(avg_loss),
                'profit_factor': float(profit_factor),
                'expectancy': float(expectancy),
                'max_drawdown': float(max_drawdown),
                'max_drawdown_pct': float(max_drawdown_pct),
                'avg_rr_ratio': float(round(avg_rr, 2)),
                'avg_risk': float(round(avg_risk, 2)),
                'max_risk': float(round(max_risk, 2))
            },
            'capital_curve': capital_curve,
            'daily_pnl': daily_pnl,
            'cumulative_pnl': cumulative_pnl,
            'index_performance': index_perf,
            'setup_performance': setup_perf,
            'time_of_day_performance': time_perf,
            'psychology_performance': {
                'emotions': psych_breakdown,
                'rule_followed': {
                    'count': rule_followed_trades.count(),
                    'net_pnl': float(followed_pnl)
                },
                'rule_violated': {
                    'count': rule_violated_trades.count(),
                    'net_pnl': float(violated_pnl)
                }
            },
            'mistakes_breakdown': mistakes_data
        }
