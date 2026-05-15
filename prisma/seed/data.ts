import type {
  AttendanceStatus,
  IncidentFieldType,
  IncidentTemplateVersionStatus,
  SystemRole,
  WorkScheduleStatus,
} from "../../src/generated/prisma/enums";

export type RootSeedConfig = {
  username: string;
  password: string;
  fullName: string;
};

export type SeedMembershipDefinition = {
  agencyKey: string;
  isActive: boolean;
};

export type SeedUserDefinition = {
  key: string;
  username: string;
  password: string;
  fullName: string;
  phone: string | null;
  systemRole: SystemRole;
  isActive: boolean;
  memberships: SeedMembershipDefinition[];
};

export type SeedAgencyDefinition = {
  key: string;
  name: string;
  code: string;
  isActive: boolean;
};

export type SeedServiceDefinition = {
  key: string;
  agencyKey: string;
  name: string;
  code: string;
  description: string;
  color: string;
  isActive: boolean;
  createdByKey: string;
};

export type SeedWorkPostDefinition = {
  key: string;
  agencyKey: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  createdByKey: string;
};

export type SeedCriterionDefinition = {
  key: string;
  agencyKey: string;
  name: string;
  impact: "low" | "high";
  weight: string;
  maxDaily: number;
  isActive: boolean;
  createdByKey: string;
};

export type SeedAttendanceCriterionSettingDefinition = {
  agencyKey: string;
  criterionKey: string;
  isEnabled: boolean;
  createdByKey: string;
};

export type SeedIncidentFieldDefinition = {
  key: string;
  label: string;
  type: IncidentFieldType;
  required: boolean;
  placeholder: string | null;
  options: string[];
  validation: {
    minLength: number | null;
    maxLength: number | null;
    pattern: string | null;
    minValue: number | null;
    maxValue: number | null;
  };
};

export type SeedIncidentTemplateDefinition = {
  key: string;
  agencyKey: string;
  name: string;
  code: string;
  description: string;
  icon: string | null;
  isActive: boolean;
  createdByKey: string;
};

export type SeedIncidentTemplateVersionDefinition = {
  key: string;
  templateKey: string;
  version: number;
  fields: SeedIncidentFieldDefinition[];
  status: IncidentTemplateVersionStatus;
  publishedAt: string | null;
  createdByKey: string;
};

export type SeedServiceIncidentBindingDefinition = {
  key: string;
  serviceKey: string;
  templateKey: string;
  templateVersionKey: string;
  minEntries: number;
  maxEntries: number | null;
  isRequired: boolean;
  displayOrder: number;
  isActive: boolean;
};

export type SeedWorkScheduleAssignmentDefinition = {
  userKey: string;
  postKey: string;
  isLeader: boolean;
  isSubleader: boolean;
  attendanceStatus: AttendanceStatus;
};

export type SeedWorkScheduleDefinition = {
  key: string;
  agencyKey: string;
  serviceKey: string;
  workDate: string;
  status: WorkScheduleStatus;
  createdByKey: string;
  publishedAt: string | null;
  archivedAt: string | null;
  assignments: SeedWorkScheduleAssignmentDefinition[];
};

export type SeedGeneralReportIncidentEntryDefinition = {
  templateKey: string;
  templateVersionKey: string;
  displayOrder: number;
  values: Record<string, unknown>;
};

export type SeedGeneralReportDefinition = {
  workScheduleKey: string;
  reportedByKey: string;
  readByKey: string | null;
  isRead: boolean;
  readAt: string | null;
  personnelPresent: string;
  personnelAbsent: string;
  ambianceGenerale: string;
  problemesRencontres: string;
  etatGeneralService: string;
  passationService: string;
  observationGeneral: string;
  incidentEntries: SeedGeneralReportIncidentEntryDefinition[];
};

export type SeedPersonnelEvaluationDefinition = {
  workScheduleKey: string;
  evaluatedUserKey: string;
  evaluatingLeaderKey: string;
  criterionKey: string;
  score: number;
  comment: string | null;
};

