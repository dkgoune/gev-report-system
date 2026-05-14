import type { Prisma } from "@/generated/prisma/client";

export function normalizeScheduleDate(value: string | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const parsed = new Date(`${trimmed}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export function isPastScheduleDate(workDate: Date) {
  const today = new Date();
  const startOfTodayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );

  return workDate.getTime() < startOfTodayUtc.getTime();
}

export function formatScheduleDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function getStartOfUtcDay(value: Date) {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate())
  );
}

export function getMondayOfWeek(value: Date) {
  const start = getStartOfUtcDay(value);
  const dayIndex = start.getUTCDay();
  const offset = dayIndex === 0 ? -6 : 1 - dayIndex;
  start.setUTCDate(start.getUTCDate() + offset);
  return start;
}

export function getSundayOfWeek(value: Date) {
  const monday = getMondayOfWeek(value);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return sunday;
}

export function listWeekDates(weekStart: Date) {
  const monday = getMondayOfWeek(weekStart);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setUTCDate(monday.getUTCDate() + index);
    return day;
  });
}

export function addUtcMonths(value: Date, months: number) {
  const result = new Date(value);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

export function isWeekWithinPlanningWindow(weekStart: Date) {
  const normalizedStart = getMondayOfWeek(weekStart);
  const currentWeekStart = getMondayOfWeek(new Date());
  const maxWeekStart = getMondayOfWeek(addUtcMonths(currentWeekStart, 3));

  return (
    normalizedStart.getTime() >= currentWeekStart.getTime() &&
    normalizedStart.getTime() <= maxWeekStart.getTime()
  );
}

export function parseWeekStart(value: string | undefined) {
  const parsed = normalizeScheduleDate(value);

  if (!parsed) {
    return null;
  }

  return getMondayOfWeek(parsed);
}

export async function buildScheduleIncidentRequirements(
  prisma: Prisma.TransactionClient,
  agencyId: string,
  serviceId: string,
  workScheduleId: string
): Promise<Prisma.WorkScheduleIncidentRequirementCreateManyInput[]> {
  const bindings = await prisma.serviceIncidentBinding.findMany({
    where: {
      serviceId,
      isActive: true,
      service: {
        agencyId,
      },
    },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      displayOrder: true,
      isActive: true,
      minEntries: true,
      maxEntries: true,
      isRequired: true,
      template: {
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
        },
      },
      templateVersion: {
        select: {
          id: true,
          version: true,
          status: true,
          publishedAt: true,
          fieldsJson: true,
        },
      },
    },
  });

  return bindings.map(binding => ({
    workScheduleId,
    serviceIncidentBindingId: binding.id,
    templateId: binding.template.id,
    templateVersionId: binding.templateVersion.id,
    configSnapshotJson: {
      binding: {
        minEntries: binding.minEntries,
        maxEntries: binding.maxEntries,
        isRequired: binding.isRequired,
        displayOrder: binding.displayOrder,
        isActive: binding.isActive,
      },
      template: {
        name: binding.template.name,
        code: binding.template.code,
        description: binding.template.description,
      },
      templateVersion: {
        version: binding.templateVersion.version,
        status: binding.templateVersion.status,
        publishedAt: binding.templateVersion.publishedAt,
      },
      fields: binding.templateVersion.fieldsJson,
    },
    displayOrder: binding.displayOrder,
    isActive: binding.isActive,
  }));
}
