import React, { useMemo, useState } from "react";

/** Types */
type Referral = {
  id: number;
  nom: string;
  intervention: "Chirurgie" | "Radiologie" | "Urgences" | "Consultation" | string;
  date: string; // ISO yyyy-mm-dd
  assurance: "CNOPS" | "AXA" | "CNSS" | "FAR" | string;
  statut: "En attente" | "Confirmé" | "Terminé" | "Annulé";
  priorite: "Basse" | "Normale" | "Haute" | "Urgente";
};

/** Données mock */
const DATA: Referral[] = [
  { id: 1, nom: "Ahmed El Mansouri", intervention: "Chirurgie",    date: "2025-08-20", assurance: "CNOPS", statut: "Confirmé",  priorite: "Normale" },
  { id: 2, nom: "Sara Benaliaimne",       intervention: "Radiologie",   date: "2025-08-22", assurance: "AXA",   statut: "En attente", priorite: "Basse"   },
  { id: 3, nom: "Youssef Amrani",    intervention: "Urgences",     date: "2025-08-25", assurance: "CNSS",  statut: "Terminé",   priorite: "Urgente" },
  { id: 4, nom: "Fatima Zahra",      intervention: "Chirurgie",    date: "2025-08-18", assurance: "CNOPS", statut: "Confirmé",  priorite: "Haute"   },
  { id: 5, nom: "Karim Alami",       intervention: "Radiologie",   date: "2025-08-23", assurance: "FAR",   statut: "Annulé",    priorite: "Basse"   },
  { id: 6, nom: "Leila Smith",       intervention: "Consultation", date: "2025-08-19", assurance: "AXA",   statut: "Terminé",   priorite: "Normale" },
];

/** Helpers */
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit" });

const initials = (fullName: string) =>
  fullName
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

const interventionBadge = (type: string) => {
  switch (type) {
    case "Chirurgie":   return "bg-rose-200 text-red-700";
    case "Radiologie":  return "bg-indigo-200 text-indigo-800";
    case "Urgences":    return "bg-amber-200 text-amber-800";
    default:            return "bg-gray-200 text-gray-700";
  }
};

const statutBadge = (s: Referral["statut"]) => {
  switch (s) {
    case "Confirmé":    return "bg-green-200 text-green-800";
    case "En attente":  return "bg-yellow-200 text-yellow-800";
    case "Annulé":      return "bg-rose-200 text-rose-800";
    case "Terminé":     return "bg-blue-200 text-blue-800";
    default:            return "bg-gray-200 text-gray-700";
  }
};

const priorityText = (p: Referral["priorite"]) => {
  switch (p) {
    case "Urgente": return "text-red-600 font-bold";
    case "Haute":   return "text-orange-600 font-semibold";
    case "Normale": return "text-green-600";
    case "Basse":   return "text-gray-600";
    default:        return "text-gray-600";
  }
};

