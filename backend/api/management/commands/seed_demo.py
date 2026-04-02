from django.core.management.base import BaseCommand

from api.utils import ensure_demo_data


class Command(BaseCommand):
    help = "Seed demo data for the MDS backend (creates demo profile, templates, and sample sessions)."

    def add_arguments(self, parser) -> None:
        parser.add_argument("--profile-id", type=int, default=1)

    def handle(self, *args, **options) -> None:
        profile_id: int = options["profile_id"]
        ensure_demo_data(profile_id)
        self.stdout.write(self.style.SUCCESS(f"Demo data ensured for profile_id={profile_id}"))

