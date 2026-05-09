import type { Role } from "@/generated/prisma/enums";

const PLATFORM_ROLES = new Set<Role>([
  "admin",
  "leader_envoi",
  "leader_piste",
  "leader_retrait",
]);

export function canAccessPlatform(role: Role): boolean {
  return PLATFORM_ROLES.has(role);
}
