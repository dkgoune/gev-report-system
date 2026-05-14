export type ServiceItem = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  color: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ServiceFormState = {
  name: string;
  code: string;
  description: string;
  color: string;
  isActive: boolean;
};
