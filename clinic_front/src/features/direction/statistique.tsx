import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
 *  Analytics (Direction) — Version multilingue
 *  ===================================================== */

type RefStatus = "sent" | "arrived" | "cancelled";

type UIRow = {
  id: number;
  patient: string;
  phone: string;
  email: string;
  assurance: string;
  specialty: string;
  doctor: string;
  sentAt: string | null;
  arrivedAt: string | null;
  status: RefStatus;
};

// Configuration des badges de statut
const getStatusBadgeClasses = (status: RefStatus) => {
  const baseClasses = {
    sent: "bg-amber-50 text-amber-800 ring-1 ring-amber-700/20",
    arrived: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20",
    cancelled: "bg-rose-50 text-rose-700 ring-1 ring-rose-600/20",
  };
  return baseClasses[status];
};

// Mappe les statuts backend vers nos statuts d'affichage
function mapStatus(s: any): RefStatus {
  const v = String(s || "").toLowerCase();
  if (["rejected", "annule", "annulé", "cancelled"].includes(v)) return "cancelled";
  if (["accepted", "completed", "arrived", "arrivé", "confirmed"].includes(v)) return "arrived";
  return "sent";
}

// Utilitaires pour les données
function insuranceText(x: any): string {
  if (!x) return "—";
  if (typeof x === "string") return x || "—";
  if (typeof x === "object") {
    return x.insurance_provider || x.name || "—";
  }
  return "—";
}

function specialtyText(x: any): string {
  if (!x) return "—";
  if (typeof x === "string") return x || "—";
  if (typeof x === "object") {
    return x.name || x.title || "—";
  }
  return "—";
}

// Types pour l'API
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

// Couleurs
const COLORS_CYCLE = ["#0EA5E9", "#22C55E", "#F59E0B", "#6366F1", "#F43F5E", "#14B8A6", "#A855F7"];
const STATUS_COLORS: Record<"referrals" | "appointments" | "arrived", string> = {
  referrals: "#0EA5E9",
  appointments: "#22C55E",
  arrived: "#F59E0B",
};

// Helpers période
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

// URL de base de l'API
const API_BASE_URL =
  import.meta.env.VITE_API_URL?.trim() || "https://clinic-riviera-1.onrender.com/api";


