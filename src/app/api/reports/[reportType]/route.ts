import { NextResponse } from "next/server";
import {
  canAccessAgencyAdminWorkspace,
  canCreateReports,
  hasLeadershipRole,
} from "@/lib/authz";
import { sanitizeIncidentFields } from "@/lib/incident-field-schema";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { Prisma } from "@/generated/prisma/browser";

export async function GET(
  request: Request,
  context: { params: Promise<{ reportType: string }> }
) {
  const session = await getServerSession();

  if (!session || !hasLeadershipRole(session)) {
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

    const where: Record<string, unknown> = {
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

    const totalItems = await prisma.generalReport.count({
      where: where as never,
    });

    const reports = await prisma.generalReport.findMany({
      where: where as never,
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
        createdAt: report.createdAt.toISOString(),
        serviceId: report.workSchedule.service.id,
        serviceName: report.workSchedule.service.name,
        reportedBy: {
          fullName: report.reportedBy.fullName,
          username: report.reportedBy.username,
          role: session.activeMembershipRole,
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

  if (!session || !canCreateReports(session)) {
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
    const body = (await request.json()) as {
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

    const created = await prisma.$transaction(async tx => {
      const isAdmin = canAccessAgencyAdminWorkspace(session);

      const schedule = await tx.workSchedule.findFirst({
        where: {
          id: workScheduleId,
          agencyId: session.activeAgencyId,
          ...(!isAdmin
            ? {
                assignments: {
                  some: {
                    userId: session.userId,
                    OR: [{ isLeader: true }, { isSubleader: true }],
                  },
                },
              }
            : {}),
        },
        select: {
          id: true,
          workDate: true,
          serviceId: true,
        },
      });

      if (!schedule) {
        throw new Error("Accès refusé au planning sélectionné.");
      }

      const scheduleDateIso = schedule.workDate.toISOString().slice(0, 10);
      if (scheduleDateIso > todayIso || scheduleDateIso < earliestIso) {
        throw new Error("Le planning sélectionné n'est plus éligible.");
      }

      const report = await tx.generalReport.create({
        data: {
          workScheduleId: schedule.id,
          reportedById: session.userId,
          personnelPresent: (body.presentPersonnelIds || []).join(","),
          personnelAbsent: (body.absentPersonnelIds || []).join(","),
          ambianceGenerale: body.ambianceGenerale?.trim() || null,
          problemesRencontres: body.problemesRencontres?.trim() || null,
          etatGeneralService: body.etatGeneralService?.trim() || null,
          passationService: body.passationService?.trim() || null,
          observationGeneral: body.observationGeneral?.trim() || null,
        },
      });

      const incidentPayload = body.incidentEntries || {};
      const bindingIds = Object.keys(incidentPayload);

      if (bindingIds.length > 0) {
        const bindings = await tx.serviceIncidentBinding.findMany({
          where: {
            id: {
              in: bindingIds,
            },
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
                id: true,
                fieldsJson: true,
              },
            },
          },
        });

        let displayOrder = 0;
        for (const binding of bindings) {
          const entries = incidentPayload[binding.id] || [];
          for (const entry of entries) {
            await tx.generalReportIncidentEntry.create({
              data: {
                generalReportId: report.id,
                workScheduleId: schedule.id,
                templateId: binding.templateId,
                templateVersionId: binding.templateVersionId,
                templateNameSnapshot: binding.template.name,
                templateCodeSnapshot: binding.template.code,
                valuesJson: entry as unknown as Prisma.JsonObject,
                schemaSnapshotJson: sanitizeIncidentFields(
                  binding.templateVersion.fieldsJson
                ),
                displayOrder,
              },
            });
            displayOrder += 1;
          }
        }
      }

      return report;
    });

    return NextResponse.json(
      { ok: true, report: { id: created.id } },
      { status: 201 }
    );
  } catch (error) {
    console.log(error, "error lors de la creation du rapport");
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Un rapport existe déjà pour cette période ou ces critères." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: getErrorMessage(error, "Impossible d'enregistrer le rapport.") },
      { status: getErrorStatus(error, 400) }
    );
  }
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

  return fallback;
}
