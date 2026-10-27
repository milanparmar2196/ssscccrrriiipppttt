"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { adminLogin, loadSession, saveSession, type AdminSession } from "./api";

interface AuthContextValue {
  session: AdminSession | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  ready: false,
  login: async () => undefined,
  logout: () => undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setSession(loadSession());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!session && pathname !== "/login") router.replace("/login");
    if (session && pathname === "/login") router.replace("/");
  }, [ready, session, pathname, router]);

  const value: AuthContextValue = {
    session,
    ready,
    login: async (email, password) => {
      const s = await adminLogin(email, password);
      setSession(s);
      router.replace("/");
    },
    logout: () => {
      saveSession(null);
      setSession(null);
      router.replace("/login");
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
