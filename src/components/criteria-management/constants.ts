import type { CriterionFormState, CriterionImpact } from "./types";

export const defaultCriterionFormState: CriterionFormState = {
  name: "",
  impact: "POSITIVE",
  defaultWeight: "1.00",
  maxDaily: "",
  isActive: true,
};

export const impactOptions: Array<{ value: CriterionImpact; label: string }> = [
  { value: "POSITIVE", label: "Positif" },
  { value: "NEGATIVE", label: "Négatif" },
];

export function impactLabel(impact: CriterionImpact): string {
  return impactOptions.find(item => item.value === impact)?.label || impact;
}
