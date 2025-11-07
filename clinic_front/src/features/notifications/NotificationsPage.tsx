import React, { useMemo, useState, useEffect } from "react";
import { useTranslation } from "react-i18next"; // ✅ i18n pour FR/EN
import http from "../../api/http"; // axios préconfiguré (baseURL '/api', JWT, etc.)

/* ===================== Types ===================== */
type NotifStatus = "new" | "ack" | "read";

export type ArrivalNotif = {
  id: string;
  status: NotifStatus;
  patient: string;
  refBy: string;
  room: string;       // traduit dynamiquement depuis backend
  intervention_type: string; // traduit dynamiquement depuis backend
  apptAt: string;
  createdAt: string;
  message?: string | null;
  notes?: string | null;
};

/* ===================== Icônes ===================== */
const IconBell = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 2a6 6 0 00-6 6v2.3c0 .6-.2 1.2-.6 1.7L4 14h16l-1.4-2c-.4-.5-.6-1.1-.6-1.7V8a6 6 0 00-6-6zm0 20a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
  </svg>
);
const IconUser = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm-7 9a7 7 0 1114 0H5z" />
  </svg>
);
const IconDoctor = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 2a4 4 0 014 4v2a4 4 0 11-8 0V6a4 4 0 014-4zM4 20a8 8 0 0116 0v2H4v-2z" />
  </svg>
);
const IconStetho = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M6 3a1 1 0 011 1v5a3 3 0 106 0V4a1 1 0 112 0v5a5 5 0 01-10 0V4a1 1 0 011-1zM18 14a3 3 0 100 6h1a1 1 0 100-2h-1a1 1 0 110-2 4 4 0 10-4-4v2a2 2 0 114 0z" />
  </svg>
);
const IconDoor = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M4 3h12a2 2 0 012 2v16H4V3zm11 9a1 1 0 110 2 1 1 0 010-2z" />
  </svg>
);
const IconClock = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 11h5v-2h-4V6h-2v7z" />
  </svg>
);
const IconEye = (p: any) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 5c-5.5 0-9.7 3.6-11 7 1.3 3.4 5.5 7 11 7s9.7-3.6 11-7c-1.3-3.4-5.5-7-11-7zm0 11a4 4 0 110-8 4 4 0 010 8z" />
  </svg>
);
// Ajoute cette ligne ⬇️


/* ===================== Helpers UI ===================== */
function timeAgo(iso: string, t: any) {
  const diffMin = Math.max(0, Math.floor((Date.now() - +new Date(iso)) / 60000));
  if (diffMin < 1) return t("notif.just_now");
  if (diffMin < 60) return t("notif.minutes_ago", { count: diffMin });
  const h = Math.floor(diffMin / 60);
  return t("notif.hours_ago", { count: h });
}

