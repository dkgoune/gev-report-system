export type UserItem = {
  id: string;
  fullName: string;
  username: string;
  membershipActive: boolean;
  roles?: { id: string; name: string }[];
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
  roleIds: string[];
  memberships?: Array<{
    agencyId: string;
    isActive: boolean;
    roleIds: string[];
  }>;
};

export type RoleItem = {
  id: string;
  agencyId: string;
  name: string;
  description: string | null;
  permissions: string[];
};
