import http from "./http";

/** Statuts possibles côté API */
export type ApiStatus = "pending" | "confirmed" | "to_call" | "cancelled";

/** Forme d'un rendez-vous renvoyé par l'API */
export type ApiAppointment = {
  id: number;
  patient_name: string;
  date: string;
  time: string;
  duration_minutes?: number | null;
  status: ApiStatus;
  room?: number | { id: number; name: string } | null;
  room_name?: string;
  type?: number | { id: number; name: string } | null;
  type_name?: string;
  doctor?: number | null;
  doctor_first_name?: string;
  doctor_last_name?: string;
  doctor_full_name?: string;
  phone?: string | null;
  email?: string | null;         // ✅ ajouté ici
  notes?: string | null;
  referral?: number | null;
};

/** Création d'un rendez-vous */
export type CreateAppointmentPayload = {
  patient_name: string;
  date: string;
  time: string;
  duration_minutes?: number;
  status?: ApiStatus;
  room?: number | null;
  type?: number | null;
  doctor?: number | null;
  phone?: string | null;
  email?: string | null;        // ✅ ajouté ici
  notes?: string | null;
  referral?: number | null;
};

/** Mise à jour (partielle) */
export type UpdateAppointmentPayload = Partial<CreateAppointmentPayload>;

/** Liste paginée/non paginée — normalisée en tableau */
export async function listAppointments(params: {
  ordering?: string;
  date_after?: string;
  date_before?: string;
  doctor_id?: number;
  status?: ApiStatus;
  room?: number;
  type?: number | string;
}) {
  const { data } = await http.get<ApiAppointment[] | { results: ApiAppointment[] }>(
    "appointments/",
    { params }
  );
  return Array.isArray(data) ? data : data.results;
}

/** Création */
export async function createAppointment(body: CreateAppointmentPayload) {
  console.log("🚀 [API] POST /appointments/ payload:", body);
  const { data } = await http.post<ApiAppointment>("appointments/", body);
  console.log("✅ [API] Réponse backend:", data);
  return data;
}

/** Mise à jour */
export async function updateAppointment(id: number, patch: UpdateAppointmentPayload) {
  const { data } = await http.patch<ApiAppointment>(`appointments/${id}/`, patch);
  return data;
}

/** Suppression */
export async function deleteAppointment(id: number) {
  await http.delete(`appointments/${id}/`);
}
