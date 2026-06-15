import { IncidentFieldType } from "@/generated/prisma/enums";
import type {
  IncidentFieldDefinition,
  IncidentFieldValidationRules,
  IncidentTemplateItem,
} from "./types";

export type TemplateFormState = {
  name: string;
  code: string;
  description: string;
  icon: string;
  isActive: boolean;
  publishVersion: boolean;
  allowedPostIds: string[];
};

export type FieldDraft = {
  key: string;
  label: string;
  type: keyof typeof IncidentFieldType;
  required: boolean;
  placeholder: string;
  optionsText: string;
  minLength: string;
  maxLength: string;
  pattern: string;
  minValue: string;
  maxValue: string;
};

export const FIELD_TYPE_OPTIONS = Object.values(IncidentFieldType);

export const defaultTemplateFormState: TemplateFormState = {
  name: "",
  code: "",
  description: "",
  icon: "",
  isActive: true,
  publishVersion: true,
  allowedPostIds: [],
};

export const defaultFieldDraft: FieldDraft = {
  key: "",
  label: "",
  type: IncidentFieldType.text,
  required: false,
  placeholder: "",
  optionsText: "",
  minLength: "",
  maxLength: "",
  pattern: "",
  minValue: "",
  maxValue: "",
};

export function toRuleString(value: number | null) {
  return value === null ? "" : String(value);
}

export function toRuleNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

export function hasDuplicateTemplateIdentity(
  templates: IncidentTemplateItem[],
  target: { id?: string | null; name: string; code: string }
) {
  const name = target.name.trim().toLowerCase();
  const code = target.code.trim().toLowerCase();

  return templates.some(template => {
    if (target.id && template.id === target.id) {
      return false;
    }

    return (
      template.name.trim().toLowerCase() === name ||
      template.code.trim().toLowerCase() === code
    );
  });
}

export function mapFieldToDraft(field: IncidentFieldDefinition): FieldDraft {
  return {
    key: field.key,
    label: field.label,
    type: field.type,
    required: field.required,
    placeholder: field.placeholder ?? "",
    optionsText: field.options.join(", "),
    minLength: toRuleString(field.validation.minLength),
    maxLength: toRuleString(field.validation.maxLength),
    pattern: field.validation.pattern ?? "",
    minValue: toRuleString(field.validation.minValue),
    maxValue: toRuleString(field.validation.maxValue),
  };
}

export function mapDraftToField(draft: FieldDraft): IncidentFieldDefinition {
  const validation: IncidentFieldValidationRules = {
    minLength: toRuleNumber(draft.minLength),
    maxLength: toRuleNumber(draft.maxLength),
    pattern: draft.pattern.trim() || null,
    minValue: toRuleNumber(draft.minValue),
    maxValue: toRuleNumber(draft.maxValue),
  };

  return {
    key: draft.key.trim(),
    label: draft.label.trim(),
    type: draft.type,
    required: draft.required,
    placeholder: draft.placeholder.trim() || null,
    options: draft.optionsText
      .split(",")
      .map(item => item.trim())
      .filter(Boolean),
    validation,
  };
}
