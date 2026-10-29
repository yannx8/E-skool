"use client";

import { useEffect } from "react";
import { buttonClass } from "@/components/ui";

/** Toolbar above a printable page; opens the print dialog once on arrival. */
export function PrintBar({ back, auto = true, size }: { back: string; auto?: boolean; size?: "A5" | "A4" | "80mm" }) {
  useEffect(() => {
    if (auto) setTimeout(() => window.print(), 300);
  }, [auto]);
  return (
    <>
      {size && <style>{`@page { size: ${size === "80mm" ? "80mm auto" : size}; margin: ${size === "80mm" ? "2mm" : "8mm"}; }`}</style>}
      <div className="no-print flex items-center justify-between gap-3 border-b border-line bg-ground px-4 py-3">
        <a href={back} className="text-ink-2 underline">
          ← Back
        </a>
        <button className={buttonClass("primary")} onClick={() => window.print()}>
          Print
        </button>
      </div>
    </>
  );
}