export type SeedSignatureLogDefinition = {
  workScheduleKey: string;
  userKey: string;
  slipNumber: string;
  signedAt: string | null;
  busArrivalTime: string | null;
};

function field(
  key: string,
  label: string,
  type: IncidentFieldType,
  required = true,
  placeholder: string | null = null
): SeedIncidentFieldDefinition {
  return {
    key,
    label,
    type,
    required,
    placeholder,
    options: [],
    validation: {
      minLength: type === "text" || type === "textarea" ? 2 : null,
      maxLength: type === "text" || type === "textarea" ? 400 : null,
      pattern: null,
      minValue: type === "number" ? 0 : null,
      maxValue: type === "number" ? 1000 : null,
    },
  };
}

const fieldsColisNonVus: SeedIncidentFieldDefinition[] = [
  field("immatriculation", "Immatriculation", "text", true, "LT-123-AA"),
  field("agence_depart", "Agence depart", "text", true, "Depart"),
  field("description", "Description", "textarea", true, "Description"),
  field("destinataire", "Destinataire", "text", true, "Nom destinataire"),
  field(
    "action_en_cours",
    "Action en cours",
    "textarea",
    true,
    "Action en cours"
  ),
];

const fieldsColisHorsBordereaux: SeedIncidentFieldDefinition[] = [
  field("agence_depart", "Agence depart", "text", true, "Depart"),
  field("description", "Description", "textarea", true, "Description"),
  field("destinataire", "Destinataire", "text", true, "Nom destinataire"),
  field("numero_telephone", "Numero telephone", "text", false, "+2376XXXXXXX"),
  field("action_menee", "Action menee", "textarea", true, "Action menee"),
];

const fieldsErreurDestination: SeedIncidentFieldDefinition[] = [
  field("immatriculation", "Immatriculation", "text", true, "LT-456-BB"),
  field("destination", "Destination", "text", true, "Destination actuelle"),
  field("numero_telephone", "Numero telephone", "text", false, "+2376XXXXXXX"),
  field("description", "Description", "textarea", true, "Details"),
  field(
    "destination_prevue",
    "Destination prevue",
    "text",
    true,
    "Destination prevue"
  ),
  field(
    "destination_erronee",
    "Destination erronee",
    "text",
    true,
    "Destination erronee"
  ),
];

const fieldsClassementColis: SeedIncidentFieldDefinition[] = [
  field(
    "description_classement",
    "Description classement",
    "textarea",
    true,
    "Etat du classement"
  ),
  field("zone_stockage", "Zone stockage", "text", true, "Mezzanine"),
  field("heure_limite", "Heure limite", "time", true, null),
  field("observation", "Observation", "textarea", false, "Observation"),
];

const fieldsConvoyeursAbsents: SeedIncidentFieldDefinition[] = [
  field("nom", "Nom", "text", true, "Nom convoyeur"),
  field("numero", "Numero", "text", true, "Matricule"),
  field("vehicule", "Vehicule", "text", true, "Vehicule"),
  field(
    "agence_provenance",
    "Agence provenance",
    "text",
    true,
    "Agence provenance"
  ),
];

const fieldsBordereauxNonConformes: SeedIncidentFieldDefinition[] = [
  field("numero_bordereau", "Numero bordereau", "text", true, "BOR-0001"),
  field(
    "motif_non_conformite",
    "Motif non conformite",
    "textarea",
    true,
    "Motif"
  ),
  field("signe", "Signe", "boolean", true, null),
  field("action_menee", "Action menee", "textarea", true, "Action menee"),
];

const fieldsColisVehiculesEmbarques: SeedIncidentFieldDefinition[] = [
  field("immatriculation", "Immatriculation", "text", true, "LT-789-CC"),
  field("destination", "Destination", "text", true, "Destination"),
  field("heure", "Heure", "time", true, null),
  field(
    "retour_reception_colis",
    "Retour reception colis",
    "text",
    true,
    "Retour reception"
  ),
  field(
    "presence_convoyeurs",
    "Presence convoyeurs",
    "text",
    true,
    "Present/Absent"
  ),
];

