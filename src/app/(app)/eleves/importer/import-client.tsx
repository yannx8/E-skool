"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, FileSpreadsheet, Loader2, XCircle } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { Alert, Table, Td, Th } from "@/components/ui/misc";
import { Badge } from "@/components/ui/badge";
import { parseImportRows, type ParsedRow } from "@/lib/import-mapping";
import { formatPhone } from "@/lib/phone";
import { importPupils, type ImportResult } from "../actions";

async function readFileRows(file: File): Promise<unknown[][]> {
  if (/\.xlsx$/i.test(file.name)) {
    const { readSheet } = await import("read-excel-file/universal");
    return (await readSheet(file)) as unknown[][];
  }
  const Papa = (await import("papaparse")).default;
  const text = await file.text();
  const parsed = Papa.parse<string[]>(text.replace(/^﻿/, ""), { skipEmptyLines: "greedy" });
  return parsed.data;
}

export function ImportClient({ classNames, yearLabel }: { classNames: string[]; yearLabel: string }) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [parseError, setParseError] = useState("");
  const [result, setResult] = useState<(ImportResult & { sent: ParsedRow[] }) | null>(null);
  const [serverError, setServerError] = useState("");
  const [pending, startTransition] = useTransition();

  const valid = rows?.filter((r) => r.errors.length === 0) ?? [];
  const invalid = rows?.filter((r) => r.errors.length > 0) ?? [];

  async function onFile(file: File | undefined) {
    setRows(null);
    setResult(null);
    setParseError("");
    setServerError("");
    if (!file) return;
    setFileName(file.name);
    try {
      const raw = await readFileRows(file);
      const { rows: parsed, missingColumns } = parseImportRows(raw, classNames);
      if (missingColumns.length) {
        setParseError(`Colonnes introuvables : ${missingColumns.join(", ")}. Utilisez le modèle ou renommez les en-têtes.`);
        return;
      }
      if (parsed.length === 0) {
        setParseError("Le fichier ne contient aucune ligne d'élève.");
        return;
      }
      if (parsed.length > 2000) {
        setParseError("2000 lignes maximum par import. Découpez le fichier.");
        return;
      }
      setRows(parsed);
    } catch {
      setParseError("Lecture impossible. Enregistrez le fichier au format .xlsx ou .csv puis réessayez.");
    }
  }

  function submit() {
    setServerError("");
    startTransition(async () => {
      const res = await importPupils(
        valid.map((r) => ({
          last_name: r.last_name,
          first_name: r.first_name,
          class_name: r.class_name,
          parent_name: r.parent_name,
          parent_phone: r.parent_phone,
          notes: r.notes,
        })),
      );
      if (!res.ok) setServerError(res.error);
      else if (res.data) {
        setResult({ ...res.data, sent: valid });
        setRows(null);
      }
    });
  }

  if (result) {
    return (
      <div className="space-y-4">
        <Alert tone={result.rejected.length ? "warning" : "success"} title={`${result.inserted} élève(s) importé(s) pour ${yearLabel}`}>
          {result.rejected.length > 0
            ? `${result.rejected.length} ligne(s) refusée(s) par le serveur, détail ci-dessous.`
            : "Toutes les lignes valides ont été importées."}
        </Alert>
        {result.rejected.length > 0 && (
          <ul className="space-y-1 text-[15px]">
            {result.rejected.map((r) => {
              const src = result.sent[r.row - 1];
              return (
                <li key={r.row}>
                  Ligne {src?.line ?? r.row} ({src ? `${src.last_name} ${src.first_name}` : ""}) : {r.reason}
                </li>
              );
            })}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <Link href="/eleves" className={buttonClasses("primary")}>
            Voir les élèves
          </Link>
          <Button variant="secondary" onClick={() => setResult(null)}>
            Importer un autre fichier
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ol className="list-decimal space-y-1 pl-5 text-slate-700">
        <li>
          Téléchargez le{" "}
          <a href="/modele-eleves.csv" download className="font-medium text-primary underline">
            modèle de fichier
          </a>{" "}
          ou utilisez votre fichier Excel : il faut au moins les colonnes <strong>Nom</strong> et <strong>Classe</strong>.
        </li>
        <li>Les classes doivent exister : {classNames.join(", ") || "aucune classe créée"}.</li>
        <li>Vérifiez l&apos;aperçu puis importez les lignes valides.</li>
      </ol>

      <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-white p-6 text-center hover:border-primary">
        <FileSpreadsheet className="size-8 text-slate-400" aria-hidden />
        <span className="font-medium">{fileName || "Choisir un fichier .xlsx ou .csv"}</span>
        <input
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>

      {parseError && <Alert tone="danger">{parseError}</Alert>}
      {serverError && <Alert tone="danger">{serverError}</Alert>}

      {rows && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone="success" icon={<CheckCircle2 aria-hidden />}>
              {valid.length} ligne(s) valide(s)
            </Badge>
            {invalid.length > 0 && (
              <Badge tone="danger" icon={<XCircle aria-hidden />}>
                {invalid.length} ligne(s) avec erreur
              </Badge>
            )}
            <Button className="ml-auto" onClick={submit} disabled={pending || valid.length === 0}>
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              Importer les {valid.length} lignes valides
            </Button>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white">
            <Table>
              <thead>
                <tr>
                  <Th>Ligne</Th>
                  <Th>Nom</Th>
                  <Th>Prénom</Th>
                  <Th>Classe</Th>
                  <Th>Parent</Th>
                  <Th>Téléphone</Th>
                  <Th>Contrôle</Th>
                </tr>
              </thead>
              <tbody>
                {[...invalid, ...valid].slice(0, 500).map((r) => (
                  <tr key={r.line} className={r.errors.length ? "bg-danger-soft/40" : ""}>
                    <Td>{r.line}</Td>
                    <Td className="font-medium">{r.last_name}</Td>
                    <Td>{r.first_name}</Td>
                    <Td>{r.class_name}</Td>
                    <Td>{r.parent_name}</Td>
                    <Td>{formatPhone(r.parent_phone)}</Td>
                    <Td>
                      {r.errors.length ? (
                        <span className="text-sm font-medium text-danger">{r.errors.join(" · ")}</span>
                      ) : (
                        <span className="text-sm text-success">OK</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          {rows.length > 500 && <p className="text-sm text-slate-500">Aperçu limité aux 500 premières lignes (erreurs en premier).</p>}
        </>
      )}
    </div>
  );
}
