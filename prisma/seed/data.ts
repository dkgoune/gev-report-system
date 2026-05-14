import type {
  AttendanceStatus,
  IncidentFieldType,
  IncidentTemplateVersionStatus,
  MembershipRole,
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
  role: MembershipRole;
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

const generalTextFields: SeedIncidentFieldDefinition[] = [
  {
    key: "description",
    label: "Description",
    type: "textarea",
    required: true,
    placeholder: "Describe the incident",
    options: [],
    validation: {
      minLength: 5,
      maxLength: 400,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "action_en_cours",
    label: "Action en cours",
    type: "textarea",
    required: true,
    placeholder: "Describe the current corrective action",
    options: [],
    validation: {
      minLength: 5,
      maxLength: 400,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
];

const nonVuFields: SeedIncidentFieldDefinition[] = [
  {
    key: "immatriculation",
    label: "Immatriculation",
    type: "text",
    required: true,
    placeholder: "KA-1234-B",
    options: [],
    validation: {
      minLength: 3,
      maxLength: 30,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "agence_depart",
    label: "Agence depart",
    type: "text",
    required: true,
    placeholder: "Dakar",
    options: [],
    validation: {
      minLength: 2,
      maxLength: 60,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  ...generalTextFields.map(field => ({ ...field })),
  {
    key: "destinataire",
    label: "Destinataire",
    type: "text",
    required: false,
    placeholder: "Receiver name",
    options: [],
    validation: {
      minLength: 2,
      maxLength: 100,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
];

const horsBordereauFields: SeedIncidentFieldDefinition[] = [
  {
    key: "agence_depart",
    label: "Agence depart",
    type: "text",
    required: true,
    placeholder: "Dakar",
    options: [],
    validation: {
      minLength: 2,
      maxLength: 60,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "description",
    label: "Description",
    type: "textarea",
    required: true,
    placeholder: "Parcel description",
    options: [],
    validation: {
      minLength: 5,
      maxLength: 400,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "destinataire",
    label: "Destinataire",
    type: "text",
    required: true,
    placeholder: "Receiver name",
    options: [],
    validation: {
      minLength: 2,
      maxLength: 100,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "numero_telephone",
    label: "Numero de telephone",
    type: "text",
    required: false,
    placeholder: "+2217XXXXXXX",
    options: [],
    validation: {
      minLength: 8,
      maxLength: 20,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  ...generalTextFields.slice(1).map(field => ({ ...field })),
];

const erreurDestinationFields: SeedIncidentFieldDefinition[] = [
  {
    key: "immatriculation",
    label: "Immatriculation",
    type: "text",
    required: true,
    placeholder: "KA-1234-B",
    options: [],
    validation: {
      minLength: 3,
      maxLength: 30,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "destination",
    label: "Destination",
    type: "text",
    required: false,
    placeholder: "Mbour",
    options: [],
    validation: {
      minLength: 2,
      maxLength: 100,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "numero_telephone",
    label: "Numero de telephone",
    type: "text",
    required: false,
    placeholder: "+2217XXXXXXX",
    options: [],
    validation: {
      minLength: 8,
      maxLength: 20,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "description",
    label: "Description",
    type: "textarea",
    required: true,
    placeholder: "Describe the routing issue",
    options: [],
    validation: {
      minLength: 5,
      maxLength: 400,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "destination_prevue",
    label: "Destination prevue",
    type: "text",
    required: false,
    placeholder: "Expected destination",
    options: [],
    validation: {
      minLength: 2,
      maxLength: 100,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "destination_erronee",
    label: "Destination erronee",
    type: "text",
    required: false,
    placeholder: "Wrong destination",
    options: [],
    validation: {
      minLength: 2,
      maxLength: 100,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
];

const vehiculeEmbarqueFields: SeedIncidentFieldDefinition[] = [
  {
    key: "immatriculation",
    label: "Immatriculation",
    type: "text",
    required: true,
    placeholder: "KA-1234-B",
    options: [],
    validation: {
      minLength: 3,
      maxLength: 30,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "destination",
    label: "Destination",
    type: "text",
    required: true,
    placeholder: "Thiès",
    options: [],
    validation: {
      minLength: 2,
      maxLength: 100,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "heure",
    label: "Heure",
    type: "time",
    required: true,
    placeholder: null,
    options: [],
    validation: {
      minLength: null,
      maxLength: null,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "retour_reception_colis",
    label: "Retour de reception des colis",
    type: "text",
    required: true,
    placeholder: "OK / pending",
    options: [],
    validation: {
      minLength: 2,
      maxLength: 120,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "presence_convoyeurs",
    label: "Presence de convoyeurs",
    type: "text",
    required: true,
    placeholder: "Present / absent",
    options: [],
    validation: {
      minLength: 2,
      maxLength: 120,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
];

const colisRetardeFields: SeedIncidentFieldDefinition[] = [
  {
    key: "code_colis",
    label: "Code colis",
    type: "text",
    required: true,
    placeholder: "PKG-8841",
    options: [],
    validation: {
      minLength: 3,
      maxLength: 40,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "description",
    label: "Description",
    type: "textarea",
    required: true,
    placeholder: "Describe the delayed parcel",
    options: [],
    validation: {
      minLength: 5,
      maxLength: 400,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "destinataire",
    label: "Destinataire",
    type: "text",
    required: true,
    placeholder: "Receiver name",
    options: [],
    validation: {
      minLength: 2,
      maxLength: 100,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "motif_du_retard",
    label: "Motif du retard",
    type: "textarea",
    required: true,
    placeholder: "Reason for the delay",
    options: [],
    validation: {
      minLength: 5,
      maxLength: 400,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "action_en_cours",
    label: "Action en cours",
    type: "textarea",
    required: true,
    placeholder: "Current action",
    options: [],
    validation: {
      minLength: 5,
      maxLength: 400,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
];

const colisNonIdentifieFields: SeedIncidentFieldDefinition[] = [
  {
    key: "description_du_colis",
    label: "Description du colis",
    type: "textarea",
    required: true,
    placeholder: "Describe the parcel",
    options: [],
    validation: {
      minLength: 5,
      maxLength: 400,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "motif_de_non_identification",
    label: "Motif de non identification",
    type: "textarea",
    required: true,
    placeholder: "Why the parcel was not identified",
    options: [],
    validation: {
      minLength: 5,
      maxLength: 400,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "action_menee",
    label: "Action menee",
    type: "textarea",
    required: true,
    placeholder: "Action taken",
    options: [],
    validation: {
      minLength: 5,
      maxLength: 400,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
];

const colisTransfereFields: SeedIncidentFieldDefinition[] = [
  {
    key: "destination",
    label: "Destination",
    type: "text",
    required: true,
    placeholder: "Destination",
    options: [],
    validation: {
      minLength: 2,
      maxLength: 100,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "numero_de_bordereau",
    label: "Numero de bordereau",
    type: "text",
    required: true,
    placeholder: "BORD-2026-01",
    options: [],
    validation: {
      minLength: 3,
      maxLength: 60,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "nombre_de_colis",
    label: "Nombre de colis",
    type: "number",
    required: true,
    placeholder: null,
    options: [],
    validation: {
      minLength: null,
      maxLength: null,
      pattern: null,
      minValue: 1,
      maxValue: 500,
    },
  },
  {
    key: "chauffeur",
    label: "Chauffeur",
    type: "text",
    required: true,
    placeholder: "Driver name",
    options: [],
    validation: {
      minLength: 2,
      maxLength: 100,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "statut",
    label: "Statut",
    type: "text",
    required: true,
    placeholder: "Transferred / pending",
    options: [],
    validation: {
      minLength: 2,
      maxLength: 60,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
];

const convoyeurAbsentFields: SeedIncidentFieldDefinition[] = [
  {
    key: "nom",
    label: "Nom",
    type: "text",
    required: true,
    placeholder: "Name",
    options: [],
    validation: {
      minLength: 2,
      maxLength: 100,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "numero",
    label: "Numero",
    type: "text",
    required: true,
    placeholder: "Number",
    options: [],
    validation: {
      minLength: 2,
      maxLength: 40,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "vehicule",
    label: "Vehicule",
    type: "text",
    required: true,
    placeholder: "Vehicle",
    options: [],
    validation: {
      minLength: 2,
      maxLength: 80,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "agence_de_provenance",
    label: "Agence de provenance",
    type: "text",
    required: true,
    placeholder: "Origin agency",
    options: [],
    validation: {
      minLength: 2,
      maxLength: 80,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
];

const bordereauNonConformeFields: SeedIncidentFieldDefinition[] = [
  {
    key: "numero_de_bordereau",
    label: "Numero de bordereau",
    type: "text",
    required: true,
    placeholder: "BORD-2026-01",
    options: [],
    validation: {
      minLength: 3,
      maxLength: 60,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "motif_de_non_conformite",
    label: "Motif de non conformite",
    type: "textarea",
    required: true,
    placeholder: "Reason for non compliance",
    options: [],
    validation: {
      minLength: 5,
      maxLength: 400,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
  {
    key: "action_menee",
    label: "Action menee",
    type: "textarea",
    required: true,
    placeholder: "Action taken",
    options: [],
    validation: {
      minLength: 5,
      maxLength: 400,
      pattern: null,
      minValue: null,
      maxValue: null,
    },
  },
];

export function getSeedUsers(rootConfig: RootSeedConfig): SeedUserDefinition[] {
  return [
    {
      key: "root",
      username: rootConfig.username,
      password: rootConfig.password,
      fullName: rootConfig.fullName,
      phone: "+221700000001",
      systemRole: "super_admin",
      isActive: true,
      memberships: [{ agencyKey: "agency_gev", role: "admin", isActive: true }],
    },
    {
      key: "ops_admin",
      username: "ops.admin",
      password: "Admin123!",
      fullName: "Awa Ndiaye",
      phone: "+221700000002",
      systemRole: "standard",
      isActive: true,
      memberships: [{ agencyKey: "agency_gev", role: "admin", isActive: true }],
    },
    {
      key: "ops_scheduler",
      username: "ops.scheduler",
      password: "Scheduler123!",
      fullName: "Moussa Diop",
      phone: "+221700000003",
      systemRole: "standard",
      isActive: true,
      memberships: [
        { agencyKey: "agency_gev", role: "scheduler", isActive: true },
      ],
    },
    {
      key: "ops_reporter",
      username: "ops.reporter",
      password: "Reporter123!",
      fullName: "Fatou Sow",
      phone: "+221700000004",
      systemRole: "standard",
      isActive: true,
      memberships: [
        { agencyKey: "agency_gev", role: "reporter", isActive: true },
      ],
    },
    {
      key: "retrait_dla_worker",
      username: "retrait.dla",
      password: "Worker123!",
      fullName: "Ibrahima Kane",
      phone: "+221700000010",
      systemRole: "standard",
      isActive: true,
      memberships: [
        { agencyKey: "agency_gev", role: "worker", isActive: true },
      ],
    },
    {
      key: "retrait_yde_worker",
      username: "retrait.yde",
      password: "Worker123!",
      fullName: "Aminata Fall",
      phone: "+221700000011",
      systemRole: "standard",
      isActive: true,
      memberships: [
        { agencyKey: "agency_gev", role: "worker", isActive: true },
      ],
    },
    {
      key: "cour_dla_worker",
      username: "cour.dla",
      password: "Worker123!",
      fullName: "Cheikh Ba",
      phone: "+221700000012",
      systemRole: "standard",
      isActive: true,
      memberships: [
        { agencyKey: "agency_gev", role: "worker", isActive: true },
      ],
    },
    {
      key: "cour_yde_worker",
      username: "cour.yde",
      password: "Worker123!",
      fullName: "Mariama Diallo",
      phone: "+221700000013",
      systemRole: "standard",
      isActive: true,
      memberships: [
        { agencyKey: "agency_gev", role: "worker", isActive: true },
      ],
    },
    {
      key: "caisse_worker",
      username: "caisse.main",
      password: "Worker123!",
      fullName: "Ousmane Kane",
      phone: "+221700000014",
      systemRole: "standard",
      isActive: true,
      memberships: [
        { agencyKey: "agency_gev", role: "worker", isActive: true },
      ],
    },
    {
      key: "caisse_4eme_worker",
      username: "caisse.quatrieme",
      password: "Worker123!",
      fullName: "Binta Fall",
      phone: "+221700000015",
      systemRole: "standard",
      isActive: true,
      memberships: [
        { agencyKey: "agency_gev", role: "worker", isActive: true },
      ],
    },
    {
      key: "coordinateur_worker",
      username: "coordinateur.main",
      password: "Worker123!",
      fullName: "Serigne Mbaye",
      phone: "+221700000016",
      systemRole: "standard",
      isActive: true,
      memberships: [
        { agencyKey: "agency_gev", role: "scheduler", isActive: true },
      ],
    },
    {
      key: "chef_equipe_1_worker",
      username: "chef.equipe.1",
      password: "Worker123!",
      fullName: "Khady Gueye",
      phone: "+221700000017",
      systemRole: "standard",
      isActive: true,
      memberships: [
        { agencyKey: "agency_gev", role: "worker", isActive: true },
      ],
    },
    {
      key: "chef_equipe_2_worker",
      username: "chef.equipe.2",
      password: "Worker123!",
      fullName: "Pape Sene",
      phone: "+221700000018",
      systemRole: "standard",
      isActive: true,
      memberships: [
        { agencyKey: "agency_gev", role: "worker", isActive: true },
      ],
    },
  ];
}

export const SEED_AGENCIES: SeedAgencyDefinition[] = [
  {
    key: "agency_gev",
    name: "GEV Operations",
    code: "GEV",
    isActive: true,
  },
];

export const SEED_SERVICES: SeedServiceDefinition[] = [
  {
    key: "service_envoi",
    agencyKey: "agency_gev",
    name: "Envoi",
    code: "ENVOI",
    description: "Daily outbound shipment reporting.",
    color: "#0f766e",
    isActive: true,
    createdByKey: "ops_admin",
  },
  {
    key: "service_piste",
    agencyKey: "agency_gev",
    name: "Piste",
    code: "PISTE",
    description: "Vehicle and transit lane reporting.",
    color: "#1d4ed8",
    isActive: true,
    createdByKey: "ops_admin",
  },
  {
    key: "service_retrait",
    agencyKey: "agency_gev",
    name: "Retrait",
    code: "RETRAIT",
    description: "Pickup and counter service reporting.",
    color: "#b45309",
    isActive: true,
    createdByKey: "ops_admin",
  },
];

export const SEED_WORK_POSTS: SeedWorkPostDefinition[] = [
  {
    key: "post_retrait_dla",
    agencyKey: "agency_gev",
    name: "Retrait Dla",
    code: "RETRAIT_DLA",
    description: "Pickup desk for Dakar.",
    isActive: true,
    createdByKey: "ops_admin",
  },
  {
    key: "post_retrait_yde",
    agencyKey: "agency_gev",
    name: "Retrait Yde",
    code: "RETRAIT_YDE",
    description: "Pickup desk for Yaounde.",
    isActive: true,
    createdByKey: "ops_admin",
  },
  {
    key: "post_cour_dla",
    agencyKey: "agency_gev",
    name: "Cour Dla",
    code: "COUR_DLA",
    description: "Courier desk for Dakar.",
    isActive: true,
    createdByKey: "ops_admin",
  },
  {
    key: "post_cour_yde",
    agencyKey: "agency_gev",
    name: "Cour Yde",
    code: "COUR_YDE",
    description: "Courier desk for Yaounde.",
    isActive: true,
    createdByKey: "ops_admin",
  },
  {
    key: "post_caisse",
    agencyKey: "agency_gev",
    name: "Caisse",
    code: "CAISSE",
    description: "Main cashier desk.",
    isActive: true,
    createdByKey: "ops_admin",
  },
  {
    key: "post_4eme_caisse",
    agencyKey: "agency_gev",
    name: "4eme caisse",
    code: "CAISSE_4EME",
    description: "Fourth cashier desk.",
    isActive: true,
    createdByKey: "ops_admin",
  },
  {
    key: "post_coordinateur",
    agencyKey: "agency_gev",
    name: "Coordinateur",
    code: "COORDINATEUR",
    description: "Daily operations coordinator.",
    isActive: true,
    createdByKey: "ops_admin",
  },
  {
    key: "post_chef_equipe_1",
    agencyKey: "agency_gev",
    name: "Chef d'equipe 1",
    code: "CHEF_EQUIPE_1",
    description: "Team lead 1.",
    isActive: true,
    createdByKey: "ops_admin",
  },
  {
    key: "post_chef_equipe_2",
    agencyKey: "agency_gev",
    name: "Chef d'equipe 2",
    code: "CHEF_EQUIPE_2",
    description: "Team lead 2.",
    isActive: true,
    createdByKey: "ops_admin",
  },
];

export const SEED_CRITERIA: SeedCriterionDefinition[] = [
  {
    key: "punctuality",
    agencyKey: "agency_gev",
    name: "Ponctualite",
    impact: "high",
    weight: "2.50",
    maxDaily: 1,
    isActive: true,
    createdByKey: "ops_admin",
  },
  {
    key: "teamwork",
    agencyKey: "agency_gev",
    name: "Travail en equipe",
    impact: "high",
    weight: "2.00",
    maxDaily: 2,
    isActive: true,
    createdByKey: "ops_admin",
  },
  {
    key: "incident_handling",
    agencyKey: "agency_gev",
    name: "Gestion des incidents",
    impact: "high",
    weight: "2.00",
    maxDaily: 2,
    isActive: true,
    createdByKey: "ops_admin",
  },
  {
    key: "customer_relation",
    agencyKey: "agency_gev",
    name: "Relation client",
    impact: "high",
    weight: "1.50",
    maxDaily: 1,
    isActive: true,
    createdByKey: "ops_admin",
  },
  {
    key: "safety_breach",
    agencyKey: "agency_gev",
    name: "Non respect des consignes",
    impact: "low",
    weight: "2.00",
    maxDaily: 1,
    isActive: true,
    createdByKey: "ops_admin",
  },
];

export const SEED_ATTENDANCE_CRITERION_SETTINGS: SeedAttendanceCriterionSettingDefinition[] =
  [
    {
      agencyKey: "agency_gev",
      criterionKey: "punctuality",
      isEnabled: true,
      createdByKey: "ops_admin",
    },
    {
      agencyKey: "agency_gev",
      criterionKey: "teamwork",
      isEnabled: true,
      createdByKey: "ops_admin",
    },
    {
      agencyKey: "agency_gev",
      criterionKey: "incident_handling",
      isEnabled: true,
      createdByKey: "ops_admin",
    },
    {
      agencyKey: "agency_gev",
      criterionKey: "customer_relation",
      isEnabled: true,
      createdByKey: "ops_admin",
    },
    {
      agencyKey: "agency_gev",
      criterionKey: "safety_breach",
      isEnabled: true,
      createdByKey: "ops_admin",
    },
  ];

export const SEED_INCIDENT_TEMPLATES: SeedIncidentTemplateDefinition[] = [
  {
    key: "non_vu",
    agencyKey: "agency_gev",
    name: "Etat des colis non vus",
    code: "COLIS_NON_VUS",
    description: "Tableau des colis non vus.",
    icon: "package-search",
    isActive: true,
    createdByKey: "ops_admin",
  },
  {
    key: "hors_bordereau",
    agencyKey: "agency_gev",
    name: "Etat des colis hors bordereaux",
    code: "COLIS_HORS_BORDEREAU",
    description: "Tableau des colis hors bordereaux.",
    icon: "clipboard-list",
    isActive: true,
    createdByKey: "ops_admin",
  },
  {
    key: "erreur_destination",
    agencyKey: "agency_gev",
    name: "Situation sur les erreurs de destination",
    code: "ERREUR_DESTINATION",
    description: "Erreurs de destination detectees pendant le service.",
    icon: "map-pinned",
    isActive: true,
    createdByKey: "ops_admin",
  },
  {
    key: "vehicule_embarque",
    agencyKey: "agency_gev",
    name: "Situation des colis et vehicules embarques",
    code: "VEHICULE_EMBARQUE",
    description: "Vehicules et colis embarques sur la piste.",
    icon: "truck",
    isActive: true,
    createdByKey: "ops_admin",
  },
  {
    key: "colis_retarde",
    agencyKey: "agency_gev",
    name: "Etat des colis retardes",
    code: "COLIS_RETARDE",
    description: "Colis en retard et suivi associe.",
    icon: "clock3",
    isActive: true,
    createdByKey: "ops_admin",
  },
  {
    key: "colis_non_identifie",
    agencyKey: "agency_gev",
    name: "Etat des colis non identifies",
    code: "COLIS_NON_IDENTIFIE",
    description: "Colis non identifies pendant la rotation.",
    icon: "scan-search",
    isActive: true,
    createdByKey: "ops_admin",
  },
  {
    key: "colis_transfere",
    agencyKey: "agency_gev",
    name: "Etat des colis transferes",
    code: "COLIS_TRANSFERE",
    description: "Colis transferes vers une autre destination.",
    icon: "arrow-right-left",
    isActive: true,
    createdByKey: "ops_admin",
  },
  {
    key: "convoyeur_absent",
    agencyKey: "agency_gev",
    name: "Etat de presence des convoyeurs absent",
    code: "CONVOYEUR_ABSENT",
    description: "Absences de convoyeurs.",
    icon: "user-x",
    isActive: true,
    createdByKey: "ops_admin",
  },
  {
    key: "bordereau_non_conforme",
    agencyKey: "agency_gev",
    name: "Etat de classement des bordereaux non conforme",
    code: "BORDEREAU_NON_CONFORME",
    description: "Classement des bordereaux non conformes.",
    icon: "file-warning",
    isActive: true,
    createdByKey: "ops_admin",
  },
];

export const SEED_INCIDENT_TEMPLATE_VERSIONS: SeedIncidentTemplateVersionDefinition[] =
  [
    {
      key: "non_vu_v1",
      templateKey: "non_vu",
      version: 1,
      fields: nonVuFields,
      status: "published",
      publishedAt: "2026-05-10T08:00:00.000Z",
      createdByKey: "ops_admin",
    },
    {
      key: "hors_bordereau_v1",
      templateKey: "hors_bordereau",
      version: 1,
      fields: horsBordereauFields,
      status: "published",
      publishedAt: "2026-05-10T08:05:00.000Z",
      createdByKey: "ops_admin",
    },
    {
      key: "erreur_destination_v1",
      templateKey: "erreur_destination",
      version: 1,
      fields: erreurDestinationFields,
      status: "published",
      publishedAt: "2026-05-10T08:10:00.000Z",
      createdByKey: "ops_admin",
    },
    {
      key: "vehicule_embarque_v1",
      templateKey: "vehicule_embarque",
      version: 1,
      fields: vehiculeEmbarqueFields,
      status: "published",
      publishedAt: "2026-05-10T08:15:00.000Z",
      createdByKey: "ops_admin",
    },
    {
      key: "colis_retarde_v1",
      templateKey: "colis_retarde",
      version: 1,
      fields: colisRetardeFields,
      status: "published",
      publishedAt: "2026-05-10T08:20:00.000Z",
      createdByKey: "ops_admin",
    },
    {
      key: "colis_non_identifie_v1",
      templateKey: "colis_non_identifie",
      version: 1,
      fields: colisNonIdentifieFields,
      status: "published",
      publishedAt: "2026-05-10T08:25:00.000Z",
      createdByKey: "ops_admin",
    },
    {
      key: "colis_transfere_v1",
      templateKey: "colis_transfere",
      version: 1,
      fields: colisTransfereFields,
      status: "published",
      publishedAt: "2026-05-10T08:30:00.000Z",
      createdByKey: "ops_admin",
    },
    {
      key: "convoyeur_absent_v1",
      templateKey: "convoyeur_absent",
      version: 1,
      fields: convoyeurAbsentFields,
      status: "published",
      publishedAt: "2026-05-10T08:35:00.000Z",
      createdByKey: "ops_admin",
    },
    {
      key: "bordereau_non_conforme_v1",
      templateKey: "bordereau_non_conforme",
      version: 1,
      fields: bordereauNonConformeFields,
      status: "published",
      publishedAt: "2026-05-10T08:40:00.000Z",
      createdByKey: "ops_admin",
    },
  ];

export const SEED_SERVICE_INCIDENT_BINDINGS: SeedServiceIncidentBindingDefinition[] =
  [
    {
      key: "envoi_non_vu",
      serviceKey: "service_envoi",
      templateKey: "non_vu",
      templateVersionKey: "non_vu_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 1,
      isActive: true,
    },
    {
      key: "envoi_hors_bordereau",
      serviceKey: "service_envoi",
      templateKey: "hors_bordereau",
      templateVersionKey: "hors_bordereau_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 2,
      isActive: true,
    },
    {
      key: "envoi_erreur_destination",
      serviceKey: "service_envoi",
      templateKey: "erreur_destination",
      templateVersionKey: "erreur_destination_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 3,
      isActive: true,
    },
    {
      key: "envoi_convoyeur_absent",
      serviceKey: "service_envoi",
      templateKey: "convoyeur_absent",
      templateVersionKey: "convoyeur_absent_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 4,
      isActive: true,
    },
    {
      key: "envoi_bordereau_non_conforme",
      serviceKey: "service_envoi",
      templateKey: "bordereau_non_conforme",
      templateVersionKey: "bordereau_non_conforme_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 5,
      isActive: true,
    },
    {
      key: "piste_vehicule_embarque",
      serviceKey: "service_piste",
      templateKey: "vehicule_embarque",
      templateVersionKey: "vehicule_embarque_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 1,
      isActive: true,
    },
    {
      key: "piste_non_vu",
      serviceKey: "service_piste",
      templateKey: "non_vu",
      templateVersionKey: "non_vu_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 2,
      isActive: true,
    },
    {
      key: "piste_colis_retarde",
      serviceKey: "service_piste",
      templateKey: "colis_retarde",
      templateVersionKey: "colis_retarde_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 3,
      isActive: true,
    },
    {
      key: "piste_erreur_destination",
      serviceKey: "service_piste",
      templateKey: "erreur_destination",
      templateVersionKey: "erreur_destination_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 4,
      isActive: true,
    },
    {
      key: "piste_colis_non_identifie",
      serviceKey: "service_piste",
      templateKey: "colis_non_identifie",
      templateVersionKey: "colis_non_identifie_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 5,
      isActive: true,
    },
    {
      key: "piste_colis_transfere",
      serviceKey: "service_piste",
      templateKey: "colis_transfere",
      templateVersionKey: "colis_transfere_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 6,
      isActive: true,
    },
    {
      key: "retrait_erreur_destination",
      serviceKey: "service_retrait",
      templateKey: "erreur_destination",
      templateVersionKey: "erreur_destination_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 1,
      isActive: true,
    },
    {
      key: "retrait_hors_bordereau",
      serviceKey: "service_retrait",
      templateKey: "hors_bordereau",
      templateVersionKey: "hors_bordereau_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 2,
      isActive: true,
    },
  ];

export const SEED_WORK_SCHEDULES: SeedWorkScheduleDefinition[] = [
  {
    key: "envoi_2026_05_12",
    agencyKey: "agency_gev",
    serviceKey: "service_envoi",
    workDate: "2026-05-12",
    status: "published",
    createdByKey: "ops_scheduler",
    publishedAt: "2026-05-11T18:00:00.000Z",
    archivedAt: null,
    assignments: [
      {
        userKey: "coordinateur_worker",
        postKey: "post_coordinateur",
        isLeader: true,
        isSubleader: false,
        attendanceStatus: "present",
      },
      {
        userKey: "chef_equipe_1_worker",
        postKey: "post_chef_equipe_1",
        isLeader: false,
        isSubleader: true,
        attendanceStatus: "present",
      },
      {
        userKey: "retrait_dla_worker",
        postKey: "post_retrait_dla",
        isLeader: false,
        isSubleader: false,
        attendanceStatus: "present",
      },
      {
        userKey: "cour_dla_worker",
        postKey: "post_cour_dla",
        isLeader: false,
        isSubleader: false,
        attendanceStatus: "present",
      },
      {
        userKey: "caisse_worker",
        postKey: "post_caisse",
        isLeader: false,
        isSubleader: false,
        attendanceStatus: "present",
      },
    ],
  },
  {
    key: "piste_2026_05_12",
    agencyKey: "agency_gev",
    serviceKey: "service_piste",
    workDate: "2026-05-12",
    status: "published",
    createdByKey: "ops_scheduler",
    publishedAt: "2026-05-11T18:10:00.000Z",
    archivedAt: null,
    assignments: [
      {
        userKey: "chef_equipe_2_worker",
        postKey: "post_chef_equipe_2",
        isLeader: true,
        isSubleader: false,
        attendanceStatus: "present",
      },
      {
        userKey: "cour_yde_worker",
        postKey: "post_cour_yde",
        isLeader: false,
        isSubleader: true,
        attendanceStatus: "present",
      },
      {
        userKey: "retrait_yde_worker",
        postKey: "post_retrait_yde",
        isLeader: false,
        isSubleader: false,
        attendanceStatus: "present",
      },
      {
        userKey: "caisse_4eme_worker",
        postKey: "post_4eme_caisse",
        isLeader: false,
        isSubleader: false,
        attendanceStatus: "present",
      },
    ],
  },
  {
    key: "retrait_2026_05_12",
    agencyKey: "agency_gev",
    serviceKey: "service_retrait",
    workDate: "2026-05-12",
    status: "published",
    createdByKey: "ops_scheduler",
    publishedAt: "2026-05-11T18:20:00.000Z",
    archivedAt: null,
    assignments: [
      {
        userKey: "coordinateur_worker",
        postKey: "post_coordinateur",
        isLeader: true,
        isSubleader: false,
        attendanceStatus: "present",
      },
      {
        userKey: "retrait_dla_worker",
        postKey: "post_retrait_dla",
        isLeader: false,
        isSubleader: true,
        attendanceStatus: "present",
      },
      {
        userKey: "retrait_yde_worker",
        postKey: "post_retrait_yde",
        isLeader: false,
        isSubleader: false,
        attendanceStatus: "present",
      },
      {
        userKey: "chef_equipe_1_worker",
        postKey: "post_chef_equipe_1",
        isLeader: false,
        isSubleader: false,
        attendanceStatus: "present",
      },
      {
        userKey: "cour_dla_worker",
        postKey: "post_cour_dla",
        isLeader: false,
        isSubleader: false,
        attendanceStatus: "absent",
      },
    ],
  },
  {
    key: "envoi_2026_05_13",
    agencyKey: "agency_gev",
    serviceKey: "service_envoi",
    workDate: "2026-05-13",
    status: "draft",
    createdByKey: "ops_scheduler",
    publishedAt: null,
    archivedAt: null,
    assignments: [
      {
        userKey: "coordinateur_worker",
        postKey: "post_coordinateur",
        isLeader: true,
        isSubleader: false,
        attendanceStatus: "scheduled",
      },
      {
        userKey: "caisse_worker",
        postKey: "post_caisse",
        isLeader: false,
        isSubleader: false,
        attendanceStatus: "scheduled",
      },
      {
        userKey: "chef_equipe_1_worker",
        postKey: "post_chef_equipe_1",
        isLeader: false,
        isSubleader: false,
        attendanceStatus: "scheduled",
      },
    ],
  },
];

export const SEED_GENERAL_REPORTS: SeedGeneralReportDefinition[] = [
  {
    workScheduleKey: "envoi_2026_05_12",
    reportedByKey: "ops_reporter",
    readByKey: "ops_admin",
    isRead: true,
    readAt: "2026-05-12T17:40:00.000Z",
    personnelPresent:
      "Coordinateur, Chef d'equipe 1, Retrait Dla, Cour Dla, Caisse",
    personnelAbsent: "Aucun",
    ambianceGenerale:
      "Ambiance calme et professionelle avec un bon rythme de traitement.",
    problemesRencontres:
      "Quelques retards sur le tri des colis non vus au milieu de la journee.",
    etatGeneralService:
      "Salle propre, materiel informatique fonctionnel et flux stable.",
    passationService:
      "Les colis non conformes ont ete remontes a la rotation suivante.",
    observationGeneral:
      "La coordination entre les postes a limite l'impact des incidents.",
    incidentEntries: [
      {
        templateKey: "non_vu",
        templateVersionKey: "non_vu_v1",
        displayOrder: 1,
        values: {
          immatriculation: "KA-1234-B",
          agence_depart: "Dakar",
          description:
            "Colis arrive sans destination finale claire au tri du matin.",
          destinataire: "M. Ndiaye",
          action_en_cours:
            "Verification du bordereau et appel du service expediteur.",
        },
      },
      {
        templateKey: "hors_bordereau",
        templateVersionKey: "hors_bordereau_v1",
        displayOrder: 2,
        values: {
          agence_depart: "Dakar",
          description: "Colis depose hors lot au quai de chargement.",
          destinataire: "Mme Diallo",
          numero_telephone: "+221771234567",
          action_en_cours: "Mise en attente de validation par le coordinateur.",
        },
      },
      {
        templateKey: "bordereau_non_conforme",
        templateVersionKey: "bordereau_non_conforme_v1",
        displayOrder: 3,
        values: {
          numero_de_bordereau: "BORD-2026-071",
          motif_de_non_conformite:
            "Signature manquante sur le bordereau imprime.",
          action_menee: "Retour au guichet pour correction et re-scan.",
        },
      },
    ],
  },
  {
    workScheduleKey: "piste_2026_05_12",
    reportedByKey: "ops_reporter",
    readByKey: "ops_admin",
    isRead: true,
    readAt: "2026-05-12T18:05:00.000Z",
    personnelPresent: "Chef d'equipe 2, Cour Yde, Retrait Yde, 4eme caisse",
    personnelAbsent: "Aucun",
    ambianceGenerale:
      "La piste est restee active et bien alignee avec les rotations vehicules.",
    problemesRencontres:
      "Un vehicule est parti en retard a cause d'un controle de chargement.",
    etatGeneralService:
      "Zone de piste propre, consignes de securite appliquees.",
    passationService:
      "Le vehicule suivant a ete prepare et les colis non identifies sont suivis.",
    observationGeneral: "Bon niveau de supervision pendant les embarquements.",
    incidentEntries: [
      {
        templateKey: "vehicule_embarque",
        templateVersionKey: "vehicule_embarque_v1",
        displayOrder: 1,
        values: {
          immatriculation: "DK-8899-L",
          destination: "Yaounde",
          heure: "14:15",
          retour_reception_colis: "Reception des colis validee avant depart.",
          presence_convoyeurs: "Present",
        },
      },
      {
        templateKey: "colis_retarde",
        templateVersionKey: "colis_retarde_v1",
        displayOrder: 2,
        values: {
          code_colis: "PKG-8841",
          description: "Colis en attente dans la zone de transit.",
          destinataire: "Mme Nguema",
          motif_du_retard: "Arrivee tardive du vehicule de ligne.",
          action_en_cours: "Dechargement prioritaire au quai 2.",
        },
      },
      {
        templateKey: "colis_transfere",
        templateVersionKey: "colis_transfere_v1",
        displayOrder: 3,
        values: {
          destination: "Douala",
          numero_de_bordereau: "BORD-2026-118",
          nombre_de_colis: 18,
          chauffeur: "Alain T.",
          statut: "Transfered",
        },
      },
    ],
  },
  {
    workScheduleKey: "retrait_2026_05_12",
    reportedByKey: "ops_reporter",
    readByKey: null,
    isRead: false,
    readAt: null,
    personnelPresent: "Coordinateur, Chef d'equipe 1, Retrait Yde, Caisse",
    personnelAbsent: "Cour Dla",
    ambianceGenerale:
      "Accueil client fluide, avec quelques demandes de verification supplementaires.",
    problemesRencontres:
      "Deux retraits ont necessite une rectification de destination avant validation.",
    etatGeneralService: "Le service retrait est reste fonctionnel et propre.",
    passationService:
      "Les dossiers en attente ont ete transmis au chef d'equipe suivant.",
    observationGeneral:
      "Bonne tenue du guichet de retrait malgre un pic de frequentation.",
    incidentEntries: [
      {
        templateKey: "erreur_destination",
        templateVersionKey: "erreur_destination_v1",
        displayOrder: 1,
        values: {
          immatriculation: "RT-4421-Z",
          destination: "Mbour",
          numero_telephone: "+221770001111",
          description: "Erreur de destination detectee au retrait.",
          destination_prevue: "Thiès",
          destination_erronee: "Mbour",
        },
      },
      {
        templateKey: "hors_bordereau",
        templateVersionKey: "hors_bordereau_v1",
        displayOrder: 2,
        values: {
          agence_depart: "Dakar",
          description: "Colis reclame sans bordereau valide.",
          destinataire: "M. Cisse",
          numero_telephone: "+221772223333",
          action_en_cours: "Verification piece d'identite en cours.",
        },
      },
    ],
  },
];

export const SEED_PERSONNEL_EVALUATIONS: SeedPersonnelEvaluationDefinition[] = [
  {
    workScheduleKey: "envoi_2026_05_12",
    evaluatedUserKey: "chef_equipe_1_worker",
    evaluatingLeaderKey: "ops_scheduler",
    criterionKey: "punctuality",
    score: 5,
    comment: "Commence a l'heure et maintient la cadence du service.",
  },
  {
    workScheduleKey: "envoi_2026_05_12",
    evaluatedUserKey: "cour_dla_worker",
    evaluatingLeaderKey: "ops_scheduler",
    criterionKey: "teamwork",
    score: 4,
    comment: "Bonne collaboration avec le coordinateur et la caisse.",
  },
  {
    workScheduleKey: "piste_2026_05_12",
    evaluatedUserKey: "chef_equipe_2_worker",
    evaluatingLeaderKey: "ops_scheduler",
    criterionKey: "incident_handling",
    score: 5,
    comment:
      "A bien gere le vehicule en retard et les controles de chargement.",
  },
  {
    workScheduleKey: "retrait_2026_05_12",
    evaluatedUserKey: "retrait_yde_worker",
    evaluatingLeaderKey: "ops_admin",
    criterionKey: "customer_relation",
    score: 4,
    comment: "Accueil client propre et explications claires.",
  },
  {
    workScheduleKey: "retrait_2026_05_12",
    evaluatedUserKey: "cour_dla_worker",
    evaluatingLeaderKey: "ops_admin",
    criterionKey: "safety_breach",
    score: 2,
    comment: "Retard de transmission signale sur une remise de dossier.",
  },
];

export const SEED_SIGNATURE_LOGS: SeedSignatureLogDefinition[] = [
  {
    workScheduleKey: "envoi_2026_05_12",
    userKey: "ops_reporter",
    slipNumber: "SLIP-ENV-001",
    signedAt: "2026-05-12T17:30:00.000Z",
    busArrivalTime: "2026-05-12T07:55:00.000Z",
  },
  {
    workScheduleKey: "piste_2026_05_12",
    userKey: "ops_reporter",
    slipNumber: "SLIP-PST-001",
    signedAt: "2026-05-12T18:00:00.000Z",
    busArrivalTime: "2026-05-12T08:05:00.000Z",
  },
  {
    workScheduleKey: "retrait_2026_05_12",
    userKey: "ops_admin",
    slipNumber: "SLIP-RET-001",
    signedAt: "2026-05-12T18:10:00.000Z",
    busArrivalTime: null,
  },
];
