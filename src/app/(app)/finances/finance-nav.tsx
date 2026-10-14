"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/finances", label: "Vue d'ensemble" },
  { href: "/finances/depenses", label: "Dépenses" },
  { href: "/finances/revenus", label: "Autres revenus" },
  { href: "/finances/journal", label: "Journal de caisse" },
  { href: "/finances/cloture", label: "Clôture" },
  { href: "/finances/periodes", label: "Mois et ajustements" },
  { href: "/finances/rapport", label: "Rapport mensuel" },
];

export function FinanceNav() {
  const pathname = usePathname();
  return (
    <nav className="no-print -mx-4 mb-5 overflow-x-auto px-4" aria-label="Finances">
      <ul className="flex gap-1 border-b border-slate-200">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <li key={t.href}>
              <Link
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "-mb-px flex min-h-11 items-center border-b-2 px-3 text-sm font-medium whitespace-nowrap",
                  active ? "border-primary text-primary" : "border-transparent text-slate-600 hover:text-slate-900",
                )}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
