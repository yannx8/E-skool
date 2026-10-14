"use client";

/* eslint-disable @next/next/no-img-element -- logo preview from Supabase Storage */
import { useRef, useState, useTransition } from "react";
import { Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { ActionFeedback, SubmitButton, useFormAction, useUnsavedChangesWarning } from "@/components/ui/client";
import { createClient } from "@/lib/supabase/client";
import { downscaleImage } from "@/lib/image";
import { REMINDER_VARIABLES, renderReminderMessage } from "@/lib/reminder";
import type { Settings } from "@/lib/auth";
import { saveLogoPath, saveSchool } from "../actions";

const SAMPLE = {
  parent: "Mme Mba",
  eleve: "MBA Élodie",
  classe: "CE1",
  montant: "25 000 FCFA",
  tranche: "tranche 1",
  echeance: "15/10/2026",
  lien: "https://…/p/…",
};

export function SchoolForm({ settings }: { settings: Settings }) {
  const [state, onSubmit, pending] = useFormAction(saveSchool);
  const [template, setTemplate] = useState(settings.reminder_template);
  const [name, setName] = useState(settings.school_name);
  const [phone, setPhone] = useState(settings.phone ?? "");
  const [dirty, setDirty] = useState(false);
  const templateRef = useRef<HTMLTextAreaElement>(null);
  useUnsavedChangesWarning(dirty);

  function insertVariable(v: string) {
    const el = templateRef.current;
    const token = `{${v}}`;
    if (!el) return setTemplate((t) => t + token);
    const start = el.selectionStart ?? template.length;
    const end = el.selectionEnd ?? template.length;
    const next = template.slice(0, start) + token + template.slice(end);
    setTemplate(next);
    setDirty(true);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  }

  const preview = renderReminderMessage(template, { ...SAMPLE, ecole: name, telephone_ecole: phone });

  return (
    <form
      onSubmit={(e) => {
        setDirty(false);
        onSubmit(e);
      }}
      onChange={() => setDirty(true)}
      className="space-y-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom de l'école" htmlFor="school_name">
          <Input id="school_name" name="school_name" required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Téléphone" htmlFor="phone">
          <Input id="phone" name="phone" type="tel" maxLength={40} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="Adresse" htmlFor="address">
          <Input id="address" name="address" maxLength={200} defaultValue={settings.address ?? ""} placeholder="Quartier, ville" />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" maxLength={120} defaultValue={settings.email ?? ""} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Format des reçus" htmlFor="receipt_format">
          <Select id="receipt_format" name="receipt_format" defaultValue={settings.receipt_format}>
            <option value="a5">A5 (demi-feuille)</option>
            <option value="a4">A4</option>
            <option value="thermal">Ticket 80 mm</option>
          </Select>
        </Field>
        <Field label="Nom des périodes de paiement" htmlFor="term_label" hint="Tranche, Trimestre, Mois…">
          <Input id="term_label" name="term_label" required maxLength={30} defaultValue={settings.term_label} />
        </Field>
        <Field label="Nombre de périodes par an" htmlFor="terms_count">
          <Input id="terms_count" name="terms_count" type="number" min={1} max={12} required defaultValue={settings.terms_count} />
        </Field>
      </div>
      <Field label="Pied de page des reçus" htmlFor="receipt_footer">
        <Input id="receipt_footer" name="receipt_footer" maxLength={200} defaultValue={settings.receipt_footer ?? ""} />
      </Field>

      <div>
        <Field label="Message de relance WhatsApp" htmlFor="reminder_template" hint="Touchez une variable pour l'insérer.">
          <Textarea
            ref={templateRef}
            id="reminder_template"
            name="reminder_template"
            rows={4}
            required
            maxLength={1000}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          />
        </Field>
        <div className="mt-2 flex flex-wrap gap-2">
          {REMINDER_VARIABLES.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => insertVariable(v.key)}
              className="min-h-9 rounded-full border border-slate-300 bg-white px-3 text-sm hover:border-primary hover:text-primary"
            >
              {v.label}
            </button>
          ))}
        </div>
        <div className="mt-3 rounded-lg bg-[#dcf8c6] p-3 text-[15px] whitespace-pre-wrap text-slate-900">
          <p className="mb-1 text-xs font-semibold text-slate-500 uppercase">Aperçu</p>
          {preview}
        </div>
      </div>

      <ActionFeedback state={state} />
      <SubmitButton pending={pending}>Enregistrer</SubmitButton>
    </form>
  );
}

export function LogoUploader({ logoUrl }: { logoUrl: string | null }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  function upload(file: File | undefined) {
    if (!file) return;
    setError("");
    startTransition(async () => {
      try {
        const blob = await downscaleImage(file, 512, 0.9);
        const path = `logo/logo-${Date.now()}.jpg`;
        const supabase = createClient();
        const { error: upErr } = await supabase.storage.from("branding").upload(path, blob, {
          contentType: "image/jpeg",
          upsert: false,
        });
        if (upErr) throw upErr;
        const res = await saveLogoPath(path);
        if (!res.ok) throw new Error(res.error);
        toast.success("Logo enregistré.");
        router.refresh();
      } catch {
        setError("Envoi du logo impossible. Vérifiez la connexion et le format (image).");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex size-24 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        {logoUrl ? <img src={logoUrl} alt="Logo actuel" className="size-full object-contain" /> : <span className="text-sm text-slate-400">Aucun logo</span>}
      </div>
      <div className="flex flex-col gap-2">
        <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 font-medium hover:bg-slate-50">
          {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Upload className="size-5" aria-hidden />}
          Choisir une image
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
        </label>
        {logoUrl && (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await saveLogoPath(null);
                router.refresh();
              })
            }
          >
            <Trash2 aria-hidden /> Retirer le logo
          </Button>
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </div>
  );
}
