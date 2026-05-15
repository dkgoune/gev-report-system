import { ReportDTO } from "@/types/report";
import { prisma } from "./prisma";

export async function getReportData(
  reportId: string
): Promise<ReportDTO | null> {
  const report = await prisma.generalReport.findFirst({
    where: {
      id: reportId,
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
      attendances: {
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              username: true,
            },
          },
        },
        orderBy: [{ createdAt: "asc" }],
      },
    },
  });

  if (!report) return null;

  return {
    id: report.id,
    reportDate: report.workSchedule.workDate.toISOString(),
    isRead: report.isRead,
    status: report.status,
    publishedAt: report.publishedAt?.toISOString() ?? null,
    createdAt: report.createdAt.toISOString(),
    serviceId: report.workSchedule.service.id,
    serviceName: report.workSchedule.service.name,
    workScheduleId: report.workScheduleId,
    reportedBy: report.reportedBy,
    readBy: report.readBy,
    ambianceGenerale: report.ambianceGenerale,
    problemesRencontres: report.problemesRencontres,
    etatGeneralService: report.etatGeneralService,
    passationService: report.passationService,
    observationGeneral: report.observationGeneral,
    presentPersonnel: report.attendances
      .filter(attendance => attendance.status === "present")
      .map(attendance => attendance.user),
    absentPersonnel: report.attendances
      .filter(attendance => attendance.status === "absent")
      .map(attendance => attendance.user),
    incidentEntries: report.incidentEntries.map(entry => ({
      id: entry.id,
      templateId: entry.templateId,
      templateNameSnapshot: entry.templateNameSnapshot,
      valuesJson: entry.valuesJson,
    })),
  };
}
