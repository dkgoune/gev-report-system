import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Params) {
  const session = await getServerSession();

  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.attendanceCriterionSetting.delete({
      where: { id },
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
