import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";

/** =====================================================
 *  Referrals (Direction)
 *  Desktop: tableau (inchangé)
 *  Mobile: cartes verticales + téléphone structuré
 *  ===================================================== */

type RefStatus = "waiting" | "arrived";
type Urgency = "low" | "medium" | "high";

type Referral = {
  id: number;
  patient: string;
  phone: string;
  doctor: string;
  specialty: string;
  urgency: Urgency;
  status: RefStatus;
  insurance: string;
  createdAt: string; // ISO
  room_number?: string;
};

type Preset = "today" | "7d" | "30d" | "custom";
const isoDayStart = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x.toISOString(); };
const isoDayEnd   = (d: Date) => { const x = new Date(d); x.setHours(23,59,59,999); return x.toISOString(); };
const shiftDays   = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };

const STATUS_LABEL: Record<RefStatus, string> = { waiting: "En attente", arrived: "Arrivé" };
const STATUS_BADGE: Record<RefStatus, string> = {
  waiting: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  arrived: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
};
const URGENCY_LABEL: Record<Urgency, string> = { low: "Basse", medium: "Moyenne", high: "Haute" };
const URGENCY_BADGE: Record<Urgency, string> = {
  low: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  medium: "bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-200",
  high: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
};

/* ------------ helpers tel ------------ */
function normalizePhone(p: string) {
  // garde seulement chiffres + +
  return p.replace(/[^\d+]/g, "");
}
function formatPhoneFRLike(p: string) {
  const n = normalizePhone(p).replace(/^\+2120?/, "0"); // ex Maroc
  return n.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
}

