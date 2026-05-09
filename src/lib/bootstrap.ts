import { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

declare global {
  var __rootBootstrapDone: boolean | undefined;
}

function readRootConfig() {
  const username = process.env.ROOT_USERNAME || "root";
  const password = process.env.ROOT_PASSWORD || "root1234";
  const fullName = process.env.ROOT_FULL_NAME || "Root User";

  return { username, password, fullName };
}

export async function ensureRootUserExists(): Promise<void> {
  if (globalThis.__rootBootstrapDone) {
    return;
  }

  const { username, password, fullName } = readRootConfig();

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          fullName,
          username,
          password: hashPassword(password),
          role: Role.admin,
          isActive: true,
        },
      });

      if (!process.env.ROOT_PASSWORD) {
        console.warn(
          "[auth] ROOT_PASSWORD is not set; default root password was used. Set ROOT_PASSWORD in production.",
        );
      }

      console.info(`[auth] Root user '${username}' was created.`);
    }

    globalThis.__rootBootstrapDone = true;
  } catch (error) {
    console.error("[auth] Failed to ensure root user exists:", error);
  }
}
