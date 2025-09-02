// src/features/notifications/ArrivalNotificationsPage.tsx
import React, { useMemo, useState, useEffect } from "react";

/* ===================== Types ===================== */
type RoomStatus = "Disponible" | "Occupée" | "Nettoyage" | "Maintenance";
type NotifStatus = "new" | "ack" | "read";

type Room = {
  id: string;
  label: string;
  status: RoomStatus;
  patient?: string;
};

type ArrivalNotif = {
  id: string;
  status: NotifStatus;
  patient: string;
  refBy: string;
  room: string;
  speciality: string;
  apptAt: string;
  createdAt: string;
  message?: string;
  notes?: string;
};

/* ===================== Mock (démo) ===================== */
const ROOMS_MOCK: Room[] = [
  { id: "r101", label: "Salle 101", status: "Occupée", patient: "Marie Dubois" },
  { id: "r102", label: "Salle 102", status: "Disponible" },
  { id: "r103", label: "Salle 103", status: "Nettoyage" },
  { id: "r104", label: "Salle 104", status: "Disponible" },
  { id: "r105", label: "Salle 105", status: "Occupée", patient: "Khadija Mansouri" },
  { id: "r201", label: "Salle 201", status: "Disponible" },
  { id: "r202", label: "Salle 202", status: "Maintenance" },
  { id: "r203", label: "Salle 203", status: "Occupée", patient: "Ahmed Benali" },
  { id: "r204", label: "Salle 204", status: "Disponible" },
  { id: "r301", label: "Salle 301", status: "Occupée", patient: "Youssef Idrissi" },
  { id: "r302", label: "Salle 302", status: "Disponible" },
  { id: "r303", label: "Salle 303", status: "Disponible" },
];

const NOW = Date.now();
const NOTIFS_MOCK: ArrivalNotif[] = [
  {
    id: "n1",
    status: "new",
    patient: "Marie Dubois",
    refBy: "Dr. Hassan Alami",
    room: "Salle 101",
    speciality: "Cardiologie",
    apptAt: new Date(NOW + 20 * 60 * 1000).toISOString(),
    createdAt: new Date(NOW - 5 * 60 * 1000).toISOString(),
    message:
      "Patient arrivé pour consultation cardiologique. Référé par Dr. Hassan Alami.",
    notes:
      "Antécédents cardiaques, nécessite un suivi particulier.",
  },
  {
    id: "n2",
    status: "ack",
    patient: "Ahmed Benali",
    refBy: "Dr. Fatima Zahra",
    room: "Salle 203",
    speciality: "Orthopédie",
    apptAt: new Date(NOW + 35 * 60 * 1000).toISOString(),
    createdAt: new Date(NOW - 15 * 60 * 1000).toISOString(),
    message:
      "Patient assigné à la salle pour consultation orthopédique.",
  },
  {
    id: "n3",
    status: "new",
    patient: "Youssef Idrissi",
    refBy: "Dr. Aïcha Benkirane",
    room: "Salle 301",
    speciality: "Neurologie",
    apptAt: new Date(NOW + 50 * 60 * 1000).toISOString(),
    createdAt: new Date(NOW - 2 * 60 * 1000).toISOString(),
    message: "Nouvelle arrivée pour consultation neurologique urgente.",
  },
];

/* ===================== Helpers UI ===================== */
const dot = (cls: string) => (
  <span className={`inline-block h-2.5 w-2.5 rounded-full ${cls}`} />
);

function timeAgo(iso: string) {
  const diffMin = Math.max(0, Math.floor((Date.now() - +new Date(iso)) / 60000));
  if (diffMin < 1) return "à l’instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  return `il y a ${h} h`;
}

const kRoomColors: Record<RoomStatus, string> = {
  Disponible: "text-emerald-600",
  Occupée: "text-rose-600",
  Nettoyage: "text-amber-600",
  Maintenance: "text-sky-600",
};
const kRoomDotBg: Record<RoomStatus, string> = {
  Disponible: "bg-emerald-500",
  Occupée: "bg-rose-500",
  Nettoyage: "bg-amber-500",
  Maintenance: "bg-sky-500",
};