/* ==================== Page ==================== */
export default function ReferralsAdmin() {
  // Filtres
  const [preset, setPreset] = useState<Preset>("30d");
  const [from, setFrom] = useState<string>(isoDayStart(shiftDays(29)));
  const [to, setTo] = useState<string>(isoDayEnd(new Date()));

  const [selDoctors, setSelDoctors] = useState<string[]>([]);
  const [selSpecialties, setSelSpecialties] = useState<string[]>([]);
  const [selInsurances, setSelInsurances] = useState<string[]>([]);
  const [selUrgencies, setSelUrgencies] = useState<Urgency[]>([]);
  const [selStatuses, setSelStatuses] = useState<RefStatus[]>([]);
  const [q, setQ] = useState<string>("");

  // Facettes
  const [facetDoctors, setFacetDoctors] = useState<string[]>([]);
  const [facetSpecialties, setFacetSpecialties] = useState<string[]>([]);
  const [facetInsurances, setFacetInsurances] = useState<string[]>([]);

  // Données
  const [rows, setRows] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);

  // Mobile: dialog chambre
  const [mobileRoomFor, setMobileRoomFor] = useState<Referral | null>(null);

  // Presets période
  useEffect(() => {
    if (preset === "custom") return;
    const now = new Date();
    if (preset === "today") { setFrom(isoDayStart(now)); setTo(isoDayEnd(now)); }
    else if (preset === "7d") { setFrom(isoDayStart(shiftDays(6))); setTo(isoDayEnd(now)); }
    else if (preset === "30d") { setFrom(isoDayStart(shiftDays(29))); setTo(isoDayEnd(now)); }
  }, [preset]);

  // Query
  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set("from", from); p.set("to", to);
    if (selDoctors.length) p.set("doctor", selDoctors.join(","));
    if (selSpecialties.length) p.set("specialty", selSpecialties.join(","));
    if (selInsurances.length) p.set("insurance", selInsurances.join(","));
    if (selUrgencies.length) p.set("urgency", selUrgencies.join(","));
    if (selStatuses.length) p.set("status", selStatuses.join(","));
    if (q.trim()) p.set("q", q.trim());
    p.set("page", String(page)); p.set("page_size", String(pageSize));
    return p.toString();
  }, [from,to,selDoctors,selSpecialties,selInsurances,selUrgencies,selStatuses,q,page,pageSize]);

  // Fetch
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const res = await fetch(`/api/referrals?${query}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: {
          items: Referral[]; total: number;
          facets?: { doctors?: string[]; specialties?: string[]; insurances?: string[] };
        } = await res.json();
        if (!alive) return;
        setRows(data.items); setTotal(data.total ?? data.items.length);
        if (data.facets?.doctors) setFacetDoctors(data.facets.doctors);
        if (data.facets?.specialties) setFacetSpecialties(data.facets.specialties);
        if (data.facets?.insurances) setFacetInsurances(data.facets.insurances);
      } catch (e) {
        if (!alive) return;
        setErr("Mode démo (références non branchées).");
        const docs = ["Dr. Rami", "Dr. Hadi", "Dr. Saidi", "Dr. Boulif", "Dr. Amal"];
        const specs = ["Cardiologie", "Radiologie", "Chirurgie", "Urgences", "Neurologie"];
        const ins = ["CNSS", "CNOPS", "AXA", "Saham"];
        const urg: Urgency[] = ["low","medium","high"];
        const stt: RefStatus[] = ["waiting","arrived"];
        const mk: Referral[] = Array.from({ length: 28 }, (_, i) => {
          const d = new Date(); d.setDate(d.getDate() - (i % 10)); d.setHours(8 + (i % 8), (i % 2) * 30, 0, 0);
          return {
            id: 500 + i,
            patient: `${i%2?"Aya":"Hicham"} ${i%3?"Ben":"El"} ${100+i}`,
            phone: `+2126${(40000000 + i*137).toString().slice(0,7)}`,
            doctor: docs[i % docs.length],
            specialty: specs[i % specs.length],
            urgency: urg[i % urg.length],
            status: stt[i % stt.length],
            insurance: ins[i % ins.length],
            createdAt: d.toISOString(),
            room_number: i % 5 === 0 ? String(200 + (i % 20)) : undefined,
          };
        });
        setRows(mk); setTotal(mk.length);
        setFacetDoctors(docs); setFacetSpecialties(specs); setFacetInsurances(ins);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [query]);

  // Actions
  const patchStatus = async (id: number, status: RefStatus) => {
    try {
      const res = await fetch(`/api/referrals/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch {
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    }
  };
  const patchRoom = async (id: number, room_number?: string) => {
    try {
      const res = await fetch(`/api/referrals/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_number }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, room_number } : r)));
    } catch {
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, room_number } : r)));
    }
  };

  // Export
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    const data = rows.map((r) => ({
      ID: r.id, Patient: r.patient,
      Téléphone: formatPhoneFRLike(r.phone),
      "Médecin référent": r.doctor, Spécialité: r.specialty,
      Urgence: URGENCY_LABEL[r.urgency], Statut: STATUS_LABEL[r.status],
      Assurance: r.insurance, "Créé le": new Date(r.createdAt).toLocaleString(),
      Chambre: r.room_number || "",
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Références");
    XLSX.writeFile(wb, `references_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const clearAll = () => {
    setPreset("30d");
    setSelDoctors([]); setSelSpecialties([]); setSelInsurances([]); setSelUrgencies([]); setSelStatuses([]);
    setQ(""); setPage(1);
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-sky-50 to-slate-50">
      <div className="p-3 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        {/* Filtres (inchangé) */}
        <div className="rounded-xl bg-white border border-slate-200 shadow-sm p-3 sm:p-4">
          <div className="grid grid-cols-12 gap-2 sm:gap-3 items-end">
            {/* Presets */}
            <div className="col-span-12 sm:col-span-4">
              <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
                {(["today","7d","30d","custom"] as Preset[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPreset(p)}
                    className={`h-9 px-3 rounded-md text-sm ${preset===p?"bg-sky-600 text-white":"text-slate-700 hover:bg-slate-50"}`}
                  >{p==="today"?"Aujourd’hui":p==="7d"?"7j":p==="30d"?"30j":"Perso"}</button>
                ))}
              </div>
            </div>

            {/* Dates */}
            <div className="col-span-6 sm:col-span-3">
              <Label>De</Label>
              <input
                type="datetime-local"
                value={from.slice(0,16)}
                onChange={(e)=>setFrom(new Date(e.target.value).toISOString())}
                className="mt-1 h-9 w-full rounded-md border border-slate-200 px-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                disabled={preset!=="custom"}
              />
            </div>
            <div className="col-span-6 sm:col-span-3">
              <Label>À</Label>
              <input
                type="datetime-local"
                value={to.slice(0,16)}
                onChange={(e)=>setTo(new Date(e.target.value).toISOString())}
                className="mt-1 h-9 w-full rounded-md border border-slate-200 px-2 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                disabled={preset!=="custom"}
              />
            </div>

            {/* Export */}
            <div className="col-span-12 sm:col-span-2 flex justify-end">
              <button
                onClick={exportExcel}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-full text-sm text-white bg-sky-600 hover:bg-sky-700 shadow-sm whitespace-nowrap min-w-[132px]"
              >
                <DownloadIcon /> Export Excel
              </button>
            </div>

            {/* Ligne 2 : sélecteurs */}
            <div className="col-span-12 grid grid-cols-12 gap-2 sm:gap-3 items-end mt-1">
              <div className="col-span-12 sm:col-span-3">
                <Label>Médecin référent</Label>
                <MultiSelectDropdown options={facetDoctors} value={selDoctors} onChange={setSelDoctors} placeholder="Tous les médecins" />
              </div>
              <div className="col-span-12 sm:col-span-3">
                <Label>Spécialité</Label>
                <MultiSelectDropdown options={facetSpecialties} value={selSpecialties} onChange={setSelSpecialties} placeholder="Toutes les spécialités" />
              </div>
              <div className="col-span-12 sm:col-span-3">
                <Label>Assurance</Label>
                <MultiSelectDropdown options={facetInsurances} value={selInsurances} onChange={setSelInsurances} placeholder="Toutes les assurances" />
              </div>
              <div className="col-span-12 sm:col-span-3">
                <Label>Urgence</Label>
                <MultiSelectDropdown
                  options={["low","medium","high"]}
                  value={selUrgencies as string[]}
                  onChange={(vals)=>setSelUrgencies(vals as Urgency[])}
                  placeholder="Toutes les urgences"
                />
              </div>
              <div className="col-span-12 sm:col-span-6">
                <Label>Statut</Label>
                <MultiSelectDropdown
                  options={["waiting","arrived"]}
                  value={selStatuses as string[]}
                  onChange={(vals)=>setSelStatuses(vals as RefStatus[])}
                  placeholder="Tous les statuts"
                />
              </div>
              <div className="col-span-12 sm:col-span-4">
                <Label>Recherche</Label>
                <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="patient, médecin…" className="mt-1 h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
              <div className="col-span-12 sm:col-span-2 flex justify-end">
                <button onClick={clearAll} className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm hover:bg-slate-50">Réinitialiser</button>
              </div>
            </div>
          </div>
        </div>

        {err && (
          <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 px-3 py-2 text-sm">
            {err}
          </div>
        )}

        {/* ===== MOBILE : cartes verticales ===== */}
        <div className="sm:hidden mt-4">
          <ul className="space-y-3">
            {rows.map((r) => (
              <MobileReferralCard
                key={r.id}
                r={r}
                onToggleStatus={() => patchStatus(r.id, r.status === "waiting" ? "arrived" : "waiting")}
                onOpenRoom={() => setMobileRoomFor(r)}
              />
            ))}
            {!rows.length && !loading && (
              <li className="rounded-xl border border-slate-200 bg-white p-4 text-center text-slate-500">
                Aucune référence.
              </li>
            )}
          </ul>
          {loading && (
            <div className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
              Chargement…
            </div>
          )}
        </div>

        {/* ===== DESKTOP : tableau inchangé ===== */}
        <div className="mt-4 rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm hidden sm:block">
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur text-slate-700 shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.06)]">
                <tr>
                  <Th>ID</Th>
                  <Th>Patient</Th>
                  <Th>Médecin réf.</Th>
                  <Th>Spécialité</Th>
                  <Th>Urgence</Th>
                  <Th>Statut</Th>
                  <Th>Assurance</Th>
                  <Th>Créé le</Th>
                  <Th>Chambre</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <ReferralRow
                    key={r.id}
                    r={r}
                    odd={i%2===1}
                    onToggleStatus={() => patchStatus(r.id, r.status === "waiting" ? "arrived" : "waiting")}
                    onSetRoom={(room) => patchRoom(r.id, room)}
                  />
                ))}
                {!rows.length && !loading && (
                  <tr><Td colSpan={10} className="text-center text-slate-500 py-6">Aucune ligne.</Td></tr>
                )}
              </tbody>
            </table>
          </div>
          {loading && <div className="px-4 py-3 text-sm text-slate-500">Chargement…</div>}
        </div>

        {/* ===== Pagination commune ===== */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-white mt-3 rounded-lg">
          <span className="text-xs text-slate-500">
            Page {page} • {rows.length} / {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page<=1}
              onClick={() => setPage((p)=>Math.max(1,p-1))}
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm disabled:opacity-50 hover:bg-slate-50"
            >Précédent</button>
            <button
              disabled={page*pageSize>=total}
              onClick={() => setPage((p)=>p+1)}
              className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm disabled:opacity-50 hover:bg-slate-50"
            >Suivant</button>
          </div>
        </div>
      </div>

      {/* Dialog chambre (utilisé par mobile) */}
      {mobileRoomFor && (
        <RoomDialog
          initial={mobileRoomFor.room_number}
          onClose={() => setMobileRoomFor(null)}
          onConfirm={(room) => { patchRoom(mobileRoomFor.id, room); setMobileRoomFor(null); }}
        />
      )}
    </div>
  );
}

