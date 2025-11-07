from django.utils import translation
from rest_framework.test import APIRequestFactory
from referrals.views import InterventionTypeViewSet, UrgencyLevelViewSet

factory = APIRequestFactory()

def test_view(viewset, url):
    print(f"\n=== TEST: {url} ===")
    for lang in ["fr", "en"]:
        translation.activate(lang)
        request = factory.get(url, HTTP_ACCEPT_LANGUAGE=lang)
        view = viewset.as_view({'get': 'list'})
        response = view(request)

        # Gestion pagination
        data = response.data.get("results", response.data)

        print(f"\nLangue: {lang.upper()} ({translation.get_language()})")
        for item in data[:5]:
            nom = item.get("name") or item.get("name_fr") or "—"
            desc = item.get("description") or ""
            print(f"  - {nom:25s} → {desc[:40]}")
        print("-" * 60)

# Exécution
test_view(InterventionTypeViewSet, "/api/interventions/")
test_view(UrgencyLevelViewSet, "/api/urgencies/")
