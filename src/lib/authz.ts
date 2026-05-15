import { SessionPayload } from "./session";

export function isSuperAdmin(session: SessionPayload): boolean {
  return session.systemRole === "super_admin";
}
