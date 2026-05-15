import { NextResponse } from "next/server";
import { sanitizeIncidentFields } from "@/lib/incident-field-schema";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { Prisma } from "@/generated/prisma/browser";
import { hasPermission } from "@/lib/permissions";

type ReportWriteBody = {
  reportId?: string;
  workScheduleId?: string;
  presentPersonnelIds?: string[];
  absentPersonnelIds?: string[];
  ambianceGenerale?: string;
  problemesRencontres?: string;
  etatGeneralService?: string;
  passationService?: string;
  observationGeneral?: string;
  incidentEntries?: Record<string, Array<Record<string, unknown>>>;
};

function normalizeIncidentEntries(
  incidentEntries: unknown
): Record<string, Array<Record<string, unknown>>> {
  if (!incidentEntries || typeof incidentEntries !== "object") {
    return {};
  }

  const result: Record<string, Array<Record<string, unknown>>> = {};

  for (const [bindingId, entries] of Object.entries(incidentEntries)) {
    if (!Array.isArray(entries)) {
      continue;
    }

    const normalizedEntries = entries.filter(
      (entry): entry is Record<string, unknown> =>
        !!entry && typeof entry === "object" && !Array.isArray(entry)
    );

    result[bindingId] = normalizedEntries;
  }

  return result;
}

function normalizeIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) {
    return [];
  }

  return Array.from(
    new Set(
      ids.filter(value => typeof value === "string").map(value => value.trim())
    )
  ).filter(Boolean);
}

