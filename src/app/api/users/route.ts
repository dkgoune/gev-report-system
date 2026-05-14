import { NextResponse } from "next/server";
import type { MembershipRole } from "@/generated/prisma/enums";
import { canAccessAgencyAdminWorkspace } from "@/lib/authz";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

const ALLOWED_ROLES: MembershipRole[] = [
  "admin",
  "scheduler",
  "reporter",
  "worker",
];

function isAllowedRole(role: string): role is MembershipRole {
  return ALLOWED_ROLES.includes(role as MembershipRole);
}

export async function GET() {
  const session = await getServerSession();

  if (!session || !canAccessAgencyAdminWorkspace(session)) {
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
          role: true,
          isActive: true,
        },
      },
    },
  });

  return NextResponse.json({
    users: users.map(user => ({
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      role: user.memberships[0]?.role ?? "worker",
      membershipActive: user.memberships[0]?.isActive ?? false,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session || !canAccessAgencyAdminWorkspace(session)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<{
      fullName: string;
      username: string;
      role: string;
      phone: string;
      password: string;
      isActive: boolean;
    }>;

    const fullName = body.fullName?.trim();
    const username = body.username?.trim();
    const role = body.role?.trim();
    const password = body.password;
    const phone = body.phone?.trim() || null;
    const isActive = body.isActive ?? true;

    if (!fullName || !username || !role || !password) {
      return NextResponse.json(
        {
          error:
            "Nom complet, nom utilisateur, rôle et mot de passe sont obligatoires.",
        },
        { status: 400 }
      );
    }

    if (!isAllowedRole(role)) {
      return NextResponse.json({ error: "Rôle invalide." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères." },
        { status: 400 }
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
          create: {
            agencyId: session.activeAgencyId,
            role,
            isActive: true,
          },
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
            role: true,
            isActive: true,
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
          role: user.memberships[0]?.role ?? "worker",
          membershipActive: user.memberships[0]?.isActive ?? false,
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
