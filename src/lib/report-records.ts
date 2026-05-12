import type { Role, Service } from "@/generated/prisma/enums";
import {
  GENERAL_SUBREPORT_SECTIONS,
  getGeneralSubReportFieldKeys,
  getGeneralSubReportFields,
  getGeneralSubReportSections,
  isGeneralSubReportEntryEmpty,
  type GeneralSubReportPayload,
  type GeneralSubReportSlug,
} from "@/lib/general-report-subreports";
import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/session";
import { buildScopedUserWhere } from "@/lib/user-scope";
import {
  REPORT_PAGE_SIZES,
  canAccessReportType,
  getReportType,
  getServiceForRole,
  type ReportFieldDefinition,
  type ReportTypeDefinition,
  type ReportTypeSlug,
} from "@/lib/report-types";

const REPORT_PERSONNEL_ROLES: Role[] = [
  "agent",
  "convoyer",
  "leader",
  "subleader",
];

type PrismaDelegate = {
  count: (args?: unknown) => Promise<number>;
  create: (args: unknown) => Promise<Record<string, unknown>>;
  findMany: (args?: unknown) => Promise<Array<Record<string, unknown>>>;
  findUnique: (args?: unknown) => Promise<Record<string, unknown> | null>;
  update: (args: unknown) => Promise<Record<string, unknown>>;
};

export type ReportActor = {
  id: string;
  fullName: string;
  username: string;
  role: Role;
  group: {
    id: string;
    name: string;
    service: Service;
  } | null;
};

export type ReportGroup = {
  id: string;
  name: string;
  service: Service;
};

export type ReportRecord = Record<string, unknown> & {
  id: string;
  reportDate: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  serviceContext: Service | null;
  group: ReportGroup | null;
  subReports?: GeneralSubReportPayload;
  reportedBy: ReportActor;
  readBy: ReportActor | null;
};

export type ReportListFilters = {
  endDate: string;
  groupId: string;
  isRead: string;
  page: number;
  pageSize: number;
  search: string;
  service: Service | "";
  sortDirection: "asc" | "desc";
  sortField: "createdAt" | "isRead" | "reportDate" | "reportedBy";
  startDate: string;
};

export type ReportListPayload = {
  filters: ReportListFilters;
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  reportType: ReportTypeDefinition;
  reports: ReportRecord[];
};

export type ReportCreateDefaults = {
  groupId: string;
  reportDate: string;
  reportType: ReportTypeDefinition;
  serviceContext: Service | null;
};

type ReportListQuery = {
  from?: string;
  groupId?: string;
  isRead?: string;
  page?: string;
  pageSize?: string;
  q?: string;
  sortDirection?: string;
  sortField?: string;
  service?: string;
  to?: string;
};

type ReportSortField = ReportListFilters["sortField"];

type ReportSortDirection = ReportListFilters["sortDirection"];

type AttendanceSelection = {
  absentSummary: string | null;
  absentUserIds: string[];
  presentSummary: string | null;
  presentUserIds: string[];
};

function getDelegate(
  reportType: ReportTypeDefinition,
  client: Record<string, unknown> = prisma as unknown as Record<string, unknown>
): PrismaDelegate {
  return (client as Record<string, PrismaDelegate>)[reportType.model];
}

function buildSelect(reportType: ReportTypeDefinition) {
  const fieldSelect = Object.fromEntries(
    reportType.fields.map(field => [field.key, true])
  );

  const baseSelect: Record<string, unknown> = {
    id: true,
    reportDate: true,
    isRead: true,
    readAt: true,
    createdAt: true,
    reportedBy: {
      select: {
        id: true,
        fullName: true,
        username: true,
        role: true,
        group: {
          select: {
            id: true,
            name: true,
            service: true,
          },
        },
      },
    },
    readBy: {
      select: {
        id: true,
        fullName: true,
        username: true,
        role: true,
        group: {
          select: {
            id: true,
            name: true,
            service: true,
          },
        },
      },
    },
    ...fieldSelect,
  };

  if (reportType.serviceField) {
    baseSelect.service = true;
  }

  if (reportType.slug === "general") {
    baseSelect.group = {
      select: {
        id: true,
        name: true,
        service: true,
      },
    };
    baseSelect.groupId = true;
  }

  return baseSelect;
}

