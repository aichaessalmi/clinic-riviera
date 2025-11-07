import { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import http from "../../api/http";

/* ========= Types ========= */
type Referral = {
  id: number;
  status: "new" | "accepted" | "rejected" | "completed" | "sent";
  created_at?: string | null;
  updated_at?: string | null;
  physician?: string | null;
  consultation_reason?: string | null;
  medical_history?: string | null;
  referring_doctor?: string | null;
  establishment?: string | null;

  intervention_type: {
    id: number;
    name_fr?: string;
    name_en?: string;
    name?: string;
    description?: string;
  } | string | null;

  urgency_level?: {
    id: number;
    label_fr?: string;
    label_en?: string;
    name_fr?: string;
    name_en?: string;
    name?: string;
  } | string | null;

  patient: {
    id: number;
    first_name: string;
    last_name: string;
    phone?: string | null;
    email?: string | null;
    birth_date?: string | null;
    gender?: string | null;
    address?: string | null;
    city?: string | null;
    postal_code?: string | null;
  } | null;

  insurance: {
    id: number;
    insurance_provider: string;
    insurance_policy_number?: string | null;
    coverage_type?: string | null;
    expiration_date?: string | null;
    holder_name?: string | null;
    insurance_notes?: string | null;
  } | null;
};

/* ========= Component ========= */
export default function SecretaryReferrals() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.toLowerCase() || "fr";

  const [data, setData] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtreMedecin, setFiltreMedecin] = useState("Tous");
  const [selected, setSelected] = useState<Referral | null>(null);
  const [medecins, setMedecins] = useState<string[]>([]);

  /* ========= Helpers ========= */
  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString(lang.startsWith("fr") ? "fr-FR" : "en-GB", {
      dateStyle: "short",
      timeStyle: "short",
    });

  // ✅ Priorité récupérée depuis la BD, selon la langue
  const getLangLabel = (obj: any, lang: string): string => {
    if (!obj) return "—";
    if (typeof obj === "string") return obj;

    if (lang.startsWith("fr")) {
      return obj.label_fr || obj.name_fr || obj.label || obj.name || "—";
    } else {
      return obj.label_en || obj.name_en || obj.label || obj.name || "—";
    }
  };

  const prioriteText = (txt: string) => {
    const lower = txt.toLowerCase();
    if (lower.includes("urgent")) return "text-red-600 font-bold";
    if (lower.includes("haut") || lower.includes("high")) return "text-orange-600 font-semibold";
    if (lower.includes("moy") || lower.includes("medium")) return "text-green-600";
    return "text-gray-600";
  };

  /* ========= Charger données depuis API ========= */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [refRes, medRes] = await Promise.all([
          http.get("/referrals/"),
          http.get("/accounts/physicians/"),
        ]);

        const toList = (res: any) =>
          Array.isArray(res.data) ? res.data : res.data.results || [];

        setData(toList(refRes));
        setMedecins(
          toList(medRes).map(
            (m: any) => `${m.first_name ?? ""} ${m.last_name ?? ""}`.trim()
          )
        );
      } catch (e) {
        console.error("❌ Erreur chargement :", e);
        alert(t("referrals.error_loading"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [i18n.language]);

  /* ========= Filtrage ========= */
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return data.filter((r) => {
      const patientName = r.patient
        ? `${r.patient.first_name ?? ""} ${r.patient.last_name ?? ""}`.toLowerCase()
        : "";
      const doctorName = (r.physician || "").toLowerCase().trim();

      const matchesSearch =
        !q ||
        patientName.includes(q) ||
        doctorName.includes(q) ||
        (r.patient?.email?.toLowerCase().includes(q) ?? false) ||
        (r.patient?.phone?.includes(q) ?? false);

      const matchesDoctor =
        filtreMedecin === "Tous" ||
        doctorName === filtreMedecin.toLowerCase().trim();

      return matchesSearch && matchesDoctor;
    });
  }, [data, search, filtreMedecin]);

  /* ========= UI ========= */
  if (loading)
    return (
      <div className="text-center text-slate-500 py-10">
        {t("referrals.loading")}
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {t("referrals.title")}
        </h1>
        <p className="text-slate-600">{t("referrals.subtitle")}</p>
      </div>

      {/* Filtres */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("referrals.search_placeholder")}
          className="w-full md:w-64 rounded-lg border px-3 py-2 text-sm"
        />
        <select
          value={filtreMedecin}
          onChange={(e) => setFiltreMedecin(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="Tous">{t("referrals.all_doctors")}</option>
          {medecins.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Table Desktop */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-xl shadow">
        <table className="w-full">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="px-4 py-2 text-left">{t("referrals.table.patient")}</th>
              <th className="px-4 py-2 text-left">{t("referrals.table.doctor")}</th>
              <th className="px-4 py-2 text-left">{t("referrals.table.intervention")}</th>
              <th className="px-4 py-2 text-left">{t("referrals.table.date")}</th>
              <th className="px-4 py-2 text-left">{t("referrals.table.insurance")}</th>
              <th className="px-4 py-2 text-left">{t("referrals.table.priority")}</th>
              <th className="px-4 py-2 text-left">{t("referrals.table.details")}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((r) => {
              const priorityLabel = getLangLabel(r.urgency_level, lang);
              const interventionLabel = getLangLabel(r.intervention_type, lang);

              return (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    {r.patient
                      ? `${r.patient.first_name ?? ""} ${r.patient.last_name ?? ""}`
                      : "—"}
                  </td>
                  <td className="px-4 py-2">{r.physician || "—"}</td>
                  <td className="px-4 py-2">{interventionLabel}</td>
                  <td className="px-4 py-2">
                    {r.created_at ? formatDateTime(r.created_at) : "—"}
                  </td>
                  <td className="px-4 py-2">
                    {r.insurance?.insurance_provider?.toUpperCase() || "—"}
                  </td>
                  <td className={`px-4 py-2 ${prioriteText(priorityLabel)}`}>
                    {priorityLabel}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => setSelected(r)}
                      className="rounded-md bg-slate-200 px-3 py-1 text-sm hover:bg-slate-300"
                    >
                      {t("referrals.table.details")}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center text-slate-500 py-8">
            {t("referrals.no_results")}
          </div>
        )}
      </div>

      {/* Slide-over — Vue détaillée */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="w-full sm:w-[680px] h-full bg-white p-6 overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-semibold text-slate-900">
                {t("referrals.details.title")}
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="rounded-md border px-3 py-2 text-sm"
              >
                {t("referrals.details.close")}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <Info label={t("referrals.details.patient")}>
                {selected.patient
                  ? `${selected.patient.first_name} ${selected.patient.last_name}`
                  : "—"}
              </Info>
              <Info label={t("referrals.details.doctor")}>{selected.physician || "—"}</Info>
              <Info label={t("referrals.details.intervention")}>
                {getLangLabel(selected.intervention_type, lang)}
              </Info>
              <Info label={t("referrals.details.priority")}>
                {getLangLabel(selected.urgency_level, lang)}
              </Info>
              <Info label={t("referrals.details.consultation_reason")}>
                {selected.consultation_reason || "—"}
              </Info>
              <Info label={t("referrals.details.referring_doctor")}>
                {selected.referring_doctor || "—"}
              </Info>
              <Info label={t("referrals.details.establishment")}>
                {selected.establishment || "—"}
              </Info>
              <Info label={t("referrals.details.medical_history")}>
                {selected.medical_history || "—"}
              </Info>
              <Info label={t("referrals.details.address")}>
                {selected.patient?.address || "—"}
              </Info>
              <Info label={t("referrals.details.city")}>
                {selected.patient?.city || "—"}
              </Info>
              <Info label={t("referrals.details.phone")}>
                {selected.patient?.phone || "—"}
              </Info>
              <Info label={t("referrals.details.email")}>
                {selected.patient?.email || "—"}
              </Info>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------- Sous-composant pour affichage clair -------- */
function Info({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="border rounded-xl p-3">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="text-sm text-gray-800 mt-0.5">{children ?? "—"}</div>
    </div>
  );
}
