import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import {
  getServerSession,
  createSessionToken,
  getSessionCookieName,
  getSessionTtlSeconds,
} from "@/lib/session";

export async function PATCH(request: Request) {
  const session = await getServerSession();

  if (!session) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const rootUsername = process.env.ROOT_USERNAME || "root";
  if (session.username.toLowerCase() === rootUsername.toLowerCase()) {
    return NextResponse.json(
      { error: "La modification du profil du super utilisateur principal est interdite." },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json()) as Partial<{
      fullName: string;
      username: string;
      phone: string | null;
      oldPassword?: string;
      newPassword?: string;
    }>;

    const payload: {
      fullName?: string;
      username?: string;
      phone?: string | null;
      password?: string;
    } = {};

    // Validate full name
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

    // Validate username
    if (typeof body.username === "string") {
      const username = body.username.trim();
      if (!username) {
        return NextResponse.json(
          { error: "Le nom d'utilisateur ne peut pas être vide." },
          { status: 400 }
        );
      }
      payload.username = username;

      // Check if username is used by another user
      const isUsernameUsed = await prisma.user.findFirst({
        where: {
          username: { equals: username, mode: "insensitive" },
          id: { not: session.userId },
        },
        select: { id: true },
      });
      if (isUsernameUsed) {
        return NextResponse.json(
          { error: "Ce nom d'utilisateur est déjà utilisé." },
          { status: 409 }
        );
      }
    }

    // Phone number
    if (body.phone !== undefined) {
      payload.phone = body.phone ? body.phone.trim() : null;
    }

    // Password change logic
    if (body.newPassword) {
      const newPassword = body.newPassword;
      const oldPassword = body.oldPassword;

      if (!oldPassword) {
        return NextResponse.json(
          { error: "Vous devez confirmer votre ancien mot de passe." },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "Le nouveau mot de passe doit contenir au moins 6 caractères." },
          { status: 400 }
        );
      }

      // Fetch user to verify old password
      const dbUser = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { password: true },
      });

      if (!dbUser) {
        return NextResponse.json(
          { error: "Utilisateur introuvable." },
          { status: 404 }
        );
      }

      const isOldPasswordCorrect = verifyPassword(oldPassword, dbUser.password);
      if (!isOldPasswordCorrect) {
        return NextResponse.json(
          { error: "L'ancien mot de passe est incorrect." },
          { status: 400 }
        );
      }

      payload.password = hashPassword(newPassword);
    }

    // Update in database
    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: payload,
      select: {
        id: true,
        fullName: true,
        username: true,
        phone: true,
      },
    });

    // Recreate session cookie if username changed
    if (typeof body.username === "string" && body.username.trim() !== session.username) {
      const token = createSessionToken({
        userId: session.userId,
        username: updatedUser.username,
        systemRole: session.systemRole,
        activeAgencyId: session.activeAgencyId,
        permissions: session.permissions,
      });

      const cookieStore = await cookies();
      cookieStore.set(getSessionCookieName(), token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: getSessionTtlSeconds(),
        path: "/",
      });
    }

    return NextResponse.json({
      ok: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Impossible de mettre à jour le profil." },
      { status: 500 }
    );
  }
}
