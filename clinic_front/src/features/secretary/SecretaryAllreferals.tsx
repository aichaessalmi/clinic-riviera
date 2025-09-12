// src/features/secretary/SecretaryReferrals.tsx
import { useMemo, useState } from "react";

/** Types */
type Referral = {
  id: number;
  patient: string;
  medecin: string;
  intervention: "Chirurgie" | "Radiologie" | "Urgences" | "Consultation" | string;
  date: string; // ISO yyyy-mm-dd
  assurance: "CNOPS" | "AXA" | "CNSS" | "FAR" | string;
  statut: "En attente" | "Confirmé" | "Terminé" | "Annulé";
  priorite: "Basse" | "Normale" | "Haute" | "Urgente";
};

/** Données mock */
const DATA: Referral[] = [
  { id: 1, patient: "Ahmed El Mansouri", medecin: "Dr. Youssef Karim", intervention: "Chirurgie",    date: "2025-08-20", assurance: "CNOPS", statut: "Confirmé",  priorite: "Normale" },
  { id: 2, patient: "Sara Benali",       medecin: "Dr. Fatima Zahra",  intervention: "Radiologie",   date: "2025-08-22", assurance: "AXA",   statut: "En attente", priorite: "Basse"   },
  { id: 3, patient: "Youssef Amrani",    medecin: "Dr. Hicham Idrissi",intervention: "Urgences",     date: "2025-08-25", assurance: "CNSS",  statut: "Terminé",   priorite: "Urgente" },
  { id: 4, patient: "Fatima Zahra",      medecin: "Dr. Youssef Karim", intervention: "Chirurgie",    date: "2025-08-18", assurance: "CNOPS", statut: "Confirmé",  priorite: "Haute"   },
  { id: 5, patient: "Karim Alami",       medecin: "Dr. Salma Bouchra", intervention: "Radiologie",   date: "2025-08-23", assurance: "FAR",   statut: "Annulé",    priorite: "Basse"   },
];

/** Helpers */
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit" });

const badge = (txt: string, color: string) =>
  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>{txt}</span>;

const statutBadge = (s: Referral["statut"]) => {
  switch (s) {
    case "Confirmé":    return badge("Confirmé", "bg-green-100 text-green-800");
    case "En attente":  return badge("En attente", "bg-yellow-100 text-yellow-800");
    case "Annulé":      return badge("Annulé", "bg-red-100 text-red-800");
    case "Terminé":     return badge("Terminé", "bg-blue-100 text-blue-800");
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

/** Composant principal */
export default function SecretaryReferrals() {
  const [search, setSearch] = useState("");
  const [filtreMedecin, setFiltreMedecin] = useState("Tous");
  const [filtreStatut, setFiltreStatut] = useState("Tous");

  const medecins = Array.from(new Set(DATA.map((d) => d.medecin)));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return DATA.filter((r) => {
      if (q && !r.patient.toLowerCase().includes(q) && !r.medecin.toLowerCase().includes(q)) return false;
      if (filtreMedecin !== "Tous" && r.medecin !== filtreMedecin) return false;
      if (filtreStatut !== "Tous" && r.statut !== filtreStatut) return false;
      return true;
    });
  }, [search, filtreMedecin, filtreStatut]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Références des Médecins</h1>
        <p className="text-gray-600">Liste des patients référés avec filtres et recherche</p>
      </div>

      {/* Filtres */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher patient ou médecin..."
          className="w-full md:w-64 rounded-lg border px-3 py-2 text-sm"
        />
        <select
          value={filtreMedecin}
          onChange={(e) => setFiltreMedecin(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="Tous">Tous les médecins</option>
          {medecins.map((m) => <option key={m}>{m}</option>)}
        </select>
        <select
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="Tous">Tous les statuts</option>
          <option value="En attente">En attente</option>
          <option value="Confirmé">Confirmé</option>
          <option value="Terminé">Terminé</option>
          <option value="Annulé">Annulé</option>
        </select>
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
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{r.patient}</td>
                <td className="px-4 py-2">{r.medecin}</td>
                <td className="px-4 py-2">{r.intervention}</td>
                <td className="px-4 py-2">{formatDate(r.date)}</td>
                <td className="px-4 py-2">{r.assurance}</td>
                <td className="px-4 py-2">{statutBadge(r.statut)}</td>
                <td className={`px-4 py-2 ${prioriteText(r.priorite)}`}>{r.priorite}</td>
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
              <h3 className="font-semibold text-gray-900">{r.patient}</h3>
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
                <p className="font-medium">{formatDate(r.date)}</p>
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
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-gray-500">Aucun résultat trouvé</div>
        )}
      </div>
    </div>
  );
}
