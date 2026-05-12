import { NextResponse } from "next/server";
import type { AttendanceStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

const ALLOWED_STATUSES: AttendanceStatus[] = ["PRESENT", "ABSENT"];

function isAllowedStatus(value: string): value is AttendanceStatus {
  return ALLOWED_STATUSES.includes(value as AttendanceStatus);
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<{
      criterionId: string;
      status: string;
    }>;

    const criterionId = body.criterionId?.trim();
    const status = body.status?.trim();

    if (!criterionId || !status) {
      return NextResponse.json(
        { error: "Le critère et le statut sont obligatoires." },
        { status: 400 }
      );
    }

    if (!isAllowedStatus(status)) {
      return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
    }

    const criterion = await prisma.criterion.findUnique({
      where: { id: criterionId },
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
        criterionId,
        status,
        createdById: session.userId,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        criterion: {
          select: {
            id: true,
            name: true,
            impact: true,
            defaultWeight: true,
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
            defaultWeight: setting.criterion.defaultWeight.toString(),
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