/* ===================== Icônes ===================== */
const IconBell = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 2a6 6 0 00-6 6v2.3c0 .6-.2 1.2-.6 1.7L4 14h16l-1.4-2c-.4-.5-.6-1.1-.6-1.7V8a6 6 0 00-6-6zm0 20a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
  </svg>
);
const IconUser = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm-7 9a7 7 0 1114 0H5z" />
  </svg>
);
const IconDoctor = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 2a4 4 0 014 4v2a4 4 0 11-8 0V6a4 4 0 014-4zM4 20a8 8 0 0116 0v2H4v-2z"/>
  </svg>
);
const IconStetho = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M6 3a1 1 0 011 1v5a3 3 0 106 0V4a1 1 0 112 0v5a5 5 0 01-10 0V4a1 1 0 011-1zM18 14a3 3 0 100 6h1a1 1 0 100-2h-1a1 1 0 110-2 4 4 0 10-4-4v2a2 2 0 114 0z"/>
  </svg>
);
const IconDoor = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M4 3h12a2 2 0 012 2v16H4V3zm11 9a1 1 0 110 2 1 1 0 010-2z"/>
  </svg>
);
const IconClock = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 11h5v-2h-4V6h-2v7z"/>
  </svg>
);
const IconEye = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 5c-5.5 0-9.7 3.6-11 7 1.3 3.4 5.5 7 11 7s9.7-3.6 11-7c-1.3-3.4-5.5-7-11-7zm0 11a4 4 0 110-8 4 4 0 010 8z"/>
  </svg>
);

