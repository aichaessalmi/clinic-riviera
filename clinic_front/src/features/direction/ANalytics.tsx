import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";

/** =====================================================
 *  SecretaryDashboard (Liste & Fiche RDV complètes)
 *  - Filtres: période, statut, médecin, spécialité, assurance
 *  - Actions: changer statut, éditer fiche (drawer), exporter
 *  - Fiche RDV: champs + historique des statuts
 *  - Mobile: cartes | Desktop: tableau
 *  ===================================================== */

// -------------------- Types --------------------
type Status = "Confirmé" | "À rappeler" | "Annulé";
type Source = "Site" | "Webapp";

type StatusHistory = {
  at: string; // ISO date
  from: Status;
  to: Status;
  by: string; // utilisateur
};

type RDV = {
  id: number;
  patientNom: string;
  patientPrenom: string;
  telephone: string;
  email?: string;
  specialite: string;
  medecin?: string;
  dateHeure: string; // ISO
  assurance: string; // obligatoire
  motif?: string;
  statut: Status;
  notes?: string;
  createdAt: string; // ISO
  updatedAt?: string; // ISO
  traitePar?: string;
  source: Source;
  history: StatusHistory[]; // historique des statuts
};

// -------------------- Styles statut --------------------
const statusClass: Record<Status, string> = {
  Confirmé: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
  "À rappeler": "bg-amber-50 text-amber-800 ring-1 ring-amber-700/20",
  Annulé: "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20",
};

// -------------------- Couleurs des charts --------------------
const COLORS_STATUS: Record<Status, string> = {
  Confirmé: "#10B981", // emerald-500
  "À rappeler": "#F59E0B", // amber-500
  Annulé: "#F43F5E", // rose-500
};
const COLORS_CYCLE = [
  "#0EA5E9", // sky-500
  "#22C55E", // green-500
  "#F59E0B", // amber-500
  "#6366F1", // indigo-500
  "#F43F5E", // rose-500
  "#14B8A6", // teal-500
];
const LINE_COLOR = "#0EA5E9"; // sky-500

// -------------------- Données de démonstration --------------------
const RDV_DEMO: RDV[] = [
  {
    id: 2001,
    patientNom: "El Mansouri",
    patientPrenom: "Ahmed",
    telephone: "+212612345678",
    email: "ahmed@example.com",
    specialite: "Chirurgie",
    medecin: "Dr. Saidi",
    dateHeure: "2025-09-14T10:00:00",
    assurance: "CNOPS",
    motif: "Consultation pré-op",
    statut: "Confirmé",
    createdAt: "2025-09-10T09:15:00",
    updatedAt: "2025-09-12T12:30:00",
    traitePar: "Secrétaire A",
    source: "Site",
    history: [
      { at: "2025-09-10T09:15:00", from: "À rappeler", to: "Confirmé", by: "Secrétaire A" },
    ],
  },
  {
    id: 2002,
    patientNom: "Benali",
    patientPrenom: "Sara",
    telephone: "+212698765432",
    email: "sara@example.com",
    specialite: "Radiologie",
    medecin: "Dr. Hadi",
    dateHeure: "2025-09-15T15:30:00",
    assurance: "CNSS",
    motif: "IRM",
    statut: "À rappeler",
    createdAt: "2025-09-10T10:20:00",
    traitePar: "Secrétaire B",
    source: "Webapp",
    history: [],
  },
  {
    id: 2003,
    patientNom: "Alaoui",
    patientPrenom: "Youssef",
    telephone: "+212633112233",
    email: "y.alaoui@example.com",
    specialite: "Urgences",
    medecin: undefined,
    dateHeure: "2025-09-16T08:45:00",
    assurance: "AXA",
    motif: "Trauma léger",
    statut: "Annulé",
    createdAt: "2025-09-11T08:10:00",
    updatedAt: "2025-09-12T16:00:00",
    traitePar: "Secrétaire C",
    source: "Site",
    history: [{ at: "2025-09-12T16:00:00", from: "À rappeler", to: "Annulé", by: "Secrétaire C" }],
  },
  {
    id: 2004,
    patientNom: "Zahraoui",
    patientPrenom: "Nawal",
    telephone: "+212677889900",
    email: "nawal@example.com",
    specialite: "Cardiologie",
    medecin: "Dr. Rami",
    dateHeure: "2025-09-18T11:15:00",
    assurance: "Saham",
    motif: "Douleur thoracique",
    statut: "Confirmé",
    createdAt: "2025-09-12T14:35:00",
    traitePar: "Secrétaire A",
    source: "Webapp",
    history: [],
  },
  {
    id: 2005,
    patientNom: "Hammadi",
    patientPrenom: "Aya",
    telephone: "+212612220099",
    email: "aya.h@example.com",
    specialite: "Radiologie",
    medecin: "Dr. Hadi",
    dateHeure: "2025-09-19T16:00:00",
    assurance: "CNOPS",
    motif: "Scanner",
    statut: "Confirmé",
    createdAt: "2025-09-13T09:00:00",
    traitePar: "Secrétaire B",
    source: "Site",
    history: [],
  },
];

