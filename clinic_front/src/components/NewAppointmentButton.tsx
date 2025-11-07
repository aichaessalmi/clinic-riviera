import React, { useEffect, useMemo, useState, useId } from "react";
import { useTranslation } from "react-i18next";

/** Types */
export type AppointmentStatus =
  | "confirmed"
  | "pending"
  | "to_call"
  | "cancelled"
  | "completed";

export type NewAppointment = {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  date: string;
  time: string;
  physician: string;
  type: string;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
  room: string;
  insurance?: string;
};

type Props = {
  label?: string;
  rooms: string[];
  insurances: { id: number; name: string }[];
  variant?: "primary" | "outline" | "fab";
  className?: string;
  doctors: string[];
  types: string[];
  statuses?: AppointmentStatus[];
  defaultDate?: Date;
  defaultTime?: string;
  onCreate: (data: NewAppointment) => void;
};

/* === Icône === */
function PlusIcon({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

/* === Format date === */
function formatDateYYYYMMDD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/* === Composant principal === */
export default function NewAppointmentButton({
  label,
  variant = "primary",
  className = "",
  doctors,
  types,
  rooms,
  statuses = ["pending", "confirmed", "to_call", "cancelled", "completed"],
  defaultDate,
  defaultTime = "07:00",
  onCreate,
}: Props) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const titleId = useId();

  const initialDate = useMemo(
    () => formatDateYYYYMMDD(defaultDate ?? new Date()),
    [defaultDate]
  );

  const [form, setForm] = useState<NewAppointment>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    insurance: "",
    room: "",
    date: initialDate,
    time: defaultTime,
    physician: "",
    type: "",
    status: "pending",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const onChange = (k: keyof NewAppointment, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim())
      return alert(t("new_appointment.alert_name"));
    if (!form.date || !form.time) return alert(t("new_appointment.alert_date"));
    if (!form.physician) return alert(t("new_appointment.alert_doctor"));
    if (!form.room) return alert(t("new_appointment.alert_room"));
    if (!form.type) return alert(t("new_appointment.alert_type"));
    if (!form.reason.trim()) return alert(t("new_appointment.alert_reason"));

    onCreate(form);
    window.dispatchEvent(new Event("appointment_created"));
    setOpen(false);

    setForm({
      ...form,
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      reason: "",
      notes: "",
      physician: "",
      room: "",
      type: "",
    });
  };

  const baseBtn =
    "inline-flex items-center gap-2 rounded-md text-sm px-3.5 py-2 transition";
  const varCls =
    variant === "outline"
      ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      : variant === "fab"
      ? "fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800 justify-center"
      : "bg-slate-900 text-white hover:bg-slate-800";
  const showLabel = variant !== "fab";

  return (
    <>
      {/* Bouton principal */}
      <button
        type="button"
        className={`${baseBtn} ${varCls} ${className}`}
        onClick={() => setOpen(true)}
      >
        <PlusIcon />
        {showLabel && <span>{label || t("new_appointment.new")}</span>}
      </button>

      {/* Modal */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed inset-0 z-[1000] flex items-start justify-center overflow-auto p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          >
            <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl ring-1 ring-slate-200">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200 p-4">
                <div>
                  <h2 id={titleId} className="text-lg font-semibold">
                    {t("new_appointment.new_appointment")}
                  </h2>
                  <div className="text-xs text-slate-500">
                    {new Date(form.date + "T" + form.time).toLocaleString(
                      i18n.language === "fr" ? "fr-FR" : "en-US"
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="h-9 w-9 rounded-md text-slate-600 hover:bg-slate-100"
                  onClick={() => setOpen(false)}
                  aria-label={t("common.close")}
                >
                  ✕
                </button>
              </div>

              {/* Formulaire */}
              <form onSubmit={submit} className="space-y-6 p-4">
                {/* Section Patient */}
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-slate-700">
                    {t("new_appointment.patient_info")}
                  </h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium">
                        {t("new_appointment.first_name")} *
                      </label>
                      <input
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={form.firstName}
                        onChange={(e) => onChange("firstName", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">
                        {t("new_appointment.last_name")} *
                      </label>
                      <input
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={form.lastName}
                        onChange={(e) => onChange("lastName", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">
                        {t("new_appointment.phone")}
                      </label>
                      <input
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={form.phone}
                        onChange={(e) => onChange("phone", e.target.value)}
                        placeholder="06.."
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">
                        Email
                      </label>
                      <input
                        type="email"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={form.email}
                        onChange={(e) => onChange("email", e.target.value)}
                        placeholder="exemple@domaine.com"
                      />
                    </div>
                  </div>
                </section>

                {/* Section RDV */}
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-slate-700">
                    {t("new_appointment.details")}
                  </h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium">
                        {t("new_appointment.date")} *
                      </label>
                      <input
                        type="date"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={form.date}
                        onChange={(e) => onChange("date", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">
                        {t("new_appointment.time")} *
                      </label>
                      <input
                        type="time"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={form.time}
                        onChange={(e) => onChange("time", e.target.value)}
                        required
                      />
                    </div>

                    {/* Sélection du médecin */}
                    <div>
                      <label className="mb-1 block text-xs font-medium">
                        {t("new_appointment.doctor")} *
                      </label>
                      <select
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={form.physician}
                        onChange={(e) => onChange("physician", e.target.value)}
                        required
                      >
                        <option value="">{t("new_appointment.select_doctor")}</option>
                        {doctors.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Sélection de la salle */}
                    <div>
                      <label className="mb-1 block text-xs font-medium">
                        {t("new_appointment.room")} *
                      </label>
                      <select
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={form.room}
                        onChange={(e) => onChange("room", e.target.value)}
                        required
                      >
                        <option value="">{t("new_appointment.select_room")}</option>
                        {rooms.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Type de RDV */}
                    <div>
                      <label className="mb-1 block text-xs font-medium">
                        {t("new_appointment.type")} *
                      </label>
                      <select
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={form.type}
                        onChange={(e) => onChange("type", e.target.value)}
                        required
                      >
                        <option value="">{t("new_appointment.select_type")}</option>
                        {types.map((t_) => (
                          <option key={t_} value={t_}>
                            {t_}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Statut */}
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-medium">
                        {t("new_appointment.status")}
                      </label>
                      <select
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={form.status}
                        onChange={(e) =>
                          onChange("status", e.target.value as AppointmentStatus)
                        }
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {s === "to_call"
                              ? t("new_appointment.to_call")
                              : t(`new_appointment.${s}`)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Motif */}
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-medium">
                        {t("new_appointment.reason")} *
                      </label>
                      <textarea
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        rows={2}
                        placeholder={t("new_appointment.reason_placeholder") || ""}
                        value={form.reason}
                        onChange={(e) => onChange("reason", e.target.value)}
                        required
                      />
                    </div>

                    {/* Notes */}
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-medium">
                        {t("new_appointment.notes")}
                      </label>
                      <textarea
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        rows={2}
                        placeholder={t("new_appointment.notes_placeholder") || ""}
                        value={form.notes}
                        onChange={(e) => onChange("notes", e.target.value)}
                      />
                    </div>
                  </div>
                </section>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
                    onClick={() => setOpen(false)}
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
                  >
                    {t("common.create")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  );
}
