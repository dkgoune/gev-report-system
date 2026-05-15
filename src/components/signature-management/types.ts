export type SignatureAgentOption = {
  id: string;
  fullName: string;
  username: string;
};

export type SignatureScheduleOption = {
  id: string;
  serviceName: string;
  workDate: string;
};

export type SignatureLogItem = {
  busArrivalTime: string | null;
  createdAt: string;
  id: string;
  signedAt: string | null;
  slipNumber: string;
  user: SignatureAgentOption;
  workSchedule: SignatureScheduleOption;
};

export type SignatureFormState = {
  busArrivalTime: string;
  signedAt: string;
  slipNumber: string;
  userId: string;
  workScheduleId: string;
};
