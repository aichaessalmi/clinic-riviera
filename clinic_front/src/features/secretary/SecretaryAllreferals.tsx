// src/features/secretary/SecretaryReferrals.tsx
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // si tu utilises react-router (optionnel)

/** Types */
type Referral = {
  id: number;
  patient: string; // full name (we'll split for editing)
  medecin: string;
  intervention: "Chirurgie" | "Radiologie" | "Urgences" | "Consultation" | string;
  date: string; // ISO datetime (we'll accept yyyy-mm-dd or ISO)
  assurance: "CNOPS" | "AXA" | "CNSS" | "FAR" | string;
  statut: "En attente" | "Confirmé" | "Terminé" | "Annulé" | "À rappeler";
  priorite: "Basse" | "Normale" | "Haute" | "Urgente";
  phone?: string;
  email?: string;
  internalNotes?: string; // observations internes (non visibles patient)
};

/** Données mock (initial) */
const INITIAL_DATA: Referral[] = [
  { id: 1, patient: "Ahmed El Mansouri", medecin: "Dr. Youssef Karim", intervention: "Chirurgie", date: "2025-08-20T10:00:00.000Z", assurance: "CNOPS", statut: "Confirmé", priorite: "Normale", phone: "0612345678", email: "ahmed@example.com", internalNotes: "Pré-op: vérifier bilan sanguin" },
  { id: 2, patient: "Sara Benali",       medecin: "Dr. Fatima Zahra",  intervention: "Radiologie",  date: "2025-08-22T09:30:00.000Z", assurance: "AXA",   statut: "En attente", priorite: "Basse", phone: "0611222333", email: "sara@example.com" },
  { id: 3, patient: "Youssef Amrani",    medecin: "Dr. Hicham Idrissi",intervention: "Urgences",    date: "2025-08-25T14:15:00.000Z", assurance: "CNSS",  statut: "Terminé",   priorite: "Urgente", phone: "0622111444" },
  { id: 4, patient: "Fatima Zahra",      medecin: "Dr. Youssef Karim", intervention: "Chirurgie",   date: "2025-08-18T08:45:00.000Z", assurance: "CNOPS", statut: "Confirmé",  priorite: "Haute", phone: "0655999000" },
  { id: 5, patient: "Karim Alami",       medecin: "Dr. Salma Bouchra", intervention: "Radiologie",  date: "2025-08-23T11:30:00.000Z", assurance: "FAR",   statut: "Annulé",    priorite: "Basse" },
];

/** Helpers */

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

const badge = (txt: string, color: string) =>
  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>{txt}</span>;

const statutBadge = (s: Referral["statut"]) => {
  switch (s) {
    case "Confirmé":    return badge("Confirmé", "bg-green-100 text-green-800");
    case "En attente":  return badge("En attente", "bg-yellow-100 text-yellow-800");
    case "Annulé":      return badge("Annulé", "bg-red-100 text-red-800");
    case "Terminé":     return badge("Terminé", "bg-blue-100 text-blue-800");
    case "À rappeler":  return badge("À rappeler", "bg-amber-100 text-amber-800");
    default:            return badge(s, "bg-gray-100 text-gray-700");
  }
};

const prioriteText = (p: Referral["priorite"]) => {
  switch (p) {
    case "Urgente": return "text-red-600 font-bold";
    case "Haute":   return "text-orange-600 font-semibold";
    case "Normale": return "text-green-600";
    default:        return "text-gray-600";
  }
};

/** util: split full name into first/last (best-effort) */
function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/);
  if (parts.length <= 1) return { first: parts[0] ?? "", last: "" };
  const first = parts.slice(0, -1).join(" ");
  const last = parts[parts.length - 1];
  return { first, last };
}

/** util date <-> input datetime-local */
function toDatetimeLocalIso(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}
function fromDatetimeLocal(val: string) {
  if (!val) return new Date().toISOString();
  return new Date(val).toISOString();
}

