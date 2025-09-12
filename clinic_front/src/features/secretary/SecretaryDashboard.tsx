// src/features/secretary/SecretaryDashboard.tsx
import React, { useMemo, useState } from "react";

/* ===================== Types ===================== */
type Status = "pending" | "to_call" | "confirmed" | "cancelled";
type Req = {
  id: string;
  initials: string;
  patient: string;
  phone: string;
  requestedAt: string;          // ISO
  doctor: string;
  reason: string;
  urgency?: "Basse" | "Normale" | "Élevée";
  insurance?: string;
  status: Status;
};

type AgendaItem = { time: string; who: string; with: string; type: string };
type ActivityItem = { id: string; at: string; text: string; tone?: "ok"|"warn"|"info" };

/* ===================== Mock data (démo) ===================== */
const NOW = new Date();
function isoMins(delta: number) { return new Date(+NOW + delta*60000).toISOString(); }

const REQUESTS_INIT: Req[] = [
  {
    id: "r1", initials: "SB", patient: "Sophie Bernard", phone: "06 55 34 33 42",
    requestedAt: isoMins(-90), doctor: "Dr. Pierre Bernard", reason: "Douleurs abdominales",
    insurance: "Privé", status: "to_call", urgency: "Normale",
  },
  {
    id: "r2", initials: "PM", patient: "Pierre Moreau", phone: "06 12 33 24 44",
    requestedAt: isoMins(-60), doctor: "Dr. Claire Rousseau", reason: "Urgence - Fièvre élevée",
    insurance: "CPAM", status: "pending", urgency: "Élevée",
  },
  {
    id: "r3", initials: "CR", patient: "Claire Rousseau", phone: "06 77 89 90 08",
    requestedAt: isoMins(-40), doctor: "Dr. Martin Dubois", reason: "Suivi post-opératoire",
    insurance: "Mutuelle", status: "cancelled", urgency: "Basse",
  },
];

const AGENDA_TODAY: AgendaItem[] = [
  { time:"09:00", who:"Marie Dubois", with:"Dr. Martin", type:"Consultation" },
  { time:"10:30", who:"Jean Dupont", with:"Dr. Laurent", type:"Contrôle" },
  { time:"14:00", who:"Sophie Bernard", with:"Dr. Martin", type:"Consultation" },
  { time:"15:30", who:"Pierre Moreau", with:"Dr. Laurent", type:"Contrôle" },
  { time:"16:45", who:"Claire Rousseau", with:"Dr. Martin", type:"Consultation" },
];

const ACTIVITY_INIT: ActivityItem[] = [
  { id:"a1", at:"12:00", text:"RDV confirmé pour Marie Dubois", tone:"ok" },
  { id:"a2", at:"12:15", text:"RDV annulé par Jean Dupont", tone:"warn" },
  { id:"a3", at:"12:20", text:"Nouvelle demande : Claire Rousseau", tone:"info" },
  { id:"a4", at:"12:40", text:"Statut mis à jour pour Pierre Moreau", tone:"info" },
  { id:"a5", at:"13:05", text:"Message WhatsApp envoyé à Sophie Bernard", tone:"ok" },
];

