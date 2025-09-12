import React, { useEffect, useMemo, useState } from "react";
import NewAppointmentButton, { type NewAppointment } from "../../components/NewAppointmentButton";




/* =========================
   Types
   ========================= */
type AppointmentStatus = "confirmed" | "pending" | "to_call" | "cancelled" | "completed";

type Appointment = {
  id: string | number;
  date: Date;
  time: string;        // "HH:MM"
  duration: number;    // minutes
  room: string;        // "room-1"... (ou "general" pour semaine/mois)
  status: AppointmentStatus;
  type: string;
  patientName: string;
  physician: string;
  insurance?: string;
  phone?: string;
  notes?: string;
};

type Filters = {
  rooms: string[];
  physicians: string[];
  statuses: AppointmentStatus[];
  types: string[];
};

type View = "day" | "week" | "month";

/* =========================
   Hooks utilitaires
   ========================= */
function useIsMobile(breakpointPx = 1024) {
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth < breakpointPx : false
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${breakpointPx}px)`);
    const on = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile("matches" in e ? e.matches : (e as MediaQueryList).matches);
    on(mq);
    mq.addEventListener ? mq.addEventListener("change", on) : mq.addListener(on as any);
    return () => {
      mq.removeEventListener ? mq.removeEventListener("change", on) : mq.removeListener(on as any);
    };
  }, [breakpointPx]);
  return isMobile;
}
function useVisibleDays() {
  const [n, setN] = useState(7);
  useEffect(() => {
    const pick = () => {
      const w = window.innerWidth;
      setN(w < 480 ? 1 : w < 768 ? 3 : 7);
    };
    pick();
    window.addEventListener("resize", pick);
    return () => window.removeEventListener("resize", pick);
  }, []);
  return n;
}

/* =========================
   Icon + Button
   ========================= */
type IconName =
  | "CheckCircle" | "Clock" | "XCircle" | "Circle" | "X" | "MapPin"
  | "User" | "Phone" | "CreditCard" | "FileText" | "ChevronLeft"
  | "ChevronRight" | "Trash2" | "Edit" | "Menu";

function Icon({
  name,
  size = 16,
  className = "",
}: { name: IconName; size?: number; className?: string }) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  } satisfies React.SVGProps<SVGSVGElement>;

  switch (name) {
    case "CheckCircle": return <svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>;
    case "Clock": return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
    case "XCircle": return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>;
    case "Circle": return <svg {...p}><circle cx="12" cy="12" r="10"/></svg>;
    case "X": return <svg {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>;
    case "MapPin": return <svg {...p}><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
    case "User": return <svg {...p}><path d="M20 21a8 8 0 1 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>;
    case "Phone": return <svg {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.81.3 1.61.54 2.38a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.7-1.7a2 2 0 0 1 2.11-.45c.77.24 1.57.42 2.38.54A2 2 0 0 1 22 16.92z"/></svg>;
    case "CreditCard": return <svg {...p}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>;
    case "FileText": return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/></svg>;
    case "ChevronLeft": return <svg {...p}><path d="m15 18-6-6 6-6"/></svg>;
    case "ChevronRight": return <svg {...p}><path d="m9 18 6-6-6-6"/></svg>;
    case "Trash2": return <svg {...p}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
    case "Edit": return <svg {...p}><path d="M11 4h9a2 2 0 0 1 2 2v9"/><path d="M18.5 2.5 21.5 5.5"/><path d="M16 5 5 16l-3 7 7-3L20 9"/></svg>;
    case "Menu": return <svg {...p}><path d="M3 6h18M3 12h18M3 18h18"/></svg>;
    default: return null;
  }
}

type BtnProps = {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "icon";
  iconName?: IconName;
  iconPosition?: "left" | "right";
  iconSize?: number;
};
function Button({
  children,
  onClick,
  className = "",
  variant = "default",
  size = "md",
  iconName,
  iconPosition = "left",
  iconSize = 16,
}: BtnProps) {
  const base =
    "inline-flex items-center justify-center rounded-md transition-colors";
  const variants = {
    default: "bg-slate-900 text-white hover:bg-slate-800",
    outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    ghost: "text-slate-700 hover:bg-slate-100",
  } as const;
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-3.5 py-2 text-sm",
    icon: "h-9 w-9",
  } as const;

  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {iconName && size !== "icon" && iconPosition === "left" && (
        <Icon name={iconName} size={iconSize} className="mr-2" />
      )}
      {size === "icon" ? <Icon name={iconName || "Circle"} size={iconSize} /> : children}
      {iconName && size !== "icon" && iconPosition === "right" && (
        <Icon name={iconName} size={iconSize} className="ml-2" />
      )}
    </button>
  );
}

/* =========================
   Popover RDV
   ========================= */
function AppointmentPopover({
  appointment,
  position,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  appointment: Appointment | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onEdit: (apt: Appointment) => void;
  onDelete: (id: Appointment["id"]) => void;
  onStatusChange: (id: Appointment["id"], s: AppointmentStatus) => void;
}) {
  if (!appointment || !position) return null;

  const statusColor =
    appointment.status === "confirmed"
      ? "text-green-600"
      : appointment.status === "pending"
      ? "text-amber-600"
      : appointment.status === "to_call"
      ? "text-orange-600"
      : appointment.status === "cancelled"
      ? "text-red-600"
      : "text-slate-500";

  const icon: IconName =
    appointment.status === "confirmed"
      ? "CheckCircle"
      : appointment.status === "pending"
      ? "Clock"
      : appointment.status === "to_call"
      ? "Clock"
      : appointment.status === "cancelled"
      ? "XCircle"
      : "Circle";

  const change = (s: AppointmentStatus) => {
    onStatusChange(appointment.id, s);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 w-80 rounded-lg border border-slate-200 bg-white shadow-lg"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: "translate(-50%, -100%)",
          marginTop: "-8px",
        }}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <Icon name={icon} size={16} className={statusColor} />
            <span className={`text-sm font-medium capitalize ${statusColor}`}>
              {appointment.status === "to_call" ? "to call" : appointment.status}
            </span>
          </div>
          <Button variant="ghost" size="icon" iconName="X" onClick={onClose} />
        </div>

        <div className="space-y-3 p-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{appointment.patientName}</h3>
            <p className="text-sm text-slate-500">{appointment.type}</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Icon name="Clock" size={14} className="text-slate-500" />
              <span>
                {appointment.time} ({appointment.duration} min)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="MapPin" size={14} className="text-slate-500" />
              <span>{appointment.room.replace("-", " ")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="User" size={14} className="text-slate-500" />
              <span>{appointment.physician}</span>
            </div>
            {appointment.phone && (
              <div className="flex items-center gap-2">
                <Icon name="Phone" size={14} className="text-slate-500" />
                <span>{appointment.phone}</span>
              </div>
            )}
            {appointment.insurance && (
              <div className="flex items-center gap-2">
                <Icon name="CreditCard" size={14} className="text-slate-500" />
                <span>{appointment.insurance}</span>
              </div>
            )}
          </div>

        </div>

        <div className="space-y-2 border-t border-slate-200 p-4">
          {appointment.status !== "confirmed" && (
            <Button
              variant="outline"
              size="sm"
              iconName="CheckCircle"
              className="w-full justify-start text-green-600 hover:text-green-700"
              onClick={() => change("confirmed")}
            >
              Confirm Appointment
            </Button>
          )}
          {appointment.status !== "pending" && (
            <Button
              variant="outline"
              size="sm"
              iconName="Clock"
              className="w-full justify-start text-amber-600 hover:text-amber-700"
              onClick={() => change("pending")}
            >
              Mark as Pending
            </Button>
          )}
          {appointment.status !== "to_call" && (
            <Button
              variant="outline"
              size="sm"
              iconName="Clock"
              className="w-full justify-start text-orange-600 hover:text-orange-700"
              onClick={() => change("to_call")}
            >
              À rappeler
            </Button>
          )}
          {appointment.status !== "cancelled" && (
            <Button
              variant="outline"
              size="sm"
              iconName="XCircle"
              className="w-full justify-start text-red-600 hover:text-red-700"
              onClick={() => change("cancelled")}
            >
              Cancel Appointment
            </Button>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              iconName="Edit"
              className="flex-1"
              onClick={() => {
                onEdit(appointment);
                onClose();
              }}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconName="Trash2"
              className="flex-1 text-red-600 hover:text-red-700"
              onClick={() => {
                if (window.confirm("Delete this appointment?")) onDelete(appointment.id);
                onClose();
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

/* =========================
   Sidebar (mini calendrier + filtres)
   ========================= */
function CalendarSidebar({
  currentDate,
  onDateSelect,
  filters,
  onFiltersChange,
  isOpen,
  onToggle,
}: {
  currentDate: Date;
  onDateSelect: (d: Date) => void;
  filters: Filters;
  onFiltersChange: (f: Filters) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const rooms = [
    { id: "room-1", name: "Room 1", color: "bg-green-500" },
    { id: "room-2", name: "Room 2", color: "bg-red-500" },
    { id: "room-3", name: "Room 3", color: "bg-green-500" },
    { id: "room-4", name: "Room 4", color: "bg-amber-500" },
    { id: "room-5", name: "Room 5", color: "bg-green-500" },
  ];
  const physicians = [
    { id: "Dr. Smith", name: "Dr. Smith", color: "bg-blue-500" },
    { id: "Dr. Johnson", name: "Dr. Johnson", color: "bg-purple-500" },
    { id: "Dr. Williams", name: "Dr. Williams", color: "bg-emerald-500" },
  ];
  const monthNames = [
    "January","February","March","April","May","June","July","August","September","October","November","December",
  ];

  const generateDays = () => {
    const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const start = new Date(first);
    start.setDate(start.getDate() - first.getDay());
    const out: Date[] = [];
    const cur = new Date(start);
    for (let i = 0; i < 42; i++) {
      out.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  };
  const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
  const isSameMonth = (d: Date) => d.getMonth() === currentDate.getMonth();
  const calendarDays = generateDays();

  const toggle = <T,>(arr: T[], val: T) =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onToggle} />}
      <div
        className={`fixed left-0 top-0 z-30 h-full w-80 transform border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } overflow-y-auto`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4 lg:hidden">
          <h3 className="font-semibold">Calendar Options</h3>
          <Button variant="ghost" size="icon" iconName="X" onClick={onToggle} />
        </div>

        <div className="space-y-6 p-4">
          {/* Mini calendrier */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  iconName="ChevronLeft"
                  onClick={() => {
                    const d = new Date(currentDate);
                    d.setMonth(d.getMonth() - 1);
                    onDateSelect(d);
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  iconName="ChevronRight"
                  onClick={() => {
                    const d = new Date(currentDate);
                    d.setMonth(d.getMonth() + 1);
                    onDateSelect(d);
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-xs">
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                <div key={d} className="p-1 text-center font-medium text-slate-500">
                  {d}
                </div>
              ))}
              {calendarDays.map((d, i) => (
                <button
                  key={i}
                  onClick={() => onDateSelect(new Date(d))}
                  className={[
                    "rounded p-1 text-xs hover:bg-slate-100",
                    isSameMonth(d) ? "text-slate-900" : "text-slate-400",
                    isToday(d) ? "bg-blue-600 text-white" : "",
                  ].join(" ")}
                >
                  {d.getDate()}
                </button>
              ))}
            </div>
          </div>

          {/* Filtres médecins */}
          <div>
            <h3 className="mb-2 font-medium">Physicians</h3>
            <div className="space-y-2">
              {physicians.map((p) => (
                <label key={p.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.physicians.includes(p.id)}
                    onChange={() => onFiltersChange({ ...filters, physicians: toggle(filters.physicians, p.id) })}
                  />
                  <span className="inline-flex items-center gap-2 text-sm">
                    <span className={`h-3 w-3 rounded-full ${p.color}`} />
                    {p.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Filtres salles */}
          <div>
            <h3 className="mb-2 font-medium">Rooms</h3>
            <div className="space-y-2">
              {rooms.map((r) => (
                <label key={r.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.rooms.includes(r.id)}
                    onChange={() => onFiltersChange({ ...filters, rooms: toggle(filters.rooms, r.id) })}
                  />
                  <span className="inline-flex items-center gap-2 text-sm">
                    <span className={`h-3 w-3 rounded-full ${r.color}`} />
                    {r.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Filtres types */}
          <div>
            <h3 className="mb-2 font-medium">Types</h3>
            <div className="space-y-2">
              {["Consultation","Contrôle","Urgence","Chirurgie"].map((t) => (
                <label key={t} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.types.includes(t)}
                    onChange={() => onFiltersChange({ ...filters, types: toggle(filters.types, t) })}
                  />
                  <span className="text-sm">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Filtres statuts */}
          <div>
            <h3 className="mb-2 font-medium">Status</h3>
            <div className="space-y-2">
              {(["confirmed","pending","to_call","cancelled"] as AppointmentStatus[]).map((s) => (
                <label key={s} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.statuses.includes(s)}
                    onChange={() => onFiltersChange({ ...filters, statuses: toggle(filters.statuses, s) })}
                  />
                  <span className="text-sm capitalize">
                    {s === "to_call" ? "to call" : s}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onFiltersChange({ rooms: [], physicians: [], statuses: [], types: [] })}
            >
              Réinitialiser
            </Button>
            <Button className="flex-1" onClick={() => window.print()}>
              Exporter
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

/* =========================
   Grille calendrier (Day / Week / Month)
   ========================= */
const timeSlots = [
  "08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30",
  "16:00","16:30","17:00","17:30","18:00",
];
const roomsList = [
  { id: "room-1", name: "Room 1" },
  { id: "room-2", name: "Room 2" },
  { id: "room-3", name: "Room 3" },
  { id: "room-4", name: "Room 4" },
  { id: "room-5", name: "Room 5" },
];
const statusClass = (s?: string) =>
  s === "confirmed"
    ? "bg-green-100 border-green-500 text-green-800"
    : s === "pending"
    ? "bg-amber-100 border-amber-500 text-amber-800"
    : s === "to_call"
    ? "bg-orange-100 border-orange-500 text-orange-800"
    : s === "cancelled"
    ? "bg-red-100 border-red-500 text-red-800"
    : "bg-slate-100 border-slate-300 text-slate-700";

function CalendarGrid({
  currentView,
  currentDate,
  appointments,
  onAppointmentClick,
  onSlotClick,
  onAppointmentDrop,
}: {
  currentView: View;
  currentDate: Date;
  appointments: Appointment[];
  onAppointmentClick: (apt: Appointment, pos: { x: number; y: number }) => void;
  onSlotClick: (roomId: string, time: string | null, day?: Date) => void;
  onAppointmentDrop: (apt: Appointment, roomId: string, time: string, day?: Date) => void;
}) {
  const [dragged, setDragged] = useState<Appointment | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const isMobile = useIsMobile(1024);
  const visibleCount = useVisibleDays();

  // ----- DAY VIEW -----
  const dayView = () => {
    const items = appointments.filter((a) => a.date.toDateString() === currentDate.toDateString());
    const MobileChip: React.FC<{ apt: Appointment; onClick: (e: React.MouseEvent) => void }> = ({ apt, onClick }) => (
      <button
        onClick={onClick}
        className={[
          "w-full rounded border px-2 py-1 text-[11px] text-left",
          "hover:brightness-95 transition",
          statusClass(apt.status),
        ].join(" ")}
      >
        <span className="font-medium">{apt.patientName}</span>
        <span className="opacity-70"> · {apt.type}</span>
        <span className="ml-2 inline-block rounded border px-1 text-[10px] opacity-80">
          {roomsList.find((r) => r.id === apt.room)?.name ?? apt.room}
        </span>
      </button>
    );

    return (
      <div className="flex-1 overflow-auto">
        <div className="min-w-full lg:min-w-[900px]">
          <div className={`sticky top-0 z-10 border-b border-slate-200 bg-white ${isMobile ? "grid grid-cols-2" : "grid grid-cols-6"}`}>
            <div className="border-r border-slate-200 p-3 text-sm font-medium text-slate-500">Time</div>
            {isMobile ? (
              <div className="p-3 text-sm font-medium">Rendez-vous</div>
            ) : (
              roomsList.map((r) => (
                <div key={r.id} className="border-r border-slate-200 p-3 text-sm font-medium">
                  {r.name}
                </div>
              ))
            )}
          </div>

          <div>
            {timeSlots.map((slot) =>
              isMobile ? (
                <div key={slot} className="grid grid-cols-2 border-b border-slate-200">
                  <div className="border-r border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">{slot}</div>
                  <div className="p-2">
                    <div className="flex flex-col gap-1">
                      {items.filter((a) => a.time === slot).map((apt) => (
                        <MobileChip
                          key={apt.id}
                          apt={apt}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick(apt, { x: e.clientX, y: e.clientY });
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div key={slot} className="grid grid-cols-6 border-b border-slate-200">
                  <div className="border-r border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">{slot}</div>
                  {roomsList.map((r) => {
                    const key = `${r.id}-${slot}`;
                    const hoveredCls = hovered === key ? "bg-blue-50" : "";
                    const cellItems = items.filter((a) => a.room === r.id && a.time === slot);
                    return (
                      <div
                        key={r.id}
                        className={`relative h-16 cursor-pointer border-r border-slate-200 transition-colors hover:bg-slate-50 ${hoveredCls}`}
                        onClick={() => onSlotClick(r.id, slot)}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                        onDrop={(e) => { e.preventDefault(); if (dragged) { onAppointmentDrop(dragged, r.id, slot); setDragged(null); setHovered(null);} }}
                        onDragEnter={() => setHovered(key)}
                        onDragLeave={() => setHovered(null)}
                      >
                        {cellItems.map((apt) => (
                          <div
                            key={apt.id}
                            draggable
                            onDragStart={(e) => { setDragged(apt); e.dataTransfer.effectAllowed = "move"; }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onAppointmentClick(apt, { x: e.clientX, y: e.clientY });
                            }}
                            className={`absolute inset-x-1 top-1 z-10 cursor-move rounded border-l-4 p-2 text-xs shadow-sm ${statusClass(apt.status)}`}
                            style={{ height: `${(apt.duration / 30) * 60 - 8}px`, minHeight: "48px" }}
                          >
                            <div className="truncate font-medium">{apt.patientName}</div>
                            <div className="truncate opacity-80">{apt.type}</div>
                            <div className="opacity-70">{apt.duration}min</div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  };

  // ----- WEEK VIEW -----
  const weekView = () => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    start.setHours(0, 0, 0, 0);

    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }

    const idx = days.findIndex(d => d.toDateString() === currentDate.toDateString());
    const maxStart = Math.max(0, 7 - visibleCount);
    const startIdx = Math.min(Math.max(idx, 0), maxStart);
    const visibleDays = days.slice(startIdx, startIdx + visibleCount);
    const gridCols = `120px repeat(${visibleDays.length}, minmax(140px, 1fr))`;

    return (
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <div className="min-w-0" style={{ minWidth: 120 + visibleDays.length * 140 }}>
          <div
            className="sticky top-0 z-10 border-b border-slate-200 bg-white"
            style={{ display: "grid", gridTemplateColumns: gridCols }}
          >
            <div className="border-r border-slate-200 p-3 text-sm font-medium text-slate-500">Time</div>
            {visibleDays.map((d) => (
              <div
                key={d.toISOString()}
                className="border-r border-slate-200 p-3 text-center text-sm font-medium last:border-r-0"
              >
                <div>{d.toLocaleDateString("fr-FR", { weekday: "short" })}</div>
                <div className="text-xs text-slate-500">{d.getDate()}</div>
              </div>
            ))}
          </div>

          <div className="relative">
            {timeSlots.map((slot) => (
              <div
                key={slot}
                className="border-b border-slate-200"
                style={{ display: "grid", gridTemplateColumns: gridCols }}
              >
                <div className="border-r border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">{slot}</div>
                {visibleDays.map((d) => {
                  const items = appointments.filter(
                    (a) => a.date.toDateString() === d.toDateString() && a.time === slot
                  );
                  return (
                    <div
                      key={d.toISOString()}
                      className="h-16 cursor-pointer border-r border-slate-200 transition-colors hover:bg-slate-50 last:border-r-0"
                      onClick={() => onSlotClick("general", slot, d)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const dragged = (e as any)._draggedAppointment as Appointment | undefined;
                        if (dragged) onAppointmentDrop(dragged, "general", slot, d);
                      }}
                    >
                      {items.map((apt) => (
                        <div
                          key={apt.id}
                          draggable
                          onDragStart={(e) => {
                            (e as any)._draggedAppointment = apt;
                            e.dataTransfer.effectAllowed = "move";
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAppointmentClick(apt, { x: e.clientX, y: e.clientY });
                          }}
                          className={`mx-1 mt-1 rounded border-l-4 p-2 text-xs ${statusClass(apt.status)}`}
                        >
                          <div className="truncate font-medium">{apt.patientName}</div>
                          <div className="truncate opacity-80">{apt.type}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ----- MONTH VIEW -----
  const monthView = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const start = new Date(monthStart);
    start.setDate(start.getDate() - monthStart.getDay());
    const cells: Date[] = [];
    const cur = new Date(start);
    for (let i = 0; i < 42; i++) {
      cells.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
    const isCurMonth = (d: Date) => d.getMonth() === currentDate.getMonth();

    return (
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7 border border-slate-200">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="bg-slate-50 p-3 text-center text-sm font-medium">
              {d}
            </div>
          ))}
          {cells.map((d, i) => {
            const items = appointments.filter((a) => a.date.toDateString() === d.toDateString());
            return (
              <div
                key={i}
                className={`min-h-[120px] cursor-pointer border-b border-r border-slate-200 p-2 transition-colors hover:bg-slate-50 ${
                  !isCurMonth(d) ? "bg-slate-50/50 text-slate-400" : ""
                } ${isToday(d) ? "bg-blue-50" : ""}`}
                onClick={() => onSlotClick("day-view", null, d)}
              >
                <div
                  className={`mb-1 text-sm font-medium ${
                    isToday(d) ? "text-blue-600" : isCurMonth(d) ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {d.getDate()}
                </div>
                <div className="space-y-1">
                  {items.slice(0, 3).map((apt) => (
                    <div key={apt.id} className={`truncate rounded p-1 text-xs ${statusClass(apt.status)}`}>
                      {apt.patientName}
                    </div>
                  ))}
                  {items.length > 3 && <div className="text-xs text-slate-500">+{items.length - 3} more</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col bg-white">
      {/* Mobile: toujours MOIS ; Desktop: toutes les vues */}
      {!isMobile && currentView === "day" && dayView()}
      {!isMobile && currentView === "week" && weekView()}
      {(isMobile || currentView === "month") && monthView()}
    </div>
  );
}