/* ===================== Page ===================== */
export default function NotificationsPage() {
  const { t, i18n } = useTranslation(); // ✅ langue active

  const [items, setItems] = useState<ArrivalNotif[]>([]);
  const [live, setLive] = useState(true);
  const [tab, setTab] = useState<"live" | "history">("live");
  const [selected, setSelected] = useState<ArrivalNotif | null>(null);
  const [error, setError] = useState<string | null>(null);
   const [loading, setLoading] = useState(false); // ✅ ici c’est bon !

  // ==================== 🔹 Spécialités bilingues ====================
  const [specialties, setSpecialties] = useState<
    { id: number; name_fr: string; name_en: string; name?: string }[]
  >([]);

  // 🟢 Charger les spécialités depuis le backend bilingue
  useEffect(() => {
    (async () => {
      try {
        const { data } = await http.get("/accounts/specialties/", {
          headers: { "Accept-Language": i18n.language },
        });
        console.log("📦 Spécialités chargées :", data);
        setSpecialties(Array.isArray(data.results) ? data.results : []);
      } catch (err) {
        console.error("❌ Erreur lors du chargement des spécialités :", err);
      }
    })();
  }, [i18n.language]);


  /* --------- Mapping --------- */
  function mapNotif(api: any): ArrivalNotif {
    return {
      id: String(api.id),
      status: (api.status ?? "new") as NotifStatus,
      patient: api.patient ?? api.patient_name ?? "—",
      refBy: api.refBy ?? api.ref_by ?? api.referrer ?? api.referrer_name ?? "—",
      room:
  api.roomLabel ??          // ✅ supporte le bon nom (backend)
  api.room_label ??          // (pour compatibilité)
  api.room?.name ??
  api.room_name ??
  api.room_translated ??
  "—",

   intervention_type:
  api.interventionLabel ??
  api.intervention_label ??
  api.interventionType ??
  "—",


      apptAt: api.apptAt ?? api.appt_at ?? new Date().toISOString(),
      createdAt: api.createdAt ?? api.created_at ?? new Date().toISOString(),
      message: api.message ?? null,
      notes: api.notes ?? null,
    };
  }

  function unwrapList<T = any>(data: any): T[] {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.results)) return data.results;
    return [];
  }

  /* --------- Fetchers --------- */
  async function fetchNotifs(signal?: AbortSignal) {
  const lang = i18n.language || "fr";
  // ✅ on met à jour le header dynamiquement à chaque requête
  http.defaults.headers.common["Accept-Language"] = lang;

  const res = await http.get(`/arrival-notifs/?ordering=-created_at`, { signal });
  return unwrapList(res.data).map(mapNotif);
}

  async function fetchAll(signal?: AbortSignal) {
    try {
      setLoading(true);
      setError(null);
      const notifs = await fetchNotifs(signal);
      setItems(notifs);
    } catch (e: any) {
      if (e?.name === "CanceledError") return;
      setError(e?.response?.data?.detail || e?.message || t("notif.network_error"));
    } finally {
      setLoading(false);
    }
  }

  async function ackOne(id: string) {
    try {
      await http.patch(`/arrival-notifs/${id}/ack/`);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, status: "ack" } : n)));
    } catch {}
  }

  async function readOne(id: string) {
    try {
      await http.patch(`/arrival-notifs/${id}/read/`);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, status: "read" } : n)));
    } catch {}
  }

  async function markAllRead() {
    try {
      await http.post(`/arrival-notifs/mark_all_read/`);
      setItems((prev) => prev.map((n) => ({ ...n, status: "read" })));
    } catch {}
  }

  // --------- Init & Polling ---------
  /* --------- Chargement initial + mise à jour langue --------- */
  useEffect(() => {
    const controller = new AbortController();
    fetchAll(controller.signal);
    return () => controller.abort();
  }, [i18n.language]); // ✅ recharge quand la langue change

  /* --------- Rafraîchissement auto toutes les 15s --------- */
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      fetchAll(); // recharge sans recharger toute la page
    }, 15000);
    return () => clearInterval(id);
  }, [live, i18n.language]); // ✅ s’adapte aussi à la langue actuelle

  /* --------- Liste triée --------- */
  const filtered = useMemo(() => {
    return [...items].sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
    );
  }, [items]);

