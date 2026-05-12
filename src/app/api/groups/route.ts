import { NextResponse } from "next/server";
import type { Service } from "@/generated/prisma/enums";
import { canAccessAdminWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

const ALLOWED_SERVICES: Service[] = ["envoi", "piste", "retrait"];

function isAllowedService(value: string): value is Service {
  return ALLOWED_SERVICES.includes(value as Service);
}

export async function GET() {
  const session = await getServerSession();

  if (!session || !canAccessAdminWorkspace(session.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const groups = await prisma.group.findMany({
    orderBy: [{ service: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      service: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          users: true,
        },
      },
    },
  });

  return NextResponse.json({
    groups: groups.map(group => ({
      id: group.id,
      name: group.name,
      service: group.service,
      isActive: group.isActive,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      memberCount: group._count.users,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session || !canAccessAdminWorkspace(session.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<{
      name: string;
      service: string;
      isActive: boolean;
    }>;

    const name = body.name?.trim();
    const service = body.service?.trim();
    const isActive = body.isActive ?? true;

    if (!name || !service) {
      return NextResponse.json(
        { error: "Nom et service sont obligatoires." },
        { status: 400 }
      );
    }

    if (!isAllowedService(service)) {
      return NextResponse.json({ error: "Service invalide." }, { status: 400 });
    }

    const group = await prisma.group.create({
      data: {
        name,
        service,
        isActive,
      },
      select: {
        id: true,
        name: true,
        service: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, group }, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Un groupe avec ce nom existe déjà pour ce service." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Impossible de créer le groupe." },
      { status: 500 }
    );
  }
}
