from decimal import Decimal
from datetime import datetime
from django.utils import timezone
from .providers import get_dhan_provider
from .models import DhanAuthState
from apps.trades.models import Trade
from apps.setups.models import Setup

class DhanSyncService:
    @staticmethod
    def sync_user_trades(user) -> dict:
        provider = get_dhan_provider()
        remote_orders = provider.get_orders()
        remote_trades = provider.get_trades()

        # Some accounts return executions before order history is available.
        if not remote_orders and remote_trades:
            remote_orders = [
                {
                    'orderId': trade.get('orderId') or trade.get('tradeId'),
                    'tradingSymbol': trade.get('tradingSymbol', ''),
                    'securityId': trade.get('securityId', ''),
                    'transactionType': trade.get('transactionType'),
                    'quantity': trade.get('tradedQuantity', 0),
                    'price': trade.get('tradedPrice', 0),
                    'orderStatus': 'TRADED',
                    'createTime': trade.get('tradeTime', ''),
                }
                for trade in remote_trades
            ]

        synced_count = 0
        skipped_count = 0

        # Group completed orders by tradingSymbol
        # In Indian option trading, a round trip involves a BUY and a SELL on the same symbol
        executed_orders = [o for o in remote_orders if o.get('orderStatus') == 'TRADED']
        
        # Group pairs
        by_symbol = {}
        for o in executed_orders:
            sym = o.get('tradingSymbol')
            if sym not in by_symbol:
                by_symbol[sym] = {'BUY': [], 'SELL': []}
            tx_type = o.get('transactionType')
            if tx_type in ['BUY', 'SELL']:
                by_symbol[sym][tx_type].append(o)

        default_setup = Setup.objects.filter(is_active=True).first()

        lot_sizes = {'NIFTY': 65, 'BANKNIFTY': 30, 'SENSEX': 20}

        for sym, tx_data in by_symbol.items():
            buys = tx_data['BUY']
            sells = tx_data['SELL']

            # Match pairs
            num_pairs = min(len(buys), len(sells))
            for i in range(num_pairs):
                buy_ord = buys[i]
                sell_ord = sells[i]
                order_key = f"{buy_ord.get('orderId')}_{sell_ord.get('orderId')}"

                # Check duplicate prevention
                if Trade.objects.filter(user=user, dhan_order_id=order_key).exists():
                    skipped_count += 1
                    continue

                entry_price = Decimal(str(buy_ord.get('price', 0.0)))
                exit_price = Decimal(str(sell_ord.get('price', 0.0)))

                # Parse index
                index = 'NIFTY'
                if 'BANKNIFTY' in sym.upper():
                    index = 'BANKNIFTY'
                elif 'SENSEX' in sym.upper():
                    index = 'SENSEX'

                quantity = int(buy_ord.get('quantity') or lot_sizes.get(index, 65))

                opt_type = 'CE' if 'CE' in sym.upper() else ('PE' if 'PE' in sym.upper() else 'NONE')
                
                # Parse timestamp
                time_str = buy_ord.get('createTime', '')
                trade_date = timezone.now().date()
                trade_time = '09:30:00'
                if time_str:
                    try:
                        parts = time_str.split(' ')
                        trade_date = datetime.strptime(parts[0], '%Y-%m-%d').date()
                        trade_time = parts[1][:8]
                    except Exception:
                        pass

                # Reasonable stop loss & target for journal record
                sl = max(Decimal('1.00'), round(entry_price * Decimal('0.85'), 2))
                target = round(entry_price * Decimal('1.30'), 2)

                Trade.objects.create(
                    user=user,
                    dhan_order_id=order_key,
                    dhan_trade_id=f"TRD-{buy_ord.get('orderId')}",
                    date=trade_date,
                    time=trade_time,
                    index=index,
                    symbol=sym,
                    security_id=buy_ord.get('securityId', ''),
                    instrument='OPTION',
                    option_type=opt_type,
                    side='BUY',
                    quantity=quantity,
                    entry_price=entry_price,
                    exit_price=exit_price,
                    stop_loss=sl,
                    target=target,
                    setup=default_setup,
                    entry_reason="Dhan Sync: Automated execution",
                    exit_reason="Dhan Sync: Target / SL execution",
                    psychology='CALM',
                    rule_followed=True,
                    mistake='NONE',
                    status='CLOSED'
                )
                synced_count += 1

            DhanAuthState.objects.filter(key='default').update(last_sync_at=timezone.now())

        return {
            'status': 'SUCCESS',
            'synced_count': synced_count,
            'skipped_duplicates': skipped_count,
            'remote_orders_evaluated': len(executed_orders),
            'mode': 'DEMO' if getattr(provider, 'is_demo', False) else 'LIVE'
        }

    @staticmethod
    def reconcile(user) -> dict:
        provider = get_dhan_provider()
        remote_orders = provider.get_orders()
        executed_orders = [o for o in remote_orders if o.get('orderStatus') == 'TRADED']
        
        # Local synced trades count
        local_synced_trades = Trade.objects.filter(user=user, dhan_order_id__isnull=False).exclude(dhan_order_id='')
        local_count = local_synced_trades.count()
        remote_count = len(executed_orders) // 2  # 2 orders per completed roundtrip trade
        
        diff = abs(remote_count - local_count)
        status_text = "SYNCHRONIZED" if diff == 0 else "RECONCILIATION REQUIRED"

        return {
            'status': status_text,
            'is_demo': getattr(provider, 'is_demo', False),
            'local_database_trades': local_count,
            'dhan_completed_trades': remote_count,
            'difference': diff,
            'total_remote_orders': len(remote_orders),
            'executed_remote_orders': len(executed_orders),
            'last_reconciled_at': timezone.now().isoformat()
        }
