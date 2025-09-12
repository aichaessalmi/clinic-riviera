import  { useMemo, useState } from "react";

/** ==== Types ==== */
type Patient = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  birth_date?: string;       // ISO yyyy-mm-dd
  insurance: string;
  email?: string;            // optionnel si ton modèle l’ajoute plus tard
};

type PastAppointment = {
  id: number;
  patient_id: number;
  date: string;              // ISO
  doctor_name: string;
  specialty: string;
  status: "pending" | "confirmed" | "to_call" | "canceled";
};

/** ==== Mock data (remplace par ton API plus tard) ==== */
const PATIENTS: Patient[] = [
  { id: 1, first_name: "Ahmed",  last_name: "El Mansouri", phone: "0612-345-678", birth_date: "1990-05-20", insurance: "CNOPS", email: "ahmed@example.com" },
  { id: 2, first_name: "Sara",   last_name: "Benali",     phone: "0612-222-333", birth_date: "1988-10-11", insurance: "AXA" },
  { id: 3, first_name: "Youssef",last_name: "Amrani",     phone: "0622-111-444", birth_date: "1979-02-03", insurance: "CNSS" },
  { id: 4, first_name: "Fatima", last_name: "Zahra",      phone: "0655-999-000", birth_date: "1995-07-07", insurance: "CNOPS" },
];

const APPTS: PastAppointment[] = [
  { id: 101, patient_id: 1, date: "2025-08-02T10:00:00", doctor_name: "Dr. Karim", specialty: "Cardiologie", status: "confirmed" },
  { id: 102, patient_id: 1, date: "2025-05-15T09:30:00", doctor_name: "Dr. Fatima", specialty: "Radiologie",  status: "canceled"  },
  { id: 103, patient_id: 2, date: "2025-07-22T15:00:00", doctor_name: "Dr. Salma",  specialty: "Dermato",    status: "pending"   },
  { id: 104, patient_id: 3, date: "2025-06-11T11:15:00", doctor_name: "Dr. Omar",   specialty: "Ortho",      status: "confirmed" },
];

const statusLabel = (s: PastAppointment["status"]) => {
  switch (s) {
    case "confirmed": return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">Confirmé</span>;
    case "pending":   return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">En attente</span>;
    case "to_call":   return <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700">À rappeler</span>;
    case "canceled":  return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Annulé</span>;
    default:          return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{s}</span>;
  }
};

const fullName = (p: Patient) => `${p.last_name} ${p.first_name}`.trim();
const fmtDate = (iso?: string) => iso ? new Date(iso).toLocaleDateString("fr-FR") : "—";

