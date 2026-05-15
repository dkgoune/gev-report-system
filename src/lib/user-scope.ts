import type { Prisma } from "@/generated/prisma/client";
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
  session: SessionPayload
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

  return where;
}

/**
 * List users within the active agency
 */
export async function listScopedUsers(session: SessionPayload) {
  return prisma.user.findMany({
    where: buildScopedUserWhere(session),
    orderBy: [{ fullName: "asc" }, { username: "asc" }],
    select: {
      id: true,
      fullName: true,
      username: true,
    },
  }) satisfies Promise<ScopedUserOption[]>;
}
