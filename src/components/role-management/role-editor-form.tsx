"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Square, CheckSquare } from "lucide-react";

type RoleFormState = {
  name: string;
  description: string;
  permissions: string[];
  allowedToViewRoleIds: string[];
};

type RoleEditorFormProps = {
  mode: "create" | "update";
  initialState: RoleFormState;
  roleId?: string;
  title: string;
  description: string;
  availableRoles: Array<{ id: string; name: string }>;
};

type PermissionItem = {
  value: string;
  label: string;
};

type PermissionGroup = {
  title: string;
  description: string;
  permissions: PermissionItem[];
};

const permissionGroups: PermissionGroup[] = [
  {
    title: "Tableau de Bord & Analyses",
    description: "Accès aux statistiques et graphiques d'analyse de l'agence",
    permissions: [
      { value: "dashboard_view", label: "Vue du tableau de bord" },
      { value: "dashboard_analytics_view", label: "Vue des analyses globales" },
      {
        value: "dashboard_evaluations_view",
        label: "Vue des analyses des évaluations",
      },
    ],
  },
  {
    title: "Gestion des Personnels & Rôles",
    description:
      "Création, modification, blocage et gestion des rôles de personnels",
    permissions: [
      { value: "user_create", label: "Créer un personnel" },
      { value: "user_read", label: "Consulter la liste des personnels" },
      { value: "user_update", label: "Modifier les fiches des personnels" },
      { value: "user_delete", label: "Supprimer un personnel" },
      {
        value: "user_reset_password",
        label: "Réinitialiser les mots de passe",
      },
      {
        value: "user_enable_disable",
        label: "Activer / Désactiver des comptes",
      },
      {
        value: "user_manage_permissions",
        label: "Gérer les rôles et permissions",
      },
    ],
  },
  {
    title: "Services & Postes de Travail",
    description: "Configuration des services opérationnels et des postes",
    permissions: [
      { value: "service_create", label: "Créer un service" },
      { value: "service_read", label: "Consulter les services" },
      { value: "service_update", label: "Modifier un service" },
      { value: "service_delete", label: "Supprimer un service" },
      {
        value: "service_enable_disable",
        label: "Activer / Désactiver un service",
      },
      { value: "post_create", label: "Créer un poste" },
      { value: "post_read", label: "Consulter les postes" },
      { value: "post_update", label: "Modifier un poste" },
      { value: "post_delete", label: "Supprimer un poste" },
      { value: "post_enable_disable", label: "Activer / Désactiver un poste" },
    ],
  },
  {
    title: "Planning de Travail",
    description:
      "Planification des agents et publication des plannings de service",
    permissions: [
      { value: "work_schedule_create", label: "Créer un planning" },
      { value: "work_schedule_read", label: "Consulter les plannings" },
      { value: "work_schedule_update", label: "Modifier un planning" },
      { value: "work_schedule_delete", label: "Supprimer un planning" },
      {
        value: "work_schedule_publish",
        label: "Publier officiellement un planning",
      },
      {
        value: "work_schedule_print",
        label: "Imprimer les fiches de planning",
      },
    ],
  },
  {
    title: "Rapports d'Incidents & Journaliers",
    description:
      "Saisie et lecture des rapports journaliers et paramétrage d'incidents",
    permissions: [
      { value: "report_create", label: "Rédiger un rapport journalier" },
      { value: "report_read", label: "Consulter les rapports journaliers" },
      { value: "report_update", label: "Modifier un rapport" },
      { value: "report_mark_read", label: "Marquer les rapports comme lus" },
      {
        value: "report_read_all_incidents",
        label: "Consulter tous les incidents d'un rapport",
      },
      {
        value: "incident_template_manage",
        label: "Créer et modifier des modèles d'incidents",
      },
      {
        value: "incident_template_read",
        label: "Consulter les modèles d'incidents",
      },
      {
        value: "incident_binding_manage",
        label: "Associer des incidents aux services",
      },
    ],
  },
  {
    title: "Critères & Évaluations",
    description: "Notation des agents de terrain selon les grilles de critères",
    permissions: [
      { value: "criteria_create", label: "Créer un critère d'évaluation" },
      { value: "criteria_read", label: "Consulter les critères" },
      { value: "criteria_update", label: "Modifier un critère" },
      {
        value: "criteria_enable_disable",
        label: "Activer / Désactiver un critère",
      },
      { value: "evaluation_create", label: "Évaluer un agent (saisir score)" },
      {
        value: "evaluation_read",
        label: "Consulter l'historique des évaluations",
      },
    ],
  },
  {
    title: "Signatures de Bordereaux",
    description:
      "Suivi des feuilles de route, numéros de bordereaux et arrivées de bus",
    permissions: [
      { value: "signature_create", label: "Créer une ligne de signature" },
      {
        value: "signature_read",
        label: "Consulter les feuilles de signatures",
      },
      {
        value: "signature_update",
        label: "Modifier les informations de signature",
      },
    ],
  },
  {
    title: "Paramètres Globaux",
    description:
      "Configuration des règles d'attribution de scores automatiques de présence",
    permissions: [
      {
        value: "settings_attendance_rules_view",
        label: "Consulter les règles d'absence/présence",
      },
      {
        value: "settings_attendance_rules_create",
        label: "Créer une règle d'absence",
      },
      {
        value: "settings_attendance_rules_update",
        label: "Modifier une règle",
      },
      {
        value: "settings_attendance_rules_delete",
        label: "Supprimer une règle",
      },
      {
        value: "settings_attendance_rules_enable_disable",
        label: "Activer / Désactiver une règle",
      },
    ],
  },
];

