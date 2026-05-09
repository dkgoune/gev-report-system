import { impactLabel } from "@/components/criteria-management/constants";
import { roleLabel } from "@/components/user-management/constants";
import type {
  EvaluationCriterionOption,
  EvaluationFormState,
  EvaluationItem,
  EvaluationUserOption,
} from "./types";

export function getTodayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export const defaultEvaluationFormState: EvaluationFormState = {
  userId: "",
  criteriaId: "",
  evaluationDate: getTodayDateInputValue(),
  weightOverride: "",
  notes: "",
};

export function buildCriterionLabel(criterion: EvaluationCriterionOption) {
  return `${criterion.name} (${impactLabel(criterion.impact)}, ${criterion.defaultWeight})`;
}

export function buildUserLabel(user: EvaluationUserOption) {
  return `${user.fullName} (${roleLabel(user.role)})`;
}

export function getEffectiveWeight(evaluation: EvaluationItem) {
  return evaluation.weightOverride ?? evaluation.criteria.defaultWeight;
}
