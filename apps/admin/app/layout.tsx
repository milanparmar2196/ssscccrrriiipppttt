import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "../lib/auth";
import Shell from "../components/Shell";

export const metadata = { title: "AI Script Writer — Admin", description: "Platform control" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Shell>{children}</Shell>
        </AuthProvider>
      </body>
    </html>
  );
}
