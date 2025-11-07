// src/features/referrals/NewReferral.tsx
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";              // 👈 AJOUT
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
  intervention_type: string;
  urgency_level: string;
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
type Option = { id: string | number; name: string; slug?: string };

/* -------------- State init -------------- */
const initialState: FormState = {
  first_name: "",
  last_name: "",
  birth_date: "",
  gender: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  postal_code: "",
  intervention_type: "",
  urgency_level: "",
  consultation_reason: "",
  medical_history: "",
  referring_doctor: "",
  establishment: "",
  insurance_provider: "",
  insurance_policy_number: "",
  coverage_type: "",
  expiration_date: "",
  holder_name: "",
  insurance_notes: "",
};

function cx(...cl: (string | false | undefined)[]) {
  return cl.filter(Boolean).join(" ");
}

/* i18n helpers */

function translateUrgencyLabel(t: (k: string) => string, value: string) {
  const map: Record<string, string> = { low: "urgency.low", medium: "urgency.medium", high: "urgency.high" };
  const key = map[value];
  if (key) {
    const tr = t(key);
    if (tr !== key) return tr;
  }
  return value;
}

/* -------------- Component -------------- */
export default function NewReferral() {
  
  const navigate = useNavigate();                               // 👈 AJOUT

  const [data, setData] = useState<FormState>(initialState);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [interventions, setInterventions] = useState<Option[]>([]);
  const [urgencies, setUrgencies] = useState<Option[]>([]);

const { t, i18n } = useTranslation();

useEffect(() => {
  let mounted = true;

  (async () => {
    try {
      const lang = i18n.language || "fr"; // 👈 récupère la langue active

      const [ivRes, ugRes] = await Promise.all([
        http.get(`/interventions/?lang=${lang}`), // 👈 envoie la langue au backend
        http.get(`/urgencies/?lang=${lang}`),
      ]);

      if (!mounted) return;

      const ivList = ivRes.data.results || ivRes.data || [];
      const ugList = ugRes.data.results || ugRes.data || [];

      setInterventions(ivList);
      setUrgencies(ugList);
    } catch (err) {
      console.error("Erreur lors du chargement des listes :", err);
    }
  })();

  return () => {
    mounted = false;
  };
}, [i18n.language]); // ✅ recharge automatiquement quand la langue change




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
      // ⚠️ envoyer null si la date d’expiration est vide
      const payload = {
        ...data,
        expiration_date: data.expiration_date?.trim() ? data.expiration_date : null,
      };
      await http.post("/referrals/", payload);
      setToast({ type: "ok", text: t("success") });
      setData(initialState);
      setStep(0);
      // ✅ redirection vers la liste “Mes références”
      navigate("/referrals/mine", { replace: true, state: { justCreated: true } }); // 👈 AJOUT
    } catch (e) {
      setToast({ type: "err", text: t("error") });
    } finally {
      setLoading(false);
    }
  };

 const steps = [
  { key: 0, title: t("referral_form.patient_info"), icon: "👤" },
  { key: 1, title: t("referral_form.medical_details"), icon: "🩺" },
  { key: 2, title: t("referral_form.insurance_info"), icon: "🛡️" },
];


  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-4 sm:mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
           <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
  {t("referral_form.new_referral")}
</h1>
<p className="text-xs sm:text-sm text-gray-600">
  {t("referral_form.fill_form")}
