import { NextResponse } from "next/server";
import { canMarkReportsAsRead, canViewReportHistory } from "@/lib/authz";
import { getReportById, markReportAsRead } from "@/lib/report-records";
import { getReportType, type ReportTypeSlug } from "@/lib/report-types";
import { getServerSession } from "@/lib/session";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; reportType: string }> }
) {
  const session = await getServerSession();

  if (!session || !canViewReportHistory(session.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id, reportType } = await context.params;

  if (!getReportType(reportType)) {
    return NextResponse.json(
      { error: "Type de rapport introuvable." },
      { status: 404 }
    );
  }

  const reportTypeSlug = reportType as ReportTypeSlug;

  const payload = await getReportById(reportTypeSlug, id, session);

  if (!payload) {
    return NextResponse.json(
      { error: "Rapport introuvable." },
      { status: 404 }
    );
  }

  return NextResponse.json(payload);
}

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string; reportType: string }> }
) {
  const session = await getServerSession();

  if (!session || !canMarkReportsAsRead(session.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id, reportType } = await context.params;

  if (!getReportType(reportType)) {
    return NextResponse.json(
      { error: "Type de rapport introuvable." },
      { status: 404 }
    );
  }

  const reportTypeSlug = reportType as ReportTypeSlug;

  try {
    const payload = await markReportAsRead(reportTypeSlug, id, session);

    if (!payload) {
      return NextResponse.json(
        { error: "Rapport introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, ...payload });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible de marquer le rapport comme lu.",
      },
      {
        status:
          error instanceof Error && error.message.includes("réservée")
            ? 403
            : 400,
      }
    );
  }
}
