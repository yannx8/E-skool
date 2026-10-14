import { ModuleOff } from "@/components/module-off";
import { getSettings, requirePermission } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { FinanceNav } from "./finance-nav";

export default async function FinanceLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePermission("viewFinance");
  const settings = await getSettings();
  if (!settings.module_finance)
    return <ModuleOff name="Finances" canEnable={can(user.role, "manageSetup")} />;
  return (
    <>
      <FinanceNav />
      {children}
    </>
  );
}
