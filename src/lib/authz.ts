import type { MembershipRole } from "@/generated/prisma/enums";
import type { SessionPayload } from "@/lib/session";

const ADMIN_MEMBERSHIP_ROLES = new Set<MembershipRole>(["admin"]);

const SCHEDULER_OR_ADMIN_MEMBERSHIP_ROLES = new Set<MembershipRole>([
  "admin",
  "scheduler",
]);

const REPORTER_OR_HIGHER_MEMBERSHIP_ROLES = new Set<MembershipRole>([
  "admin",
  "scheduler",
  "reporter",
]);

const LEADERSHIP_ROLES = new Set<MembershipRole>([
  "admin",
  "scheduler",
  "reporter",
]);

/**
 * Check if user can access the agency platform at all
 */
export function canAccessPlatform(session: SessionPayload): boolean {
  return isSuperAdmin(session) || session.activeMembershipRole !== "worker";
}

/**
 * Check if user is admin within their agency
 */
export function isAgencyAdmin(session: SessionPayload): boolean {
  return ADMIN_MEMBERSHIP_ROLES.has(session.activeMembershipRole);
}

/**
 * Check if user is super admin globally
 */
export function isSuperAdmin(session: SessionPayload): boolean {
  return session.systemRole === "super_admin";
}

/**
 * Check if user can access admin workspace for their agency
 */
export function canAccessAgencyAdminWorkspace(
  session: SessionPayload
): boolean {
  return isSuperAdmin(session) || isAgencyAdmin(session);
}

/**
 * Check if user is in a leadership position (admin, scheduler, or reporter)
 */
export function hasLeadershipRole(session: SessionPayload): boolean {
  return LEADERSHIP_ROLES.has(session.activeMembershipRole);
}

/**
 * Check if user can schedule work (admin or scheduler)
 */
export function canScheduleWork(session: SessionPayload): boolean {
  return SCHEDULER_OR_ADMIN_MEMBERSHIP_ROLES.has(session.activeMembershipRole);
}

/**
 * Check if user can create reports (reporter, scheduler, or admin)
 */
export function canCreateReports(session: SessionPayload): boolean {
  return REPORTER_OR_HIGHER_MEMBERSHIP_ROLES.has(session.activeMembershipRole);
}

/**
 * Check if user can mark reports as read (leadership roles)
 */
export function canMarkReportsAsRead(session: SessionPayload): boolean {
  return LEADERSHIP_ROLES.has(session.activeMembershipRole);
}

/**
 * Check if user can create evaluations (leadership roles)
 */
export function canCreateEvaluations(session: SessionPayload): boolean {
  return LEADERSHIP_ROLES.has(session.activeMembershipRole);
}
