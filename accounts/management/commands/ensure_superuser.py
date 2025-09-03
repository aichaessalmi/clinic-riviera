from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

class Command(BaseCommand):
    help = "Crée ou met à jour un superuser à partir des variables d'environnement"

    def handle(self, *args, **options):
        User = get_user_model()
        username = os.getenv("DJANGO_SUPERUSER_USERNAME", "admin")
        email = os.getenv("DJANGO_SUPERUSER_EMAIL", "admin@example.com")
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD", "admin")

        if not User.objects.filter(username=username).exists():
            self.stdout.write(f"⚡ Création du superuser {username}")
            User.objects.create_superuser(username=username, email=email, password=password)
        else:
            self.stdout.write(f"✅ Superuser {username} existe déjà, mise à jour du mot de passe")
            u = User.objects.get(username=username)
            u.set_password(password)
            u.save()
