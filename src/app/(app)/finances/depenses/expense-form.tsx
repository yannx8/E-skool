"use client";

import { useState, useTransition } from "react";
import { Camera, CheckCircle2, Loader2 } from "lucide-react";
import { Field, Input, Select } from "@/components/ui/form";
import { ActionFeedback, MoneyInput, SubmitButton, useFormAction } from "@/components/ui/client";
import { createClient } from "@/lib/supabase/client";
import { downscaleImage } from "@/lib/image";
import { PAYMENT_METHODS } from "@/lib/labels";
import { recordExpense } from "../actions";

export function ExpenseForm({ categories, today }: { categories: { id: string; name: string }[]; today: string }) {
  const [state, onSubmit, pending] = useFormAction(recordExpense);
  const [receiptPath, setReceiptPath] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [uploading, startUpload] = useTransition();
  const [formKey, setFormKey] = useState(0);
  const [lastOk, setLastOk] = useState<typeof state>(null);

  // New empty form after each saved expense.
  if (state?.ok && state !== lastOk) {
    setLastOk(state);
    setFormKey((k) => k + 1);
    setReceiptPath("");
  }

  function upload(file: File | undefined) {
    if (!file) return;
    setUploadError("");
    startUpload(async () => {
      try {
        const blob = await downscaleImage(file);
        const path = `${today.slice(0, 4)}/${today.slice(5, 7)}/${crypto.randomUUID()}.jpg`;
        const { error } = await createClient().storage.from("expense-receipts").upload(path, blob, { contentType: "image/jpeg" });
        if (error) throw error;
        setReceiptPath(path);
      } catch {
        setUploadError("Envoi de la photo impossible. Vous pouvez enregistrer la dépense sans photo.");
      }
    });
  }

  return (
    <form key={formKey} onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="receipt_path" value={receiptPath} />
      <Field label="Catégorie" htmlFor="category_id">
        <Select id="category_id" name="category_id" required defaultValue="">
          <option value="" disabled>
            Choisir
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Montant" htmlFor="amount">
        <MoneyInput name="amount" id="amount" required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Mode" htmlFor="method">
          <Select id="method" name="method" defaultValue="cash">
            {Object.entries(PAYMENT_METHODS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date" htmlFor="spent_on">
          <Input id="spent_on" name="spent_on" type="date" defaultValue={today} max={today} required />
        </Field>
      </div>
      <Field label="Description" htmlFor="description">
        <Input id="description" name="description" maxLength={300} placeholder="Ex. 2 paquets de craie" />
      </Field>
      <div>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 font-medium hover:bg-slate-50">
          {uploading ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : receiptPath ? (
            <CheckCircle2 className="size-5 text-success" aria-hidden />
          ) : (
            <Camera className="size-5" aria-hidden />
          )}
          {receiptPath ? "Photo du reçu ajoutée" : "Photo du reçu (facultatif)"}
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => upload(e.target.files?.[0])} />
        </label>
        {uploadError && <p className="mt-1 text-sm text-danger">{uploadError}</p>}
      </div>
      <ActionFeedback state={state} />
      <SubmitButton pending={pending} disabled={uploading}>
        Enregistrer la dépense
      </SubmitButton>
    </form>
  );
}
