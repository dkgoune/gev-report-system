import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { getReportData } from "@/lib/reports";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; reportType: string }> }
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

  const { id, reportType } = await context.params;
  if (reportType !== "general") {
    return NextResponse.json(
      { error: "Type de rapport introuvable." },
      { status: 404 }
    );
  }

  const report = await getReportData(id);

  if (!report) {
    return NextResponse.json(
      { error: "Rapport introuvable." },
      { status: 404 }
    );
  }

  return NextResponse.json({ report });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; reportType: string }> }
) {
  const session = await getServerSession();

  if (!session || !hasPermission(session, "report_mark_read")) {
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
    const body = (await request.json().catch(() => ({}))) as {
      action?: string;
    };

    if (body.action && body.action !== "markRead") {
      return NextResponse.json(
        { error: "Action non supportée." },
        { status: 400 }
      );
    }

    const report = await prisma.generalReport.findFirst({
      where: {
        id,
        workSchedule: {
          agencyId: session.activeAgencyId,
        },
      },
      select: {
        id: true,
        status: true,
        isRead: true,
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Rapport introuvable." },
        { status: 404 }
      );
    }

    if (report.status !== "published") {
      return NextResponse.json(
        { error: "Seuls les rapports publiés peuvent être marqués comme lus." },
        { status: 409 }
      );
    }

    if (report.isRead) {
      return NextResponse.json({ ok: true, alreadyRead: true });
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
