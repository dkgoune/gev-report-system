import { redirect } from "next/navigation";
import { ReportCreationManager } from "@/components/reports/report-creation-manager";
import { getGeneralSubReportSections } from "@/lib/general-report-subreports";
import { prisma } from "@/lib/prisma";
import type { ReportGroup } from "@/lib/report-records";
import { getCreateDefaults } from "@/lib/report-records";
import { getServerSession } from "@/lib/session";
import { buildScopedUserWhere } from "@/lib/user-scope";

const REPORT_PERSONNEL_ROLES = [
  "agent",
  "convoyer",
  "leader",
  "subleader",
] as const;

type NewReportPageProps = {
  searchParams: Promise<{
    date?: string;
    groupId?: string;
  }>;
};

export default async function NewReportPage({
  searchParams,
}: NewReportPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  const defaults = getCreateDefaults("general", session, await searchParams);

  const [groupsByService, personnelByService, sectionsByService] =
    await Promise.all([
      Promise.all(
        defaults.reportType.allowedServices.map(async service => {
          const groups = await prisma.group.findMany({
            where: {
              isActive: true,
              service,
              ...(session.role === "admin"
                ? {}
                : {
                    id: session.groupId ?? undefined,
                  }),
            },
            orderBy: [{ name: "asc" }],
            select: {
              id: true,
              name: true,
              service: true,
            },
          });

          return [service, groups] as const;
        })
      ).then(Object.fromEntries),
      Promise.all(
        defaults.reportType.allowedServices.map(async service => {
          const users = await prisma.user.findMany({
            where: {
              ...buildScopedUserWhere(session, [...REPORT_PERSONNEL_ROLES]),
              group: {
                service,
              },
            },
            orderBy: [{ fullName: "asc" }, { username: "asc" }],
            select: {
              id: true,
              fullName: true,
              groupId: true,
              role: true,
              username: true,
            },
          });

          return [service, users] as const;
        })
      ).then(Object.fromEntries),
      Promise.resolve(
        Object.fromEntries(
          defaults.reportType.allowedServices.map(service => [
            service,
            getGeneralSubReportSections(service),
          ])
        )
      ),
    ]);

  const groups = Object.values(groupsByService).flat() as ReportGroup[];
  const initialGroupId = defaults.groupId || groups[0]?.id || "";

  if (!initialGroupId) {
    redirect("/");
  }

  return (
    <ReportCreationManager
      generalFields={defaults.reportType.fields.filter(
        field =>
          field.key !== "personnelPresent" && field.key !== "personnelAbsent"
      )}
      groupsByService={groupsByService}
      initialDate={defaults.reportDate}
      initialGroupId={initialGroupId}
      isAdmin={session.role === "admin"}
      personnelByService={personnelByService}
      sectionsByService={sectionsByService}
    />
  );
}
