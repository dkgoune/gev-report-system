import type { Prisma } from "@/generated/prisma/client";
import type { MembershipRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/session";

type ScopedUserOption = {
  id: string;
  fullName: string;
  username: string;
};

/**
 * Build a WHERE clause for users within the same agency
 */
export function buildScopedUserWhere(
  session: SessionPayload,
  allowedRoles?: MembershipRole[]
): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {
    isActive: true,
    memberships: {
      some: {
        agencyId: session.activeAgencyId,
        isActive: true,
      },
    },
  };

  if (allowedRoles?.length) {
    where.memberships = {
      some: {
        agencyId: session.activeAgencyId,
        isActive: true,
        role: { in: allowedRoles },
      },
    };
  }

  return where;
}

/**
 * List users within the active agency, optionally filtered by role
 */
export async function listScopedUsers(
  session: SessionPayload,
  allowedRoles?: MembershipRole[]
) {
  return prisma.user.findMany({
    where: buildScopedUserWhere(session, allowedRoles),
    orderBy: [{ fullName: "asc" }, { username: "asc" }],
    select: {
      id: true,
      fullName: true,
      username: true,
    },
  }) satisfies Promise<ScopedUserOption[]>;
}
