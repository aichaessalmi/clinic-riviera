import type { ApiAppointment, ApiStatus, CreateAppointmentPayload } from "../../api/appointments";

export type UIStatus = ApiStatus;

export type UIAppointment = {
  id: string;
  patientName: string;
  date: Date;
  time: string; // "HH:MM"
  duration: number; // minutes
  status: UIStatus;

  // IDs & affichage
  room: string;
  roomName?: string;
  type: string;
  physician: string;
  physicianId?: string;

  // Champs supplémentaires
  phone?: string;
  email?: string;
  reason?: string;
  notes?: string;
  referral?: string | null;
};

/* =======================
   API → UI
   ======================= */
export function fromApi(a: ApiAppointment): UIAppointment {
  const rawTime = a.time || "";
  const hhmm = rawTime.length >= 5 ? rawTime.slice(0, 5) : "00:00";

  const typeDisplay =
    (a as any).type_name ??
    ((typeof (a as any).type === "object" && (a as any).type?.name)
      ? (a as any).type.name
      : (a as any).type) ??
    "";

  const roomObj = typeof (a as any).room === "object" ? (a as any).room : null;
const roomId =
  (a as any).room_id ??
  (a as any).roomId ??
  (roomObj ? roomObj.id : (a as any).room) ??
  null;

// ✅ Récupération plus complète (selon la langue courante)
const roomName =
  (a as any).room_label ??               // si ton backend renvoie une clé explicite traduite
  (a as any).room_translated ??          // autre convention possible
  (a as any).room_name ??                // nom brut
  (roomObj ? roomObj.name : "") ??       // fallback objet complet
  (roomId != null ? String(roomId) : ""); // dernier recours : ID


  const docFirst = (a as any).doctor_first_name ?? "";
  const docLast = (a as any).doctor_last_name ?? "";
  const combined = `${docFirst} ${docLast}`.trim();

  const physicianDisplay =
    (a as any).physician ??
    (a as any).doctor_full_name ??
    (combined !== "" ? combined : undefined) ??
    (a as any).doctor_name ??
    "";

  const physicianId =
    (a as any).doctor_id ??
    (a as any).doctorId ??
    (typeof (a as any).doctor === "number" || typeof (a as any).doctor === "string"
      ? (a as any).doctor
      : undefined);

  return {
    id: String(a.id),
    patientName: (a as any).patient_name ?? (a as any).patient ?? "",
    date: new Date(((a as any).date || "").toString() + "T00:00:00"),
    time: hhmm,
    duration: Number((a as any).duration_minutes ?? (a as any).duration ?? 30),
    status: a.status as UIStatus,

    room: roomId != null ? String(roomId) : "",
    roomName: roomName || undefined,

    type: String(typeDisplay || ""),
    physician: String(physicianDisplay || ""),
    physicianId: physicianId != null ? String(physicianId) : undefined,

    phone: (a as any).phone || "",
    email: (a as any).email || "",
    reason: (a as any).reason || (a as any).notes || "",
    notes: (a as any).notes || (a as any).reason || "",
    referral: (a as any).referral != null ? String((a as any).referral) : null,
  };
}

/* =======================
   UI → API
   ======================= */
export function toApi(
  draft: Partial<UIAppointment>,
  ctx: { doctorId?: number | null; typeId?: number | null; roomId?: number | null }
): CreateAppointmentPayload {
  const isoDate = (d?: Date) =>
    (d ? new Date(d) : new Date()).toISOString().slice(0, 10);

  const timeHHMM = (draft.time || "00:00").slice(0, 5);
  const time = `${timeHHMM}:00`;

  let room: number | null = ctx.roomId ?? null;
  if (room == null && draft.room) {
    const maybe = Number(draft.room);
    room = Number.isFinite(maybe) ? maybe : null;
  }

  // 🟡 Logs de débogage
  console.log("🟡 [toApi] draft reçu du formulaire :", draft);
  console.log("🟡 [toApi] contexte IDs :", ctx);

  const payload: CreateAppointmentPayload = {
    patient_name: draft.patientName || "",
    date: isoDate(draft.date),
    time,
    duration_minutes: draft.duration ?? 30,
    status: (draft.status as ApiStatus) || "pending",
    room,
    type: ctx.typeId ?? null,
    doctor: ctx.doctorId ?? null,
    phone: draft.phone || null,
    email: draft.email || null,  // ✅ correct ici
    notes: draft.reason || draft.notes || null, // ✅ motif inclus
    referral: draft.referral ? Number(draft.referral) : null,
  };

  // 🟢 Log final avant envoi
  console.log("🟢 [toApi] payload envoyé à createAppointment :", payload);

  return payload;
}
