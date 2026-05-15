import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSessionToken,
  getServerSession,
  getSessionCookieName,
  getSessionTtlSeconds,
} from "@/lib/session";

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
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
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
    }

    if (session.systemRole !== "super_admin") {
      return NextResponse.json({ error: "Acces refuse." }, { status: 403 });
    }

    const token = createSessionToken({
      userId: session.userId,
      username: session.username,
      systemRole: session.systemRole,
      activeAgencyId: membership.agencyId,
      permissions: session.permissions,
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
      activeAgencyId: membership.agencyId,
    });
  } catch {
    return NextResponse.json(
      { error: "Charge utile invalide." },
      { status: 400 }
    );
  }
}
