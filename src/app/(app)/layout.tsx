import { AppShell } from "@/components/app-shell";
import { getActiveYear, getSchoolYears, getSettings, requireUser } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [settings, years, activeYear] = await Promise.all([
    getSettings(),
    getSchoolYears(),
    getActiveYear(),
  ]);
  return (
    <AppShell
      role={user.role}
      userName={user.fullName || user.email}
      schoolName={settings.school_name}
      modules={{
        hr: settings.module_hr,
        finance: settings.module_finance,
        enrollment: settings.module_enrollment,
      }}
      years={years.map((y) => ({ id: y.id, label: y.label, is_current: y.is_current }))}
      activeYearId={activeYear?.id ?? null}
    >
      {children}
    </AppShell>
  );
}
