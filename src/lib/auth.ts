import type { Role, Service } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { canAccessPlatform } from "@/lib/authz";

export type AuthenticationResult =
  | {
      status: "success";
      user: {
        id: string;
        username: string;
        fullName: string;
        role: Role;
        groupId: string | null;
        groupService: Service | null;
        isActive: boolean;
      };
    }
  | { status: "invalid_credentials" }
  | { status: "unauthorized_role" };

export async function authenticateUser(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      groupId: true,
      group: {
        select: {
          service: true,
        },
      },
      password: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return { status: "invalid_credentials" } satisfies AuthenticationResult;
  }

  const isValid = verifyPassword(password, user.password);

  if (!isValid) {
    return { status: "invalid_credentials" } satisfies AuthenticationResult;
  }

  if (!canAccessPlatform(user.role)) {
    return { status: "unauthorized_role" } satisfies AuthenticationResult;
  }

  if (user.role !== "admin" && !user.groupId) {
    return { status: "unauthorized_role" } satisfies AuthenticationResult;
  }

  return {
    status: "success",
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      groupId: user.groupId,
      groupService: user.group?.service ?? null,
      isActive: user.isActive,
    },
  } satisfies AuthenticationResult;
}
