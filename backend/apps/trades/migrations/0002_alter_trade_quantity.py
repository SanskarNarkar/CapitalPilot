from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('trades', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='trade',
            name='quantity',
            field=models.IntegerField(default=65),
        ),
    ]