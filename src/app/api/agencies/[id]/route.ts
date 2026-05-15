import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

function normalizeCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession();

  if (!session || !isSuperAdmin(session)) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as Partial<{
      name: string;
      code: string;
      isActive: boolean;
    }>;

    const nextName =
      typeof body.name === "string" ? body.name.trim() : undefined;
    const nextCode =
      typeof body.code === "string" ? normalizeCode(body.code) : undefined;

    if (typeof body.name === "string" && !nextName) {
      return NextResponse.json(
        { error: "Le nom de l'agence est obligatoire." },
        { status: 400 }
      );
    }

    if (typeof body.code === "string" && !nextCode) {
      return NextResponse.json(
        { error: "Le code de l'agence est obligatoire." },
        { status: 400 }
      );
    }

    const agency = await prisma.agency.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!agency) {
      return NextResponse.json(
        { error: "Agence introuvable." },
        { status: 404 }
      );
    }

    await prisma.agency.update({
      where: { id },
      data: {
        ...(typeof nextName === "string" ? { name: nextName } : {}),
        ...(typeof nextCode === "string" ? { code: nextCode } : {}),
        ...(typeof body.isActive === "boolean"
          ? { isActive: body.isActive }
          : {}),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Une agence avec ce nom ou ce code existe deja." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Impossible de mettre a jour l'agence." },
      { status: 500 }
    );
  }
}
