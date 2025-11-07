// src/api/notifications.ts
import http from "./http"; // axios préconfiguré (baseURL '/api', JWT, etc.)

/* ===================== Types ===================== */
export type NotifStatus = "new" | "ack" | "read";
export type RoomStatus = "Disponible" | "Occupée" | "Nettoyage" | "Maintenance";

export type ArrivalNotifDto = {
  id: string;
  status: NotifStatus;
  patient: string;
  refBy: string;

  // <- IMPORTANT : on expose l'id de salle ET le label lisible
  roomId: string | null;   // vient de "room" (FK) côté API
  roomLabel: string;       // vient de "roomLabel" / "room_label" côté API

  speciality: string;
  apptAt: string;
  createdAt: string;
  message?: string | null;
  notes?: string | null;
};

export type RoomDto = {
  id: number | string;
  label: string;                     // mappé depuis name/label
  status: RoomStatus;                // on met "Disponible" par défaut ici
  patient?: string | null;           // null par défaut (occupation déduite côté front)
};

/* ===================== Helpers ===================== */
const asNotifStatus = (v: any): NotifStatus => {
  const s = String(v ?? "new").toLowerCase();
  return s === "ack" ? "ack" : s === "read" ? "read" : "new";
};

const mapArrivalNotif = (api: any): ArrivalNotifDto => {
  const roomId = api.room ?? api.room_id ?? null;
  const roomLabel =
    api.roomLabel ?? api.room_label ?? api.room_name ?? (roomId ? String(roomId) : "—");

  return {
    id: String(api.id),
    status: asNotifStatus(api.status),
    patient: api.patient ?? api.patient_name ?? "—",
    refBy: api.refBy ?? api.referrer ?? api.referrer_name ?? "—",
    roomId: roomId ? String(roomId) : null,
    roomLabel,
    speciality: api.speciality ?? api.specialty ?? "—",
    apptAt: api.apptAt ?? api.appt_at ?? api.appointment_at ?? new Date().toISOString(),
    createdAt: api.createdAt ?? api.created_at ?? new Date().toISOString(),
    message: api.message ?? null,
    notes: api.notes ?? null,
  };
};

const mapRoom = (api: any): RoomDto => ({
  id: String(api.id ?? api.code ?? api.slug ?? api.name ?? api.label),
  label: api.name ?? api.label ?? `Salle ${api.id}`,
  status: "Disponible",
  patient: null,
});

/* ===================== API calls ===================== */
export async function fetchRooms(): Promise<RoomDto[]> {
  // ⚠️ rooms sont maintenant dans l’app appointments
  const { data } = await http.get("/appointments/rooms/");
  const list = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
  return list.map(mapRoom);
}

export async function fetchArrivalNotifs(): Promise<ArrivalNotifDto[]> {
  const { data } = await http.get("/arrival-notifs/?ordering=-created_at");
  const list = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
  return list.map(mapArrivalNotif);
}

export async function ackArrivalNotif(id: string | number): Promise<ArrivalNotifDto> {
  const { data } = await http.patch(`/arrival-notifs/${id}/ack/`);
  return mapArrivalNotif(data);
}

export async function readArrivalNotif(id: string | number): Promise<ArrivalNotifDto> {
  const { data } = await http.patch(`/arrival-notifs/${id}/read/`);
  return mapArrivalNotif(data);
}

export async function markAllArrivalNotifsRead(): Promise<{ updated: number }> {
  // côté backend: @action(detail=False, methods=['post'])
  const { data } = await http.post(`/arrival-notifs/mark_all_read/`);
  return data as { updated: number };
}
