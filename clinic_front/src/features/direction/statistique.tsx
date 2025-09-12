import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/** =====================================================
 *  Analytics (Direction) — Desktop parfait, Mobile optimisé
 *  - Toolbar responsive (afficher/masquer filtres en mobile)
 *  - Presets scrollables en xs
 *  - Dropdown width clampé en mobile
 *  - Charts hauteurs réduites en mobile, Pie sans labels
 *  - Brut: Table en desktop, Cards en mobile
 *  ===================================================== */

type RefStatus = "Envoyé" | "Arrivé" | "Annulé";

type SeriesPoint = { date: string; referrals: number; confirmed: number };
type DatumNV = { name: string; value: number };

type AnalyticsResponse = {
  series: SeriesPoint[];
  by_doctor: DatumNV[];
  by_specialty: DatumNV[];
  by_insurance?: DatumNV[];
  funnel: { referrals: number; appointments: number; arrived: number };
  facets?: {
    doctors?: string[];
    specialties?: string[];
    insurances?: string[];
  };
};

type RawReferral = {
  id: number;
  patientNom: string;
  patientPrenom: string;
  telephone: string;
  assurance: string;
  specialite: string;
  medecin: string;
  dateEnvoi: string; // ISO
  statut: RefStatus;
  dateArrivee?: string; // ISO
  chambre?: string;
};

// ---- Couleurs ----
const COLORS_CYCLE = ["#0EA5E9", "#22C55E", "#F59E0B", "#6366F1", "#F43F5E", "#14B8A6", "#A855F7"];
const STATUS_COLORS: Record<"referrals" | "appointments" | "arrived", string> = {
  referrals: "#0EA5E9",
  appointments: "#22C55E",
  arrived: "#F59E0B",
};
const statusBadge: Record<RefStatus, string> = {
  Envoyé: "bg-amber-50 text-amber-800 ring-1 ring-amber-700/20",
  Arrivé: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
  Annulé: "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20",
};

// ---- Helpers période ----
type Preset = "today" | "7d" | "30d" | "custom";
function isoDayStart(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}
function isoDayEnd(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
}
function shiftDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

