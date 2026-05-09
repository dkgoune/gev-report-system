import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionTtlSeconds,
} from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<{
      username: string;
      password: string;
    }>;
    const username = body.username?.trim();
    const password = body.password;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Le nom d'utilisateur et le mot de passe sont obligatoires." },
        { status: 400 },
      );
    }

    const user = await authenticateUser(username, password);

    if (!user) {
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 },
      );
    }

    const token = createSessionToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    const cookieStore = await cookies();
    cookieStore.set(getSessionCookieName(), token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: getSessionTtlSeconds(),
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Charge utile de requête invalide." },
      { status: 400 },
    );
  }
}