/* -------------------- Composant principal -------------------- */
export default function AnalyticsDirection() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "fr";

  // États
  const [preset, setPreset] = useState<Preset>("30d");
  const [from, setFrom] = useState<string>(isoDayStart(shiftDays(29)));
  const [to, setTo] = useState<string>(isoDayEnd(new Date()));
  const [selDoctors, setSelDoctors] = useState<string[]>([]);
  const [selSpecialties, setSelSpecialties] = useState<string[]>([]);
  const [selInsurances, setSelInsurances] = useState<string[]>([]);
  const [selStatuses, setSelStatuses] = useState<RefStatus[]>([]);
  const [q, setQ] = useState<string>("");

  // Facettes
  const [facetDoctors, setFacetDoctors] = useState<string[]>([]);
  const [facetSpecialties, setFacetSpecialties] = useState<string[]>([]);
  const [facetInsurances, setFacetInsurances] = useState<string[]>([]);

  // Données
  const [agg, setAgg] = useState<AnalyticsResponse | null>(null);
  const [aggLoading, setAggLoading] = useState(false);
  const [aggErr, setAggErr] = useState<string | null>(null);
  const [raw, setRaw] = useState<UIRow[]>([]);
  const [rawLoading, setRawLoading] = useState(false);
  const [rawErr, setRawErr] = useState<string | null>(null);

  // Détection mobile
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

  // Gestion des presets de période
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

  // Construction des paramètres de requête
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
        const res = await fetch(`${API_BASE_URL}/referrals/stats/?${aggQuery}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        
        const data: AnalyticsResponse = await res.json();
        if (!alive) return;
        
        const cleanFacets = {
          doctors: [...new Set(data.facets?.doctors || [])].filter(Boolean),
          specialties: [...new Set(data.facets?.specialties || [])].filter(Boolean),
          insurances: [...new Set(data.facets?.insurances || [])].filter(Boolean),
        };
        
        setAgg(data);
        setFacetDoctors(cleanFacets.doctors);
        setFacetSpecialties(cleanFacets.specialties);
        setFacetInsurances(cleanFacets.insurances);
      } catch (e) {
        if (!alive) return;
        console.error("Erreur API analytics:", e);
        setAggErr(t("analytics.error_analytics", { error: e instanceof Error ? e.message : 'Erreur inconnue' }));
        setAgg(null);
      } finally {
        if (alive) setAggLoading(false);
      }
    };
    run();
    return () => { alive = false; };
  }, [aggQuery, t]);

  // Fetch données brutes
  useEffect(() => {
    let alive = true;
    const run = async () => {
      setRawLoading(true);
      setRawErr(null);
      try {
        const res = await fetch(`${API_BASE_URL}/referrals?${rawQuery}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        
        const data = await res.json();
        if (!alive) return;

        let rawData: any[] = [];
        if (Array.isArray(data)) rawData = data;
        else if (data && Array.isArray(data.results)) rawData = data.results;
        else if (data && typeof data === "object") rawData = [data];

        const rows: UIRow[] = rawData.map((it: any) => {
          const patientFull =
            it.patient_name ||
            [it.patient?.first_name, it.patient?.last_name].filter(Boolean).join(" ") ||
            [it.first_name, it.last_name].filter(Boolean).join(" ") ||
            "—";

          const phone = it.phone || it.patient?.phone || it.telephone || "—";
          const email = it.email || it.patient?.email || "—";
          const doctor =
            it.doctor_full_name ||
            it.physician_display ||
            it.doctor_name ||
            it.doctor?.username ||
            it.physician ||
            "—";

          const specialty =
            it.type_name ||
            specialtyText(it.intervention_type) ||
            specialtyText(it.specialite) ||
            "—";

          const sentAt = it.created_at || it.dateEnvoi || it.date_envoi || it.date || null;
          const arrivedAt = it.updated_at || it.arrived_at || it.dateArrivee || it.date_arrivee || null;

          return {
            id: Number(it.id ?? 0),
            patient: String(patientFull || "—"),
            phone: String(phone || "—"),
            email: String(email || "—"),
            assurance: insuranceText(it.assurance || it.insurance || it.insurance_provider),
            specialty: String(specialty || "—"),
            doctor: String(doctor || "—"),
            sentAt: sentAt ? String(sentAt) : null,
            arrivedAt: arrivedAt ? String(arrivedAt) : null,
            status: mapStatus(it.status || it.statut),
          };
        });

        setRaw(rows);
      } catch (e) {
        if (!alive) return;
        console.error("Erreur API données brutes:", e);
        setRawErr(t("analytics.error_raw", { error: e instanceof Error ? e.message : 'Erreur inconnue' }));
        setRaw([]);
      } finally {
        if (alive) setRawLoading(false);
      }
    };
    run();
    return () => { alive = false; };
  }, [rawQuery, t]);

  // Fonctions d'export
  const exportAggExcel = () => {
    if (!agg) return;
    const wb = XLSX.utils.book_new();

    const seriesSheet = (agg.series || []).map((p) => ({
      [t("analytics.charts.series.referrals")]: p.referrals,
      [t("analytics.charts.series.confirmed")]: p.confirmed,
      Date: p.date,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(seriesSheet), "Series");

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet((agg.by_doctor || []).map((d) => ({ 
        [t("analytics.raw_data.headers.doctor")]: d.name, 
        [t("analytics.charts.series.referrals")]: d.value 
      }))),
      "ByDoctor"
    );

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet((agg.by_specialty || []).map((s) => ({ 
        [t("analytics.raw_data.headers.specialty")]: s.name, 
        [t("analytics.charts.series.referrals")]: s.value 
      }))),
      "BySpecialty"
    );

    if (agg.by_insurance?.length) {
      XLSX.utils.book_append_sheet(
        wb,
        XLSX.utils.json_to_sheet(agg.by_insurance.map((a) => ({ 
          [t("analytics.raw_data.headers.insurance")]: a.name, 
          [t("analytics.charts.series.referrals")]: a.value 
        }))),
        "ByInsurance"
      );
    }

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { 
          Step: t("analytics.charts.funnel_steps.referrals"), 
          Value: agg.funnel.referrals 
        },
        { 
          Step: t("analytics.charts.funnel_steps.appointments"), 
          Value: agg.funnel.appointments 
        },
        { 
          Step: t("analytics.charts.funnel_steps.arrived"), 
          Value: agg.funnel.arrived 
        },
      ]),
      "Funnel"
    );

    XLSX.writeFile(wb, `analytics_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportRawExcel = () => {
    if (!raw || !raw.length) return;
    const wb = XLSX.utils.book_new();
    
    const rows = raw.map((r) => ({
      [t("analytics.raw_data.headers.id")]: r.id,
      [t("analytics.raw_data.headers.patient")]: r.patient,
      [t("analytics.raw_data.headers.phone")]: r.phone,
      [t("analytics.raw_data.headers.email")]: r.email,
      [t("analytics.raw_data.headers.insurance")]: r.assurance,
      [t("analytics.raw_data.headers.specialty")]: r.specialty,
      [t("analytics.raw_data.headers.doctor")]: r.doctor,
      [t("analytics.raw_data.headers.sent_at")]: r.sentAt ? new Date(r.sentAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-GB") : "",
      [t("analytics.raw_data.headers.status")]: t(`analytics.status.${r.status}`),
      [t("analytics.raw_data.headers.arrived_at")]: r.arrivedAt ? new Date(r.arrivedAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-GB") : "",
    }));

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Referrals");
    XLSX.writeFile(wb, `referrals_raw_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Hauteurs des charts
  const CH = {
    line: isMobile ? 220 : 280,
    bar: isMobile ? 220 : 260,
    pie: isMobile ? 220 : 260,
    funnel: isMobile ? 200 : 220,
  };

  const series = Array.isArray(agg?.series) ? agg.series : [];
  const byDoctor = Array.isArray(agg?.by_doctor) ? agg.by_doctor : [];
  const bySpecialty = Array.isArray(agg?.by_specialty) ? agg.by_specialty : [];
  const byInsurance = Array.isArray(agg?.by_insurance) ? agg.by_insurance : [];
  const funnel = agg?.funnel && typeof agg.funnel === "object"
    ? agg.funnel
    : { referrals: 0, appointments: 0, arrived: 0 };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-sky-50 to-slate-50">
      <div className="p-3 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">

        {/* En-tête */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            {t("analytics.title")}
          </h1>
          <p className="text-slate-600">{t("analytics.subtitle")}</p>
        </div>

        {/* Barre de filtres */}
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-3 sm:p-4 mb-6">
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
            loading={aggLoading || rawLoading}
            rawLength={raw.length}
          />
        </div>

        {/* Alertes d'erreur */}
        {(aggErr || rawErr) && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 px-3 py-2 text-sm">
            {aggErr && <div>{aggErr}</div>}
            {rawErr && <div>{rawErr}</div>}
          </div>
        )}

        {/* État de chargement */}
        {(aggLoading || rawLoading) && !agg && !raw.length && (
          <div className="rounded-lg border border-blue-300 bg-blue-50 text-blue-800 px-3 py-2 text-sm">
            {t("analytics.loading")}
          </div>
        )}

        {/* Grille des graphiques */}
        {agg && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 sm:gap-4 mb-6">
            {/* Graphique linéaire */}
            <div className="rounded-xl border border-slate-200 bg-white/90 p-3 sm:p-4 shadow-sm">
              <h3 className="text-sm font-medium mb-2 text-slate-800">
                {t("analytics.charts.referrals_vs_confirmed")}
              </h3>
              <ResponsiveContainer width="100%" height={CH.line}>
                <LineChart data={series}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="referrals" 
                    name={t("analytics.charts.series.referrals")} 
                    stroke="#0EA5E9" 
                    strokeWidth={2} 
                    dot={{ r: 2 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="confirmed" 
                    name={t("analytics.charts.series.confirmed")} 
                    stroke="#22C55E" 
                    strokeWidth={2} 
                    dot={{ r: 2 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Par médecin */}
            <div className="rounded-xl border border-slate-200 bg-white/90 p-3 sm:p-4 shadow-sm">
              <h3 className="text-sm font-medium mb-2 text-slate-800">
                {t("analytics.charts.by_doctor")}
              </h3>
              <ResponsiveContainer width="100%" height={CH.bar}>
                <BarChart data={byDoctor}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" name={t("analytics.charts.series.referrals")}>
                    {byDoctor.map((_, i) => (
                      <Cell key={i} fill={COLORS_CYCLE[i % COLORS_CYCLE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Par spécialité */}
            <div className="rounded-xl border border-slate-200 bg-white/90 p-3 sm:p-4 shadow-sm">
              <h3 className="text-sm font-medium mb-2 text-slate-800">
                {t("analytics.charts.by_specialty")}
              </h3>
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

            {/* Funnel */}
            <div className="rounded-xl border border-slate-200 bg-white/90 p-3 sm:p-4 shadow-sm xl:col-span-2">
              <h3 className="text-sm font-medium mb-2 text-slate-800">
                {t("analytics.charts.funnel")}
              </h3>
              <ResponsiveContainer width="100%" height={CH.funnel}>
                <BarChart
                  data={[
                    { step: t("analytics.charts.funnel_steps.referrals"), value: funnel.referrals },
                    { step: t("analytics.charts.funnel_steps.appointments"), value: funnel.appointments },
                    { step: t("analytics.charts.funnel_steps.arrived"), value: funnel.arrived },
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

            {/* Assurances */}
            <div className="rounded-xl border border-slate-200 bg-white/90 p-3 sm:p-4 shadow-sm">
              <h3 className="text-sm font-medium mb-2 text-slate-800">
                {t("analytics.charts.by_insurance")}
              </h3>
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
        )}

        {/* Données brutes - Version mobile */}
        <div className="mt-6 md:hidden">
          <h3 className="text-sm font-medium text-slate-800 mb-2">
            {t("analytics.raw_data.title")}
          </h3>
          <RawMobileCards rows={raw} loading={rawLoading} />
        </div>

        {/* Données brutes - Version desktop */}
        <div className="mt-6 rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm hidden md:block">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white">
            <h3 className="text-sm font-medium text-slate-800">
              {t("analytics.raw_data.title")}
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {raw.length} {t("analytics.raw_data.rows_count")}
              </span>
              <button 
                onClick={exportRawExcel} 
                disabled={raw.length === 0}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("analytics.raw_data.export")}
              </button>
            </div>
          </div>
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur text-slate-700 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">
                <tr>
                  <Th>{t("analytics.raw_data.headers.id")}</Th>
                  <Th>{t("analytics.raw_data.headers.patient")}</Th>
                  <Th>{t("analytics.raw_data.headers.phone")}</Th>
                  <Th>{t("analytics.raw_data.headers.insurance")}</Th>
                  <Th>{t("analytics.raw_data.headers.specialty")}</Th>
                  <Th>{t("analytics.raw_data.headers.doctor")}</Th>
                  <Th>{t("analytics.raw_data.headers.sent_at")}</Th>
                  <Th>{t("analytics.raw_data.headers.status")}</Th>
                  <Th>{t("analytics.raw_data.headers.arrived_at")}</Th>
                </tr>
              </thead>
              <tbody>
                {raw.map((r, i) => (
                  <tr key={r.id} className={`border-top border-slate-100 ${i % 2 ? "bg-slate-50/40" : "bg-white"}`}>
                    <Td>{r.id}</Td>
                    <Td>{r.patient}</Td>
                    <Td>{r.phone}</Td>
                    <Td>{r.assurance}</Td>
                    <Td>{r.specialty}</Td>
                    <Td>{r.doctor}</Td>
                    <Td>{r.sentAt ? new Date(r.sentAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-GB") : "—"}</Td>
                    <Td>
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium ${getStatusBadgeClasses(r.status)}`}>
                        {t(`analytics.status.${r.status}`)}
                      </span>
                    </Td>
                    <Td>{r.arrivedAt ? new Date(r.arrivedAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-GB") : "—"}</Td>
                  </tr>
                ))}
                {!raw.length && !rawLoading && (
                  <tr>
                    <Td colSpan={9} className="text-center text-slate-500 py-6">
                      {t("analytics.no_data")}
                    </Td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {rawLoading && (
            <div className="px-4 py-3 text-sm text-slate-500">
              {t("analytics.loading_list")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Composant FilterBar
function FilterBar({
  preset, setPreset, from, setFrom, to, setTo,
  facetDoctors, facetSpecialties, facetInsurances,
  selDoctors, setSelDoctors, selSpecialties, setSelSpecialties,
  selInsurances, setSelInsurances, selStatuses, setSelStatuses,
  q, setQ, onExportAgg, onExportRaw, loading = false, rawLength = 0
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
  loading?: boolean; rawLength?: number;
}) {
  const { t } = useTranslation();

  const clearAll = () => {
    setPreset("30d");
    setSelDoctors([]); setSelSpecialties([]); setSelInsurances([]); setSelStatuses([]);
    setQ("");
  };

  const statusOptions = ["sent", "arrived", "cancelled"] as const;

  return (
    <div className="grid grid-cols-12 gap-2 md:gap-3 items-end">
      {/* Rangée 1 : presets + dates */}
      <div className="col-span-12 md:col-span-4">
        <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {(["today","7d","30d","custom"] as Preset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              disabled={loading}
              className={`h-9 px-3 rounded-md text-sm transition ${
                preset === p ? "bg-sky-600 text-white" : "hover:bg-slate-50 text-slate-700"
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {t(`analytics.filters.presets.${p}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="col-span-6 md:col-span-3">
        <Label>{t("analytics.filters.labels.from")}</Label>
        <input
          type="datetime-local"
          value={from.slice(0, 16)}
          onChange={(e) => setFrom(new Date(e.target.value).toISOString())}
          className="mt-1 h-9 w-full rounded-md border border-slate-200 px-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
          disabled={preset !== "custom" || loading}
        />
      </div>

      <div className="col-span-6 md:col-span-3">
        <Label>{t("analytics.filters.labels.to")}</Label>
        <input
          type="datetime-local"
          value={to.slice(0, 16)}
          onChange={(e) => setTo(new Date(e.target.value).toISOString())}
          className="mt-1 h-9 w-full rounded-md border border-slate-200 px-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
          disabled={preset !== "custom" || loading}
        />
      </div>

      {/* Rangée 2 : filtres avancés */}
      <div className="col-span-12 grid grid-cols-12 gap-2 md:gap-3 items-end">
        <div className="col-span-12 md:col-span-3">
          <Label>{t("analytics.filters.labels.doctor")}</Label>
          <MultiSelectDropdown 
            options={facetDoctors} 
            value={selDoctors} 
            onChange={setSelDoctors} 
            placeholder={loading ? t("analytics.loading") : t("analytics.filters.placeholders.doctor")}
            disabled={loading}
          />
        </div>
        <div className="col-span-12 md:col-span-3">
          <Label>{t("analytics.filters.labels.specialty")}</Label>
          <MultiSelectDropdown 
            options={facetSpecialties} 
            value={selSpecialties} 
            onChange={setSelSpecialties} 
            placeholder={loading ? t("analytics.loading") : t("analytics.filters.placeholders.specialty")}
            disabled={loading}
          />
        </div>
        <div className="col-span-12 md:col-span-3">
          <Label>{t("analytics.filters.labels.insurance")}</Label>
          <MultiSelectDropdown 
            options={facetInsurances} 
            value={selInsurances} 
            onChange={setSelInsurances} 
            placeholder={loading ? t("analytics.loading") : t("analytics.filters.placeholders.insurance")}
            disabled={loading}
          />
        </div>
        <div className="col-span-12 md:col-span-3">
          <Label>{t("analytics.filters.labels.status")}</Label>
          <MultiSelectDropdown
            options={statusOptions.map(status => ({
              value: status,
              label: t(`analytics.status.${status}`)
            }))}
            value={selStatuses}
            onChange={(vals) => setSelStatuses(vals as RefStatus[])}
            placeholder={t("analytics.filters.placeholders.status")}
            disabled={loading}
          />
        </div>

        <div className="col-span-12 md:col-span-7">
          <Label>{t("analytics.filters.labels.search")}</Label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("analytics.filters.placeholders.search")}
            className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
            disabled={loading}
          />
        </div>

        <div className="col-span-12 md:col-span-5 grid grid-cols-2 gap-2 md:flex md:justify-end">
          <div className="col-span-2 md:col-span-1">
            <button
              onClick={clearAll}
              disabled={loading}
              className="h-9 w-full md:w-auto rounded-lg border border-slate-200 bg-white px-3 text-sm hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title={t("analytics.filters.buttons.reset")}
            >
              {t("analytics.filters.buttons.reset")}
            </button>
          </div>

          <div className="col-span-2 grid grid-cols-2 gap-2 md:hidden">
            <Btn variant="primary" onClick={onExportAgg} disabled={loading}>
              <DownloadIcon /> {t("analytics.filters.buttons.export_agg")}
            </Btn>
            <Btn variant="secondary" onClick={onExportRaw} disabled={loading || rawLength === 0}>
              <DownloadIcon /> {t("analytics.filters.buttons.export_raw")}
            </Btn>
          </div>

          <div className="hidden md:flex gap-2">
            <Btn variant="primary" onClick={onExportAgg} disabled={loading}>
              <DownloadIcon /> {t("analytics.filters.buttons.export_agg_full")}
            </Btn>
            <Btn variant="secondary" onClick={onExportRaw} disabled={loading || rawLength === 0}>
              <DownloadIcon /> {t("analytics.filters.buttons.export_raw_full")}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// MultiSelectDropdown avec support des objets {value, label}
function MultiSelectDropdown({
  options,
  value,
  onChange,
  placeholder = "Sélectionner...",
  disabled = false
}: {
  options: string[] | Array<{value: string, label: string}>;
  value: string[];
  onChange: (vals: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
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

  // Normalisation des options
  const normalizedOptions = useMemo(() => {
    if (options.length === 0) return [];
    if (typeof options[0] === 'string') {
      return (options as string[]).map(opt => ({ value: opt, label: opt }));
    }
    return options as Array<{value: string, label: string}>;
  }, [options]);

  const vals = value;
  const filteredOptions = normalizedOptions.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (v: string) =>
    onChange(vals.includes(v) ? vals.filter((x) => x !== v) : [...vals, v]);

  const clear = () => onChange([]);

  const getDisplayLabel = (value: string) => {
    const option = normalizedOptions.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={`mt-1 h-9 w-full rounded-md border border-slate-200 px-2 text-left text-sm text-slate-700 bg-white hover:bg-slate-50 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
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
                {getDisplayLabel(v)}
                <button
                  className="w-4 h-4 leading-4 text-center rounded-full hover:bg-sky-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(v);
                  }}
                  title={t("analytics.filters.buttons.clear")}
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

      {open && !disabled && (
        <div className="absolute z-50 mt-2 w-[min(92vw,260px)] sm:w-[260px] rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="p-2 border-b border-slate-100">
            <input
              autoFocus
              placeholder={t("analytics.filters.placeholders.search_detailed")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div className="max-h-60 overflow-auto py-1">
            {filteredOptions.map((opt) => {
              const checked = vals.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className="flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                >
                  <span className="truncate pr-3">{opt.label}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(opt.value)}
                    className="h-4 w-4 accent-sky-600"
                  />
                </label>
              );
            })}
            {!filteredOptions.length && (
              <div className="px-3 py-3 text-sm text-slate-500">
                {t("analytics.no_results")}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 px-2 py-2 border-t border-slate-100">
            <button
              className="h-8 rounded-md px-2 text-xs text-slate-700 hover:bg-slate-50"
              onClick={clear}
            >
              {t("analytics.filters.buttons.clear")}
            </button>
            <button
              className="h-8 rounded-md px-3 text-xs text-white bg-sky-600 hover:bg-sky-700"
              onClick={() => setOpen(false)}
            >
              {t("analytics.filters.buttons.done")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Cartes mobiles pour les données brutes
function RawMobileCards({ rows, loading }: { rows: UIRow[]; loading: boolean }) {
  const { t } = useTranslation();

  if (loading)
    return <div className="px-1 py-2 text-sm text-slate-500">{t("analytics.loading_list")}</div>;
  
  if (!rows.length)
    return (
      <div className="px-1 py-4 text-center text-slate-500">
        {t("analytics.no_data")}
      </div>
    );

  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-800">
              #{r.id} — {r.patient}
            </div>
            <span className={`inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-medium ${getStatusBadgeClasses(r.status)}`}>
              {t(`analytics.status.${r.status}`)}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[13px] text-slate-700">
            <div><span className="text-slate-500">{t("analytics.mobile_cards.phone")}</span> {r.phone}</div>
            <div><span className="text-slate-500">{t("analytics.mobile_cards.email")}</span> {r.email}</div>
            <div><span className="text-slate-500">{t("analytics.mobile_cards.insurance")}</span> {r.assurance}</div>
            <div><span className="text-slate-500">{t("analytics.mobile_cards.specialty")}</span> {r.specialty}</div>
            <div><span className="text-slate-500">{t("analytics.mobile_cards.doctor")}</span> {r.doctor}</div>
            <div><span className="text-slate-500">{t("analytics.mobile_cards.sent")}</span> {r.sentAt ? new Date(r.sentAt).toLocaleString("fr-FR") : "—"}</div>
            <div><span className="text-slate-500">{t("analytics.mobile_cards.arrived")}</span> {r.arrivedAt ? new Date(r.arrivedAt).toLocaleString("fr-FR") : "—"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Composants d'interface réutilisables
function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs text-slate-600">{children}</label>;
}

function Th({ className = "", children, ...rest }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 ${className}`} {...rest}>
      {children}
    </th>
  );
}

function Td({ className = "", children, ...rest }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-3 py-2 align-top text-slate-800 ${className}`} {...rest}>
      {children}
    </td>
  );
}

function Btn({ variant = "primary", className = "", children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
}) {
  const base = "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-full text-sm font-medium leading-none whitespace-nowrap select-none transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1";
  const styles = variant === "primary"
    ? "bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
    : "bg-slate-800 text-white hover:bg-slate-900 focus-visible:ring-slate-500 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <button className={`${base} ${styles} w-full md:w-auto min-w-0 md:min-w-[132px] ${className}`} {...rest}>
      {children}
    </button>
  );
}

function DownloadIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}