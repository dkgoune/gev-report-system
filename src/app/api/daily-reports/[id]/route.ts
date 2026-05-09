import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { canAccessPlatform } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServiceForRole } from "@/lib/services";
import { getServerSession } from "@/lib/session";

const dailyReportSelect = {
  id: true,
  reportDate: true,
  service: true,
  isRead: true,
  readAt: true,
  personnelPresent: true,
  personnelAbsent: true,
  ambianceGenerale: true,
  problemesRencontres: true,
  etatGeneralService: true,
  passationService: true,
  observationGeneral: true,
  createdAt: true,
  reportedBy: {
    select: {
      id: true,
      fullName: true,
      username: true,
    },
  },
  readBy: {
    select: {
      id: true,
      fullName: true,
      username: true,
    },
  },
} as unknown as Prisma.DailyGeneralReportSelect;

function serializeReportDates<
  T extends { reportDate: Date; createdAt: Date; readAt?: Date | null },
>(report: T) {
  return {
    ...report,
    reportDate: report.reportDate.toISOString(),
    createdAt: report.createdAt.toISOString(),
    readAt: report.readAt ? report.readAt.toISOString() : null,
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();

  if (!session || !canAccessPlatform(session.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await context.params;
  const report = await prisma.dailyGeneralReport.findUnique({
    where: { id },
    select: dailyReportSelect,
  });

  if (!report) {
    return NextResponse.json(
      { error: "Rapport introuvable." },
      { status: 404 },
    );
  }

  const leaderService = getServiceForRole(session.role);

  if (session.role !== "admin" && report.service !== leaderService) {
    return NextResponse.json(
      { error: "Rapport introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json({ report: serializeReportDates(report) });
}

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession();

  if (!session || !canAccessPlatform(session.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (session.role !== "admin") {
    return NextResponse.json(
      { error: "Action réservée aux administrateurs." },
      { status: 403 },
    );
  }

  const { id } = await context.params;

  const report = await prisma.dailyGeneralReport
    .update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
        readById: session.userId,
      } as unknown as Prisma.DailyGeneralReportUpdateInput,
      select: dailyReportSelect,
    })
    .catch((error: unknown) => {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "P2025"
      ) {
        return null;
      }

      throw error;
    });

  if (!report) {
    return NextResponse.json(
      { error: "Rapport introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    report: serializeReportDates(report),
  });
}
