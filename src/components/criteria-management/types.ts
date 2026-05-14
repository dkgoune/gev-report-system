export type CriterionImpact = string;

export type CriterionItem = {
  id: string;
  name: string;
  impact: CriterionImpact;
  weight: string;
  maxDaily: number | null;
  isActive: boolean;
  createdAt: string;
  createdById: string;
};

export type CriterionFormState = {
  name: string;
  impact: CriterionImpact;
  weight: string;
  maxDaily: string;
  isActive: boolean;
};