</p>

          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          {/* Steps */}
          <div className="border-b border-gray-100 px-3 sm:px-4 lg:px-6 py-3">
            <ol className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {steps.map((s, i) => (
                <li
                  key={s.key}
                  className={[
                    "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm",
                    i < step
                      ? "border-blue-100 bg-blue-50 text-blue-700"
                      : i === step
                      ? "border-blue-200 bg-blue-100 text-blue-800"
                      : "border-gray-200 bg-white text-gray-500",
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
                <h3 className="mb-3 sm:mb-4 text-base font-semibold text-gray-800">{t("referral_form.patient_info")
}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <Field label={t("referral_form.first_name")} required>
                    <input className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.first_name} onChange={(e) => set("first_name", e.target.value)}
                      placeholder={t("referral_form.first_name_ph")} autoComplete="given-name" inputMode="text" />
                  </Field>
                  <Field label={t("referral_form.last_name")} required>
                    <input className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.last_name} onChange={(e) => set("last_name", e.target.value)}
                      placeholder={t("referral_form.last_name_ph")} autoComplete="family-name" />
                  </Field>
                  <Field label={t("referral_form.birth_date")} required>
                    <input type="date" className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.birth_date} onChange={(e) => set("birth_date", e.target.value)} autoComplete="bday" />
                  </Field>
                  <Field label={t("referral_form.gender")} required>
                    <select className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.gender} onChange={(e) => set("gender", e.target.value)}>
                      <option value="">{t("referral_form.gender_ph")}</option>
                      <option value="male">{t("male")}</option>
                      <option value="female">{t("female")}</option>
                      <option value="other">{t("other")}</option>
                    </select>
                  </Field>
                  <Field label={t("referral_form.phone")} required>
                    <input className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.phone} onChange={(e) => set("phone", e.target.value)}
                      placeholder="+212 6XX XXX XXX" autoComplete="tel" inputMode="tel" />
                  </Field>
                  <Field label={t("referral_form.email")}>
                    <input type="email" className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.email} onChange={(e) => set("email", e.target.value)}
                      placeholder="patient@example.com" autoComplete="email" inputMode="email" />
                  </Field>
                  <Field className="md:col-span-2 lg:col-span-3" label={t("referral_form.address")}>
                    <input className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.address} onChange={(e) => set("address", e.target.value)}
                      placeholder={t("referral_form.address_ph")} autoComplete="street-address" />
                  </Field>
                  <Field label={t("referral_form.city")}>
                    <input className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.city} onChange={(e) => set("city", e.target.value)} autoComplete="address-level2" />
                  </Field>
                  <Field label={t("referral_form.postal_code")}>
                    <input className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      value={data.postal_code} onChange={(e) => set("postal_code", e.target.value)}
                      autoComplete="postal-code" inputMode="numeric" />
                  </Field>
                </div>
              </>
            )}

           {/* STEP 1 – Médical */}
{step === 1 && (
  <>
    <h3 className="mb-3 sm:mb-4 text-base font-semibold text-gray-800">
      {t("referral_form.medical_details")}
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">

      <Field label={t("referral_form.intervention_type")} required>
        <select
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          value={data.intervention_type}
          onChange={(e) => set("intervention_type", e.target.value)}
        >
          <option value="">{t("referral_form.intervention_type_ph")}</option>
          {interventions.map((it) => (
            <option key={it.id} value={it.id}>
              {it.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t("referral_form.urgency_level")} required>
        <select
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          value={data.urgency_level}
          onChange={(e) => set("urgency_level", e.target.value)}
        >
          <option value="">{t("referral_form.urgency_level_ph")}</option>
          {urgencies.length > 0 ? (
            urgencies.map((u) => (
              <option key={u.id} value={u.id}>
                {"slug" in u ? translateUrgencyLabel(t, (u as any).slug as string) : u.name}
              </option>
            ))
          ) : (
            <>
              <option value="1">{t("urgency.high")}</option>
              <option value="2">{t("urgency.medium")}</option>
              <option value="3">{t("urgency.low")}</option>
            </>
          )}
        </select>
      </Field>

      <div className="md:col-span-2 lg:col-span-3">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t("referral_form.consultation_reason")} <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3}
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          value={data.consultation_reason}
          onChange={(e) => set("consultation_reason", e.target.value)}
          placeholder={t("referral_form.consultation_reason_ph")}
        />
      </div>

      <div className="md:col-span-2 lg:col-span-3">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t("referral_form.medical_history")}
        </label>
        <textarea
          rows={3}
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          value={data.medical_history}
          onChange={(e) => set("medical_history", e.target.value)}
          placeholder={t("referral_form.medical_history_ph")}
        />
      </div>

      <Field className="sm:col-span-1" label={t("referral_form.referring_doctor")}>
        <input
          id="referring_doctor"
          name="referring_doctor"
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          value={data.referring_doctor}
          onChange={(e) => set("referring_doctor", e.target.value)}
          placeholder={t("referral_form.referring_doctor_ph")}
          autoComplete="off"
          aria-label={t("referral_form.referring_doctor")}
        />
      </Field>

      <Field className="sm:col-span-1" label={t("referral_form.establishment")}>
        <input
          id="establishment"
          name="establishment"
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          value={data.establishment}
          onChange={(e) => set("establishment", e.target.value)}
          placeholder={t("referral_form.establishment_ph")}
          autoComplete="organization"
          aria-label={t("referral_form.establishment")}
        />
      </Field>
    </div>
  </>
)}

