"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "../lib/api";
import { RequireAuth, useAuth, VerifyBanner } from "../lib/auth";

const NAV = [
  { href: "/projects", label: "Projects", ico: "▦" },
  { href: "/onboarding", label: "Onboarding", ico: "✦" },
  { href: "/settings", label: "Settings", ico: "⚙" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      setCredits(null);
      return;
    }
    api<any>("/me/credits")
      .then((c) => setCredits(c?.balance ?? null))
      .catch(() => setCredits(null));
  }, [user, pathname]);

  const doLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (!user) {
    return (
      <>
        <header className="topbar">
          <div className="inner">
            <Link href="/" className="brand" style={{ padding: 0 }}>
              <span className="brand-mark">S</span>
              <span className="brand-name">ScriptForge</span>
            </Link>
            <span style={{ flex: 1 }} />
            <Link href="/login">Log in</Link>
            <Link href="/signup" className="btn small">
              Sign up
            </Link>
          </div>
        </header>
        <RequireAuth>{children}</RequireAuth>
      </>
    );
  }

  const initials = (user.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/projects" className="brand">
          <span className="brand-mark">S</span>
          <span>
            <span className="brand-name">ScriptForge</span>
            <br />
            <span className="brand-sub">Faceless script studio</span>
          </span>
        </Link>
        <div className="nav-label">Workspace</div>
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`nav-item${pathname?.startsWith(n.href) ? " active" : ""}`}
          >
            <span className="nav-ico">{n.ico}</span>
            {n.label}
          </Link>
        ))}
        <div className="sidebar-foot">
          <div className="credits-pill" title="Credit balance">
            <span className="muted">Credits</span>
            <b>{credits ?? "…"}</b>
          </div>
          <div className="user-row">
            <span className="avatar">{initials}</span>
            <span className="small muted" style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.email}
            </span>
          </div>
          <button className="btn ghost small" onClick={doLogout}>
            Log out
          </button>
        </div>
      </aside>
      <div className="shell-main">
        <RequireAuth>
          <div className="container" style={{ paddingBottom: 0 }}>
            <VerifyBanner />
          </div>
          {children}
        </RequireAuth>
      </div>
    </div>
  );
}
