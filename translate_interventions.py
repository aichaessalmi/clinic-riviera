# translate_interventions.py
import os
import django
from googletrans import Translator

# ✅ Initialisation Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "clinic_backend.settings")
django.setup()

from referrals.models import InterventionType

translator = Translator()

print("🌐 Traduction des types d’interventions en cours...\n")

for item in InterventionType.objects.all():
    try:
        source = item.name_fr.strip() if item.name_fr else ""
        if not source:
            continue

        # Traduire uniquement si name_en est vide
        if not item.name_en:
            translation = translator.translate(source, src="fr", dest="en")
            item.name_en = translation.text
            item.save()
            print(f"✅ {source} → {item.name_en}")
        else:
            print(f"⏭️  {source} (déjà traduit)")
    except Exception as e:
        print(f"⚠️ Erreur sur {item}: {e}")

print("\n🎉 Traduction terminée avec succès !")
