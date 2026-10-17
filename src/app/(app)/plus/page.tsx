import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, UserCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { MoreNav } from "./more-nav";
import { getActiveYear, getSchoolYears, getSettings, requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Plus" };

// Mobile "Plus" tab: everything that is not in the bottom bar.
export default async function MorePage() {
  const user = await requireUser();
  const [settings, years, year] = await Promise.all([
    getSettings(),
    getSchoolYears(),
    getActiveYear(),
  ]);
  return (
    <>
      <PageHeader title="Plus" />
      <MoreNav
        role={user.role}
        modules={{
          hr: settings.module_hr,
          finance: settings.module_finance,
          enrollment: settings.module_enrollment,
        }}
        years={years.map((y) => ({ id: y.id, label: y.label, is_current: y.is_current }))}
        activeYearId={year?.id ?? null}
      />
      <Card className="mt-4">
        <Link href="/compte" className="flex min-h-14 items-center gap-3 px-4">
          <UserCircle className="size-6 text-slate-500" aria-hidden />
          <span className="flex-1 font-medium">{user.fullName || user.email}</span>
          <ChevronRight className="size-5 text-slate-400" aria-hidden />
        </Link>
      </Card>
    </>
  );
}
