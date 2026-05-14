"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type DuplicateNextWeekButtonProps = {
  scheduleId: string;
  workDateIso: string;
};

function plusDays(dateIso: string, days: number) {
  const date = new Date(dateIso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function DuplicateNextWeekButton({
  scheduleId,
  workDateIso,
}: DuplicateNextWeekButtonProps) {
  const [loading, setLoading] = useState(false);

  async function onDuplicate() {
    const targetDate = plusDays(workDateIso, 7);
    setLoading(true);

    const response = await fetch(
      `/api/work-schedules/${scheduleId}/duplicate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workDate: targetDate }),
      }
    );

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(
        payload?.error || "Impossible de dupliquer sur la semaine suivante."
      );
      setLoading(false);
      return;
    }

    toast.success("Planning duplique sur la semaine suivante.");
    setLoading(false);
    window.location.reload();
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void onDuplicate()}
      disabled={loading}
    >
      {loading ? "Duplication..." : "Dupliquer +7 jours"}
    </Button>
  );
}
