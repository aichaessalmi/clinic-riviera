import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import { listAppointments } from "../../api/appointments";
import http from "../../api/http";

/* ==========================
   TYPE
========================== */
type ApiAppointment = {
  id: number;
  patient_name: string;
  doctor_full_name?: string;
  physician?: string;
  room_label?: string;
  type_label?: string;
  status: string;
  date: string;
  time: string;
  phone?: string;
  email?: string;
  reason?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

/* ==========================
   COMPOSANT PRINCIPAL
========================== */
export default function PatientHistoryExport() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "fr";

  const [appointments, setAppointments] = useState<ApiAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [fStatus, setFStatus] = useState<string>("__all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  /* ==========================
     CHARGEMENT RDV
  =========================== */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        http.defaults.headers.common["Accept-Language"] = lang;
        const params: Record<string, string> = { ordering: "-date" };
        if (fStatus !== "__all") params.status = fStatus;
        if (from) params.date_after = from;
        if (to) params.date_before = to;

        const res = await listAppointments(params);
        const data =
          Array.isArray(res)
            ? res
            : (res && "results" in res ? (res as any).results : []);
        setAppointments(data);
      } catch (e) {
        console.error("Erreur chargement RDV", e);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [lang, fStatus, from, to]);

  /* ==========================
     UTILITAIRES
  =========================== */
  const translateStatus = (s: string) => {
    const dictFR: Record<string, string> = {
      confirmed: "Confirmé",
      pending: "En attente",
      cancelled: "Annulé",
      completed: "Terminé",
      to_call: "À rappeler",
    };
    const dictEN: Record<string, string> = {
      confirmed: "Confirmed",
      pending: "Pending",
      cancelled: "Cancelled",
      completed: "Completed",
      to_call: "To call back",
    };
    return lang === "fr" ? dictFR[s] || s : dictEN[s] || s;
  };

  const formatDate = (iso: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString(lang === "fr" ? "fr-FR" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportExcel = () => {
    const wsData = appointments.map((a) => ({
      [t("export.patient_name", "Nom du patient")]: a.patient_name,
      [t("export.doctor", "Médecin")]: a.doctor_full_name || a.physician || "—",
      [t("export.type", "Type d’intervention")]: a.type_label || "—",
      [t("export.room", "Salle")]: a.room_label || "—",
      [t("export.date", "Date")]: formatDate(a.date),
      [t("export.time", "Heure")]: a.time || "",
      [t("export.status", "Statut")]: translateStatus(a.status),
      [t("export.phone", "Téléphone")]: a.phone || "—",
      [t("export.last_update", "Dernière mise à jour")]:
        formatDate(a.updated_at || a.created_at || ""),
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historique RDV");
    XLSX.writeFile(
      wb,
      `historique_rdv_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  /* ==========================
     AFFICHAGE
  =========================== */
  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6">
      <h1 className="mb-4 text-2xl font-semibold">
        {lang === "fr"
          ? "Historique des Rendez-vous"
          : "Appointment History"}
      </h1>

      {/* Filtres */}
      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={fStatus}
          onChange={(e) => setFStatus(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="__all">
            {lang === "fr" ? "Tous les statuts" : "All statuses"}
          </option>
          {["confirmed", "pending", "cancelled", "completed", "to_call"].map(
            (s) => (
              <option key={s} value={s}>
                {translateStatus(s)}
              </option>
            )
          )}
        </select>

        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />

        <button
          onClick={() => {
            setFStatus("__all");
            setFrom("");
            setTo("");
          }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
        >
          {lang === "fr" ? "Réinitialiser" : "Reset"}
        </button>

        <button
          onClick={exportExcel}
          className="ml-auto rounded-md bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700"
        >
          {lang === "fr" ? "Exporter en Excel" : "Export to Excel"}
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-slate-500">
          {lang === "fr" ? "Chargement…" : "Loading…"}
        </div>
      ) : (
        <>
          {/* ✅ Table Desktop */}
          <div className="hidden sm:block">
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                    <th className="px-4 py-2">
                      {t("export.patient_name", "Patient")}
                    </th>
                    <th className="px-4 py-2">
                      {t("export.doctor", "Médecin")}
                    </th>
                    <th className="px-4 py-2">
                      {t("export.type", "Type d’intervention")}
                    </th>
                    <th className="px-4 py-2">
                      {t("export.room", "Salle")}
                    </th>
                    <th className="px-4 py-2">{t("export.date", "Date")}</th>
                    <th className="px-4 py-2">{t("export.time", "Heure")}</th>
                    <th className="px-4 py-2">{t("export.status", "Statut")}</th>
                    <th className="px-4 py-2">
                      {t("export.phone", "Téléphone")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        {lang === "fr"
                          ? "Aucun rendez-vous trouvé."
                          : "No appointments found."}
                      </td>
                    </tr>
                  ) : (
                    appointments.map((a) => (
                      <tr key={a.id} className="border-b border-slate-100">
                        <td className="px-4 py-2">{a.patient_name}</td>
                        <td className="px-4 py-2">
                          {a.doctor_full_name || a.physician || "—"}
                        </td>
                        <td className="px-4 py-2">{a.type_label || "—"}</td>
                        <td className="px-4 py-2">{a.room_label || "—"}</td>
                        <td className="px-4 py-2">{formatDate(a.date)}</td>
                        <td className="px-4 py-2">{a.time}</td>
                        <td className="px-4 py-2">{translateStatus(a.status)}</td>
                        <td className="px-4 py-2">{a.phone || "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ✅ Version Mobile (cartes) */}
          <div className="block sm:hidden space-y-4">
            {appointments.length === 0 ? (
              <div className="text-center text-slate-500 py-6">
                {lang === "fr"
                  ? "Aucun rendez-vous trouvé."
                  : "No appointments found."}
              </div>
            ) : (
              appointments.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="text-base font-semibold text-slate-900">
                    {a.patient_name}
                  </div>
                  <div className="text-sm text-slate-500">
                    {a.doctor_full_name || a.physician || "—"}
                  </div>

                  <div className="mt-2 text-sm">
                    <div>
                      <span className="font-medium text-slate-600">
                        {t("export.type", "Type d’intervention")}:
                      </span>{" "}
                      {a.type_label || "—"}
                    </div>
                    <div>
                      <span className="font-medium text-slate-600">
                        {t("export.room", "Salle")}:
                      </span>{" "}
                      {a.room_label || "—"}
                    </div>
                    <div>
                      <span className="font-medium text-slate-600">
                        {t("export.date", "Date")}:
                      </span>{" "}
                      {formatDate(a.date)}
                    </div>
                    <div>
                      <span className="font-medium text-slate-600">
                        {t("export.time", "Heure")}:
                      </span>{" "}
                      {a.time}
                    </div>
                    <div>
                      <span className="font-medium text-slate-600">
                        {t("export.status", "Statut")}:
                      </span>{" "}
                      {translateStatus(a.status)}
                    </div>
                    <div>
                      <span className="font-medium text-slate-600">
                        {t("export.phone", "Téléphone")}:
                      </span>{" "}
                      {a.phone || "—"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
