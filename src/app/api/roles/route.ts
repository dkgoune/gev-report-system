import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission, parseUserPermissions } from "@/lib/permissions";

export async function GET(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";

  try {
    const roles = await prisma.role.findMany({
      where: {
        ...(all ? {} : { agencyId: session.activeAgencyId }),
        isActive: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ roles });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer les rôles." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session || !hasPermission(session, "user_manage_permissions")) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<{
      name: string;
      description: string;
      permissions: string[];
    }>;

    const name = body.name?.trim();
    const description = body.description?.trim() || null;
    const permissionsInput = body.permissions || [];

    if (!name) {
      return NextResponse.json(
        { error: "Le nom du rôle est obligatoire." },
        { status: 400 }
      );
    }

    const { permissions, invalid } = parseUserPermissions(permissionsInput);
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Certaines permissions sont invalides : ${invalid.join(", ")}` },
        { status: 400 }
      );
    }

    // Check if role name already exists in this agency
    const existing = await prisma.role.findFirst({
      where: {
        agencyId: session.activeAgencyId,
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Un rôle avec ce nom existe déjà dans cette agence." },
        { status: 400 }
      );
    }

    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions,
        agencyId: session.activeAgencyId,
        createdById: session.userId,
      },
    });

    return NextResponse.json({ ok: true, role }, { status: 201 });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { error: "Impossible de créer le rôle." },
      { status: 500 }
    );
  }
}