/* =========================
   Helpers
   ========================= */
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/* =========================
   Page principale
   ========================= */
export default function CalendarPage() {
  const isMobile = useIsMobile(1024);

  // Mobile => "month", Desktop => "week"
  const [currentView, setCurrentView] = useState<View>(isMobile ? "month" : "week");
  useEffect(() => {
    setCurrentView(isMobile ? "month" : "week");
  }, [isMobile]);

  const [currentDate, setCurrentDate] = useState<Date>(startOfToday());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const base = startOfToday();
    return [
      {
        id: 1,
        date: new Date(base),
        time: "09:00",
        duration: 40,
        room: "room-1",
        status: "confirmed",
        type: "Consultation",
        patientName: "Marie Dubois",
        physician: "Dr. Smith",
        insurance: "CNOPS",
        phone: "0612 345 678",
      },
      {
        id: 2,
        date: new Date(base),
        time: "10:30",
        duration: 40,
        room: "room-2",
        status: "pending",
        type: "Contrôle",
        patientName: "Jean Dupont",
        physician: "Dr. Johnson",
      },
      {
        id: 3,
        date: new Date(base),
        time: "12:00",
        duration: 30,
        room: "room-1",
        status: "to_call",
        type: "Urgence",
        patientName: "SOS",
        physician: "Dr. Williams",
      },
    ];
  });

  const [filters, setFilters] = useState<Filters>({
    rooms: [],
    physicians: [],
    statuses: [],
    types: [],
  });

  const [popover, setPopover] = useState<{
    apt: Appointment | null;
    pos: { x: number; y: number } | null;
  }>({ apt: null, pos: null });

  const visibleAppointments = useMemo(() => {
    return appointments.filter((a) => {
      if (filters.rooms.length && !filters.rooms.includes(a.room)) return false;
      if (filters.physicians.length && !filters.physicians.includes(a.physician)) return false;
      if (filters.statuses.length && !filters.statuses.includes(a.status)) return false;
      if (filters.types.length && !filters.types.includes(a.type)) return false;
      return true;
    });
  }, [appointments, filters]);

  const goto = (d: number) => {
    const n = new Date(currentDate);
    n.setDate(n.getDate() + d);
    setCurrentDate(n);
  };

  const onAppointmentClick = (apt: Appointment, pos: { x: number; y: number }) =>
    setPopover({ apt, pos });
  const onStatusChange = (id: Appointment["id"], s: AppointmentStatus) =>
    setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: s } : a)));
  const onDelete = (id: Appointment["id"]) =>
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  const onEdit = (apt: Appointment) => alert(`Edit ${apt.patientName}`);

  const onSlotClick = (roomId: string, time: string | null, day?: Date) => {
    console.log("slot", { roomId, time, day });
  };
  const onAppointmentDrop = (apt: Appointment, roomId: string, time: string, day?: Date) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === apt.id ? { ...a, room: roomId, time, date: day ? new Date(day) : a.date } : a
      )
    );
  };

  // listes pour le bouton réutilisable
  const doctors = ["Dr. Smith", "Dr. Johnson", "Dr. Williams"];
  const types = ["Consultation", "Contrôle", "Urgence", "Chirurgie"];

  return (
    <div className="mx-auto max-w-screen-2xl px-4 py-4">
      {/* Toolbar */}
      <div className="mb-4 flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          iconName="Menu"
          className="lg:hidden"
          onClick={() => setSidebarOpen((v) => !v)}
        />
        <Button variant="ghost" size="icon" iconName="ChevronLeft" onClick={() => goto(-1)} />
        <Button variant="ghost" onClick={() => setCurrentDate(startOfToday())}>
          Aujourd’hui
        </Button>
        <Button variant="ghost" size="icon" iconName="ChevronRight" onClick={() => goto(1)} />
        <div className="ml-1 text-lg font-semibold">
          {currentDate.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Bouton RDV (fab sur mobile) */}
          <NewAppointmentButton
            label="Nouveau RDV"
            variant={isMobile ? "fab" : "primary"}
            doctors={doctors}
            types={types}
            defaultDate={currentDate}
            defaultTime="07:00"
            onCreate={(data: NewAppointment) => {
              setAppointments((prev: Appointment[]) => [
                ...prev,
                {
                  id: Date.now(),
                  date: new Date(data.date),
                  time: data.time,
                  duration: 40,
                  room: "room-1",
                  status: data.status,
                  type: data.type,
                  patientName: `${data.firstName} ${data.lastName}`,
                  physician: data.physician,
                  phone: data.phone,
                  notes: data.reason,
                },
              ]);
            }}
          />

          {/* Sélecteur de vue – boutons Jour/Semaine cachés sur mobile */}
          <div className="rounded-md border border-slate-200 p-1">
            <Button
              variant={currentView === "month" ? "default" : "ghost"}
              className="px-3 py-1.5 text-sm"
              onClick={() => setCurrentView("month")}
            >
              Mois
            </Button>
            <Button
              variant={currentView === "week" ? "default" : "ghost"}
              className="hidden px-3 py-1.5 text-sm lg:inline-flex"
              onClick={() => setCurrentView("week")}
            >
              Semaine
            </Button>
            <Button
              variant={currentView === "day" ? "default" : "ghost"}
              className="hidden px-3 py-1.5 text-sm lg:inline-flex"
              onClick={() => setCurrentView("day")}
            >
              Jour
            </Button>
          </div>
        </div>
      </div>

      {/* Layout 2 colonnes */}
      <div className="grid items-start gap-5 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <CalendarSidebar
            currentDate={currentDate}
            onDateSelect={setCurrentDate}
            filters={filters}
            onFiltersChange={setFilters}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen((v) => !v)}
          />
        </div>

        <div className="min-w-0 lg:col-span-9">
          <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
            <CalendarGrid
              currentView={currentView}
              currentDate={currentDate}
              appointments={visibleAppointments}
              onAppointmentClick={onAppointmentClick}
              onSlotClick={onSlotClick}
              onAppointmentDrop={onAppointmentDrop}
            />
          </div>
        </div>
      </div>

      <AppointmentPopover
        appointment={popover.apt}
        position={popover.pos}
        onClose={() => setPopover({ apt: null, pos: null })}
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}
