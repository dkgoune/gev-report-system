import { type SystemRole, UserPermission } from "@/generated/prisma/enums";
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
        select: {
          agencyId: true,
          roles: {
            where: { isActive: true },
            select: {
              permissions: true,
            },
          },
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

  let activeAgencyId: string;
  let permissions: UserPermission[] = [];

  if (user.systemRole === "super_admin") {
    // 1. Fallback to first membership or first active agency in the system
    const firstMembership = user.memberships[0];
    if (firstMembership) {
      activeAgencyId = firstMembership.agencyId;
    } else {
      const firstAgency = await prisma.agency.findFirst({
        where: { isActive: true },
        select: { id: true },
      });
      if (!firstAgency) {
        return { status: "no_agency_access" } satisfies AuthenticationResult;
      }
      activeAgencyId = firstAgency.id;
    }

    // 2. Super admin gets all permissions in the system
    permissions = Object.values(UserPermission);
  } else {
    // Standard user membership checks
    const firstMembership = user.memberships[0];
    if (!firstMembership) {
      return { status: "no_agency_access" } satisfies AuthenticationResult;
    }
    activeAgencyId = firstMembership.agencyId;

    // Aggregate unique permissions from all active roles assigned in this agency
    const uniquePermissions = new Set<UserPermission>();
    if (firstMembership.roles) {
      for (const role of firstMembership.roles) {
        if (role.permissions) {
          for (const permission of role.permissions) {
            uniquePermissions.add(permission);
          }
        }
      }
    }
    permissions = Array.from(uniquePermissions);
  }

  return {
    status: "success",
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      systemRole: user.systemRole,
      isActive: user.isActive,
      activeAgencyId,
      permissions,
    },
  } satisfies AuthenticationResult;
}
