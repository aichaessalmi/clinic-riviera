// src/components/AppLayout.tsx
import React, { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "react-i18next";

type Role = "DIRECTION" | "SECRETAIRE" | "MEDECIN";

type NavItem = {
  key: string;
  to: string;
  label: string;
  primary?: boolean;
  showFor?: Role[];
};

function TopNavLink({
  to,
  label,
  primary = false,
  onClick,
}: {
  to: string;
  label: string;
  primary?: boolean;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        [
          "inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-medium transition",
          isActive
            ? "bg-blue-600 text-white shadow hover:bg-blue-600"
            : "text-slate-700 hover:bg-slate-100",
          !isActive && primary ? "bg-blue-50 text-blue-700 hover:bg-blue-100" : "",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { role, logout, ready } = useAuth();            // ✅ on récupère ready
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const allItems: NavItem[] = [
    { key: "dashboard", to: "/dashboard", label: "Dashboard", showFor: ["DIRECTION", "SECRETAIRE"] },
    { key: "my_refs", to: "/referrals/mine", label: "Referrals", showFor: ["MEDECIN"] },
    { key: "new_ref", to: "/referrals/new", label: "+ New Referral", primary: true, showFor: ["MEDECIN"] },
    { key: "notif", to: "/notifications", label: "Notifications", showFor: ["MEDECIN","DIRECTION","SECRETAIRE"] },
    { key: "cal", to: "/calendar", label: "Calendar", showFor: ["DIRECTION", "SECRETAIRE"] },
    
    { key: "patients", to: "/patients", label: "Patient Registry", showFor: ["DIRECTION", "SECRETAIRE"] },
    { key: "patients", to: "/patient", label: "Referrals", showFor: ["SECRETAIRE"] },
    { key: "Appointments", to: "/Appointments", label: "Appointments", showFor: ["DIRECTION", "SECRETAIRE"] },
   
    { key: "Analytics", to: "/Analytics", label: "Analytics", showFor: ["DIRECTION"] },
    { key: "Referrals", to: "/Referrals", label: "Referrals", showFor: ["DIRECTION"] },
  ];

  // ✅ Tant que role n’est pas connu, on ne propose rien (évite les clics “interdits”)
  const items: NavItem[] = role ? allItems.filter(it => it.showFor?.includes(role)) : [];

  // ✅ Pendant l’hydratation, afficher un header minimal
  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-slate-200" />
              <div className="h-4 w-32 rounded bg-slate-200" />
            </div>
            <div className="hidden md:flex gap-2">
              <div className="h-8 w-24 rounded bg-slate-200" />
              <div className="h-8 w-24 rounded bg-slate-200" />
            </div>
            <div className="h-8 w-8 rounded bg-slate-200 md:hidden" />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
          <div className="h-24 rounded-xl bg-slate-100 animate-pulse" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-blue-600 text-white font-semibold">
              CR
            </div>
            <span className="text-slate-900 font-semibold">Clinique Riviera</span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-2">
            {items.map((it) => (
              <TopNavLink key={it.key} to={it.to} label={it.label} primary={it.primary} />
            ))}
          </nav>

          {/* Actions droites */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => i18n.changeLanguage(i18n.language === "fr" ? "en" : "fr")}
              className="rounded-lg border border-blue-600 bg-white px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              {i18n.language.toUpperCase()}
            </button>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-red-700"
            >
              Logout
            </button>
          </div>

          {/* Burger mobile */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Nav mobile */}
        {open && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3">
              {items.map((it) => (
                <TopNavLink
                  key={it.key}
                  to={it.to}
                  label={it.label}
                  primary={it.primary}
                  onClick={() => setOpen(false)}      // ✅ fermer après clic
                />
              ))}
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => i18n.changeLanguage(i18n.language === "fr" ? "en" : "fr")}
                  className="flex-1 rounded-lg border border-blue-600 bg-white px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                >
                  {i18n.language.toUpperCase()}
                </button>
                <button
                  onClick={() => {
                    setOpen(false);
                    logout();
                    navigate("/login");
                  }}
                  className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white shadow hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">{children}</main>
    </div>
  );
}
