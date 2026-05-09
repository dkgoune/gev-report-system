import type { Role, Service } from "@/generated/prisma/enums";

const ROLE_SERVICE_MAP: Partial<Record<Role, Service>> = {
  leader_envoi: "envoi",
  leader_piste: "piste",
  leader_retrait: "retrait",
};

const SERVICE_OPTIONS: Array<{ value: Service; label: string }> = [
  { value: "envoi", label: "Envoi" },
  { value: "piste", label: "Piste" },
  { value: "retrait", label: "Retrait" },
];

export function getServiceForRole(role: Role): Service | null {
  return ROLE_SERVICE_MAP[role] ?? null;
}

export function canChooseReportService(role: Role): boolean {
  return role === "admin";
}

export function isValidService(value: string): value is Service {
  return SERVICE_OPTIONS.some((option) => option.value === value);
}

export function serviceLabel(service: Service): string {
  return (
    SERVICE_OPTIONS.find((option) => option.value === service)?.label || service
  );
}

export function getServiceOptions() {
  return SERVICE_OPTIONS;
}
