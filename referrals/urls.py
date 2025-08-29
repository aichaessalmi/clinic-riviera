from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReferralViewSet, ReferralStatsView

router = DefaultRouter()
router.register(r"", ReferralViewSet, basename="referrals")

urlpatterns = [
    path("stats/", ReferralStatsView.as_view()),  # GET (Direction)
    path("", include(router.urls)),               # / (list/create), /{id}/, /{id}/arrive/
]
