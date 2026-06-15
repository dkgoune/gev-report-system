import type {
  EvaluationCriterionOption,
  EvaluationFormState,
  EvaluationUserOption,
} from "./types";

const localISOTime = () => {
  const tzOffset = new Date().getTimezoneOffset() * 60000;
  return new Date(Date.now() - tzOffset).toISOString().slice(0, 16);
};

export const defaultEvaluationFormState: EvaluationFormState = {
  evaluatedUserId: "",
  criterionId: "",
  comment: "",
  date: localISOTime(),
};

export function buildCriterionLabel(criterion: EvaluationCriterionOption) {
  return criterion.name;
}

export function buildUserLabel(user: EvaluationUserOption) {
  return user.fullName;
}
