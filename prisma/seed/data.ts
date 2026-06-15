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
  requiresPersonnel?: boolean;
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
  status: "draft" | "published";
  publishedAt: string | null;
  readAt: string | null;
  presentPersonnelKeys: string[];
  absentPersonnelKeys: string[];
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
  const isText = type === "text" || type === "textarea";

  return {
    key,
    label,
    type,
    required,
    placeholder,
    options: [],
    validation: {
      minLength: isText ? 2 : null,
      maxLength: isText ? 400 : null,
      pattern: null,
      minValue: type === "number" ? 0 : null,
      maxValue: type === "number" ? 5000 : null,
    },
  };
}

const fieldsMissingPackages: SeedIncidentFieldDefinition[] = [
  field("vehicle_plate", "Vehicle plate", "text", true, "LT-123-AA"),
  field("origin_agency", "Origin agency", "text", true, "Douala"),
  field("destination", "Destination", "text", true, "Bafoussam"),
  field("package_count", "Package count", "number", true, null),
  field(
    "action_in_progress",
    "Action in progress",
    "textarea",
    true,
    "Tracking opened"
  ),
];

const fieldsOffManifest: SeedIncidentFieldDefinition[] = [
  field("manifest_number", "Manifest number", "text", true, "MAN-00012"),
  field("package_reference", "Package reference", "text", true, "PKG-1002"),
  field("receiver", "Receiver", "text", true, "Client Name"),
  field(
    "notes",
    "Notes",
    "textarea",
    true,
    "Package found without manifest entry"
  ),
];

const fieldsDestinationError: SeedIncidentFieldDefinition[] = [
  field("package_reference", "Package reference", "text", true, "PKG-1003"),
  field(
    "expected_destination",
    "Expected destination",
    "text",
    true,
    "Bafoussam"
  ),
  field("actual_destination", "Actual destination", "text", true, "Mbouda"),
  field("contact_phone", "Contact phone", "text", false, "+237612000000"),
  field(
    "correction_action",
    "Correction action",
    "textarea",
    true,
    "Redirected to hub"
  ),
];

const fieldsDelayedPackages: SeedIncidentFieldDefinition[] = [
  field("package_reference", "Package reference", "text", true, "PKG-1004"),
  field("delay_reason", "Delay reason", "textarea", true, "Heavy traffic"),
  field(
    "estimated_recovery_time",
    "Estimated recovery time",
    "time",
    true,
    null
  ),
  field("resolution_owner", "Resolution owner", "text", true, "Team Lead"),
];

const fieldsUnidentifiedPackages: SeedIncidentFieldDefinition[] = [
  field(
    "package_description",
    "Package description",
    "textarea",
    true,
    "Brown box with no label"
  ),
  field("storage_zone", "Storage zone", "text", true, "Zone C"),
  field("security_flag", "Security flag", "boolean", true, null),
  field("next_step", "Next step", "textarea", true, "Escalate to supervisor"),
];

