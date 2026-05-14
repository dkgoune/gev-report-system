import { NextResponse } from "next/server";
import { IncidentTemplateVersionStatus } from "@/generated/prisma/enums";
import { canAccessAgencyAdminWorkspace } from "@/lib/authz";
import { sanitizeIncidentFields } from "@/lib/incident-field-schema";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await getServerSession();

  if (!session || !canAccessAgencyAdminWorkspace(session)) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as Partial<{
      fields: unknown;
      publishVersion: boolean;
    }>;

    const template = await prisma.incidentTemplate.findFirst({
      where: {
        id,
        agencyId: session.activeAgencyId,
      },
      select: {
        id: true,
        versions: {
          orderBy: [{ version: "desc" }],
          take: 1,
          select: {
            version: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Modele d'incident introuvable." },
        { status: 404 }
      );
    }

    const fields = sanitizeIncidentFields(body.fields ?? []);
    const nextVersion = (template.versions[0]?.version ?? 0) + 1;

    const version = await prisma.incidentTemplateVersion.create({
      data: {
        templateId: id,
        version: nextVersion,
        fieldsJson: fields,
        status: body.publishVersion
          ? IncidentTemplateVersionStatus.published
          : IncidentTemplateVersionStatus.draft,
        publishedAt: body.publishVersion ? new Date() : null,
        createdById: session.userId,
      },
      select: {
        id: true,
        version: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        fieldsJson: true,
      },
    });

    return NextResponse.json({
      ok: true,
      version: {
        id: version.id,
        version: version.version,
        status: version.status,
        publishedAt: version.publishedAt?.toISOString() ?? null,
        createdAt: version.createdAt.toISOString(),
        fields,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible de creer la version du modele.",
      },
      { status: 500 }
    );
  }
}
