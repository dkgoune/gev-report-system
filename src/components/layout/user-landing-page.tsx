import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import type { UserPermission } from "@/generated/prisma/enums";
import { allPermissions, hasPermission } from "@/lib/permissions";
import type { SessionPayload } from "@/lib/session";

const PERMISSION_GROUPS: {
  key: string;
  title: string;
  description: string;
  prefixes: string[];
}[] = [
  {
    key: "dashboard",
    title: "Tableau de bord",
    description: "Analyse, indicateurs et vues d'ensemble",
    prefixes: ["dashboard_"],
  },
  {
    key: "users",
    title: "Gestion du personnel",
    description: "Création, consultation et administration des comptes",
    prefixes: ["user_"],
  },
  {
    key: "services",
    title: "Services, postes et plannings",
    description: "Configuration opérationnelle de l'agence",
    prefixes: ["service_", "post_", "work_schedule_"],
  },
  {
    key: "reports",
    title: "Rapports et incidents",
    description: "Saisie, consultation et gestion des incidents",
    prefixes: ["report_", "incident_"],
  },
  {
    key: "evaluations",
    title: "Critères et évaluations",
    description: "Pilotage qualité, critères et suivi des performances",
    prefixes: ["criteria_", "evaluation_"],
  },
  {
    key: "signatures",
    title: "Signatures",
    description: "Gestion des signatures de bordereaux",
    prefixes: ["signature_"],
  },
  {
    key: "settings",
    title: "Paramètres",
    description: "Règles de présence et réglages système",
    prefixes: ["settings_"],
  },
  {
    key: "agencies",
    title: "Agences",
    description: "Administration multi-agence",
    prefixes: ["agency_"],
  },
];

const QUICK_ACTIONS: {
  href: string;
  title: string;
  description: string;
  permissions?: UserPermission[];
}[] = [
  {
    href: "/dashboard",
    title: "Vue d'ensemble",
    description: "Consulter les indicateurs consolidés",
    permissions: ["dashboard_view"],
  },
  {
    href: "/reports",
    title: "Rapports",
    description: "Accéder aux rapports de votre périmètre",
    permissions: ["report_read", "report_create"],
  },
  {
    href: "/work-schedules",
    title: "Planning",
    description: "Afficher les plannings et affectations",
    permissions: ["work_schedule_read", "work_schedule_create"],
  },
  {
    href: "/evaluations",
    title: "Évaluations",
    description: "Consulter ou saisir des évaluations",
    permissions: ["evaluation_read", "evaluation_create"],
  },
  {
    href: "/settings",
    title: "Paramètres",
    description: "Gérer les paramètres de présence",
    permissions: ["settings_attendance_rules_view"],
  },
  {
    href: "/signatures",
    title: "Signatures",
    description: "Consulter les signatures enregistrées",
    permissions: ["signature_read", "signature_create"],
  },
];

const permissionLabelMap = new Map(
  allPermissions.map(permission => [permission.value, permission.label])
);

function getPermissionLabel(permission: UserPermission): string {
  return permissionLabelMap.get(permission) ?? permission;
}

function getPermissionGroup(permission: UserPermission): string {
  const group = PERMISSION_GROUPS.find(item =>
    item.prefixes.some(prefix => permission.startsWith(prefix))
  );

  return group?.key ?? "other";
}

export default function UserLandingPageComponent({
  session,
}: {
  session: SessionPayload;
}) {
  const sortedPermissions = [
    ...(session.systemRole == "super_admin"
      ? allPermissions.map(p => p.value)
      : session.permissions),
  ].sort((a, b) =>
    getPermissionLabel(a).localeCompare(getPermissionLabel(b), "fr")
  );

  const groupedPermissions = new Map<string, UserPermission[]>();
  for (const permission of sortedPermissions) {
    const key = getPermissionGroup(permission);
    const existing = groupedPermissions.get(key) ?? [];
    groupedPermissions.set(key, [...existing, permission]);
  }

  const visibleGroups = [
    ...PERMISSION_GROUPS.filter(group => groupedPermissions.has(group.key)),
    ...(groupedPermissions.has("other")
      ? [
          {
            key: "other",
            title: "Autres autorisations",
            description: "Permissions disponibles hors catégories standards",
            prefixes: [],
          },
        ]
      : []),
  ];

  const availableActions = QUICK_ACTIONS.filter(action => {
    if (!action.permissions) {
      return true;
    }

    return hasPermission(session, ...action.permissions);
  });

  return (
    <div className="space-y-6 pb-8">
      <section className="overflow-hidden border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-teal-900/90 text-white">
        <div className="grid gap-6 p-5 md:grid-cols-[1.6fr_1fr] md:p-7">
          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Bonjour {session.username}
            </h1>
            <p className="max-w-2xl text-sm text-slate-100/90 md:text-base">
              Cet espace est accessible pour tous les utilisateurs authentifiés.
              Vous y retrouvez votre profil, vos droits actuels et des accès
              rapides adaptés à vos permissions.
            </p>
          </div>
        </div>
      </section>

      {availableActions.length > 0 ? (
        <section className="space-y-4 border border-slate-200 bg-white p-4 md:p-5">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Accès rapides</h2>
            <p className="text-sm text-slate-600">
              Raccourcis disponibles selon votre profil d'autorisation.
            </p>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {availableActions.map(action => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group border border-slate-200 bg-slate-50 p-4 transition hover:border-teal-300 hover:bg-teal-50/60"
                >
                  <p className="inline-flex items-center gap-2 text-base font-semibold text-slate-900">
                    {action.title}
                    <ArrowRight className="size-4 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-teal-700" />
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {action.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>{" "}
        </section>
      ) : undefined}

      <section className="space-y-4 border border-slate-200 bg-white p-4 md:p-5">
        <div className="space-y-1">
          <h2 className="inline-flex items-center gap-2 text-xl font-bold text-slate-900">
            <ShieldCheck className="size-5 text-teal-700" />
            Vos permissions
          </h2>
          <p className="text-sm text-slate-600">
            Liste détaillée des permissions accordées à votre session.
          </p>
        </div>

        {sortedPermissions.length > 0 ? (
          <div className="space-y-4">
            {visibleGroups.map(group => (
              <article
                key={group.key}
                className="border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-3 space-y-1">
                  <h3 className="text-base font-semibold text-slate-900">
                    {group.title}
                  </h3>
                  <p className="text-xs text-slate-600">{group.description}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(groupedPermissions.get(group.key) ?? []).map(permission => (
                    <span
                      key={permission}
                      className="inline-flex items-center border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
                      title={permission}
                    >
                      {getPermissionLabel(permission)}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            Aucune permission active n'est présente dans la session actuelle.
          </div>
        )}
      </section>
    </div>
  );
}