const fieldsTransferReport: SeedIncidentFieldDefinition[] = [
  field(
    "transfer_destination",
    "Transfer destination",
    "text",
    true,
    "Dschang"
  ),
  field("transfer_manifest", "Transfer manifest", "text", true, "TR-9001"),
  field("package_count", "Package count", "number", true, null),
  field("driver_name", "Driver name", "text", true, "Driver A"),
  field("handover_status", "Handover status", "text", true, "completed"),
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
      memberships: [
        { agencyKey: "agency_gev_baf", isActive: true },
        { agencyKey: "agency_gev_dla", isActive: true },
      ],
    },
    {
      key: "baf_admin",
      username: "baf.admin",
      password: "Admin123!",
      fullName: "Bafoussam Administrator",
      phone: "+237600000010",
      systemRole: "standard",
      isActive: true,
      memberships: [{ agencyKey: "agency_gev_baf", isActive: true }],
    },
    {
      key: "baf_scheduler",
      username: "baf.scheduler",
      password: "Scheduler123!",
      fullName: "Bafoussam Scheduler",
      phone: "+237600000011",
      systemRole: "standard",
      isActive: true,
      memberships: [{ agencyKey: "agency_gev_baf", isActive: true }],
    },
    {
      key: "baf_reporter",
      username: "baf.reporter",
      password: "Reporter123!",
      fullName: "Bafoussam Reporter",
      phone: "+237600000012",
      systemRole: "standard",
      isActive: true,
      memberships: [{ agencyKey: "agency_gev_baf", isActive: true }],
    },
    {
      key: "courrier_lead",
      username: "baf.courrier.lead",
      password: "Lead123!",
      fullName: "Courier Team Lead",
      phone: "+237600000013",
      systemRole: "standard",
      isActive: true,
      memberships: [{ agencyKey: "agency_gev_baf", isActive: true }],
    },
    {
      key: "courrier_sublead",
      username: "baf.courrier.sublead",
      password: "Lead123!",
      fullName: "Courier Sublead",
      phone: "+237600000014",
      systemRole: "standard",
      isActive: true,
      memberships: [{ agencyKey: "agency_gev_baf", isActive: true }],
    },
    {
      key: "courrier_agent_1",
      username: "baf.courrier.1",
      password: "Agent123!",
      fullName: "Courier Agent 1",
      phone: "+237600000015",
      systemRole: "standard",
      isActive: true,
      memberships: [{ agencyKey: "agency_gev_baf", isActive: true }],
    },
    {
      key: "courrier_agent_2",
      username: "baf.courrier.2",
      password: "Agent123!",
      fullName: "Courier Agent 2",
      phone: "+237600000016",
      systemRole: "standard",
      isActive: true,
      memberships: [{ agencyKey: "agency_gev_baf", isActive: true }],
    },
    {
      key: "dla_admin",
      username: "dla.admin",
      password: "Admin123!",
      fullName: "Douala Administrator",
      phone: "+237600000020",
      systemRole: "standard",
      isActive: true,
      memberships: [{ agencyKey: "agency_gev_dla", isActive: true }],
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
  {
    key: "agency_gev_dla",
    name: "GEV Douala",
    code: "GEV_DLA",
    isActive: true,
  },
];

export const SEED_SERVICES: SeedServiceDefinition[] = [
  {
    key: "service_courier_baf",
    agencyKey: "agency_gev_baf",
    name: "Courier Operations",
    code: "COURIER_OPS",
    description: "Main courier service used for schedule and report workflows.",
    color: "#145a32",
    isActive: true,
    createdByKey: "baf_admin",
  },
  {
    key: "service_frontdesk_dla",
    agencyKey: "agency_gev_dla",
    name: "Front Desk",
    code: "FRONT_DESK",
    description:
      "Simple secondary service fixture for multi-agency validation.",
    color: "#1f618d",
    isActive: true,
    createdByKey: "dla_admin",
  },
];

export const SEED_WORK_POSTS: SeedWorkPostDefinition[] = [
  {
    key: "post_coord",
    agencyKey: "agency_gev_baf",
    name: "Coordinator",
    code: "COORD",
    description: "Shift coordination role.",
    isActive: true,
    createdByKey: "baf_admin",
  },
  {
    key: "post_assistant",
    agencyKey: "agency_gev_baf",
    name: "Assistant Coordinator",
    code: "ASSIST_COORD",
    description: "Supports lead and follows up incidents.",
    isActive: true,
    createdByKey: "baf_admin",
  },
  {
    key: "post_sorting",
    agencyKey: "agency_gev_baf",
    name: "Sorting Agent",
    code: "SORT_AGENT",
    description: "Package sorting and anomaly checks.",
    isActive: true,
    createdByKey: "baf_admin",
  },
  {
    key: "post_convoy",
    agencyKey: "agency_gev_baf",
    name: "Convoy Agent",
    code: "CONVOY_AGENT",
    description: "Package transfer and movement operations.",
    isActive: true,
    createdByKey: "baf_admin",
  },
];

export const SEED_CRITERIA: SeedCriterionDefinition[] = [
  {
    key: "punctuality",
    agencyKey: "agency_gev_baf",
    name: "Punctuality",
    impact: "high",
    weight: "2.00",
    maxDaily: 1,
    isActive: true,
    createdByKey: "baf_admin",
  },
  {
    key: "incident_response",
    agencyKey: "agency_gev_baf",
    name: "Incident response",
    impact: "high",
    weight: "2.50",
    maxDaily: 2,
    isActive: true,
    createdByKey: "baf_admin",
  },
  {
    key: "discipline",
    agencyKey: "agency_gev_baf",
    name: "Discipline",
    impact: "low",
    weight: "1.20",
    maxDaily: 1,
    isActive: true,
    createdByKey: "baf_admin",
  },
  {
    key: "teamwork",
    agencyKey: "agency_gev_baf",
    name: "Teamwork",
    impact: "low",
    weight: "1.50",
    maxDaily: 1,
    isActive: true,
    createdByKey: "baf_admin",
  },
];

