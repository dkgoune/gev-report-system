export type CriterionImpact = "POSITIVE" | "NEGATIVE";

export type CriterionItem = {
  id: string;
  name: string;
  impact: CriterionImpact;
  defaultWeight: string;
  isActive: boolean;
  createdAt: string;
  createdById: string;
};

export type CriterionFormState = {
  name: string;
  impact: CriterionImpact;
  defaultWeight: string;
  isActive: boolean;
};
