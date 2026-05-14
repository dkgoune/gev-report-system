import { impactLabel } from "@/components/criteria-management/constants";
import type {
  EvaluationCriterionOption,
  EvaluationFormState,
  EvaluationUserOption,
} from "./types";

export const defaultEvaluationFormState: EvaluationFormState = {
  evaluatedUserId: "",
  criterionId: "",
  workScheduleId: "",
  score: "1",
  comment: "",
};

export function buildCriterionLabel(criterion: EvaluationCriterionOption) {
  const mappedImpact =
    criterion.impact === "high"
      ? "POSITIVE"
      : criterion.impact === "low"
        ? "NEGATIVE"
        : "POSITIVE";

  return `${criterion.name} (${impactLabel(mappedImpact)})`;
}

export function buildUserLabel(user: EvaluationUserOption) {
  return user.fullName;
}
