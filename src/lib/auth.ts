import type { SystemRole, UserPermission } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

export type AuthenticationResult =
  | {
      status: "success";
      user: {
        id: string;
        username: string;
        fullName: string;
        systemRole: SystemRole;
        isActive: boolean;
        activeAgencyId: string;
        permissions: UserPermission[];
      };
    }
  | { status: "invalid_credentials" }
  | { status: "unauthorized_role" }
  | { status: "no_agency_access" };

export async function authenticateUser(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      fullName: true,
      systemRole: true,
      password: true,
      isActive: true,
      memberships: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        select: { agencyId: true },
      },
      userPermissionRules: {
        select: {
          agencyId: true,
          permission: true,
          isEnabled: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return { status: "invalid_credentials" } satisfies AuthenticationResult;
  }

  const isValid = verifyPassword(password, user.password);
  if (!isValid) {
    return { status: "invalid_credentials" } satisfies AuthenticationResult;
  }

  const firstMembership = user.memberships[0];
  if (!firstMembership) {
    return { status: "no_agency_access" } satisfies AuthenticationResult;
  }

  const permissions = user.userPermissionRules
    .filter(
      rule => rule.agencyId === firstMembership.agencyId && rule.isEnabled
    )
    .map(rule => rule.permission);

  return {
    status: "success",
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      systemRole: user.systemRole,
      isActive: user.isActive,
      activeAgencyId: firstMembership.agencyId,
      permissions,
    },
  } satisfies AuthenticationResult;
}
