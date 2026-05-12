"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarRange } from "lucide-react";
import { DayPicker, type DateRange } from "react-day-picker";
import {
  ANALYTICS_PRESETS,
  buildRangeSearchParams,
  type AnalyticsPreset,
} from "@/lib/analytics-range";
import { Button } from "@/components/ui/button";

type AnalyticsRangeFilterProps = {
  range: {
    description: string;
    from: string;
    preset: string;
    to: string;
  };
};

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function toDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function AnalyticsRangeFilter({ range }: AnalyticsRangeFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange | undefined>({
    from: parseDateOnly(range.from),
    to: parseDateOnly(range.to),
  });

  const selectedPreset = range.preset as AnalyticsPreset;
  const hasCompleteDraft = Boolean(draftRange?.from && draftRange?.to);
  const draftLabel = useMemo(() => {
    if (!draftRange?.from || !draftRange?.to) {
      return "Choisissez un intervalle personnalisé";
    }

    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).formatRange(draftRange.from, draftRange.to);
  }, [draftRange]);

  function replaceRange(next: { from?: string; preset?: string; to?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("preset");
    params.delete("from");
    params.delete("to");

    const nextParams = buildRangeSearchParams(next);

    nextParams.forEach((value, key) => {
      params.set(key, value);
    });

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  function onPresetSelect(preset: Exclude<AnalyticsPreset, "custom">) {
    setDraftRange(undefined);
    setOpen(false);
    replaceRange({ preset });
  }

  function onApplyCustomRange() {
    if (!draftRange?.from || !draftRange.to) {
      return;
    }

    replaceRange({
      preset: "custom",
      from: toDateOnly(draftRange.from),
      to: toDateOnly(draftRange.to),
    });
    setOpen(false);
  }

  return (
    <div className="space-y-3  border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
            Intervalle d'analyse
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">
            {range.description}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Toutes les cartes et tous les graphiques suivent cette période.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {ANALYTICS_PRESETS.map(preset => (
            <Button
              key={preset.value}
              type="button"
              size="sm"
              variant={selectedPreset === preset.value ? "default" : "outline"}
              onClick={() => onPresetSelect(preset.value)}
            >
              {preset.label}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant={
              selectedPreset === "custom" || open ? "default" : "outline"
            }
            onClick={() => setOpen(current => !current)}
          >
            <CalendarRange className="size-4" />
            Personnaliser
          </Button>
        </div>
      </div>

      {open ? (
        <div className="grid gap-4  border border-slate-200 bg-white p-4 xl:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="overflow-x-auto">
            <DayPicker
              mode="range"
              selected={draftRange}
              onSelect={setDraftRange}
              numberOfMonths={2}
              weekStartsOn={1}
              showOutsideDays
              className="analytics-day-picker"
            />
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Intervalle personnalisé
              </p>
              <p className="mt-1 text-sm font-medium text-slate-900">
                {draftLabel}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="button"
                onClick={onApplyCustomRange}
                disabled={!hasCompleteDraft}
              >
                Appliquer l'intervalle
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDraftRange({
                    from: parseDateOnly(range.from),
                    to: parseDateOnly(range.to),
                  });
                  setOpen(false);
                }}
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