// -------------------- Utils --------------------
const formatDate = (iso: string) => new Date(iso).toLocaleString();

// Hook simple: mobile ?
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}

// (afficher/masquer le header)
const SHOW_HEADER = false;

// -------------------- Composant principal --------------------
export default function SecretaryDashboard() {
  const [rows, setRows] = useState<RDV[]>(RDV_DEMO);
  const isMobile = useIsMobile();

  // Filtres
  const [dateDe, setDateDe] = useState<string>("");
  const [dateA, setDateA] = useState<string>("");
  const [filtreSpecialite, setFiltreSpecialite] = useState<string>("Tous");
  const [filtreMedecin, setFiltreMedecin] = useState<string>("Tous");
  const [filtreStatut, setFiltreStatut] = useState<string>("Tous");
  const [filtreAssurance, setFiltreAssurance] = useState<string>("Toutes");
  const [filtreSource, setFiltreSource] = useState<string>("Toutes");

  const specialites = useMemo(
    () => ["Tous", ...Array.from(new Set(rows.map((r) => r.specialite)))],
    [rows]
  );
  const medecins = useMemo(
    () => ["Tous", ...Array.from(new Set(rows.map((r) => r.medecin || "—")))],
    [rows]
  );
  const assurances = useMemo(
    () => ["Toutes", ...Array.from(new Set(rows.map((r) => r.assurance)))],
    [rows]
  );
  const sources = ["Toutes", "Site", "Webapp"] as const;
  const statuts = ["Tous", "Confirmé", "À rappeler", "Annulé"] as const;

  // Application filtres
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const d = new Date(r.dateHeure).getTime();
      const okDe = dateDe ? d >= new Date(dateDe).getTime() : true;
      const okA = dateA ? d <= new Date(dateA).getTime() + 86_399_000 : true;
      const okSpec = filtreSpecialite === "Tous" || r.specialite === filtreSpecialite;
      const okMed = filtreMedecin === "Tous" || (r.medecin || "—") === filtreMedecin;
      const okStat = filtreStatut === "Tous" || r.statut === (filtreStatut as Status);
      const okAss = filtreAssurance === "Toutes" || r.assurance === filtreAssurance;
      const okSrc = filtreSource === "Toutes" || r.source === (filtreSource as Source);
      return okDe && okA && okSpec && okMed && okStat && okAss && okSrc;
    });
  }, [rows, dateDe, dateA, filtreSpecialite, filtreMedecin, filtreStatut, filtreAssurance, filtreSource]);

  // KPIs
  const kpi = useMemo(() => {
    const total = filtered.length;
    const confirmes = filtered.filter((r) => r.statut === "Confirmé").length;
    const aRappeler = filtered.filter((r) => r.statut === "À rappeler").length;
    const annules = filtered.filter((r) => r.statut === "Annulé").length;
    return { total, confirmes, aRappeler, annules };
  }, [filtered]);

  // Stats Recharts
  const byStatut = useMemo(() => {
    const map: Record<Status, number> = { Confirmé: 0, "À rappeler": 0, Annulé: 0 };
    filtered.forEach((r) => (map[r.statut] += 1));
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const bySpecialite = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((r) => map.set(r.specialite, (map.get(r.specialite) || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const byDate = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((r) => {
      const key = new Date(r.dateHeure).toISOString().slice(0, 10);
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [filtered]);

  // Sélection / fiche
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = useMemo(() => rows.find((r) => r.id === selectedId) || null, [rows, selectedId]);

  // Actions
  const pushHistory = (prev: RDV, to: Status, by = prev.traitePar || "Secrétaire") => {
    const entry: StatusHistory = { at: new Date().toISOString(), from: prev.statut, to, by };
    return [...prev.history, entry];
    // on garde l'historique existant + nouvel événement
  };

  const updateStatus = (id: number, newStatus: Status) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              statut: newStatus,
              updatedAt: new Date().toISOString(),
              history: pushHistory(r, newStatus),
            }
          : r
      )
    );
  };

  const saveRdv = (updated: RDV) => {
    setRows((prev) => prev.map((r) => (r.id === updated.id ? { ...updated, updatedAt: new Date().toISOString() } : r)));
    setSelectedId(null);
  };

  const exportExcel = () => {
    const data = filtered.map((r) => ({
      ID: r.id,
      Patient: `${r.patientPrenom} ${r.patientNom}`,
      Téléphone: r.telephone,
      Email: r.email || "",
      Spécialité: r.specialite,
      Médecin: r.medecin || "",
      "Date/Heure": formatDate(r.dateHeure),
      Assurance: r.assurance,
      Motif: r.motif || "",
      Statut: r.statut,
      "Traité par": r.traitePar || "",
      Source: r.source,
      "Créé le": formatDate(r.createdAt),
      "Modifié le": r.updatedAt ? formatDate(r.updatedAt) : "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RDV");
    XLSX.writeFile(wb, `rdv_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Charts: tailles adaptées au mobile
  const pieOuter = isMobile ? 70 : 90;

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-sky-50 to-slate-50">
      <div className="p-3 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        {/* Header (optionnel) */}
        {SHOW_HEADER ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
                Tableau de bord — Secrétariat
              </h1>
              <p className="text-sm text-slate-600">Gestion des demandes de RDV et suivi quotidien.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportExcel}
                className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 shadow-sm"
              >
                Exporter (Excel)
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end">
            <button
              onClick={exportExcel}
              className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 shadow-sm"
            >
              Exporter (Excel)
            </button>
          </div>
        )}

        {/* Filtres */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-7 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600">Période — de</label>
            <input
              type="date"
              value={dateDe}
              onChange={(e) => setDateDe(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-600">Période — à</label>
            <input
              type="date"
              value={dateA}
              onChange={(e) => setDateA(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Spécialité</label>
            <select
              value={filtreSpecialite}
              onChange={(e) => setFiltreSpecialite(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              {specialites.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Médecin</label>
            <select
              value={filtreMedecin}
              onChange={(e) => setFiltreMedecin(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              {medecins.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Statut</label>
            <select
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              {statuts.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Assurance</label>
            <select
              value={filtreAssurance}
              onChange={(e) => setFiltreAssurance(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              {assurances.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Source</label>
            <select
              value={filtreSource}
              onChange={(e) => setFiltreSource(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            >
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* KPIs */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard title="Total demandes" value={kpi.total} subtitle="Après filtres" accentClass="border-l-4 border-sky-600" />
          <KpiCard title="Confirmés" value={kpi.confirmes} subtitle="RDV validés" accentClass="border-l-4 border-emerald-600" />
          <KpiCard title="À rappeler" value={kpi.aRappeler} subtitle="À recontacter" accentClass="border-l-4 border-amber-600" />
          <KpiCard title="Annulés" value={kpi.annules} subtitle="Non maintenus" accentClass="border-l-4 border-rose-600" />
        </div>

        {/* Charts */}
        <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4">
          <div className="rounded-xl border border-slate-200 bg-white/90 p-3 sm:p-4 shadow-sm">
            <h3 className="text-sm font-medium mb-2 text-slate-800">Répartition par statut</h3>
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie dataKey="value" data={byStatut} outerRadius={pieOuter} label>
                    {byStatut.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={COLORS_STATUS[entry.name as Status] ?? COLORS_CYCLE[idx % COLORS_CYCLE.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white/90 p-3 sm:p-4 shadow-sm">
            <h3 className="text-sm font-medium mb-2 text-slate-800">RDV par spécialité</h3>
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySpecialite}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value">
                    {bySpecialite.map((_, idx) => (
                      <Cell key={idx} fill={COLORS_CYCLE[idx % COLORS_CYCLE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white/90 p-3 sm:p-4 shadow-sm">
            <h3 className="text-sm font-medium mb-2 text-slate-800">Évolution par date</h3>
            <div className="h-56 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={byDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke={LINE_COLOR} strokeWidth={2} dot={{ r: isMobile ? 2 : 3 }} activeDot={{ r: isMobile ? 4 : 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ==== LISTES ==== */}
        {/* Mobile: Cards */}
        <div className="mt-5 space-y-3 sm:hidden">
          {filtered.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-slate-900">
                    {r.patientPrenom} {r.patientNom}
                  </div>
                  <div className="text-xs text-slate-500">{r.telephone}</div>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium ${statusClass[r.statut]}`}>{r.statut}</span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-1 text-sm">
                <div className="text-slate-700">
                  <span className="text-slate-500">Spécialité:</span> {r.specialite}
                  {r.medecin ? ` — ${r.medecin}` : ""}
                </div>
                <div className="text-slate-700">
                  <span className="text-slate-500">Date:</span> {formatDate(r.dateHeure)}
                </div>
                <div className="text-slate-700">
                  <span className="text-slate-500">Assurance:</span> {r.assurance}
                </div>
                {r.email && (
                  <div className="text-slate-700">
                    <span className="text-slate-500">Email:</span> {r.email}
                  </div>
                )}
                <div className="text-slate-700 truncate" title={r.motif ?? ""}>
                  <span className="text-slate-500">Motif:</span> {r.motif || "—"}
                </div>
                <div className="text-slate-700">
                  <span className="text-slate-500">Source:</span> {r.source}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <select
                  className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                  value={r.statut}
                  onChange={(e) => updateStatus(r.id, e.target.value as Status)}
                >
                  <option value="Confirmé">Confirmé</option>
                  <option value="À rappeler">À rappeler</option>
                  <option value="Annulé">Annulé</option>
                </select>
                <button
                  onClick={() => setSelectedId(r.id)}
                  className="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  Éditer
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop/Tablet: Tableau */}
        <div className="mt-6 rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm hidden sm:block">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white">
            <h3 className="text-sm font-medium text-slate-800">Demandes reçues via le site / webapp</h3>
            <span className="text-xs text-slate-500">{filtered.length} élément(s)</span>
          </div>
          <div className="overflow-auto max-h-[70vh]">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur text-slate-700 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">
                <tr>
                  <Th>ID</Th>
                  <Th>Patient</Th>
                  <Th>Téléphone</Th>
                  <Th>Email</Th>
                  <Th>Spécialité</Th>
                  <Th>Médecin</Th>
                  <Th>Date/Heure</Th>
                  <Th>Assurance</Th>
                  <Th>Motif</Th>
                  <Th>Statut</Th>
                  <Th>Traité par</Th>
                  <Th>Source</Th>
                  <Th>Créé le</Th>
                  <Th>Modifié le</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} className={`border-t border-slate-100 hover:bg-sky-50/50 ${i % 2 ? "bg-slate-50/40" : "bg-white"}`}>
                    <Td>{r.id}</Td>
                    <Td>{r.patientPrenom} {r.patientNom}</Td>
                    <Td>{r.telephone}</Td>
                    <Td>{r.email || "—"}</Td>
                    <Td>{r.specialite}</Td>
                    <Td>{r.medecin || "—"}</Td>
                    <Td>{formatDate(r.dateHeure)}</Td>
                    <Td>{r.assurance}</Td>
                    <Td className="max-w-[260px] truncate" title={r.motif ?? ""}>{r.motif || "—"}</Td>
                    <Td>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium ${statusClass[r.statut]}`}>{r.statut}</span>
                    </Td>
                    <Td>{r.traitePar || "—"}</Td>
                    <Td>{r.source}</Td>
                    <Td>{formatDate(r.createdAt)}</Td>
                    <Td>{r.updatedAt ? formatDate(r.updatedAt) : "—"}</Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <select
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                          value={r.statut}
                          onChange={(e) => updateStatus(r.id, e.target.value as Status)}
                        >
                          <option value="Confirmé">Confirmé</option>
                          <option value="À rappeler">À rappeler</option>
                          <option value="Annulé">Annulé</option>
                        </select>
                        <button
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                          onClick={() => setSelectedId(r.id)}
                        >
                          Éditer
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Drawer FICHE RDV */}
        {selected && (
          <RDVDrawer
            rdv={selected}
            onClose={() => setSelectedId(null)}
            onSave={saveRdv}
            onStatus={(st) => updateStatus(selected.id, st)}
          />
        )}
      </div>
    </div>
  );
}

/* ========================
   Drawer de fiche RDV
   ======================== */
function RDVDrawer({
  rdv,
  onClose,
  onSave,
  onStatus,
}: {
  rdv: RDV;
  onClose: () => void;
  onSave: (r: RDV) => void;
  onStatus: (s: Status) => void;
}) {
  const [form, setForm] = useState<RDV>({ ...rdv });
  const [touched, setTouched] = useState(false);
  const requiredError = touched && !form.assurance;

  const set = <K extends keyof RDV>(k: K, v: RDV[K]) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSave = () => {
    setTouched(true);
    if (!form.assurance) return; // assurance obligatoire
    onSave(form);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Fiche RDV #{rdv.id}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 text-sm">Fermer</button>
        </div>

        <div className="p-4 space-y-4 overflow-auto">
          {/* Patient */}
          <Section title="Patient">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Nom" value={form.patientNom} onChange={(v) => set("patientNom", v)} />
              <Input label="Prénom" value={form.patientPrenom} onChange={(v) => set("patientPrenom", v)} />
              <Input label="Téléphone" value={form.telephone} onChange={(v) => set("telephone", v)} />
              <Input label="Email" value={form.email || ""} onChange={(v) => set("email", v)} />
            </div>
          </Section>

          {/* RDV */}
          <Section title="Spécialité & RDV">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Spécialité" value={form.specialite} onChange={(v) => set("specialite", v)} />
              <Input label="Médecin" value={form.medecin || ""} onChange={(v) => set("medecin", v)} />
              <Input label="Date & heure" type="datetime-local"
                     value={form.dateHeure.slice(0,16)}
                     onChange={(v) => set("dateHeure", new Date(v).toISOString())} />
              <div>
                <label className="block text-xs font-medium text-slate-600">Assurance <span className="text-rose-600">*</span></label>
                <input
                  className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus-visible:outline-none ${
                    requiredError ? "border-rose-400 focus-visible:ring-2 focus-visible:ring-rose-500" : "border-slate-200 focus-visible:ring-2 focus-visible:ring-sky-500"
                  }`}
                  value={form.assurance}
                  onChange={(e) => set("assurance", e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="Ex: CNSS, CNOPS…"
                />
                {requiredError && <p className="mt-1 text-xs text-rose-600">Assurance obligatoire.</p>}
              </div>
            </div>
            <Textarea label="Motif" value={form.motif || ""} onChange={(v) => set("motif", v)} />
          </Section>

          {/* Statut & historique */}
          <Section title="Statut & Historique">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium ${statusClass[form.statut]}`}>{form.statut}</span>
              <select
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                value={form.statut}
                onChange={(e) => {
                  const next = e.target.value as Status;
                  set("statut", next);
                  onStatus(next); // met à jour la liste + historique
                }}
              >
                <option value="Confirmé">Confirmé</option>
                <option value="À rappeler">À rappeler</option>
                <option value="Annulé">Annulé</option>
              </select>
            </div>

            <div className="mt-3 rounded-lg border border-slate-200 overflow-hidden">
              <div className="px-3 py-2 text-xs font-medium bg-slate-50 text-slate-600">Historique</div>
              <ul className="max-h-40 overflow-auto divide-y divide-slate-100">
                {rdv.history.length === 0 && (
                  <li className="px-3 py-2 text-sm text-slate-500">Aucun changement enregistré.</li>
                )}
                {rdv.history.slice().reverse().map((h, idx) => (
                  <li key={idx} className="px-3 py-2 text-sm">
                    <span className="font-medium">{h.from}</span> → <span className="font-medium">{h.to}</span>
                    <span className="text-slate-500"> — {new Date(h.at).toLocaleString()} par {h.by}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Section>

          {/* Notes & source */}
          <Section title="Notes & Source">
            <Textarea label="Notes internes" value={form.notes || ""} onChange={(v) => set("notes", v)} placeholder="Notes visibles par l'équipe uniquement…" />
            <div className="text-sm text-slate-600">
              <span className="text-slate-500">Source:</span> {form.source}
            </div>
          </Section>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 bg-white flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">
            Annuler
          </button>
          <button onClick={handleSave} className="rounded-lg bg-sky-600 px-3 py-2 text-sm text-white hover:bg-sky-700">
            Enregistrer
          </button>
        </div>
      </aside>
    </>
  );
}

/* -------------------- UI helpers -------------------- */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-xs font-medium text-slate-600 mb-2">{title}</div>
      {children}
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
      />
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 min-h-[84px]"
      />
    </div>
  );
}

/* ========================
   Cellules Th/Td (HTML props support)
   ======================== */
type ThProps = React.ThHTMLAttributes<HTMLTableHeaderCellElement> & { children: React.ReactNode };
function Th({ className = "", children, ...rest }: ThProps) {
  return (
    <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 ${className}`} {...rest}>
      {children}
    </th>
  );
}
type TdProps = React.TdHTMLAttributes<HTMLTableCellElement> & { children: React.ReactNode };
function Td({ className = "", children, ...rest }: TdProps) {
  return (
    <td className={`px-3 py-2 align-top text-slate-800 ${className}`} {...rest}>
      {children}
    </td>
  );
}

/* ========================
   Petit composant KPI
   ======================== */
function KpiCard({
  title,
  value,
  subtitle,
  accentClass = "",
}: {
  title: string;
  value: number;
  subtitle?: string;
  accentClass?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm ${accentClass}`}>
      <div className="text-sm text-slate-600">{title}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
    </div>
  );
}