function toTrimmedOrNull(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getErrorStatus(error: unknown, fallback: number) {
  if (!(error instanceof Error)) {
    return fallback;
  }

  if (error.message.includes("introuvable")) {
    return 404;
  }

  if (error.message.includes("Accès refusé")) {
    return 403;
  }

  if (error.message.includes("publié")) {
    return 409;
  }

  return fallback;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ reportType: string }> }
) {
  const session = await getServerSession();

  if (
    !session ||
    !hasPermission(
      session,
      "report_read",
      "report_create",
      "report_mark_read",
      "report_update"
    )
  ) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { reportType } = await context.params;
  if (reportType !== "general") {
    return NextResponse.json(
      { error: "Type de rapport introuvable." },
      { status: 404 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const serviceId = (searchParams.get("serviceId") || "").trim();
    const page = Math.max(Number(searchParams.get("page") || "1"), 1);
    const pageSize = [10, 20, 50].includes(
      Number(searchParams.get("pageSize") || "20")
    )
      ? Number(searchParams.get("pageSize") || "20")
      : 20;

    const where: Prisma.GeneralReportWhereInput = {
      workSchedule: {
        agencyId: session.activeAgencyId,
        ...(serviceId ? { serviceId } : {}),
      },
    };

    if (q) {
      where.OR = [
        { ambianceGenerale: { contains: q, mode: "insensitive" } },
        { problemesRencontres: { contains: q, mode: "insensitive" } },
        { observationGeneral: { contains: q, mode: "insensitive" } },
      ];
    }

    const totalItems = await prisma.generalReport.count({ where });

    const reports = await prisma.generalReport.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        reportedBy: {
          select: {
            fullName: true,
            username: true,
          },
        },
        workSchedule: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      filters: {
        search: q,
        serviceId,
        isRead: "",
        startDate: "",
        endDate: "",
        page,
        pageSize,
        sortField: "createdAt",
        sortDirection: "desc",
      },
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages: Math.max(Math.ceil(totalItems / pageSize), 1),
      },
      reports: reports.map(report => ({
        id: report.id,
        reportDate: report.workSchedule.workDate.toISOString(),
        isRead: report.isRead,
        status: report.status,
        publishedAt: report.publishedAt?.toISOString() ?? null,
        createdAt: report.createdAt.toISOString(),
        serviceId: report.workSchedule.service.id,
        serviceName: report.workSchedule.service.name,
        reportedBy: {
          fullName: report.reportedBy.fullName,
          username: report.reportedBy.username,
        },
        problemesRencontres: report.problemesRencontres,
        observationGeneral: report.observationGeneral,
        ambianceGenerale: report.ambianceGenerale,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Impossible de charger les rapports.") },
      { status: getErrorStatus(error, 400) }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ reportType: string }> }
) {
  const session = await getServerSession();

  if (!session || !hasPermission(session, "report_create", "report_update")) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { reportType } = await context.params;
  if (reportType !== "general") {
    return NextResponse.json(
      { error: "Type de rapport introuvable." },
      { status: 404 }
    );
  }

  try {
    const body = (await request.json()) as ReportWriteBody;
    const reportId = (body.reportId || "").trim();
    const workScheduleId = (body.workScheduleId || "").trim();

    if (!workScheduleId) {
      return NextResponse.json(
        { error: "Planning obligatoire." },
        { status: 400 }
      );
    }

    const todayIso = new Date().toISOString().slice(0, 10);
    const earliestIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const saved = await prisma.$transaction(async tx => {
      const schedule = await tx.workSchedule.findFirst({
        where: {
          id: workScheduleId,
          agencyId: session.activeAgencyId,
        },
        select: {
          id: true,
          workDate: true,
          serviceId: true,
          assignments: {
            select: {
              userId: true,
            },
          },
          generalReport: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      if (!schedule) {
        throw new Error("Accès refusé au planning sélectionné.");
      }

      const scheduleDateIso = schedule.workDate.toISOString().slice(0, 10);
      if (scheduleDateIso > todayIso || scheduleDateIso < earliestIso) {
        throw new Error("Le planning sélectionné n'est plus éligible.");
      }

      if (schedule.generalReport?.status === "published") {
        throw new Error("Ce rapport est déjà publié.");
      }

      if (
        reportId &&
        schedule.generalReport &&
        schedule.generalReport.id !== reportId
      ) {
        throw new Error("Rapport introuvable pour ce planning.");
      }

      const validScheduleUserIds = new Set(
        schedule.assignments.map(assignment => assignment.userId)
      );

      const requestedPresentIds = normalizeIds(body.presentPersonnelIds);
      const requestedAbsentIds = normalizeIds(body.absentPersonnelIds);

      for (const userId of [...requestedPresentIds, ...requestedAbsentIds]) {
        if (!validScheduleUserIds.has(userId)) {
          throw new Error(
            "Les présences/absences doivent correspondre au personnel du planning."
          );
        }
      }

      const presentIdSet = new Set(requestedPresentIds);
      const absentIdSet = new Set(requestedAbsentIds);

      for (const userId of presentIdSet) {
        if (absentIdSet.has(userId)) {
          throw new Error("Un personnel ne peut pas être présent et absent.");
        }
      }

      const presentIds = Array.from(presentIdSet);
      const absentIds = requestedAbsentIds.length
        ? Array.from(absentIdSet)
        : Array.from(validScheduleUserIds).filter(
            userId => !presentIdSet.has(userId)
          );

      const report = schedule.generalReport
        ? await tx.generalReport.update({
            where: { id: schedule.generalReport.id },
            data: {
              ambianceGenerale: toTrimmedOrNull(body.ambianceGenerale),
              problemesRencontres: toTrimmedOrNull(body.problemesRencontres),
              etatGeneralService: toTrimmedOrNull(body.etatGeneralService),
              passationService: toTrimmedOrNull(body.passationService),
              observationGeneral: toTrimmedOrNull(body.observationGeneral),
              status: "draft",
              publishedAt: null,
            },
            select: {
              id: true,
              workScheduleId: true,
              status: true,
            },
          })
        : await tx.generalReport.create({
            data: {
              workScheduleId: schedule.id,
              reportedById: session.userId,
              ambianceGenerale: toTrimmedOrNull(body.ambianceGenerale),
              problemesRencontres: toTrimmedOrNull(body.problemesRencontres),
              etatGeneralService: toTrimmedOrNull(body.etatGeneralService),
              passationService: toTrimmedOrNull(body.passationService),
              observationGeneral: toTrimmedOrNull(body.observationGeneral),
              status: "draft",
            },
            select: {
              id: true,
              workScheduleId: true,
              status: true,
            },
          });

      await tx.generalReportPersonnelAttendance.deleteMany({
        where: {
          generalReportId: report.id,
        },
      });

      const attendanceRows = [
        ...presentIds.map(userId => ({ userId, status: "present" as const })),
        ...absentIds.map(userId => ({ userId, status: "absent" as const })),
      ];

      if (attendanceRows.length > 0) {
        await tx.generalReportPersonnelAttendance.createMany({
          data: attendanceRows.map(attendance => ({
            generalReportId: report.id,
            userId: attendance.userId,
            status: attendance.status,
          })),
        });
      }

      await tx.generalReportIncidentEntry.deleteMany({
        where: {
          generalReportId: report.id,
        },
      });

      const incidentPayload = normalizeIncidentEntries(body.incidentEntries);
      const bindingIds = Object.keys(incidentPayload);

      if (bindingIds.length > 0) {
        const bindings = await tx.serviceIncidentBinding.findMany({
          where: {
            id: { in: bindingIds },
            serviceId: schedule.serviceId,
            service: {
              agencyId: session.activeAgencyId,
            },
          },
          include: {
            template: {
              select: { name: true, code: true },
            },
            templateVersion: {
              select: {
                fieldsJson: true,
              },
            },
          },
        });

        if (bindings.length !== bindingIds.length) {
          throw new Error("Certaines liaisons d'incident sont invalides.");
        }

        let displayOrder = 0;
        const incidentRows: Prisma.GeneralReportIncidentEntryCreateManyInput[] =
          [];

        for (const binding of bindings) {
          const entries = incidentPayload[binding.id] || [];

          for (const entry of entries) {
            incidentRows.push({
              generalReportId: report.id,
              workScheduleId: schedule.id,
              templateId: binding.templateId,
              templateVersionId: binding.templateVersionId,
              templateNameSnapshot: binding.template.name,
              templateCodeSnapshot: binding.template.code,
              valuesJson: entry as unknown as Prisma.InputJsonValue,
              schemaSnapshotJson: sanitizeIncidentFields(
                binding.templateVersion.fieldsJson
              ) as unknown as Prisma.InputJsonValue,
              displayOrder,
            });
            displayOrder += 1;
          }
        }

        if (incidentRows.length > 0) {
          await tx.generalReportIncidentEntry.createMany({
            data: incidentRows,
          });
        }
      }

      return report;
    });

    return NextResponse.json(
      {
        ok: true,
        report: { id: saved.id, status: saved.status },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, "Impossible d'enregistrer le rapport.") },
      { status: getErrorStatus(error, 400) }
    );
  }
}
