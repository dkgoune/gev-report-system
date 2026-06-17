import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

type PublishParams = {
  params: Promise<{
    id: string;
    reportType: string;
  }>;
};

export async function POST(_: Request, { params }: PublishParams) {
  const session = await getServerSession();

  if (!session || !hasPermission(session, "report_create", "report_update")) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id, reportType } = await params;

  if (reportType !== "general") {
    return NextResponse.json(
      { error: "Type de rapport introuvable." },
      { status: 404 }
    );
  }

  try {
    const result = await prisma.$transaction(async tx => {
      const report = await tx.generalReport.findFirst({
        where: {
          id,
          workSchedule: {
            agencyId: session.activeAgencyId,
          },
        },
        select: {
          id: true,
          status: true,
          workScheduleId: true,
          workSchedule: {
            select: {
              agencyId: true,
              workDate: true,
            },
          },
          attendances: {
            select: {
              userId: true,
              status: true,
            },
          },
        },
      });

      if (!report) {
        throw new Error("Rapport introuvable.");
      }

      if (report.status === "published") {
        return {
          alreadyPublished: true,
          reportId: report.id,
          appliedEvaluations: 0,
          skippedEvaluations: 0,
        };
      }

      if (report.status !== "draft") {
        throw new Error(
          "Seuls les rapports en brouillon peuvent être publiés."
        );
      }

      // Attendance-driven evaluations are applied only when the report is published.
      const settings = await tx.attendanceCriterionSetting.findMany({
        where: {
          agencyId: session.activeAgencyId,
          isEnabled: true,
          criterion: {
            isActive: true,
          },
        },
        select: {
          criterionId: true,
          appliesTo: true,
          criterion: {
            select: {
              id: true,
              impact: true,
              maxDaily: true,
              weight: true,
            },
          },
        },
      });

      const presentUserIds = report.attendances
        .filter(attendance => attendance.status === "present")
        .map(attendance => attendance.userId);
      const absentUserIds = report.attendances
        .filter(attendance => attendance.status === "absent")
        .map(attendance => attendance.userId);

      let appliedEvaluations = 0;
      let skippedEvaluations = 0;

      for (const setting of settings) {
        const appliesTo = setting.appliesTo ?? "both";
        const targetUserIds =
          appliesTo === "present"
            ? presentUserIds
            : appliesTo === "absent"
              ? absentUserIds
              : [...presentUserIds, ...absentUserIds];

        if (!targetUserIds.length) {
          continue;
        }

        for (const evaluatedUserId of targetUserIds) {
          const existingSameSchedule = await tx.personnelEvaluation.findFirst({
            where: {
              workScheduleId: report.workScheduleId,
              criterionId: setting.criterionId,
              evaluatedUserId,
              evaluatingLeaderId: session.userId,
            },
            select: {
              id: true,
            },
          });

          if (existingSameSchedule) {
            skippedEvaluations += 1;
            continue;
          }

          if (setting.criterion.maxDaily !== null) {
            const sameDayCount = await tx.personnelEvaluation.count({
              where: {
                evaluatedUserId,
                criterionId: setting.criterionId,
                workSchedule: {
                  agencyId: report.workSchedule.agencyId,
                  workDate: report.workSchedule.workDate,
                },
              },
            });

            if (sameDayCount >= setting.criterion.maxDaily) {
              skippedEvaluations += 1;
              continue;
            }
          }

          await tx.personnelEvaluation.create({
            data: {
              workScheduleId: report.workScheduleId,
              evaluatedUserId,
              evaluatingLeaderId: session.userId,
              criterionId: setting.criterionId,
              score: Math.round(Number(setting.criterion.weight)),
              comment:
                "Evaluation automatique depuis le rapport general publie.",
              evaluationDate: report.workSchedule.workDate,
            },
          });

          appliedEvaluations += 1;
        }
      }

      await tx.generalReport.update({
        where: { id: report.id },
        data: {
          status: "published",
          publishedAt: new Date(),
          isRead: false,
          readAt: null,
          readById: null,
        },
      });

      return {
        alreadyPublished: false,
        reportId: report.id,
        appliedEvaluations,
        skippedEvaluations,
      };
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Impossible de publier le rapport.";

    const status = message.includes("introuvable") ? 404 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
