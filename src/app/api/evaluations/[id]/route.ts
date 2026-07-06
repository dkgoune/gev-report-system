import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      isCancelled?: boolean;
      comment?: string;
    };

    const isCancelling = body.isCancelled !== undefined;
    const requiredPermission = isCancelling ? "evaluation_cancel" : "evaluation_create";

    if (!hasPermission(session, requiredPermission)) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    const evaluation = await prisma.personnelEvaluation.findUnique({
      where: { id },
      include: {
        criterion: true,
      },
    });

    if (!evaluation || evaluation.criterion.agencyId !== session.activeAgencyId) {
      return NextResponse.json({ error: "Évaluation introuvable." }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (body.isCancelled !== undefined) {
      dataToUpdate.isCancelled = body.isCancelled;
      if (body.isCancelled) {
        dataToUpdate.cancelledAt = new Date();
      }
    }
    if (body.comment !== undefined) {
      dataToUpdate.comment = body.comment;
    }

    const updated = await prisma.personnelEvaluation.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ ok: true, evaluation: updated });
  } catch (error) {
    console.error("Error cancelling evaluation:", error);
    return NextResponse.json({ error: "Erreur serveur lors de l'annulation." }, { status: 500 });
  }
}
