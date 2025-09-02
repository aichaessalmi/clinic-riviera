// src/features/referrals/NewReferral.tsx
import { useMemo, useState } from "react";
import http from "../../api/http";

/* ---------------- Types ---------------- */
type PatientStep = {
  first_name: string;
  last_name: string;
  birth_date: string; // yyyy-mm-dd
  gender: "male" | "female" | "other" | "";
  phone: string;
  email: string;
  address: string;
  city: string;
  postal_code: string;
};

type MedicalStep = {
  intervention_type: "cardio" | "neuro" | "ortho" | "derma" | "ophtal" | "";
  urgency_level: "low" | "medium" | "high" | "";
  consultation_reason: string;
  medical_history: string;
  referring_doctor: string;
  establishment: string;
};

type InsuranceStep = {
  insurance_provider: "cnss" | "cnops" | "axa" | "saham" | "";
  insurance_policy_number: string;
  coverage_type: string;
  expiration_date: string; // yyyy-mm-dd
  holder_name: string;
  insurance_notes: string;
};

type FormState = PatientStep & MedicalStep & InsuranceStep;

/* -------------- State init -------------- */
const initialState: FormState = {
  // Patient
  first_name: "",
  last_name: "",
  birth_date: "",
  gender: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  postal_code: "",
  // Médical
  intervention_type: "",
  urgency_level: "",
  consultation_reason: "",
  medical_history: "",
  referring_doctor: "",
  establishment: "",
  // Assurance
  insurance_provider: "",
  insurance_policy_number: "",
  coverage_type: "",
  expiration_date: "",
  holder_name: "",
  insurance_notes: "",
};

const steps = [
  { key: 0, title: "Informations Patient", icon: "👤" },
  { key: 1, title: "Détails Médicaux", icon: "🩺" },
  { key: 2, title: "Assurance", icon: "🛡️" },
];

function cx(...cl: (string | false | undefined)[]) {
  return cl.filter(Boolean).join(" ");
}