/** Composant principal */
export default function SecretaryReferrals() {
  // utiliser sessionStorage pour persister localement pendant dev
  const [data, setData] = useState<Referral[]>(() => {
    try {
      const raw = sessionStorage.getItem("referrals_mock");
      return raw ? JSON.parse(raw) as Referral[] : INITIAL_DATA;
    } catch {
      return INITIAL_DATA;
    }
  });

  useEffect(() => {
    try { sessionStorage.setItem("referrals_mock", JSON.stringify(data)); } catch {}
  }, [data]);

  const [search, setSearch] = useState("");
  const [filtreMedecin, setFiltreMedecin] = useState("Tous");
  const [filtreStatut, setFiltreStatut] = useState("Tous");

  const medecins = useMemo(() => Array.from(new Set(data.map((d) => d.medecin))), [data]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return data.filter((r) => {
      if (q && !r.patient.toLowerCase().includes(q) && !r.medecin.toLowerCase().includes(q)) return false;
      if (filtreMedecin !== "Tous" && r.medecin !== filtreMedecin) return false;
      if (filtreStatut !== "Tous" && r.statut !== filtreStatut) return false;
      return true;
    });
  }, [data, search, filtreMedecin, filtreStatut]);

  // selected referral for detail/edit
  const [selected, setSelected] = useState<Referral | null>(null);

  // form fields for editing
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateAt, setDateAt] = useState(""); // datetime-local
  const [assurance, setAssurance] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [intervention, setIntervention] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [statut, setStatut] = useState<Referral["statut"]>("En attente");

  const [errors, setErrors] = useState<{ assurance?: string }>({});

  // open detail -> populate form
  const openDetail = (r: Referral) => {
    setSelected(r);
    const nm = splitName(r.patient);
    setFirstName(nm.first);
    setLastName(nm.last);
    setDateAt(toDatetimeLocalIso(r.date));
    setAssurance(r.assurance);
    setPhone(r.phone ?? "");
    setEmail(r.email ?? "");
    setIntervention(r.intervention);
    setInternalNotes(r.internalNotes ?? "");
    setStatut(r.statut);
    setErrors({});
    // scroll to top if mobile
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // save edits to local state
  const saveEdits = () => {
    // validate assurance
    const e: typeof errors = {};
    if (!assurance || assurance.trim() === "") e.assurance = "Assurance obligatoire";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    if (!selected) return;

    const updated: Referral = {
      ...selected,
      patient: `${firstName.trim()} ${lastName.trim()}`.trim(),
      date: fromDatetimeLocal(dateAt),
      assurance: assurance as Referral["assurance"],
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      intervention: intervention || selected.intervention,
      // keep priorite unchanged
      internalNotes: internalNotes.trim(),
      statut,
    };

    setData((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setSelected(updated);
    alert("✅ Modifications enregistrées (frontend-only)");
  };

  // close detail
  const closeDetail = () => setSelected(null);

  // create new referral (quick)
  const createNew = () => {
    const id = Math.max(0, ...data.map(d => d.id)) + 1;
    const newRef: Referral = {
      id,
      patient: "Nouvel Patient",
      medecin: medecins[0] ?? "Dr. Inconnu",
      intervention: "Consultation",
      date: new Date().toISOString(),
      assurance: "CNOPS",
      statut: "En attente",
      priorite: "Normale",
      phone: "",
      email: "",
      internalNotes: "",
    };
    setData(prev => [newRef, ...prev]);
    openDetail(newRef);
  };

  // navigate helper (optional)
  let navigate: ReturnType<typeof useNavigate> | null = null;
  try { navigate = useNavigate(); } catch { /* ignore if not in router */ }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Références des Médecins</h1>
        <p className="text-gray-600">Liste des patients référés — clique sur "Voir détails" pour consulter / modifier</p>
      </div>

      {/* Filtres */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher patient, médecin..."
          className="w-full md:w-64 rounded-lg border px-3 py-2 text-sm"
        />
        <select value={filtreMedecin} onChange={(e) => setFiltreMedecin(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="Tous">Tous les médecins</option>
          {medecins.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} className="rounded-lg border px-3 py-2 text-sm">
          <option value="Tous">Tous les statuts</option>
          <option value="En attente">En attente</option>
          <option value="Confirmé">Confirmé</option>
          <option value="Terminé">Terminé</option>
          <option value="Annulé">Annulé</option>
          <option value="À rappeler">À rappeler</option>
        </select>

        <div className="ml-auto flex gap-2">
          <button onClick={createNew} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">+ Nouvelle référence</button>
          <button onClick={() => { if (navigate) navigate("/dashboard"); }} className="rounded-lg border px-3 py-2 text-sm">Retour</button>
        </div>
      </div>

      {/* Tableau Desktop */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow">
        <table className="w-full">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-2 text-left">Patient</th>
              <th className="px-4 py-2 text-left">Médecin</th>
              <th className="px-4 py-2 text-left">Intervention</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Assurance</th>
              <th className="px-4 py-2 text-left">Statut</th>
              <th className="px-4 py-2 text-left">Priorité</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{r.patient}</td>
                <td className="px-4 py-2">{r.medecin}</td>
                <td className="px-4 py-2">{r.intervention}</td>
                <td className="px-4 py-2">{formatDateTime(r.date)}</td>
                <td className="px-4 py-2">{r.assurance}</td>
                <td className="px-4 py-2">{statutBadge(r.statut)}</td>
                <td className={`px-4 py-2 ${prioriteText(r.priorite)}`}>{r.priorite}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button onClick={() => openDetail(r)} className="rounded-md bg-slate-200 px-3 py-1 text-sm hover:bg-slate-300">Voir détails</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vue Mobile */}
      <div className="grid gap-4 md:hidden">
        {filtered.map((r) => (
          <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 truncate">{r.patient}</h3>
              {statutBadge(r.statut)}
            </div>
            <p className="text-sm text-gray-500">Médecin: {r.medecin}</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Intervention</p>
                <p className="font-medium">{r.intervention}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-medium">{formatDateTime(r.date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Assurance</p>
                <p className="font-medium">{r.assurance}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Priorité</p>
                <p className={`${prioriteText(r.priorite)}`}>{r.priorite}</p>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={() => openDetail(r)} className="rounded-md bg-slate-200 px-3 py-1 text-sm hover:bg-slate-300">Voir détails</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center text-gray-500">Aucun résultat trouvé</div>}
      </div>

      {/* ======= Slide-over / Modal Détail ======= */}
      {selected && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={closeDetail} />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[680px] bg-white shadow-2xl p-6 overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Détail de la demande</h2>
                <p className="text-sm text-slate-500">Consulter et modifier la demande (frontend-only)</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { if (navigate) navigate(-1); else closeDetail(); }} className="rounded-md border px-3 py-2 text-sm">Retour au tableau</button>
                <button onClick={saveEdits} className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">Enregistrer les modifications</button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Nom / Prénom */}
              <div>
                <label className="text-xs font-medium text-slate-600">Prénom</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Nom</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>

              {/* Date & heure souhaitées */}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-600">Date & heure souhaitées</label>
                <input type="datetime-local" value={dateAt} onChange={(e) => setDateAt(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>

              {/* Assurance (obligatoire) */}
              <div>
                <label className="text-xs font-medium text-slate-600">Assurance (obligatoire)</label>
                <input value={assurance} onChange={(e) => setAssurance(e.target.value)} className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm ${errors.assurance ? "border-rose-400 bg-rose-50" : "border-slate-200"}`} />
                {errors.assurance && <div className="mt-1 text-xs text-rose-600">{errors.assurance}</div>}
              </div>

              {/* Coordonnées */}
              <div>
                <label className="text-xs font-medium text-slate-600">Téléphone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">E-mail (optionnel)</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>

              {/* Motif / Intervention */}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-600">Motif / Intervention</label>
                <input value={intervention} onChange={(e) => setIntervention(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
              </div>

              {/* Observations internes */}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-600">Observations internes (confidentiel)</label>
                <textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50" />
                <div className="text-xs text-slate-500 mt-1">Ces notes ne sont pas visibles par le patient.</div>
              </div>

              {/* Statut */}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-600">Statut de la demande</label>
                <select value={statut} onChange={(e) => setStatut(e.target.value as Referral["statut"])} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <option value="En attente">En attente</option>
                  <option value="À rappeler">À rappeler</option>
                  <option value="Confirmé">Confirmé</option>
                  <option value="Annulé">Annulé</option>
                  <option value="Terminé">Terminé</option>
                </select>
              </div>
            </div>

            {/* footer */}
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={closeDetail} className="rounded-md border px-3 py-2 text-sm">Fermer</button>
              <button onClick={saveEdits} className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">Enregistrer les modifications</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
