from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("tournaments", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="tournament",
            name="sport",
            field=models.CharField(
                choices=[
                    ("cricket", "Cricket"),
                    ("football", "Football"),
                    ("kabaddi", "Kabaddi"),
                    ("volleyball", "Volleyball"),
                    ("badminton", "Badminton"),
                    ("basketball", "Basketball"),
                    ("hockey", "Hockey"),
                    ("custom", "Custom"),
                ],
                default="cricket",
                max_length=20,
            ),
        ),
    ]
