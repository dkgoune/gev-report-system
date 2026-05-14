import { NextResponse } from "next/server";
import { canAccessAgencyAdminWorkspace } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

const ALLOWED_IMPACTS: string[] = ["low", "high"];

function isAllowedImpact(value: string): boolean {
  return ALLOWED_IMPACTS.includes(value);
}

function normalizeImpact(value: string): string {
  const normalized = value.trim().toLowerCase();

  if (normalized === "positive") {
    return "high";
  }

  if (normalized === "negative") {
    return "low";
  }

  return normalized;
}

function parseMaxDaily(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return {
      error: "Le maximum quotidien est obligatoire.",
    } as const;
  }

  const parsed = Number(trimmed);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return {
      error: "Le maximum quotidien doit être un entier supérieur ou égal à 1.",
    } as const;
  }

  return { value: parsed } as const;
}

function parseWeight(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return {
      error: "Le poids est obligatoire.",
    } as const;
  }

  const parsed = Number(trimmed);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return {
      error: "Le poids doit être un nombre strictement positif.",
    } as const;
  }

  return { value: trimmed } as const;
}

export async function GET() {
  const session = await getServerSession();

  if (!session || !canAccessAgencyAdminWorkspace(session)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const criteria = await prisma.criterion.findMany({
    where: {
      agencyId: session.activeAgencyId,
    },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      impact: true,
      weight: true,
      maxDaily: true,
      isActive: true,
      createdAt: true,
      createdById: true,
    },
  });

  return NextResponse.json({
    criteria: criteria.map(criterion => ({
      ...criterion,
      weight: criterion.weight.toString(),
      createdAt: criterion.createdAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session || !canAccessAgencyAdminWorkspace(session)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<{
      name: string;
      impact: string;
      weight: string;
      maxDaily: string;
      isActive: boolean;
    }>;

    const name = body.name?.trim();
    const impact = body.impact ? normalizeImpact(body.impact) : "";
    const weight = parseWeight(body.weight);
    const maxDaily = parseMaxDaily(body.maxDaily);
    const isActive = body.isActive ?? true;

    if (!name || !impact) {
      return NextResponse.json(
        { error: "Le nom et l'impact sont obligatoires." },
        { status: 400 }
      );
    }

    if (!isAllowedImpact(impact)) {
      return NextResponse.json({ error: "Impact invalide." }, { status: 400 });
    }

    if ("error" in weight) {
      return NextResponse.json({ error: weight.error }, { status: 400 });
    }

    if ("error" in maxDaily) {
      return NextResponse.json({ error: maxDaily.error }, { status: 400 });
    }

    const criterion = await prisma.criterion.create({
      data: {
        agencyId: session.activeAgencyId,
        name,
        impact,
        weight: weight.value,
        maxDaily: maxDaily.value,
        isActive,
        createdById: session.userId,
      },
      select: {
        id: true,
        name: true,
        impact: true,
        weight: true,
        maxDaily: true,
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
          weight: criterion.weight.toString(),
          createdAt: criterion.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Impossible de créer le critère." },
      { status: 500 }
    );
  }
}
