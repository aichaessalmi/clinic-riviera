// ✅ src/api/secretary_referrals.ts
import http from "./http";

/** === Types === */
export type Referral = {
  id: number;
  patient: string;
  medecin: string;
  intervention: string;
  date: string;
  assurance: string;
  statut: "En attente" | "Confirmé" | "Terminé" | "Annulé" | "À rappeler";
  priorite: "Basse" | "Normale" | "Haute" | "Urgente";
  phone?: string;
  email?: string;
  internalNotes?: string;
};

export type ReferralCreate = Omit<Referral, "id">;

/** === Helpers === */
function normalizeData<T>(data: any): T[] {
  // DRF peut renvoyer un array direct OU une pagination
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}

const BASE_URL = "/secretary-referrals/";

export async function listReferrals(params?: Record<string, any>) {
  const { data } = await http.get(BASE_URL, { params });
  return normalizeData<Referral>(data);
}

export async function createReferral(payload: ReferralCreate) {
  const { data } = await http.post<Referral>(BASE_URL, payload);
  return data;
}

export async function updateReferral(id: number, patch: Partial<Referral>) {
  const { data } = await http.patch<Referral>(`${BASE_URL}${id}/`, patch);
  return data;
}

export async function deleteReferral(id: number) {
  await http.delete(`${BASE_URL}${id}/`);
}
