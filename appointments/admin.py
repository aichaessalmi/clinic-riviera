from django.contrib import admin
from .models import Patient, Appointment

@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("last_name","first_name","phone","insurance","created_at")
    search_fields = ("last_name","first_name","phone","insurance")

@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("patient","specialty","doctor","date","status","created_at")
    list_filter = ("status","specialty")
    search_fields = ("patient__last_name","patient__first_name","doctor__username")
