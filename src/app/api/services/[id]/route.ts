import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession();

  if (
    !session ||
    !hasPermission(session, "service_update", "service_enable_disable")
  ) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as Partial<{
      name: string;
      description: string | null;
      color: string | null;
      isActive: boolean;
    }>;

    const service = await prisma.serviceDefinition.findFirst({
      where: {
        id,
        agencyId: session.activeAgencyId,
      },
      select: {
        id: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service introuvable." },
        { status: 404 }
      );
    }

    await prisma.serviceDefinition.update({
      where: { id },
      data: {
        ...(typeof body.name === "string" ? { name: body.name.trim() } : {}),
        ...(typeof body.description === "string"
          ? { description: body.description.trim() || null }
          : {}),
        ...(typeof body.color === "string"
          ? { color: body.color.trim() || null }
          : {}),
        ...(typeof body.isActive === "boolean"
          ? { isActive: body.isActive }
          : {}),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Impossible de mettre a jour le service." },
      { status: 500 }
    );
  }
}
