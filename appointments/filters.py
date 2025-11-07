# appointments/filters.py
from django_filters import rest_framework as filters
from .models import Appointment

class AppointmentFilter(filters.FilterSet):
    date_from = filters.DateFilter(field_name="date", lookup_expr="gte")
    date_to   = filters.DateFilter(field_name="date", lookup_expr="lte")
    doctor_id = filters.NumberFilter(field_name="doctor_id")
    status    = filters.CharFilter(field_name="status")

    class Meta:
        model = Appointment
        fields = ["date_from", "date_to", "doctor_id", "status", "room", "type"]