/* ===================== Page ===================== */
export default function ArrivalNotificationsPage() {
  const [rooms] = useState<Room[]>(ROOMS_MOCK);
  const [items, setItems] = useState<ArrivalNotif[]>(NOTIFS_MOCK);
  const [live, setLive] = useState(true);
  const [tab, setTab] = useState<"live" | "history">("live");

  const [selected, setSelected] = useState<ArrivalNotif | null>(null);

  const stats = useMemo(() => {
    const newCount = items.filter((n) => n.status === "new").length;
    const arrivalsToday = items.length + 9;
    const occupied = rooms.filter((r) => r.status === "Occupée").length;
    const avgWait = 18;
    return { newCount, arrivalsToday, occupied, avgWait };
  }, [items, rooms]);

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      // refresh backend ici
    }, 15000);
    return () => clearInterval(id);
  }, [live]);

  const filtered = useMemo(
    () => [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [items]
  );

  const counts = {
    dispo: rooms.filter((r) => r.status === "Disponible").length,
    occ: rooms.filter((r) => r.status === "Occupée").length,
  };

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, status: "read" })));
  }
  function ackOne(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, status: "ack" } : n)));
  }
  function readOne(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, status: "read" } : n)));
  }

  return (
    <div className="space-y-6">
      {/* Top bar — empilement mobile */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-slate-900">Notifications d’arrivée</h1>
          <p className="text-sm text-slate-600">
            Suivi en temps réel des arrivées de patients et gestion des salles
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
          <button
            onClick={() => setLive((v) => !v)}
            className={[
              "rounded-lg border px-3 py-2 text-sm font-medium w-full sm:w-auto",
              live
                ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                : "border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100",
            ].join(" ")}
          >
            {live ? "Pause auto-actualisation" : "Reprendre"}
          </button>
          <button
            onClick={markAllRead}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 w-full sm:w-auto"
          >
            Tout marquer comme lu
          </button>
        </div>
      </div>

      {/* Stat cards — 1 col mobile, 2 col ≥sm, 4 col ≥md */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="Nouvelles notifications" value={stats.newCount} trend="+5%" dotCls="bg-emerald-500" />
        <StatCard title="Patients arrivés aujourd’hui" value={stats.arrivalsToday} trend="+8%" dotCls="bg-emerald-500" />
        <StatCard title="Salles occupées" value={stats.occupied} trend="-2%" dotCls="bg-rose-500" />
        <StatCard title="Temps d’attente moyen" value={`${stats.avgWait} min`} trend="-5%" dotCls="bg-rose-500" />
      </div>

      {/* Rooms — cartes plus grandes, grille responsive */}
      <div className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-slate-900">État des salles</h3>
          <div className="text-xs text-slate-500">
            <span className="mr-4">{counts.dispo} disponibles</span>
            <span>{counts.occ} occupées</span>
          </div>
        </div>

        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
          {rooms.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm"
            >
              <div className="mb-1.5 sm:mb-2 flex items-center justify-between">
                <div className="text-xs sm:text-sm font-semibold text-slate-900">{r.label}</div>
                <span className={`text-[11px] sm:text-xs font-medium ${kRoomColors[r.status]}`}>{r.status}</span>
              </div>
              <div className="min-h-[1.1rem] text-[11px] sm:text-xs text-slate-500">
                {r.patient ?? "—"}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1">{dot(kRoomDotBg.Disponible)} Disponible</span>
          <span className="inline-flex items-center gap-1">{dot(kRoomDotBg.Occupée)} Occupée</span>
          <span className="inline-flex items-center gap-1">{dot(kRoomDotBg.Nettoyage)} Nettoyage</span>
          <span className="inline-flex items-center gap-1">{dot(kRoomDotBg.Maintenance)} Maintenance</span>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2">
        <TabButton active={tab === "live"} onClick={() => setTab("live")}>
          En direct <span className="ml-1 rounded bg-slate-100 px-1.5 text-xs"> {filtered.length} </span>
        </TabButton>
        <TabButton active={tab === "history"} onClick={() => setTab("history")}>
          Historique <span className="ml-1 rounded bg-slate-100 px-1.5 text-xs">1</span>
        </TabButton>
      </div>

      {/* Liste des notifications */}
      <div className="space-y-3">
        {filtered.map((n) => (
          <div key={n.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4">
              <div className="mt-0.5 grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full bg-indigo-100 text-indigo-700">
                <IconUser className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <div className="text-sm sm:text-base font-semibold text-slate-900">{n.patient}</div>
                  <span className="text-xs sm:text-sm text-slate-500">• Référé par {n.refBy}</span>
                  {n.status === "new" && (
                    <span className="ml-auto rounded-full bg-blue-600/10 px-2 py-0.5 sm:px-2.5 text-[11px] sm:text-xs font-semibold text-blue-700">
                      Nouveau
                    </span>
                  )}
                  {n.status === "ack" && (
                    <span className="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 sm:px-2.5 text-[11px] sm:text-xs font-semibold text-amber-700">
                      Accusé
                    </span>
                  )}
                </div>

                <div className="mt-1 grid grid-cols-1 md:grid-cols-3 gap-1.5 sm:gap-2 text-[13px] sm:text-sm text-slate-700">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {dot("bg-slate-400")} <span className="text-slate-500">Salle</span> {n.room}
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {dot("bg-slate-400")} <span className="text-slate-500">Spécialité</span> {n.speciality}
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {dot("bg-slate-400")} <span className="text-slate-500">RDV</span>{" "}
                    {new Date(n.apptAt).toLocaleString()}
                  </div>
                </div>

                {n.message && (
                  <p className="mt-2 text-[13px] sm:text-sm text-slate-600">{n.message}</p>
                )}

                {/* Actions — en 2 lignes sur mobile, boutons full width */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-[11px] sm:text-xs text-slate-400">{timeAgo(n.createdAt)}</div>

                  <div className="hidden sm:flex gap-2">
                    <button
                      onClick={() => ackOne(n.id)}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      <span>✓</span> Accuser réception
                    </button>
                    <button
                      onClick={() => setSelected(n)}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      <IconEye className="h-4 w-4" /> Détails
                    </button>
                    <button
                      onClick={() => readOne(n.id)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Marquer comme lu
                    </button>
                  </div>

                  {/* version mobile */}
                  <div className="grid grid-cols-2 gap-2 w-full sm:hidden ml-3">
                    <button
                      onClick={() => ackOne(n.id)}
                      className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-[13px] font-medium text-white"
                    >
                      ✓ Accuser réception
                    </button>
                    <button
                      onClick={() => setSelected(n)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-[13px] font-medium text-white"
                    >
                      <IconEye className="h-4 w-4" /> Détails
                    </button>
                    <button
                      onClick={() => readOne(n.id)}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700"
                    >
                      Marquer comme lu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            Aucune notification à afficher
          </div>
        )}
      </div>

      {/* ======= MODAL DÉTAILS ======= */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" aria-modal="true" role="dialog">
          {/* backdrop */}
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setSelected(null)} />

          {/* panel — plein écran sur mobile, carte centrée sur desktop */}
          <div className="relative z-10 w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[70vh] overflow-hidden sm:rounded-2xl rounded-t-2xl bg-white shadow-2xl sm:mx-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-white">
                  <IconBell className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-base font-semibold text-slate-900">Détails de la notification</div>
                  <div className="text-xs text-slate-500">Arrivée patient</div>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            {/* Subheader */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3">
              <span
                className={[
                  "rounded-full px-2 py-0.5 sm:px-2.5 text-[11px] sm:text-xs font-semibold",
                  selected.status === "new"
                    ? "bg-blue-600/10 text-blue-700"
                    : selected.status === "ack"
                    ? "bg-amber-500/10 text-amber-700"
                    : "bg-slate-100 text-slate-700",
                ].join(" ")}
              >
                {selected.status === "new" ? "Nouveau" : selected.status === "ack" ? "Accusé" : "Lu"}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500">
                {new Date(selected.createdAt).toLocaleString()}
              </span>
            </div>

            {/* Content */}
            <div className="h-[65vh] sm:h-auto sm:max-h-[55vh] overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
              <Section title="Informations patient">
                <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                  <InfoLine icon={<IconUser className="h-5 w-5" />} label="Nom du patient" value={selected.patient} />
                  <InfoLine icon={<IconDoctor className="h-5 w-5" />} label="Médecin référent" value={selected.refBy} />
                  <InfoLine icon={<IconStetho className="h-5 w-5" />} label="Spécialité" value={selected.speciality} />
                  <InfoLine icon={<IconDoor className="h-5 w-5" />} label="Salle assignée" value={selected.room} />
                </div>
              </Section>

              <Section title="Détails du rendez-vous">
                <InfoLine
                  icon={<IconClock className="h-5 w-5" />}
                  label="Heure du rendez-vous"
                  value={new Date(selected.apptAt).toLocaleString()}
                />
              </Section>

              {selected.message && (
                <Section title="Message">
                  <p className="text-sm text-slate-700">{selected.message}</p>
                </Section>
              )}

              {selected.notes && (
                <Section title="Notes additionnelles">
                  <p className="text-sm text-slate-700">{selected.notes}</p>
                </Section>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row sm:justify-end gap-2 border-t border-slate-200 px-4 sm:px-6 py-3 sm:py-4">
              <button
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 w-full sm:w-auto"
                onClick={() => setSelected(null)}
              >
                Fermer
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 w-full sm:w-auto"
                onClick={() => {
                  ackOne(selected.id);
                  setSelected(null);
                }}
              >
                ✓ Accuser réception
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===================== Petits composants UI ===================== */
function StatCard({
  title,
  value,
  trend,
  dotCls,
}: {
  title: string;
  value: string | number;
  trend?: string;
  dotCls?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
      <div className="flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
        <div className="inline-flex items-center gap-2">
          {dot(dotCls ?? "bg-slate-400")}
          <span>{title}</span>
        </div>
        {trend && <span className="font-medium text-emerald-600">{trend}</span>}
      </div>
      <div className="mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "inline-flex items-center rounded-lg px-3 py-1.5 text-sm",
        active
          ? "bg-blue-600 text-white"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h4 className="mb-2 text-sm font-semibold text-slate-900">{title}</h4>
      <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">{children}</div>
    </div>
  );
}

function InfoLine({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div>
        <div className="text-[11px] sm:text-xs uppercase tracking-wide text-slate-500">{label}</div>
        <div className="text-sm font-medium text-slate-900">{value}</div>
      </div>
    </div>
  );
}
