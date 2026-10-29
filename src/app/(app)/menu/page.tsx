"use client";

import Link from "next/link";
import { MENU } from "@/components/shell";

export default function MenuPage() {
  return (
    <div>
      <h1 className="mb-4 text-[28px] font-bold tracking-[-0.02em]">Menu</h1>
      <nav className="divide-y divide-line overflow-hidden rounded-box border border-line bg-panel shadow-card">
        {MENU.map((n) => (
          <Link key={n.href} href={n.href} className="flex min-h-13 items-center gap-3 px-4 text-[16px] hover:bg-sun-soft/40">
            <n.icon className="size-5 text-sun" strokeWidth={1.9} />
            {n.label}
          </Link>
        ))}
      </nav>
      <form action="/logout" method="post" className="mt-4">
        <button className="min-h-11 text-ink-2 underline">Sign out</button>
      </form>
    </div>
  );
}
