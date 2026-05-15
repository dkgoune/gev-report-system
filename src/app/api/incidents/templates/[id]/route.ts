import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

function normalizeCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export async function PATCH(request: Request, { params }: Params) {
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

  const { id } = await params;

  try {
    const body = (await request.json()) as Partial<{
      name: string;
      code: string;
      description: string | null;
      icon: string | null;
      isActive: boolean;
    }>;

    const current = await prisma.incidentTemplate.findFirst({
      where: {
        id,
        agencyId: session.activeAgencyId,
      },
      select: { id: true },
    });

    if (!current) {
      return NextResponse.json(
        { error: "Modele d'incident introuvable." },
        { status: 404 }
      );
    }

    await prisma.incidentTemplate.update({
      where: { id },
      data: {
        ...(typeof body.name === "string" ? { name: body.name.trim() } : {}),
        ...(typeof body.code === "string"
          ? { code: normalizeCode(body.code) }
          : {}),
        ...(typeof body.description === "string"
          ? { description: body.description.trim() || null }
          : {}),
        ...(typeof body.icon === "string"
          ? { icon: body.icon.trim() || null }
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
        { error: "Un modele avec ce code existe deja." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Impossible de mettre a jour le modele d'incident." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
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

  const { id } = await params;

  const current = await prisma.incidentTemplate.findFirst({
    where: {
      id,
      agencyId: session.activeAgencyId,
    },
    select: { id: true },
  });

  if (!current) {
    return NextResponse.json(
      { error: "Modele d'incident introuvable." },
      { status: 404 }
    );
  }

  try {
    await prisma.incidentTemplate.delete({
      where: { id },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      {
        error:
          "Impossible de supprimer ce modele. Il est probablement deja utilise.",
      },
      { status: 409 }
    );
  }
}
