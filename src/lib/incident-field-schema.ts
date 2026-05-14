import { IncidentFieldType } from "@/generated/prisma/enums";

export type IncidentFieldValidationRules = {
  minLength: number | null;
  maxLength: number | null;
  pattern: string | null;
  minValue: number | null;
  maxValue: number | null;
};

export type IncidentFieldDefinitionInput = {
  key?: string;
  label?: string;
  type?: string;
  required?: boolean;
  placeholder?: string | null;
  options?: unknown;
  validation?: Partial<IncidentFieldValidationRules> | null;
};

export type IncidentFieldDefinition = {
  key: string;
  label: string;
  type: keyof typeof IncidentFieldType;
  required: boolean;
  placeholder: string | null;
  options: string[];
  validation: IncidentFieldValidationRules;
};

function normalizeFieldKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

function normalizeRuleNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("Valeur de validation numerique invalide.");
  }

  return parsed;
}

function sanitizeValidationRules(
  type: keyof typeof IncidentFieldType,
  value: unknown
): IncidentFieldValidationRules {
  const input =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<IncidentFieldValidationRules>)
      : {};

  const minLength = normalizeRuleNumber(input.minLength);
  const maxLength = normalizeRuleNumber(input.maxLength);
  const minValue = normalizeRuleNumber(input.minValue);
  const maxValue = normalizeRuleNumber(input.maxValue);
  const pattern =
    typeof input.pattern === "string" ? input.pattern.trim() || null : null;

  if (
    minLength !== null &&
    maxLength !== null &&
    Math.trunc(minLength) > Math.trunc(maxLength)
  ) {
    throw new Error("minLength ne peut pas depasser maxLength.");
  }

  if (minValue !== null && maxValue !== null && minValue > maxValue) {
    throw new Error("minValue ne peut pas depasser maxValue.");
  }

  if (pattern) {
    try {
      // Validate pattern syntax now so report forms can trust it later.
      new RegExp(pattern);
    } catch {
      throw new Error("Expression reguliere invalide.");
    }
  }

  const supportsTextRules =
    type === IncidentFieldType.text ||
    type === IncidentFieldType.textarea ||
    type === IncidentFieldType.select ||
    type === IncidentFieldType.multiselect;

  const supportsNumericRules = type === IncidentFieldType.number;

  return {
    minLength:
      supportsTextRules && minLength !== null ? Math.trunc(minLength) : null,
    maxLength:
      supportsTextRules && maxLength !== null ? Math.trunc(maxLength) : null,
    pattern: supportsTextRules ? pattern : null,
    minValue: supportsNumericRules ? minValue : null,
    maxValue: supportsNumericRules ? maxValue : null,
  };
}

export function sanitizeIncidentFields(
  input: unknown
): IncidentFieldDefinition[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const allowedTypes = new Set(Object.values(IncidentFieldType));
  const seenKeys = new Set<string>();
  const fields: IncidentFieldDefinition[] = [];

  for (const item of input) {
    const field = item as IncidentFieldDefinitionInput;
    const key = normalizeFieldKey(field.key ?? "");
    const label = field.label?.trim() ?? "";
    const fieldType = (field.type?.trim() ||
      "text") as keyof typeof IncidentFieldType;

    if (!key || !label) {
      throw new Error("Chaque champ doit avoir une cle et un libelle.");
    }

    if (seenKeys.has(key)) {
      throw new Error("Les cles de champs doivent etre uniques.");
    }

    if (!allowedTypes.has(fieldType)) {
      throw new Error("Type de champ invalide.");
    }

    seenKeys.add(key);

    const options = Array.isArray(field.options)
      ? field.options.map(option => String(option).trim()).filter(Boolean)
      : [];

    fields.push({
      key,
      label,
      type: fieldType,
      required: Boolean(field.required),
      placeholder:
        typeof field.placeholder === "string"
          ? field.placeholder.trim() || null
          : null,
      options,
      validation: sanitizeValidationRules(fieldType, field.validation),
    });
  }

  return fields;
}
