import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { canAccessPlatform } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import {
  canChooseReportService,
  getServiceForRole,
  isValidService,
} from "@/lib/services";
import { getServerSession } from "@/lib/session";

const dailyReportSelect = {
  id: true,
  reportDate: true,
  service: true,
  isRead: true,
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
} satisfies Prisma.DailyGeneralReportSelect;

function normalizeDateInput(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const date = new Date(`${trimmed}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return { date, value: trimmed };
}

function normalizeText(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizePage(value: string | null) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function normalizePageSize(value: string | null) {
  const parsed = Number(value);

  if (parsed === 20 || parsed === 50) {
    return parsed;
  }

  return 10;
}

function normalizeDateOnly(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "";
  }

  return value;
}

function normalizeReadFilter(value: string | null) {
  if (value === "true" || value === "false") {
    return value;
  }

  return "";
}

function serializeReportDates<T extends { reportDate: Date; createdAt: Date }>(
  report: T,
) {
  return {
    ...report,
    reportDate: report.reportDate.toISOString(),
    createdAt: report.createdAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session || !canAccessPlatform(session.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode")?.trim();
  const requestedService = searchParams.get("service")?.trim();
  const requestedDate = searchParams.get("date")?.trim();
  const requestedReadFilter = normalizeReadFilter(searchParams.get("isRead"));

  const leaderService = getServiceForRole(session.role);

  let effectiveService = leaderService;

  if (canChooseReportService(session.role)) {
    effectiveService =
      requestedService && isValidService(requestedService)
        ? requestedService
        : "envoi";
  }

  if (!effectiveService) {
    return NextResponse.json({ error: "Service invalide." }, { status: 400 });
  }

  if (mode === "list") {
    const search = (searchParams.get("q") || "").trim();
    const startDate = normalizeDateOnly(searchParams.get("from"));
    const endDate = normalizeDateOnly(searchParams.get("to"));
    const pageSize = normalizePageSize(searchParams.get("pageSize"));
    const serviceFilter = canChooseReportService(session.role)
      ? requestedService && isValidService(requestedService)
        ? requestedService
        : ""
      : leaderService;

    const where: Prisma.DailyGeneralReportWhereInput = {};

    if (serviceFilter) {
      where.service = serviceFilter;
    }

    if (requestedReadFilter) {
      where.isRead = requestedReadFilter === "true";
    }

    if (search) {
      where.OR = [
        { personnelPresent: { contains: search, mode: "insensitive" } },
        { personnelAbsent: { contains: search, mode: "insensitive" } },
        { ambianceGenerale: { contains: search, mode: "insensitive" } },
        { problemesRencontres: { contains: search, mode: "insensitive" } },
        { etatGeneralService: { contains: search, mode: "insensitive" } },
        { passationService: { contains: search, mode: "insensitive" } },
        { observationGeneral: { contains: search, mode: "insensitive" } },
        { reportedBy: { fullName: { contains: search, mode: "insensitive" } } },
        { reportedBy: { username: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (startDate || endDate) {
      where.reportDate = {};

      if (startDate) {
        where.reportDate.gte = new Date(`${startDate}T00:00:00.000Z`);
      }

      if (endDate) {
        where.reportDate.lte = new Date(`${endDate}T00:00:00.000Z`);
      }
    }

    const totalItems = await prisma.dailyGeneralReport.count({ where });
    const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
    const page = Math.min(normalizePage(searchParams.get("page")), totalPages);

    const reports = await prisma.dailyGeneralReport.findMany({
      where,
      orderBy: [{ reportDate: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: dailyReportSelect,
    });

    return NextResponse.json({
      reports: reports.map(serializeReportDates),
      filters: {
        search,
        service: serviceFilter,
        isRead: requestedReadFilter,
        startDate,
        endDate,
      },
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    });
  }

  const normalizedDate = normalizeDateInput(requestedDate) ?? {
    date: new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`),
    value: new Date().toISOString().slice(0, 10),
  };

  const [currentReport, recentReports] = await Promise.all([
    prisma.dailyGeneralReport.findFirst({
      where: {
        reportDate: normalizedDate.date,
        service: effectiveService,
      },
      select: dailyReportSelect,
    }),
    prisma.dailyGeneralReport.findMany({
      where: {
        service: effectiveService,
      },
      orderBy: [{ reportDate: "desc" }, { createdAt: "desc" }],
      take: 20,
      select: dailyReportSelect,
    }),
  ]);

  return NextResponse.json({
    selectedDate: normalizedDate.value,
    selectedService: effectiveService,
    currentReport: currentReport ? serializeReportDates(currentReport) : null,
    recentReports: recentReports.map(serializeReportDates),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session || !canAccessPlatform(session.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<{
      reportDate: string;
      service: string;
      personnelPresent: string;
      personnelAbsent: string;
      ambianceGenerale: string;
      problemesRencontres: string;
      etatGeneralService: string;
      passationService: string;
      observationGeneral: string;
    }>;

    const normalizedDate = normalizeDateInput(body.reportDate);

    if (!normalizedDate) {
      return NextResponse.json(
        { error: "Date de rapport invalide." },
        { status: 400 },
      );
    }

    const leaderService = getServiceForRole(session.role);
    let service = leaderService;

    if (canChooseReportService(session.role)) {
      service =
        body.service?.trim() && isValidService(body.service.trim())
          ? body.service.trim()
          : null;
    }

    if (!service) {
      return NextResponse.json({ error: "Service invalide." }, { status: 400 });
    }

    const report = await prisma.dailyGeneralReport.create({
      data: {
        reportDate: normalizedDate.date,
        service,
        personnelPresent: normalizeText(body.personnelPresent),
        personnelAbsent: normalizeText(body.personnelAbsent),
        ambianceGenerale: normalizeText(body.ambianceGenerale),
        problemesRencontres: normalizeText(body.problemesRencontres),
        etatGeneralService: normalizeText(body.etatGeneralService),
        passationService: normalizeText(body.passationService),
        observationGeneral: normalizeText(body.observationGeneral),
        reportedById: session.userId,
      },
      select: {
        id: true,
        reportDate: true,
        service: true,
        personnelPresent: true,
        personnelAbsent: true,
        ambianceGenerale: true,
        problemesRencontres: true,
        etatGeneralService: true,
        passationService: true,
        observationGeneral: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        report: {
          ...report,
          reportDate: report.reportDate.toISOString(),
          createdAt: report.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Un rapport existe déjà pour cette date et ce service." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Impossible d'enregistrer le rapport général." },
      { status: 500 },
    );
  }
}
