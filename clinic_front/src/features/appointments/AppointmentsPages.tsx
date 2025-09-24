import { useMemo, useState } from "react";
import * as XLSX from "xlsx";

type Status = "confirmed" | "pending" | "cancelled" | "completed";

type PatientRecord = {
  id: number;
  patientName: string;
  dateRDV: string; // ISO "YYYY-MM-DD"
  status: Status;
  insurance?: string;
  phone?: string;
  email?: string;
  lastUpdate: string; // ISO
};

const statuses: Status[] = ["confirmed", "pending", "cancelled", "completed"];

const statusBadge = (s: Status) => {
  switch (s) {
    case "confirmed": return "bg-green-100 text-green-700 ring-1 ring-green-200";
    case "pending":   return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
    case "cancelled": return "bg-red-100 text-red-700 ring-1 ring-red-200";
    case "completed": return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
    default: return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
  }
};

const formatFR = (isoDate: string) => new Date(isoDate).toLocaleDateString("fr-FR");

export default function PatientHistoryExport() {
  const [records] = useState<PatientRecord[]>([
    {
      id: 1,
      patientName: "Marie Dubois",
      dateRDV: new Date().toISOString().slice(0, 10),
      status: "confirmed",
      insurance: "CNOPS",
      phone: "0612345678",
      email: "marie.dubois@example.com",
      lastUpdate: new Date().toISOString(),
    },
    {
      id: 2,
      patientName: "Jean Dupont",
      dateRDV: new Date().toISOString().slice(0, 10),
      status: "pending",
      insurance: "CNSS",
      phone: "0698765432",
      email: "marie.dubois@example.com",
      lastUpdate: new Date().toISOString(),
    },
  ]);

  const [fStatus, setFStatus] = useState<string>("__all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const filtered = useMemo(() =>
    records.filter(r => {
      if (fStatus !== "__all" && r.status !== fStatus) return false;
      if (from && r.dateRDV < from) return false;
      if (to && r.dateRDV > to) return false;
      return true;
    }),
    [records, fStatus, from, to]
  );

  const exportExcel = () => {
    const wsData = filtered.map(r => ({
      "Nom patient": r.patientName,
      "Date RDV": formatFR(r.dateRDV),
      "Statut": r.status,
      "Assurance": r.insurance || "",
      "Téléphone": r.phone || "",
      "Email": r.email || "",
      "Dernière mise à jour": formatFR(r.lastUpdate),
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Patient History");
    XLSX.writeFile(wb, `patient_history_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Patient History & Export</h1>

      {/* Filtres */}
      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={fStatus}
          onChange={(e) => setFStatus(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="__all">Tous les statuts</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <input type="date" value={from} onChange={e => setFrom(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        
        <button onClick={() => { setFStatus("__all"); setFrom(""); setTo(""); }}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
        >Réinitialiser</button>

        <button onClick={exportExcel}
          className="ml-auto rounded-md bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700"
        >
          Exporter en Excel
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
                <th className="px-4 py-2">Nom patient</th>
                <th className="px-4 py-2">Date RDV</th>
                <th className="px-4 py-2">Statut</th>
                <th className="px-4 py-2">Assurance</th>
                <th className="px-4 py-2">Téléphone</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Dernière mise à jour</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">Aucun enregistrement.</td>
                </tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-4 py-2">{r.patientName}</td>
                  <td className="px-4 py-2">{formatFR(r.dateRDV)}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${statusBadge(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{r.insurance || "-"}</td>
                  <td className="px-4 py-2">{r.phone || "-"}</td>
                  <td className="px-4 py-2">{r.email || "-"}</td>
                  <td className="px-4 py-2">{formatFR(r.lastUpdate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards (Vertical Layout) */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="border rounded-lg p-4 bg-white text-center text-slate-500">Aucun enregistrement.</div>
        )}
        {filtered.map(r => (
          <div key={r.id} className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="font-medium text-lg">{r.patientName}</div>
            <div className="text-sm mt-1">Date RDV: {formatFR(r.dateRDV)}</div>
            <div className="text-sm">Statut: <span className={`inline-flex items-center rounded-full px-2 py-0.5 ${statusBadge(r.status)}`}>{r.status}</span></div>
            <div className="text-sm">Assurance: {r.insurance || "-"}</div>
            <div className="text-sm">Téléphone: {r.phone || "-"}</div>
            {r.email && <div className="text-sm">Email: {r.email}</div>}
            <div className="text-sm">Dernière mise à jour: {formatFR(r.lastUpdate)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
