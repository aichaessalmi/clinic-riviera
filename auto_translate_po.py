from googletrans import Translator
from polib import pofile

translator = Translator()
po = pofile("locale/en/LC_MESSAGES/django.po")

for entry in po.untranslated_entries():
    try:
        translated = translator.translate(entry.msgid, src="fr", dest="en").text
        entry.msgstr = translated
        print(f"✅ {entry.msgid} → {translated}")
    except Exception as e:
        print(f"⚠️ {entry.msgid}: {e}")

po.save()