const fieldsColisRetardes: SeedIncidentFieldDefinition[] = [
  field("code_colis", "Code colis", "text", true, "PKG-1001"),
  field("description", "Description", "textarea", true, "Description"),
  field("destinataire", "Destinataire", "text", true, "Destinataire"),
  field("motif_retard", "Motif retard", "textarea", true, "Motif retard"),
  field(
    "action_en_cours",
    "Action en cours",
    "textarea",
    true,
    "Action en cours"
  ),
];

const fieldsColisNonIdentifies: SeedIncidentFieldDefinition[] = [
  field(
    "description_colis",
    "Description colis",
    "textarea",
    true,
    "Description colis"
  ),
  field(
    "motif_non_identification",
    "Motif non identification",
    "textarea",
    true,
    "Motif"
  ),
  field("action_menee", "Action menee", "textarea", true, "Action menee"),
];

const fieldsColisTransferes: SeedIncidentFieldDefinition[] = [
  field("destination", "Destination", "text", true, "Destination"),
  field("numero_bordereau", "Numero bordereau", "text", true, "BOR-0100"),
  field("nombre_colis", "Nombre colis", "number", true, null),
  field("chauffeur", "Chauffeur", "text", true, "Nom chauffeur"),
  field("statut", "Statut", "text", true, "Transfere"),
];

export function getSeedUsers(rootConfig: RootSeedConfig): SeedUserDefinition[] {
  return [
    {
      key: "root",
      username: rootConfig.username,
      password: rootConfig.password,
      fullName: rootConfig.fullName,
      phone: "+237600000001",
      systemRole: "super_admin",
      isActive: true,
      memberships: [{ agencyKey: "agency_gev_baf", isActive: true }],
    },
    {
      key: "agency_admin",
      username: "baf.admin",
      password: "Admin123!",
      fullName: "Admin Bafoussam",
      phone: "+237600000002",
      systemRole: "standard",
      isActive: true,
      memberships: [{ agencyKey: "agency_gev_baf", isActive: true }],
    },
    {
      key: "scheduler",
      username: "baf.scheduler",
      password: "Scheduler123!",
      fullName: "Scheduler Bafoussam",
      phone: "+237600000003",
      systemRole: "standard",
      isActive: true,
      memberships: [{ agencyKey: "agency_gev_baf", isActive: true }],
    },
    {
      key: "reporter",
      username: "baf.reporter",
      password: "Reporter123!",
      fullName: "Reporter Bafoussam",
      phone: "+237600000004",
      systemRole: "standard",
      isActive: true,
      memberships: [{ agencyKey: "agency_gev_baf", isActive: true }],
    },
    {
      key: "courrier_lead",
      username: "baf.courrier.lead",
      password: "Lead123!",
      fullName: "Chef Courrier",
      phone: "+237600000005",
      systemRole: "standard",
      isActive: true,
      memberships: [{ agencyKey: "agency_gev_baf", isActive: true }],
    },
    {
      key: "courrier_agent_1",
      username: "baf.courrier.1",
      password: "Agent123!",
      fullName: "Agent Courrier 1",
      phone: "+237600000006",
      systemRole: "standard",
      isActive: true,
      memberships: [{ agencyKey: "agency_gev_baf", isActive: true }],
    },
    {
      key: "courrier_agent_2",
      username: "baf.courrier.2",
      password: "Agent123!",
      fullName: "Agent Courrier 2",
      phone: "+237600000007",
      systemRole: "standard",
      isActive: true,
      memberships: [{ agencyKey: "agency_gev_baf", isActive: true }],
    },
  ];
}

export const SEED_AGENCIES: SeedAgencyDefinition[] = [
  {
    key: "agency_gev_baf",
    name: "GEV Bafoussam",
    code: "GEV_BAF",
    isActive: true,
  },
];

export const SEED_SERVICES: SeedServiceDefinition[] = [
  {
    key: "service_courrier",
    agencyKey: "agency_gev_baf",
    name: "Service Courrier",
    code: "SERVICE_COURRIER",
    description: "Service unique pour les rapports journaliers courrier.",
    color: "#0b5d52",
    isActive: true,
    createdByKey: "agency_admin",
  },
];

