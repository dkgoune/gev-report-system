"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type MarkReportReadButtonProps = {
  reportId: string;
};

export function MarkReportReadButton({ reportId }: MarkReportReadButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onClick() {
    setIsSubmitting(true);

    const response = await fetch(`/api/daily-reports/${reportId}`, {
      method: "PATCH",
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(
        payload?.error || "Impossible de marquer le rapport comme lu.",
      );
      setIsSubmitting(false);
      return;
    }

    toast.success("Rapport marqué comme lu.");
    startTransition(() => {
      router.refresh();
    });
    setIsSubmitting(false);
  }

  return (
    <Button onClick={onClick} disabled={isSubmitting || isPending}>
      {isSubmitting || isPending ? "Mise à jour..." : "Marquer comme lu"}
    </Button>
  );
}
