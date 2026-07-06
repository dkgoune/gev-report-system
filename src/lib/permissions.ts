import type { UserPermission } from "@/generated/prisma/enums";
import type { SessionPayload } from "@/lib/session";

export function hasPermission(
  session: SessionPayload | null,
  ...permissions: UserPermission[]
): boolean {
  if (!session) {
    return false;
  }

  if (session.systemRole === "super_admin") {
    return true;
  }

  if (Array.isArray(permissions)) {
    return permissions.some(permission =>
      session.permissions.includes(permission)
    );
  }
  return session.permissions.includes(permissions);
}

export const allPermissions: { value: UserPermission; label: string }[] = [
  // Dashboard
  { value: "dashboard_view", label: "Vue du tableau de bord" },
  { value: "dashboard_analytics_view", label: "Vue des analyses" },
  {
    value: "dashboard_evaluations_view",
    label: "Vue des évaluations du personnel",
  },

  // Users
  { value: "user_create", label: "Créer un personnel" },
  { value: "user_read", label: "Consulter les personnels" },
  { value: "user_update", label: "Modifier un personnel" },
  { value: "user_delete", label: "Supprimer un personnel" },
  { value: "user_reset_password", label: "Réinitialiser le mot de passe" },
  { value: "user_enable_disable", label: "Activer/Désactiver un personnel" },
  {
    value: "user_manage_permissions",
    label: "Gérer les permissions des personnels",
  },
  // Services
  { value: "service_create", label: "Créer un service" },
  { value: "service_read", label: "Consulter les services" },
  { value: "service_update", label: "Modifier un service" },
  { value: "service_delete", label: "Supprimer un service" },
  { value: "service_enable_disable", label: "Activer/Désactiver un service" },

  // Posts
  { value: "post_create", label: "Créer un poste" },
  { value: "post_read", label: "Consulter les postes" },
  { value: "post_update", label: "Modifier un poste" },
  { value: "post_delete", label: "Supprimer un poste" },
  { value: "post_enable_disable", label: "Activer/Désactiver un poste" },

  // Work schedules
  { value: "work_schedule_create", label: "Créer un planning" },
  { value: "work_schedule_read", label: "Consulter les plannings" },
  { value: "work_schedule_update", label: "Modifier un planning" },
  { value: "work_schedule_delete", label: "Supprimer un planning" },
  { value: "work_schedule_publish", label: "Publier un planning" },
  { value: "work_schedule_print", label: "Imprimer un planning" },

  // Reports
  { value: "report_create", label: "Créer un rapport" },
  { value: "report_read", label: "Consulter les rapports" },
  { value: "report_update", label: "Modifier un rapport" },
  { value: "report_mark_read", label: "Marquer un rapport comme lu" },
  {
    value: "report_read_all_incidents",
    label: "Consulter tous les incidents d'un rapport",
  },

  // Incidents
  { value: "incident_template_manage", label: "Gérer les modèles d'incidents" },
  {
    value: "incident_template_read",
    label: "Consulter les modèles d'incidents",
  },
  { value: "incident_binding_manage", label: "Gérer les liaisons d'incidents" },

  // Criteria
  { value: "criteria_create", label: "Créer un critère" },
  { value: "criteria_read", label: "Consulter les critères" },
  { value: "criteria_update", label: "Modifier un critère" },
  { value: "criteria_enable_disable", label: "Activer/Désactiver un critère" },

  // Evaluations
  { value: "evaluation_create", label: "Créer une évaluation" },
  { value: "evaluation_read", label: "Consulter les évaluations" },
  { value: "evaluation_cancel", label: "Annuler une évaluation" },

  // Signatures
  { value: "signature_create", label: "Créer une signature" },
  { value: "signature_read", label: "Consulter les signatures" },
  { value: "signature_update", label: "Modifier une signature" },

  // Settings
  {
    value: "settings_attendance_rules_view",
    label: "Consulter les règles de présence",
  },
  {
    value: "settings_attendance_rules_create",
    label: "Créer une règle de présence",
  },
  {
    value: "settings_attendance_rules_update",
    label: "Modifier une règle de présence",
  },
  {
    value: "settings_attendance_rules_delete",
    label: "Supprimer une règle de présence",
  },
  {
    value: "settings_attendance_rules_enable_disable",
    label: "Activer/Désactiver une règle",
  },

  // Agencies
  // { value: "agency_create", label: "Créer une agence" },
  // { value: "agency_read", label: "Consulter les agences" },
  // { value: "agency_update", label: "Modifier une agence" },
  // { value: "agency_delete", label: "Supprimer une agence" },
];

const permissionValues = new Set(
  allPermissions.map(permission => permission.value)
);

export function parseUserPermissions(value: unknown): {
  permissions: UserPermission[];
  invalid: string[];
} {
  if (!Array.isArray(value)) {
    return { permissions: [], invalid: [] };
  }

  const validPermissions = new Set<UserPermission>();
  const invalidPermissions = new Set<string>();

  for (const entry of value) {
    if (typeof entry !== "string") {
      invalidPermissions.add(String(entry));
      continue;
    }

    if (permissionValues.has(entry as UserPermission)) {
      validPermissions.add(entry as UserPermission);
    } else {
      invalidPermissions.add(entry);
    }
  }

  return {
    permissions: Array.from(validPermissions),
    invalid: [],
  };
}
