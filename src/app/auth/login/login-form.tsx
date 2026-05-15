"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type LoginState = {
  loading: boolean;
  error: string | null;
};

type LoginFormProps = {
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const [state, setState] = useState<LoginState>({
    loading: false,
    error: null,
  });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "");

    if (!username || !password) {
      setState({
        loading: false,
        error: "Veuillez entrer le nom d'utilisateur et le mot de passe.",
      });
      return;
    }

    setState({ loading: true, error: null });

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;
      setState({
        loading: false,
        error: payload?.error || "L'authentification a échoué.",
      });
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} method="POST">
      <div className="space-y-2">
        <label htmlFor="username" className="block text-sm font-medium">
          Nom d&apos;utilisateur
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          className="w-full px-3 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="w-full px-3 py-2 border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>

      {state.error ? (
        <p className="text-sm text-red-600 mt-2">{state.error}</p>
      ) : null}

      <Button type="submit" disabled={state.loading} className="w-full">
        {state.loading ? "Connexion en cours..." : "Se connecter"}
      </Button>
    </form>
  );
}
