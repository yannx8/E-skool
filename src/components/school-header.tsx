/* eslint-disable @next/next/no-img-element -- logo comes from Supabase Storage, printed as-is */
import { logoUrl } from "@/lib/storage";
import { formatPhone } from "@/lib/phone";
import type { Settings } from "@/lib/auth";

/** School identity block printed at the top of receipts, payslips and reports. */
export function SchoolHeader({ settings, compact }: { settings: Settings; compact?: boolean }) {
  const logo = logoUrl(settings.logo_path);
  return (
    <div className={compact ? "text-center" : "flex items-center gap-4"}>
      {logo && (
        <img
          src={logo}
          alt=""
          className={compact ? "mx-auto mb-1 h-12 w-12 object-contain" : "h-16 w-16 shrink-0 object-contain"}
        />
      )}
      <div>
        <p className={compact ? "text-base font-bold" : "text-xl font-bold"}>{settings.school_name}</p>
        {settings.address && <p className="text-sm text-slate-600">{settings.address}</p>}
        <p className="text-sm text-slate-600">
          {[settings.phone && `Tél. ${formatPhone(settings.phone) || settings.phone}`, settings.email].filter(Boolean).join(" · ")}
        </p>
      </div>
    </div>
  );
}
