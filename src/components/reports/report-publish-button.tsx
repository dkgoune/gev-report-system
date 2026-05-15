"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ReportPublishButtonProps = {
  reportId: string;
  disabled?: boolean;
};

export function ReportPublishButton({
  reportId,
  disabled = false,
}: ReportPublishButtonProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handlePublish() {
    const confirmed = window.confirm(
      "Publier ce rapport ? Après publication, il ne sera plus modifiable."
    );

    if (!confirmed) {
      return;
    }

    setSubmitting(true);

    const response = await fetch(`/api/reports/general/${reportId}/publish`, {
      method: "POST",
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      alreadyPublished?: boolean;
      appliedEvaluations?: number;
      skippedEvaluations?: number;
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible de publier le rapport.");
      setSubmitting(false);
      return;
    }

    if (payload?.alreadyPublished) {
      toast.success("Le rapport est déjà publié.");
    } else {
      toast.success(
        `Rapport publié. Evaluations appliquées: ${payload?.appliedEvaluations ?? 0}.`
      );
    }

    setSubmitting(false);
    router.refresh();
  }

  return (
    <Button
      type="button"
      disabled={disabled || submitting}
      onClick={handlePublish}
    >
      {submitting ? "Publication..." : "Publier"}
    </Button>
  );
}
