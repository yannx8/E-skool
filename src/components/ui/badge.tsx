import { CheckCircle2, CircleDashed, Clock, XCircle } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { BALANCE_STATUSES, isBalanceStatus } from "@/lib/labels";

const TONES = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  muted: "bg-muted-soft text-muted",
  info: "bg-primary-soft text-primary",
} as const;

export function Badge({
  tone = "muted",
  icon,
  children,
  className,
}: {
  tone?: keyof typeof TONES;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium whitespace-nowrap [&_svg]:size-4",
        TONES[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Payment status per BR1: text + icon + color. */
export function StatusBadge({ status }: { status: string | null | undefined }) {
  if (!isBalanceStatus(status)) return null;
  const config = {
    solvable: { tone: "success", icon: <CheckCircle2 aria-hidden /> },
    partiel: { tone: "warning", icon: <Clock aria-hidden /> },
    insolvable: { tone: "danger", icon: <XCircle aria-hidden /> },
    pas_encore_du: { tone: "muted", icon: <CircleDashed aria-hidden /> },
  } as const;
  const c = config[status];
  return (
    <Badge tone={c.tone} icon={c.icon}>
      {BALANCE_STATUSES[status]}
    </Badge>
  );
}
