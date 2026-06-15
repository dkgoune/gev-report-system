import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/session";

export type ReportViewLimits = {
  hasLimit: boolean;
  allowedRoleIds: string[];
};

export async function getReportViewLimits(
  session: SessionPayload | null
): Promise<ReportViewLimits> {
  if (!session) {
    return { hasLimit: true, allowedRoleIds: [] };
  }

  if (session.systemRole === "super_admin") {
    return { hasLimit: false, allowedRoleIds: [] };
  }

  const userMembership = await prisma.userAgencyMembership.findUnique({
    where: {
      userId_agencyId: {
        userId: session.userId,
        agencyId: session.activeAgencyId,
      },
    },
    include: {
      roles: {
        where: { isActive: true },
        include: {
          allowedToViewReportsOf: {
            where: { isActive: true },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!userMembership) {
    return { hasLimit: true, allowedRoleIds: [] };
  }

  // Find user's active roles that allow report viewing
  const reportRoles = userMembership.roles.filter(role =>
    role.permissions.some(p =>
      ["report_read", "report_create", "report_update", "report_mark_read"].includes(p)
    )
  );

  if (reportRoles.length === 0) {
    return { hasLimit: true, allowedRoleIds: [] };
  }

  // If any role allows reading AND has no limits, then the user has no viewing limit
  const hasUnlimitedRole = reportRoles.some(
    role => role.allowedToViewReportsOf.length === 0
  );

  if (hasUnlimitedRole) {
    return { hasLimit: false, allowedRoleIds: [] };
  }

  // Otherwise, the user is limited to the union of allowed view roles
  const allowedRoleIds = new Set<string>();
  for (const role of reportRoles) {
    for (const allowed of role.allowedToViewReportsOf) {
      allowedRoleIds.add(allowed.id);
    }
  }

  return {
    hasLimit: true,
    allowedRoleIds: Array.from(allowedRoleIds),
  };
}
