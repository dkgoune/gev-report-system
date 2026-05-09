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

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession();

  if (!session || !canAccessPlatform(session.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as Partial<{
      fullName: string;
      username: string;
      role: string;
      phone: string | null;
      password: string;
      isActive: boolean;
    }>;

    const payload: {
      fullName?: string;
      username?: string;
      role?: Role;
      phone?: string | null;
      password?: string;
      isActive?: boolean;
    } = {};

    if (typeof body.fullName === "string") {
      const fullName = body.fullName.trim();
      if (!fullName) {
        return NextResponse.json(
          { error: "Le nom complet ne peut pas être vide." },
          { status: 400 },
        );
      }
      payload.fullName = fullName;
    }

    if (typeof body.username === "string") {
      const username = body.username.trim();
      if (!username) {
        return NextResponse.json(
          { error: "Le nom utilisateur ne peut pas être vide." },
          { status: 400 },
        );
      }
      payload.username = username;
    }

    if (typeof body.role === "string") {
      const role = body.role.trim();
      if (!isAllowedRole(role)) {
        return NextResponse.json({ error: "Rôle invalide." }, { status: 400 });
      }
      payload.role = role;
    }

    if (typeof body.isActive === "boolean") {
      payload.isActive = body.isActive;
    }

    if (body.phone !== undefined) {
      payload.phone = body.phone ? body.phone.trim() : null;
    }

    if (typeof body.password === "string" && body.password.length > 0) {
      if (session.role !== "admin") {
        return NextResponse.json(
          {
            error:
              "Seul un administrateur peut réinitialiser les mots de passe.",
          },
          { status: 403 },
        );
      }
      if (body.password.length < 6) {
        return NextResponse.json(
          { error: "Le mot de passe doit contenir au moins 6 caractères." },
          { status: 400 },
        );
      }
      payload.password = hashPassword(body.password);
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: "Aucune modification détectée." },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: payload,
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

    return NextResponse.json({ ok: true, user });
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

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Personnel introuvable." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Impossible de mettre à jour le personnel." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getServerSession();

  if (!session || !canAccessPlatform(session.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  if (session.userId === id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas supprimer votre propre compte." },
      { status: 400 },
    );
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Personnel introuvable." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        error:
          "Suppression impossible. Ce personnel est peut-être déjà lié à des rapports ou évaluations.",
      },
      { status: 409 },
    );
  }
}
