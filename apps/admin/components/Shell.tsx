"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { Loading } from "./ui";

const NAV: Array<{ href: string; label: string }> = [
  { href: "/", label: "Dashboard" },
  { href: "/users", label: "Users" },
  { href: "/admin-users", label: "Admin Users" },
  { href: "/taxonomy", label: "Taxonomy" },
  { href: "/config-questions", label: "Config Questions" },
  { href: "/angles", label: "Angles" },
  { href: "/niche-templates", label: "Niche Templates" },
  { href: "/annex-templates", label: "Annex Templates" },
  { href: "/format-profiles", label: "Format Profiles" },
  { href: "/model-providers", label: "Model Providers" },
  { href: "/prompt-templates", label: "Prompt Templates" },
  { href: "/source-library", label: "Source Library" },
  { href: "/seeds", label: "Seeds" },
  { href: "/plans", label: "Plans" },
  { href: "/credit-packs", label: "Credit Packs" },
  { href: "/feature-flags", label: "Feature Flags" },
  { href: "/jobs", label: "Jobs" },
  { href: "/safety", label: "Safety Queue" },
  { href: "/audit-log", label: "Audit Log" },
  { href: "/settings", label: "Settings" },
];

export default function Shell({ children }: { children: ReactNode }) {
  const { session, ready, logout } = useAuth();
  const pathname = usePathname();

  if (pathname === "/login") return <>{children}</>;
  if (!ready) return <Loading label="Checking session…" />;
  if (!session) return <Loading label="Redirecting to login…" />;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">S</span>
          <span>
            <span className="brand-name">ScriptForge</span>
            <br />
            <span className="brand-sub">Admin Console — internal only</span>
          </span>
        </div>
        <nav>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                item.href === "/" ? (pathname === "/" ? "active" : undefined) : pathname.startsWith(item.href) ? "active" : undefined
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="whoami">
          Signed in as <strong style={{ color: "#fff" }}>{session.actor}</strong>
          <br />
          Role: {session.role}
          <div style={{ marginTop: 8 }}>
            <button className="secondary small" onClick={logout}>
              Sign out
            </button>
          </div>
        </div>
      </aside>
      <div className="main">{children}</div>
    </div>
  );
}
