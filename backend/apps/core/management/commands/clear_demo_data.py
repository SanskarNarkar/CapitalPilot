from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User

from apps.challenge.models import ChallengeConfig
from apps.trades.models import Trade


class Command(BaseCommand):
    help = 'Remove the deterministic CapitalPilot seed trades for a user.'

    def add_arguments(self, parser):
        parser.add_argument('--username', required=True)

    def handle(self, *args, **options):
        try:
            user = User.objects.get(username=options['username'])
        except User.DoesNotExist as exc:
            raise CommandError(f"User '{options['username']}' does not exist") from exc

        seeded_trades = Trade.objects.filter(
            user=user,
            dhan_order_id__regex=r'^DHAN-ORD-8[0-9]{3}$',
            dhan_trade_id__regex=r'^DHAN-TRD-9[0-9]{3}$',
        )
        deleted_count, _ = seeded_trades.delete()

        ChallengeConfig.objects.filter(
            user=user,
            name='15k to 1.35L Options Challenge',
        ).update(
            starting_capital=0,
            target_profit=0,
            target_capital=0,
        )

        self.stdout.write(self.style.SUCCESS(f'Removed {deleted_count} seeded record(s) for {user.username}.'))