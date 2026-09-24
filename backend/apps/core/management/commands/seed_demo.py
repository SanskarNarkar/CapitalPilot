from django.core.management import call_command
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Alias for seed_data command to seed demo trading challenge dataset'

    def handle(self, *args, **options):
        call_command('seed_data', *args, **options)