export const SEED_WORK_POSTS: SeedWorkPostDefinition[] = [
  {
    key: "post_coordinateur",
    agencyKey: "agency_gev_baf",
    name: "Coordinateur Courrier",
    code: "COORD_COURRIER",
    description: "Supervision operationnelle du service courrier.",
    isActive: true,
    createdByKey: "agency_admin",
  },
  {
    key: "post_convoyeur",
    agencyKey: "agency_gev_baf",
    name: "Convoyeur",
    code: "CONVOYEUR",
    description: "Prise en charge des colis et mouvements.",
    isActive: true,
    createdByKey: "agency_admin",
  },
  {
    key: "post_agent_tri",
    agencyKey: "agency_gev_baf",
    name: "Agent Tri",
    code: "AGENT_TRI",
    description: "Tri et suivi des anomalies de colis.",
    isActive: true,
    createdByKey: "agency_admin",
  },
];

export const SEED_CRITERIA: SeedCriterionDefinition[] = [
  {
    key: "ponctualite",
    agencyKey: "agency_gev_baf",
    name: "Ponctualite",
    impact: "high",
    weight: "2.00",
    maxDaily: 1,
    isActive: true,
    createdByKey: "agency_admin",
  },
  {
    key: "gestion_incident",
    agencyKey: "agency_gev_baf",
    name: "Gestion incidents",
    impact: "high",
    weight: "2.50",
    maxDaily: 2,
    isActive: true,
    createdByKey: "agency_admin",
  },
  {
    key: "discipline",
    agencyKey: "agency_gev_baf",
    name: "Discipline",
    impact: "low",
    weight: "1.25",
    maxDaily: 1,
    isActive: true,
    createdByKey: "agency_admin",
  },
];

export const SEED_ATTENDANCE_CRITERION_SETTINGS: SeedAttendanceCriterionSettingDefinition[] =
  [
    {
      agencyKey: "agency_gev_baf",
      criterionKey: "ponctualite",
      isEnabled: true,
      createdByKey: "agency_admin",
    },
    {
      agencyKey: "agency_gev_baf",
      criterionKey: "gestion_incident",
      isEnabled: true,
      createdByKey: "agency_admin",
    },
    {
      agencyKey: "agency_gev_baf",
      criterionKey: "discipline",
      isEnabled: true,
      createdByKey: "agency_admin",
    },
  ];

export const SEED_INCIDENT_TEMPLATES: SeedIncidentTemplateDefinition[] = [
  {
    key: "colis_non_vus",
    agencyKey: "agency_gev_baf",
    name: "Etat des colis non vus",
    code: "COLIS_NON_VUS",
    description: "Rapport incident: etat des colis non vus.",
    icon: "package-search",
    isActive: true,
    createdByKey: "agency_admin",
  },
  {
    key: "colis_hors_bordereaux",
    agencyKey: "agency_gev_baf",
    name: "Etat des colis hors bordereaux",
    code: "COLIS_HORS_BORDEREAUX",
    description: "Rapport incident: colis hors bordereaux.",
    icon: "clipboard-list",
    isActive: true,
    createdByKey: "agency_admin",
  },
  {
    key: "erreurs_destination",
    agencyKey: "agency_gev_baf",
    name: "Situation sur les erreurs de destination",
    code: "ERREURS_DESTINATION",
    description: "Rapport incident: erreurs de destination.",
    icon: "map-pinned",
    isActive: true,
    createdByKey: "agency_admin",
  },
  {
    key: "classement_colis",
    agencyKey: "agency_gev_baf",
    name: "Classement des colis",
    code: "CLASSEMENT_COLIS",
    description: "Rapport incident: classement des colis avant 15h.",
    icon: "boxes",
    isActive: true,
    createdByKey: "agency_admin",
  },
  {
    key: "convoyeurs_absents",
    agencyKey: "agency_gev_baf",
    name: "Etat de presence des convoyeurs absent",
    code: "CONVOYEURS_ABSENTS",
    description: "Rapport incident: presence convoyeurs absents.",
    icon: "user-x",
    isActive: true,
    createdByKey: "agency_admin",
  },
  {
    key: "bordereaux_non_conformes",
    agencyKey: "agency_gev_baf",
    name: "Etat de classement des bordereaux non conforme",
    code: "BORDEREAUX_NON_CONFORMES",
    description: "Rapport incident: bordereaux non conformes.",
    icon: "file-warning",
    isActive: true,
    createdByKey: "agency_admin",
  },
  {
    key: "colis_vehicules_embarques",
    agencyKey: "agency_gev_baf",
    name: "Situation des colis et vehicules embarques",
    code: "COLIS_VEHICULES_EMBARQUES",
    description: "Rapport incident piste: colis et vehicules embarques.",
    icon: "truck",
    isActive: true,
    createdByKey: "agency_admin",
  },
  {
    key: "colis_retardes",
    agencyKey: "agency_gev_baf",
    name: "Etat des colis retardes",
    code: "COLIS_RETARDES",
    description: "Rapport incident piste: colis retardes.",
    icon: "clock3",
    isActive: true,
    createdByKey: "agency_admin",
  },
  {
    key: "colis_non_identifies",
    agencyKey: "agency_gev_baf",
    name: "Etat des colis non identifies",
    code: "COLIS_NON_IDENTIFIES",
    description: "Rapport incident piste: colis non identifies.",
    icon: "scan-search",
    isActive: true,
    createdByKey: "agency_admin",
  },
  {
    key: "colis_transferes",
    agencyKey: "agency_gev_baf",
    name: "Etat des colis transferer",
    code: "COLIS_TRANSFERES",
    description: "Rapport incident piste: colis transferes.",
    icon: "arrow-right-left",
    isActive: true,
    createdByKey: "agency_admin",
  },
];

