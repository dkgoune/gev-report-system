import { redirect } from "next/navigation";
import { AttendanceCriteriaSettings } from "@/components/settings/attendance-criteria-settings";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export default async function SettingsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (session.role !== "admin") {
    redirect("/");
  }

  const [criteria, settings] = await Promise.all([
    prisma.criterion.findMany({
      where: { isActive: true },
      orderBy: [{ impact: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        impact: true,
        defaultWeight: true,
        maxDaily: true,
      },
    }),
    prisma.attendanceCriterionSetting.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        status: true,
        createdAt: true,
        criterion: {
          select: {
            id: true,
            name: true,
            impact: true,
            defaultWeight: true,
            maxDaily: true,
          },
        },
      },
    }),
  ]);

  return (
    <AttendanceCriteriaSettings
      initialCriteria={criteria.map(criterion => ({
        ...criterion,
        defaultWeight: criterion.defaultWeight.toString(),
      }))}
      initialSettings={settings.map(setting => ({
        ...setting,
        createdAt: setting.createdAt.toISOString(),
        criterion: {
          ...setting.criterion,
          defaultWeight: setting.criterion.defaultWeight.toString(),
        },
      }))}
    />
  );
}
