import type {
  IncidentFieldType,
  IncidentTemplateVersionStatus,
} from "@/generated/prisma/enums";

export type IncidentFieldValidationRules = {
  minLength: number | null;
  maxLength: number | null;
  pattern: string | null;
  minValue: number | null;
  maxValue: number | null;
};

export type IncidentFieldDefinition = {
  key: string;
  label: string;
  type: IncidentFieldType;
  required: boolean;
  placeholder: string | null;
  options: string[];
  validation: IncidentFieldValidationRules;
};

export type IncidentTemplateVersionItem = {
  id: string;
  version: number;
  status: IncidentTemplateVersionStatus;
  publishedAt: string | null;
  createdAt: string;
  fields: IncidentFieldDefinition[];
};

export type IncidentTemplateItem = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  versions: IncidentTemplateVersionItem[];
  allowedPosts?: Array<{ id: string; name: string; code: string }>;
};

export type IncidentServiceOption = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
};

export type IncidentTemplateOption = {
  id: string;
  name: string;
  versions: Array<{
    id: string;
    version: number;
    status: IncidentTemplateVersionStatus;
  }>;
};

export type IncidentBindingItem = {
  id: string;
  serviceId: string;
  serviceName: string;
  serviceCode: string | null;
  templateId: string;
  templateName: string;
  templateVersionId: string;
  templateVersionNumber: number;
  templateVersionStatus: IncidentTemplateVersionStatus;
  templateVersionFields: IncidentFieldDefinition[];
  minEntries: number;
  maxEntries: number | null;
  isRequired: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