function buildDetailSelect(reportType: ReportTypeDefinition) {
  const baseSelect = buildSelect(reportType);

  if (reportType.slug !== "general") {
    return baseSelect;
  }

  for (const section of GENERAL_SUBREPORT_SECTIONS) {
    baseSelect[section.relationKey] = {
      orderBy: [{ createdAt: "asc" }],
      select: Object.fromEntries([
        ["id", true],
        ["createdAt", true],
        ...getGeneralSubReportFieldKeys(section.slug).map(key => [key, true]),
      ]),
    };
  }

  return baseSelect;
}

function normalizeDateInput(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed || !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const date = new Date(`${trimmed}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return { date, value: trimmed };
}

function normalizeDateOnly(value: string | undefined) {
  return normalizeDateInput(value)?.value ?? "";
}

function normalizePage(value: string | undefined) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function normalizePageSize(value: string | undefined) {
  const parsed = Number(value);
  return REPORT_PAGE_SIZES.includes(
    parsed as (typeof REPORT_PAGE_SIZES)[number]
  )
    ? parsed
    : REPORT_PAGE_SIZES[0];
}

function normalizeReadFilter(value: string | undefined) {
  return value === "true" || value === "false" ? value : "";
}

function normalizeSortField(value: string | undefined): ReportSortField {
  switch (value) {
    case "createdAt":
    case "isRead":
    case "reportedBy":
      return value;
    default:
      return "reportDate";
  }
}

function normalizeSortDirection(
  value: string | undefined
): ReportSortDirection {
  return value === "asc" ? "asc" : "desc";
}

function normalizeGroupId(value: string | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

async function resolveCreateGroup(
  reportType: ReportTypeDefinition,
  session: SessionPayload,
  requestedGroupId: unknown
) {
  if (reportType.slug !== "general") {
    return null;
  }

  if (session.role === "admin") {
    const groupId =
      typeof requestedGroupId === "string" ? requestedGroupId.trim() : "";

    if (!groupId) {
      throw new Error("Groupe invalide.");
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        name: true,
        service: true,
      },
    });

    if (!group || !group.service) {
      throw new Error("Groupe invalide.");
    }

    return group;
  }

  if (!session.groupId) {
    throw new Error("Votre compte n'est lié à aucun groupe.");
  }

  const group = await prisma.group.findUnique({
    where: { id: session.groupId },
    select: {
      id: true,
      name: true,
      service: true,
    },
  });

  if (!group || !group.service) {
    throw new Error("Votre groupe est introuvable.");
  }

  return group;
}

function normalizeText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map(item => item.trim())
        .filter(Boolean)
    )
  );
}

function normalizeNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error("Valeur numérique invalide.");
  }

  return parsed;
}

function normalizeCheckbox(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true";
  }

  return false;
}

function normalizeTime(reportDate: string, value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  if (!/^\d{2}:\d{2}$/.test(value)) {
    throw new Error("Heure invalide.");
  }

  const date = new Date(`${reportDate}T${value}:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Heure invalide.");
  }

  return date;
}

function normalizeFieldValue(
  field: ReportFieldDefinition,
  reportDate: string,
  value: unknown
) {
  switch (field.type) {
    case "number":
      return normalizeNumber(value);
    case "checkbox":
      return normalizeCheckbox(value);
    case "time":
      return normalizeTime(reportDate, value);
    default:
      return normalizeText(value);
  }
}

function isServiceAllowed(
  reportType: ReportTypeDefinition,
  service: string
): service is Service {
  return reportType.allowedServices.includes(service as Service);
}

function resolveListServiceFilter(
  reportType: ReportTypeDefinition,
  role: Role,
  groupService: Service | null,
  requestedService: string | undefined
): Service | "" {
  if (role === "admin") {
    return requestedService && isServiceAllowed(reportType, requestedService)
      ? requestedService
      : "";
  }

  const roleService = getServiceForRole(role, groupService);

  if (!roleService || !reportType.allowedServices.includes(roleService)) {
    return "";
  }

  return roleService;
}

function resolveCreateService(
  reportType: ReportTypeDefinition,
  session: SessionPayload,
  requestedService: unknown
) {
  if (!reportType.serviceField) {
    return null;
  }

  if (session.role === "admin") {
    if (
      typeof requestedService === "string" &&
      isServiceAllowed(reportType, requestedService)
    ) {
      return requestedService;
    }

    return reportType.allowedServices[0] ?? null;
  }

  const roleService = getServiceForRole(session.role, session.groupService);
  return roleService && reportType.allowedServices.includes(roleService)
    ? roleService
    : null;
}

