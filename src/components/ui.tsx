import Link from "next/link";
import { clsx } from "clsx";
import type { ChargeState } from "@/lib/money";
import { fmt } from "@/lib/format";

const btn = {
  primary: "bg-sun text-white hover:bg-sun-2 font-bold shadow-card",
  secondary: "bg-panel text-ink border border-line-strong hover:border-sun hover:text-sun font-medium",
  quiet: "text-ink-2 hover:text-ink hover:bg-black/5 font-medium",
  danger: "bg-panel text-late border border-late/40 hover:bg-late-soft font-medium",
};
export type Tone = keyof typeof btn;

export const buttonClass = (tone: Tone = "secondary", extra?: string) =>
  clsx(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-[15px] transition-colors disabled:opacity-50 disabled:pointer-events-none",
    btn[tone],
    extra,
  );

export function LinkButton({ href, tone, className, children }: { href: string; tone?: Tone; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={buttonClass(tone, className)}>
      {children}
    </Link>
  );
}

export function PageHeader({ title, sub, actions }: { title: React.ReactNode; sub?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[28px] leading-tight font-bold tracking-[-0.02em] text-balance">{title}</h1>
        {sub && <div className="mt-1 text-ink-2">{sub}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({ title, sub, actions, children, className, flush }: { title?: React.ReactNode; sub?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string; flush?: boolean }) {
  return (
    <section className={clsx("rounded-box border border-line bg-panel shadow-card", className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[17px] font-bold">{title}</h2>
            {sub && <div className="text-[14px] text-ink-3">{sub}</div>}
          </div>
          {actions}
        </div>
      )}
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

// Past-due tones deepen with age (1-30 lightest, 90+ darkest); labels always say the age.
const TONE_BAR = {
  late: "bg-late-bar",
  late1: "bg-late-bar/45",
  late2: "bg-late-bar",
  late3: "bg-late",
  late4: "bg-[#8a1d22]",
  later: "bg-later",
  paid1: "bg-paid-1",
  paid2: "bg-paid-2",
  paid3: "bg-paid-3",
  paid: "bg-paid",
  action: "bg-sun",
};
export type BarTone = keyof typeof TONE_BAR;
export type SummaryPart = { label: React.ReactNode; value: number; tone: BarTone; href?: string };

/**
 * Brightwheel's billing summary card: title, period line, big amount,
 * one stacked bar, and a legend chip per part (dot, label, amount).
 */
export function SummaryCard({ title, sub, total, parts, className }: { title: string; sub: string; total: number; parts: SummaryPart[]; className?: string }) {
  const sum = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <section className={clsx("rounded-box border border-line bg-panel p-5 shadow-card", className)}>
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-[200px] flex-1">
          <h2 className="text-[17px] font-medium text-ink-2">{title}</h2>
          <div className="text-[13px] text-ink-3">{sub}</div>
          <div className="num mt-3 text-[32px] leading-none font-semibold tracking-[-0.02em]">{fmt(total)}</div>
          <div className="mt-4 flex h-3.5 overflow-hidden rounded-[3px] bg-later-soft" role="img" aria-label={parts.map((p) => `${typeof p.label === "string" ? p.label : ""} ${fmt(p.value)}`).join(", ")}>
            {parts.map((p, i) => p.value > 0 && <div key={i} className={TONE_BAR[p.tone]} style={{ width: `${(p.value / sum) * 100}%` }} />)}
          </div>
        </div>
        <ul className="w-full space-y-2 sm:w-auto sm:min-w-[230px]">
          {parts.map((p, i) => {
            const body = (
              <>
                <span className="flex items-center gap-2 text-[14px] text-ink-2">
                  <span aria-hidden className={clsx("size-2 rounded-full", TONE_BAR[p.tone])} />
                  {p.label}
                </span>
                <span className="num text-[14px] font-semibold">{fmt(p.value)}</span>
              </>
            );
            const cls = "flex min-h-10 items-center justify-between gap-4 rounded-md border border-line px-3";
            return (
              <li key={i}>
                {p.href ? <Link href={p.href} className={clsx(cls, "hover:border-sun")}>{body}</Link> : <div className={cls}>{body}</div>}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export type FeedItem = { key: string; date: string; strong: React.ReactNode; text: React.ReactNode; note?: React.ReactNode; href?: string };

/** Brightwheel's billing activity feed: date, bold amount or tag, text, chevron. */
export function ActivityFeed({ title, sub, items, empty }: { title: string; sub: string; items: FeedItem[]; empty: string }) {
  return (
    <Panel title={<span className="text-[20px]">{title}</span>} sub={sub} flush>
      {items.length === 0 ? (
        <p className="px-5 py-4 text-ink-3">{empty}</p>
      ) : (
        <ul className="py-2">
          {items.map((it) => {
            const body = (
              <>
                <span className="num w-[60px] shrink-0 text-[14px] whitespace-nowrap text-ink-3">{it.date}</span>
                <span className="min-w-0 flex-1 text-[15px]">
                  <b>{it.strong}</b> {it.text}
                  {it.note && <span className="block text-[13px] text-ink-3">{it.note}</span>}
                </span>
                {it.href && <span aria-hidden className="text-ink-3">›</span>}
              </>
            );
            const cls = "flex min-h-11 items-start gap-3 px-5 py-2.5";
            return <li key={it.key}>{it.href ? <Link href={it.href} className={clsx(cls, "hover:bg-sun-soft/40")}>{body}</Link> : <div className={cls}>{body}</div>}</li>;
          })}
        </ul>
      )}
    </Panel>
  );
}

/** Initials in a soft circle, where Brightwheel shows the child's photo. */
export function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <span aria-hidden className={clsx("inline-flex shrink-0 items-center justify-center rounded-full bg-sun-soft font-bold text-rail-2", size === "lg" ? "size-14 text-[20px]" : "size-9 text-[14px]")}>
      {initials}
    </span>
  );
}

/** Brightwheel's blue "Actions ▾" row menu. Native <details>, no script. */
export function RowActions({ children, label = "Actions" }: { children: React.ReactNode; label?: string }) {
  return (
    <details className="group relative inline-block text-left">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 rounded-md px-2 font-bold text-sun hover:bg-sun-soft [&::-webkit-details-marker]:hidden">
        {label} <span aria-hidden className="text-[12px] transition-transform group-open:rotate-180">▾</span>
      </summary>
      <div className="absolute right-0 z-10 mt-1 min-w-[200px] rounded-lg border border-line bg-panel py-1 shadow-[0_8px_24px_rgb(13_13_13/0.12)]">{children}</div>
    </details>
  );
}

export function RowAction({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex min-h-11 items-center px-4 text-[15px] hover:bg-sun-soft">
      {children}
    </Link>
  );
}

/** Underlined tabs, as on Brightwheel's student profile. */
export function Tabs({ items }: { items: { href: string; label: React.ReactNode; on: boolean }[] }) {
  return (
    <nav className="mb-4 flex gap-1 overflow-x-auto border-b border-line">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          aria-current={t.on ? "page" : undefined}
          className={clsx("-mb-px flex min-h-11 items-center border-b-[3px] px-3 text-[15px] whitespace-nowrap", t.on ? "border-sun font-bold text-ink" : "border-transparent text-ink-2 hover:text-sun")}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

/** Amount in the mono cut. `late` paints it red. */
export function Amount({ value, late, muted, className }: { value: number; late?: boolean; muted?: boolean; className?: string }) {
  return <span className={clsx("num whitespace-nowrap", late && "text-late font-semibold", muted && "text-ink-3", className)}>{fmt(value)}</span>;
}

const STATE = {
  paid: { label: "Paid", cls: "bg-paid-soft text-paid", bar: "bg-paid" },
  partial: { label: "Part paid", cls: "bg-part-soft text-part", bar: "bg-part" },
  overdue: { label: "Overdue", cls: "bg-late-soft text-late", bar: "bg-late-bar" },
  due: { label: "Due today", cls: "bg-sun-soft text-ink", bar: "bg-sun" },
  upcoming: { label: "Upcoming", cls: "bg-later-soft text-ink-2", bar: "bg-later" },
} satisfies Record<ChargeState, { label: string; cls: string; bar: string }>;

export function StateTag({ state, children }: { state: ChargeState; children?: React.ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[13px] font-medium whitespace-nowrap", STATE[state].cls)}>
      <span aria-hidden className={clsx("size-2 rounded-[2px]", STATE[state].bar)} />
      {children ?? STATE[state].label}
    </span>
  );
}

export function Tag({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "late" | "paid" | "sun" }) {
  const cls = { neutral: "bg-later-soft text-ink-2", late: "bg-late-soft text-late", paid: "bg-paid-soft text-paid", sun: "bg-sun-soft text-ink" }[tone];
  return <span className={clsx("inline-flex rounded-md px-2 py-0.5 text-[13px] font-medium whitespace-nowrap", cls)}>{children}</span>;
}

export type StripSegment = { label: string; net: number; paid: number; state: ChargeState };

/**
 * The fee card: one segment per installment, filled by what was paid.
 * The signature of E-skool, used in every list that shows a pupil.
 */
export function FeeStrip({ segments, size = "md" }: { segments: StripSegment[]; size?: "sm" | "md" }) {
  if (!segments.length) return <span className="text-[13px] text-ink-3">No fees</span>;
  return (
    <div className={clsx("flex", size === "sm" ? "gap-0.5" : "gap-1")} role="list" aria-label="Installments">
      {segments.map((s, i) => {
        const pct = s.net ? Math.min(100, Math.round((s.paid / s.net) * 100)) : 100;
        return (
          <div
            key={i}
            role="listitem"
            title={`${s.label}: ${fmt(s.paid)} of ${fmt(s.net)} paid`}
            aria-label={`${s.label}, ${STATE[s.state].label}`}
            className={clsx(
              "relative overflow-hidden rounded-[3px]",
              size === "sm" ? "h-2.5 w-6" : "h-3.5 w-10",
              s.state === "overdue" ? "bg-late-soft ring-1 ring-late-bar/60 ring-inset" : "bg-later-soft",
            )}
          >
            <div className={clsx("absolute inset-y-0 left-0", s.state === "overdue" ? "bg-late-bar" : s.paid >= s.net ? "bg-paid-3" : "bg-paid-2")} style={{ width: `${pct}%` }} />
          </div>
        );
      })}
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-[17px] font-bold">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-md text-ink-2">{children}</div>}
    </div>
  );
}

export const th = "px-4 py-3 text-left text-[13px] font-bold text-ink-3 whitespace-nowrap";
export const td = "px-4 py-3 align-middle";
export const tr = "border-t border-line hover:bg-sun-soft/40";

export function Field({ label, hint, children, className }: { label: string; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <label className={clsx("block", className)}>
      <span className="mb-1.5 block text-[14px] font-medium text-ink-2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[13px] text-ink-3">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "block w-full min-h-11 rounded-lg border border-line-strong bg-panel px-3 text-[16px] text-ink placeholder:text-ink-3 focus:border-sun focus:outline-none focus:ring-3 focus:ring-sun/25";
