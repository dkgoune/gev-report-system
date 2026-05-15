"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ReportMarkReadButtonProps = {
  disabled?: boolean;
  reportId: string;
};

export function ReportMarkReadButton({
  disabled = false,
  reportId,
}: ReportMarkReadButtonProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleMarkAsRead() {
    setSubmitting(true);

    const response = await fetch(`/api/reports/general/${reportId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markRead" }),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(
        payload?.error || "Impossible de marquer le rapport comme lu."
      );
      setSubmitting(false);
      return;
    }

    toast.success("Rapport marqué comme lu.");
    setSubmitting(false);
    router.refresh();
  }

  return (
    <Button
      type="button"
      disabled={disabled || submitting}
      onClick={handleMarkAsRead}
      className="print:hidden"
    >
      {submitting ? "Mise à jour..." : "Marquer comme lu"}
    </Button>
  );
}
