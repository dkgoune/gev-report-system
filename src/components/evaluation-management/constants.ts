import type {
  EvaluationCriterionOption,
  EvaluationFormState,
  EvaluationUserOption,
} from "./types";

export const defaultEvaluationFormState: EvaluationFormState = {
  evaluatedUserId: "",
  criterionId: "",
  comment: "",
};

export function buildCriterionLabel(criterion: EvaluationCriterionOption) {
  return criterion.name;
}

export function buildUserLabel(user: EvaluationUserOption) {
  return user.fullName;
}
