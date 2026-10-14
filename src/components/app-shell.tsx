"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition, type ReactNode } from "react";
import {
  AlertCircle,
  Briefcase,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  Menu,
  Settings,
  UserCircle,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { can, type Permission } from "@/lib/permissions";
import type { AppRole } from "@/lib/labels";
import { setActiveYear } from "@/app/(app)/actions";

export type ShellModules = { hr: boolean; finance: boolean; enrollment: boolean };

type NavItem = {
  href: string;
  label: string;
  mobileLabel?: string;
  icon: ReactNode;
  permission?: Permission;
  module?: keyof ShellModules;
  mobile?: boolean;
};

const NAV: NavItem[] = [
  { href: "/tableau-de-bord", label: "Tableau de bord", mobileLabel: "Accueil", icon: <LayoutDashboard />, mobile: true },
  { href: "/paiements", label: "Paiements", icon: <Wallet />, mobile: true },
  { href: "/eleves", label: "Élèves", icon: <Users />, mobile: true },
  { href: "/impayes", label: "Impayés", icon: <AlertCircle />, mobile: true },
  { href: "/inscriptions", label: "Inscriptions", icon: <UserPlus />, permission: "viewEnrollment", module: "enrollment" },
  { href: "/personnel", label: "Personnel", icon: <Briefcase />, permission: "viewHr", module: "hr" },
  { href: "/finances", label: "Finances", icon: <Landmark />, permission: "viewFinance", module: "finance" },
  { href: "/configuration", label: "Configuration", icon: <Settings />, permission: "viewAudit" },
];

export function visibleNav(role: AppRole, modules: ShellModules) {
  return NAV.filter((item) => (!item.permission || can(role, item.permission)) && (!item.module || modules[item.module]));
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function YearSwitcher({
  years,
  activeYearId,
  className,
}: {
  years: { id: string; label: string; is_current: boolean }[];
  activeYearId: string | null;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (years.length === 0) return null;
  return (
    <label className={cn("flex items-center gap-2 text-sm text-slate-600", className)}>
      <span className="whitespace-nowrap">Année</span>
      <select
        aria-label="Année scolaire affichée"
        className="h-10 rounded-lg border border-slate-300 bg-white px-2 text-base text-slate-900 disabled:opacity-60"
        value={activeYearId ?? ""}
        disabled={pending}
        onChange={(e) => {
          const id = e.target.value;
          startTransition(async () => {
            await setActiveYear(id);
            router.refresh();
          });
        }}
      >
        {years.map((y) => (
          <option key={y.id} value={y.id}>
            {y.label}
            {y.is_current ? " (en cours)" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AppShell({
  role,
  userName,
  schoolName,
  modules,
  years,
  activeYearId,
  children,
}: {
  role: AppRole;
  userName: string;
  schoolName: string;
  modules: ShellModules;
  years: { id: string; label: string; is_current: boolean }[];
  activeYearId: string | null;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const items = visibleNav(role, modules);
  const mobileItems = items.filter((i) => i.mobile);
  const moreActive = !mobileItems.some((i) => isActive(pathname, i.href));

  return (
    <div className="min-h-dvh md:flex">
      {/* Desktop sidebar */}
      <aside className="no-print sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center gap-2 px-5 py-5 text-primary">
          <GraduationCap className="size-7 shrink-0" aria-hidden />
          <span className="truncate text-lg font-bold" title={schoolName}>
            {schoolName}
          </span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label="Navigation principale">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(pathname, item.href) ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-base font-medium text-slate-700 hover:bg-slate-100 [&_svg]:size-5",
                isActive(pathname, item.href) && "bg-primary-soft text-primary hover:bg-primary-soft",
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/compte"
          className={cn(
            "m-3 flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-slate-700 hover:bg-slate-100",
            isActive(pathname, "/compte") && "bg-slate-100",
          )}
        >
          <UserCircle className="size-5 shrink-0" aria-hidden />
          <span className="truncate">{userName || "Mon compte"}</span>
        </Link>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="no-print sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur">
          <span className="truncate font-semibold text-primary md:hidden">{schoolName}</span>
          <span className="hidden md:block" />
          <YearSwitcher years={years} activeYearId={activeYearId} className="hidden sm:flex" />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-28 md:px-8 md:pb-10">{children}</main>
      </div>

      {/* Mobile bottom navigation: 4 items + "Plus" */}
      <nav
        className="no-print fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Navigation principale"
      >
        {mobileItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(pathname, item.href) ? "page" : undefined}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium text-slate-600 [&_svg]:size-6",
              isActive(pathname, item.href) && "text-primary",
            )}
          >
            {item.icon}
            {item.mobileLabel ?? item.label}
          </Link>
        ))}
        <Link
          href="/plus"
          aria-current={pathname === "/plus" ? "page" : undefined}
          className={cn(
            "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium text-slate-600 [&_svg]:size-6",
            moreActive && "text-primary",
          )}
        >
          <Menu />
          Plus
        </Link>
      </nav>
    </div>
  );
}
