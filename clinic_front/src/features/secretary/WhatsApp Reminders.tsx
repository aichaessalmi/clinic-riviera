import { useEffect, useMemo, useState } from "react";

/* ---------- Types ---------- */
type Status = "Envoyé" | "En attente" | "Échec";
type Reminder = {
  id: number;
  patient: string;
  rendezvous: string; // ISO datetime
  whatsapp: string;
  statut: Status;
  lastMessage?: string;
};

/* ---------- Données mock ---------- */
const MOCK: Reminder[] = [
  { id: 1, patient: "Ahmed El Mansouri", rendezvous: "2025-09-25T10:00:00.000Z", whatsapp: "+212612345678", statut: "Envoyé", lastMessage: "Rappel : RDV demain 10:00" },
  { id: 2, patient: "Sara Benali", rendezvous: "2025-09-26T09:30:00.000Z", whatsapp: "+212655443322", statut: "En attente", lastMessage: "Rappel automatique programmé" },
  { id: 3, patient: "Youssef Amrani", rendezvous: "2025-09-27T14:00:00.000Z", whatsapp: "+212677889900", statut: "Échec", lastMessage: "Envoi échoué (numéro non joignable)" },
];

/* ---------- Helpers ---------- */
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

const isValidPhone = (value: string) => /^\+\d{7,15}$/.test(value.replace(/[\s-]/g, ""));

function generateReminder(patient: string, rendezvous: string) {
  const dateStr = fmtDateTime(rendezvous);
  return `Bonjour ${patient}, 👋\n\nCeci est un rappel automatique pour votre rendez-vous prévu le ${dateStr}.\n\nMerci de confirmer votre présence.\nClinique Riviera ✅`;
}

/* ---------- Component ---------- */
export default function WhatsAppSenderAdvanced() {
  const [reminders, setReminders] = useState<Reminder[]>(MOCK);
  const [autoEnabled, setAutoEnabled] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = useMemo(() => reminders.find(r => r.id === selectedId) ?? null, [reminders, selectedId]);

  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!selected) {
      setTo("");
      setMessage("");
      return;
    }
    setTo(selected.whatsapp);
    setMessage(generateReminder(selected.patient, selected.rendezvous));
  }, [selected]);

  useEffect(() => {
    if (!autoEnabled) return;
    const updated = reminders.map(r =>
      r.statut === "En attente"
        ? { ...r, lastMessage: generateReminder(r.patient, r.rendezvous) }
        : r
    );
    setReminders(updated);
  }, [autoEnabled, reminders.length]);

  async function sendToApi(payload: { to: string; body: string }) {
    const url = "http://localhost:8000/api/whatsapp/send/";
    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await resp.json();
  }

  const handleSend = async () => {
    if (!isValidPhone(to)) {
      alert("Numéro invalide (format +2126...)");
      return;
    }
    if (!message.trim()) {
      alert("Message vide.");
      return;
    }

    setSending(true);
    try {
      const data = await sendToApi({ to, body: message });
      const ok = !!data.sid;

      if (selected) {
        setReminders(prev =>
          prev.map(r =>
            r.id === selected.id ? { ...r, statut: ok ? "Envoyé" : "Échec", lastMessage: message } : r
          )
        );
      }
      alert(ok ? "✅ Message envoyé" : "❌ Erreur d'envoi");
    } catch (err) {
      console.error(err);
      alert("Erreur de communication avec le serveur.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <span className="bg-green-500 text-white p-1.5 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="h-5 w-5">
              <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.47 1.34 5.01L2 22l5.2-1.37a9.93 9.93 0 004.84 1.23h.01c5.5 0 9.96-4.46 9.96-9.96A9.95 9.95 0 0012.04 2zm5.8 14.35c-.25.7-1.45 1.33-2.01 1.38-.52.05-1.16.07-1.87-.12a8.1 8.1 0 01-2.64-1.15c-.46-.27-1.06-.89-1.21-1.24-.15-.36-.35-.89-.02-1.39.34-.52.77-.58 1.02-.58.25 0 .5.01.72.01.23 0 .54-.09.84.64.3.74.94 1.78 1.03 1.9.09.13.17.27.32.43.15.16.18.12.33.04.14-.08.86-.42 1.01-.49.15-.08.25-.12.39.07.13.18.52.63.65.76.13.13.18.2.25.32.07.11.04.21 0 .31z"/>
            </svg>
          </span>
          Relances WhatsApp
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoEnabled(a => !a)}
            className={`relative inline-flex h-7 w-14 items-center rounded-full ${autoEnabled ? "bg-green-500" : "bg-gray-300"}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${autoEnabled ? "translate-x-7" : "translate-x-1"}`} />
          </button>
          <span className={`text-sm ${autoEnabled ? "text-emerald-700" : "text-slate-500"}`}>
            {autoEnabled ? "Auto : ON" : "Auto : OFF"}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composer */}
        <section className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Composer</h2>

            <label className="text-sm text-slate-500 mb-1 block">Numéro WhatsApp</label>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="+2126..."
              className="w-full rounded-lg border px-4 py-3 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-green-400"
            />

            <label className="text-sm text-slate-500 mb-1 block">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              className="w-full rounded-lg border px-4 py-3 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
            />

            <button
              onClick={handleSend}
              disabled={sending}
              className={`w-full rounded-md px-4 py-3 text-base text-white ${sending ? "bg-slate-400" : "bg-emerald-600 hover:bg-emerald-700"}`}
            >
              {sending ? "Envoi..." : "Envoyer"}
            </button>
          </div>
        </section>

        {/* Liste des relances */}
        <section className="lg:col-span-2 space-y-3">
          {reminders.map(r => (
            <article
              key={r.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border bg-white p-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-green-500 grid place-items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" className="h-5 w-5">
                    <path d="M12.04 2c-5.5 0-9.96 4.46-9.96 9.96 0 1.76.46 3.47 1.34 5.01L2 22l5.2-1.37a9.93 9.93 0 004.84 1.23h.01c5.5 0 9.96-4.46 9.96-9.96A9.95 9.95 0 0012.04 2zm5.8 14.35c-.25.7-1.45 1.33-2.01 1.38-.52.05-1.16.07-1.87-.12a8.1 8.1 0 01-2.64-1.15c-.46-.27-1.06-.89-1.21-1.24-.15-.36-.35-.89-.02-1.39.34-.52.77-.58 1.02-.58.25 0 .5.01.72.01.23 0 .54-.09.84.64.3.74.94 1.78 1.03 1.9.09.13.17.27.32.43.15.16.18.12.33.04.14-.08.86-.42 1.01-.49.15-.08.25-.12.39.07.13.18.52.63.65.76.13.13.18.2.25.32.07.11.04.21 0 .31z"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.patient}</div>
                  <div className="text-xs text-slate-400">{fmtDateTime(r.rendezvous)}</div>
                  <div className="text-sm text-slate-500">{r.whatsapp}</div>
                  {r.lastMessage && (
                    <div className="mt-1 max-w-xs rounded-lg px-3 py-2 text-sm bg-green-100 text-slate-800 whitespace-pre-wrap">
                      {r.lastMessage}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {r.statut === "Envoyé" && <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs">Envoyé</span>}
                {r.statut === "En attente" && <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs">En attente</span>}
                {r.statut === "Échec" && <span className="px-2 py-1 rounded-full bg-rose-100 text-rose-700 text-xs">Échec</span>}

                <button
                  onClick={() => setSelectedId(r.id)}
                  className="rounded-md border px-3 py-1 text-sm"
                >
                  Éditer
                </button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
