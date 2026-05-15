import { UserPermission } from "@/generated/prisma/browser";

export type UserItem = {
  id: string;
  fullName: string;
  username: string;
  membershipActive: boolean;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserFormState = {
  fullName: string;
  username: string;
  phone: string;
  password: string;
  isActive: boolean;
  permissions: UserPermission[];
};
