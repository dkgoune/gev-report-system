import type { Role } from "@/generated/prisma/enums";

const PLATFORM_ROLES = new Set<Role>(["admin", "leader", "subleader"]);

const ADMIN_ROLES = new Set<Role>(["admin"]);

const EVALUATION_ROLES = new Set<Role>(["admin", "leader", "subleader"]);

export function canAccessPlatform(role: Role): boolean {
  return PLATFORM_ROLES.has(role);
}

export function isAdminRole(role: Role): boolean {
  return ADMIN_ROLES.has(role);
}

export function canAccessAdminWorkspace(role: Role): boolean {
  return isAdminRole(role);
}

export function canCreateEvaluations(role: Role): boolean {
  return EVALUATION_ROLES.has(role);
}

export function canViewReportHistory(role: Role): boolean {
  return role === "admin" || role === "leader";
}
export function canCreateReports(role: Role): boolean {
  return role === "admin" || role === "leader" || role === "subleader";
}