export const SEED_ATTENDANCE_CRITERION_SETTINGS: SeedAttendanceCriterionSettingDefinition[] =
  [
    {
      agencyKey: "agency_gev_baf",
      criterionKey: "punctuality",
      isEnabled: true,
      createdByKey: "baf_admin",
    },
    {
      agencyKey: "agency_gev_baf",
      criterionKey: "discipline",
      isEnabled: true,
      createdByKey: "baf_admin",
    },
    {
      agencyKey: "agency_gev_baf",
      criterionKey: "teamwork",
      isEnabled: false,
      createdByKey: "baf_admin",
    },
  ];

export const SEED_INCIDENT_TEMPLATES: SeedIncidentTemplateDefinition[] = [
  {
    key: "missing_packages",
    agencyKey: "agency_gev_baf",
    name: "Missing packages",
    code: "MISSING_PACKAGES",
    description: "Packages expected on shift but not physically seen.",
    icon: "package-search",
    isActive: true,
    createdByKey: "baf_admin",
  },
  {
    key: "off_manifest",
    agencyKey: "agency_gev_baf",
    name: "Off-manifest package",
    code: "OFF_MANIFEST",
    description: "Packages discovered without matching manifest lines.",
    icon: "clipboard-list",
    isActive: true,
    createdByKey: "baf_admin",
  },
  {
    key: "destination_error",
    agencyKey: "agency_gev_baf",
    name: "Destination error",
    code: "DESTINATION_ERROR",
    description: "Wrong destination labels or routing mistakes.",
    icon: "map-pinned",
    isActive: true,
    createdByKey: "baf_admin",
  },
  {
    key: "delayed_packages",
    agencyKey: "agency_gev_baf",
    name: "Delayed packages",
    code: "DELAYED_PACKAGES",
    description: "Packages delayed within the transport chain.",
    icon: "clock3",
    isActive: true,
    createdByKey: "baf_admin",
  },
  {
    key: "unidentified_packages",
    agencyKey: "agency_gev_baf",
    name: "Unidentified packages",
    code: "UNIDENTIFIED_PACKAGES",
    description: "Packages without valid labels or ownership trace.",
    icon: "scan-search",
    isActive: true,
    createdByKey: "baf_admin",
  },
  {
    key: "transfer_report",
    agencyKey: "agency_gev_baf",
    name: "Transfer report",
    code: "TRANSFER_REPORT",
    description: "Transfer handover tracking between agencies.",
    icon: "arrow-right-left",
    isActive: true,
    createdByKey: "baf_admin",
  },
];

export const SEED_INCIDENT_TEMPLATE_VERSIONS: SeedIncidentTemplateVersionDefinition[] =
  [
    {
      key: "missing_packages_v1",
      templateKey: "missing_packages",
      version: 1,
      fields: fieldsMissingPackages,
      status: "published",
      publishedAt: "2026-05-10T08:00:00.000Z",
      createdByKey: "baf_admin",
    },
    {
      key: "off_manifest_v1",
      templateKey: "off_manifest",
      version: 1,
      fields: fieldsOffManifest,
      status: "published",
      publishedAt: "2026-05-10T08:05:00.000Z",
      createdByKey: "baf_admin",
    },
    {
      key: "destination_error_v1",
      templateKey: "destination_error",
      version: 1,
      fields: fieldsDestinationError,
      status: "published",
      publishedAt: "2026-05-10T08:10:00.000Z",
      createdByKey: "baf_admin",
    },
    {
      key: "delayed_packages_v1",
      templateKey: "delayed_packages",
      version: 1,
      fields: fieldsDelayedPackages,
      status: "published",
      publishedAt: "2026-05-10T08:15:00.000Z",
      createdByKey: "baf_admin",
    },
    {
      key: "unidentified_packages_v1",
      templateKey: "unidentified_packages",
      version: 1,
      fields: fieldsUnidentifiedPackages,
      status: "published",
      publishedAt: "2026-05-10T08:20:00.000Z",
      createdByKey: "baf_admin",
    },
    {
      key: "transfer_report_v1",
      templateKey: "transfer_report",
      version: 1,
      fields: fieldsTransferReport,
      status: "published",
      publishedAt: "2026-05-10T08:25:00.000Z",
      createdByKey: "baf_admin",
    },
  ];

