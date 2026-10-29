import { requireUser } from "@/lib/auth";

export default async function PrintLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <div className="min-h-dvh bg-white">{children}</div>;
}
