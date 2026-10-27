"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "../lib/api";
import { RequireAuth, useAuth, VerifyBanner } from "../lib/auth";

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

  return (
    <>
      <header className="topbar">
        <div className="inner">
          <Link href="/" style={{ fontWeight: 700, color: "var(--text)" }}>
            AI Script Writer
          </Link>
          {user ? (
            <>
              <Link href="/projects">Projects</Link>
              <Link href="/onboarding">Onboarding</Link>
              <Link href="/settings">Settings</Link>
              <span style={{ flex: 1 }} />
              <span className="badge" title="Credit balance">
                Credits: {credits ?? "…"}
              </span>
              <span className="small muted">{user.email}</span>
              <button
                className="btn ghost small"
                onClick={async () => {
                  await logout();
                  router.replace("/login");
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <span style={{ flex: 1 }} />
              <Link href="/login">Log in</Link>
              <Link href="/signup" className="btn small">
                Sign up
              </Link>
            </>
          )}
        </div>
      </header>
      <RequireAuth>
        {user && (
          <div className="container" style={{ paddingBottom: 0 }}>
            <VerifyBanner />
          </div>
        )}
        {children}
      </RequireAuth>
    </>
  );
}
