import { useMemo, useState } from "react";
import NewAppointmentButton, { type NewAppointment } from "../../components/NewAppointmentButton";

/* =========================
   Types
   ========================= */
type AppointmentStatus = "confirmed" | "pending" | "to_call" | "cancelled" | "completed";

type Appointment = {
  id: string | number;
  date: string;     // ISO "YYYY-MM-DD"
  time: string;     // "HH:MM"
  duration: number; // minutes
  type: string;
  patientFirst: string;
  patientLast: string;
  physician: string;
  phone?: string;
  insurance?: string;
  status: AppointmentStatus;
  notes?: string;
};

/* =========================
   Helpers
   ========================= */
const doctors = ["Dr. Smith", "Dr. Johnson", "Dr. Williams"];
const types = ["Consultation", "Contrôle", "Urgence", "Chirurgie"];
const statuses: AppointmentStatus[] = ["confirmed", "pending", "to_call", "cancelled", "completed"];

const statusBadge = (s: AppointmentStatus) => {
  switch (s) {
    case "confirmed": return "bg-green-100 text-green-700 ring-1 ring-green-200";
    case "pending":   return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
    case "to_call":   return "bg-orange-100 text-orange-700 ring-1 ring-orange-200";
    case "cancelled": return "bg-red-100 text-red-700 ring-1 ring-red-200";
    case "completed": return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
    default:          return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
};

const formatFR = (isoDate: string) => new Date(isoDate).toLocaleDateString("fr-FR");

/* =========================
   Page
   ========================= */
export default function AppointmentsPages() {
  /* ---- data démo ---- */
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: 1,
      date: new Date().toISOString().slice(0, 10),
      time: "09:00",
      duration: 40,
      type: "Consultation",
      patientFirst: "Marie",
      patientLast: "Dubois",
      physician: "Dr. Smith",
      phone: "0612 345 678",
      insurance: "CNOPS",
      status: "confirmed",
      notes: "Première consultation",
    },
    {
      id: 2,
      date: new Date().toISOString().slice(0, 10),
      time: "11:00",
      duration: 30,
      type: "Contrôle",
      patientFirst: "Jean",
      patientLast: "Dupont",
      physician: "Dr. Johnson",
      status: "pending",
    },
    {
      id: 3,
      date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      time: "16:00",
      duration: 20,
      type: "Urgence",
      patientFirst: "SOS",
      patientLast: "",
      physician: "Dr. Williams",
      status: "to_call",
      notes: "Rappeler pour confirmer",
    },
  ]);

  /* ---- filtres ---- */
  const [q, setQ] = useState("");
  const [fDoctor, setFDoctor] = useState<string>("__all");
  const [fStatus, setFStatus] = useState<string>("__all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const filtered = useMemo(
    () =>
      appointments.filter((a) => {
        if (q) {
          const hay = `${a.patientFirst} ${a.patientLast} ${a.physician} ${a.type} ${a.phone ?? ""}`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }
        if (fDoctor !== "__all" && a.physician !== fDoctor) return false;
        if (fStatus !== "__all" && a.status !== (fStatus as AppointmentStatus)) return false;
        if (from && a.date < from) return false;
        if (to && a.date > to) return false;
        return true;
      }),
    [appointments, q, fDoctor, fStatus, from, to]
  );

  /* ---- actions ---- */
  const onCreate = (data: NewAppointment) => {
    setAppointments((prev) => [
      ...prev,
      {
        id: Date.now(),
        date: data.date,
        time: data.time,
        duration: 40,
        type: data.type,
        patientFirst: data.firstName,
        patientLast: data.lastName,
        physician: data.physician,
        phone: data.phone,
        status: data.status,
        notes: data.reason,
      },
    ]);
  };

  const updateStatus = (id: Appointment["id"], status: AppointmentStatus) => {
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  const remove = (id: Appointment["id"]) => {
    if (confirm("Supprimer ce rendez-vous ?")) {
      setAppointments((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const exportCSV = () => {
    const head = [
      "Date","Heure","Patient","Médecin","Type","Durée (min)","Statut","Téléphone","Notes",
    ];
    const rows = filtered.map((a) => [
      formatFR(a.date),
      a.time,
      `${a.patientFirst} ${a.patientLast}`.trim(),
      a.physician,
      a.type,
      String(a.duration),
      a.status,
      a.phone ?? "",
      (a.notes ?? "").replace(/\n/g, " "),
    ]);
    const csv = [head, ...rows]
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rendez-vous_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6">
      {/* Header : même bouton PC visible aussi sur mobile */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold text-slate-900">Rendez-vous</h1>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <NewAppointmentButton
            label="Nouveau RDV"
            className="!px-3 !py-1.5 !text-sm !bg-emerald-600 hover:!bg-emerald-700 !text-white"
            doctors={doctors}
            types={types}
            defaultDate={new Date()}
            defaultTime="07:00"
            onCreate={onCreate}
          />
          <button
            onClick={exportCSV}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher (patient, médecin, téléphone...)"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
        />
        <select
          value={fDoctor}
          onChange={(e) => setFDoctor(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="__all">Tous les médecins</option>
          {doctors.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={fStatus}
          onChange={(e) => setFStatus(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="__all">Tous les statuts</option>
          {statuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          onClick={() => { setQ(""); setFDoctor("__all"); setFStatus("__all"); setFrom(""); setTo(""); }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50"
        >
          Réinitialiser
        </button>
      </div>

      {/* ===== MOBILE: cartes (ancienne version d’infos) ===== */}
      <ul className="sm:hidden space-y-3">
        {filtered.length === 0 && (
          <li className="rounded-lg border border-slate-200 bg-white p-4 text-center text-slate-500">
            Aucun rendez-vous.
          </li>
        )}

        {filtered.map((a) => (
          <li
            key={a.id}
            className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-700">
                {formatFR(a.date)} • <span className="tabular-nums">{a.time}</span>
              </div>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${statusBadge(a.status)}`}>
                {a.status === "to_call" ? "À rappeler" : a.status}
              </span>
            </div>

            <div className="mt-1 font-semibold text-slate-900">
              {(a.patientFirst + " " + a.patientLast).trim()}
            </div>

            {/* Ancien affichage: médecin — type + téléphone dans la même ligne */}
            <div className="text-xs text-slate-500">
              {a.physician} — {a.type}{a.phone ? ` • ${a.phone}` : ""}
            </div>

            {a.notes && (
              <p className="mt-2 text-xs text-slate-700">
                {a.notes}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={a.status}
                onChange={(e) => updateStatus(a.id, e.target.value as AppointmentStatus)}
                className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                title="Changer le statut"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              <button
                onClick={() => alert("Éditer (à brancher si besoin)")}
                className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50"
              >
                Voir / Éditer
              </button>
              <button
                onClick={() => remove(a.id)}
                className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
              >
                Supprimer
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* ===== DESKTOP: table (≥ sm) ===== */}
      <div className="hidden sm:block">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Heure</th>
                <th className="px-4 py-2">Patient</th>
                <th className="px-4 py-2">Médecin</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Statut</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Aucun rendez-vous.
                  </td>
                </tr>
              )}
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-slate-100">
                  <td className="px-4 py-2">{formatFR(a.date)}</td>
                  <td className="px-4 py-2 tabular-nums">{a.time}</td>
                  <td className="px-4 py-2">
                    <div className="font-medium text-slate-900">
                      {(a.patientFirst + " " + a.patientLast).trim()}
                    </div>
                    {a.phone && <div className="text-xs text-slate-500">{a.phone}</div>}
                  </td>
                  <td className="px-4 py-2">{a.physician}</td>
                  <td className="px-4 py-2">{a.type}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${statusBadge(a.status)}`}>
                      {a.status === "to_call" ? "À rappeler" : a.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={a.status}
                        onChange={(e) => updateStatus(a.id, e.target.value as AppointmentStatus)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                        title="Changer le statut"
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => alert("Éditer (à brancher si besoin)")}
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50"
                      >
                        Voir / Éditer
                      </button>
                      <button
                        onClick={() => remove(a.id)}
                        className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
