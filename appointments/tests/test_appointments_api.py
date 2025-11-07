# appointments/tests/test_appointments_api.py
import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from appointments.models import Room, AppointmentType, Appointment

User = get_user_model()

@pytest.mark.django_db
def test_create_and_list_appointments():
    u = User.objects.create_user(username="dr", password="x", role="medecin")
    room = Room.objects.create(name="Chambre 101")
    atype = AppointmentType.objects.create(name="Consultation")

    c = APIClient()
    c.force_authenticate(user=u)

    # create
    res = c.post(reverse("appointments-list"), {
        "patient_name": "Kenza",
        "date": "2025-03-21",
        "time": "14:00:00",
        "duration_minutes": 30,
        "status": "pending",
        "room": room.id,
        "type": atype.id,
        "doctor": u.id,
        "phone": "+2126",
        "notes": "First",
    }, format="json")
    assert res.status_code in (200, 201)

    # list
    res2 = c.get(reverse("appointments-list"), {"date_from": "2025-03-01", "date_to": "2025-03-31"})
    assert res2.status_code == 200
    assert len(res2.data["results"] if isinstance(res2.data, dict) and "results" in res2.data else res2.data) >= 1
