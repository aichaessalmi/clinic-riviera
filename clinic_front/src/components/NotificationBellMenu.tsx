// src/components/NotificationBellMenu.tsx
import { useEffect, useMemo, useRef, useState } from "react";

type NotifStatus = "new" | "ack" | "read";
type ArrivalNotifLite = {
  id: string;
  status: NotifStatus;
  patient: string;
  room: string;
  createdAt: string;
  message?: string;
};

const NOW = Date.now();
const DEMO: ArrivalNotifLite[] = [
  {
    id: "n1",
    status: "new",
    patient: "Marie Dubois",
    room: "Salle 101",
    createdAt: new Date(NOW - 2 * 60 * 1000).toISOString(),
    message: "Arrivée patient (cardiologie).",
  },
  {
    id: "n2",
    status: "ack",
    patient: "Ahmed Benali",
    room: "Salle 203",
    createdAt: new Date(NOW - 12 * 60 * 1000).toISOString(),
    message: "Assigné à la salle 203 (orthopédie).",
  },
  {
    id: "n3",
    status: "new",
    patient: "Youssef Idrissi",
    room: "Salle 301",
    createdAt: new Date(NOW - 1 * 60 * 1000).toISOString(),
    message: "Arrivée patient (neurologie).",
  },
];

function timeAgo(iso: string) {
  const diffMin = Math.max(0, Math.floor((Date.now() - +new Date(iso)) / 60000));
  if (diffMin < 1) return "à l’instant";
  if (diffMin < 60) return `${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  return `${h} h`;
}

const IconBell = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 2a6 6 0 00-6 6v2.3c0 .6-.2 1.2-.6 1.7L4 14h16l-1.4-2c-.4-.5-.6-1.1-.6-1.7V8a6 6 0 00-6-6zm0 20a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
  </svg>
);

type Props = {
  items?: ArrivalNotifLite[];
  onAck?: (id: string) => void;
  onRead?: (id: string) => void;
  onOpenDetails?: (id: string) => void;
  toAllUrl?: string;
};

export default function NotificationBellMenu({
  items,
  onAck,
  onRead,
  onOpenDetails,
  toAllUrl = "/notifications",
}: Props) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<ArrivalNotifLite[]>(items ?? DEMO);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => setLocal(items ?? DEMO), [items]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const newCount = useMemo(() => local.filter(n => n.status === "new").length, [local]);
  const sorted = useMemo(
    () => [...local].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [local]
  );

  function ackOne(id: string) {
    setLocal(prev => prev.map(n => n.id === id ? { ...n, status: "ack" } : n));
    onAck?.(id);
  }
  function readOne(id: string) {
    setLocal(prev => prev.map(n => n.id === id ? { ...n, status: "read" } : n));
    onRead?.(id);
  }

  return (
    <div className="relative" ref={wrapRef}>
      {/* Bouton cloche (neutre) + badge (neutre) */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Notifications"
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      >
        <IconBell className="h-5 w-5" />
        {newCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 rounded-full bg-rose-600 px-1.5 py-[2px] text-[10px] font-semibold text-white">
            {newCount}
          </span>
        )}
      </button>

      {/* Dropdown (neutre) */}
      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[85vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">Nouvelles notifications</div>
              {newCount > 0 && (
                <span className="rounded-full bg-blue-600/10 px-2 py-0.5 text-xs font-semibold text-blue-700">
                  {newCount} non lues
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">Dernières arrivées de patients</p>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {sorted.length === 0 && (
              <div className="p-6 text-center text-slate-500 text-sm">Aucune notification</div>
            )}

            {sorted.slice(0, 8).map(n => (
              <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50">
                <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-indigo-100 text-indigo-700">
                  <span className="text-xs font-bold">{n.patient.split(" ").at(0)?.[0] ?? "P"}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold text-slate-900">{n.patient}</div>
                    {n.status === "new" && (
                      <span className="ml-auto rounded-full bg-blue-600/10 px-2 py-0.5 text-[11px] font-semibold text-blue-700">Nouveau</span>
                    )}
                    {n.status === "ack" && (
                      <span className="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Accusé</span>
                    )}
                    {n.status === "read" && (
                      <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">Lu</span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-600">
                    {n.room} • {timeAgo(n.createdAt)}
                  </div>
                  {n.message && (
                    <div className="mt-1 line-clamp-2 text-xs text-slate-500">{n.message}</div>
                  )}

                  {/* 🔴 Seuls les BOUTONS sont verts */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      onClick={() => ackOne(n.id)}
                      className="rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700"
                    >
                      ✓ Accuser
                    </button>
                    <button
                      onClick={() => onOpenDetails ? onOpenDetails(n.id) : undefined}
                      className="rounded-md border border-green-200 bg-white px-2.5 py-1 text-xs text-green-800 hover:bg-green-50"
                    >
                      Détails
                    </button>
                    <button
                      onClick={() => readOne(n.id)}
                      className="rounded-md border border-green-200 bg-white px-2.5 py-1 text-xs text-green-800 hover:bg-green-50"
                    >
                      Marquer lu
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 🔴 Bouton bas de carte vert */}
          <div className="border-t border-slate-200 px-4 py-2.5">
            <a
              href={toAllUrl}
              className="block w-full rounded-lg bg-green-700 px-3 py-2 text-center text-sm font-medium text-white hover:bg-green-800"
            >
              Voir toutes les notifications
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