export const SEED_SERVICE_INCIDENT_BINDINGS: SeedServiceIncidentBindingDefinition[] =
  [
    {
      key: "courier_missing_packages",
      serviceKey: "service_courier_baf",
      templateKey: "missing_packages",
      templateVersionKey: "missing_packages_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 1,
      isActive: true,
    },
    {
      key: "courier_off_manifest",
      serviceKey: "service_courier_baf",
      templateKey: "off_manifest",
      templateVersionKey: "off_manifest_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 2,
      isActive: true,
    },
    {
      key: "courier_destination_error",
      serviceKey: "service_courier_baf",
      templateKey: "destination_error",
      templateVersionKey: "destination_error_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 3,
      isActive: true,
    },
    {
      key: "courier_delayed_packages",
      serviceKey: "service_courier_baf",
      templateKey: "delayed_packages",
      templateVersionKey: "delayed_packages_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 4,
      isActive: true,
    },
    {
      key: "courier_unidentified_packages",
      serviceKey: "service_courier_baf",
      templateKey: "unidentified_packages",
      templateVersionKey: "unidentified_packages_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 5,
      isActive: true,
    },
    {
      key: "courier_transfer_report",
      serviceKey: "service_courier_baf",
      templateKey: "transfer_report",
      templateVersionKey: "transfer_report_v1",
      minEntries: 0,
      maxEntries: null,
      isRequired: false,
      displayOrder: 6,
      isActive: true,
    },
  ];

export const SEED_WORK_SCHEDULES: SeedWorkScheduleDefinition[] = [
  {
    key: "courier_2026_05_13",
    agencyKey: "agency_gev_baf",
    serviceKey: "service_courier_baf",
    workDate: "2026-05-13",
    status: "archived",
    createdByKey: "baf_scheduler",
    publishedAt: "2026-05-13T06:00:00.000Z",
    archivedAt: "2026-05-13T20:00:00.000Z",
    assignments: [
      {
        userKey: "courrier_lead",
        postKey: "post_coord",
        isLeader: true,
        isSubleader: false,
        attendanceStatus: "present",
      },
      {
        userKey: "courrier_sublead",
        postKey: "post_assistant",
        isLeader: false,
        isSubleader: true,
        attendanceStatus: "present",
      },
      {
        userKey: "courrier_agent_1",
        postKey: "post_sorting",
        isLeader: false,
        isSubleader: false,
        attendanceStatus: "present",
      },
      {
        userKey: "courrier_agent_2",
        postKey: "post_convoy",
        isLeader: false,
        isSubleader: false,
        attendanceStatus: "absent",
      },
    ],
  },
  {
    key: "courier_2026_05_14",
    agencyKey: "agency_gev_baf",
    serviceKey: "service_courier_baf",
    workDate: "2026-05-14",
    status: "published",
    createdByKey: "baf_scheduler",
    publishedAt: "2026-05-14T06:10:00.000Z",
    archivedAt: null,
    assignments: [
      {
        userKey: "courrier_lead",
        postKey: "post_coord",
        isLeader: true,
        isSubleader: false,
        attendanceStatus: "present",
      },
      {
        userKey: "courrier_sublead",
        postKey: "post_assistant",
        isLeader: false,
        isSubleader: true,
        attendanceStatus: "present",
      },
      {
        userKey: "courrier_agent_1",
        postKey: "post_sorting",
        isLeader: false,
        isSubleader: false,
        attendanceStatus: "present",
      },
      {
        userKey: "courrier_agent_2",
        postKey: "post_convoy",
        isLeader: false,
        isSubleader: false,
        attendanceStatus: "excused",
      },
    ],
  },
  {
    key: "courier_2026_05_15",
    agencyKey: "agency_gev_baf",
    serviceKey: "service_courier_baf",
    workDate: "2026-05-15",
    status: "draft",
    createdByKey: "baf_scheduler",
    publishedAt: null,
    archivedAt: null,
    assignments: [
      {
        userKey: "courrier_lead",
        postKey: "post_coord",
        isLeader: true,
        isSubleader: false,
        attendanceStatus: "scheduled",
      },
      {
        userKey: "courrier_sublead",
        postKey: "post_assistant",
        isLeader: false,
        isSubleader: true,
        attendanceStatus: "scheduled",
      },
      {
        userKey: "courrier_agent_1",
        postKey: "post_sorting",
        isLeader: false,
        isSubleader: false,
        attendanceStatus: "scheduled",
      },
      {
        userKey: "courrier_agent_2",
        postKey: "post_convoy",
        isLeader: false,
        isSubleader: false,
        attendanceStatus: "scheduled",
      },
    ],
  },
];

