import { NextResponse } from "next/server";
import { IncidentTemplateVersionStatus } from "@/generated/prisma/enums";
import { sanitizeIncidentFields } from "@/lib/incident-field-schema";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

function normalizeCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
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
    status: IncidentTemplateVersionStatus;
    publishedAt: Date | null;
    createdAt: Date;
    fieldsJson: unknown;
  }>;
  allowedPosts?: Array<{ id: string; name: string; code: string }>;
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
    allowedPosts: template.allowedPosts?.map(post => ({
      id: post.id,
      name: post.name,
      code: post.code,
    })) ?? [],
  };
}

export async function GET() {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const templates = await prisma.incidentTemplate.findMany({
    where: {
      agencyId: session.activeAgencyId,
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    include: {
      versions: {
        orderBy: [{ version: "desc" }],
      },
      allowedPosts: true,
    },
  });

  return NextResponse.json({
    templates: templates.map(serializeTemplate),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (
    !session ||
    !hasPermission(
      session,
      "incident_binding_manage",
      "incident_template_manage"
    )
  ) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<{
      name: string;
      code: string;
      description: string;
      icon: string;
      isActive: boolean;
      fields: unknown;
      publishVersion: boolean;
      allowedPostIds?: string[];
    }>;

    const name = body.name?.trim();
    const code = normalizeCode(body.code || body.name || "");

    if (!name || !code) {
      return NextResponse.json(
        { error: "Le nom et le code sont obligatoires." },
        { status: 400 }
      );
    }

    const fields = sanitizeIncidentFields(body.fields ?? []);

    const template = await prisma.incidentTemplate.create({
      data: {
        agencyId: session.activeAgencyId,
        name,
        code,
        description: body.description?.trim() || null,
        icon: body.icon?.trim() || null,
        isActive: body.isActive ?? true,
        createdById: session.userId,
        allowedPosts: {
          connect: (body.allowedPostIds || []).map(id => ({ id })),
        },
        versions: {
          create: {
            version: 1,
            fieldsJson: fields,
            status: body.publishVersion
              ? IncidentTemplateVersionStatus.published
              : IncidentTemplateVersionStatus.draft,
            publishedAt: body.publishVersion ? new Date() : null,
            createdById: session.userId,
          },
        },
      },
      include: {
        versions: {
          orderBy: [{ version: "desc" }],
        },
        allowedPosts: true,
      },
    });

    return NextResponse.json(
      { ok: true, template: serializeTemplate(template) },
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
        { error: "Un modele avec ce code existe deja." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible de creer le modele d'incident.",
      },
      { status: 500 }
    );
  }
}