export const SEED_INCIDENT_TEMPLATE_VERSIONS: SeedIncidentTemplateVersionDefinition[] =
  [
    {
      key: "colis_non_vus_v1",
      templateKey: "colis_non_vus",
      version: 1,
      fields: fieldsColisNonVus,
      status: "published",
      publishedAt: "2026-05-14T08:00:00.000Z",
      createdByKey: "agency_admin",
    },
    {
      key: "colis_hors_bordereaux_v1",
      templateKey: "colis_hors_bordereaux",
      version: 1,
      fields: fieldsColisHorsBordereaux,
      status: "published",
      publishedAt: "2026-05-14T08:01:00.000Z",
      createdByKey: "agency_admin",
    },
    {
      key: "erreurs_destination_v1",
      templateKey: "erreurs_destination",
      version: 1,
      fields: fieldsErreurDestination,
      status: "published",
      publishedAt: "2026-05-14T08:02:00.000Z",
      createdByKey: "agency_admin",
    },
    {
      key: "classement_colis_v1",
      templateKey: "classement_colis",
      version: 1,
      fields: fieldsClassementColis,
      status: "published",
      publishedAt: "2026-05-14T08:03:00.000Z",
      createdByKey: "agency_admin",
    },
    {
      key: "convoyeurs_absents_v1",
      templateKey: "convoyeurs_absents",
      version: 1,
      fields: fieldsConvoyeursAbsents,
      status: "published",
      publishedAt: "2026-05-14T08:04:00.000Z",
      createdByKey: "agency_admin",
    },
    {
      key: "bordereaux_non_conformes_v1",
      templateKey: "bordereaux_non_conformes",
      version: 1,
      fields: fieldsBordereauxNonConformes,
      status: "published",
      publishedAt: "2026-05-14T08:05:00.000Z",
      createdByKey: "agency_admin",
    },
    {
      key: "colis_vehicules_embarques_v1",
      templateKey: "colis_vehicules_embarques",
      version: 1,
      fields: fieldsColisVehiculesEmbarques,
      status: "published",
      publishedAt: "2026-05-14T08:06:00.000Z",
      createdByKey: "agency_admin",
    },
    {
      key: "colis_retardes_v1",
      templateKey: "colis_retardes",
      version: 1,
      fields: fieldsColisRetardes,
      status: "published",
      publishedAt: "2026-05-14T08:07:00.000Z",
      createdByKey: "agency_admin",
    },
    {
      key: "colis_non_identifies_v1",
      templateKey: "colis_non_identifies",
      version: 1,
      fields: fieldsColisNonIdentifies,
      status: "published",
      publishedAt: "2026-05-14T08:08:00.000Z",
      createdByKey: "agency_admin",
    },
    {
      key: "colis_transferes_v1",
      templateKey: "colis_transferes",
      version: 1,
      fields: fieldsColisTransferes,
      status: "published",
      publishedAt: "2026-05-14T08:09:00.000Z",
      createdByKey: "agency_admin",
    },
  ];

