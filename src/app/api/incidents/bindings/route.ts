import { NextResponse } from "next/server";
import { canAccessAgencyAdminWorkspace, canCreateReports } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

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
  service: { name: string; code?: string };
  template: { name: string };
  templateVersion: {
    version: number;
    status: "draft" | "published" | "archived";
    fieldsJson?: unknown;
  };
}) {
  return {
    id: binding.id,
    serviceId: binding.serviceId,
    serviceName: binding.service.name,
    templateId: binding.templateId,
    templateName: binding.template.name,
    templateVersionId: binding.templateVersionId,
    templateVersionNumber: binding.templateVersion.version,
    templateVersionStatus: binding.templateVersion.status,
    templateVersionFields: Array.isArray(binding.templateVersion.fieldsJson)
      ? binding.templateVersion.fieldsJson
      : [],
    serviceCode: binding.service.code ?? null,
    minEntries: binding.minEntries,
    maxEntries: binding.maxEntries,
    isRequired: binding.isRequired,
    displayOrder: binding.displayOrder,
    isActive: binding.isActive,
    createdAt: binding.createdAt.toISOString(),
    updatedAt: binding.updatedAt.toISOString(),
  };
}

export async function GET() {
  const session = await getServerSession();

  if (
    !session ||
    (!canAccessAgencyAdminWorkspace(session) && !canCreateReports(session))
  ) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const [services, templates, bindings] = await Promise.all([
    prisma.serviceDefinition.findMany({
      where: { agencyId: session.activeAgencyId },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
      },
    }),
    prisma.incidentTemplate.findMany({
      where: { agencyId: session.activeAgencyId },
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
          agencyId: session.activeAgencyId,
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

  return NextResponse.json({
    services,
    templateOptions: templates,
    bindings: bindings.map(serializeBinding),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session || !canAccessAgencyAdminWorkspace(session)) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<{
      serviceId: string;
      templateId: string;
      templateVersionId: string;
      minEntries: number;
      maxEntries: number | null;
      isRequired: boolean;
      displayOrder: number;
      isActive: boolean;
    }>;

    if (!body.serviceId || !body.templateId || !body.templateVersionId) {
      return NextResponse.json(
        { error: "Service, modele et version sont obligatoires." },
        { status: 400 }
      );
    }

    const [service, templateVersion] = await Promise.all([
      prisma.serviceDefinition.findFirst({
        where: {
          id: body.serviceId,
          agencyId: session.activeAgencyId,
        },
        select: { id: true },
      }),
      prisma.incidentTemplateVersion.findFirst({
        where: {
          id: body.templateVersionId,
          templateId: body.templateId,
          template: {
            agencyId: session.activeAgencyId,
          },
        },
        select: { id: true },
      }),
    ]);

    if (!service || !templateVersion) {
      return NextResponse.json(
        { error: "Service, modele ou version introuvable." },
        { status: 404 }
      );
    }

    const binding = await prisma.serviceIncidentBinding.create({
      data: {
        serviceId: body.serviceId,
        templateId: body.templateId,
        templateVersionId: body.templateVersionId,
        minEntries: Math.max(0, Number(body.minEntries ?? 0)),
        maxEntries:
          body.maxEntries === null || body.maxEntries === undefined
            ? null
            : Math.max(0, Number(body.maxEntries)),
        isRequired: Boolean(body.isRequired),
        displayOrder: Math.max(0, Number(body.displayOrder ?? 0)),
        isActive: body.isActive ?? true,
      },
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
    });

    return NextResponse.json(
      { ok: true, binding: serializeBinding(binding) },
      { status: 201 }
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "Cette liaison existe deja pour ce service et ce modele d'incident.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Impossible de creer la liaison d'incident." },
      { status: 500 }
    );
  }
}
