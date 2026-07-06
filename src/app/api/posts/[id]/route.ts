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
      "post_create",
      "post_update",
      "post_enable_disable",
      "post_delete"
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
      isActive: boolean;
      order: number;
      serviceId?: string | null;
    }>;

    const nextName =
      typeof body.name === "string" ? body.name.trim() : undefined;
    const nextCode =
      typeof body.code === "string" ? normalizeCode(body.code) : undefined;

    if (typeof body.name === "string" && !nextName) {
      return NextResponse.json(
        { error: "Le nom du poste est obligatoire." },
        { status: 400 }
      );
    }

    if (typeof body.code === "string" && !nextCode) {
      return NextResponse.json(
        { error: "Le code du poste est obligatoire." },
        { status: 400 }
      );
    }

    const post = await prisma.workPost.findFirst({
      where: {
        id,
        agencyId: session.activeAgencyId,
      },
      select: {
        id: true,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: "Poste introuvable." },
        { status: 404 }
      );
    }

    if (body.serviceId) {
      const service = await prisma.serviceDefinition.findFirst({
        where: {
          id: body.serviceId,
          agencyId: session.activeAgencyId,
          isActive: true,
        },
        select: { id: true },
      });
      if (!service) {
        return NextResponse.json(
          { error: "Service associé invalide ou inactif." },
          { status: 400 }
        );
      }
    }

    await prisma.workPost.update({
      where: { id },
      data: {
        ...(typeof nextName === "string" ? { name: nextName } : {}),
        ...(typeof nextCode === "string" ? { code: nextCode } : {}),
        ...(typeof body.description === "string"
          ? { description: body.description.trim() || null }
          : {}),
        ...(typeof body.isActive === "boolean"
          ? { isActive: body.isActive }
          : {}),
        ...(typeof body.order === "number" ? { order: body.order } : {}),
        ...(body.serviceId !== undefined ? { serviceId: body.serviceId || null } : {}),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Impossible de mettre a jour le poste." },
      { status: 500 }
    );
  }
}
