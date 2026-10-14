import type { Metadata } from "next";
import { Download } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert, EmptyState, PageHeader } from "@/components/ui/misc";
import { buttonClasses } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Sauvegardes et export" };

export default async function DataPage() {
  await requirePermission("exportData");
  const env = serverEnv();
  let backups: { name: string; created_at: string; url: string; size: number }[] = [];
  if (env.serviceRoleKey) {
    const admin = createAdminClient();
    const { data } = await admin.storage
      .from("backups")
      .list("", { limit: 20, sortBy: { column: "created_at", order: "desc" } });
    const files = (data ?? []).filter((f) => f.name.endsWith(".zip"));
    if (files.length) {
      const { data: signed } = await admin.storage.from("backups").createSignedUrls(
        files.map((f) => f.name),
        300,
      );
      backups = files.map((f, i) => ({
        name: f.name,
        created_at: f.created_at ?? "",
        url: signed?.[i]?.signedUrl ?? "",
        size: Number((f.metadata as { size?: number } | null)?.size ?? 0),
      }));
    }
  }

  return (
    <>
      <PageHeader
        title="Sauvegardes et export"
        description="Gardez une copie des données hors de l'application."
        back={{ href: "/configuration", label: "Configuration" }}
      />
      <div className="max-w-3xl space-y-6">
        <Card>
          <CardHeader
            title="Exporter maintenant"
            description="Un fichier .zip avec un tableau (CSV) par type de donnée, lisible dans Excel."
          />
          <CardBody>
            <a href="/api/export/donnees" className={buttonClasses("primary")}>
              <Download aria-hidden /> Télécharger toutes les données
            </a>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Sauvegardes automatiques"
            description={
              env.backupEmail
                ? `Chaque semaine, une sauvegarde est enregistrée ici et envoyée à ${env.backupEmail}.`
                : "Chaque semaine, une sauvegarde est enregistrée ici. Renseignez BACKUP_EMAIL pour la recevoir aussi par email."
            }
          />
          {!env.serviceRoleKey ? (
            <CardBody>
              <Alert tone="warning">
                La clé SUPABASE_SECRET_KEY n&apos;est pas configurée sur le serveur.
              </Alert>
            </CardBody>
          ) : backups.length === 0 ? (
            <EmptyState
              title="Aucune sauvegarde pour l'instant"
              description="La première sera créée lors du prochain passage automatique (lundi matin)."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {backups.map((b) => (
                <li key={b.name} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="font-medium">{b.name}</p>
                    <p className="text-sm text-slate-500">
                      {formatDateTime(b.created_at)} · {Math.max(1, Math.round(b.size / 1024))} Ko
                    </p>
                  </div>
                  {b.url && (
                    <a href={b.url} className={buttonClasses("secondary", "sm")}>
                      <Download aria-hidden /> Télécharger
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
