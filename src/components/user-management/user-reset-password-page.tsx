"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PasswordResetForm } from "./password-reset-form";

type UserResetPasswordPageProps = {
  userId: string;
  userFullName: string;
};

export function UserResetPasswordPage({
  userId,
  userFullName,
}: UserResetPasswordPageProps) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  async function onResetPassword() {
    if (newPassword.length < 6) {
      setResetError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError("Les mots de passe ne correspondent pas.");
      return;
    }

    setResetting(true);
    setResetError(null);

    const response = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      setResetError(
        payload?.error || "Impossible de réinitialiser le mot de passe."
      );
      setResetting(false);
      return;
    }

    toast.success("Mot de passe réinitialisé avec succès.");
    router.push("/users");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Réinitialiser le mot de passe
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Définissez un nouveau mot de passe pour le compte sélectionné.
          </p>
        </div>

        <Button asChild variant="outline">
          <Link href="/users">Retour a la liste</Link>
        </Button>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <PasswordResetForm
          userFullName={userFullName}
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          resetError={resetError}
          resetting={resetting}
          onNewPasswordChange={setNewPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onConfirm={onResetPassword}
          onCancel={() => router.push("/users")}
        />
      </section>
    </div>
  );
}
