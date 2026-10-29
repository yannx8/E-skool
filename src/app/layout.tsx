import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "E-skool",
  description: "School management ERP",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
