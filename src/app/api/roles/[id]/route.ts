import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission, parseUserPermissions } from "@/lib/permissions";
import type { UserPermission } from "@/generated/prisma/enums";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const role = await prisma.role.findUnique({
      where: { id },
    });

    if (!role || role.agencyId !== session.activeAgencyId) {
      return NextResponse.json({ error: "Rôle non trouvé." }, { status: 404 });
    }

    return NextResponse.json({ role });
  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json(
      { error: "Impossible de récupérer le rôle." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getServerSession();

  if (!session || !hasPermission(session, "user_manage_permissions")) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = (await request.json()) as Partial<{
      name: string;
      description: string;
      permissions: string[];
      isActive: boolean;
    }>;

    const name = body.name?.trim();
    const description = body.description !== undefined ? body.description?.trim() || null : undefined;
    const permissionsInput = body.permissions;
    const isActive = body.isActive;

    const existingRole = await prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole || existingRole.agencyId !== session.activeAgencyId) {
      return NextResponse.json({ error: "Rôle non trouvé." }, { status: 404 });
    }

    const dataToUpdate: {
      name?: string;
      description?: string | null;
      permissions?: UserPermission[];
      isActive?: boolean;
    } = {};

    if (name !== undefined) {
      if (!name) {
        return NextResponse.json(
          { error: "Le nom du rôle ne peut pas être vide." },
          { status: 400 }
        );
      }

      if (name.toLowerCase() !== existingRole.name.toLowerCase()) {
        const duplicate = await prisma.role.findFirst({
          where: {
            agencyId: session.activeAgencyId,
            name: {
              equals: name,
              mode: "insensitive",
            },
            id: { not: id },
          },
        });

        if (duplicate) {
          return NextResponse.json(
            { error: "Un rôle avec ce nom existe déjà." },
            { status: 400 }
          );
        }
      }
      dataToUpdate.name = name;
    }

    if (description !== undefined) {
      dataToUpdate.description = description;
    }

    if (permissionsInput !== undefined) {
      const { permissions, invalid } = parseUserPermissions(permissionsInput);
      if (invalid.length > 0) {
        return NextResponse.json(
          { error: `Certaines permissions sont invalides : ${invalid.join(", ")}` },
          { status: 400 }
        );
      }
      dataToUpdate.permissions = permissions;
    }

    if (isActive !== undefined) {
      dataToUpdate.isActive = isActive;
    }

    const updatedRole = await prisma.role.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ ok: true, role: updatedRole });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Impossible de mettre à jour le rôle." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const session = await getServerSession();

  if (!session || !hasPermission(session, "user_manage_permissions")) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const existingRole = await prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole || existingRole.agencyId !== session.activeAgencyId) {
      return NextResponse.json({ error: "Rôle non trouvé." }, { status: 404 });
    }

    // Optionally check if the role is currently assigned to users in this agency
    const activeAssignmentsCount = await prisma.userAgencyMembership.count({
      where: {
        agencyId: session.activeAgencyId,
        roles: {
          some: { id },
        },
      },
    });

    if (activeAssignmentsCount > 0) {
      return NextResponse.json(
        {
          error: "Ce rôle est actuellement attribué à un ou plusieurs personnels. Retirez-le d'abord pour pouvoir le supprimer.",
        },
        { status: 400 }
      );
    }

    await prisma.role.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true, message: "Rôle supprimé avec succès." });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: "Impossible de supprimer le rôle." },
      { status: 500 }
    );
  }
}
