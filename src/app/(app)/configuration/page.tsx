import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  Coins,
  Database,
  History,
  School,
  SlidersHorizontal,
  Users,
  Layers,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/misc";
import { requirePermission } from "@/lib/auth";
import { can, type Permission } from "@/lib/permissions";

export const metadata: Metadata = { title: "Configuration" };

const ITEMS: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  permission: Permission;
}[] = [
  {
    href: "/configuration/annees",
    title: "Années scolaires",
    description: "Créer l'année, choisir l'année en cours, recopier les frais.",
    icon: <CalendarDays />,
    permission: "manageSetup",
  },
  {
    href: "/configuration/classes",
    title: "Classes",
    description: "Liste des classes et ordre de passage.",
    icon: <Layers />,
    permission: "manageSetup",
  },
  {
    href: "/configuration/frais",
    title: "Frais",
    description: "Montants et échéances par classe.",
    icon: <Coins />,
    permission: "manageSetup",
  },
  {
    href: "/configuration/ecole",
    title: "École",
    description: "Nom, logo, reçus, message de relance.",
    icon: <School />,
    permission: "manageSetup",
  },
  {
    href: "/configuration/modules",
    title: "Modules",
    description: "Activer le personnel, les finances, les inscriptions, les relances automatiques.",
    icon: <SlidersHorizontal />,
    permission: "manageSetup",
  },
  {
    href: "/configuration/utilisateurs",
    title: "Utilisateurs",
    description: "Comptes et rôles (fondateur, secrétaire).",
    icon: <Users />,
    permission: "manageUsers",
  },
  {
    href: "/configuration/audit",
    title: "Journal d'audit",
    description: "Qui a modifié quoi, et quand.",
    icon: <History />,
    permission: "viewAudit",
  },
  {
    href: "/configuration/donnees",
    title: "Sauvegardes et export",
    description: "Télécharger toutes les données, voir les sauvegardes.",
    icon: <Database />,
    permission: "exportData",
  },
];

export default async function ConfigurationPage() {
  const user = await requirePermission("viewAudit");
  const items = ITEMS.filter((i) => can(user.role, i.permission));
  return (
    <>
      <PageHeader title="Configuration" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => (
          <Link key={i.href} href={i.href} className="group">
            <Card className="flex h-full gap-3 p-4 transition-colors group-hover:border-primary">
              <div className="rounded-lg bg-primary-soft p-2 text-primary [&_svg]:size-6">
                {i.icon}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{i.title}</p>
                <p className="text-sm text-slate-600">{i.description}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
