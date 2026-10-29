import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getSchool } from "@/lib/queries";
import { ActionForm } from "@/components/action-form";
import { Field, buttonClass, inputClass } from "@/components/ui";
import { login } from "./actions";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const school = await getSchool();
  if (!school) redirect("/setup");
  if (await currentUser()) redirect("/");
  return (
    <div className="grid min-h-dvh place-items-center bg-rail px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 text-rail-ink">
          <div className="text-[13px] font-bold tracking-[0.08em] text-rail-muted">E-SKOOL</div>
          <h1 className="mt-2 text-[28px] leading-tight font-bold tracking-[-0.02em]">{school.name}</h1>
        </div>
        <ActionForm action={login} className="space-y-4 rounded-box bg-panel p-6">
          <Field label="Username">
            <input name="username" required autoFocus autoCapitalize="none" autoComplete="username" className={inputClass} />
          </Field>
          <Field label="Password">
            <input name="password" type="password" required autoComplete="current-password" className={inputClass} />
          </Field>
          <button className={buttonClass("primary", "w-full")}>Sign in</button>
        </ActionForm>
        <p className="mt-4 text-[14px] text-rail-muted">Forgot your password? Ask the administrator to set a new one in Settings, Users.</p>
      </div>
    </div>
  );
}
