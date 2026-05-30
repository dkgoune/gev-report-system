export type EvaluationUserOption = {
  id: string;
  fullName: string;
};

export type EvaluationCriterionOption = {
  id: string;
  name: string;
  impact: string;
};

export type EvaluationItem = {
  id: string;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
  evaluatedUser: {
    id: string;
    fullName: string;
    isActive: boolean;
  };
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
};