{/* STEP 2 – Assurance */}
{step === 2 && (
  <>
    <h3 className="mb-3 sm:mb-4 text-base font-semibold text-gray-800">
      {t("referral_form.insurance_info")}
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
      <Field className="md:col-span-2 lg:col-span-3" label={t("referral_form.insurance_provider")} required>
        <select
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          value={data.insurance_provider}
          onChange={(e) => set("insurance_provider", e.target.value)}
        >
          <option value="">{t("referral_form.insurance_provider_ph")}</option>
          <option value="cnss">{t("providers.cnss")}</option>
          <option value="cnops">{t("providers.cnops")}</option>
          <option value="axa">{t("providers.axa")}</option>
          <option value="saham">{t("providers.saham")}</option>
        </select>
      </Field>

      <Field label={t("referral_form.insurance_policy_number")} required>
        <input
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          value={data.insurance_policy_number}
          onChange={(e) => set("insurance_policy_number", e.target.value)}
          autoComplete="off"
          inputMode="numeric"
          placeholder={t("referral_form.insurance_policy_number_ph")}
        />
      </Field>

      <Field label={t("referral_form.coverage_type")}>
        <input
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          value={data.coverage_type}
          onChange={(e) => set("coverage_type", e.target.value)}
          autoComplete="off"
          placeholder={t("referral_form.coverage_type_ph")}
        />
      </Field>

      <Field label={t("referral_form.expiration_date")}>
        <input
          type="date"
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          value={data.expiration_date}
          onChange={(e) => set("expiration_date", e.target.value)}
        />
      </Field>

      <Field label={t("referral_form.holder_name")}>
        <input
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          value={data.holder_name}
          onChange={(e) => set("holder_name", e.target.value)}
          placeholder={t("referral_form.holder_name_ph")}
        />
      </Field>

      <div className="md:col-span-2 lg:col-span-3">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t("referral_form.insurance_notes")}
        </label>
        <textarea
          rows={2}
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          value={data.insurance_notes}
          onChange={(e) => set("insurance_notes", e.target.value)}
          placeholder={t("referral_form.insurance_notes_ph")}
        />
      </div>
    </div>
  </>
)}
 </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              {step > 0 ? (
                <button onClick={() => setStep((s) => s - 1)}
                  className="w-full sm:w-auto rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                  {t("back")}
                </button>
              ) : (
                <span className="hidden sm:block" />
              )}

              {step < 2 ? (
                <button onClick={() => setStep((s) => s + 1)} disabled={!canNext}
                  className={cx(
                    "w-full sm:w-auto rounded-lg px-5 py-2.5 text-sm font-medium text-white",
                    canNext ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-400 opacity-60 cursor-not-allowed"
                  )}>
                  {t("next")}
                </button>
              ) : (
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <button onClick={() => setData(initialState)}
                    className="w-full sm:w-auto rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                    {t("cancel")}
                  </button>
                  <button onClick={submit} disabled={loading || !data.insurance_provider || !data.insurance_policy_number}
                    className={cx(
                      "w-full sm:w-auto rounded-lg px-5 py-2.5 text-sm font-medium text-white",
                      loading || !data.insurance_provider || !data.insurance_policy_number
                        ? "bg-blue-400 opacity-60 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    )}>
                    {loading ? t("sending") : t("submit")}
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
  children: ReactNode;
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
