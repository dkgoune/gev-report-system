import type { Role } from "@/generated/prisma/enums";

export type SignatureAgentOption = {
  id: string;
  fullName: string;
  role: Role;
  username: string;
};

export type SignatureLogItem = {
  busArrivalTime: string | null;
  createdAt: string;
  id: string;
  signedAt: string | null;
  slipNumber: string;
  user: SignatureAgentOption;
};

export type SignatureFormState = {
  busArrivalTime: string;
  signedAt: string;
  slipNumber: string;
  userId: string;
};