/** ==== Page principale ==== */
export default function Patients() {
  const [q, setQ] = useState("");
  const [insFilter, setInsFilter] = useState("Toutes");
  const [selected, setSelected] = useState<Patient | null>(null);
  const [edit, setEdit] = useState<Partial<Patient>>({});

  // unique assurances
  const insurances = useMemo(
    () => Array.from(new Set(PATIENTS.map(p => p.insurance))),
    []
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return PATIENTS.filter(p => {
      const matchesQ =
        !s ||
        fullName(p).toLowerCase().includes(s) ||
        p.phone.toLowerCase().includes(s);
      const matchesIns = insFilter === "Toutes" || p.insurance === insFilter;
      return matchesQ && matchesIns;
    });
  }, [q, insFilter]);

  const openDetails = (p: Patient) => {
    setSelected(p);
    setEdit(p); // Pré-remplir l’édition
  };

  const closeDetails = () => {
    setSelected(null);
    setEdit({});
  };

  // TODO brancher API: PATCH /api/appointments/patients/:id/
  const save = async () => {
    // Ici on simule la sauvegarde
    // await http.patch(`/appointments/patients/${selected!.id}/`, edit);
    closeDetails();
    alert("✅ Modifications enregistrées (mock). Branche l’API pour persister.");
  };

  const history = useMemo(
    () => selected ? APPTS.filter(a => a.patient_id === selected.id) : [],
    [selected]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Patients — Fiche administrative</h1>
      </div>

      {/* Filtres */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher (nom, téléphone)…"
          className="w-full sm:w-72 rounded-lg border px-3 py-2 text-sm"
        />
        <select
          value={insFilter}
          onChange={(e) => setInsFilter(e.target.value)}
          className="w-full sm:w-56 rounded-lg border px-3 py-2 text-sm"
        >
          <option value="Toutes">Toutes les assurances</option>
          {insurances.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* Tableau desktop */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow ring-1 ring-gray-100">
        <table className="w-full">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-2 text-left">Patient</th>
              <th className="px-4 py-2 text-left">Téléphone</th>
              <th className="px-4 py-2 text-left">Date de naissance</th>
              <th className="px-4 py-2 text-left">Assurance</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{fullName(p)}</td>
                <td className="px-4 py-2">{p.phone || "—"}</td>
                <td className="px-4 py-2">{fmtDate(p.birth_date)}</td>
                <td className="px-4 py-2">{p.insurance}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => openDetails(p)}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                  >
                    Voir / Éditer
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  Aucun patient trouvé
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Cartes mobile */}
      <div className="grid gap-4 md:hidden">
        {filtered.map((p) => (
          <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{fullName(p)}</h3>
                <p className="text-sm text-gray-500">{p.phone}</p>
              </div>
              <button
                onClick={() => openDetails(p)}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white"
              >
                Détails
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Naissance</p>
                <p className="font-medium">{fmtDate(p.birth_date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Assurance</p>
                <p className="font-medium">{p.insurance}</p>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center text-gray-500">Aucun patient</div>}
      </div>

      {/* Slide-over / Drawer détails */}
      {selected && (
        <div className="fixed inset-0 z-40">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/30"
            onClick={closeDetails}
          />
          {/* panel */}
          <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Fiche patient</h2>
                <p className="text-gray-500">{fullName(selected)}</p>
              </div>
              <button onClick={closeDetails} className="rounded-lg border px-3 py-1.5 text-sm">
                Fermer
              </button>
            </div>

            {/* Formulaire admin */}
            <div className="mt-6 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Nom</label>
                  <input
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    value={edit.last_name ?? ""}
                    onChange={(e) => setEdit((s) => ({ ...s, last_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Prénom</label>
                  <input
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    value={edit.first_name ?? ""}
                    onChange={(e) => setEdit((s) => ({ ...s, first_name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Téléphone</label>
                  <input
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    value={edit.phone ?? ""}
                    onChange={(e) => setEdit((s) => ({ ...s, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Date de naissance</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    value={edit.birth_date ?? ""}
                    onChange={(e) => setEdit((s) => ({ ...s, birth_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Assurance</label>
                  <input
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    value={edit.insurance ?? ""}
                    onChange={(e) => setEdit((s) => ({ ...s, insurance: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Email (optionnel)</label>
                  <input
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                    value={edit.email ?? ""}
                    onChange={(e) => setEdit((s) => ({ ...s, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={save}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </div>

            {/* Historique rendez-vous */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-900">Historique des rendez-vous</h3>
              <div className="mt-3 overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Médecin</th>
                      <th className="px-3 py-2 text-left">Spécialité</th>
                      <th className="px-3 py-2 text-left">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {history.map(h => (
                      <tr key={h.id} className="bg-white">
                        <td className="px-3 py-2">{new Date(h.date).toLocaleString("fr-FR")}</td>
                        <td className="px-3 py-2">{h.doctor_name}</td>
                        <td className="px-3 py-2">{h.specialty}</td>
                        <td className="px-3 py-2">{statusLabel(h.status)}</td>
                      </tr>
                    ))}
                    {history.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                          Aucun rendez-vous passé
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
