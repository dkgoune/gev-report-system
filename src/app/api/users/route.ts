import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

export async function GET() {
  const session = await getServerSession();

  if (
    !session ||
    !hasPermission(
      session,
      "user_create",
      "user_read",
      "user_update",
      "user_delete"
    )
  ) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: {
      memberships: {
        some: {
          agencyId: session.activeAgencyId,
          isActive: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      username: true,
      phone: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      memberships: {
        where: {
          agencyId: session.activeAgencyId,
        },
        select: {
          isActive: true,
          roles: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({
    users: users.map(user => ({
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      membershipActive: user.memberships[0]?.isActive ?? false,
      roles: user.memberships[0]?.roles ?? [],
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (
    !session ||
    !hasPermission(session, "user_create", "user_update", "user_delete")
  ) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<{
      fullName: string;
      username: string;
      phone: string;
      password: string;
      isActive: boolean;
      memberships: Array<{
        agencyId: string;
        isActive: boolean;
        roleIds: string[];
      }>;
    }>;

    const fullName = body.fullName?.trim();
    const username = body.username?.trim();
    const password = body.password;
    const phone = body.phone?.trim() || null;
    const isActive = body.isActive ?? true;
    const membershipsInput = body.memberships || [];

    if (!fullName || !username || !password) {
      return NextResponse.json(
        {
          error:
            "Nom complet, nom utilisateur et mot de passe sont obligatoires.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères." },
        { status: 400 }
      );
    }

    // Check if username is used
    const isUsernameIsUsed = await prisma.user.findFirst({
      where: { username: { equals: username, mode: "insensitive" } },
      select: { id: true },
    });
    if (isUsernameIsUsed) {
      return NextResponse.json(
        { error: "Ce nom utilisateur est déjà utilisé." },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        fullName,
        username,
        phone,
        password: hashPassword(password),
        isActive,
        memberships: {
          create: membershipsInput.map(m => ({
            agencyId: m.agencyId,
            isActive: m.isActive,
            roles: {
              connect: (m.roleIds || []).map(id => ({ id })),
            },
          })),
        },
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          where: {
            agencyId: session.activeAgencyId,
          },
          select: {
            isActive: true,
            roles: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: user.id,
          fullName: user.fullName,
          username: user.username,
          membershipActive: user.memberships[0]?.isActive ?? false,
          roles: user.memberships[0]?.roles ?? [],
          phone: user.phone,
          isActive: user.isActive,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
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
        { error: "Ce nom utilisateur existe déjà." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Impossible de créer le personnel." },
      { status: 500 }
    );
  }
}
