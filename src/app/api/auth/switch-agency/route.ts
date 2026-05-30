import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserPermission } from "@/generated/prisma/enums";
import {
  createSessionToken,
  getServerSession,
  getSessionCookieName,
  getSessionTtlSeconds,
} from "@/lib/session";

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<{ agencyId: string }>;
    const agencyId = body.agencyId?.trim();

    if (!agencyId) {
      return NextResponse.json(
        { error: "Identifiant agence invalide." },
        { status: 400 }
      );
    }

    let targetAgencyId: string;
    let permissions: UserPermission[];

    if (session.systemRole === "super_admin") {
      const agency = await prisma.agency.findFirst({
        where: { id: agencyId, isActive: true },
        select: { id: true },
      });
      if (!agency) {
        return NextResponse.json(
          { error: "Agence introuvable ou inactive." },
          { status: 404 }
        );
      }
      targetAgencyId = agency.id;
      permissions = Object.values(UserPermission);
    } else {
      const membership = await prisma.userAgencyMembership.findFirst({
        where: {
          userId: session.userId,
          agencyId,
          isActive: true,
          agency: {
            isActive: true,
          },
        },
        select: {
          agencyId: true,
          roles: {
            where: { isActive: true },
            select: {
              permissions: true,
            },
          },
        },
      });

      if (!membership) {
        return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
      }
      targetAgencyId = membership.agencyId;

      const uniquePermissions = new Set<UserPermission>();
      if (membership.roles) {
        for (const role of membership.roles) {
          if (role.permissions) {
            for (const permission of role.permissions) {
              uniquePermissions.add(permission);
            }
          }
        }
      }
      permissions = Array.from(uniquePermissions);
    }

    const token = createSessionToken({
      userId: session.userId,
      username: session.username,
      systemRole: session.systemRole,
      activeAgencyId: targetAgencyId,
      permissions,
    });

    const cookieStore = await cookies();
    cookieStore.set(getSessionCookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: getSessionTtlSeconds(),
    });

    return NextResponse.json({
      ok: true,
      activeAgencyId: targetAgencyId,
    });
  } catch (error) {
    console.error("Error switching agency:", error);
    return NextResponse.json(
      { error: "Impossible de changer d'agence." },
      { status: 500 }
    );
  }
}
