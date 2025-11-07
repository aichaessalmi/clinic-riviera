# referrals/views_lookup.py
from rest_framework import generics
from .models import Patient, InterventionType, Insurance
from .serializers import PatientSerializer, InterventionTypeSerializer, InsuranceSerializer

class PatientListView(generics.ListAPIView):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer

class InterventionTypeListView(generics.ListAPIView):
    queryset = InterventionType.objects.all()
    serializer_class = InterventionTypeSerializer

class InsuranceListView(generics.ListAPIView):
    queryset = Insurance.objects.all()
    serializer_class = InsuranceSerializer