const allPermissionValues = permissionGroups.flatMap(g =>
  g.permissions.map(p => p.value)
);

export function RoleEditorForm({
  mode,
  initialState,
  roleId,
  title,
  description,
  availableRoles,
}: RoleEditorFormProps) {
  const router = useRouter();
  const [formState, setFormState] = useState<RoleFormState>(initialState);
  const [submitting, setSubmitting] = useState(false);

  const permissions = formState.permissions || [];

  function togglePermission(value: string) {
    setFormState(current => {
      const currentPermissions = current.permissions || [];
      const hasPerm = currentPermissions.includes(value);
      const nextPermissions = hasPerm
        ? currentPermissions.filter(p => p !== value)
        : [...currentPermissions, value];
      return { ...current, permissions: nextPermissions };
    });
  }

  function handleSelectGroup(group: PermissionGroup, checked: boolean) {
    const groupValues = group.permissions.map(p => p.value);
    setFormState(current => {
      const currentPermissions = current.permissions || [];
      const filtered = currentPermissions.filter(p => !groupValues.includes(p));
      const nextPermissions = checked
        ? [...filtered, ...groupValues]
        : filtered;
      return { ...current, permissions: nextPermissions };
    });
  }

  function handleSelectAll(checked: boolean) {
    setFormState(current => ({
      ...current,
      permissions: checked ? [...allPermissionValues] : [],
    }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const endpoint = mode === "create" ? "/api/roles" : `/api/roles/${roleId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formState),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(
        payload?.error ||
          (mode === "create"
            ? "Impossible de créer le rôle."
            : "Impossible de modifier le rôle.")
      );
      setSubmitting(false);
      return;
    }

    toast.success(
      mode === "create"
        ? "Rôle créé avec succès."
        : "Rôle mis à jour avec succès."
    );

    setSubmitting(false);
    router.push("/roles");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        </div>

        <Button asChild variant="outline">
          <Link href="/roles">Retour à la liste</Link>
        </Button>
      </div>

      <form className="space-y-6" onSubmit={onSubmit}>
        <section className="border border-slate-200 bg-slate-50 p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
            Détails du Rôle
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm block">
              <span className="font-medium text-slate-700">Nom du rôle *</span>
              <input
                value={formState.name}
                onChange={event =>
                  setFormState(current => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Ex. Planificateur Principal, Rapporteur"
                className="w-full border border-slate-300 px-3 py-2 bg-white text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                required
              />
            </label>

            <label className="space-y-1 text-sm block">
              <span className="font-medium text-slate-700">Description</span>
              <input
                value={formState.description}
                onChange={event =>
                  setFormState(current => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Description succincte de la fonction de ce rôle"
                className="w-full border border-slate-300 px-3 py-2 bg-white text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
              />
            </label>
          </div>
        </section>

        <section className="border border-slate-200 bg-slate-50 p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
            Limitation de Visibilité des Rapports (Optionnel)
          </h3>
          <p className="text-xs text-slate-600">
            Par défaut, un personnel disposant de la permission de lecture peut
            voir tous les rapports. Si vous sélectionnez des rôles ci-dessous,
            les personnels possédant ce rôle ne pourront voir que les rapports
            rédigés par des agents ayant les rôles sélectionnés (ainsi que leurs
            propres rapports).
          </p>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {availableRoles.map(role => {
              const isSelected =
                formState.allowedToViewRoleIds?.includes(role.id) || false;
              return (
                <label
                  key={role.id}
                  className={`flex items-start gap-3 border p-2.5 rounded-md cursor-pointer transition-colors ${
                    isSelected
                      ? "border-teal-200 bg-teal-50/10 hover:bg-teal-50/20"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {
                      setFormState(current => {
                        const list = current.allowedToViewRoleIds || [];
                        const next = list.includes(role.id)
                          ? list.filter(id => id !== role.id)
                          : [...list, role.id];
                        return { ...current, allowedToViewRoleIds: next };
                      });
                    }}
                    className="mt-0.5 size-4 text-teal-600 accent-teal-600 rounded cursor-pointer"
                  />
                  <div className="text-xs font-semibold text-slate-800">
                    {role.name}
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Permissions Associées
              </h3>
              <p className="text-xs text-slate-600">
                Sélectionnez les permissions que ce rôle accorde au personnel
                dans l'agence.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleSelectAll(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-md transition-colors bg-white"
              >
                <CheckSquare className="size-3.5 text-teal-600" />
                Tout cocher
              </button>
              <button
                type="button"
                onClick={() => handleSelectAll(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 rounded-md transition-colors bg-white"
              >
                <Square className="size-3.5 text-slate-400" />
                Tout décocher
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {permissionGroups.map(group => {
              const groupValues = group.permissions.map(p => p.value);
              const groupSelectedCount = groupValues.filter(v =>
                permissions.includes(v)
              ).length;
              const allChecked = groupSelectedCount === groupValues.length;

              return (
                <div
                  key={group.title}
                  className="border border-slate-200 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col"
                >
                  <div className="bg-slate-50 border-b border-slate-200/80 px-4 py-3 flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {group.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        {group.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectGroup(group, !allChecked)}
                      className={`text-xs font-semibold px-2 py-1 border rounded transition-colors whitespace-nowrap ${
                        allChecked
                          ? "bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {allChecked ? "Tout décocher" : "Tout cocher"}
                    </button>
                  </div>

                  <div className="p-4 space-y-3 flex-1">
                    {group.permissions.map(perm => {
                      const isChecked = permissions.includes(perm.value);
                      return (
                        <label
                          key={perm.value}
                          className={`flex items-start gap-3 border p-2.5 rounded-md cursor-pointer transition-colors ${
                            isChecked
                              ? "border-teal-200 bg-teal-50/10 hover:bg-teal-50/20"
                              : "border-slate-100 bg-slate-50/20 hover:bg-slate-50/50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(perm.value)}
                            className="mt-0.5 size-4 text-teal-600 accent-teal-600 rounded cursor-pointer"
                          />
                          <div className="text-xs">
                            <span className="font-semibold text-slate-800 block">
                              {perm.label}
                            </span>
                            <span className="text-slate-400 font-mono text-[10px] mt-0.5 block uppercase tracking-wider">
                              {perm.value}
                            </span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200">
          <Button type="submit" disabled={submitting}>
            {submitting
              ? mode === "create"
                ? "Création..."
                : "Enregistrement..."
              : mode === "create"
                ? "Créer le rôle"
                : "Enregistrer les modifications"}
          </Button>
          <Button asChild variant="outline" disabled={submitting}>
            <Link href="/roles">Annuler</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