export const SEED_GENERAL_REPORTS: SeedGeneralReportDefinition[] = [
  {
    workScheduleKey: "courier_2026_05_14",
    reportedByKey: "baf_reporter",
    readByKey: "baf_admin",
    isRead: true,
    status: "published",
    publishedAt: "2026-05-14T18:30:00.000Z",
    readAt: "2026-05-14T19:00:00.000Z",
    presentPersonnelKeys: [
      "courrier_lead",
      "courrier_sublead",
      "courrier_agent_1",
    ],
    absentPersonnelKeys: ["courrier_agent_2"],
    ambianceGenerale: "Shift started on time and handover was smooth.",
    problemesRencontres: "Two routing incidents and one delayed transfer.",
    etatGeneralService: "Sorting zone remained operational throughout the day.",
    passationService: "All unresolved incidents were escalated to night team.",
    observationGeneral:
      "Incident closure quality improved versus previous day.",
    incidentEntries: [
      {
        templateKey: "missing_packages",
        templateVersionKey: "missing_packages_v1",
        displayOrder: 1,
        values: {
          vehicle_plate: "LT-123-AA",
          origin_agency: "Douala",
          destination: "Bafoussam",
          package_count: 2,
          action_in_progress: "Tracking request sent to dispatch.",
        },
      },
      {
        templateKey: "destination_error",
        templateVersionKey: "destination_error_v1",
        displayOrder: 2,
        values: {
          package_reference: "PKG-1003",
          expected_destination: "Bafoussam",
          actual_destination: "Mbouda",
          contact_phone: "+237612000111",
          correction_action: "Relabeled and redirected.",
        },
      },
      {
        templateKey: "transfer_report",
        templateVersionKey: "transfer_report_v1",
        displayOrder: 3,
        values: {
          transfer_destination: "Dschang",
          transfer_manifest: "TR-9001",
          package_count: 18,
          driver_name: "Driver A",
          handover_status: "completed",
        },
      },
    ],
  },
  {
    workScheduleKey: "courier_2026_05_13",
    reportedByKey: "baf_reporter",
    readByKey: null,
    isRead: false,
    status: "draft",
    publishedAt: null,
    readAt: null,
    presentPersonnelKeys: [
      "courrier_lead",
      "courrier_sublead",
      "courrier_agent_1",
    ],
    absentPersonnelKeys: ["courrier_agent_2"],
    ambianceGenerale: "Stable shift with one absentee.",
    problemesRencontres: "Unidentified package waiting validation.",
    etatGeneralService: "Resources were available and functional.",
    passationService: "Draft notes captured for manager review.",
    observationGeneral: "Follow-up needed on unidentified package process.",
    incidentEntries: [
      {
        templateKey: "unidentified_packages",
        templateVersionKey: "unidentified_packages_v1",
        displayOrder: 1,
        values: {
          package_description: "Medium carton, no visible label.",
          storage_zone: "Zone C",
          security_flag: true,
          next_step: "Escalated to shift supervisor.",
        },
      },
    ],
  },
];

export const SEED_PERSONNEL_EVALUATIONS: SeedPersonnelEvaluationDefinition[] = [
  {
    workScheduleKey: "courier_2026_05_14",
    evaluatedUserKey: "courrier_agent_1",
    evaluatingLeaderKey: "courrier_lead",
    criterionKey: "incident_response",
    score: 5,
    comment: "Handled route correction quickly and documented actions.",
  },
  {
    workScheduleKey: "courier_2026_05_14",
    evaluatedUserKey: "courrier_sublead",
    evaluatingLeaderKey: "courrier_lead",
    criterionKey: "teamwork",
    score: 4,
    comment: "Good support during peak transfer window.",
  },
  {
    workScheduleKey: "courier_2026_05_13",
    evaluatedUserKey: "courrier_agent_2",
    evaluatingLeaderKey: "courrier_lead",
    criterionKey: "discipline",
    score: 2,
    comment: "Absent without full pre-shift confirmation.",
  },
];

export const SEED_SIGNATURE_LOGS: SeedSignatureLogDefinition[] = [
  {
    workScheduleKey: "courier_2026_05_14",
    userKey: "courrier_lead",
    slipNumber: "SLIP-COURIER-014",
    signedAt: "2026-05-14T18:35:00.000Z",
    busArrivalTime: "2026-05-14T07:25:00.000Z",
  },
  {
    workScheduleKey: "courier_2026_05_14",
    userKey: "courrier_sublead",
    slipNumber: "SLIP-COURIER-015",
    signedAt: "2026-05-14T18:37:00.000Z",
    busArrivalTime: "2026-05-14T07:27:00.000Z",
  },
];
