from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, Count, Avg
from apps.trades.models import Trade
from apps.journal.models import DailyTradingPlan

class AICoachService:
    @staticmethod
    def analyze_user_performance(user):
        closed_trades = Trade.objects.filter(user=user, status='CLOSED').order_by('date', 'time', 'id')
        total_count = closed_trades.count()

        if total_count < 3:
            return {
                'has_enough_data': False,
                'message': 'Not enough historical data to generate full AI coaching analytics. Log at least 3 completed trades.',
                'todays_discipline': {
                    'headline': 'Capital Preservation First',
                    'directive': 'During the initial phase of your challenge, focus strictly on risk adherence and executing your defined edge. Keep risk per trade under 1%.'
                }
            }

        # 1. Recurring Mistakes Analysis
        mistake_counts = {}
        mistake_losses = {}
        for t in closed_trades:
            if t.mistake != 'NONE':
                label = t.get_mistake_display()
                mistake_counts[label] = mistake_counts.get(label, 0) + 1
                mistake_losses[label] = mistake_losses.get(label, Decimal('0.00')) + t.net_pnl

        top_mistakes = []
        for m, count in sorted(mistake_counts.items(), key=lambda x: x[1], reverse=True):
            top_mistakes.append({
                'mistake': m,
                'count': count,
                'cost': float(mistake_losses.get(m, 0.0))
            })

        # 2. Setup Ranking
        setup_stats = {}
        for t in closed_trades:
            s_name = t.setup.name if t.setup else 'Discretionary'
            if s_name not in setup_stats:
                setup_stats[s_name] = {'trades': 0, 'wins': 0, 'pnl': Decimal('0.00')}
            setup_stats[s_name]['trades'] += 1
            if t.net_pnl > 0:
                setup_stats[s_name]['wins'] += 1
            setup_stats[s_name]['pnl'] += t.net_pnl

        best_setup = None
        worst_setup = None
        sorted_setups = sorted(
            [
                {
                    'setup': k,
                    'trades': v['trades'],
                    'win_rate': round((v['wins'] / v['trades']) * 100, 1),
                    'pnl': float(v['pnl'])
                }
                for k, v in setup_stats.items() if v['trades'] >= 2
            ],
            key=lambda x: x['pnl'],
            reverse=True
        )

        if sorted_setups:
            best_setup = sorted_setups[0]
            worst_setup = sorted_setups[-1]

        # 3. Time of Day Performance
        buckets = [
            ('09:15-10:00', '09:15:00', '09:59:59'),
            ('10:00-11:00', '10:00:00', '10:59:59'),
            ('11:00-12:00', '11:00:00', '11:59:59'),
            ('12:00-13:00', '12:00:00', '12:59:59'),
            ('13:00-14:00', '13:00:00', '13:59:59'),
            ('14:00-15:30', '14:00:00', '15:30:00'),
        ]
        time_slot_stats = []
        for label, start_t, end_t in buckets:
            b_trades = closed_trades.filter(time__gte=start_t, time__lte=end_t)
            count = b_trades.count()
            if count > 0:
                pnl = b_trades.aggregate(s=Sum('net_pnl'))['s'] or Decimal('0.00')
                time_slot_stats.append({'slot': label, 'trades': count, 'pnl': float(pnl)})

        best_time_slot = max(time_slot_stats, key=lambda x: x['pnl']) if time_slot_stats else None
        worst_time_slot = min(time_slot_stats, key=lambda x: x['pnl']) if time_slot_stats else None

        # 4. Overtrading Diagnosis
        trades_per_day = {}
        for t in closed_trades:
            d_str = t.date.isoformat()
            trades_per_day[d_str] = trades_per_day.get(d_str, 0) + 1
        
        overtrading_days = sum(1 for c in trades_per_day.values() if c > 3)
        avg_trades_per_day = round(total_count / len(trades_per_day), 1) if trades_per_day else 0.0

        # 5. Risk Escalation (Increasing size after loss)
        risk_escalation_incidents = 0
        trades_list = list(closed_trades)
        for i in range(1, len(trades_list)):
            prev = trades_list[i - 1]
            curr = trades_list[i]
            if prev.date == curr.date and prev.net_pnl < 0 and curr.quantity > prev.quantity:
                risk_escalation_incidents += 1

        # 6. Rule Adherence
        rule_followed_count = closed_trades.filter(rule_followed=True).count()
        adherence_pct = round((rule_followed_count / total_count) * 100, 1)

        # 7. Today's Discipline Directive
        discipline_headline = "Maintain Process & Patience"
        discipline_body = "Execute according to predefined rules and let your edge play out over a statistical series."

        if top_mistakes:
            first_mistake = top_mistakes[0]['mistake'].lower()
            if 'early entry' in first_mistake:
                discipline_headline = "Patience at Execution"
                discipline_body = f"Your historical data shows {top_mistakes[0]['count']} early entries. Wait for full candle close confirmation before triggering your order."
            elif 'late entry' in first_mistake:
                discipline_headline = "Eliminate Hesitation"
                discipline_body = "Late entries are degrading your risk/reward. Either enter at the predefined level or let the move go without chasing."
            elif 'revenge' in first_mistake or risk_escalation_incidents > 0:
                discipline_headline = "Strict Loss Detachment"
                discipline_body = "You have shown a tendency to increase quantity or revenge-trade after losses. Accept losses as standard business expenses."
            elif 'ignored sl' in first_mistake:
                discipline_headline = "Non-Negotiable Stop Loss"
                discipline_body = "Never move your stop loss further away. A defined loss preserves your capital to participate in tomorrow's setups."

        return {
            'has_enough_data': True,
            'total_trades_analyzed': total_count,
            'rule_adherence_pct': adherence_pct,
            'avg_trades_per_day': avg_trades_per_day,
            'overtrading_days_count': overtrading_days,
            'risk_escalation_incidents': risk_escalation_incidents,
            'top_mistakes': top_mistakes,
            'best_setup': best_setup,
            'worst_setup': worst_setup,
            'best_time_slot': best_time_slot,
            'worst_time_slot': worst_time_slot,
            'todays_discipline': {
                'headline': discipline_headline,
                'directive': discipline_body
            }
        }

    @staticmethod
    def get_periodic_reviews(user):
        today = timezone.now().date()
        closed_trades = Trade.objects.filter(user=user, status='CLOSED')

        # Daily Review (Today)
        today_trades = closed_trades.filter(date=today)
        today_pnl = today_trades.aggregate(s=Sum('net_pnl'))['s'] or Decimal('0.00')
        today_wins = today_trades.filter(net_pnl__gt=0).count()
        today_count = today_trades.count()
        today_plan = DailyTradingPlan.objects.filter(user=user, date=today).first()

        daily_review = {
            'period': 'Today',
            'trades_count': today_count,
            'net_pnl': float(today_pnl),
            'win_rate': round((today_wins / today_count) * 100, 1) if today_count > 0 else 0.0,
            'plan_recorded': bool(today_plan),
            'plan_adherence': today_plan.plan_followed if today_plan else False,
            'assessment': (
                'Disciplined execution within plan limits.' if today_pnl >= 0 and today_count <= 3
                else ('Review risk per trade and limit trade count.' if today_pnl < 0 else 'No trades executed today.')
            )
        }

        # Weekly Review (Last 7 days)
        seven_days_ago = today - timedelta(days=7)
        week_trades = closed_trades.filter(date__gte=seven_days_ago)
        week_pnl = week_trades.aggregate(s=Sum('net_pnl'))['s'] or Decimal('0.00')
        week_wins = week_trades.filter(net_pnl__gt=0).count()
        week_count = week_trades.count()
        week_violations = week_trades.filter(rule_followed=False).count()

        weekly_review = {
            'period': 'Last 7 Days',
            'trades_count': week_count,
            'net_pnl': float(week_pnl),
            'win_rate': round((week_wins / week_count) * 100, 1) if week_count > 0 else 0.0,
            'rule_violations': week_violations,
            'key_takeaway': (
                f"Generated ₹{week_pnl:.2f} net with {week_violations} rule violation(s). Focus on cutting suboptimal setups."
            )
        }

        # Monthly Review (Last 30 days)
        thirty_days_ago = today - timedelta(days=30)
        month_trades = closed_trades.filter(date__gte=thirty_days_ago)
        month_pnl = month_trades.aggregate(s=Sum('net_pnl'))['s'] or Decimal('0.00')
        month_wins = month_trades.filter(net_pnl__gt=0).count()
        month_count = month_trades.count()

        monthly_review = {
            'period': 'Last 30 Days',
            'trades_count': month_count,
            'net_pnl': float(month_pnl),
            'win_rate': round((month_wins / month_count) * 100, 1) if month_count > 0 else 0.0,
            'challenge_contribution': float(month_pnl)
        }

        return {
            'daily': daily_review,
            'weekly': weekly_review,
            'monthly': monthly_review
        }
