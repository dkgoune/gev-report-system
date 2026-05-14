import { NextResponse } from "next/server";
import { canAccessAgencyAdminWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession();

  if (!session || !canAccessAgencyAdminWorkspace(session)) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const { id } = await params;

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

    const existing = await prisma.serviceIncidentBinding.findFirst({
      where: {
        id,
        service: {
          agencyId: session.activeAgencyId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Liaison introuvable." },
        { status: 404 }
      );
    }

    const nextServiceId = body.serviceId;
    const nextTemplateId = body.templateId;
    const nextTemplateVersionId = body.templateVersionId;

    if (nextServiceId) {
      const service = await prisma.serviceDefinition.findFirst({
        where: {
          id: nextServiceId,
          agencyId: session.activeAgencyId,
        },
        select: { id: true },
      });

      if (!service) {
        return NextResponse.json(
          { error: "Service introuvable." },
          { status: 404 }
        );
      }
    }

    if (nextTemplateId || nextTemplateVersionId) {
      const templateVersion = await prisma.incidentTemplateVersion.findFirst({
        where: {
          id: nextTemplateVersionId,
          ...(nextTemplateId ? { templateId: nextTemplateId } : {}),
          template: {
            agencyId: session.activeAgencyId,
          },
        },
        select: { id: true },
      });

      if (!templateVersion) {
        return NextResponse.json(
          { error: "Version de modele introuvable." },
          { status: 404 }
        );
      }
    }

    await prisma.serviceIncidentBinding.update({
      where: { id },
      data: {
        ...(typeof body.serviceId === "string"
          ? { serviceId: body.serviceId }
          : {}),
        ...(typeof body.templateId === "string"
          ? { templateId: body.templateId }
          : {}),
        ...(typeof body.templateVersionId === "string"
          ? { templateVersionId: body.templateVersionId }
          : {}),
        ...(typeof body.minEntries === "number"
          ? { minEntries: Math.max(0, body.minEntries) }
          : {}),
        ...(body.maxEntries === null
          ? { maxEntries: null }
          : typeof body.maxEntries === "number"
            ? { maxEntries: Math.max(0, body.maxEntries) }
            : {}),
        ...(typeof body.isRequired === "boolean"
          ? { isRequired: body.isRequired }
          : {}),
        ...(typeof body.displayOrder === "number"
          ? { displayOrder: Math.max(0, body.displayOrder) }
          : {}),
        ...(typeof body.isActive === "boolean"
          ? { isActive: body.isActive }
          : {}),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Cette liaison existe deja." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Impossible de mettre a jour la liaison." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getServerSession();

  if (!session || !canAccessAgencyAdminWorkspace(session)) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.serviceIncidentBinding.findFirst({
    where: {
      id,
      service: {
        agencyId: session.activeAgencyId,
      },
    },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Liaison introuvable." },
      { status: 404 }
    );
  }

  await prisma.serviceIncidentBinding.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
