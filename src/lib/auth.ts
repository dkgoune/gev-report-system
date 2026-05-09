import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { canAccessPlatform } from "@/lib/authz";

export async function authenticateUser(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      password: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const isValid = verifyPassword(password, user.password);

  if (!isValid) {
    return null;
  }

  // Only admin and leaders can access the platform.
  if (!canAccessPlatform(user.role)) {
    return null;
  }

  const safeUser = {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
  };

  return safeUser;
}
