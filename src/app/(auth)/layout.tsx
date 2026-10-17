import { GraduationCap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-primary">
        <GraduationCap className="size-8" aria-hidden />
        <span className="text-2xl font-bold">E-skool</span>
      </div>
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-[var(--shadow-card)]">
        {children}
      </div>
    </main>
  );
}
