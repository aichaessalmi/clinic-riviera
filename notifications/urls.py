# notifications/urls.py
from rest_framework.routers import DefaultRouter
from .views import ArrivalNotificationViewSet  # ✅ plus de RoomViewSet ici

router = DefaultRouter()
router.register(r'arrival-notifs', ArrivalNotificationViewSet, basename='arrival-notifs')

urlpatterns = router.urls
