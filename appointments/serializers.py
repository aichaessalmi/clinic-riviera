from rest_framework import serializers
from .models import Patient, Appointment

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = ("id","first_name","last_name","phone","birth_date","insurance")

class AppointmentSerializer(serializers.ModelSerializer):
    patient = PatientSerializer()

    class Meta:
        model = Appointment
        fields = ("id","patient","specialty","doctor","date","reason","status","created_at")
        read_only_fields = ("created_at",)

    def create(self, validated_data):
        patient_data = validated_data.pop("patient")
        patient = Patient.objects.create(**patient_data)
        # statut par défaut = pending
        return Appointment.objects.create(patient=patient, **validated_data)

    def update(self, instance, validated_data):
        # Permet de modifier le statut + champs simples (pas de nested update patient ici)
        if "status" in validated_data:
            instance.status = validated_data["status"]
        for f in ("specialty","doctor","date","reason"):
            if f in validated_data:
                setattr(instance, f, validated_data[f])
        instance.save()
        return instance
