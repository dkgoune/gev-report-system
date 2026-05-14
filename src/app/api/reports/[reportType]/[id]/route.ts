import { NextResponse } from "next/server";
import { canMarkReportsAsRead, hasLeadershipRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; reportType: string }> }
) {
  const session = await getServerSession();

  if (!session || !hasLeadershipRole(session)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id, reportType } = await context.params;
  if (reportType !== "general") {
    return NextResponse.json(
      { error: "Type de rapport introuvable." },
      { status: 404 }
    );
  }

  const report = await prisma.generalReport.findFirst({
    where: {
      id,
      workSchedule: {
        agencyId: session.activeAgencyId,
      },
    },
    include: {
      reportedBy: {
        select: {
          fullName: true,
          username: true,
        },
      },
      readBy: {
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
      incidentEntries: {
        orderBy: [{ displayOrder: "asc" }],
      },
    },
  });

  if (!report) {
    return NextResponse.json(
      { error: "Rapport introuvable." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    report: {
      id: report.id,
      reportDate: report.workSchedule.workDate.toISOString(),
      isRead: report.isRead,
      createdAt: report.createdAt.toISOString(),
      serviceId: report.workSchedule.service.id,
      serviceName: report.workSchedule.service.name,
      reportedBy: report.reportedBy,
      readBy: report.readBy,
      ambianceGenerale: report.ambianceGenerale,
      problemesRencontres: report.problemesRencontres,
      etatGeneralService: report.etatGeneralService,
      passationService: report.passationService,
      observationGeneral: report.observationGeneral,
      incidentEntries: report.incidentEntries.map(entry => ({
        id: entry.id,
        templateNameSnapshot: entry.templateNameSnapshot,
        valuesJson: entry.valuesJson,
      })),
    },
  });
}

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string; reportType: string }> }
) {
  const session = await getServerSession();

  if (!session || !canMarkReportsAsRead(session)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id, reportType } = await context.params;
  if (reportType !== "general") {
    return NextResponse.json(
      { error: "Type de rapport introuvable." },
      { status: 404 }
    );
  }

  try {
    const report = await prisma.generalReport.findFirst({
      where: {
        id,
        workSchedule: {
          agencyId: session.activeAgencyId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Rapport introuvable." },
        { status: 404 }
      );
    }

    await prisma.generalReport.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
        readById: session.userId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible de marquer le rapport comme lu.",
      },
      { status: 400 }
    );
  }
}
