import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";

function normalizeCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export async function GET() {
  const session = await getServerSession();

  if (
    !session ||
    !hasPermission(
      session,
      "post_read",
      "post_create",
      "post_update",
      "post_delete"
    )
  ) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  const posts = await prisma.workPost.findMany({
    where: {
      agencyId: session.activeAgencyId,
    },
    orderBy: [{ isActive: "desc" }, { order: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      isActive: true,
      order: true,
      serviceId: true,
      service: {
        select: {
          id: true,
          name: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({
    posts: posts.map(post => ({
      ...post,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const session = await getServerSession();

  if (!session || !hasPermission(session, "post_create")) {
    return NextResponse.json({ error: "Non autorise." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<{
      name: string;
      code: string;
      description: string;
      isActive: boolean;
      order: number;
      serviceId?: string | null;
    }>;

    const name = body.name?.trim();
    const generatedCode = normalizeCode(body.code || body.name || "");
    const description = body.description?.trim() || null;
    const serviceId = body.serviceId || null;

    if (!name || !generatedCode) {
      return NextResponse.json(
        { error: "Le nom et le code du poste sont obligatoires." },
        { status: 400 }
      );
    }

    if (serviceId) {
      const service = await prisma.serviceDefinition.findFirst({
        where: {
          id: serviceId,
          agencyId: session.activeAgencyId,
          isActive: true,
        },
        select: { id: true },
      });
      if (!service) {
        return NextResponse.json(
          { error: "Service associé invalide ou inactif." },
          { status: 400 }
        );
      }
    }

    const post = await prisma.workPost.create({
      data: {
        agencyId: session.activeAgencyId,
        name,
        code: generatedCode,
        description,
        isActive: body.isActive ?? true,
        order: body.order ?? 0,
        serviceId,
        createdById: session.userId,
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        isActive: true,
        order: true,
        serviceId: true,
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        post: {
          ...post,
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Impossible de creer le poste." },
      { status: 500 }
    );
  }
}
