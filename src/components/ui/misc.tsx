import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonClasses } from "@/components/ui/button";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-5">
      {back && (
        <Link
          href={back.href}
          className="no-print mb-2 inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary"
        >
          <ChevronLeft className="size-4" aria-hidden />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 md:text-[32px] md:leading-tight">
            {title}
          </h1>
          {description && <p className="mt-1 text-base text-slate-600">{description}</p>}
        </div>
        {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <div className="mb-3 rounded-full bg-slate-100 p-3 text-slate-500 [&_svg]:size-6">
        {icon ?? <Inbox aria-hidden />}
      </div>
      <p className="text-lg font-semibold text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-md text-slate-600">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-200", className)} aria-hidden />;
}

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: "info" | "warning" | "danger" | "success";
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const tones = {
    info: "border-primary/30 bg-primary-soft text-primary-hover",
    warning: "border-warning/30 bg-warning-soft text-warning",
    danger: "border-danger/30 bg-danger-soft text-danger",
    success: "border-success/30 bg-success-soft text-success",
  };
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("rounded-lg border px-4 py-3", tones[tone], className)}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={cn(title && "mt-1", "text-[15px]")}>{children}</div>}
    </div>
  );
}

/** Responsive table wrapper: horizontal scroll on narrow screens. */
export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse text-left text-[15px]", className)} {...props} />
    </div>
  );
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold whitespace-nowrap text-slate-600",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return (
    <td
      className={cn("border-b border-slate-100 px-3 py-2.5 align-middle", className)}
      {...props}
    />
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  hrefFor,
}: {
  page: number;
  pageSize: number;
  total: number;
  hrefFor: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav
      className="no-print flex items-center justify-between gap-2 px-4 py-3"
      aria-label="Pagination"
    >
      <span className="text-sm text-slate-600">
        Page {page} sur {pages} ({total} lignes)
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link className={buttonClasses("secondary", "sm")} href={hrefFor(page - 1)}>
            <ChevronLeft aria-hidden /> Précédent
          </Link>
        ) : null}
        {page < pages ? (
          <Link className={buttonClasses("secondary", "sm")} href={hrefFor(page + 1)}>
            Suivant <ChevronRight aria-hidden />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

export function DefinitionList({ items }: { items: { label: ReactNode; value: ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map((item, i) => (
        <div key={i}>
          <dt className="text-sm text-slate-500">{item.label}</dt>
          <dd className="font-medium text-slate-900">
            {item.value || <span className="text-slate-400">-</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
