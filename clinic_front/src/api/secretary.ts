// src/api/secretary.ts
import http from "./http";

export async function listAppointments(params: Record<string, any> = {}) {
  const { data } = await http.get("/appointments/", { params });
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function listPatients() {
  const { data } = await http.get("/patients/");
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function listPhysicians() {
  const { data } = await http.get("/accounts/physicians/");
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function updateAppointmentStatus(id: number, status: string) {
  const { data } = await http.patch(`/appointments/${id}/`, { status });
  return data;
}