// 🔹 Fonction pour obtenir le nom FR/EN de la spécialité
function getSpecialtyLabel(speciality: any) {
  if (!speciality) return "—";

  // Cas 1: c’est un objet complet
  if (typeof speciality === "object") {
    return i18n.language.startsWith("en")
      ? speciality.name_en
      : speciality.name_fr;
  }

  // Cas 2: c’est un ID numérique → on cherche dans specialties[]
  const found = specialties.find((s) => s.id === Number(speciality));
  if (!found) return "—";
  return i18n.language.startsWith("en") ? found.name_en : found.name_fr;
}

 return (
  <div className="space-y-6">
    {/* Top bar */}
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-lg sm:text-xl font-semibold text-slate-900">
          {t("notif.title")}
        </h1>
        <p className="text-sm text-slate-600">{t("notif.subtitle")}</p>
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
          {live ? t("notif.pause") : t("notif.resume")}
        </button>
        <button
          onClick={markAllRead}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 w-full sm:w-auto"
        >
          {t("notif.mark_all_read")}
        </button>
      </div>
    </div>

    {/* Erreur réseau */}
    {error && (
      <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">
        {error}
      </div>
    )}

    {/* Onglets */}
    <div className="flex gap-2">
      <TabButton active={tab === "live"} onClick={() => setTab("live")}>
        {t("notif.live")}{" "}
        <span className="ml-1 rounded bg-slate-100 px-1.5 text-xs">
          {filtered.length}
        </span>
      </TabButton>
      <TabButton active={tab === "history"} onClick={() => setTab("history")}>
        {t("notif.history")}{" "}
        <span className="ml-1 rounded bg-slate-100 px-1.5 text-xs">1</span>
      </TabButton>
    </div>

    {/* Liste des notifications */}
    <div className="space-y-3">
      {loading && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          {t("notif.loading")}
        </div>
      )}

      {filtered.map((n) => (
        <div
          key={n.id}
          className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4">
            <div className="mt-0.5 grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-full bg-indigo-100 text-indigo-700">
              <IconUser className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <div className="text-sm sm:text-base font-semibold text-slate-900">
                  {n.patient}
                </div>
                <span className="text-xs sm:text-sm text-slate-500">
                  • {t("notif.referred_by")} {n.refBy}
                </span>
                {n.status === "new" && (
                  <span className="ml-auto rounded-full bg-blue-600/10 px-2 py-0.5 sm:px-2.5 text-[11px] sm:text-xs font-semibold text-blue-700">
                    {t("notif.new")}
                  </span>
                )}
                {n.status === "ack" && (
                  <span className="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 sm:px-2.5 text-[11px] sm:text-xs font-semibold text-amber-700">
                    {t("notif.ack")}
                  </span>
                )}
              </div>

              <div className="mt-1 grid grid-cols-1 md:grid-cols-3 gap-1.5 sm:gap-2 text-[13px] sm:text-sm text-slate-700">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-slate-500">{t("notif.room")}</span>{" "}
                  {n.room}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-slate-500">{t("notif.intervention_type")}</span>{" "}
                 {n.intervention_type}

                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-slate-500">{t("notif.appointment")}</span>{" "}
                  {new Date(n.apptAt).toLocaleString()}
                </div>
              </div>

              {n.message && (
                <p className="mt-2 text-[13px] sm:text-sm text-slate-600">
                  {n.message}
                </p>
              )}

              {/* Actions */}
              <div className="mt-3 flex items-center justify-between">
                <div className="text-[11px] sm:text-xs text-slate-400">
                  {timeAgo(n.createdAt, t)}
                </div>

                <div className="hidden sm:flex gap-2">
                  <button
                    onClick={() => ackOne(n.id)}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <span>✓</span> {t("notif.ack_button")}
                  </button>
                  <button
                    onClick={() => setSelected(n)}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    <IconEye className="h-4 w-4" /> {t("notif.details")}
                  </button>
                  <button
                    onClick={() => readOne(n.id)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    {t("notif.mark_read")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          {t("notif.empty")}
        </div>
      )}
    </div>

    {/* ======= MODAL DÉTAILS ======= */}
    {selected && (
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        aria-modal="true"
        role="dialog"
      >
        <div
          className="absolute inset-0 bg-slate-900/40"
          onClick={() => setSelected(null)}
        />
        <div className="relative z-10 w-full sm:max-w-3xl max-h-[92vh] sm:max-h-[70vh] overflow-hidden sm:rounded-2xl rounded-t-2xl bg-white shadow-2xl sm:mx-4">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-blue-600 text-white">
                <IconBell className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-semibold text-slate-900">
                  {t("notif.detail_title")}
                </div>
                <div className="text-xs text-slate-500">
                  {t("notif.patient_arrival")}
                </div>
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
              {selected.status === "new"
                ? t("notif.new")
                : selected.status === "ack"
                ? t("notif.ack")
                : t("notif.read")}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-500">
              {new Date(selected.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="h-[65vh] sm:h-auto sm:max-h-[55vh] overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
            <Section title={t("notif.patient_info")}>
              <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                <InfoLine
                  icon={<IconUser className="h-5 w-5" />}
                  label={t("notif.patient_name")}
                  value={selected.patient}
                />
                <InfoLine
                  icon={<IconDoctor className="h-5 w-5" />}
                  label={t("notif.ref_doctor")}
                  value={selected.refBy}
                />
                <InfoLine
                  icon={<IconStetho className="h-5 w-5" />}
                  label={t("notif.speciality")}
                  value={getSpecialtyLabel(selected.intervention_type)}

                />
                <InfoLine
                  icon={<IconDoor className="h-5 w-5" />}
                  label={t("notif.room")}
                  value={selected.room}
                />
              </div>
            </Section>

            <Section title={t("notif.appointment_details")}>
              <InfoLine
                icon={<IconClock className="h-5 w-5" />}
                label={t("notif.appointment_time")}
                value={new Date(selected.apptAt).toLocaleString()}
              />
            </Section>

            {selected.message && (
              <Section title={t("notif.message")}>
                <p className="text-sm text-slate-700">{selected.message}</p>
              </Section>
            )}

            {selected.notes && (
              <Section title={t("notif.additional_notes")}>
                <p className="text-sm text-slate-700">{selected.notes}</p>
              </Section>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 border-t border-slate-200 px-4 sm:px-6 py-3 sm:py-4">
            <button
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 w-full sm:w-auto"
              onClick={() => setSelected(null)}
            >
              {t("notif.close")}
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 w-full sm:w-auto"
              onClick={() => {
                ackOne(selected.id);
                setSelected(null);
              }}
            >
              ✓ {t("notif.ack_button")}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);

/* ===================== Petits composants UI ===================== */
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
        "inline-flex items-center rounded-lg px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-blue-600 text-white shadow-sm"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4">
      <h4 className="mb-2 text-sm font-semibold text-slate-900">{title}</h4>
      <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
        {children}
      </div>
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
        {/* 🔹 label peut venir directement traduit via t("notif.xxx") */}
        <div className="text-[11px] sm:text-xs uppercase tracking-wide text-slate-500">
          {label}
        </div>
        <div className="text-sm font-medium text-slate-900 break-words">
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

}