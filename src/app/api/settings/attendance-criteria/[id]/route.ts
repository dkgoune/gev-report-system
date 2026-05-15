import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Params) {
  const session = await getServerSession();

  if (!session || !hasPermission(session, "settings_attendance_rules_delete")) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const setting = await prisma.attendanceCriterionSetting.findFirst({
      where: {
        id,
        criterion: {
          agencyId: session.activeAgencyId,
        },
      },
      select: { id: true },
    });

    if (!setting) {
      return NextResponse.json(
        { error: "Règle introuvable." },
        { status: 404 }
      );
    }

    await prisma.attendanceCriterionSetting.delete({
      where: { id: setting.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Règle introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Impossible de supprimer cette règle automatique." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession();

  if (!session || !hasPermission(session, "settings_attendance_rules_update")) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as Partial<{ isEnabled: boolean }>;

    if (typeof body.isEnabled !== "boolean") {
      return NextResponse.json(
        { error: "Le statut d'activation est obligatoire." },
        { status: 400 }
      );
    }

    const setting = await prisma.attendanceCriterionSetting.findFirst({
      where: {
        id,
        agencyId: session.activeAgencyId,
      },
      select: {
        id: true,
      },
    });

    if (!setting) {
      return NextResponse.json(
        { error: "Règle introuvable." },
        { status: 404 }
      );
    }

    const updated = await prisma.attendanceCriterionSetting.update({
      where: { id: setting.id },
      data: {
        isEnabled: body.isEnabled,
      },
      select: {
        id: true,
        isEnabled: true,
        appliesTo: true,
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

    return NextResponse.json({
      ok: true,
      setting: {
        ...updated,
        appliesTo: updated.appliesTo,
        createdAt: updated.createdAt.toISOString(),
        criterion: {
          ...updated.criterion,
          weight: updated.criterion.weight.toString(),
        },
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Impossible de mettre à jour cette règle automatique." },
      { status: 500 }
    );
  }
}
