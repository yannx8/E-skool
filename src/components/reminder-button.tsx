"use client";

import { useTransition } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { logReminder } from "@/app/(app)/families/actions";
import { whatsappLink } from "@/lib/format";
import { buttonClass } from "./ui";

/** Opens WhatsApp with the message ready, and records that the family was reminded. */
export function ReminderButton({ familyId, phone, text, amountDue, compact }: { familyId: number; phone: string | null; text: string; amountDue: number; compact?: boolean }) {
  const [pending, start] = useTransition();
  if (!phone) return <span className="text-[13px] text-late">No phone number</span>;
  return (
    <button
      type="button"
      disabled={pending}
      className={buttonClass("secondary", compact ? "min-h-11 px-3 text-[14px]" : undefined)}
      onClick={() => {
        window.open(whatsappLink(phone, text), "_blank", "noopener");
        start(async () => {
          await logReminder(familyId, "WHATSAPP", amountDue);
          toast.success("Reminder logged.");
        });
      }}
    >
      <MessageCircle className="size-4 text-paid" strokeWidth={2.2} />
      {compact ? "WhatsApp" : "Remind on WhatsApp"}
    </button>
  );
}
