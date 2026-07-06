import { NextResponse } from "next/server";
import {
  deleteSignatureLog,
  getSignatureLogById,
  updateSignatureLog,
} from "@/lib/signature-logs";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const payload = await getSignatureLogById(session, id);

    if (!payload) {
      return NextResponse.json(
        { error: "Signature introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible de charger la signature.",
      },
      {
        status:
          error instanceof Error && error.message.includes("Accès refusé")
            ? 403
            : 400,
      }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();

  if (!session || !hasPermission(session, "signature_update")) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const body = (await request.json()) as {
      userId?: string;
      signatureCount?: number;
      signedAt?: string;
    };
    const payload = await updateSignatureLog(session, id, body);

    if (!payload) {
      return NextResponse.json(
        { error: "Signature introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible de mettre à jour la signature.",
      },
      {
        status:
          error instanceof Error && error.message.includes("Accès refusé")
            ? 403
            : 400,
      }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();

  if (!session || !hasPermission(session, "signature_update")) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const deleted = await deleteSignatureLog(session, id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Signature introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer la signature.",
      },
      {
        status:
          error instanceof Error && error.message.includes("Accès refusé")
            ? 403
            : 400,
      }
    );
  }
}
