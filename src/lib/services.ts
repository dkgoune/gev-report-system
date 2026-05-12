import type { Role, Service } from "@/generated/prisma/enums";

const SERVICE_OPTIONS: Array<{ value: Service; label: string }> = [
  { value: "envoi", label: "Envoi" },
  { value: "piste", label: "Piste" },
  { value: "retrait", label: "Retrait" },
];

export function getServiceForRole(
  _role: Role,
  groupService: Service | null = null
): Service | null {
  return groupService;
}

export function canChooseReportService(role: Role): boolean {
  return role === "admin";
}

export function isValidService(value: string): value is Service {
  return SERVICE_OPTIONS.some(option => option.value === value);
}

export function serviceLabel(service: Service): string {
  return (
    SERVICE_OPTIONS.find(option => option.value === service)?.label || service
  );
}

export function formatServiceContext(
  service: Service | null,
  allowedServices: Service[]
): string {
  if (service) {
    return serviceLabel(service);
  }

  return allowedServices.map(serviceLabel).join(" / ");
}

export function getServiceOptions() {
  return SERVICE_OPTIONS;
}
