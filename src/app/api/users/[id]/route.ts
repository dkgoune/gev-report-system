import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission, parseUserPermissions } from "@/lib/permissions";

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
      permissions: string[];
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

    const permissionsProvided = body.permissions !== undefined;
    const { permissions: parsedPermissions, invalid } = parseUserPermissions(
      body.permissions
    );

    const requestedPermissions = hasPermission(
      session,
      "user_manage_permissions"
    )
      ? parsedPermissions
      : []; // Only consider permissions if user has management rights

    if (invalid.length > 0) {
      return NextResponse.json(
        {
          error: "Une ou plusieurs permissions sont invalides.",
        },
        { status: 400 }
      );
    }

    const assignedPermissions =
      session.systemRole === "super_admin"
        ? requestedPermissions
        : requestedPermissions.filter(permission =>
            session.permissions.includes(permission)
          );

    if (
      permissionsProvided &&
      assignedPermissions.length !== requestedPermissions.length
    ) {
      return NextResponse.json(
        {
          error:
            "Vous ne pouvez attribuer que des permissions dont vous disposez.",
        },
        { status: 403 }
      );
    }

    if (Object.keys(payload).length === 0 && !permissionsProvided) {
      return NextResponse.json(
        { error: "Aucune modification détectée." },
        { status: 400 }
      );
    }

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

      if (permissionsProvided) {
        await tx.userPermissionRule.deleteMany({
          where: {
            userId: id,
            agencyId: session.activeAgencyId,
          },
        });

        if (assignedPermissions.length > 0) {
          await tx.userPermissionRule.createMany({
            data: assignedPermissions.map(permission => ({
              userId: id,
              agencyId: session.activeAgencyId,
              permission,
              isEnabled: true,
              createdById: session.userId,
            })),
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
