"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { WorkScheduleServiceOption } from "./types";

type WorkScheduleNewFormProps = {
  services: WorkScheduleServiceOption[];
};

type FormState = {
  serviceId: string;
  workDate: string;
  status: "draft" | "published";
};

export function WorkScheduleNewForm({ services }: WorkScheduleNewFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<FormState>({
    serviceId: services[0]?.id ?? "",
    workDate: "",
    status: "draft",
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.workDate < today) {
      toast.error("La date de travail ne peut pas etre dans le passe.");
      return;
    }

    setSubmitting(true);

    const response = await fetch("/api/work-schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      schedule?: { id: string };
    } | null;

    if (!response.ok) {
      toast.error(payload?.error || "Impossible de creer le planning.");
      setSubmitting(false);
      return;
    }

    toast.success("Planning cree.");
    setSubmitting(false);

    if (payload?.schedule?.id) {
      router.push(`/work-schedules/${payload.schedule.id}`);
      router.refresh();
      return;
    }

    router.push("/work-schedules/list");
    router.refresh();
  }

  return (
    <form className="grid gap-4 md:grid-cols-3" onSubmit={onSubmit}>
      <label className="space-y-1 text-sm">
        <span className="font-medium text-slate-700">Service</span>
        <select
          value={form.serviceId}
          onChange={event =>
            setForm(current => ({
              ...current,
              serviceId: event.target.value,
            }))
          }
          className="w-full border border-slate-300 bg-white px-3 py-2"
          required
        >
          <option value="">Selectionner un service</option>
          {services.map(service => (
            <option key={service.id} value={service.id}>
              {service.name} ({service.code})
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-1 text-sm">
        <span className="font-medium text-slate-700">Date de travail</span>
        <input
          type="date"
          value={form.workDate}
          min={today}
          onChange={event =>
            setForm(current => ({
              ...current,
              workDate: event.target.value,
            }))
          }
          className="w-full border border-slate-300 bg-white px-3 py-2"
          required
        />
      </label>

      <label className="space-y-1 text-sm">
        <span className="font-medium text-slate-700">Statut</span>
        <select
          value={form.status}
          onChange={event =>
            setForm(current => ({
              ...current,
              status: event.target.value as FormState["status"],
            }))
          }
          className="w-full border border-slate-300 bg-white px-3 py-2"
        >
          <option value="draft">Brouillon</option>
          <option value="published">Publie</option>
        </select>
      </label>

      <div className="md:col-span-3 flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creation..." : "Creer le planning"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/work-schedules/list")}
        >
          Voir la liste
        </Button>
      </div>
    </form>
  );
}
