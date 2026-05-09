import { NextResponse } from "next/server";
import type { Role } from "@/generated/prisma/enums";
import { canAccessPlatform } from "@/lib/authz";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";

const ALLOWED_ROLES: Role[] = [
  "admin",
  "leader_envoi",
  "leader_piste",
  "leader_retrait",
  "agent",
  "convoyeur",
];

function isAllowedRole(role: string): role is Role {
  return ALLOWED_ROLES.includes(role as Role);
}

export async function GET() {
  const session = await getServerSession();

  if (!session || !canAccessPlatform(session.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      username: true,
      role: true,
      phone: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session || !canAccessPlatform(session.role)) {
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
        { status: 400 },
      );
    }

    if (!isAllowedRole(role)) {
      return NextResponse.json({ error: "Rôle invalide." }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères." },
        { status: 400 },
      );
    }

    const user = await prisma.user.create({
      data: {
        fullName,
        username,
        role,
        phone,
        password: hashPassword(password),
        isActive,
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Ce nom utilisateur existe déjà." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Impossible de créer le personnel." },
      { status: 500 },
    );
  }
}
