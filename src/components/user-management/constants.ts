import type { UserFormState } from "./types";

export const defaultUserFormState: UserFormState = {
  fullName: "",
  username: "",
  phone: "",
  password: "",
  isActive: true,
  roleIds: [],
  memberships: [],
};
