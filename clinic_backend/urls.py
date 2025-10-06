# clinic_backend/urls.py
from django.contrib import admin
from django.urls import path, include, re_path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from django.views.generic import TemplateView  # 👈 important

urlpatterns = [
    path("admin/", admin.site.urls),

    # OpenAPI + Swagger
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),

    # API
    path("api/", include("accounts.urls")),
    path("api/appointments/", include("appointments.urls")),
    path("api/referrals/", include("referrals.urls")),
    path('api/whatsapp/', include('whatsapp.urls')),
    # 👇 Catch-all: toute route qui ne commence PAS par /api/ renvoie index.html
    re_path(r"^(?!api/).*$", TemplateView.as_view(template_name="index.html")),
]
