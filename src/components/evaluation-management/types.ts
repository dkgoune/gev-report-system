export type EvaluationUserOption = {
  id: string;
  fullName: string;
};

export type EvaluationScheduleOption = {
  id: string;
  workDate: string;
  serviceName: string;
};

export type EvaluationCriterionOption = {
  id: string;
  name: string;
  impact: string;
};

export type EvaluationItem = {
  id: string;
  score: number;
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
  workSchedule: {
    id: string;
    workDate: string;
    service: {
      name: string;
    };
  };
};

export type EvaluationFormState = {
  evaluatedUserId: string;
  criterionId: string;
  workScheduleId: string;
  score: string;
  comment: string;
};
