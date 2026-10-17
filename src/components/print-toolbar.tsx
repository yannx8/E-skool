"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, MessageCircle, Printer } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";

/** Screen-only toolbar above printable documents. */
export function PrintToolbar({
  backHref,
  backLabel,
  whatsappHref,
  children,
}: {
  backHref: string;
  backLabel: string;
  whatsappHref?: string | null;
  children?: ReactNode;
}) {
  return (
    <div className="no-print mx-auto mb-4 flex max-w-3xl flex-wrap items-center gap-2 px-4">
      <Link href={backHref} className={buttonClasses("ghost")}>
        <ChevronLeft aria-hidden /> {backLabel}
      </Link>
      <div className="ml-auto flex flex-wrap gap-2">
        {children}
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses("whatsapp")}
          >
            <MessageCircle aria-hidden /> Envoyer
          </a>
        )}
        <Button onClick={() => window.print()}>
          <Printer aria-hidden /> Imprimer / PDF
        </Button>
      </div>
    </div>
  );
}
