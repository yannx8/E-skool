import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { addMonths, formatMonth } from "@/lib/format";

/** "< octobre 2026 >" navigation; month is YYYY-MM-01, links use ?mois=YYYY-MM. */
export function MonthNav({
  month,
  basePath,
  max,
}: {
  month: string;
  basePath: string;
  max?: string;
}) {
  const prev = addMonths(month, -1);
  const next = addMonths(month, 1);
  return (
    <div className="flex items-center gap-2">
      <Link
        href={`${basePath}?mois=${prev.slice(0, 7)}`}
        className={buttonClasses("secondary", "icon")}
        aria-label="Mois précédent"
      >
        <ChevronLeft aria-hidden />
      </Link>
      <span className="min-w-36 text-center text-lg font-semibold capitalize">
        {formatMonth(month)}
      </span>
      {max && next > max ? (
        <span
          className={buttonClasses("secondary", "icon", "pointer-events-none opacity-40")}
          aria-hidden
        >
          <ChevronRight />
        </span>
      ) : (
        <Link
          href={`${basePath}?mois=${next.slice(0, 7)}`}
          className={buttonClasses("secondary", "icon")}
          aria-label="Mois suivant"
        >
          <ChevronRight aria-hidden />
        </Link>
      )}
    </div>
  );
}
