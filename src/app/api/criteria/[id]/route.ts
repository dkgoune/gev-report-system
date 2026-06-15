import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

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

function parseMaxDaily(value: string) {
  const trimmed = value.trim();

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

function parseWeight(value: string) {
  const trimmed = value.trim();

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

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession();

  if (
    !session ||
    !hasPermission(
      session,
      "criteria_create",
      "criteria_update",
      "criteria_enable_disable"
    )
  ) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as Partial<{
      name: string;
      impact: string;
      weight: string;
      maxDaily: string;
      isActive: boolean;
      requiresPersonnel: boolean;
    }>;

    const existing = await prisma.criterion.findFirst({
      where: {
        id,
        agencyId: session.activeAgencyId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Critère introuvable." },
        { status: 404 }
      );
    }

    const payload: {
      name?: string;
      impact?: string;
      weight?: string;
      maxDaily?: number;
      isActive?: boolean;
      requiresPersonnel?: boolean;
    } = {};

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name) {
        return NextResponse.json(
          { error: "Le nom du critère ne peut pas être vide." },
          { status: 400 }
        );
      }
      payload.name = name;
    }

    if (typeof body.impact === "string") {
      const impact = normalizeImpact(body.impact);
      if (!isAllowedImpact(impact)) {
        return NextResponse.json(
          { error: "Impact invalide." },
          { status: 400 }
        );
      }
      payload.impact = impact;
    }

    if (typeof body.maxDaily === "string") {
      const maxDaily = parseMaxDaily(body.maxDaily);

      if ("error" in maxDaily) {
        return NextResponse.json({ error: maxDaily.error }, { status: 400 });
      }

      payload.maxDaily = maxDaily.value;
    } else if (body.maxDaily === null) {
      body.maxDaily = undefined;
    }

    if (typeof body.weight === "string") {
      const weight = parseWeight(body.weight);

      if ("error" in weight) {
        return NextResponse.json({ error: weight.error }, { status: 400 });
      }

      payload.weight = weight.value;
    }

    if (typeof body.isActive === "boolean") {
      payload.isActive = body.isActive;
    }

    if (typeof body.requiresPersonnel === "boolean") {
      payload.requiresPersonnel = body.requiresPersonnel;
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: "Aucune modification détectée." },
        { status: 400 }
      );
    }

    const criterion = await prisma.criterion.update({
      where: { id },
      data: payload,
      select: {
        id: true,
        name: true,
        impact: true,
        weight: true,
        maxDaily: true,
        isActive: true,
        requiresPersonnel: true,
        createdAt: true,
        createdById: true,
      },
    });

    return NextResponse.json({
      ok: true,
      criterion: {
        ...criterion,
        weight: criterion.weight.toString(),
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
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Impossible de mettre à jour le critère." },
      { status: 500 }
    );
  }
}