/* -------------- Component -------------- */
export default function NewReferral() {
  const [data, setData] = useState<FormState>(initialState);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const set = (k: keyof FormState, v: string) => setData((d) => ({ ...d, [k]: v }));

  const canNext = useMemo(() => {
    if (step === 0) {
      return (
        data.first_name.trim() &&
        data.last_name.trim() &&
        data.birth_date &&
        data.gender &&
        data.phone.trim()
      );
    }
    if (step === 1) {
      return data.intervention_type && data.urgency_level && data.consultation_reason.trim();
    }
    return true;
  }, [step, data]);

  const submit = async () => {
    setLoading(true);
    setToast(null);
    try {
      await http.post("/referrals/", data);
      setToast({ type: "ok", text: "Référence créée avec succès." });
      setData(initialState);
      setStep(0);
    } catch {
      setToast({ type: "err", text: "Une erreur est survenue. Réessayez." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Nouvelle Référence Patient</h1>
            <p className="text-xs sm:text-sm text-gray-600">
              Remplissez le formulaire pour référer un patient à la Clinique Riviera
            </p>
          </div>
        </div>

        {/* Wizard Card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Steps (scrollable on mobile) */}
          {/* Steps — empilés en mobile, 3 colonnes dès sm */}
<div className="border-b border-gray-100 px-3 sm:px-4 lg:px-6 py-3">
  <ol className="grid grid-cols-1 gap-2 sm:grid-cols-3">
    {steps.map((s, i) => (
      <li
        key={s.key}
        className={[
          "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm",
          i < step ? "border-blue-100 bg-blue-50 text-blue-700"
          : i === step ? "border-blue-200 bg-blue-100 text-blue-800"
          : "border-gray-200 bg-white text-gray-500"
        ].join(" ")}
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white ring-1 ring-inset ring-gray-200">
          {s.icon}
        </span>
        <span className="font-medium">{s.title}</span>
      </li>
    ))}
  </ol>
</div>


          {/* Body */}
          <div className="px-3 sm:px-4 lg:px-6 py-5 sm:py-6">
            {toast && (
              <div
                role="status"
                className={cx(
                  "mb-4 rounded-lg px-4 py-2 text-sm",
                  toast.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                )}
              >
                {toast.text}
              </div>
            )}

            {/* STEP 0 – Patient */}
            {step === 0 && (
              <>
                <h3 className="mb-3 sm:mb-4 text-base font-semibold text-gray-800">
                  Informations du Patient
                </h3>

                {/* Mobile: 1 col | md: 2 cols | lg: 3 cols */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <Field label="Prénom" required>
                    <input
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.first_name}
                      onChange={(e) => set("first_name", e.target.value)}
                      placeholder="Entrez le prénom"
                      autoComplete="given-name"
                      inputMode="text"
                    />
                  </Field>

                  <Field label="Nom de famille" required>
                    <input
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.last_name}
                      onChange={(e) => set("last_name", e.target.value)}
                      placeholder="Entrez le nom de famille"
                      autoComplete="family-name"
                    />
                  </Field>

                  <Field label="Date de naissance" required>
                    <input
                      type="date"
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.birth_date}
                      onChange={(e) => set("birth_date", e.target.value)}
                      autoComplete="bday"
                    />
                  </Field>

                  <Field label="Genre" required>
                    <select
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.gender}
                      onChange={(e) => set("gender", e.target.value)}
                    >
                      <option value="">Sélectionnez le genre</option>
                      <option value="male">Homme</option>
                      <option value="female">Femme</option>
                      <option value="other">Autre</option>
                    </select>
                  </Field>

                  <Field label="Numéro de téléphone" required>
                    <input
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="+212 6XX XXX XXX"
                      autoComplete="tel"
                      inputMode="tel"
                    />
                  </Field>

                  <Field label="Email">
                    <input
                      type="email"
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="patient@example.com"
                      autoComplete="email"
                      inputMode="email"
                    />
                  </Field>

                  {/* Adresse pleine largeur (sur md: 2 cols ; lg: 3 cols) */}
                  <Field className="md:col-span-2 lg:col-span-3" label="Adresse">
                    <input
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.address}
                      onChange={(e) => set("address", e.target.value)}
                      placeholder="Adresse complète"
                      autoComplete="street-address"
                    />
                  </Field>

                  <Field label="Ville">
                    <input
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.city}
                      onChange={(e) => set("city", e.target.value)}
                      autoComplete="address-level2"
                    />
                  </Field>

                  <Field label="Code postal">
                    <input
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.postal_code}
                      onChange={(e) => set("postal_code", e.target.value)}
                      autoComplete="postal-code"
                      inputMode="numeric"
                    />
                  </Field>
                </div>
              </>
            )}

            {/* STEP 1 – Médical */}
            {step === 1 && (
              <>
                <h3 className="mb-3 sm:mb-4 text-base font-semibold text-gray-800">Détails Médicaux</h3>

                {/* 1 col mobile → 2 cols md → 3 cols lg */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <Field label="Type d'intervention" required>
                    <select
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.intervention_type}
                      onChange={(e) => set("intervention_type", e.target.value)}
                    >
                      <option value="">Sélectionnez la spécialité</option>
                      <option value="cardio">Cardiologie</option>
                      <option value="neuro">Neurologie</option>
                      <option value="ortho">Orthopédie</option>
                      <option value="derma">Dermatologie</option>
                      <option value="ophtal">Ophtalmologie</option>
                    </select>
                  </Field>

                  <Field label="Niveau d'urgence" required>
                    <select
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.urgency_level}
                      onChange={(e) => set("urgency_level", e.target.value)}
                    >
                      <option value="">Sélectionnez l'urgence</option>
                      <option value="low">Faible</option>
                      <option value="medium">Moyen</option>
                      <option value="high">Élevé</option>
                    </select>
                  </Field>

                  {/* Textareas en pleine largeur */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Motif de consultation <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.consultation_reason}
                      onChange={(e) => set("consultation_reason", e.target.value)}
                      placeholder="Décrivez le motif et les symptômes observés…"
                    />
                  </div>

                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="mb-1 block text-sm font-medium text-gray-700">Antécédents médicaux</label>
                    <textarea
                      rows={3}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.medical_history}
                      onChange={(e) => set("medical_history", e.target.value)}
                      placeholder="Allergies, traitements, antécédents…"
                    />
                  </div>

                  {/* IMPORTANT : sur mobile, ces deux champs passent l’un sous l’autre */}
                 {/* Médecin référent – empilé en mobile, côte à côte dès sm */}
