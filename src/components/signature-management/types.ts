export type SignatureAgentOption = {
  id: string;
  fullName: string;
  username: string;
};

export type SignatureLogItem = {
  createdAt: string;
  id: string;
  signedAt: string;
  signatureCount: number;
  user: SignatureAgentOption;
};

export type SignatureFormState = {
  userId: string;
  signatureCount: number;
  signedAt: string;
};
