import { redirect } from "next/navigation";
import type { IncidentTemplateOption } from "@/components/incident-management/types";
import { sanitizeIncidentFields } from "@/lib/incident-field-schema";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { canAccessAgencyAdminWorkspace } from "@/lib/authz";

export async function requireIncidentAdminSession() {
  const session = await getServerSession();

  if (!session) {
    redirect("/auth/login");
  }

  if (!canAccessAgencyAdminWorkspace(session)) {
    redirect("/");
  }

  return session;
}

function serializeTemplate(template: {
  id: string;
  name: string;
  code: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  versions: Array<{
    id: string;
    version: number;
    status: "draft" | "published" | "archived";
    publishedAt: Date | null;
    createdAt: Date;
    fieldsJson: unknown;
  }>;
}) {
  return {
    id: template.id,
    name: template.name,
    code: template.code,
    description: template.description,
    icon: template.icon,
    isActive: template.isActive,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
    versions: template.versions.map(version => ({
      id: version.id,
      version: version.version,
      status: version.status,
      publishedAt: version.publishedAt?.toISOString() ?? null,
      createdAt: version.createdAt.toISOString(),
      fields: sanitizeIncidentFields(version.fieldsJson),
    })),
  };
}

function serializeBinding(binding: {
  id: string;
  serviceId: string;
  templateId: string;
  templateVersionId: string;
  minEntries: number;
  maxEntries: number | null;
  isRequired: boolean;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  service: { name: string; code: string };
  template: { name: string };
  templateVersion: {
    version: number;
    status: "draft" | "published" | "archived";
    fieldsJson: unknown;
  };
}) {
  return {
    id: binding.id,
    serviceId: binding.serviceId,
    serviceName: binding.service.name,
    serviceCode: binding.service.code,
    templateId: binding.templateId,
    templateName: binding.template.name,
    templateVersionId: binding.templateVersionId,
    templateVersionNumber: binding.templateVersion.version,
    templateVersionStatus: binding.templateVersion.status,
    templateVersionFields: sanitizeIncidentFields(
      binding.templateVersion.fieldsJson
    ),
    minEntries: binding.minEntries,
    maxEntries: binding.maxEntries,
    isRequired: binding.isRequired,
    displayOrder: binding.displayOrder,
    isActive: binding.isActive,
    createdAt: binding.createdAt.toISOString(),
    updatedAt: binding.updatedAt.toISOString(),
  };
}

export async function getIncidentTemplatesPageData(agencyId: string) {
  const templates = await prisma.incidentTemplate.findMany({
    where: {
      agencyId,
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      versions: {
        orderBy: [{ version: "desc" }],
      },
    },
  });

  return {
    templates: templates.map(serializeTemplate),
  };
}

export async function getIncidentTemplateDetailPageData(
  agencyId: string,
  templateId: string
) {
  const templates = await prisma.incidentTemplate.findMany({
    where: {
      agencyId,
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      versions: {
        orderBy: [{ version: "desc" }],
      },
    },
  });

  const serializedTemplates = templates.map(serializeTemplate);
  const template =
    serializedTemplates.find(item => item.id === templateId) ?? null;

  return {
    template,
    templates: serializedTemplates,
  };
}

export async function getIncidentBindingsPageData(agencyId: string) {
  const [services, templateOptions, bindings] = await Promise.all([
    prisma.serviceDefinition.findMany({
      where: {
        agencyId,
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
      },
    }),
    prisma.incidentTemplate.findMany({
      where: {
        agencyId,
      },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        versions: {
          orderBy: [{ version: "desc" }],
          select: {
            id: true,
            version: true,
            status: true,
          },
        },
      },
    }),
    prisma.serviceIncidentBinding.findMany({
      where: {
        service: {
          agencyId,
        },
      },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
      include: {
        service: {
          select: { name: true, code: true },
        },
        template: {
          select: { name: true },
        },
        templateVersion: {
          select: {
            version: true,
            status: true,
            fieldsJson: true,
          },
        },
      },
    }),
  ]);

  return {
    services,
    templateOptions: templateOptions as IncidentTemplateOption[],
    bindings: bindings.map(serializeBinding),
  };
}

export async function getIncidentOverviewPageData(agencyId: string) {
  const [
    templateCount,
    activeTemplateCount,
    bindingCount,
    activeBindingCount,
    serviceCount,
  ] = await Promise.all([
    prisma.incidentTemplate.count({
      where: { agencyId },
    }),
    prisma.incidentTemplate.count({
      where: { agencyId, isActive: true },
    }),
    prisma.serviceIncidentBinding.count({
      where: {
        service: { agencyId },
      },
    }),
    prisma.serviceIncidentBinding.count({
      where: {
        service: { agencyId },
        isActive: true,
      },
    }),
    prisma.serviceDefinition.count({
      where: { agencyId, isActive: true },
    }),
  ]);

  return {
    templateCount,
    activeTemplateCount,
    bindingCount,
    activeBindingCount,
    serviceCount,
  };
}