<Field className="sm:col-span-1" label="Médecin référent">
  <input
    className="form-input"
    value={data.referring_doctor}
    onChange={(e) => set("referring_doctor", e.target.value)}
    placeholder="Dr. Nom du médecin référent"
    autoComplete="off"
  />
</Field>

{/* Établissement – empilé en mobile, côte à côte dès sm */}
<Field className="sm:col-span-1" label="Établissement">
  <input
    className="form-input"
    value={data.establishment}
    onChange={(e) => set("establishment", e.target.value)}
    placeholder="Nom de l'établissement"
    autoComplete="organization"
  />
</Field>

                </div>
              </>
            )}

            {/* STEP 2 – Assurance */}
            {step === 2 && (
              <>
                <h3 className="mb-3 sm:mb-4 text-base font-semibold text-gray-800">
                  Informations d&apos;Assurance
                </h3>

                {/* 1 col mobile → 2 cols md → 3 cols lg */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <Field className="md:col-span-2 lg:col-span-3" label="Fournisseur d'assurance" required>
                    <select
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.insurance_provider}
                      onChange={(e) => set("insurance_provider", e.target.value)}
                    >
                      <option value="">Sélectionnez le fournisseur</option>
                      <option value="cnss">CNSS</option>
                      <option value="cnops">CNOPS</option>
                      <option value="axa">AXA</option>
                      <option value="saham">Saham</option>
                    </select>
                  </Field>

                  <Field label="Numéro de police" required>
                    <input
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.insurance_policy_number}
                      onChange={(e) => set("insurance_policy_number", e.target.value)}
                      autoComplete="off"
                      inputMode="numeric"
                    />
                  </Field>

                  <Field label="Type de couverture">
                    <input
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.coverage_type}
                      onChange={(e) => set("coverage_type", e.target.value)}
                      autoComplete="off"
                    />
                  </Field>

                  <Field label="Date d'expiration">
                    <input
                      type="date"
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.expiration_date}
                      onChange={(e) => set("expiration_date", e.target.value)}
                    />
                  </Field>

                  <Field label="Nom du titulaire">
                    <input
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.holder_name}
                      onChange={(e) => set("holder_name", e.target.value)}
                      placeholder="Si différent du patient"
                    />
                  </Field>

                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="mb-1 block text-sm font-medium text-gray-700">Notes sur l'assurance</label>
                    <textarea
                      rows={2}
                      className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.insurance_notes}
                      onChange={(e) => set("insurance_notes", e.target.value)}
                      placeholder="Informations supplémentaires, restrictions, etc."
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer actions – full width on mobile */}
          <div className="border-t border-gray-100 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              {step > 0 ? (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="w-full sm:w-auto rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Retour
                </button>
              ) : (
                <span className="hidden sm:block" />
              )}

              {step < 2 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  disabled={!canNext}
                  className={cx(
                    "w-full sm:w-auto rounded-lg px-5 py-2.5 text-sm font-medium text-white",
                    canNext ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-400 opacity-60 cursor-not-allowed"
                  )}
                >
                  Suivant
                </button>
              ) : (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <button
                    onClick={() => setData(initialState)}
                    className="w-full sm:w-auto rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={submit}
                    disabled={loading || !data.insurance_provider || !data.insurance_policy_number}
                    className={cx(
                      "w-full sm:w-auto rounded-lg px-5 py-2.5 text-sm font-medium text-white",
                      loading || !data.insurance_provider || !data.insurance_policy_number
                        ? "bg-blue-400 opacity-60 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    )}
                  >
                    {loading ? "Envoi…" : "Soumettre référence"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Small UI helper ---------- */
function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
