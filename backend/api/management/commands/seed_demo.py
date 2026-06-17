from django.core.management.base import BaseCommand

from api.utils import ensure_profile_data


class Command(BaseCommand):
    help = "Ensure reference data and device state for an existing profile."

    def add_arguments(self, parser) -> None:
        parser.add_argument("--profile-id", type=int, default=1)

    def handle(self, *args, **options) -> None:
        profile_id: int = options["profile_id"]
        ensure_profile_data(profile_id)
        self.stdout.write(self.style.SUCCESS(f"Reference data ensured for profile_id={profile_id}"))
