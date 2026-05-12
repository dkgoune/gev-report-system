import { NextResponse } from "next/server";
import type { Service } from "@/generated/prisma/enums";
import { canAccessAdminWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

const ALLOWED_SERVICES: Service[] = ["envoi", "piste", "retrait"];

function isAllowedService(value: string): value is Service {
  return ALLOWED_SERVICES.includes(value as Service);
}

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession();

  if (!session || !canAccessAdminWorkspace(session.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as Partial<{
      name: string;
      service: string;
      isActive: boolean;
    }>;

    const payload: {
      name?: string;
      service?: Service;
      isActive?: boolean;
    } = {};

    if (typeof body.name === "string") {
      const name = body.name.trim();

      if (!name) {
        return NextResponse.json(
          { error: "Le nom du groupe ne peut pas être vide." },
          { status: 400 }
        );
      }

      payload.name = name;
    }

    if (typeof body.service === "string") {
      const service = body.service.trim();

      if (!isAllowedService(service)) {
        return NextResponse.json(
          { error: "Service invalide." },
          { status: 400 }
        );
      }

      payload.service = service;
    }

    if (typeof body.isActive === "boolean") {
      payload.isActive = body.isActive;
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: "Aucune modification détectée." },
        { status: 400 }
      );
    }

    const group = await prisma.group.update({
      where: { id },
      data: payload,
      select: {
        id: true,
        name: true,
        service: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, group });
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

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Groupe introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Impossible de mettre à jour le groupe." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getServerSession();

  if (!session || !canAccessAdminWorkspace(session.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  const group = await prisma.group.findUnique({
    where: { id },
    select: {
      id: true,
      _count: {
        select: {
          users: true,
        },
      },
    },
  });

  if (!group) {
    return NextResponse.json({ error: "Groupe introuvable." }, { status: 404 });
  }

  if (group._count.users > 0) {
    return NextResponse.json(
      {
        error:
          "Suppression impossible. Retirez d'abord les personnels rattachés à ce groupe.",
      },
      { status: 409 }
    );
  }

  await prisma.group.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
