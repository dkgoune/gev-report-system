"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Service } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getServiceOptions, serviceLabel } from "@/lib/services";
import { createDefaultDailyReportState, dailyReportFields } from "./constants";
import type { DailyReportFormState } from "./types";

type DailyReportFormProps = {
  initialDate: string;
  initialService: Service;
  isAdmin: boolean;
};

export function DailyReportForm({
  initialDate,
  initialService,
  isAdmin,
}: DailyReportFormProps) {
  const router = useRouter();
  const defaultFormState = useMemo(
    () => createDefaultDailyReportState(initialDate, initialService),
    [initialDate, initialService],
  );
  const [formState, setFormState] =
    useState<DailyReportFormState>(defaultFormState);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const response = await fetch("/api/daily-reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formState),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;

    if (!response.ok) {
      toast.error(
        payload?.error || "Impossible d'enregistrer le rapport général.",
      );
      setSubmitting(false);
      return;
    }

    toast.success("Rapport enregistré.");
    setSubmitting(false);
    router.push(
      `/reports/general/new?date=${formState.reportDate}&service=${formState.service}`,
    );

    setFormState(defaultFormState);
    setSubmitting(false);
  }

  function onReset() {
    setFormState(defaultFormState);
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex justify-between items-start mb-6">
        <div className="mb-4 space-y-1">
          <h3 className="text-lg font-semibold text-slate-900">
            Rapport général
          </h3>
          <p className="text-sm text-slate-600">
            Saisissez un nouveau rapport général pour le service et la journée
            sélectionnés.
          </p>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/reports/general">Voir la liste</Link>
          </Button>
        </div>
      </div>

      <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Date</span>
          <input
            type="date"
            value={formState.reportDate}
            onChange={(event) =>
              setFormState((current) => ({
                ...current,
                reportDate: event.target.value,
              }))
            }
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2"
            required
          />
        </label>

        <div className="space-y-1 text-sm">
          <span className="font-medium text-slate-700">Service</span>
          {isAdmin ? (
            <Select
              value={formState.service}
              onValueChange={(value) =>
                setFormState((current) => ({
                  ...current,
                  service: value as Service,
                }))
              }
            >
              <SelectTrigger className="w-full rounded-md bg-white text-sm">
                <SelectValue placeholder="Choisir un service" />
              </SelectTrigger>
              <SelectContent>
                {getServiceOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
              {serviceLabel(formState.service)}
            </div>
          )}
        </div>

        {dailyReportFields.map((field) => (
          <label key={field.key} className="space-y-1 text-sm md:col-span-2">
            <span className="font-medium text-slate-700">{field.label}</span>
            <textarea
              value={formState[field.key]}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  [field.key]: event.target.value,
                }))
              }
              className="min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
              placeholder={field.placeholder}
            />
          </label>
        ))}

        <div className="flex flex-wrap gap-2 md:col-span-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Enregistrement..." : "Enregistrer le rapport"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            disabled={submitting}
          >
            Réinitialiser
          </Button>
        </div>
      </form>
    </section>
  );
}
