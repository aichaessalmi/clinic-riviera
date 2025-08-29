from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AppointmentViewSet, AppointmentPublicCreateView, CalendarEventsView

router = DefaultRouter()
router.register(r"", AppointmentViewSet, basename="appointments")

urlpatterns = [
    path("public/create/", AppointmentPublicCreateView.as_view()),  # POST
    path("calendar/", CalendarEventsView.as_view()),                # GET ?from=...&to=...
    path("", include(router.urls)),                                 # / (list/create), /{id}/ (retrieve/update)
]
