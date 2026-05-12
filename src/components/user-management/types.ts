export type Role = "admin" | "leader" | "subleader" | "agent" | "convoyer";

export type Service = "envoi" | "piste" | "retrait";

export type GroupOption = {
  id: string;
  name: string;
  service: Service;
};

export type GroupItem = GroupOption & {
  createdAt: string;
  updatedAt: string;
  memberCount: number;
  isActive: boolean;
};

export type UserItem = {
  id: string;
  fullName: string;
  username: string;
  role: Role;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  group: GroupOption | null;
};

export type UserFormState = {
  fullName: string;
  username: string;
  role: Role;
  groupId: string;
  phone: string;
  password: string;
  isActive: boolean;
};

export type GroupFormState = {
  name: string;
  service: Service;
  isActive: boolean;
};

export type RoleOption = {
  value: Role;
  label: string;
};

export type ServiceOption = {
  value: Service;
  label: string;
};
