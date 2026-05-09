import type {
  CriterionImpact,
  CriterionItem,
} from "@/components/criteria-management/types";
import type { Role } from "@/components/user-management/types";

export type EvaluationUserOption = {
  id: string;
  fullName: string;
  role: Role;
};

export type EvaluationCriterionOption = Pick<
  CriterionItem,
  "id" | "name" | "impact" | "defaultWeight"
>;

export type EvaluationItem = {
  id: string;
  evaluationDate: string;
  weightOverride: string | null;
  notes: string | null;
  createdAt: string;
  user: {
    id: string;
    fullName: string;
    role: Role;
    isActive: boolean;
  };
  criteria: {
    id: string;
    name: string;
    impact: CriterionImpact;
    defaultWeight: string;
    isActive: boolean;
  };
  recordedBy: {
    id: string;
    fullName: string;
    username: string;
  };
};

export type EvaluationFormState = {
  userId: string;
  criteriaId: string;
  evaluationDate: string;
  weightOverride: string;
  notes: string;
};
