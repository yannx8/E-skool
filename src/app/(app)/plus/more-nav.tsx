"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { visibleNav, YearSwitcher, type ShellModules } from "@/components/app-shell";
import type { AppRole } from "@/lib/labels";

export function MoreNav({
  role,
  modules,
  years,
  activeYearId,
}: {
  role: AppRole;
  modules: ShellModules;
  years: { id: string; label: string; is_current: boolean }[];
  activeYearId: string | null;
}) {
  const items = visibleNav(role, modules);
  return (
    <>
      <Card className="mb-4 p-4">
        <YearSwitcher years={years} activeYearId={activeYearId} />
      </Card>
      <Card>
        <ul className="divide-y divide-slate-100">
          {items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="flex min-h-14 items-center gap-3 px-4 [&>svg:first-child]:size-6 [&>svg:first-child]:text-slate-500">
                {item.icon}
                <span className="flex-1 font-medium">{item.label}</span>
                <ChevronRight className="size-5 text-slate-400" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