/* ===================== Icônes inline ===================== */
const Dot = ({cls="bg-slate-400"}:{cls?:string}) => <span className={`inline-block h-2.5 w-2.5 rounded-full ${cls}`} />;
const IconPhone = (p:any)=> (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M6.6 10.8a15 15 0 006.6 6.6l2.2-2.2a1 1 0 011-.25 11 11 0 003.5.56 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11 11 0 00.56 3.5 1 1 0 01-.25 1L6.6 10.8z"/></svg>);
const IconCheck = (p:any)=> (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M20.3 5.7a1 1 0 010 1.4l-10 10a1 1 0 01-1.4 0l-5-5a1 1 0 111.4-1.4L9 14.6l9.3-9.3a1 1 0 011.4 0z"/></svg>);
const IconFilter = (p:any)=> (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M3 5h18v2l-7 7v5l-4-2v-3L3 7z"/></svg>);
const IconExport = (p:any)=> (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M5 20h14v-2H5v2zM12 4l5 5h-3v6h-4V9H7l5-5z"/></svg>);

/* ===================== Helpers ===================== */
function timeAgo(iso: string) {
  const m = Math.max(0, Math.floor((Date.now() - +new Date(iso))/60000));
  if (m<1) return "à l’instant";
  if (m<60) return `il y a ${m} min`;
  const h = Math.floor(m/60); return `il y a ${h} h`;
}

/* ===================== Page ===================== */
export default function SecretaryDashboard() {
  const [q, setQ] = useState("");
  const [requests, setRequests] = useState<Req[]>(REQUESTS_INIT);
  const [activity, setActivity] = useState<ActivityItem[]>(ACTIVITY_INIT);

  const kpis = useMemo(() => {
    const confirmed = requests.filter(r=>r.status==="confirmed").length;
    const pending = requests.filter(r=>r.status==="pending").length;
    const toCall = requests.filter(r=>r.status==="to_call").length;
    const cancelled = requests.filter(r=>r.status==="cancelled").length;
    return { confirmed, pending, toCall, cancelled };
  }, [requests]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return requests;
    return requests.filter(r =>
      [r.patient, r.phone, r.reason, r.doctor, r.insurance]
        .filter(Boolean)
        .some(s => s!.toLowerCase().includes(term))
    );
  }, [q, requests]);

  // Actions
  const confirm = (id:string)=>{
    setRequests(rs => rs.map(r => r.id===id ? {...r, status:"confirmed"}: r));
    setActivity(a => [{ id:crypto.randomUUID(), at:new Date().toLocaleTimeString(), text:"RDV confirmé", tone:"ok"}, ...a]);
  };
  const markToCall = (id:string)=>{
    setRequests(rs => rs.map(r => r.id===id ? {...r, status:"to_call"}: r));
  };
  const cancel = (id:string)=>{
    setRequests(rs => rs.map(r => r.id===id ? {...r, status:"cancelled"}: r));
    setActivity(a => [{ id:crypto.randomUUID(), at:new Date().toLocaleTimeString(), text:"RDV annulé", tone:"warn"}, ...a]);
  };

  return (
    <div className="space-y-5">
      {/* Top actions row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="text-slate-600">Aperçu de l’activité de la clinique</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
            <IconFilter className="h-4 w-4" /> Filtres
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
            <IconExport className="h-4 w-4" /> Exporter
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard title="Confirmés" value={kpis.confirmed} trend="+12%" dotCls="bg-emerald-500" />
        <KpiCard title="En attente" value={kpis.pending} trend="+5%" dotCls="bg-blue-600" />
        <KpiCard title="À rappeler" value={kpis.toCall} trend="-3%" dotCls="bg-amber-500" icon={<IconPhone className="h-4 w-4" />} />
        <KpiCard title="Annulés" value={kpis.cancelled} trend="+2%" dotCls="bg-rose-500" />
      </div>

      {/* Search */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
        <input
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          placeholder="Rechercher par nom, téléphone ou motif…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
      </div>

      {/* 2 columns layout */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* LEFT: Requests list */}
        <div className="xl:col-span-2 space-y-4">
          <SectionTitle title={`Demandes de rendez-vous`} subtitle={`${filtered.length} demande(s)`} />
          {filtered.map(r=>(
            <RequestCard
              key={r.id}
              req={r}
              onConfirm={()=>confirm(r.id)}
              onToCall={()=>markToCall(r.id)}
              onCancel={()=>cancel(r.id)}
            />
          ))}
          {filtered.length===0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
              Aucune demande ne correspond à votre recherche.
            </div>
          )}
        </div>

        {/* RIGHT: Today + Activity + WhatsApp */}
        <div className="space-y-4">
          <Card>
            <div className="mb-2 flex items-center justify-between">
              <div className="font-semibold text-slate-900">Aujourd’hui</div>
              <div className="text-xs text-slate-500">{NOW.toLocaleDateString("fr-FR",{weekday:"long", day:"2-digit", month:"long"})}</div>
            </div>
            <ul className="space-y-2">
              {AGENDA_TODAY.map((a,i)=>(
                <li key={i} className="flex items-start justify-between rounded-lg border border-slate-200 p-2">
                  <div className="text-xs font-medium text-slate-700">{a.time}</div>
                  <div className="min-w-0 flex-1 px-2">
                    <div className="truncate text-sm font-medium text-slate-900">{a.who}</div>
                    <div className="truncate text-xs text-slate-500">{a.with} • {a.type}</div>
                  </div>
                  <Dot cls="bg-blue-600"/>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="mb-2 font-semibold text-slate-900">Activité récente</div>
            <ul className="space-y-2">
              {activity.map(a=>(
                <li key={a.id} className="flex items-start gap-2 rounded-lg border border-slate-200 p-2">
                  <Dot cls={a.tone==="ok"?"bg-emerald-500":a.tone==="warn"?"bg-rose-500":"bg-slate-400"} />
                  <div className="min-w-0">
                    <div className="truncate text-sm text-slate-800">{a.text}</div>
                    <div className="text-xs text-slate-500">{a.at}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="mb-2 flex items-center justify-between">
              <div className="font-semibold text-slate-900">WhatsApp</div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">Connecté</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-2xl font-bold text-slate-900">24</div>
                <div className="text-xs text-slate-500">Messages envoyés</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">3</div>
                <div className="text-xs text-slate-500">Aujourd’hui</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">1</div>
                <div className="text-xs text-slate-500">Rappels</div>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">Envoyer un message</button>
              <button className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">Configurer</button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ===================== Petits composants ===================== */
function KpiCard({ title, value, trend, dotCls, icon }:{
  title:string; value:number|string; trend?:string; dotCls?:string; icon?:React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="inline-flex items-center gap-2">
          <Dot cls={dotCls??"bg-slate-400"} />
          <span>{title}</span>
        </div>
        {trend && <span className={trend.includes("-") ? "text-rose-600" : "text-emerald-600"}>{trend}</span>}
      </div>
      <div className="mt-2 flex items-end justify-between">
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {icon}
      </div>
    </div>
  );
}

function SectionTitle({title, subtitle}:{title:string; subtitle?:string}) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      {subtitle && <div className="text-xs text-slate-500">{subtitle}</div>}
    </div>
  );
}

function Card({children}:{children:React.ReactNode}) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">{children}</div>;
}

function BadgeStatus({status}:{status:Status}) {
  const map: Record<Status,string> = {
    confirmed: "bg-emerald-50 text-emerald-700",
    pending: "bg-slate-100 text-slate-700",
    to_call: "bg-amber-50 text-amber-700",
    cancelled: "bg-rose-50 text-rose-700",
  };
  const lbl: Record<Status,string> = {
    confirmed:"Confirmé", pending:"En attente", to_call:"À rappeler", cancelled:"Annulé",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status]}`}>{lbl[status]}</span>;
}

function RequestCard({
  req, onConfirm, onToCall, onCancel,
}:{
  req: Req;
  onConfirm: () => void;
  onToCall: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start gap-4 p-4">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
          {req.initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-semibold text-slate-900">{req.patient}</div>
            <span className="text-xs text-slate-500">• {req.phone}</span>
            <span className="ml-auto"><BadgeStatus status={req.status}/></span>
          </div>

          <ul className="mt-2 grid list-disc grid-cols-1 gap-1 pl-4 text-sm text-slate-700 sm:grid-cols-2">
            <li><span className="text-slate-500">Médecin :</span> {req.doctor}</li>
            <li><span className="text-slate-500">Motif :</span> {req.reason}</li>
            <li><span className="text-slate-500">Assurance :</span> {req.insurance ?? "—"}</li>
            <li><span className="text-slate-500">Urgence :</span> {req.urgency ?? "—"}</li>
          </ul>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-400">Reçu {timeAgo(req.requestedAt)}</div>
            <div className="flex flex-wrap gap-2">
              <button onClick={onToCall} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
                <IconPhone className="h-4 w-4" /> À rappeler
              </button>
              <button onClick={onConfirm} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                <IconCheck className="h-4 w-4" /> Confirmer
              </button>
              <button onClick={onCancel} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