function resolveListGroupFilter(
  session: SessionPayload,
  requestedGroupId: string | undefined
) {
  if (session.role === "admin") {
    return normalizeGroupId(requestedGroupId);
  }

  if (session.role === "leader") {
    return session.groupId ?? "";
  }

  return "";
}

function buildServiceWhere(
  reportType: ReportTypeDefinition,
  service: Service | ""
) {
  if (!service) {
    return {};
  }

  if (reportType.serviceField) {
    return { service };
  }

  return {
    reportedBy: {
      group: {
        service,
      },
    },
  };
}

function buildGroupWhere(groupId: string) {
  if (!groupId) {
    return {};
  }

  return {
    groupId,
  };
}

function buildOrderBy(
  sortField: ReportSortField,
  sortDirection: ReportSortDirection
) {
  if (sortField === "reportedBy") {
    return [
      { reportedBy: { fullName: sortDirection } },
      { reportDate: "desc" },
      { createdAt: "desc" },
    ];
  }

  if (sortField === "isRead") {
    return [
      { isRead: sortDirection },
      { reportDate: "desc" },
      { createdAt: "desc" },
    ];
  }

  return [
    { [sortField]: sortDirection },
    ...(sortField === "reportDate"
      ? [{ createdAt: "desc" }]
      : [{ reportDate: "desc" }]),
  ];
}

function serializeValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        serializeValue(nestedValue),
      ])
    );
  }

  return value;
}

function resolveServiceContext(
  reportType: ReportTypeDefinition,
  record: Record<string, unknown>
): Service | null {
  if (reportType.slug === "general") {
    const group = record.group as
      | { service?: Service | null }
      | null
      | undefined;
    return group?.service ?? null;
  }

  if (reportType.serviceField) {
    const service = record.service;
    return typeof service === "string" ? (service as Service) : null;
  }

  const reportedBy = record.reportedBy as
    | { group?: { service?: Service | null } | null }
    | undefined;
  return reportedBy?.group?.service ?? null;
}

function resolveReportGroup(record: Record<string, unknown>) {
  const group = record.group as ReportGroup | null | undefined;
  return group ?? null;
}

function serializeReportRecord(
  reportType: ReportTypeDefinition,
  record: Record<string, unknown>
) {
  const serialized = serializeValue(record) as ReportRecord;

  if (reportType.slug === "general") {
    const subReports = Object.fromEntries(
      GENERAL_SUBREPORT_SECTIONS.map(section => [
        section.slug,
        Array.isArray(serialized[section.relationKey])
          ? (serialized[section.relationKey] as Array<Record<string, unknown>>)
          : [],
      ])
    ) as GeneralSubReportPayload;

    serialized.subReports = subReports;
  }

  return {
    ...serialized,
    group: resolveReportGroup(record),
    serviceContext: resolveServiceContext(reportType, record),
  } satisfies ReportRecord;
}

function normalizeGeneralSubReportEntries(
  slug: GeneralSubReportSlug,
  service: Service,
  reportDate: string,
  value: unknown
) {
  if (!Array.isArray(value)) {
    return [];
  }

  const fields = getGeneralSubReportFields(slug, service);

  return value
    .filter((entry): entry is Record<string, unknown> =>
      Boolean(entry && typeof entry === "object" && !Array.isArray(entry))
    )
    .map(entry => {
      const normalizedEntry = Object.fromEntries(
        fields.map((field: ReportFieldDefinition) => [
          field.key,
          normalizeFieldValue(field, reportDate, entry[field.key]),
        ])
      ) as Record<string, unknown>;

      return normalizedEntry;
    })
    .filter(entry => !isGeneralSubReportEntryEmpty(slug, service, entry));
}

async function createGeneralSubReports(
  client: Record<string, unknown>,
  service: Service,
  reportDate: { date: Date; value: string },
  reportedById: string,
  generalReportId: string,
  body: Record<string, unknown>
) {
  const requestedSubReports =
    body.subReports && typeof body.subReports === "object"
      ? (body.subReports as Record<string, unknown>)
      : {};

  for (const section of getGeneralSubReportSections(service)) {
    const reportType = getReportTypeOrThrow(section.slug);
    const delegate = getDelegate(reportType, client);
    const normalizedEntries = normalizeGeneralSubReportEntries(
      section.slug,
      service,
      reportDate.value,
      requestedSubReports[section.slug]
    );

    for (const entry of normalizedEntries) {
      const data: Record<string, unknown> = {
        reportDate: reportDate.date,
        reportedById,
        generalReportId,
      };

      if (reportType.serviceField) {
        data.service = service;
      }

      for (const field of getGeneralSubReportFields(section.slug, service)) {
        data[field.key] = entry[field.key] ?? null;
      }

      await delegate.create({ data });
    }
  }
}

