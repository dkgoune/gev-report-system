export type WorkPostItem = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  order: number;
  serviceId: string | null;
  service?: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkPostFormState = {
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  order: number;
  serviceId: string;
};
