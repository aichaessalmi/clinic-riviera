from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = [
        ("medecin", "Médecin"),
        ("secretaire", "Secrétaire"),
        ("direction", "Direction"),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    code_personnel = models.CharField(max_length=20, blank=True, null=True, unique=True)

    def save(self, *args, **kwargs):
        # ⚠️ On impose que seul le médecin ait un code personnel
        if self.role != "medecin":
            self.code_personnel = None
        super().save(*args, **kwargs)
