import { redirect } from "next/navigation";
import { AttendanceCriteriaSettings } from "@/components/settings/attendance-criteria-settings";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

export default async function SettingsPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (
    !hasPermission(
      session,
      "settings_view",
      "settings_attendance_rules_create",
      "settings_attendance_rules_update",
      "settings_attendance_rules_delete"
    )
  ) {
    redirect("/");
  }

  const [criteria, settings] = await Promise.all([
    prisma.criterion.findMany({
      where: {
        agencyId: session.activeAgencyId,
        isActive: true,
      },
      orderBy: [{ impact: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        impact: true,
        weight: true,
        maxDaily: true,
      },
    }),
    prisma.attendanceCriterionSetting.findMany({
      where: {
        criterion: {
          agencyId: session.activeAgencyId,
        },
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        isEnabled: true,
        appliesTo: true,
        createdAt: true,
        criterion: {
          select: {
            id: true,
            name: true,
            impact: true,
            weight: true,
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
        impact: criterion.impact as "high" | "low",
        weight: criterion.weight.toString(),
      }))}
      initialSettings={settings.map(setting => ({
        ...setting,
        appliesTo: (setting.appliesTo ?? "both") as
          | "present"
          | "absent"
          | "both",
        createdAt: setting.createdAt.toISOString(),
        criterion: {
          ...setting.criterion,
          impact: setting.criterion.impact as "high" | "low",
          weight: setting.criterion.weight.toString(),
        },
      }))}
    />
  );
}
