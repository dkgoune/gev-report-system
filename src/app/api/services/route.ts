import { NextResponse } from "next/server";
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

export async function GET() {
  const session = await getServerSession();

  if (
    !session ||
    !hasPermission(
      session,
      "service_read",
      "service_create",
      "service_update",
      "service_delete"
    )
  ) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const services = await prisma.serviceDefinition.findMany({
    where: {
      agencyId: session.activeAgencyId,
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      color: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    services: services.map(service => ({
      ...service,
      createdAt: service.createdAt.toISOString(),
      updatedAt: service.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session || !hasPermission(session, "service_create")) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<{
      name: string;
      code: string;
      description: string;
      color: string;
      isActive: boolean;
    }>;

    const name = body.name?.trim();
    const generatedCode = normalizeCode(body.code || body.name || "");
    const description = body.description?.trim() || null;
    const color = body.color?.trim() || null;

    if (!name || !generatedCode) {
      return NextResponse.json(
        { error: "Le nom et le code du service sont obligatoires." },
        { status: 400 }
      );
    }

    const service = await prisma.serviceDefinition.create({
      data: {
        agencyId: session.activeAgencyId,
        name,
        code: generatedCode,
        description,
        color,
        isActive: body.isActive ?? true,
        createdById: session.userId,
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        color: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        service: {
          ...service,
          createdAt: service.createdAt.toISOString(),
          updatedAt: service.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Impossible de creer le service." },
      { status: 500 }
    );
  }
}
