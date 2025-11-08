import http from "./http";
import i18n from "../i18n";

/* ========= FORM (create) ========= */
export type FormState = {
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: "male" | "female" | "other" | "";
  phone: string;
  email: string;
  address: string;
  city: string;
  postal_code: string;
  intervention_type: string;
  urgency_level: string;
  consultation_reason: string;
  medical_history: string;
  referring_doctor: string;
  establishment: string;
  insurance_provider: "cnss" | "cnops" | "axa" | "saham" | "";
  insurance_policy_number: string;
  coverage_type: string;
  expiration_date: string;
  holder_name: string;
  insurance_notes: string;
};

export async function createReferral(payload: FormState) {
  const { data } = await http.post(`/referrals/`, payload);
  return data;
}

/* ========= READ (list) ========= */
export type ApiPatient = {
  first_name?: string | null;
  last_name?: string | null;
};

export type ApiInsurance = {
  insurance_provider?: string | null;
};

export type ApiReferral = {
  id: number;
  status: "new" | "sent" | "accepted" | "rejected";
  created_at?: string | null;
  intervention_type?: string | null;
  urgency_level?: string | null;
  consultation_reason?: string | null;
  medical_history?: string | null;
  referring_doctor?: string | null;
  establishment?: string | null;
  physician?: string | null;
  target_specialty?: string | null;
  notes?: string | null;
  patient?: ApiPatient | null;
  insurance?: ApiInsurance | null;
  // Champs traduits depuis le backend
  intervention_label?: string | null;
  urgency_label?: string | null;
  status_label?: string | null;
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

/* ========= LIST (avec langue dynamique) ========= */
export async function listReferrals(params: Record<string, any> = {}) {
  const lang = params.lang || i18n.language || "fr";
  const { data } = await http.get<Paginated<ApiReferral> | ApiReferral[]>(
    `/referrals/?lang=${lang}`,
    { params }
  );
  return Array.isArray(data) ? data : data.results || [];
}

/* ========= actions secrétariat ========= */
export async function markArrived(referralId: number, room_number: string) {
  const { data } = await http.post(`/referrals/${referralId}/arrive/`, { room_number });
  return data;
}

/* ========= API LOOKUPS ========= */
// 💡 les endpoints sont séparés : referrals vs accounts
export async function fetchPatients() {
  const { data } = await http.get(`/referrals/patients/`);
  return data;
}

export async function fetchInterventions() {
  const lang = i18n.language || "fr";
  const { data } = await http.get(`/referrals/interventions-list/?lang=${lang}`);
  return data;
}

export async function fetchUrgencies() {
  const lang = i18n.language || "fr";
  const { data } = await http.get(`/referrals/urgencies-list/?lang=${lang}`);
  return data;
}

export async function fetchInsurances() {
  const { data } = await http.get(`/referrals/insurances-list/`);
  return data;
}

export async function fetchPhysicians() {
  const { data } = await http.get(`/accounts/physicians/`);
  return data;
}

/* ========= STATS ========= */
export async function fetchReferralStats() {
  const { data } = await http.get(`/referrals/stats/`);
  return data;
}
