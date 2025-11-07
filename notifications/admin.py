# AVANT
# from .models import Room, ArrivalNotification
# @admin.register(Room) ...

# APRES
from django.contrib import admin
from .models import ArrivalNotification

@admin.register(ArrivalNotification)
class ArrivalNotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'patient', 'doctor', "intervention_type", 'status', 'room', 'appt_at', 'created_at')
    list_filter = ('status', "intervention_type",)
    search_fields = ('patient', 'ref_by', 'message', 'notes')
