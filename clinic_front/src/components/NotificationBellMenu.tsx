import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next"; // ✅ ajout pour détecter la langue
import http from "../api/http";

type NotifStatus = "new" | "ack" | "read";

type ArrivalNotifLite = {
  id: string;
  status: NotifStatus;
  patient: string;
  room: string;
  createdAt: string;
  message?: string;
};

function timeAgo(iso: string, t: any) {
  const diffMin = Math.max(0, Math.floor((Date.now() - +new Date(iso)) / 60000));
  if (diffMin < 1) return t("notif.just_now");
  if (diffMin < 60) return t("notif.minutes_ago", { count: diffMin });
  const h = Math.floor(diffMin / 60);
  return t("notif.hours_ago", { count: h });
}

const IconBell = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 2a6 6 0 00-6 6v2.3c0 .6-.2 1.2-.6 1.7L4 14h16l-1.4-2c-.4-.5-.6-1.1-.6-1.7V8a6 6 0 00-6-6zm0 20a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
  </svg>
);

type Props = {
  toAllUrl?: string;
};

export default function NotificationBellMenu({ toAllUrl = "/notifications" }: Props) {
  const { i18n, t } = useTranslation(); // ✅ pour gérer FR/EN
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ArrivalNotifLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  async function fetchNotifs() {
    try {
      setLoading(true);
      setError(null);

      // ✅ envoie la langue actuelle au backend
      const lang = i18n.language || "fr";
      const { data } = await http.get(`/arrival-notifs/?lang=${lang}&ordering=-created_at`);

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : [];

      const mapped: ArrivalNotifLite[] = list.map((n: any) => ({
        id: String(n.id),
        status: n.status ?? "new",
        patient: n.patient ?? n.patient_name ?? "—",
        // ✅ gestion FR/EN
        room:
          n.roomLabel ??
          n.room_label ??
          n.room?.name ??
          n.room_name ??
          "—",
        createdAt: n.createdAt ?? n.created_at ?? new Date().toISOString(),
        message:
          n.message ??
          n.notes ??
          `Arrivée patient${n.speciality ? ` (${n.speciality})` : ""}`,
      }));

      setItems(mapped);
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || "Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 15000);
    return () => clearInterval(id);
  }, [i18n.language]); // ✅ recharge quand la langue change

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  async function ackOne(id: string) {
    await http.patch(`/arrival-notifs/${id}/ack/`);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "ack" } : n))
    );
  }

  async function readOne(id: string) {
    await http.patch(`/arrival-notifs/${id}/read/`);
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "read" } : n))
    );
  }

  const newCount = useMemo(
    () => items.filter((n) => n.status === "new").length,
    [items]
  );
  const sorted = useMemo(
    () => [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [items]
  );

  return (
    <div className="relative" ref={wrapRef}>
      {/* 🔔 Bouton cloche */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      >
        <IconBell className="h-5 w-5" />
        {newCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 rounded-full bg-sky-600 px-1.5 py-[2px] text-[10px] font-semibold text-white">
            {newCount}
          </span>
        )}
      </button>

      {/* 🔽 Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[85vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl z-50">
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">
                {t("notif.new_title")}
              </div>
              {newCount > 0 && (
                <span className="rounded-full bg-sky-600/10 px-2 py-0.5 text-xs font-semibold text-sky-700">
                  {newCount} {t("notif.unread")}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">{t("notif.latest_patients")}</p>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {loading && <div className="p-4 text-center text-slate-500 text-sm">{t("notif.loading")}</div>}
            {error && <div className="p-4 text-center text-rose-600 text-sm">{error}</div>}
            {!loading && sorted.length === 0 && !error && (
              <div className="p-6 text-center text-slate-500 text-sm">{t("notif.empty")}</div>
            )}

            {sorted.slice(0, 8).map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3 transition-colors duration-200 ${
                  n.status === "ack"
                    ? "bg-sky-50"
                    : n.status === "read"
                    ? "bg-slate-50"
                    : "hover:bg-slate-50"
                }`}
              >
                <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-sky-100 text-sky-700">
                  <span className="text-xs font-bold">
                    {n.patient.split(" ").at(0)?.[0] ?? "P"}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {n.patient}
                    </div>
                    {n.status === "new" && (
                      <span className="ml-auto rounded-full bg-sky-600/10 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                        {t("notif.new")}
                      </span>
                    )}
                    {n.status === "ack" && (
                      <span className="ml-auto rounded-full bg-sky-400/10 px-2 py-0.5 text-[11px] font-semibold text-sky-600">
                        {t("notif.ack")}
                      </span>
                    )}
                    {n.status === "read" && (
                      <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                        {t("notif.read")}
                      </span>
                    )}
                  </div>

                  {/* ✅ Salle affichée selon la langue */}
                  <div className="mt-0.5 text-xs text-slate-600">
                    {n.room} • {timeAgo(n.createdAt, t)}
                  </div>

                  {n.message && (
                    <div className="mt-1 line-clamp-2 text-xs text-slate-500">{n.message}</div>
                  )}

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      onClick={() => ackOne(n.id)}
                      disabled={n.status !== "new"}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-200 border ${
                        n.status === "new"
                          ? "bg-sky-400/80 text-white border-sky-400 hover:bg-sky-500"
                          : "bg-transparent text-slate-400 border-slate-200 cursor-not-allowed"
                      }`}
                    >
                      ✓ {t("notif.ack_button")}
                    </button>

                    <button
                      onClick={() => readOne(n.id)}
                      disabled={n.status === "read"}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-200 border ${
                        n.status === "read"
                          ? "bg-transparent text-slate-400 border-slate-200 cursor-not-allowed"
                          : "bg-white text-sky-700 border-sky-200 hover:bg-sky-50"
                      }`}
                    >
                      {t("notif.mark_read")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 🔗 Bas de carte */}
          <div className="border-t border-slate-200 px-4 py-2.5">
            <a
              href={toAllUrl}
              className="block w-full rounded-lg bg-sky-600 px-3 py-2 text-center text-sm font-medium text-white hover:bg-sky-700"
            >
              {t("notif.view_all")}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
