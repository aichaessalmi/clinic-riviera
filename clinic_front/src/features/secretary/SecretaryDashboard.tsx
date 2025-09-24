// src/features/secretary/SecretaryDashboard.tsx
import { useMemo, useState } from "react";

/* ========= Types ========= */
type Status = "confirmed" | "to_call" | "cancelled";

type Req = {
  id: string;
  patientId: number;
  patient: string;
  phone: string;
  email?: string;
  desiredAt: string;
  reason: string;
  insurance: string;
  status: Status;
};

type Patient = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  birth_date?: string;
  insurance: string;
  email?: string;
};

type PastAppointment = {
  id: number;
  patient_id: number;
  date: string;
  doctor_name: string;
  specialty: string;
  status: "pending" | "confirmed" | "to_call" | "canceled";
};

/* ========= Mock data ========= */
const REQUESTS_INIT: Req[] = [
  {
    id: "r1",
    patientId: 1,
    patient: "Ahmed El Mansouri",
    phone: "0612-345-678",
    email: "ahmed@example.com",
    desiredAt: "2025-09-25T10:00:00",
    reason: "Douleurs abdominales",
    insurance: "CNOPS",
    status: "to_call",
  },
  {
    id: "r2",
    patientId: 2,
    patient: "Sara Benali",
    phone: "0612-222-333",
    email: "sara@mail.com",
    desiredAt: "2025-09-26T11:00:00",
    reason: "Fièvre élevée",
    insurance: "AXA",
    status: "confirmed",
  },
];

const PATIENTS: Patient[] = [
  { id: 1, first_name: "Ahmed", last_name: "El Mansouri", phone: "0612-345-678", birth_date: "1990-05-20", insurance: "CNOPS", email: "ahmed@example.com" },
  { id: 2, first_name: "Sara", last_name: "Benali", phone: "0612-222-333", birth_date: "1988-10-11", insurance: "AXA", email: "sara@mail.com" },
];

const APPTS: PastAppointment[] = [
  { id: 101, patient_id: 1, date: "2025-08-02T10:00:00", doctor_name: "Dr. Karim", specialty: "Cardiologie", status: "confirmed" },
  { id: 102, patient_id: 1, date: "2025-05-15T09:30:00", doctor_name: "Dr. Fatima", specialty: "Radiologie", status: "canceled" },
  { id: 103, patient_id: 2, date: "2025-07-22T15:00:00", doctor_name: "Dr. Salma", specialty: "Dermatologie", status: "pending" },
];

