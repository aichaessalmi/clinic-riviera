import React, { useEffect, useMemo, useState, useId } from "react";

/** Types simples, tu peux aussi les importer de tes types globaux */
export type AppointmentStatus = "confirmed" | "pending" | "to_call" | "cancelled" | "completed";

export type NewAppointment = {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  date: string;      // "YYYY-MM-DD"
  time: string;      // "HH:MM"
  physician: string;
  type: string;
  status: AppointmentStatus;
  reason: string;
  notes?: string;
};

type Props = {
  /** Label du bouton (desktop) */
  label?: string;
  /** "primary" (plein), "outline" (contour) ou "fab" (bouton flottant rond) */
  variant?: "primary" | "outline" | "fab";
  /** Classes utilitaires additionnelles */
  className?: string;

  /** Valeurs pour les listes déroulantes */
  doctors: string[];
  types: string[];
  statuses?: AppointmentStatus[];

  /** Valeurs par défaut */
  defaultDate?: Date;
  defaultTime?: string; // "07:00" par ex.

  /** Callback à la création */
  onCreate: (data: NewAppointment) => void;
};

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

function formatDateYYYYMMDD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function NewAppointmentButton({
  label = "Nouveau RDV",
  variant = "primary",
  className = "",
  doctors,
  types,
  statuses = ["pending", "confirmed", "to_call", "cancelled", "completed"],
  defaultDate,
  defaultTime = "07:00",
  onCreate,
}: Props) {
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
    date: initialDate,
    time: defaultTime,
    physician: doctors[0] ?? "",
    type: types[0] ?? "",
    status: "pending",
    reason: "",
    notes: "",
  });

  // Lock scroll quand le modal est ouvert
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const onChange = (k: keyof NewAppointment, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // mini-validations
    if (!form.firstName.trim() || !form.lastName.trim()) return alert("Nom & Prénom requis.");
    if (!form.date || !form.time) return alert("Date & heure requises.");
    if (!form.physician || !form.type) return alert("Médecin & type de RDV requis.");
    if (!form.reason.trim()) return alert("Motif de la consultation requis.");

    onCreate(form);
    setOpen(false);
    // reset léger (garde date & heure)
    setForm((f) => ({ ...f, firstName: "", lastName: "", phone: "", email: "", reason: "", notes: "" }));
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
      {/* Bouton */}
      <button
        type="button"
        className={`${baseBtn} ${varCls} ${className}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
        aria-label={showLabel ? undefined : "Créer un rendez-vous"}
      >
        <PlusIcon />
        {showLabel && <span>{label}</span>}
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
                  <h2 id={titleId} className="text-lg font-semibold">Nouveau Rendez-vous</h2>
                  <div className="text-xs text-slate-500">
                    {new Date(form.date + "T" + form.time).toLocaleString("fr-FR")}
                  </div>
                </div>
                <button
                  type="button"
                  className="h-9 w-9 rounded-md text-slate-600 hover:bg-slate-100"
                  onClick={() => setOpen(false)}
                  aria-label="Fermer"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <form onSubmit={submit} className="space-y-6 p-4">
                {/* Patient */}
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-slate-700">
                    Informations Patient
                  </h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium">Prénom *</label>
                      <input
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={form.firstName}
                        onChange={(e) => onChange("firstName", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Nom *</label>
                      <input
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={form.lastName}
                        onChange={(e) => onChange("lastName", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Téléphone</label>
                      <input
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={form.phone}
                        onChange={(e) => onChange("phone", e.target.value)}
                        placeholder="06.."
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Email</label>
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

                {/* Détails RDV */}
                <section>
                  <h3 className="mb-3 text-sm font-semibold text-slate-700">
                    Détails du Rendez-vous
                  </h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium">Date *</label>
                      <input
                        type="date"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={form.date}
                        onChange={(e) => onChange("date", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium">Heure *</label>
                      <input
                        type="time"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={form.time}
                        onChange={(e) => onChange("time", e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium">Médecin *</label>
                      <select
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={form.physician}
                        onChange={(e) => onChange("physician", e.target.value)}
                        required
                      >
                        {doctors.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-medium">Type de RDV *</label>
                      <select
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={form.type}
                        onChange={(e) => onChange("type", e.target.value)}
                        required
                      >
                        {types.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-medium">Statut</label>
                      <select
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        value={form.status}
                        onChange={(e) => onChange("status", e.target.value as AppointmentStatus)}
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {s === "to_call" ? "to call" : s}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-medium">
                        Motif de la consultation *
                      </label>
                      <textarea
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        rows={2}
                        placeholder="Décrivez le motif…"
                        value={form.reason}
                        onChange={(e) => onChange("reason", e.target.value)}
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-medium">
                        Notes additionnelles
                      </label>
                      <textarea
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                        rows={2}
                        placeholder="Notes internes…"
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
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
                  >
                    Créer
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
