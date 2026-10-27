import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "../lib/auth";
import AppShell from "../components/AppShell";

export const metadata = { title: "AI Script Writer", description: "Faceless script generation" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
