import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "E-skool", template: "%s | E-skool" },
  description: "Gestion de l'école : élèves, paiements, reçus, impayés, personnel et finances.",
  applicationName: "E-skool",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#1e40af",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full">
        {children}
        <Toaster position="top-center" richColors closeButton toastOptions={{ style: { fontSize: 16 } }} />
      </body>
    </html>
  );
}
