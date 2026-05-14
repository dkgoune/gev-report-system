export type WorkPostItem = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkPostFormState = {
  name: string;
  code: string;
  description: string;
  isActive: boolean;
  order: number;
};
