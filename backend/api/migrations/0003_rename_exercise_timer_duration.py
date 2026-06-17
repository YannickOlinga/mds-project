from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0002_profile_user"),
    ]

    operations = [
        migrations.RenameField(
            model_name="exercisetemplate",
            old_name="demo_duration_seconds",
            new_name="timer_duration_seconds",
        ),
    ]
