import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession();

  if (
    !session ||
    !hasPermission(session, "user_create", "user_update", "user_delete")
  ) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as Partial<{
      fullName: string;
      username: string;
      phone: string | null;
      password: string;
      isActive: boolean;
      memberships: Array<{
        agencyId: string;
        isActive: boolean;
        roleIds: string[];
      }>;
    }>;

    const payload: {
      fullName?: string;
      username?: string;
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

      // Check if username is used by another user
      const isUsernameIsUsed = await prisma.user.findFirst({
        where: {
          username: { equals: username, mode: "insensitive" },
          id: { not: id },
        },
        select: { id: true },
      });
      if (isUsernameIsUsed) {
        return NextResponse.json(
          { error: "Ce nom utilisateur est déjà utilisé." },
          { status: 409 }
        );
      }
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

    const membershipsProvided = body.memberships !== undefined;
    const membershipsInput = body.memberships || [];

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
        systemRole: true,
        isActive: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Personnel introuvable." },
        { status: 404 }
      );
    }

    // Cannot update super admin
    if (currentUser.systemRole === "super_admin") {
      return NextResponse.json(
        { error: "Impossible de mettre à jour cet utilisateur." },
        { status: 400 }
      );
    }

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

    const updatedUser = await prisma.$transaction(async tx => {
      const updated = await tx.user.update({
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
      });

      if (membershipsProvided) {
        // Delete all current memberships for this user
        await tx.userAgencyMembership.deleteMany({
          where: { userId: id },
        });

        // Recreate memberships with their correct roles
        for (const m of membershipsInput) {
          await tx.userAgencyMembership.create({
            data: {
              userId: id,
              agencyId: m.agencyId,
              isActive: m.isActive,
              roles: {
                connect: (m.roleIds || []).map(roleId => ({ id: roleId })),
              },
            },
          });
        }
      }

      return updated;
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        username: updatedUser.username,
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

  if (!session || !hasPermission(session, "user_delete")) {
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
        systemRole: true,
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

    // Cannot delete super admin
    if (currentUser.systemRole === "super_admin") {
      return NextResponse.json(
        { error: "Impossible de supprimer cet utilisateur." },
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
