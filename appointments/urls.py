# appointments/urls.py
from rest_framework.routers import DefaultRouter
from .views import AppointmentViewSet, RoomViewSet, AppointmentTypeViewSet,PatientViewSet

router = DefaultRouter()
router.register(r"appointments", AppointmentViewSet, basename="appointments")
router.register(r"rooms", RoomViewSet, basename="rooms")
router.register(r"appointment-types", AppointmentTypeViewSet, basename="appointment-types")
router.register(r"patients", PatientViewSet)  # ✅ ajouté ici
urlpatterns = router.urls
