import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useEffect, useState } from "react";
import http from "../../api/http";

type Event = { id:number; title:string; start:string; end?:string; };

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const load = async () => {
    const { data } = await http.get("/appointments/calendar/");
    setEvents(data);
  };
  useEffect(() => { load(); }, []);
  return (
    <div style={{ background:"#fff", padding:16 }}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin]}
        initialView="dayGridMonth"
        events={events as any}
        height="80vh"
      />
    </div>
  );
}
