import type { CriterionFormState, CriterionImpact } from "./types";

export const defaultCriterionFormState: CriterionFormState = {
  name: "",
  impact: "high",
  weight: "1.00",
  maxDaily: "",
  isActive: true,
  requiresPersonnel: true,
};

export const impactOptions: Array<{ value: CriterionImpact; label: string }> = [
  { value: "high", label: "Positif" },
  { value: "low", label: "Négatif" },
];

export function impactLabel(impact: CriterionImpact): string {
  return impactOptions.find(item => item.value === impact)?.label || impact;
}
