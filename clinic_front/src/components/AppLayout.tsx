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
}: {
  to: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <NavLink
      to={to}
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
  const { role, logout } = useAuth();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const allItems: NavItem[] = [
    { key: "dashboard", to: "/dashboard", label: "Dashboard", showFor: ["DIRECTION", "SECRETAIRE"] },
    { key: "my_refs", to: "/referrals/mine", label: "Referrals", showFor: ["MEDECIN"] },
    { key: "new_ref", to: "/referrals/new", label: "+ New Referral", primary: true, showFor: ["MEDECIN"] },
    { key: "notif", to: "/notifications", label: "Notifications", showFor: ["MEDECIN"] },
    { key: "apts", to: "/appointments", label: "Appointments", showFor: ["DIRECTION", "SECRETAIRE"] },
    { key: "cal", to: "/calendar", label: "Calendar", showFor: ["DIRECTION", "SECRETAIRE"] },
    { key: "stats", to: "/stats", label: "Analytics", showFor: ["DIRECTION"] },
  ];

  const items = allItems.filter((it) => !role || it.showFor?.includes(role as Role));

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
                <TopNavLink key={it.key} to={it.to} label={it.label} primary={it.primary} />
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
