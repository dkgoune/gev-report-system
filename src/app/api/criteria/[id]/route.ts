import { NextResponse } from "next/server";
import type { Impact } from "@/generated/prisma/enums";
import { canAccessPlatform } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

const ALLOWED_IMPACTS: Impact[] = ["POSITIVE", "NEGATIVE"];

function isAllowedImpact(value: string): value is Impact {
  return ALLOWED_IMPACTS.includes(value as Impact);
}

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession();

  if (!session || !canAccessPlatform(session.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as Partial<{
      name: string;
      impact: string;
      defaultWeight: string;
      isActive: boolean;
    }>;

    const payload: {
      name?: string;
      impact?: Impact;
      defaultWeight?: string;
      isActive?: boolean;
    } = {};

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json(
          { error: "Le nom du critère ne peut pas être vide." },
          { status: 400 },
        );
      }
      payload.name = name;
    }

    if (typeof body.impact === "string") {
      const impact = body.impact.trim();
      if (!isAllowedImpact(impact)) {
        return NextResponse.json(
          { error: "Impact invalide." },
          { status: 400 },
        );
      }
      payload.impact = impact;
    }

    if (typeof body.defaultWeight === "string") {
      const defaultWeight = body.defaultWeight.trim();
      const parsedWeight = Number(defaultWeight);

      if (!defaultWeight || !Number.isFinite(parsedWeight)) {
        return NextResponse.json(
          { error: "Le poids par défaut doit être un nombre valide." },
          { status: 400 },
        );
      }

      payload.defaultWeight = defaultWeight;
    }

    if (typeof body.isActive === "boolean") {
      payload.isActive = body.isActive;
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: "Aucune modification détectée." },
        { status: 400 },
      );
    }

    const criterion = await prisma.criterion.update({
      where: { id },
      data: payload,
      select: {
        id: true,
        name: true,
        impact: true,
        defaultWeight: true,
        isActive: true,
        createdAt: true,
        createdById: true,
      },
    });

    return NextResponse.json({
      ok: true,
      criterion: {
        ...criterion,
        defaultWeight: criterion.defaultWeight.toString(),
        createdAt: criterion.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Critère introuvable." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Impossible de mettre à jour le critère." },
      { status: 500 },
    );
  }
}
