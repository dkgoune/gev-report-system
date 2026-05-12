import { NextResponse } from "next/server";
import { canAccessPlatform, canViewReportHistory } from "@/lib/authz";
import { createReport, listReports } from "@/lib/report-records";
import { getReportType, type ReportTypeSlug } from "@/lib/report-types";
import { getServerSession } from "@/lib/session";

export async function GET(
  request: Request,
  context: { params: Promise<{ reportType: string }> }
) {
  const session = await getServerSession();

  if (!session || !canViewReportHistory(session.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { reportType } = await context.params;

  if (!getReportType(reportType)) {
    return NextResponse.json(
      { error: "Type de rapport introuvable." },
      { status: 404 }
    );
  }

  const reportTypeSlug = reportType as ReportTypeSlug;

  try {
    const { searchParams } = new URL(request.url);
    const payload = await listReports(reportTypeSlug, session, {
      q: searchParams.get("q") || undefined,
      groupId: searchParams.get("groupId") || undefined,
      service: searchParams.get("service") || undefined,
      from: searchParams.get("from") || undefined,
      to: searchParams.get("to") || undefined,
      isRead: searchParams.get("isRead") || undefined,
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
      sortField: searchParams.get("sortField") || undefined,
      sortDirection: searchParams.get("sortDirection") || undefined,
    });

    return NextResponse.json(payload);
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

  if (!session || !canAccessPlatform(session.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { reportType } = await context.params;

  if (!getReportType(reportType)) {
    return NextResponse.json(
      { error: "Type de rapport introuvable." },
      { status: 404 }
    );
  }

  const reportTypeSlug = reportType as ReportTypeSlug;

  if (reportTypeSlug !== "general") {
    return NextResponse.json(
      {
        error:
          "La creation directe de rapports d'incident est desactivee. Utilisez le rapport general.",
      },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const payload = await createReport(reportTypeSlug, session, body);
    return NextResponse.json(payload, { status: 201 });
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
