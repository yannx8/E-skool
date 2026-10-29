import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "@fontsource/figtree/400.css";
import "@fontsource/figtree/500.css";
import "@fontsource/figtree/600.css";
import "@fontsource/figtree/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "E-skool", template: "%s · E-skool" },
  description: "School fees, receipts, collections and cash for one school.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#4a5aeb", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        {children}
        <Toaster position="top-center" toastOptions={{ style: { fontFamily: "var(--font-sans)", fontSize: 15 } }} />
      </body>
    </html>
  );
}
