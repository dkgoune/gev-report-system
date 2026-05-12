"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onLogout() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/auth/login");
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={onLogout} disabled={pending}>
      {pending ? "Déconnexion en cours..." : "Se déconnecter"}
    </Button>
  );
}
