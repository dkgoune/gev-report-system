export type EvaluationUserOption = {
  id: string;
  fullName: string;
};

export type EvaluationCriterionOption = {
  id: string;
  name: string;
  impact: string;
  requiresPersonnel: boolean;
};

export type EvaluationItem = {
  id: string;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  evaluationDate: string;
  isCancelled: boolean;
  cancelledAt: string | null;
  evaluatedUser: {
    id: string;
    fullName: string;
    isActive: boolean;
  } | null;
  criterion: {
    id: string;
    name: string;
    impact: string;
    isActive: boolean;
  };
  evaluatingLeader: {
    id: string;
    fullName: string;
    username: string;
  };
};

export type EvaluationFormState = {
  evaluatedUserId: string;
  criterionId: string;
  comment: string;
  date: string;
};
