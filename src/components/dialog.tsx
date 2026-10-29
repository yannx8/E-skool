"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { buttonClass, type Tone } from "./ui";

/** A button that opens a native <dialog>. It closes itself when an ActionForm inside succeeds. */
export function Dialog({ label, title, tone, className, children }: { label: React.ReactNode; title: string; tone?: Tone; className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    const close = () => d?.close();
    d?.addEventListener("action-done", close);
    return () => d?.removeEventListener("action-done", close);
  }, []);
  return (
    <>
      <button type="button" className={className ?? buttonClass(tone)} onClick={() => ref.current?.showModal()}>
        {label}
      </button>
      <dialog ref={ref} className="m-auto w-[min(520px,calc(100vw-2rem))] rounded-box bg-panel p-0 text-ink shadow-[0_12px_40px_rgb(0_0_0/0.25)]">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-[17px] font-bold">{title}</h2>
          <button type="button" aria-label="Close" className="rounded-md p-2 text-ink-3 hover:bg-black/5" onClick={() => ref.current?.close()}>
            <X className="size-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </dialog>
    </>
  );
}
