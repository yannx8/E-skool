import { redirect } from "next/navigation";
import { can, requireUser } from "@/lib/auth";
import { getSchool } from "@/lib/queries";
import { Shell } from "@/components/shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const school = await getSchool();
  if (!school) redirect("/setup");
  const user = await requireUser();
  return (
    <Shell school={school.name} user={{ name: user.name, role: user.role }} canCollect={can.collect(user)}>
      {children}
    </Shell>
  );
}