/* ==================== Mobile card ==================== */
function MobileReferralCard({
  r, onToggleStatus, onOpenRoom,
}: {
  r: Referral;
  onToggleStatus: () => void;
  onOpenRoom: () => void;
}) {
  const pretty = formatPhoneFRLike(r.phone);
  const telHref = `tel:${normalizePhone(r.phone)}`;

  const copy = async () => {
    try { await navigator.clipboard.writeText(pretty); alert("Numéro copié"); }
    catch { alert("Impossible de copier"); }
  };

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      {/* header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-slate-500">#{r.id}</div>
          <div className="mt-0.5 font-semibold text-slate-900">{r.patient}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-medium ${URGENCY_BADGE[r.urgency]}`}>
            {URGENCY_LABEL[r.urgency]}
          </span>
          <span className={`inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-medium ${STATUS_BADGE[r.status]}`}>
            {STATUS_LABEL[r.status]}
          </span>
        </div>
      </div>

      {/* téléphone (bloc structuré) */}
      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 p-2">
        <div className="text-[11px] uppercase tracking-wide text-slate-500">Téléphone</div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="text-slate-900 font-medium">{pretty}</div>
          <div className="flex items-center gap-1">
            <a href={telHref} className="h-8 px-3 rounded-md bg-emerald-600 text-white text-xs hover:bg-emerald-700">Appeler</a>
            <button onClick={copy} className="h-8 px-2 rounded-md border border-slate-200 bg-white text-xs hover:bg-slate-50">Copier</button>
          </div>
        </div>
      </div>

      {/* infos empilées (une après l’autre) */}
      <div className="mt-3 space-y-2">
        <InfoRow label="Médecin" value={r.doctor} />
        <InfoRow label="Spécialité" value={r.specialty} />
        <InfoRow label="Assurance" value={r.insurance} />
        <InfoRow label="Créé le" value={new Date(r.createdAt).toLocaleString()} />
        <InfoRow label="Chambre" value={r.room_number ?? "—"} />
      </div>

      {/* actions */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={onToggleStatus}
          className="h-9 rounded-lg border border-slate-200 bg-white text-xs hover:bg-slate-50"
        >
          {r.status === "waiting" ? "Marquer Arrivé" : "Remettre En attente"}
        </button>
        <button
          onClick={onOpenRoom}
          className="h-9 rounded-lg border border-slate-200 bg-white text-xs hover:bg-slate-50"
        >
          Affecter Chambre
        </button>
      </div>
    </li>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 p-2">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-0.5 text-sm text-slate-900">{value}</div>
    </div>
  );
}

