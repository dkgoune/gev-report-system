import { NextResponse } from "next/server";
import { createSignatureLog, listSignatureLogs } from "@/lib/signature-logs";
import { getServerSession } from "@/lib/session";

export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const payload = await listSignatureLogs(session, {
      from: searchParams.get("from") || undefined,
      page: searchParams.get("page") || undefined,
      pageSize: searchParams.get("pageSize") || undefined,
      q: searchParams.get("q") || undefined,
      to: searchParams.get("to") || undefined,
      userId: searchParams.get("userId") || undefined,
    });

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible de charger les signatures.",
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

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      userId?: string;
      signatureCount?: number;
      signedAt?: string;
    };
    const payload = await createSignatureLog(session, body);
    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer la signature.",
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
