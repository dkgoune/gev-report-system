import type {
  GroupFormState,
  Role,
  RoleOption,
  Service,
  ServiceOption,
  UserFormState,
} from "./types";

export const defaultUserFormState: UserFormState = {
  fullName: "",
  username: "",
  role: "agent",
  groupId: "",
  phone: "",
  password: "",
  isActive: true,
};

export const defaultGroupFormState: GroupFormState = {
  name: "",
  service: "envoi",
  isActive: true,
};

export const roleOptions: RoleOption[] = [
  { value: "admin", label: "Administrateur" },
  { value: "leader", label: "Leader" },
  { value: "subleader", label: "Sous-leader" },
  { value: "agent", label: "Agent" },
  { value: "convoyer", label: "Convoyeur" },
];

export function roleLabel(role: Role): string {
  return roleOptions.find(item => item.value === role)?.label || role;
}

export const serviceOptions: ServiceOption[] = [
  { value: "envoi", label: "Envoi" },
  { value: "piste", label: "Piste" },
  { value: "retrait", label: "Retrait" },
];

export function serviceOptionLabel(service: Service): string {
  return serviceOptions.find(item => item.value === service)?.label || service;
}