/* -------------------- Composant principal -------------------- */
export default function AnalyticsDirection() {
  // Filtres
  const [preset, setPreset] = useState<Preset>("30d");
  const [from, setFrom] = useState<string>(isoDayStart(shiftDays(29)));
  const [to, setTo] = useState<string>(isoDayEnd(new Date()));

  const [selDoctors, setSelDoctors] = useState<string[]>([]);
  const [selSpecialties, setSelSpecialties] = useState<string[]>([]);
  const [selInsurances, setSelInsurances] = useState<string[]>([]);
  const [selStatuses, setSelStatuses] = useState<RefStatus[]>([]);

  const [q, setQ] = useState<string>(""); // recherche texte (pour le brut)

  // Facettes
  const [facetDoctors, setFacetDoctors] = useState<string[]>([]);
  const [facetSpecialties, setFacetSpecialties] = useState<string[]>([]);
  const [facetInsurances, setFacetInsurances] = useState<string[]>([]);

  // Agrégations
  const [agg, setAgg] = useState<AnalyticsResponse | null>(null);
  const [, setAggLoading] = useState(false);
  const [aggErr, setAggErr] = useState<string | null>(null);

  // Brut
  const [raw, setRaw] = useState<RawReferral[]>([]);
  const [rawLoading, setRawLoading] = useState(false);
  const [rawErr, setRawErr] = useState<string | null>(null);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 640px)");
    const onChange = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile("matches" in e ? e.matches : (e as MediaQueryList).matches);
    setIsMobile(mql.matches);
      mql.addEventListener ? mql.addEventListener("change", onChange) : mql.addListener(onChange as any);
    return () => {
      
      mql.removeEventListener ? mql.removeEventListener("change", onChange) : mql.removeListener(onChange as any);
    };
  }, []);

  // Presets période
  useEffect(() => {
    if (preset === "custom") return;
    const now = new Date();
    if (preset === "today") {
      setFrom(isoDayStart(now));
      setTo(isoDayEnd(now));
    } else if (preset === "7d") {
      setFrom(isoDayStart(shiftDays(6)));
      setTo(isoDayEnd(now));
    } else if (preset === "30d") {
      setFrom(isoDayStart(shiftDays(29)));
      setTo(isoDayEnd(now));
    }
  }, [preset]);

  // Build queries
  const commonParams = useMemo(() => {
    const p = new URLSearchParams();
    p.set("from", from);
    p.set("to", to);
    if (selDoctors.length) p.set("doctor", selDoctors.join(","));
    if (selSpecialties.length) p.set("specialty", selSpecialties.join(","));
    if (selInsurances.length) p.set("insurance", selInsurances.join(","));
    if (selStatuses.length) p.set("status", selStatuses.join(","));
    return p;
  }, [from, to, selDoctors, selSpecialties, selInsurances, selStatuses]);

  const aggQuery = useMemo(() => commonParams.toString(), [commonParams]);
  const rawQuery = useMemo(() => {
    const p = new URLSearchParams(commonParams.toString());
    if (q.trim()) p.set("q", q.trim());
    return p.toString();
  }, [commonParams, q]);

  // Fetch agrégations
  useEffect(() => {
    let alive = true;
    const run = async () => {
      setAggLoading(true);
      setAggErr(null);
      try {
        const res = await fetch(`/api/referrals/analytics?${aggQuery}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: AnalyticsResponse = await res.json();
        if (!alive) return;
        setAgg(data);
        if (data.facets?.doctors) setFacetDoctors(data.facets.doctors);
        if (data.facets?.specialties) setFacetSpecialties(data.facets.specialties);
        if (data.facets?.insurances) setFacetInsurances(data.facets.insurances);
      } catch (e) {
        if (!alive) return;
        console.warn("Analytics API error → fallback mock", e);
        setAggErr("Mode démo (analytics non branché).");
        const mock: AnalyticsResponse = {
          series: Array.from({ length: 14 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (13 - i));
            const date = d.toISOString().slice(0, 10);
            return { date, referrals: 2 + ((i * 3) % 7), confirmed: 1 + (i % 5) };
          }),
          by_doctor: [
            { name: "Dr. Rami", value: 18 },
            { name: "Dr. Hadi", value: 15 },
            { name: "Dr. Saidi", value: 12 },
            { name: "Dr. Boulif", value: 9 },
            { name: "Dr. Amal", value: 7 },
          ],
          by_specialty: [
            { name: "Cardiologie", value: 20 },
            { name: "Radiologie", value: 16 },
            { name: "Chirurgie", value: 14 },
            { name: "Urgences", value: 8 },
            { name: "Autres", value: 6 },
          ],
          by_insurance: [
            { name: "CNSS", value: 18 },
            { name: "CNOPS", value: 14 },
            { name: "AXA", value: 10 },
            { name: "Saham", value: 8 },
          ],
          funnel: { referrals: 64, appointments: 40, arrived: 28 },
          facets: {
            doctors: ["Dr. Rami", "Dr. Hadi", "Dr. Saidi", "Dr. Boulif", "Dr. Amal"],
            specialties: ["Cardiologie", "Radiologie", "Chirurgie", "Urgences", "Autres"],
            insurances: ["CNSS", "CNOPS", "AXA", "Saham"],
          },
        };
        setAgg(mock);
        setFacetDoctors(mock.facets!.doctors!);
        setFacetSpecialties(mock.facets!.specialties!);
        setFacetInsurances(mock.facets!.insurances!);
      } finally {
        if (alive) setAggLoading(false);
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [aggQuery]);

  // Fetch brut
  useEffect(() => {
    let alive = true;
    const run = async () => {
      setRawLoading(true);
      setRawErr(null);
      try {
        const res = await fetch(`/api/referrals?${rawQuery}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: RawReferral[] = await res.json();
        if (!alive) return;
        setRaw(data);
      } catch (e) {
        if (!alive) return;
        console.warn("Raw API error → fallback mock", e);
        setRawErr("Mode démo (liste non branchée).");
        const mock: RawReferral[] = [
          {
            id: 501,
            patientNom: "El Idrissi",
            patientPrenom: "Hicham",
            telephone: "+212612345678",
            assurance: "CNSS",
            specialite: "Chirurgie",
            medecin: "Dr. Boulif",
            dateEnvoi: new Date().toISOString(),
            statut: "Envoyé",
          },
          {
            id: 502,
            patientNom: "Zouhair",
            patientPrenom: "Aya",
            telephone: "+212633221144",
            assurance: "CNOPS",
            specialite: "Cardiologie",
            medecin: "Dr. Rami",
            dateEnvoi: new Date(Date.now() - 3600e3).toISOString(),
            statut: "Arrivé",
            dateArrivee: new Date().toISOString(),
            chambre: "212",
          },
          {
            id: 503,
            patientNom: "Benhima",
            patientPrenom: "Karim",
            telephone: "+212677889900",
            assurance: "AXA",
            specialite: "Radiologie",
            medecin: "Dr. Hadi",
            dateEnvoi: new Date(Date.now() - 86400e3).toISOString(),
            statut: "Annulé",
          },
        ];
        setRaw(mock);
      } finally {
        if (alive) setRawLoading(false);
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, [rawQuery]);

  // Exports
  const exportAggExcel = () => {
    if (!agg) return;
    const wb = XLSX.utils.book_new();

    const seriesSheet = (agg.series || []).map((p) => ({
      Date: p.date,
      Références: p.referrals,
      Confirmés: p.confirmed,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(seriesSheet), "Séries");

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet((agg.by_doctor || []).map((d) => ({ Médecin: d.name, Références: d.value }))),
      "Par médecin"
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet((agg.by_specialty || []).map((s) => ({ Spécialité: s.name, Références: s.value }))),
      "Par spécialité"
    );

    if (agg.by_insurance?.length) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(agg.by_insurance.map((a) => ({ Assurance: a.name, Références: a.value }))),
        "Par assurance"
      );
    }

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { Étape: "Références", Valeur: agg.funnel.referrals },
        { Étape: "RDV (créés)", Valeur: agg.funnel.appointments },
        { Étape: "Arrivés", Valeur: agg.funnel.arrived },
      ]),
      "Funnel"
    );

    XLSX.writeFile(wb, `analytics_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportRawExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = raw.map((r) => ({
      ID: r.id,
      Patient: `${r.patientPrenom} ${r.patientNom}`,
      Téléphone: r.telephone,
      Assurance: r.assurance,
      Spécialité: r.specialite,
      Médecin: r.medecin,
      "Envoyé le": new Date(r.dateEnvoi).toLocaleString(),
      Statut: r.statut,
      "Arrivé le": r.dateArrivee ? new Date(r.dateArrivee).toLocaleString() : "",
      Chambre: r.chambre || "",
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Références (brut)");
    XLSX.writeFile(wb, `analytics_brut_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Hauteurs charts selon device
  const CH = {
    line: isMobile ? 220 : 280,
    bar: isMobile ? 220 : 260,
    pie: isMobile ? 220 : 260,
    funnel: isMobile ? 200 : 220,
  };

  const series = agg?.series ?? [];
  const byDoctor = agg?.by_doctor ?? [];
  const bySpecialty = agg?.by_specialty ?? [];
  const byInsurance = agg?.by_insurance ?? [];
  const funnel = agg?.funnel ?? { referrals: 0, appointments: 0, arrived: 0 };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-sky-50 to-slate-50">
      <div className="p-3 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">

        {/* Toolbar responsive */}
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-3 sm:p-4">
          <FilterBar
            preset={preset}
            setPreset={setPreset}
            from={from}
            setFrom={setFrom}
            to={to}
            setTo={setTo}
            facetDoctors={facetDoctors}
            facetSpecialties={facetSpecialties}
            facetInsurances={facetInsurances}
            selDoctors={selDoctors}
            setSelDoctors={setSelDoctors}
            selSpecialties={selSpecialties}
            setSelSpecialties={setSelSpecialties}
            selInsurances={selInsurances}
            setSelInsurances={setSelInsurances}
            selStatuses={selStatuses}
            setSelStatuses={setSelStatuses}
            q={q}
            setQ={setQ}
            onExportAgg={exportAggExcel}
            onExportRaw={exportRawExcel}
          />
        </div>

        {/* Alerts */}
        {(aggErr || rawErr) && (
          <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 px-3 py-2 text-sm">
            {(aggErr ?? "")} {(rawErr ?? "")}
          </div>
        )}

        {/* Charts grid */}
        <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4">
          {/* Line */}
          <div className="rounded-xl border border-slate-200 bg-white/90 p-3 sm:p-4 shadow-sm">
            <h3 className="text-sm font-medium mb-2 text-slate-800">Références vs Confirmés</h3>
            <div className={`h-[${CH.line}px]`}>
              <ResponsiveContainer width="100%" height={CH.line}>
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="referrals" name="Références" stroke="#0EA5E9" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="confirmed" name="Confirmés" stroke="#22C55E" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Par médecin */}
          <div className="rounded-xl border border-slate-200 bg-white/90 p-3 sm:p-4 shadow-sm">
            <h3 className="text-sm font-medium mb-2 text-slate-800">Références par médecin</h3>
            <div>
              <ResponsiveContainer width="100%" height={CH.bar}>
                <BarChart data={byDoctor}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" name="Références">
                    {byDoctor.map((_, i) => (
                      <Cell key={i} fill={COLORS_CYCLE[i % COLORS_CYCLE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Par spécialité */}
          <div className="rounded-xl border border-slate-200 bg-white/90 p-3 sm:p-4 shadow-sm">
            <h3 className="text-sm font-medium mb-2 text-slate-800">Répartition par spécialité</h3>
            <div>
              <ResponsiveContainer width="100%" height={CH.pie}>
                <PieChart>
                  <Pie
                    dataKey="value"
                    data={bySpecialty}
                    outerRadius={isMobile ? 72 : 90}
                    label={!isMobile}
                  >
                    {bySpecialty.map((_, i) => (
                      <Cell key={i} fill={COLORS_CYCLE[i % COLORS_CYCLE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Funnel */}
          <div className="rounded-xl border border-slate-200 bg-white/90 p-3 sm:p-4 shadow-sm xl:col-span-2">
            <h3 className="text-sm font-medium mb-2 text-slate-800">Funnel : Références → RDV → Arrivés</h3>
            <div>
              <ResponsiveContainer width="100%" height={CH.funnel}>
                <BarChart
                  data={[
                    { step: "Références", value: funnel.referrals },
                    { step: "RDV (créés)", value: funnel.appointments },
                    { step: "Arrivés", value: funnel.arrived },
                  ]}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="step" />
                  <Tooltip />
                  <Bar dataKey="value" name="Volume">
                    <Cell fill={STATUS_COLORS.referrals} />
                    <Cell fill={STATUS_COLORS.appointments} />
                    <Cell fill={STATUS_COLORS.arrived} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Assurances */}
          <div className="rounded-xl border border-slate-200 bg-white/90 p-3 sm:p-4 shadow-sm">
            <h3 className="text-sm font-medium mb-2 text-slate-800">Mix des assurances</h3>
            <div>
              <ResponsiveContainer width="100%" height={CH.pie}>
                <PieChart>
                  <Pie
                    dataKey="value"
                    data={byInsurance}
                    outerRadius={isMobile ? 72 : 90}
                    label={!isMobile}
                  >
                    {byInsurance.map((_, i) => (
                      <Cell key={i} fill={COLORS_CYCLE[i % COLORS_CYCLE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Brut: Cards (mobile) */}
        <div className="mt-6 md:hidden">
          <h3 className="text-sm font-medium text-slate-800 mb-2">Références (brut)</h3>
          <RawMobileCards rows={raw} loading={rawLoading} />
        </div>

        {/* Brut: Table (desktop) */}
        <div className="mt-6 rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm hidden md:block">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white">
            <h3 className="text-sm font-medium text-slate-800">Références (brut)</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{raw.length} ligne(s)</span>
              <button onClick={exportRawExcel} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs hover:bg-slate-50">
                Exporter (brut)
              </button>
            </div>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur text-slate-700 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">
                <tr>
                  <Th>ID</Th>
                  <Th>Patient</Th>
                  <Th>Téléphone</Th>
                  <Th>Assurance</Th>
                  <Th>Spécialité</Th>
                  <Th>Médecin</Th>
                  <Th>Envoyé le</Th>
                  <Th>Statut</Th>
                  <Th>Arrivé le</Th>
                  <Th>Chambre</Th>
                </tr>
              </thead>
              <tbody>
                {raw.map((r, i) => (
                  <tr key={r.id} className={`border-t border-slate-100 ${i % 2 ? "bg-slate-50/40" : "bg-white"}`}>
                    <Td>{r.id}</Td>
                    <Td>{r.patientPrenom} {r.patientNom}</Td>
                    <Td>{r.telephone}</Td>
                    <Td>{r.assurance}</Td>
                    <Td>{r.specialite}</Td>
                    <Td>{r.medecin}</Td>
                    <Td>{new Date(r.dateEnvoi).toLocaleString()}</Td>
                    <Td>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium ${statusBadge[r.statut]}`}>
                        {r.statut}
                      </span>
                    </Td>
                    <Td>{r.dateArrivee ? new Date(r.dateArrivee).toLocaleString() : "—"}</Td>
                    <Td>{r.chambre || "—"}</Td>
                  </tr>
                ))}
                {!raw.length && !rawLoading && (
                  <tr>
                    <Td colSpan={10} className="text-center text-slate-500 py-6">Aucune ligne.</Td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {rawLoading && <div className="px-4 py-3 text-sm text-slate-500">Chargement de la liste…</div>}
        </div>
      </div>
    </div>
  );
}

/* ========================
   FilterBar (toolbar pro)
   ======================== */
function FilterBar({
  preset, setPreset,
  from, setFrom,
  to, setTo,
  facetDoctors, facetSpecialties, facetInsurances,
  selDoctors, setSelDoctors,
  selSpecialties, setSelSpecialties,
  selInsurances, setSelInsurances,
  selStatuses, setSelStatuses,
  q, setQ,
  onExportAgg, onExportRaw,
}: {
  preset: Preset; setPreset: (p: Preset) => void;
  from: string; setFrom: (v: string) => void;
  to: string; setTo: (v: string) => void;
  facetDoctors: string[]; facetSpecialties: string[]; facetInsurances: string[];
  selDoctors: string[]; setSelDoctors: (v: string[]) => void;
  selSpecialties: string[]; setSelSpecialties: (v: string[]) => void;
  selInsurances: string[]; setSelInsurances: (v: string[]) => void;
  selStatuses: RefStatus[]; setSelStatuses: (v: RefStatus[]) => void;
  q: string; setQ: (v: string) => void;
  onExportAgg: () => void; onExportRaw: () => void;
}) {
  const clearAll = () => {
    setPreset("30d");
    setSelDoctors([]); setSelSpecialties([]); setSelInsurances([]); setSelStatuses([]);
    setQ("");
  };

  return (
    <div className="grid grid-cols-12 gap-2 md:gap-3 items-end">
      {/* Rangée 1 : presets + dates + exports (desktop) */}
      <div className="col-span-12 md:col-span-4">
        <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {(["today","7d","30d","custom"] as Preset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`h-9 px-3 rounded-md text-sm transition ${
                preset === p ? "bg-sky-600 text-white" : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              {p === "today" ? "Aujourd’hui" : p === "7d" ? "7j" : p === "30d" ? "30j" : "Perso"}
            </button>
          ))}
        </div>
      </div>

      <div className="col-span-6 md:col-span-3">
        <Label>De</Label>
        <input
          type="datetime-local"
          value={from.slice(0, 16)}
          onChange={(e) => setFrom(new Date(e.target.value).toISOString())}
          className="mt-1 h-9 w-full rounded-md border border-slate-200 px-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
          disabled={preset !== "custom"}
        />
      </div>

      <div className="col-span-6 md:col-span-3">
        <Label>À</Label>
        <input
          type="datetime-local"
          value={to.slice(0, 16)}
          onChange={(e) => setTo(new Date(e.target.value).toISOString())}
          className="mt-1 h-9 w-full rounded-md border border-slate-200 px-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
          disabled={preset !== "custom"}
        />
      </div>

      {/* Exports desktop uniquement */}
      
      {/* Rangée 2 : filtres avancés */}
      <div className="col-span-12 grid grid-cols-12 gap-2 md:gap-3 items-end">
        <div className="col-span-12 md:col-span-3">
          <Label>Médecin</Label>
          <MultiSelectDropdown options={facetDoctors} value={selDoctors} onChange={setSelDoctors} placeholder="Tous les médecins" />
        </div>
        <div className="col-span-12 md:col-span-3">
          <Label>Spécialité</Label>
          <MultiSelectDropdown options={facetSpecialties} value={selSpecialties} onChange={setSelSpecialties} placeholder="Toutes les spécialités" />
        </div>
        <div className="col-span-12 md:col-span-3">
          <Label>Assurance</Label>
          <MultiSelectDropdown options={facetInsurances} value={selInsurances} onChange={setSelInsurances} placeholder="Toutes les assurances" />
        </div>
        <div className="col-span-12 md:col-span-3">
          <Label>Statut</Label>
          <MultiSelectDropdown
            options={["Envoyé","Arrivé","Annulé"]}
            value={selStatuses as string[]}
            onChange={(vals) => setSelStatuses(vals as RefStatus[])}
            placeholder="Tous les statuts"
          />
        </div>

    
          <div className="col-span-12 md:col-span-7">
            <Label>Recherche</Label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="patient, médecin…"
              className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="col-span-12 md:col-span-5 grid grid-cols-2 gap-2 md:flex md:justify-end">
            {/* زر إعادة التهيئة: ياخذ عمود كامل فالموبايل */}
            <div className="col-span-2 md:col-span-1">
              <button
                onClick={clearAll}
                className="h-9 w-full md:w-auto rounded-lg border border-slate-200 bg-white px-3 text-sm hover:bg-slate-50"
                title="Réinitialiser tous les filtres"
              >
                Réinitialiser
              </button>
            </div>

            {/* أزرار التصدير: موبايل = grid عمودين / ديسكتوب = يمين */}
            <div className="col-span-2 grid grid-cols-2 gap-2 md:hidden">
              <Btn variant="primary" onClick={onExportAgg}><DownloadIcon /> Agrég.</Btn>
              <Btn variant="secondary" onClick={onExportRaw}><DownloadIcon /> Brut</Btn>
            </div>

            {/* نسخة الديسكتوب */}
            <div className="hidden md:flex gap-2">
              <Btn variant="primary" onClick={onExportAgg}><DownloadIcon /> Export agrég.</Btn>
              <Btn variant="secondary" onClick={onExportRaw}><DownloadIcon /> Export brut</Btn>
            </div>
          </div>

      </div>
    </div>
  );
}

/* ========================
   Brut en mobile: Cards
   ======================== */
function RawMobileCards({ rows, loading }: { rows: RawReferral[]; loading: boolean }) {
  if (loading) return <div className="px-1 py-2 text-sm text-slate-500">Chargement…</div>;
  if (!rows.length) return <div className="px-1 py-4 text-center text-slate-500">Aucune ligne.</div>;
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-800">#{r.id} — {r.patientPrenom} {r.patientNom}</div>
            <span className={`inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-medium ${statusBadge[r.statut]}`}>
              {r.statut}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[13px] text-slate-700">
            <div className="truncate"><span className="text-slate-500">Tél:</span> {r.telephone}</div>
            <div className="truncate"><span className="text-slate-500">Assur.:</span> {r.assurance || "—"}</div>
            <div className="truncate"><span className="text-slate-500">Spéc.:</span> {r.specialite}</div>
            <div className="truncate"><span className="text-slate-500">Médecin:</span> {r.medecin}</div>
            <div className="truncate"><span className="text-slate-500">Envoyé:</span> {new Date(r.dateEnvoi).toLocaleString()}</div>
            <div className="truncate"><span className="text-slate-500">Arrivé:</span> {r.dateArrivee ? new Date(r.dateArrivee).toLocaleString() : "—"}</div>
            <div className="truncate col-span-2"><span className="text-slate-500">Chambre:</span> {r.chambre || "—"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ========================
   MultiSelectDropdown (headless)
   ======================== */
function MultiSelectDropdown({
  options,
  value,
  onChange,
  placeholder = "Sélectionner...",
}: {
  options: string[] | readonly string[];
  value: string[] | readonly string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const vals = value as string[];
  const list = (options as string[]).filter((o) =>
    o.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (v: string) =>
    onChange(vals.includes(v) ? vals.filter((x) => x !== v) : [...vals, v]);

  const clear = () => onChange([]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-1 h-9 w-full rounded-md border border-slate-200 px-2 text-left text-sm text-slate-700 bg-white hover:bg-slate-50"
      >
        {vals.length === 0 ? (
          <span className="text-slate-400">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {vals.slice(0, 3).map((v) => (
              <span
                key={v}
                className="inline-flex items-center gap-1 rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-200 px-2 py-[2px] text-[11px]"
              >
                {v}
                <button
                  className="w-4 h-4 leading-4 text-center rounded-full hover:bg-sky-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(v);
                  }}
                  title="Retirer"
                >
                  ×
                </button>
              </span>
            ))}
            {vals.length > 3 && (
              <span className="text-[11px] text-slate-500">+{vals.length - 3}</span>
            )}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[min(92vw,260px)] sm:w-[260px] rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="p-2 border-b border-slate-100">
            <input
              autoFocus
              placeholder="Rechercher…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div className="max-h-60 overflow-auto py-1">
            {list.map((opt) => {
              const checked = vals.includes(opt);
              return (
                <label
                  key={opt}
                  className="flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                >
                  <span className="truncate pr-3">{opt}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(opt)}
                    className="h-4 w-4 accent-sky-600"
                  />
                </label>
              );
            })}
            {!list.length && (
              <div className="px-3 py-3 text-sm text-slate-500">Aucun résultat.</div>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 px-2 py-2 border-t border-slate-100">
            <button
              className="h-8 rounded-md px-2 text-xs text-slate-700 hover:bg-slate-50"
              onClick={clear}
            >
              Effacer
            </button>
            <button
              className="h-8 rounded-md px-3 text-xs text-white bg-sky-600 hover:bg-sky-700"
              onClick={() => setOpen(false)}
            >
              Terminer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================
   Petits helpers
   ======================== */
function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs text-slate-600">{children}</label>;
}

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
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

function Btn({ variant = "primary", className = "", children, ...rest }: BtnProps) {
  const base =
    "inline-flex items-center justify-center gap-2 " +
    "h-10 px-4 rounded-full text-sm font-medium leading-none " +
    "whitespace-nowrap select-none transition-colors shadow-sm " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";
  const styles =
    variant === "primary"
      ? "bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-sky-500"
      : "bg-slate-800 text-white hover:bg-slate-900 focus-visible:ring-slate-500";

  return (
    <button
      className={`${base} ${styles} w-full md:w-auto min-w-0 md:min-w-[132px] ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}



function DownloadIcon() {
  return (
    <svg
      className="h-[18px] w-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
