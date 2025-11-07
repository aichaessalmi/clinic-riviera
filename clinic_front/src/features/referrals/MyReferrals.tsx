import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { listReferrals, type ApiReferral } from "../../api/referrals";


// ===== Types UI =====
type UiRow = {
  id: number;
  nom: string;
  intervention: string;
  date: string; // yyyy-mm-dd
  assurance: string;
  statut: string;   // libellé traduit
  priorite: string; // libellé traduit
  full?: ApiReferral; // 👈 pour ouvrir le détail sans re-fetch
};

// ===== Type souple pour le modal (extension de ApiReferral) =====
type LooseReferral = ApiReferral & {
  // Patient à la racine (si présent)
  birth_date?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postal_code?: string;

  // Assurance à la racine (si présent)
  insurance_provider?: string;
  insurance_policy_number?: string;
  coverage_type?: string;
  expiration_date?: string;
  holder_name?: string;
  insurance_notes?: string;
};

// ===== Helpers =====
const formatPretty = (iso: string, locale: string) =>
  new Date(iso).toLocaleDateString(locale, { year: "numeric", month: "2-digit", day: "2-digit" });

const initials = (fullName?: string) =>
  (fullName || "")
    .split(" ")
    .filter(Boolean)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");

const interventionBadge = (type: string) => {
  if (/chir|surg/i.test(type)) return "bg-rose-200 text-red-700";
  if (/radio|imager/i.test(type)) return "bg-indigo-200 text-indigo-800";
  if (/urg/i.test(type)) return "bg-amber-200 text-amber-800";
  return "bg-gray-200 text-gray-700";
};

const statutBadge = (label: string) => {
  if (/confirm/i.test(label)) return "bg-green-200 text-green-800";
  if (/attent|pending/i.test(label)) return "bg-yellow-200 text-yellow-800";
  if (/annul|reject/i.test(label)) return "bg-rose-200 text-rose-800";
  if (/termin|complete|accept/i.test(label)) return "bg-blue-200 text-blue-800";
  return "bg-gray-200 text-gray-700";
};

const priorityText = (label: string) => {
  if (/urgent/i.test(label)) return "text-red-600 font-bold";
  if (/haut|high/i.test(label)) return "text-orange-600 font-semibold";
  if (/norm|medium|med/i.test(label)) return "text-green-600";
  return "text-gray-600";
};

const uiAssurance = (prov?: string | null): string => {
  const up = (prov || "").toUpperCase();
  if (["CNOPS", "CNSS", "AXA", "FAR"].includes(up)) return up;
  return up || "CNSS";
};

const uiDate = (created_at?: string | null) => (created_at || new Date().toISOString()).slice(0, 10);