function canAccessReportRecord(
  reportType: ReportTypeDefinition,
  session: SessionPayload,
  record: Record<string, unknown>
) {
  if (session.role === "admin") {
    return true;
  }

  const roleService = getServiceForRole(session.role, session.groupService);

  if (!roleService) {
    return false;
  }

  if (resolveServiceContext(reportType, record) !== roleService) {
    return false;
  }

  if (session.role === "leader") {
    const group = record.group as { id?: string | null } | null | undefined;

    return group?.id === session.groupId;
  }

  return false;
}

function buildSearchConditions(
  reportType: ReportTypeDefinition,
  search: string
) {
  const searchConditions: Array<Record<string, unknown>> =
    reportType.searchFields.map(field => ({
      [field]: { contains: search, mode: "insensitive" },
    }));

  searchConditions.push(
    { reportedBy: { fullName: { contains: search, mode: "insensitive" } } },
    { reportedBy: { username: { contains: search, mode: "insensitive" } } }
  );

  return searchConditions;
}

function buildPersonnelSummary(
  users: Array<{ id: string; fullName: string; role: Role }>,
  userIds: string[]
) {
  if (userIds.length === 0) {
    return null;
  }

  const usersById = new Map(users.map(user => [user.id, user]));

  return userIds
    .map(userId => usersById.get(userId))
    .filter((user): user is { id: string; fullName: string; role: Role } =>
      Boolean(user)
    )
    .map(user => `${user.fullName} (${user.role})`)
    .join("\n");
}

async function resolveAttendanceSelection(
  slug: ReportTypeSlug,
  session: SessionPayload,
  service: Service | null,
  body: Record<string, unknown>
): Promise<AttendanceSelection | null> {
  if (slug !== "general") {
    return null;
  }

  const presentUserIds = normalizeStringArray(body.presentPersonnelIds);
  const absentUserIds = normalizeStringArray(body.absentPersonnelIds);
  const selectedUserIds = Array.from(
    new Set([...presentUserIds, ...absentUserIds])
  );

  if (presentUserIds.some(userId => absentUserIds.includes(userId))) {
    throw new Error("Un même personnel ne peut pas être présent et absent.");
  }

  if (selectedUserIds.length === 0) {
    return {
      absentSummary: null,
      absentUserIds,
      presentSummary: null,
      presentUserIds,
    };
  }

  const users = await prisma.user.findMany({
    where: {
      ...buildScopedUserWhere(session, REPORT_PERSONNEL_ROLES),
      ...(service
        ? {
            group: {
              service,
            },
          }
        : {}),
      id: { in: selectedUserIds },
    },
    select: {
      id: true,
      fullName: true,
      role: true,
    },
  });

  if (users.length !== selectedUserIds.length) {
    throw new Error(
      "Une sélection de personnel est invalide pour votre groupe."
    );
  }

  return {
    absentSummary: buildPersonnelSummary(users, absentUserIds),
    absentUserIds,
    presentSummary: buildPersonnelSummary(users, presentUserIds),
    presentUserIds,
  };
}

