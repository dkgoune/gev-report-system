import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

function normalizeCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export async function GET() {
  const session = await getServerSession();

  if (!session || (!isSuperAdmin(session) && !hasPermission(session, "user_create", "user_update"))) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const agencies = await prisma.agency.findMany({
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      code: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    agencies: agencies.map(agency => ({
      ...agency,
      createdAt: agency.createdAt.toISOString(),
      updatedAt: agency.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session || !isSuperAdmin(session)) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<{
      name: string;
      code: string;
      isActive: boolean;
    }>;

    const name = body.name?.trim();
    const generatedCode = normalizeCode(body.code || body.name || "");

    if (!name || !generatedCode) {
      return NextResponse.json(
        { error: "Le nom et le code de l'agence sont obligatoires." },
        { status: 400 }
      );
    }

    const agency = await prisma.$transaction(async tx => {
      const createdAgency = await tx.agency.create({
        data: {
          name,
          code: generatedCode,
          isActive: body.isActive ?? true,
        },
        select: {
          id: true,
          name: true,
          code: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const superAdmins = await tx.user.findMany({
        where: {
          systemRole: "super_admin",
        },
        select: {
          id: true,
        },
      });

      if (superAdmins.length > 0) {
        await tx.userAgencyMembership.createMany({
          data: superAdmins.map(user => ({
            userId: user.id,
            agencyId: createdAgency.id,
            isActive: true,
          })),
          skipDuplicates: true,
        });
      }

      return createdAgency;
    });

    return NextResponse.json(
      {
        ok: true,
        agency: {
          ...agency,
          createdAt: agency.createdAt.toISOString(),
          updatedAt: agency.updatedAt.toISOString(),
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
        { error: "Une agence avec ce nom ou ce code existe deja." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Impossible de creer l'agence." },
      { status: 500 }
    );
  }
}