export const SEED_SERVICE_INCIDENT_BINDINGS: SeedServiceIncidentBindingDefinition[] =
  [
    {
      key: "courrier_colis_non_vus",
      serviceKey: "service_courrier",
      templateKey: "colis_non_vus",
      templateVersionKey: "colis_non_vus_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 1,
      isActive: true,
    },
    {
      key: "courrier_colis_hors_bordereaux",
      serviceKey: "service_courrier",
      templateKey: "colis_hors_bordereaux",
      templateVersionKey: "colis_hors_bordereaux_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 2,
      isActive: true,
    },
    {
      key: "courrier_erreurs_destination",
      serviceKey: "service_courrier",
      templateKey: "erreurs_destination",
      templateVersionKey: "erreurs_destination_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 3,
      isActive: true,
    },
    {
      key: "courrier_classement_colis",
      serviceKey: "service_courrier",
      templateKey: "classement_colis",
      templateVersionKey: "classement_colis_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 4,
      isActive: true,
    },
    {
      key: "courrier_convoyeurs_absents",
      serviceKey: "service_courrier",
      templateKey: "convoyeurs_absents",
      templateVersionKey: "convoyeurs_absents_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 5,
      isActive: true,
    },
    {
      key: "courrier_bordereaux_non_conformes",
      serviceKey: "service_courrier",
      templateKey: "bordereaux_non_conformes",
      templateVersionKey: "bordereaux_non_conformes_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 6,
      isActive: true,
    },
    {
      key: "courrier_colis_vehicules_embarques",
      serviceKey: "service_courrier",
      templateKey: "colis_vehicules_embarques",
      templateVersionKey: "colis_vehicules_embarques_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 7,
      isActive: true,
    },
    {
      key: "courrier_colis_retardes",
      serviceKey: "service_courrier",
      templateKey: "colis_retardes",
      templateVersionKey: "colis_retardes_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 8,
      isActive: true,
    },
    {
      key: "courrier_colis_non_identifies",
      serviceKey: "service_courrier",
      templateKey: "colis_non_identifies",
      templateVersionKey: "colis_non_identifies_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 9,
      isActive: true,
    },
    {
      key: "courrier_colis_transferes",
      serviceKey: "service_courrier",
      templateKey: "colis_transferes",
      templateVersionKey: "colis_transferes_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 10,
      isActive: true,
    },
  ];

export const SEED_WORK_SCHEDULES: SeedWorkScheduleDefinition[] = [
  {
    key: "courrier_2026_05_14",
    agencyKey: "agency_gev_baf",
    serviceKey: "service_courrier",
    workDate: "2026-05-14",
    status: "published",
    createdByKey: "scheduler",
    publishedAt: "2026-05-14T06:00:00.000Z",
    archivedAt: null,
    assignments: [
      {
        userKey: "courrier_lead",
        postKey: "post_coordinateur",
        isLeader: true,
        isSubleader: false,
        attendanceStatus: "present",
      },
      {
        userKey: "courrier_agent_1",
        postKey: "post_agent_tri",
        isLeader: false,
        isSubleader: true,
        attendanceStatus: "present",
      },
      {
        userKey: "courrier_agent_2",
        postKey: "post_convoyeur",
        isLeader: false,
        isSubleader: false,
        attendanceStatus: "present",
      },
    ],
  },
  {
    key: "courrier_2026_05_15",
    agencyKey: "agency_gev_baf",
    serviceKey: "service_courrier",
    workDate: "2026-05-15",
    status: "draft",
    createdByKey: "scheduler",
    publishedAt: null,
    archivedAt: null,
    assignments: [
      {
        userKey: "courrier_lead",
        postKey: "post_coordinateur",
        isLeader: true,
        isSubleader: false,
        attendanceStatus: "scheduled",
      },
      {
        userKey: "courrier_agent_1",
        postKey: "post_agent_tri",
        isLeader: false,
        isSubleader: false,
        attendanceStatus: "scheduled",
      },
      {
        userKey: "courrier_agent_2",
        postKey: "post_convoyeur",
        isLeader: false,
        isSubleader: false,
        attendanceStatus: "scheduled",
      },
    ],
  },
];