async function applyAutomaticAttendanceEvaluations(
  client: typeof prisma,
  session: SessionPayload,
  reportDate: string,
  selection: AttendanceSelection
) {
  const statusUserIds = {
    PRESENT: selection.presentUserIds,
    ABSENT: selection.absentUserIds,
  } as const;

  const requestedStatuses = Object.entries(statusUserIds)
    .filter(([, userIds]) => userIds.length > 0)
    .map(([status]) => status as "PRESENT" | "ABSENT");

  if (requestedStatuses.length === 0) {
    return;
  }

  const settings = await client.attendanceCriterionSetting.findMany({
    where: {
      status: { in: requestedStatuses },
      criterion: { isActive: true },
    },
    select: {
      status: true,
      criterionId: true,
      criterion: {
        select: {
          name: true,
          maxDaily: true,
        },
      },
    },
  });

  if (settings.length === 0) {
    return;
  }

  const allUserIds = Array.from(
    new Set([...selection.presentUserIds, ...selection.absentUserIds])
  );
  const allCriterionIds = Array.from(
    new Set(settings.map(setting => setting.criterionId))
  );
  const existingEvaluations = await client.personnelEvaluation.findMany({
    where: {
      userId: { in: allUserIds },
      criteriaId: { in: allCriterionIds },
      evaluationDate: {
        gte: new Date(`${reportDate}T00:00:00.000Z`),
        lte: new Date(`${reportDate}T23:59:59.999Z`),
      },
    },
    select: {
      userId: true,
      criteriaId: true,
    },
  });

  const counts = new Map<string, number>();

  for (const evaluation of existingEvaluations) {
    const key = `${evaluation.userId}:${evaluation.criteriaId}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const toCreate: Array<{
    criteriaId: string;
    evaluationDate: Date;
    notes: string;
    recordedById: string;
    userId: string;
    weightOverride: null;
  }> = [];

  for (const setting of settings) {
    const targetUserIds = statusUserIds[setting.status];

    for (const userId of targetUserIds) {
      const key = `${userId}:${setting.criterionId}`;
      const currentCount = counts.get(key) ?? 0;

      if (
        setting.criterion.maxDaily !== null &&
        currentCount >= setting.criterion.maxDaily
      ) {
        continue;
      }

      toCreate.push({
        criteriaId: setting.criterionId,
        evaluationDate: new Date(`${reportDate}T00:00:00.000Z`),
        notes: `Application automatique via rapport général (${setting.status === "PRESENT" ? "présent" : "absent"}).`,
        recordedById: session.userId,
        userId,
        weightOverride: null,
      });
      counts.set(key, currentCount + 1);
    }
  }

  if (toCreate.length === 0) {
    return;
  }

  await client.personnelEvaluation.createMany({
    data: toCreate,
  });
}

export function getReportTypeOrThrow(slug: string) {
  const reportType = getReportType(slug);

  if (!reportType) {
    throw new Error("Type de rapport introuvable.");
  }

  return reportType;
}

export async function listReports(
  slug: ReportTypeSlug,
  session: SessionPayload,
  query: ReportListQuery
): Promise<ReportListPayload> {
  const reportType = getReportTypeOrThrow(slug);

  if (!canAccessReportType(session.role, reportType, session.groupService)) {
    throw new Error("Accès refusé à ce type de rapport.");
  }

  const delegate = getDelegate(reportType);
  const search = (query.q || "").trim();
  const startDate = normalizeDateOnly(query.from);
  const endDate = normalizeDateOnly(query.to);
  const pageSize = normalizePageSize(query.pageSize);
  const sortField = normalizeSortField(query.sortField);
  const sortDirection = normalizeSortDirection(query.sortDirection);
  const service = resolveListServiceFilter(
    reportType,
    session.role,
    session.groupService,
    query.service
  );
  const groupId = resolveListGroupFilter(session, query.groupId);
  const isRead = normalizeReadFilter(query.isRead);
  const where: Record<string, unknown> = {
    ...buildServiceWhere(reportType, service),
    ...buildGroupWhere(groupId),
  };

  if (isRead) {
    where.isRead = isRead === "true";
  }

  if (search) {
    where.OR = buildSearchConditions(reportType, search);
  }

  if (startDate || endDate) {
    where.reportDate = {};

    if (startDate) {
      (where.reportDate as Record<string, unknown>).gte = new Date(
        `${startDate}T00:00:00.000Z`
      );
    }

    if (endDate) {
      (where.reportDate as Record<string, unknown>).lte = new Date(
        `${endDate}T00:00:00.000Z`
      );
    }
  }

  const totalItems = await delegate.count({ where });
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const page = Math.min(normalizePage(query.page), totalPages);
  const records = await delegate.findMany({
    where,
    orderBy: buildOrderBy(sortField, sortDirection),
    skip: (page - 1) * pageSize,
    take: pageSize,
    select: buildSelect(reportType),
  });

  return {
    reportType,
    reports: records.map(record => serializeReportRecord(reportType, record)),
    filters: {
      search,
      service,
      groupId,
      isRead,
      startDate,
      endDate,
      page,
      pageSize,
      sortField,
      sortDirection,
    },
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
    },
  };
}

export function getCreateDefaults(
  slug: ReportTypeSlug,
  session: SessionPayload,
  query: { date?: string; groupId?: string }
): ReportCreateDefaults {
  const reportType = getReportTypeOrThrow(slug);

  if (!canAccessReportType(session.role, reportType, session.groupService)) {
    throw new Error("Accès refusé à ce type de rapport.");
  }

  const reportDate =
    normalizeDateOnly(query.date) || new Date().toISOString().slice(0, 10);
  const serviceContext = getServiceForRole(session.role, session.groupService);

  return {
    groupId:
      session.role === "admin"
        ? normalizeGroupId(query.groupId)
        : (session.groupId ?? ""),
    reportType,
    reportDate,
    serviceContext,
  };
}

export async function getReportById(
  slug: ReportTypeSlug,
  id: string,
  session: SessionPayload
) {
  const reportType = getReportTypeOrThrow(slug);

  if (!canAccessReportType(session.role, reportType, session.groupService)) {
    return null;
  }

  const delegate = getDelegate(reportType);
  const record = await delegate.findUnique({
    where: { id },
    select: buildDetailSelect(reportType),
  });

  if (!record || !canAccessReportRecord(reportType, session, record)) {
    return null;
  }

  return {
    reportType,
    report: serializeReportRecord(reportType, record),
  };
}

export async function createReport(
  slug: ReportTypeSlug,
  session: SessionPayload,
  body: Record<string, unknown>
) {
  const reportType = getReportTypeOrThrow(slug);

  if (!canAccessReportType(session.role, reportType, session.groupService)) {
    throw new Error("Accès refusé à ce type de rapport.");
  }

  const normalizedDate = normalizeDateInput(
    typeof body.reportDate === "string" ? body.reportDate : undefined
  );

  if (!normalizedDate) {
    throw new Error("Date de rapport invalide.");
  }

  const group = await resolveCreateGroup(reportType, session, body.groupId);
  const service =
    group?.service ?? resolveCreateService(reportType, session, undefined);

  if (reportType.slug === "general" && !group) {
    throw new Error("Groupe invalide.");
  }

  if (reportType.serviceField && !service) {
    throw new Error("Service invalide.");
  }

  const attendanceSelection = await resolveAttendanceSelection(
    slug,
    session,
    service,
    body
  );

  const data: Record<string, unknown> = {
    reportDate: normalizedDate.date,
    reportedById: session.userId,
  };

  if (group?.id) {
    data.groupId = group.id;
  }

  if (service) {
    data.service = service;
  }

  for (const field of reportType.fields) {
    if (slug === "general" && field.key === "personnelPresent") {
      data[field.key] = attendanceSelection?.presentSummary ?? null;
      continue;
    }

    if (slug === "general" && field.key === "personnelAbsent") {
      data[field.key] = attendanceSelection?.absentSummary ?? null;
      continue;
    }

    data[field.key] = normalizeFieldValue(
      field,
      normalizedDate.value,
      body[field.key]
    );
  }

  const createdRecord = await prisma.$transaction(async transaction => {
    const delegate = getDelegate(
      reportType,
      transaction as unknown as Record<string, unknown>
    );
    const record = await delegate.create({
      data,
      select: buildSelect(reportType),
    });

    if (attendanceSelection) {
      await applyAutomaticAttendanceEvaluations(
        transaction as typeof prisma,
        session,
        normalizedDate.value,
        attendanceSelection
      );
    }

    if (slug === "general" && service) {
      await createGeneralSubReports(
        transaction as unknown as Record<string, unknown>,
        service,
        normalizedDate,
        session.userId,
        String(record.id),
        body
      );
    }

    return record;
  });

  return {
    reportType,
    report: serializeReportRecord(reportType, createdRecord),
  };
}

export async function markReportAsRead(
  slug: ReportTypeSlug,
  id: string,
  session: SessionPayload
) {
  const reportType = getReportTypeOrThrow(slug);

  if (session.role !== "admin" && session.role !== "leader") {
    throw new Error("Action réservée aux administrateurs et leaders.");
  }

  const delegate = getDelegate(reportType);

  try {
    const existingRecord = await delegate.findUnique({
      where: { id },
      select: buildSelect(reportType),
    });

    if (
      !existingRecord ||
      !canAccessReportRecord(reportType, session, existingRecord)
    ) {
      return null;
    }

    const updatedRecord = await delegate.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
        readById: session.userId,
      },
      select: buildSelect(reportType),
    });

    return {
      reportType,
      report: serializeReportRecord(reportType, updatedRecord),
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return null;
    }

    throw error;
  }
}
