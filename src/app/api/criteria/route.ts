import { NextResponse } from "next/server";
import type { Impact } from "@/generated/prisma/enums";
import { canAccessPlatform } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

const ALLOWED_IMPACTS: Impact[] = ["POSITIVE", "NEGATIVE"];

function isAllowedImpact(value: string): value is Impact {
  return ALLOWED_IMPACTS.includes(value as Impact);
}

export async function GET() {
  const session = await getServerSession();

  if (!session || !canAccessPlatform(session.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const criteria = await prisma.criterion.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
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
    criteria: criteria.map((criterion) => ({
      ...criterion,
      defaultWeight: criterion.defaultWeight.toString(),
      createdAt: criterion.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session || !canAccessPlatform(session.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<{
      name: string;
      impact: string;
      defaultWeight: string;
      isActive: boolean;
    }>;

    const name = body.name?.trim();
    const impact = body.impact?.trim();
    const defaultWeight = body.defaultWeight?.trim();
    const isActive = body.isActive ?? true;

    if (!name || !impact || !defaultWeight) {
      return NextResponse.json(
        { error: "Le nom, l'impact et le poids par défaut sont obligatoires." },
        { status: 400 },
      );
    }

    if (!isAllowedImpact(impact)) {
      return NextResponse.json({ error: "Impact invalide." }, { status: 400 });
    }

    const parsedWeight = Number(defaultWeight);

    if (!Number.isFinite(parsedWeight)) {
      return NextResponse.json(
        { error: "Le poids par défaut doit être un nombre valide." },
        { status: 400 },
      );
    }

    const criterion = await prisma.criterion.create({
      data: {
        name,
        impact,
        defaultWeight: defaultWeight,
        isActive,
        createdById: session.userId,
      },
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

    return NextResponse.json(
      {
        ok: true,
        criterion: {
          ...criterion,
          defaultWeight: criterion.defaultWeight.toString(),
          createdAt: criterion.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Impossible de créer le critère." },
      { status: 500 },
    );
  }
}