/* ==================== Desktop row (inchangé) ==================== */
function ReferralRow({
  r, odd, onToggleStatus, onSetRoom,
}: {
  r: Referral; odd: boolean;
  onToggleStatus: () => void;
  onSetRoom: (room?: string) => void;
}) {
  const [menu, setMenu] = useState(false);
  const [roomOpen, setRoomOpen] = useState(false);
  return (
    <>
      <tr className={`border-t border-slate-100 ${odd ? "bg-slate-50/40" : "bg-white"}`}>
        <Td>{r.id}</Td>
        <Td>
          <div className="font-medium text-slate-800">{r.patient}</div>
          <div className="text-xs text-slate-500">{formatPhoneFRLike(r.phone)}</div>
        </Td>
        <Td>{r.doctor}</Td>
        <Td>{r.specialty}</Td>
        <Td>
          <span className={`inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-medium ${URGENCY_BADGE[r.urgency]}`}>
            {URGENCY_LABEL[r.urgency]}
          </span>
        </Td>
        <Td>
          <span className={`inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-medium ${STATUS_BADGE[r.status]}`}>
            {STATUS_LABEL[r.status]}
          </span>
        </Td>
        <Td>{r.insurance}</Td>
        <Td>{new Date(r.createdAt).toLocaleString()}</Td>
        <Td>{r.room_number ?? "—"}</Td>
        <Td>
          <div className="relative">
            <button
              className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs hover:bg-slate-50"
              onClick={() => setMenu((o) => !o)}
            >
              Actions
            </button>
            {menu && (
              <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg">
                <MenuBtn onClick={() => { onToggleStatus(); setMenu(false); }}>
                  {r.status === "waiting" ? "Marquer comme Arrivé" : "Revenir à En attente"}
                </MenuBtn>
                <MenuBtn onClick={() => { setRoomOpen(true); setMenu(false); }}>
                  Affecter / Modifier chambre…
                </MenuBtn>
              </div>
            )}
          </div>
        </Td>
      </tr>

      {roomOpen && (
        <RoomDialog
          initial={r.room_number}
          onClose={() => setRoomOpen(false)}
          onConfirm={(room) => { onSetRoom(room || undefined); setRoomOpen(false); }}
        />
      )}
    </>
  );
}

function MenuBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">
      {children}
    </button>
  );
}

/* ==================== Dialog chambre ==================== */
function RoomDialog({
  initial, onClose, onConfirm,
}: { initial?: string; onClose: () => void; onConfirm: (room?: string) => void; }) {
  const [room, setRoom] = useState<string>(initial ?? "");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-[92vw] max-w-md rounded-xl bg-white p-4 shadow-xl border border-slate-200">
        <h3 className="text-base font-semibold text-slate-800">Affecter une chambre</h3>
        <div className="mt-3">
          <label className="text-xs text-slate-600">Numéro de chambre</label>
          <input
            value={room}
            onChange={(e)=>setRoom(e.target.value)}
            placeholder="ex : 203"
            className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => { setRoom(""); onConfirm(undefined); }}
            className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm hover:bg-slate-50"
            title="Retirer la chambre"
          >
            Retirer
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm hover:bg-slate-50">Annuler</button>
            <button
              onClick={() => onConfirm(room.trim() || undefined)}
              className="h-9 px-4 rounded-lg text-sm text-white bg-sky-600 hover:bg-sky-700"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== MultiSelect (headless) ==================== */
function MultiSelectDropdown({
  options, value, onChange, placeholder="Sélectionner…",
}: { options: string[]; value: string[]; onChange: (v: string[]) => void; placeholder?: string; }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const vals = value || [];
  const list = (options || []).filter((o) => o.toLowerCase().includes(query.toLowerCase()));

  const toggle = (v: string) => onChange(vals.includes(v) ? vals.filter(x => x !== v) : [...vals, v]);
  const clear = () => onChange([]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(o=>!o)} className="mt-1 h-9 w-full rounded-md border border-slate-200 px-2 text-left text-sm text-slate-700 bg-white hover:bg-slate-50">
        {vals.length === 0 ? <span className="text-slate-400">{placeholder}</span> : (
          <div className="flex flex-wrap gap-1">
            {vals.slice(0,3).map((v)=>(
              <span key={v} className="inline-flex items-center gap-1 rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-200 px-2 py-[2px] text-[11px]">
                {v}
                <button className="w-4 h-4 leading-4 text-center rounded-full hover:bg-sky-100" onClick={(e)=>{e.stopPropagation(); toggle(v);}}>×</button>
              </span>
            ))}
            {vals.length>3 && <span className="text-[11px] text-slate-500">+{vals.length-3}</span>}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[260px] rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="p-2 border-b border-slate-100">
            <input autoFocus placeholder="Rechercher…" value={query} onChange={(e)=>setQuery(e.target.value)} className="h-9 w-full rounded-md border border-slate-200 px-2 text-sm outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div className="max-h-60 overflow-auto py-1">
            {list.map((opt)=>(
              <label key={opt} className="flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer">
                <span className="truncate pr-3">{opt}</span>
                <input type="checkbox" className="h-4 w-4 accent-sky-600" checked={vals.includes(opt)} onChange={()=>toggle(opt)} />
              </label>
            ))}
            {!list.length && <div className="px-3 py-3 text-sm text-slate-500">Aucun résultat.</div>}
          </div>
          <div className="flex items-center justify-between gap-2 px-2 py-2 border-t border-slate-100">
            <button className="h-8 rounded-md px-2 text-xs text-slate-700 hover:bg-slate-50" onClick={clear}>Effacer</button>
            <button className="h-8 rounded-md px-3 text-xs text-white bg-sky-600 hover:bg-sky-700" onClick={()=>setOpen(false)}>Terminer</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==================== petits helpers ==================== */
function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs text-slate-600">{children}</label>;
}
type ThProps = React.ThHTMLAttributes<HTMLTableHeaderCellElement> & { children: React.ReactNode };
function Th({ className = "", children, ...rest }: ThProps) {
  return <th className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 ${className}`} {...rest}>{children}</th>;
}
type TdProps = React.TdHTMLAttributes<HTMLTableCellElement> & { children: React.ReactNode };
function Td({ className = "", children, ...rest }: TdProps) {
  return <td className={`px-3 py-2 align-top text-slate-800 ${className}`} {...rest}>{children}</td>;
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
