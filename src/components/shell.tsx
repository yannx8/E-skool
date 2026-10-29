"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  Banknote,
  BarChart3,
  HandCoins,
  Home,
  Landmark,
  LayoutGrid,
  ReceiptText,
  Search,
  Settings,
  Users,
  Wallet,
  BellRing,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Overview", icon: Home },
  { href: "/families", label: "Families", icon: Users },
  { href: "/collections", label: "Unpaid balances", icon: BellRing },
  { href: "/payments", label: "Receipts", icon: ReceiptText },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { href: "/cash", label: "Cash & bank", icon: Landmark },
  { href: "/payroll", label: "Payroll", icon: Banknote },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const active = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

/** Brightwheel's frame: periwinkle rail with white icons, white page with a search pill top right. */
export function Shell({ school, user, canCollect, children }: { school: string; user: { name: string; role: string }; canCollect: boolean; children: React.ReactNode }) {
  const path = usePathname();
  return (
    <div className="min-h-dvh lg:pl-[248px]">
      <aside className="no-print fixed inset-y-0 left-0 hidden w-[248px] flex-col bg-rail text-rail-ink lg:flex">
        <div className="px-5 pt-6 pb-5">
          <div className="text-[13px] font-bold tracking-[0.08em] text-rail-muted">E-SKOOL</div>
          <div className="mt-1 line-clamp-2 text-[16px] leading-snug font-bold" title={school}>
            {school}
          </div>
        </div>
        {canCollect && (
          <div className="px-4 pb-5">
            <Link href="/payments/new" className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-panel font-bold text-sun shadow-card hover:bg-sun-soft">
              <HandCoins className="size-[18px]" strokeWidth={2.2} />
              Receive payment
            </Link>
          </div>
        )}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active(path, n.href) ? "page" : undefined}
              className={clsx(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px]",
                active(path, n.href) ? "bg-rail-2 font-bold text-white" : "text-rail-muted hover:bg-rail-2/60 hover:text-white",
              )}
            >
              <n.icon className="size-5 shrink-0" strokeWidth={1.8} />
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/15 px-5 py-4 text-[14px]">
          <div className="font-bold">{user.name}</div>
          <div className="flex items-center justify-between text-rail-muted">
            <span>{user.role.charAt(0) + user.role.slice(1).toLowerCase()}</span>
            <form action="/logout" method="post">
              <button className="min-h-11 underline hover:text-white">Sign out</button>
            </form>
          </div>
        </div>
      </aside>

      <header className="no-print sticky top-0 z-20 flex h-14 items-center justify-between gap-2 bg-rail px-4 text-rail-ink lg:hidden">
        <div className="min-w-0 truncate">
          <span className="text-[12px] font-bold tracking-[0.08em] text-rail-muted">E-SKOOL</span>
          <span className="ml-2 text-[15px] font-bold">{school}</span>
        </div>
        <Link href="/families" aria-label="Search families" className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-rail-2">
          <Search className="size-5" strokeWidth={2} />
        </Link>
      </header>

      <div className="no-print hidden h-16 items-center justify-end border-b border-line bg-panel px-10 lg:flex">
        <form action="/families" className="relative w-[320px]">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3" />
          <input
            name="q"
            type="search"
            aria-label="Search families"
            placeholder="Search a pupil, parent or phone"
            className="block min-h-10 w-full rounded-full border border-line-strong bg-ground pr-4 pl-10 text-[15px] placeholder:text-ink-3 focus:border-sun focus:bg-panel focus:outline-none"
          />
        </form>
      </div>

      <main className="mx-auto max-w-[1240px] px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-8 lg:pb-12">{children}</main>

      <nav className="no-print fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-panel pb-[env(safe-area-inset-bottom)] lg:hidden">
        {[NAV[0], NAV[1]].map((n) => (
          <Tab key={n.href} {...n} on={active(path, n.href)} />
        ))}
        {canCollect ? (
          <Link href="/payments/new" className="flex flex-col items-center justify-center py-1.5">
            <span className="flex size-12 items-center justify-center rounded-full bg-sun text-white shadow-[0_2px_8px_rgb(74_90_235/0.4)]">
              <HandCoins className="size-5" strokeWidth={2.2} />
            </span>
            <span className="sr-only">Receive payment</span>
          </Link>
        ) : (
          <Tab {...NAV[3]} on={active(path, NAV[3].href)} />
        )}
        <Tab {...NAV[2]} label="Unpaid" on={active(path, NAV[2].href)} />
        <Tab href="/menu" label="More" icon={LayoutGrid} on={path === "/menu"} />
      </nav>
    </div>
  );
}

function Tab({ href, label, icon: Icon, on }: { href: string; label: string; icon: typeof Home; on: boolean }) {
  return (
    <Link href={href} aria-current={on ? "page" : undefined} className={clsx("flex min-h-14 flex-col items-center justify-center gap-0.5 text-[12px]", on ? "font-bold text-sun" : "text-ink-3")}>
      <Icon className="size-5" strokeWidth={on ? 2.2 : 1.8} />
      {label}
    </Link>
  );
}

export const MENU = NAV;
