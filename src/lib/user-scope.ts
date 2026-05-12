import type { Prisma } from "@/generated/prisma/client";
import type { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/session";

type ScopedUserOption = {
  id: string;
  fullName: string;
  role: Role;
  username: string;
};

export function buildScopedUserWhere(
  session: SessionPayload,
  allowedRoles?: Role[]
): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {
    isActive: true,
  };

  if (allowedRoles?.length) {
    where.role = { in: allowedRoles };
  }

  if (session.role !== "admin") {
    if (!session.groupId) {
      where.id = "__no_matching_group__";
      return where;
    }

    where.groupId = session.groupId;
  }

  return where;
}

export async function listScopedUsers(
  session: SessionPayload,
  allowedRoles?: Role[]
) {
  return prisma.user.findMany({
    where: buildScopedUserWhere(session, allowedRoles),
    orderBy: [{ fullName: "asc" }, { username: "asc" }],
    select: {
      id: true,
      fullName: true,
      role: true,
      username: true,
    },
  }) satisfies Promise<ScopedUserOption[]>;
}
