import type { RoleOption, UserFormState, Role } from "./types";

export const defaultUserFormState: UserFormState = {
  fullName: "",
  username: "",
  role: "agent",
  phone: "",
  password: "",
  isActive: true,
};

export const roleOptions: RoleOption[] = [
  { value: "admin", label: "Administrateur" },
  { value: "leader_envoi", label: "Chef Envoi" },
  { value: "leader_piste", label: "Chef Piste" },
  { value: "leader_retrait", label: "Chef Retrait" },
  { value: "agent", label: "Agent" },
  { value: "convoyeur", label: "Convoyeur" },
];

export function roleLabel(role: Role): string {
  return roleOptions.find((item) => item.value === role)?.label || role;
}
