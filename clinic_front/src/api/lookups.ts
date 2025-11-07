// src/api/lookups.ts
import http from "./http";

export type ApiRoom = { id: number; name: string; status?: string | null };
export type ApiType = { id: number; name: string };

export type ApiDoctorRaw = {
  id: number;
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  specialite?: string | null; // backend FR
  specialty?: string | null;  // fallback EN si jamais
};

export type ApiDoctor = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  specialty: string | null;
};

// Déballe toujours vers un tableau (DRF pagination ou non)
function unwrap<T>(data: any): T[] {
  return Array.isArray(data) ? data : (data?.results ?? []);
}

/* ----- ROOMS ----- */
export async function listRooms() {
  const { data } = await http.get("rooms/");
  return unwrap<ApiRoom>(data);
}

/* ----- TYPES DE RDV ----- */
export async function listTypes() {
  const { data } = await http.get("appointment-types/");
  return unwrap<ApiType>(data);
}

/* ----- MEDECINS ----- */
export async function listPhysicians() {
  // Endpoint côté backend: /api/accounts/physicians/
  const { data } = await http.get("/accounts/physicians/");

  const rows = unwrap<ApiDoctorRaw>(data);

  // Normalisation: full_name et specialty
  return rows.map<ApiDoctor>((x) => {
    const first = (x.first_name ?? "").trim();
    const last  = (x.last_name ?? "").trim();
    const full  = (x.full_name ?? `${first} ${last}`.trim()) || x.username;
    const spec  = x.specialite ?? x.specialty ?? null;

    return {
      id: x.id,
      username: x.username,
      first_name: first,
      last_name: last,
      full_name: full,
      specialty: spec,
    };
  });
}
export type ApiInsurance = {
  id: number;
  insurance_provider: string;
  insurance_policy_number: string;
  coverage_type: string;
  expiration_date: string | null;
  holder_name: string;
  insurance_notes: string;
};

export async function listInsurances() {
  const { data } = await http.get<ApiInsurance[]>("insurances/");
  return data.map((i) => ({
    id: i.id,
    name: i.insurance_provider.toUpperCase(), // ✅ on affiche le nom clair CNSS / AXA / CNOPS ...
  }));
}