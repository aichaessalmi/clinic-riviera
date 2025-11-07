# clinic_backend/urls.py
from django.contrib import admin
from django.urls import path, include, re_path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),

    # OpenAPI + Swagger
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),

    # === API ===
    path("api/accounts/", include("accounts.urls")),
    path("api/", include("appointments.urls")),
    path("api/", include("referrals.urls")),
    path("api/", include("notifications.urls")),
    path("api/whatsapp/", include("whatsapp.urls")),
]

# ✅ Servir les fichiers MEDIA en mode développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# ✅ Catch-all SPA (React)
# ⚠️ toujours à la fin !
urlpatterns += [
    re_path(r"^(?!api/).*$", TemplateView.as_view(template_name="index.html")),
]
