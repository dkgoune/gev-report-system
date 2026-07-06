import type { WorkPostFormState } from "./types";

export const defaultWorkPostFormState: WorkPostFormState = {
  name: "",
  code: "",
  description: "",
  isActive: true,
  order: 0,
  serviceId: "",
};
