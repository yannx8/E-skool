import "server-only";
import { unstable_rethrow } from "next/navigation";
import type { ActionResult } from "@/components/action-form";

/** Run a server action body and turn thrown errors into a message for the form. */
export async function act(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await fn();
  } catch (e) {
    unstable_rethrow(e);
    const code = (e as { code?: string }).code;
    if (code === "P2002") return { error: "This already exists. Use another name or number." };
    console.error(e);
    return { error: e instanceof Error && !code ? e.message : "Something went wrong. Nothing was saved." };
  }
}

export const str = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};

export const int = (fd: FormData, k: string) => {
  const v = str(fd, k);
  if (v === null) return null;
  const n = Number(v.replace(/[\s,]/g, ""));
  if (!Number.isInteger(n) || n < 0) throw new Error(`"${v}" is not a valid amount.`);
  return n;
};

export const need = <T,>(v: T | null, what: string): T => {
  if (v === null) throw new Error(`${what} is required.`);
  return v;
};