export const SEED_GENERAL_REPORTS: SeedGeneralReportDefinition[] = [
  {
    workScheduleKey: "courrier_2026_05_14",
    reportedByKey: "reporter",
    readByKey: "agency_admin",
    isRead: true,
    readAt: "2026-05-14T18:00:00.000Z",
    personnelPresent: "Chef Courrier, Agent Courrier 1, Agent Courrier 2",
    personnelAbsent: "Aucun",
    ambianceGenerale: "Service stable et coordination correcte.",
    problemesRencontres: "Quelques anomalies de destination sur des colis.",
    etatGeneralService: "Materiel et zone de travail operationnels.",
    passationService: "Passation effectuee avec details incidents transmis.",
    observationGeneral: "Suivi strict des incidents du service courrier.",
    incidentEntries: [
      {
        templateKey: "colis_non_vus",
        templateVersionKey: "colis_non_vus_v1",
        displayOrder: 1,
        values: {
          immatriculation: "LT-123-AA",
          agence_depart: "Douala",
          description: "Deux colis non vus detectes au tri.",
          destinataire: "Client A",
          action_en_cours: "Verification avec agence de depart.",
        },
      },
      {
        templateKey: "erreurs_destination",
        templateVersionKey: "erreurs_destination_v1",
        displayOrder: 2,
        values: {
          immatriculation: "LT-456-BB",
          destination: "Bamenda",
          numero_telephone: "+237612345678",
          description: "Destination erronee sur etiquette.",
          destination_prevue: "Bafoussam",
          destination_erronee: "Bamenda",
        },
      },
      {
        templateKey: "colis_retardes",
        templateVersionKey: "colis_retardes_v1",
        displayOrder: 3,
        values: {
          code_colis: "PKG-1001",
          description: "Colis en retard suite a embouteillage.",
          destinataire: "Client B",
          motif_retard: "Retard vehicule liaison.",
          action_en_cours: "Reacheminement prioritaire.",
        },
      },
      {
        templateKey: "colis_transferes",
        templateVersionKey: "colis_transferes_v1",
        displayOrder: 4,
        values: {
          destination: "Dschang",
          numero_bordereau: "BOR-0100",
          nombre_colis: 12,
          chauffeur: "Driver 1",
          statut: "Transfere",
        },
      },
    ],
  },
];

export const SEED_PERSONNEL_EVALUATIONS: SeedPersonnelEvaluationDefinition[] = [
  {
    workScheduleKey: "courrier_2026_05_14",
    evaluatedUserKey: "courrier_agent_1",
    evaluatingLeaderKey: "courrier_lead",
    criterionKey: "gestion_incident",
    score: 5,
    comment: "Bonne gestion des incidents de destination.",
  },
  {
    workScheduleKey: "courrier_2026_05_14",
    evaluatedUserKey: "courrier_agent_2",
    evaluatingLeaderKey: "courrier_lead",
    criterionKey: "ponctualite",
    score: 4,
    comment: "Presence a l heure et suivi des transferts.",
  },
];

export const SEED_SIGNATURE_LOGS: SeedSignatureLogDefinition[] = [
  {
    workScheduleKey: "courrier_2026_05_14",
    userKey: "reporter",
    slipNumber: "SLIP-COURRIER-001",
    signedAt: "2026-05-14T18:10:00.000Z",
    busArrivalTime: "2026-05-14T07:30:00.000Z",
  },
];