const exportCSV = (rows: Referral[]) => {
  const header = ["ID", "Nom", "Intervention", "Date", "Assurance", "Statut", "Priorité"];
  const body = rows.map((r) => [r.id, r.nom, r.intervention, r.date, r.assurance, r.statut, r.priorite]);
  const csv = [header, ...body]
    .map((line) => line.map(String).map((v) => `"${v.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `patients_referes_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

/** Composant principal */
const ReferralDashboard: React.FC = () => {
  const [search, setSearch] = useState("");
  const [intervention, setIntervention] = useState<string>("Tous");
  const [statut, setStatut] = useState<string>("Tous");
  const [assurance, setAssurance] = useState<string>("Tous");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return DATA.filter((p) => {
      if (q && !p.nom.toLowerCase().includes(q) && !p.assurance.toLowerCase().includes(q)) return false;
      if (intervention !== "Tous" && p.intervention !== intervention) return false;
      if (statut !== "Tous" && p.statut !== (statut as Referral["statut"])) return false;
      if (assurance !== "Tous" && p.assurance !== assurance) return false;
      if (startDate && p.date < startDate) return false;
      if (endDate && p.date > endDate) return false;
      return true;
    });
  }, [search, intervention, statut, assurance, startDate, endDate]);

  const stats = useMemo(() => {
    const total = DATA.length;
    const by = (kind: Referral["intervention"]) => DATA.filter((d) => d.intervention === kind).length;
    return { total, chir: by("Chirurgie"), radio: by("Radiologie"), urg: by("Urgences") };
  }, []);

  const setTodayRange = () => {
    const t = new Date().toISOString().slice(0, 10);
    setStartDate(t);
    setEndDate(t);
  };

  const reset = () => {
    setSearch("");
    setIntervention("Tous");
    setStatut("Tous");
    setAssurance("Tous");
    setStartDate("");
    setEndDate("");
  };

  const refresh = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 800));
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header + stats */}
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Système de Gestion des Patients Référés</h1>
            <p className="mt-2 text-gray-600">Suivez et gérez tous les patients référés à votre établissement</p>
          </div>
          <div className="grid w-full grid-cols-2 gap-4 md:w-auto md:grid-cols-4">
            <div className="stats-card rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-4 text-center text-white">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm opacity-80">Patients totaux</div>
            </div>
            <div className="stats-card rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-4 text-center text-white">
              <div className="text-2xl font-bold">{stats.chir}</div>
              <div className="text-sm opacity-80">Chirurgies</div>
            </div>
            <div className="stats-card rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-4 text-center text-white">
              <div className="text-2xl font-bold">{stats.radio}</div>
              <div className="text-sm opacity-80">Radiologies</div>
            </div>
            <div className="stats-card rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-4 text-center text-white">
              <div className="text-2xl font-bold">{stats.urg}</div>
              <div className="text-sm opacity-80">Urgences</div>
            </div>
          </div>
        </div>

        {/* Filtres + actions */}
        <div className="rounded-2xl bg-white/80 p-6 shadow-md ring-1 ring-gray-100 backdrop-blur">
          <div className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
            <h2 className="text-lg font-semibold text-gray-800">Filtres et recherche</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={refresh}
                className="rounded-lg bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
              >
                {busy ? "Actualisation..." : "Actualiser"}
              </button>
              <button
                onClick={() => exportCSV(filtered)}
                disabled={filtered.length === 0}
                className="rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:scale-[1.02] hover:shadow-lg disabled:opacity-50"
              >
                Exporter CSV
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Recherche</label>
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom, assurance..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Type d'intervention</label>
              <select
                value={intervention}
                onChange={(e) => setIntervention(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Tous">Toutes les interventions</option>
                <option value="Chirurgie">Chirurgie</option>
                <option value="Radiologie">Radiologie</option>
                <option value="Urgences">Urgences</option>
                <option value="Consultation">Consultation</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Statut</label>
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Tous">Tous les statuts</option>
                <option value="Confirmé">Confirmé</option>
                <option value="En attente">En attente</option>
                <option value="Terminé">Terminé</option>
                <option value="Annulé">Annulé</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Assurance</label>
              <select
                value={assurance}
                onChange={(e) => setAssurance(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Tous">Toutes les assurances</option>
                <option value="CNOPS">CNOPS</option>
                <option value="AXA">AXA</option>
                <option value="CNSS">CNSS</option>
                <option value="FAR">FAR</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Date de début</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Date de fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={setTodayRange}
                className="rounded-lg bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-200"
              >
                Aujourd&apos;hui
              </button>
              <button
                onClick={reset}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800">Liste des patients référés</h2>
            <span className="text-sm text-gray-500">{filtered.length} résultat(s)</span>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Intervention</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Assurance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Priorité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filtered.map((p) => (
                  <tr key={p.id} className="transition-all hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-800">
                          {initials(p.nom)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{p.nom}</div>
                          <div className="text-sm text-gray-500">ID: P-{String(p.id).padStart(3, "0")}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${interventionBadge(p.intervention)}`}>
                        {p.intervention}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{formatDate(p.date)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{p.assurance}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statutBadge(p.statut)}`}>
                        {p.statut}
                      </span>
                    </td>
                    <td className={`whitespace-nowrap px-6 py-4 text-sm ${priorityText(p.priorite)}`}>{p.priorite}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      Aucun résultat
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="grid gap-4 p-4 md:hidden">
            {filtered.map((p) => (
              <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{p.nom}</h3>
                    <p className="text-sm text-gray-500">ID: P-{String(p.id).padStart(3, "0")}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${interventionBadge(p.intervention)}`}>
                    {p.intervention}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="font-medium">{formatDate(p.date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Assurance</p>
                    <p className="font-medium">{p.assurance}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Statut</p>
                    <p className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statutBadge(p.statut)}`}>{p.statut}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Priorité</p>
                    <p className={`${priorityText(p.priorite)}`}>{p.priorite}</p>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-center text-gray-500">Aucun résultat</div>}
          </div>

          {/* Pagination (affichage informatif simple) */}
          <div className="border-t border-gray-200 px-6 py-4 text-sm text-gray-700">
            Affichage de <span className="font-medium">{filtered.length === 0 ? 0 : 1}</span> à{" "}
            <span className="font-medium">{filtered.length}</span> sur{" "}
            <span className="font-medium">{filtered.length}</span> résultats
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          © 2025 Système de Gestion Médicale. Tous droits réservés.
        </div>
      </div>
    </div>
  );
};

export default ReferralDashboard;
