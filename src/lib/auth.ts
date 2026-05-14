import type { MembershipRole, SystemRole } from "@/generated/prisma/enums";
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
        activeMembershipRole: MembershipRole;
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
        select: {
          agencyId: true,
          role: true,
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

  // Get the first active agency membership (preferred agency)
  const firstMembership = user.memberships[0];
  if (!firstMembership) {
    return { status: "no_agency_access" } satisfies AuthenticationResult;
  }

  // Check if user can access platform with their membership role
  const canAccess =
    user.systemRole === "super_admin" || firstMembership.role !== "worker";

  if (!canAccess) {
    return { status: "unauthorized_role" } satisfies AuthenticationResult;
  }

  return {
    status: "success",
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      systemRole: user.systemRole,
      isActive: user.isActive,
      activeAgencyId: firstMembership.agencyId,
      activeMembershipRole: firstMembership.role,
    },
  } satisfies AuthenticationResult;
}
