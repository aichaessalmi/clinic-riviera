# appointments/admin.py
from django.contrib import admin
from .models import Room, AppointmentType, Appointment

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("id", "name_fr", "name_en", "status")
    search_fields = ("name_fr", "name_en")
    list_filter = ("status",)

@admin.register(AppointmentType)
class AppointmentTypeAdmin(admin.ModelAdmin):
   list_display = ("id", "name_fr", "name_en")
   search_fields = ("name_fr", "name_en")

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = (
        "id", "patient_name", "date", "time", "status",
        "room", "type", "doctor",
    )
    list_filter = ("status", "date", "room", "type")
    search_fields = ("patient_name", "phone", "notes")

    # ✅ NE PAS inclure 'referral' (il n’existe pas sur Appointment)
    # Si tu veux de l’autocomplete :
    autocomplete_fields = ("room", "type", "doctor",)

    # Si ton admin User (accounts) n’a pas de search_fields, 
    # tu peux retirer doctor de l’autocomplete et utiliser raw_id_fields :
    # raw_id_fields = ("doctor",)
