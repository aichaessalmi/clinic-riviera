import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  listAppointments,
  updateAppointmentStatus,
} from "../../api/secretary";

/* ========= Types ========= */
type Status = "confirmed" | "to_call" | "cancelled" | "pending" | "completed";

type Appointment = {
  id: number;
  patient_name: string;
  date: string;
  time: string;
  reason?: string;
  notes?: string;
  status: Status;
  doctor_full_name?: string;
  physician?: string;
  phone?: string;
  email?: string;
};

/* ========= Component ========= */
export default function SecretaryDashboard() {
  const { i18n } = useTranslation();
  const lang = i18n.language || "fr";

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [disabledIds, setDisabledIds] = useState<number[]>([]);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [history, setHistory] = useState<Appointment[]>([]);

  /* ========= Traduction dynamique des badges ========= */
  const statusBadge = (s: Status) => {
    const map: Record<Status, string> = {
      confirmed: "bg-green-100 text-green-700",
      to_call: "bg-yellow-100 text-yellow-700",
      cancelled: "bg-red-100 text-red-700",
      pending: "bg-gray-100 text-gray-700",
      completed: "bg-slate-100 text-slate-700",
    };
    const label: Record<Status, string> = {
      confirmed: lang === "fr" ? "Confirmé" : "Confirmed",
      to_call: lang === "fr" ? "À rappeler" : "To call back",
      cancelled: lang === "fr" ? "Annulé" : "Cancelled",
      pending: lang === "fr" ? "En attente" : "Pending",
      completed: lang === "fr" ? "Terminé" : "Completed",
    };
    return (
      <span
        className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[s]}`}
      >
        {label[s]}
      </span>
    );
  };

  const fmtDate = (d?: string, t?: string) =>
    d
      ? new Date(`${d}T${t ?? "00:00"}`).toLocaleString(
          lang === "fr" ? "fr-FR" : "en-GB"
        )
      : "—";

  /* ========= Charger les données ========= */
  useEffect(() => {
    const refresh = async () => {
      setLoading(true);
      try {
        const appts = await listAppointments({ ordering: "-date" });
        setAppointments(appts);
      } catch (err) {
        console.error("❌ Erreur :", err);
      } finally {
        setLoading(false);
      }
    };

    refresh();
    window.addEventListener("appointment_created", refresh);
    return () => window.removeEventListener("appointment_created", refresh);
  }, []);

  /* ========= Filtrage ========= */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return appointments;
    return appointments.filter(
      (a) =>
        a.patient_name.toLowerCase().includes(q) ||
        a.phone?.includes(q) ||
        a.email?.toLowerCase().includes(q)
    );
  }, [appointments, search]);

  /* ========= Actions ========= */
  const changeStatus = async (id: number, status: Status) => {
    if (disabledIds.includes(id)) return;
    setDisabledIds((prev) => [...prev, id]);
    try {
      await updateAppointmentStatus(id, status);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    } catch (e) {
      console.error("Erreur :", e);
    } finally {
      setDisabledIds((prev) => prev.filter((x) => x !== id));
    }
  };

  const openDetails = (appt: Appointment) => {
    setSelected(appt);
    const hist = appointments.filter(
      (a) =>
        a.patient_name.trim().toLowerCase() ===
          appt.patient_name.trim().toLowerCase() && a.id !== appt.id
    );
    setHistory(hist);
  };

  const closeDetails = () => {
    setSelected(null);
    setHistory([]);
  };

  /* ========= Rendu ========= */
  return (
    <div className="space-y-6 px-3 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {lang === "fr"
              ? "Tableau de bord — Rendez-vous"
              : "Dashboard — Appointments"}
          </h1>
          <p className="text-sm text-slate-600">
            {lang === "fr"
              ? "Gestion dynamique des rendez-vous patients"
              : "Dynamic management of patient appointments"}
          </p>
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            lang === "fr"
              ? "🔍 Rechercher patient, téléphone, email..."
              : "🔍 Search patient, phone, email..."
          }
          className="flex-1 sm:w-72 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-0 focus:border-blue-500"
        />
      </div>

      {/* Table (Desktop) */}
      {!loading && (
        <>
          {/* Version Desktop */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">{lang === "fr" ? "Patient" : "Patient"}</th>
                  <th className="px-4 py-3 text-left">{lang === "fr" ? "Date" : "Date"}</th>
                  <th className="px-4 py-3 text-left">{lang === "fr" ? "Médecin" : "Doctor"}</th>
                  <th className="px-4 py-3 text-left">{lang === "fr" ? "Contact" : "Contact"}</th>
                  <th className="px-4 py-3 text-left">{lang === "fr" ? "Statut" : "Status"}</th>
                  <th className="px-4 py-3 text-right">{lang === "fr" ? "Actions" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {a.patient_name}
                    </td>
                    <td className="px-4 py-3">{fmtDate(a.date, a.time)}</td>
                    <td className="px-4 py-3">
                      {a.doctor_full_name || a.physician || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {a.phone}
                      <br />
                      <span className="text-xs text-slate-500">
                        {a.email ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{statusBadge(a.status)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() => openDetails(a)}
                          className="rounded-md bg-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-300"
                        >
                          {lang === "fr" ? "Voir" : "View"}
                        </button>
                        <button
                          onClick={() => changeStatus(a.id, "confirmed")}
                          disabled={disabledIds.includes(a.id)}
                          className={`rounded-md px-3 py-1 text-xs font-semibold text-white ${
                            disabledIds.includes(a.id)
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-emerald-600 hover:bg-emerald-700"
                          }`}
                        >
                          {lang === "fr" ? "Confirmer" : "Confirm"}
                        </button>
                        <button
                          onClick={() => changeStatus(a.id, "to_call")}
                          disabled={disabledIds.includes(a.id)}
                          className={`rounded-md px-3 py-1 text-xs font-semibold text-white ${
                            disabledIds.includes(a.id)
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-yellow-500 hover:bg-yellow-600"
                          }`}
                        >
                          {lang === "fr" ? "Rappeler" : "Call back"}
                        </button>
                        <button
                          onClick={() => changeStatus(a.id, "cancelled")}
                          disabled={disabledIds.includes(a.id)}
                          className={`rounded-md px-3 py-1 text-xs font-semibold text-white ${
                            disabledIds.includes(a.id)
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-rose-500 hover:bg-rose-600"
                          }`}
                        >
                          {lang === "fr" ? "Annuler" : "Cancel"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      {lang === "fr"
                        ? "Aucun rendez-vous trouvé"
                        : "No appointments found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Version Mobile */}
          <div className="md:hidden space-y-4">
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                {lang === "fr"
                  ? "Aucun rendez-vous trouvé"
                  : "No appointments found"}
              </div>
            ) : (
              filtered.map((a) => (
                <div
                  key={a.id}
                  className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {a.patient_name}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {fmtDate(a.date, a.time)}
                      </p>
                    </div>
                    {statusBadge(a.status)}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        {lang === "fr" ? "Médecin" : "Doctor"}:
                      </span>
                      <span>{a.doctor_full_name || a.physician || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">
                        {lang === "fr" ? "Téléphone" : "Phone"}:
                      </span>
                      <span>{a.phone || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="text-right">{a.email || "—"}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => openDetails(a)}
                      className="flex-1 min-w-[80px] rounded-md bg-slate-200 px-3 py-2 text-xs font-medium hover:bg-slate-300"
                    >
                      {lang === "fr" ? "Voir" : "View"}
                    </button>
                    <button
                      onClick={() => changeStatus(a.id, "confirmed")}
                      disabled={disabledIds.includes(a.id)}
                      className={`flex-1 min-w-[80px] rounded-md px-3 py-2 text-xs font-semibold text-white ${
                        disabledIds.includes(a.id)
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-emerald-600 hover:bg-emerald-700"
                      }`}
                    >
                      {lang === "fr" ? "Confirmer" : "Confirm"}
                    </button>
                    <button
                      onClick={() => changeStatus(a.id, "to_call")}
                      disabled={disabledIds.includes(a.id)}
                      className={`flex-1 min-w-[80px] rounded-md px-3 py-2 text-xs font-semibold text-white ${
                        disabledIds.includes(a.id)
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-yellow-500 hover:bg-yellow-600"
                      }`}
                    >
                      {lang === "fr" ? "Rappeler" : "Call back"}
                    </button>
                    <button
                      onClick={() => changeStatus(a.id, "cancelled")}
                      disabled={disabledIds.includes(a.id)}
                      className={`flex-1 min-w-[80px] rounded-md px-3 py-2 text-xs font-semibold text-white ${
                        disabledIds.includes(a.id)
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-rose-500 hover:bg-rose-600"
                      }`}
                    >
                      {lang === "fr" ? "Annuler" : "Cancel"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Drawer latéral (card de détails) */}
      {selected && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeDetails}
          />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl p-5 overflow-y-auto rounded-l-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {lang === "fr"
                  ? "Détails du rendez-vous"
                  : "Appointment details"}
              </h2>
              <button
                onClick={closeDetails}
                className="rounded-md border px-3 py-1 text-sm hover:bg-slate-50"
              >
                {lang === "fr" ? "Fermer" : "Close"}
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <div className="text-xs text-slate-500">
                  {lang === "fr" ? "Patient" : "Patient"}
                </div>
                <div className="font-medium">{selected.patient_name}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">
                  {lang === "fr" ? "Date & heure" : "Date & time"}
                </div>
                <div className="font-medium">
                  {fmtDate(selected.date, selected.time)}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">
                  {lang === "fr" ? "Médecin" : "Doctor"}
                </div>
                <div className="font-medium">
                  {selected.doctor_full_name || selected.physician || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">
                  {lang === "fr" ? "Contact" : "Contact"}
                </div>
                <div className="font-medium">
                  {selected.phone} / {selected.email ?? "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">
                  {lang === "fr" ? "Motif" : "Reason"}
                </div>
                <div className="font-medium whitespace-pre-wrap break-words">
                  {selected.reason || selected.notes || "—"}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">
                  {lang === "fr" ? "Statut" : "Status"}
                </div>
                {statusBadge(selected.status)}
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-slate-900">
                {lang === "fr"
                  ? "Historique des rendez-vous"
                  : "Appointment history"}
              </h3>
              <div className="mt-3 divide-y rounded-md border">
                {history.length === 0 && (
                  <div className="px-3 py-6 text-center text-slate-500">
                    {lang === "fr"
                      ? "Aucun autre rendez-vous enregistré"
                      : "No other appointments recorded"}
                  </div>
                )}
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-start justify-between px-3 py-3"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {fmtDate(h.date, h.time)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {h.doctor_full_name || h.physician || "—"}
                      </div>
                    </div>
                    <div>{statusBadge(h.status)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}