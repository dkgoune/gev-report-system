import type { MembershipRole } from "@/generated/prisma/enums";

export type Role = MembershipRole;

export type Service = "envoi" | "piste" | "retrait";

export type UserItem = {
  id: string;
  fullName: string;
  username: string;
  role: Role;
  membershipActive: boolean;
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

export type ServiceOption = {
  value: Service;
  label: string;
};
