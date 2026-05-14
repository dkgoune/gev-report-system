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

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession();

  if (!session || !canAccessAgencyAdminWorkspace(session)) {
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
      role?: MembershipRole;
      phone?: string | null;
      password?: string;
      isActive?: boolean;
    } = {};

    if (typeof body.fullName === "string") {
      const fullName = body.fullName.trim();
      if (!fullName) {
        return NextResponse.json(
          { error: "Le nom complet ne peut pas être vide." },
          { status: 400 }
        );
      }
      payload.fullName = fullName;
    }

    if (typeof body.username === "string") {
      const username = body.username.trim();
      if (!username) {
        return NextResponse.json(
          { error: "Le nom utilisateur ne peut pas être vide." },
          { status: 400 }
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
      if (body.password.length < 6) {
        return NextResponse.json(
          { error: "Le mot de passe doit contenir au moins 6 caractères." },
          { status: 400 }
        );
      }
      payload.password = hashPassword(body.password);
    }

    if (Object.keys(payload).length === 0) {
      return NextResponse.json(
        { error: "Aucune modification détectée." },
        { status: 400 }
      );
    }

    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        memberships: {
          where: {
            agencyId: session.activeAgencyId,
            isActive: true,
          },
          select: {
            id: true,
            role: true,
          },
        },
      },
    });

    if (!currentUser || currentUser.memberships.length === 0) {
      return NextResponse.json(
        { error: "Personnel introuvable." },
        { status: 404 }
      );
    }

    const membership = currentUser.memberships[0];

    const userData: {
      fullName?: string;
      username?: string;
      phone?: string | null;
      password?: string;
      isActive?: boolean;
    } = {
      fullName: payload.fullName,
      username: payload.username,
      phone: payload.phone,
      password: payload.password,
      isActive: payload.isActive,
    };

    const [updatedUser, updatedMembership] = await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: userData,
        select: {
          id: true,
          fullName: true,
          username: true,
          phone: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      payload.role
        ? prisma.userAgencyMembership.update({
            where: {
              id: membership.id,
            },
            data: {
              role: payload.role,
            },
            select: {
              role: true,
              isActive: true,
            },
          })
        : prisma.userAgencyMembership.findUniqueOrThrow({
            where: {
              id: membership.id,
            },
            select: {
              role: true,
              isActive: true,
            },
          }),
    ]);

    return NextResponse.json({
      ok: true,
      user: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        username: updatedUser.username,
        role: updatedMembership.role,
        membershipActive: updatedMembership.isActive,
        phone: updatedUser.phone,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt.toISOString(),
        updatedAt: updatedUser.updatedAt.toISOString(),
      },
    });
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

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Personnel introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Impossible de mettre à jour le personnel." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await getServerSession();

  if (!session || !canAccessAgencyAdminWorkspace(session)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  if (session.userId === id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas supprimer votre propre compte." },
      { status: 400 }
    );
  }

  try {
    const currentUser = await prisma.user.findFirst({
      where: {
        id,
        memberships: {
          some: {
            agencyId: session.activeAgencyId,
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        isActive: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Personnel introuvable." },
        { status: 404 }
      );
    }

    if (!currentUser.isActive) {
      return NextResponse.json(
        { error: "Ce personnel est déjà inactif." },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
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
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Personnel introuvable." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: "Impossible de désactiver ce personnel.",
      },
      { status: 500 }
    );
  }
}