/* ========= Helpers ========= */
const statusBadge = (s: Status) => {
  const map: Record<Status, string> = {
    confirmed: "bg-green-100 text-green-700",
    to_call: "bg-amber-100 text-amber-700",
    cancelled: "bg-rose-100 text-rose-700",
  };
  const label: Record<Status, string> = {
    confirmed: "Confirmé",
    to_call: "À rappeler",
    cancelled: "Annulé",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[s]}`}>{label[s]}</span>;
};

const statusLabel = (s: PastAppointment["status"]) => {
  switch (s) {
    case "confirmed": return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">Confirmé</span>;
    case "pending":   return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">En attente</span>;
    case "to_call":   return <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700">À rappeler</span>;
    case "canceled":  return <span className="px-2 py-1 rounded-full text-xs bg-rose-100 text-rose-700">Annulé</span>;
    default:          return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{s}</span>;
  }
};

const fmtDateTime = (iso?: string) => iso ? new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" }) : "—";

/* ========= Main Page ========= */
export default function SecretaryDashboard() {
  const [requests, setRequests] = useState(REQUESTS_INIT);
  const [q, setQ] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter(r =>
      r.patient.toLowerCase().includes(term) ||
      r.phone.includes(term) ||
      (r.email ?? "").toLowerCase().includes(term) ||
      r.reason.toLowerCase().includes(term)
    );
  }, [q, requests]);

  const updateStatus = (id: string, status: Status) => {
    setRequests(rs => rs.map(r => r.id === id ? { ...r, status } : r));
    setOpenActionMenuId(null);
  };

  const openPatient = (id: number) => {
    const p = PATIENTS.find(x => x.id === id) ?? null;
    if (p) setSelectedPatient(p);
  };

  const history = useMemo(() => selectedPatient ? APPTS.filter(a => a.patient_id === selectedPatient.id) : [], [selectedPatient]);

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord — Rendez-vous</h1>
          <p className="text-sm text-slate-600">Demandes reçues via le site · mode mobile optimisé</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="🔍 Rechercher nom, téléphone, motif…"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-0 focus:border-blue-500"
            aria-label="Recherche"
          />
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Patient</th>
              <th className="px-4 py-3 text-left">Date souhaitée</th>
              <th className="px-4 py-3 text-left">Motif</th>
              <th className="px-4 py-3 text-left">Assurance</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-t hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{r.patient}</td>
                <td className="px-4 py-3 text-slate-700">{fmtDateTime(r.desiredAt)}</td>
                <td className="px-4 py-3 text-slate-700">{r.reason}</td>
                <td className="px-4 py-3 text-slate-700">{r.insurance}</td>
                <td className="px-4 py-3 text-slate-700">{r.phone}<br/><span className="text-xs text-slate-500">{r.email ?? "—"}</span></td>
                <td className="px-4 py-3">{statusBadge(r.status)}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => openPatient(r.patientId)} className="rounded-md bg-slate-200 px-3 py-1 text-xs hover:bg-slate-300">Voir</button>
                  <button onClick={() => updateStatus(r.id, "confirmed")} className="rounded-md bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-700">Confirmer</button>
                  <button onClick={() => updateStatus(r.id, "to_call")} className="rounded-md bg-amber-500 px-3 py-1 text-xs text-white hover:bg-amber-600">Rappeler</button>
                  <button onClick={() => updateStatus(r.id, "cancelled")} className="rounded-md bg-rose-500 px-3 py-1 text-xs text-white hover:bg-rose-600">Annuler</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Aucune demande trouvée</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map(r => (
          <article key={r.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-medium text-slate-900 truncate">{r.patient}</div>
                    <div className="text-xs text-slate-500">{fmtDateTime(r.desiredAt)}</div>
                  </div>

                  {/* actions menu trigger */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenActionMenuId(openActionMenuId === r.id ? null : r.id)}
                      className="rounded-full p-1 hover:bg-slate-100"
                      aria-label="Actions"
                    >
                      <svg className="h-5 w-5 text-slate-600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 7a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" /></svg>
                    </button>

                    {openActionMenuId === r.id && (
                      <div className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-200 bg-white shadow-lg z-20">
                        <button onClick={() => { openPatient(r.patientId); setOpenActionMenuId(null); }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">Voir détails</button>
                        <button onClick={() => updateStatus(r.id, "confirmed")}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">Confirmer</button>
                        <button onClick={() => updateStatus(r.id, "to_call")}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">À rappeler</button>
                        <button onClick={() => updateStatus(r.id, "cancelled")}
                          className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-slate-50">Annuler</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-700">
                  <div>
                    <div className="text-xs text-slate-500">Motif</div>
                    <div className="font-medium truncate">{r.reason}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Assurance</div>
                    <div className="font-medium">{r.insurance}</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-slate-500">{r.phone}</div>
                  <div>{statusBadge(r.status)}</div>
                </div>
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && <div className="text-center text-slate-500">Aucune demande</div>}
      </div>

      {/* Drawer / Slide-over (FULLSCREEN on mobile) */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSelectedPatient(null)} />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl p-5 overflow-y-auto">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Fiche patient</h2>
                <p className="text-sm text-slate-500">{selectedPatient.last_name} {selectedPatient.first_name}</p>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="rounded-md border px-3 py-1 text-sm">Fermer</button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3">
              <div>
                <div className="text-xs text-slate-500">Téléphone</div>
                <div className="font-medium">{selectedPatient.phone}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Email</div>
                <div className="font-medium">{selectedPatient.email ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Naissance</div>
                <div className="font-medium">{selectedPatient.birth_date ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Assurance</div>
                <div className="font-medium">{selectedPatient.insurance}</div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-900">Historique des rendez-vous</h3>
              <div className="mt-3 divide-y rounded-md border">
                {history.length === 0 && <div className="px-3 py-6 text-center text-slate-500">Aucun RDV passé</div>}
                {history.map(h => (
                  <div key={h.id} className="flex items-center justify-between px-3 py-3">
                    <div>
                      <div className="text-sm font-medium">{new Date(h.date).toLocaleString("fr-FR")}</div>
                      <div className="text-xs text-slate-500">{h.doctor_name} • {h.specialty}</div>
                    </div>
                    <div>{statusLabel(h.status)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setSelectedPatient(null)} className="rounded-lg border px-3 py-2 text-sm">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}









