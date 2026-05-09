export type Role =
  | "admin"
  | "leader_envoi"
  | "leader_piste"
  | "leader_retrait"
  | "agent"
  | "convoyeur";

export type UserItem = {
  id: string;
  fullName: string;
  username: string;
  role: Role;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserFormState = {
  fullName: string;
  username: string;
  role: Role;
  phone: string;
  password: string;
  isActive: boolean;
};

export type RoleOption = {
  value: Role;
  label: string;
};