// ===== Composant =====
const MyReferrals: React.FC = () => {
  const { t, i18n } = useTranslation();

  const [rows, setRows] = useState<UiRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [search, setSearch] = useState("");
  const [intervention, setIntervention] = useState<string>("Tous");
  const [statut, setStatut] = useState<string>("Tous");
  const [assurance, setAssurance] = useState<string>("Tous");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // État pour le modal détails
  const [selected, setSelected] = useState<ApiReferral | null>(null);

  // ===============================
  // 🧠 Helpers mis à jour
  // ===============================


  const safeString = (val: any): string =>
    typeof val === "string"
      ? val
      : val && typeof val === "object"
      ? val.name || val.name_fr || val.name_en || ""
      : val != null
      ? String(val)
      : "";


  // ✅ Mappage des types d'intervention
 

  // ✅ Mappage des niveaux de priorité
 

// tout en haut, avant load()
const [interventionOptions, setInterventionOptions] = useState<string[]>([]);

const getLangLabel = (obj: any, lang: string): string => {
  if (!obj) return "";
  if (typeof obj === "string") return obj;

  const lowerLang = lang.toLowerCase();

  // Vérifie les propriétés dans l’ordre de priorité
  if (lowerLang.startsWith("fr") && (obj.label_fr || obj.name_fr)) {
    return obj.label_fr || obj.name_fr;
  }
  if (lowerLang.startsWith("en") && (obj.label_en || obj.name_en)) {
    return obj.label_en || obj.name_en;
  }

  // Fallback : essaie de trouver un label générique
  return obj.label || obj.name || obj.label_fr || obj.label_en || "";
};

const load = async () => {
  setBusy(true);
  setError(null);
  try {
    const lang = i18n.language || "fr";
    const list = await listReferrals({ lang });

    // --- options d'intervention dynamiques depuis la liste reçue ---
    const opts = new Set<string>();
    // --- mapping des lignes ---
    const mapped: UiRow[] = list.map((r) => {
      const nom =
        `${(r.patient?.first_name ?? (r as any).first_name ?? "")} ${(r.patient?.last_name ?? (r as any).last_name ?? "")}`.trim() || "—";

      // libellé intervention (priorité à ce que renvoie le backend)
   const interventionLabel =
  getLangLabel((r as any).intervention_type, i18n.language) ||
  safeString((r as any).intervention_label) ||
  "—";

      if (interventionLabel) opts.add(interventionLabel);

      // 👉 même logique que dans le modal pour l’urgence
   const priorite = (() => {
  const val = (r as any).urgency_level;
  const lang = i18n.language?.startsWith("fr") ? "fr" : "en";

  // Si c’est un objet (avec labels)
  if (val && typeof val === "object") {
    return (
      (lang === "fr"
        ? safeString(val.label_fr)
        : safeString(val.label_en)) ||
      safeString(val.label) ||
      safeString(val.name) ||
      "—"
    );
  }

  // Si c’est un nombre (1, 2, 3)
  const num = Number(val);
  if (lang === "fr") {
    if (num === 1) return "Urgente";
    if (num === 2) return "Moyenne";
    if (num === 3) return "Basse";
  } else {
    if (num === 1) return "High";
    if (num === 2) return "Medium";
    if (num === 3) return "Low";
  }

  // Fallback
  return "—";
})();



   
      return {
        id: r.id,
        nom,
        intervention: interventionLabel,
        date: uiDate(r.created_at || undefined),
        assurance: uiAssurance(r.insurance?.insurance_provider),
        statut,
        priorite,
        full: r,
      };
    });

    setRows(mapped);
    setInterventionOptions(Array.from(opts));
  } catch (e: any) {
    console.error("Erreur de chargement :", e);
    setError(e?.message || "Load error");
    setRows([]);
    setInterventionOptions([]);
  } finally {
    setBusy(false);
  }
};

// recharge quand la langue change (FR/EN)
useEffect(() => {
  load();
}, [i18n.language]);


  // 🔄 Chargement initial - CORRIGÉ
  useEffect(() => {
    load();
  }, []);

  // Filtrage UI
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((p) => {
      if (q && !p.nom.toLowerCase().includes(q) && !String(p.assurance).toLowerCase().includes(q)) return false;
      if (intervention !== "Tous" && p.intervention !== intervention) return false;
      if (statut !== "Tous" && p.statut !== statut) return false;
      if (assurance !== "Tous" && p.assurance !== assurance) return false;
      if (startDate && p.date < startDate) return false;
      if (endDate && p.date > endDate) return false;
      return true;
    });
  }, [rows, search, intervention, statut, assurance, startDate, endDate]);

  const reset = () => {
    setSearch("");
    setIntervention("Tous");
    setStatut("Tous");
    setAssurance("Tous");
    setStartDate("");
    setEndDate("");
  };

  const locale = i18n.language || "fr";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t("referrals.title")}</h1>
            <p className="mt-2 text-gray-600">{t("referrals.subtitle")}</p>
          </div>
        </div>

        {/* Filtres + actions */}
        <div className="rounded-2xl bg-white/80 p-6 shadow-md ring-1 ring-gray-100 backdrop-blur">
          <div className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
            <h2 className="text-lg font-semibold text-gray-800">{t("filters.title")}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={load}
                className="rounded-lg bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
              >
                {busy ? t("actions.refreshing") : t("actions.refresh")}
              </button>
              <button
                onClick={() => {
                  const header = ["ID", "Nom", "Intervention", "Date", "Assurance", "Statut", "Priorité"];
                  const body = filtered.map((r) => [r.id, r.nom, r.intervention, r.date, r.assurance, r.statut, r.priorite]);
                  const csv = [header, ...body]
                    .map((line) => line.map(String).map((v) => `"${v.replace(/"/g, '""')}"`).join(","))
                    .join("\n");
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `referrals_${new Date().toISOString().slice(0, 10)}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                disabled={filtered.length === 0}
                className="rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:scale-[1.02] hover:shadow-lg disabled:opacity-50"
              >
                {t("actions.export_csv")}
              </button>
            </div>
          </div>

          {/* Erreur backend */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">
              {t("common.load_error")}: {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t("filters.search")}</label>
              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("filters.search_ph") as string}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
              </div>
            </div>

         <div>
  <label className="mb-1 block text-sm font-medium text-gray-700">
    {t("filters.intervention")}
  </label>
  <select
  value={intervention}
  onChange={(e) => setIntervention(e.target.value)}
  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
>
  {/* ✅ valeur neutre correcte */}
  <option value="Tous">{t("interventions.all")}</option>


  {/* ✅ n'affiche que les libellés valides */}
  {interventionOptions
    .filter((label) => label && label !== "—")
    .map((label) => (
      <option key={label} value={label}>
        {label}
      </option>
    ))}
</select>

</div>


           

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t("filters.insurance")}</label>
              <select
                value={assurance}
                onChange={(e) => setAssurance(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Tous">{t("filters.all_insurances")}</option>
                <option value="CNOPS">CNOPS</option>
                <option value="AXA">AXA</option>
                <option value="CNSS">CNSS</option>
                <option value="FAR">FAR</option>
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t("filters.start_date")}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t("filters.end_date")}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={() => {
                  const d = new Date().toISOString().slice(0, 10);
                  setStartDate(d);
                  setEndDate(d);
                }}
                className="rounded-lg bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-200"
              >
                {t("filters.today")}
              </button>
              <button
                onClick={reset}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                {t("actions.reset")}
              </button>
            </div>
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-800">{t("referrals.list_title")}</h2>
            <span className="text-sm text-gray-500">
              {filtered.length} {t("referrals.results")}
            </span>
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t("table.patient")}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t("table.intervention")}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t("table.date")}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t("table.insurance")}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{t("table.priority")}</th>
                  {/* Colonne Détails */}
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">{t("actions.details")}</th>
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
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      {formatPretty(p.date, locale)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{p.assurance}</td>
                    
                    <td className={`whitespace-nowrap px-6 py-4 text-sm ${priorityText(p.priorite)}`}>{p.priorite}</td>
                    {/* Bouton Détails */}
                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      <button
                        onClick={() => setSelected(p.full!)}
                        className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        {t("actions.details")}
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                      {busy ? t("actions.refreshing") : t("referrals.empty")}
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
                    <p className="text-xs text-gray-500">{t("table.date")}</p>
                    <p className="font-medium">{formatPretty(p.date, locale)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t("table.insurance")}</p>
                    <p className="font-medium">{p.assurance}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t("table.status")}</p>
                    <p className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statutBadge(p.statut)}`}>{p.statut}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t("table.priority")}</p>
                    <p className={`${priorityText(p.priorite)}`}>{p.priorite}</p>
                  </div>
                </div>
                {/* Bouton Détails (mobile) */}
                <button
                  onClick={() => setSelected(p.full!)}
                  className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {t("actions.details")}
                </button>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-center text-gray-500">{busy ? t("actions.refreshing") : t("referrals.empty")}</div>}
          </div>

          {/* Pagination info */}
          <div className="border-t border-gray-200 px-6 py-4 text-sm text-gray-700">
            {t("referrals.showing")} <span className="font-medium">{filtered.length === 0 ? 0 : 1}</span> {t("referrals.to")}{" "}
            <span className="font-medium">{filtered.length}</span> {t("referrals.of")}{" "}
            <span className="font-medium">{filtered.length}</span> {t("referrals.results")}.
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">© 2025</div>
      </div>

      {/* --- Détails (Modal) --- */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 md:p-8">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setSelected(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 text-xl"
            >
              ✕
            </button>

            <h2 className="mb-4 text-2xl font-bold text-gray-800">{t("details.title")}</h2>

            {/* alias typé souple */}
            {(() => {
              const L = selected as LooseReferral;

              // 🔒 Types d'affichage (clairs pour TS)
              type PatientView = {
                first_name: string;
                last_name: string;
                birth_date: string;
                gender: string;
                phone: string;
                email: string;
                address: string;
                city: string;
                postal_code: string;
              };

              type AssuranceView = {
                provider: string;
                policy: string;
                coverage: string;
                expiration: string;
                holder: string;
                notes: string;
              };

              // ✅ merge patient + root fields (selon structure réelle de l'API)
              const patient: PatientView = {
                first_name: (L.patient as any)?.first_name ?? (L as any).first_name ?? "—",
                last_name: (L.patient as any)?.last_name ?? (L as any).last_name ?? "—",
                birth_date: (L.patient as any)?.birth_date ?? (L as any).birth_date ?? "—",
                gender: (L.patient as any)?.gender ?? (L as any).gender ?? "—",
                phone: (L.patient as any)?.phone ?? (L as any).phone ?? "—",
                email: (L.patient as any)?.email ?? (L as any).email ?? "—",
                address: (L.patient as any)?.address ?? (L as any).address ?? "—",
                city: (L.patient as any)?.city ?? (L as any).city ?? "—",
                postal_code: (L.patient as any)?.postal_code ?? (L as any).postal_code ?? "—",
              };

              const assurance: AssuranceView = {
                provider: (L.insurance as any)?.insurance_provider ?? (L as any).insurance_provider ?? "—",
                policy: (L.insurance as any)?.insurance_policy_number ?? (L as any).insurance_policy_number ?? "—",
                coverage: (L.insurance as any)?.coverage_type ?? (L as any).coverage_type ?? "—",
                expiration: (L.insurance as any)?.expiration_date ?? (L as any).expiration_date ?? "—",
                holder: (L.insurance as any)?.holder_name ?? (L as any).holder_name ?? "—",
                notes: (L.insurance as any)?.insurance_notes ?? (L as any).insurance_notes ?? "—",
              };

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* -------- Patient -------- */}
        <Info label={t("referral_form.first_name")}>{patient.first_name}</Info>
<Info label={t("referral_form.last_name")}>{patient.last_name}</Info>
<Info label={t("referral_form.birth_date")}>{patient.birth_date}</Info>
<Info label={t("referral_form.gender")}>{safeString((L.patient as any)?.gender_label) || patient.gender || "—"}</Info>
<Info label={t("referral_form.phone")}>{patient.phone}</Info>
<Info label={t("referral_form.email")}>{patient.email}</Info>
<Info label={t("referral_form.address")}>{patient.address}</Info>
<Info label={t("referral_form.city")}>{patient.city}</Info>
<Info label={t("referral_form.postal_code")}>{patient.postal_code}</Info>

            {/* -------- Médical -------- */}
{(() => {
  // ✅ Récupération dynamique des libellés depuis la BD
 const interventionLabel =
  getLangLabel((L as any).intervention_type, i18n.language) ||
  safeString((L as any).intervention_label) ||
  "—";


  // ✅ Même logique que dans le tableau pour la priorité (urgency_level)
const priorityLabel =
  i18n.language.startsWith("fr")
    ? safeString((L as any).urgency_level?.name)
    : safeString((L as any).urgency_level?.name);




  return (
    <>
      <Info label={t("referral_form.intervention_type")}>{interventionLabel}</Info>
<Info label={t("referral_form.urgency_level")}>{priorityLabel}</Info>
<Info label={t("referral_form.consultation_reason")}>{L.consultation_reason ?? "—"}</Info>
<Info label={t("referral_form.medical_history")}>{L.medical_history ?? "—"}</Info>
<Info label={t("referral_form.referring_doctor")}>{L.referring_doctor ?? "—"}</Info>
<Info label={t("referral_form.establishment")}>{L.establishment ?? "—"}</Info>
    </>
  );
})()}


                  {/* -------- Assurance -------- */}
                  <Info label={t("referral_form.insurance_provider")}>{assurance.provider}</Info>
<Info label={t("referral_form.insurance_policy_number")}>{assurance.policy}</Info>
<Info label={t("referral_form.coverage_type")}>{assurance.coverage}</Info>
<Info label={t("referral_form.expiration_date")}>{assurance.expiration}</Info>
<Info label={t("referral_form.holder_name")}>{assurance.holder}</Info>
<Info label={t("referral_form.insurance_notes")}>{assurance.notes}</Info>
                </div>
              );
            })()}

            <div className="mt-6 flex justify-end md:hidden">
              <button
                onClick={() => setSelected(null)}
                className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                {t("actions.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReferrals;

/* ---------- Small UI helper ---------- */
function Info({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="border rounded-xl p-3">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="text-sm text-gray-800 mt-0.5">{children ?? "—"}</div>
    </div>
  );
}