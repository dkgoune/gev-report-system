import { NextResponse } from "next/server";
import { canAccessAgencyAdminWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session || !canAccessAgencyAdminWorkspace(session)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<{
      criterionId: string;
    }>;

    const criterionId = body.criterionId?.trim();

    if (!criterionId) {
      return NextResponse.json(
        { error: "Le critère est obligatoire." },
        { status: 400 }
      );
    }

    const criterion = await prisma.criterion.findUnique({
      where: { id: criterionId, agencyId: session.activeAgencyId },
      select: { id: true, isActive: true },
    });

    if (!criterion || !criterion.isActive) {
      return NextResponse.json(
        { error: "Le critère sélectionné est introuvable ou inactif." },
        { status: 400 }
      );
    }

    const setting = await prisma.attendanceCriterionSetting.create({
      data: {
        agencyId: session.activeAgencyId,
        criterionId,
        isEnabled: true,
        createdById: session.userId,
      },
      select: {
        id: true,
        isEnabled: true,
        createdAt: true,
        criterion: {
          select: {
            id: true,
            name: true,
            impact: true,
            weight: true,
            maxDaily: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        ok: true,
        setting: {
          ...setting,
          createdAt: setting.createdAt.toISOString(),
          criterion: {
            ...setting.criterion,
            weight: setting.criterion.weight.toString(),
          },
        },
      },
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
        { error: "Cette règle existe déjà pour ce statut." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Impossible d'enregistrer cette règle automatique." },
      { status: 500 }
    );
  }
}
