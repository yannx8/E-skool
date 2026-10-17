"use client";

import { useState, useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { buttonClasses, type ButtonSize } from "@/components/ui/button";
import { logReminder } from "@/app/(app)/eleves/actions";

/**
 * Opens WhatsApp with the reminder prefilled (FR-B4) and logs the click
 * (FR-B5). Delivery is not tracked: the log means "WhatsApp was opened".
 */
export function ReminderButton({
  href,
  pupilId,
  term,
  amountDue,
  size = "sm",
  label = "Relancer",
}: {
  href: string;
  pupilId: string;
  term: number | null;
  amountDue: number;
  size?: ButtonSize;
  label?: string;
}) {
  const [done, setDone] = useState(false);
  const [, startTransition] = useTransition();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        setDone(true);
        startTransition(async () => {
          await logReminder({ pupilId, term, amountDue });
        });
      }}
      className={buttonClasses("whatsapp", size)}
    >
      <MessageCircle aria-hidden />
      {done ? "Relancé" : label}
    </a>
  );
}
